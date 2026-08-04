import Conversation from "../models/conversation.model.js";
import Message from "../models/messages.model.js";

export const getMessages = async (req, res) => {
    try {
        const { conversationId } = req.params;
        const { before } = req.query;
        const query = { conversation: conversationId };
        if (before) {
            query.createdAt = {
                $lt: new Date(before)
            }
        }

        const messages = await Message.find(query).sort({ createdAt: -1 }).limit(50);
        return res.status(200).json({
            success: true,
            messages : messages.reverse()
        });
    } catch (error) {
        return res.status(500).json({
            message: "Error in message controller"
        });
    }
}

export const getConversation = async (req, res) => {
    try {
        const userId = req.user.id;
        const conversations = await Conversation.find({ "participants.user": userId })
            .populate("participants.user", "username email avatar")
            .sort({ updatedAt: -1 });
        res.status(200).json({ success: true, conversations });
    } catch (error) {
        res.satus(500).json({ success: false, message : "Backend cannot get conversations" });
    }
}