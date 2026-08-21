import Conversation from "../models/conversation.model.js";
import Message from "../models/messages.model.js";
import User from "../models/user.model.js";
import Notification from "../models/notification.model.js";
import logger from "../utils/logger.js";
import { getIO, getSockets } from "../socket/socket.js";
import cacheService from "./cache.service.js";

export const sendMessageService = async ({ userId, conversationId, content, attachments = [] }) => {
    const hasText = content && content.trim();
    const hasAttachment = attachments && attachments.length > 0;

    if (!hasText && !hasAttachment) {
        const error = new Error("Message content or attachment is required");
        error.statusCode = 400;
        throw error;
    }

    const conversation = await Conversation.findOne({
        _id: conversationId,
        "participants.user": userId,
    });
    if (!conversation) {
        const error = new Error("Conversation not found or access denied");
        error.statusCode = 404;
        throw error;
    }

    const recipients = conversation.participants
        .map((p) => p.user.toString())
        .filter((id) => id !== userId.toString());

    const recipientIsOnline = recipients.some((id) => getSockets(id).length > 0);

    const message = await Message.create({
        conversation: conversationId,
        sender: userId,
        content: content ? content.trim() : "",
        attachments,
        status: recipientIsOnline ? "delivered" : "sent",
    });

    let previewText = content ? content.trim() : "";
    if (!previewText && attachments.length > 0) {
        const type = attachments[0].fileType || "";
        if (type.startsWith("image/")) previewText = "📷 Photo";
        else if (type.startsWith("video/")) previewText = "🎥 Video";
        else if (type === "application/pdf") previewText = "📄 PDF";
        else previewText = "📎 Attachment";
    }

    await Conversation.updateOne(
        { _id: conversationId },
        { $set: { lastMessage: { text: previewText, sender: userId, at: new Date() } } }
    );

    const populated = await message.populate([
        { path: "sender", select: "username email avatar" },
        { path: "reactions.user", select: "username email avatar" },
    ]);

    const io = getIO();
    if (io) {
       
        const participantRooms = conversation.participants.map(
            (p) => `user_${(p.user?._id || p.user).toString()}`
        );

        io.to(`conv_${conversationId}`).to(participantRooms).emit("message:new", populated);

        for (const recipientId of recipients) {
            const isOnline = getSockets(recipientId).length > 0;

            io.to(`user_${recipientId}`).emit("conversation:updated", {
                conversationId,
                lastMessage: { text: previewText, sender: userId, at: new Date() },
            });

            try {
                const notifDoc = await Notification.create({
                    recipient: recipientId,
                    sender: userId,
                    type: "message",
                    title: `New message from ${populated.sender?.username || "Someone"}`,
                    message: previewText,
                    conversation: conversationId,
                    isRead: false,
                });
                const populatedNotif = await notifDoc.populate("sender", "username email avatar status");

                io.to(`user_${recipientId}`).emit("notification:new", populatedNotif);
            } catch (e) {
                logger.error("Failed to create notification:", e);
            }

            // if (!isOnline && process.env.ENABLE_OFFLINE_EMAIL === "true") {
            //     User.findById(recipientId)
            //         .select("username email")
            //         .then((recipientUser) => {
            //             if (recipientUser && recipientUser.email) {
            //                 sendOfflineMessageEmail({
            //                     to: recipientUser.email,
            //                     recipientName: recipientUser.username || recipientUser.email,
            //                     senderName: populated.sender?.username || "A contact",
            //                     messagePreview: previewText,
            //                     conversationId,
            //                 }).catch((e) => logger.error("Offline email error:", e));
            //             }
            //         })
            //         .catch((e) => logger.error("Recipient lookup error for offline email:", e));
            // }
        }
    }
    try {
        await cacheService.delPattern(`conversation:messages:${conversationId}*`);
        for (const p of conversation.participants) {
            const pId = (p.user?._id || p.user).toString();
            await cacheService.del(`user:conversations:${pId}`);
        }
    } catch (cacheErr) {
        logger.warn(`Cache invalidation notice: ${cacheErr.message}`);
    }

    return populated;
};

export const getMessagesService = async (conversationId, before, userId) => {
    const pageSize = 50;

    let conversation = null;
    let minDate = null;

    if (userId) {
        conversation = await Conversation.findById(conversationId).select("type participants");
        if (conversation && conversation.type === "group") {
            const participant = conversation.participants.find(
                (p) => (p.user?._id || p.user).toString() === userId.toString()
            );
            if (participant && participant.joinedAt) {
                minDate = participant.joinedAt;
            }
        }
    }

    const cacheKey = minDate
        ? `conversation:messages:${conversationId}:${new Date(minDate).getTime()}`
        : `conversation:messages:${conversationId}`;

    if (!before) {
        const cached = await cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }
    }

    const query = { conversation: conversationId };
    if (minDate) {
        query.createdAt = { $gte: minDate };
    }

    if (before) {
        query.createdAt = {
            ...(query.createdAt || {}),
            $lt: new Date(before),
        };
    }

    const messages = await Message.find(query)
        .populate("sender", "username email avatar")
        .populate("reactions.user", "username email avatar")
        .sort({ createdAt: -1 })
        .limit(pageSize + 1);

    const hasMore = messages.length > pageSize;
    const pagedMessages = messages.slice(0, pageSize).reverse();

    if (!before && userId && pagedMessages.length > 0) {
        try {
            const unreadMsgs = await Message.find({
                conversation: conversationId,
                sender: { $ne: userId },
                "readBy.user": { $ne: userId }
            });
            if (unreadMsgs.length > 0) {
                const lastMsgId = unreadMsgs[unreadMsgs.length - 1]._id;
                await Message.updateMany(
                    { _id: { $in: unreadMsgs.map((m) => m._id) } },
                    { $addToSet: { readBy: { user: userId, readAt: new Date() } } }
                );
                await Conversation.updateOne(
                    { _id: conversationId, "participants.user": userId },
                    { $set: { "participants.$.lastReadMessageId": lastMsgId } }
                );
                await cacheService.del(`user:conversations:${userId}`);
            }
        } catch (e) {
            // Ignore background read sync error
        }
    }

    const result = {
        messages: pagedMessages,
        hasMore,
    };

    if (!before) {
        await cacheService.set(cacheKey, result, 300);
    }

    return result;
};

export const getConversationsService = async (userId) => {
    const cacheKey = `user:conversations:${userId}`;
    const cachedConvs = await cacheService.get(cacheKey);

    if (cachedConvs) {
        const validCached = [];
        for (const conv of cachedConvs) {
            if (conv.participants) {
                conv.participants = conv.participants.filter(
                    (p) => p.user && (p.user._id || p.user.id || p.user)
                );
            }
            if (conv.type === "private") {
                const other = conv.participants?.find(
                    (p) => (p.user?._id || p.user?.id || p.user)?.toString() !== userId.toString()
                );
                if (!other || !other.user) continue;
            } else if (conv.type === "group") {
                if (!conv.participants || conv.participants.length <= 1) continue;
            }

            if (conv.participants) {
                for (const p of conv.participants) {
                    if (p.user && (p.user._id || p.user.id)) {
                        const pUserId = (p.user._id || p.user.id).toString();
                        const isOnline = getSockets(pUserId).length > 0;
                        p.user.status = isOnline ? "online" : "offline";
                    }
                }
            }
            validCached.push(conv);
        }
        return validCached;
    }

    const conversations = await Conversation.find({ "participants.user": userId })
        .populate("participants.user", "username email avatar status phone")
        .sort({ updatedAt: -1 })
        .lean();

    const validConversations = [];

    for (const conv of conversations) {
        // Filter out participants whose user documents were deleted from MongoDB
        if (conv.participants) {
            conv.participants = conv.participants.filter(
                (p) => p.user && (p.user._id || p.user.id || p.user)
            );
        }

        // Group auto-downscale & disband checks
        if (conv.type === "group") {
            const memberCount = conv.participants?.length || 0;
            if (memberCount <= 1) {
                // Disband and delete orphaned group
                Conversation.findByIdAndDelete(conv._id).catch(() => {});
                continue;
            }
            if (memberCount === 2) {
                // Convert group with 2 members to 1-to-1 private chat
                const formerName = conv.name || conv.formerGroupName || "Group";
                Conversation.updateOne(
                    { _id: conv._id },
                    { $set: { type: "private", isConvertedFromGroup: true, formerGroupName: formerName, name: null, avatarUrl: null } }
                ).catch(() => {});
                conv.type = "private";
                conv.isConvertedFromGroup = true;
                conv.formerGroupName = formerName;
                conv.name = undefined;
                conv.avatarUrl = undefined;
            }
        }

        // Private conversation check: verify other participant still exists
        if (conv.type === "private") {
            const other = conv.participants?.find(
                (p) => (p.user._id || p.user.id || p.user).toString() !== userId.toString()
            );
            if (!other || !other.user) {
                // Other user was deleted from DB; do not show orphaned private conversation
                continue;
            }
        }

        for (const p of conv.participants) {
            if (p.user && (p.user._id || p.user.id)) {
                const pUserId = (p.user._id || p.user.id).toString();
                const isOnline = getSockets(pUserId).length > 0;
                p.user.status = isOnline ? "online" : "offline";
            }
        }

        const participant = conv.participants?.find(
            (p) => (p.user?._id || p.user)?.toString() === userId.toString()
        );

        if (conv.type === "group") {
            if (participant && participant.joinedAt) {
                const latestMessage = await Message.findOne({
                    conversation: conv._id,
                    createdAt: { $gte: participant.joinedAt },
                })
                    .sort({ createdAt: -1 })
                    .populate("sender", "username email avatar");

                if (latestMessage) {
                    let previewText = latestMessage.content || "";
                    if (!previewText && latestMessage.attachments?.length > 0) {
                        const type = latestMessage.attachments[0].fileType || "";
                        if (type.startsWith("image/")) previewText = "📷 Photo";
                        else if (type.startsWith("video/")) previewText = "🎥 Video";
                        else if (type === "application/pdf") previewText = "📄 PDF";
                        else previewText = "📎 Attachment";
                    }
                    conv.lastMessage = {
                        text: previewText,
                        sender: latestMessage.sender?._id || latestMessage.sender,
                        at: latestMessage.createdAt,
                    };
                } else {
                    conv.lastMessage = {
                        text: null,
                        sender: null,
                        at: null,
                    };
                }
            }
        } else if (conv.lastMessage && !conv.lastMessage.at) {
            conv.lastMessage.at = conv.updatedAt || conv.createdAt;
        }

        const unreadQuery = {
            conversation: conv._id,
            sender: { $ne: userId },
            "readBy.user": { $ne: userId },
        };

        if (conv.type === "group" && participant?.joinedAt) {
            unreadQuery.createdAt = { $gte: participant.joinedAt };
        }

        conv.unreadCount = await Message.countDocuments(unreadQuery);
        validConversations.push(conv);
    }

    await cacheService.set(cacheKey, validConversations, 300);

    return validConversations;
};