import { addSocket, removeSocket, getSockets, setIO } from "./socket.js";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Message from "../models/messages.model.js";
import Conversation from "../models/conversation.model.js";
import logger from "../utils/logger.js";

function init(io) {
    setIO(io);
    io.use((socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers.cookie || "");
        const token = socket.handshake.auth?.token || cookies.token;

        if (!token) {
            return next(new Error("Unauthorized"));
        }
        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user?.id;
        if (!userId) return socket.disconnect(true);

        socket.join(`user_${userId}`);
        addSocket(userId, socket.id);

        socket.on("disconnect", () => {
            removeSocket(userId, socket.id);
        });

        socket.on("conversation:join", async (conversationId) => {
            try {
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    "participants.user": userId,
                });
                if (!conversation) return;
                socket.join(`conv_${conversationId}`);

                const participant = conversation.participants.find(
                    (p) => (p.user?._id || p.user).toString() === userId.toString()
                );
                const minDate = conversation.type === "group" ? participant?.joinedAt : null;

                const filter = {
                    conversation: conversationId,
                    sender: { $ne: userId },
                    status: "sent",
                };
                if (minDate) filter.createdAt = { $gte: minDate };

                const undelivered = await Message.find(filter).select("_id");

                if (undelivered.length) {
                    await Message.updateMany(
                        { _id: { $in: undelivered.map((m) => m._id) } },
                        { $set: { status: "delivered" } }
                    );
                    io.to(`conv_${conversationId}`).emit("message:statusUpdated", {
                        messageIds: undelivered.map((m) => m._id.toString()),
                        status: "delivered",
                    });
                }
            } catch (err) {
                logger.error("conversation:join error:", { error: err.message });
            }
        });

        socket.on("message:send", async ({ conversationId, content, attachments = [] }) => {
            try {
                const hasText = content && content.trim();
                const hasAttachment = attachments.length > 0;

                if (!hasText && !hasAttachment) {
                    return;
                }

                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    "participants.user": userId,
                });
                if (!conversation) return;

                const recipients = conversation.participants
                    .map((p) => p.user.toString())
                    .filter((id) => id !== userId);

                const recipientIsOnline = recipients.some((id) => getSockets(id).length > 0);

                const message = await Message.create({
                    conversation: conversationId,
                    sender: userId,
                    content: content.trim(),
                    attachments,
                    status: recipientIsOnline ? "delivered" : "sent",
                });

                let previewText = content.trim();
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

                socket.emit("message:statusUpdated", {
                    messageId: populated._id.toString(),
                    status: populated.status,
                });
                io.to(`conv_${conversationId}`).emit("message:new", populated);

                // notify offline/not-in-room recipients so their sidebar can update
                recipients.forEach((recipientId) => {
                    io.to(`user_${recipientId}`).emit("conversation:updated", {
                        conversationId,
                        lastMessage: { text: previewText, sender: userId, at: new Date() },
                    });
                });
            } catch (err) {
                logger.error("message:send error:", { error: err.message });
            }
        });

        socket.on("message:react", async ({ conversationId, messageId, reactionType }) => {
            try {
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    "participants.user": userId,
                });
                if (!conversation) return;

                const message = await Message.findOne({
                    _id: messageId,
                    conversation: conversationId,
                });
                if (!message) return;

                const existing = message.reactions.find(
                    (reaction) => (reaction.user._id || reaction.user).toString() === userId
                );

                if (existing) {
                    message.reactions = message.reactions.filter(
                        (reaction) => (reaction.user._id || reaction.user).toString() !== userId
                    );
                } else {
                    message.reactions.push({
                        user: userId,
                        type: reactionType || "like",
                    });
                }

                await message.save();
                const populated = await message.populate([
                    { path: "sender", select: "username email avatar" },
                    { path: "reactions.user", select: "username email avatar" },
                ]);
                io.to(`conv_${conversationId}`).emit("message:reactionUpdated", populated);
            } catch (err) {
                logger.error("message:react error:", { error: err.message });
            }
        });

        socket.on("typing", ({ conversationId, isTyping }) => {
            socket.to(`conv_${conversationId}`).emit("typing", { userId, isTyping });
        });

        socket.on("message:read", async ({ conversationId, lastMessageId }) => {
            try {
                const conversation = await Conversation.findById(conversationId);
                if (!conversation) return;

                await Conversation.updateOne(
                    { _id: conversationId, "participants.user": userId },
                    { $set: { "participants.$.lastReadMessageId": lastMessageId } }
                );

                const upperBound = mongoose.Types.ObjectId.isValid(lastMessageId)
                    ? new mongoose.Types.ObjectId(lastMessageId)
                    : null;

                if (!upperBound) return;

                const participant = conversation.participants.find(
                    (p) => (p.user?._id || p.user).toString() === userId.toString()
                );
                const minDate = conversation.type === "group" ? participant?.joinedAt : null;

                const msgFilter = {
                    conversation: conversationId,
                    sender: { $ne: userId },
                    _id: { $lte: upperBound },
                };
                if (minDate) msgFilter.createdAt = { $gte: minDate };

                const messagesToUpdate = await Message.find(msgFilter);

                if (!messagesToUpdate.length) return;

                const readMessageIds = [];
                const deliveredMessageIds = [];

                for (const msg of messagesToUpdate) {
                    const alreadyRead = msg.readBy.some(
                        (r) => r.user.toString() === userId.toString()
                    );
                    if (!alreadyRead) {
                        msg.readBy.push({ user: userId, readAt: new Date() });
                    }

                    const senderIdStr = msg.sender.toString();
                    const recipientIds = conversation.participants
                        .map((p) => (p.user._id ? p.user._id.toString() : p.user.toString()))
                        .filter((id) => id !== senderIdStr);

                    const readUserIds = new Set(msg.readBy.map((r) => r.user.toString()));
                    const allRecipientsRead =
                        recipientIds.length > 0 &&
                        recipientIds.every((id) => readUserIds.has(id));

                    const oldStatus = msg.status;
                    if (allRecipientsRead) {
                        msg.status = "read";
                    } else {
                        msg.status = "delivered";
                    }

                    await msg.save();

                    if (msg.status === "read") {
                        readMessageIds.push(msg._id.toString());
                    } else if (msg.status === "delivered" && oldStatus !== "delivered") {
                        deliveredMessageIds.push(msg._id.toString());
                    }
                }

                if (readMessageIds.length) {
                    io.to(`conv_${conversationId}`).emit("message:statusUpdated", {
                        messageIds: readMessageIds,
                        status: "read",
                    });
                }
                if (deliveredMessageIds.length) {
                    io.to(`conv_${conversationId}`).emit("message:statusUpdated", {
                        messageIds: deliveredMessageIds,
                        status: "delivered",
                    });
                }

                socket.to(`conv_${conversationId}`).emit("message:readReceipt", {
                    userId,
                    lastMessageId,
                });
            } catch (err) {
                logger.error("message:read error:", { error: err.message });
            }
        });
    });
}

export { init };