import Conversation from "../models/conversation.model.js";
import Message from "../models/messages.model.js";

export const getMessagesService = async (conversationId, before) => {
    const pageSize = 50;
    const query = { conversation: conversationId };

    if (before) {
        query.createdAt = {
            $lt: new Date(before),
        };
    }

    const messages = await Message.find(query)
        .populate("sender", "username email avatar")
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
        .sort({ updatedAt: -1 });

    return conversations;
};
