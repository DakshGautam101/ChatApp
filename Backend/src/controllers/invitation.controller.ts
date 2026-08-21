import type { NextFunction, Request, Response } from "express";
import {
    sendInvitationService,
    changeInvitationStatusService,
    getUserInvitationsService,
} from "../services/invitation.service.js";
import { sendError, sendSuccess } from "../utils/response.js";

export const sendInvitation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.user) {
            return sendError(res, 401, "Unauthorized");
        }
        const senderId = req.user.id;
        const receiverId = req.params.id;

        const { invitation, statusCode } = await sendInvitationService(senderId, receiverId);

        return sendSuccess(res, statusCode, { invitation }, "Invitation sent successfully");
    } catch (error: any) {
        if (error.status) {
            return sendError(res, error.status, error.message);
        }
        next(error);
    }
};

export const changeStatus = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const invitationId = req.params.id;
        if (!req.user) {
            return sendError(res, 401, "Unauthorized");
        }
        const receiverId = req.user.id;
        const statusInput = req.query.invitationStatus;

        const invitation = await changeInvitationStatusService(invitationId, receiverId, statusInput);

        return sendSuccess(res, 200, { invitation }, `Invitation ${invitation.status}`);
    } catch (error: any) {
        if (error.status) {
            return sendError(res, error.status, error.message);
        }
        next(error);
    }
};

export const getInvitation = async (req: Request, res: Response, next: NextFunction) => {
    try {

        if (!req.user) {
            return sendError(res, 401, "Unauthorized");
        }

        const userId = req.user.id;

        const { received, sent } = await getUserInvitationsService(userId);

        return sendSuccess(res, 200, { received, sent });
    } catch (error) {
        next(error);
    }
};