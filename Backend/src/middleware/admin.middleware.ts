import type { NextFunction, Request, Response } from "express";
import Conversation from "../models/conversation.model.js";
import { sendError } from "../utils/response.js";

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return sendError(res, 401, "Unauthorized");
        }
        const conversationId = req.params.groupId || req.body.groupId || req.body.conversationId;
        if (!conversationId) {
            return sendError(res, 400, "Group conversation ID is required");
        }
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return sendError(res, 404, "Conversation not found");
        if (conversation.type !== "group") return sendError(res, 400, "Conversation is not a group");
        const adminParticipant = conversation.participants.find(
            (participant) => participant.user.toString() === userId
        );
        if (!adminParticipant || adminParticipant.role !== "admin") {
            return sendError(res, 403, "You are not an admin of this group");
        }
        next();
    } catch (error) {
        next(error);
    }
};