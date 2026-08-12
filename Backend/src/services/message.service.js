import Conversation from "../models/conversation.model.js";
import Message from "../models/messages.model.js";

export const getMessagesService = async (conversationId, before, userId) => {
    const pageSize = 50;
    const query = { conversation: conversationId };

    if (userId) {
        const conversation = await Conversation.findById(conversationId).select("type participants");
        if (conversation && conversation.type === "group") {
            const participant = conversation.participants.find(
                (p) => (p.user?._id || p.user).toString() === userId.toString()
            );
            if (participant && participant.joinedAt) {
                query.createdAt = { $gte: participant.joinedAt };
            }
        }
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

    return {
        messages: pagedMessages,
        hasMore,
    };
};

export const getConversationsService = async (userId) => {
    const conversations = await Conversation.find({ "participants.user": userId })
        .populate("participants.user", "username email avatar")
        .sort({ updatedAt: -1 })
        .lean();

    for (const conv of conversations) {
        if (conv.type === "group") {
            const participant = conv.participants.find(
                (p) => (p.user?._id || p.user)?.toString() === userId.toString()
            );
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
        }
    }

    return conversations;
};
