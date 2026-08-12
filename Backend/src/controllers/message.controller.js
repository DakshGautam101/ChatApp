import { getMessagesService, getConversationsService } from "../services/message.service.js";
import { sendSuccess } from "../utils/response.js";

export const getMessages = async (req, res, next) => {
    try {
        const { conversationId } = req.params;
        const { before } = req.query;
        const userId = req.user.id;

        const result = await getMessagesService(conversationId, before, userId);

        return sendSuccess(res, 200, result);
    } catch (error) {
        next(error);
    }
};

export const getConversation = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const conversations = await getConversationsService(userId);

        return sendSuccess(res, 200, { conversations });
    } catch (error) {
        next(error);
    }
};