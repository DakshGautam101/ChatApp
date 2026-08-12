import { sendSuccess } from "../utils/response.js";
import {
    createGroupService,
    sendGroupInvitationService,
    getPendingGroupInvitationsService,
    respondToGroupInvitationService,
    searchUsersForGroupService,
    updateGroupAvatarService,
    updateMemberRoleService,
    leaveGroupService,
    kickMemberService,
} from "../services/group.service.js";
import { getIO } from "../socket/socket.js";
import logger from "../utils/logger.js";

export const createGroup = async (req, res, next) => {
    try {
        const { name, members } = req.body;
        const creatorId = req.user.id;

        const conversation = await createGroupService({ name, members, creatorId });

        const io = getIO();
        if (io) {
            conversation.participants.forEach((p) => {
                const userIdStr = p.user._id ? p.user._id.toString() : p.user.toString();
                io.to(`user_${userIdStr}`).emit("conversation:new", conversation);
                io.to(`user_${userIdStr}`).emit("group:created", conversation);
            });
        }

        return sendSuccess(res, 201, conversation, "Group created successfully");
    } catch (error) {
        logger.error("createGroup error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const sendGroupInvitation = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { receiverId, query } = req.body;
        const senderId = req.user.id;

        const invitation = await sendGroupInvitationService({
            groupId,
            senderId,
            receiverId,
            query,
        });

        const io = getIO();
        if (io) {
            const receiverIdStr = invitation.receiver._id
                ? invitation.receiver._id.toString()
                : invitation.receiver.toString();
            io.to(`user_${receiverIdStr}`).emit("group:invitation", invitation);
            io.to(`user_${receiverIdStr}`).emit("invitation:created", invitation);
        }

        return sendSuccess(res, 200, invitation, "Group invitation sent successfully");
    } catch (error) {
        logger.error("sendGroupInvitation error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const getPendingGroupInvitations = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const invitations = await getPendingGroupInvitationsService(userId);
        return sendSuccess(res, 200, { invitations });
    } catch (error) {
        logger.error("getPendingGroupInvitations error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const respondToGroupInvitation = async (req, res, next) => {
    try {
        const { invitationId } = req.params;
        const { action } = req.body;
        const userId = req.user.id;

        const { invitation, conversation } = await respondToGroupInvitationService({
            invitationId,
            userId,
            action,
        });

        const io = getIO();
        if (io) {
            if (action === "accepted" && conversation) {
                io.to(`user_${userId}`).emit("conversation:new", conversation);
                io.to(`conv_${conversation._id}`).emit("group:memberJoined", {
                    conversation,
                    userId,
                });
            }

            const senderIdStr = invitation.sender._id
                ? invitation.sender._id.toString()
                : invitation.sender.toString();
            io.to(`user_${senderIdStr}`).emit("group:invitationStatusChanged", invitation);
        }

        return sendSuccess(
            res,
            200,
            { invitation, conversation },
            `Group invitation ${action} successfully`
        );
    } catch (error) {
        logger.error("respondToGroupInvitation error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const searchUsersForGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { query } = req.query;
        const currentUserId = req.user.id;

        const users = await searchUsersForGroupService({
            groupId,
            query,
            currentUserId,
        });

        return sendSuccess(res, 200, { users });
    } catch (error) {
        logger.error("searchUsersForGroup error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const updateGroupAvatar = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const { avatarUrl } = req.body;
        const requesterId = req.user.id;

        const conversation = await updateGroupAvatarService({ groupId, avatarUrl, requesterId });

        const io = getIO();
        if (io) {
            io.to(`conv_${groupId}`).emit("group:updated", conversation);
        }

        return sendSuccess(res, 200, { conversation }, "Group avatar updated successfully");
    } catch (error) {
        logger.error("updateGroupAvatar error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const updateMemberRole = async (req, res, next) => {
    try {
        const { groupId, targetUserId } = req.params;
        const { newRole } = req.body;
        const requesterId = req.user.id;

        const conversation = await updateMemberRoleService({ groupId, targetUserId, newRole, requesterId });

        const io = getIO();
        if (io) {
            io.to(`conv_${groupId}`).emit("group:updated", conversation);
        }

        return sendSuccess(res, 200, { conversation }, `Member role updated to ${newRole}`);
    } catch (error) {
        logger.error("updateMemberRole error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const leaveGroup = async (req, res, next) => {
    try {
        const { groupId } = req.params;
        const userId = req.user.id;

        const conversation = await leaveGroupService({ groupId, userId });

        const io = getIO();
        if (io) {
            io.to(`user_${userId}`).emit("conversation:removed", { conversationId: groupId });
            if (conversation) {
                io.to(`conv_${groupId}`).emit("group:updated", conversation);
            }
        }

        return sendSuccess(res, 200, {}, "Left group successfully");
    } catch (error) {
        logger.error("leaveGroup error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const kickMember = async (req, res, next) => {
    try {
        const { groupId, targetUserId } = req.params;
        const requesterId = req.user.id;

        const conversation = await kickMemberService({ groupId, targetUserId, requesterId });

        const io = getIO();
        if (io) {
            io.to(`user_${targetUserId}`).emit("conversation:removed", { conversationId: groupId });
            if (conversation) {
                io.to(`conv_${groupId}`).emit("group:updated", conversation);
            }
        }

        return sendSuccess(res, 200, { conversation }, "Member removed from group");
    } catch (error) {
        logger.error("kickMember error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};