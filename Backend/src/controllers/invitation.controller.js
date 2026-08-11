import {
    sendInvitationService,
    changeInvitationStatusService,
    getUserInvitationsService,
} from "../services/invitation.service.js";
import { sendError, sendSuccess } from "../utils/response.js";

export const sendInvitation = async (req, res, next) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.id;

        const { invitation, statusCode } = await sendInvitationService(senderId, receiverId);

        return sendSuccess(res, statusCode, { invitation }, "Invitation sent successfully");
    } catch (error) {
        if (error.status) {
            return sendError(res, error.status, error.message);
        }
        next(error);
    }
};

export const changeStatus = async (req, res, next) => {
    try {
        const invitationId = req.params.id;
        const receiverId = req.user.id;
        const statusInput = req.query.invitationStatus;

        const invitation = await changeInvitationStatusService(invitationId, receiverId, statusInput);

        return sendSuccess(res, 200, { invitation }, `Invitation ${invitation.status}`);
    } catch (error) {
        if (error.status) {
            return sendError(res, error.status, error.message);
        }
        next(error);
    }
};

export const getInvitation = async (req, res, next) => {
    try {
        const userId = req.user.id;

        const { received, sent } = await getUserInvitationsService(userId);

        return sendSuccess(res, 200, { received, sent });
    } catch (error) {
        next(error);
    }
};