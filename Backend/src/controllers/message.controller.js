import Conversation from "../models/conversation.model.js";
import Message from "../models/messages.model.js";

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { before } = req.query;
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

        return res.status(200).json({
            success: true,
            messages: pagedMessages,
            hasMore,
        });
    } catch (error) {
        console.error("Error in message controller", error);
        return res.status(500).json({
            success: false,
            message: "Error in message controller",
        });
    }
};

export const getConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.find({ "participants.user": userId })
            .populate("participants.user", "username email avatar")
            .sort({ updatedAt: -1 });
        return res.status(200).json({ success: true, conversations });
    } catch (error) {
        return res.satus(500).json({ success: false, message : "Backend cannot get conversations" });
    }
}