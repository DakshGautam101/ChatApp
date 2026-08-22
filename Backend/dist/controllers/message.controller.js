import { getMessagesService, getConversationsService, sendMessageService } from "../services/message.service.js";
import { sendError, sendSuccess } from "../utils/response.js";
export const sendMessage = async (req, res, next) => {
    try {
        if (!req.user) {
            return sendError(res, 401, "Unauthorized");
        }
        const userId = req.user.id;
        const { conversationId, content, attachments } = req.body;
        const message = await sendMessageService({
            userId,
            conversationId,
            content,
            attachments,
        });
        return sendSuccess(res, 201, { message }, "Message sent successfully");
    }
    catch (error) {
        next(error);
    }
};
export const getMessages = async (req, res, next) => {
    try {
        const conversationId = req.params.conversationId;
        const before = req.query.before;
        if (!req.user) {
            return sendError(res, 401, "Unauthorized");
        }
        const userId = req.user.id;
        const result = await getMessagesService(conversationId, before, userId);
        return sendSuccess(res, 200, result);
    }
    catch (error) {
        next(error);
    }
};
export const getConversation = async (req, res, next) => {
    try {
        if (!req.user) {
            return sendError(res, 401, "Unauthorized");
        }
        const userId = req.user.id;
        const conversations = await getConversationsService(userId);
        return sendSuccess(res, 200, { conversations });
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=message.controller.js.map