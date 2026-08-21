import { sendError, sendSuccess } from "../utils/response.js";
import Message from "../models/messages.model.js";
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
import type { NextFunction, Request, Response } from "express";



export const createGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { name, members } = req.body;
        const creatorId = req.user?.id;
        if (!creatorId) return sendError(res, 401, "Unauthorized");

        const conversation = await createGroupService({ name, members, creatorId });

        const io = getIO();
        if (io) {
            if (conversation && conversation.participants) {
                conversation.participants.forEach((p: any) => {
                    const userIdStr = (p.user?._id || p.user)?.toString();
                    if (userIdStr) {
                        io.to(`user_${userIdStr}`).emit("conversation:new", conversation);
                        io.to(`user_${userIdStr}`).emit("group:created", conversation);
                    }
                });
            }
        } else {
            logger.error("createGroup error:", { error: "IO not found" });
        }

        return sendSuccess(res, 201, conversation, "Group created successfully");
    } catch (error: any) {
        logger.error("createGroup error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const sendGroupInvitation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;
        const { receiverId, query } = req.body;
        const senderId = req.user?.id;
        if (!senderId) return sendError(res, 401, "Unauthorized");
        const stringGroupId : string = String(groupId);

        const invitation = await sendGroupInvitationService({
            stringGroupId,
            senderId,
            receiverId,
            query,
        });

        const io = getIO();
        if (io) {
            if (invitation != null) {
                const receiverIdStr = invitation.receiver._id
                    ? invitation.receiver._id.toString()
                    : invitation.receiver.toString();
                io.to(`user_${receiverIdStr}`).emit("group:invitation", invitation);
                io.to(`user_${receiverIdStr}`).emit("invitation:created", invitation);
            }
        }

        return sendSuccess(res, 200, invitation, "Group invitation sent successfully");
    } catch (error : any) {
        logger.error("sendGroupInvitation error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const getPendingGroupInvitations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return sendError(res, 401, "Unauthorized");
        const invitations = await getPendingGroupInvitationsService(userId);
        return sendSuccess(res, 200, { invitations });
    } catch (error : any) {
        logger.error("getPendingGroupInvitations error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const respondToGroupInvitation = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { invitationId } = req.params;
        const { action } = req.body;
        const userId = req.user?.id;
        if (!userId) return sendError(res, 401, "Unauthorized");

        const { invitation, conversation } = await respondToGroupInvitationService({
            invitationId: invitationId as string,
            userId,
            action,
        });

        const io = getIO();
        if (io) {
            if (action === "accepted" && conversation) {
                const convObj = conversation.toObject ? conversation.toObject() : JSON.parse(JSON.stringify(conversation));

                    const participant = convObj.participants?.find(
                        (p: any) => (p.user?._id || p.user)?.toString() === userId.toString()
                    );
                
                if (participant && participant.joinedAt) {
                    const latestMessage = await Message.findOne({
                        conversation: convObj._id,
                        createdAt: { $gte: participant.joinedAt },
                    });
                    if (!latestMessage) {
                        convObj.lastMessage = { text: null, sender: null, at: null };
                    }
                }
                io.to(`user_${userId}`).emit("conversation:new", convObj);
                io.to(`conv_${conversation._id}`).emit("group:memberJoined", {
                    conversation,
                    userId,
                });
            }
            if(invitation == null){
                return sendError(res, 404, "Invitation not found");
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
    } catch (error:any) {
        logger.error("respondToGroupInvitation error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const searchUsersForGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;
        const { query } = req.query;
        const currentUserId = req.user?.id;
        if (!currentUserId) return sendError(res, 401, "Unauthorized");

        const users = await searchUsersForGroupService({
            groupId : groupId as string,
            query : query as string,
            currentUserId,
        });

        return sendSuccess(res, 200, { users });
    } catch (error:any) {
        logger.error("searchUsersForGroup error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const updateGroupAvatar = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;
        const { avatarUrl } = req.body;
        const requesterId = req.user?.id;
        if (!requesterId) return sendError(res, 401, "Unauthorized");

        const conversation = await updateGroupAvatarService({ groupId : groupId as string, avatarUrl, requesterId });

        const io = getIO();
        if (io) {
            io.to(`conv_${groupId}`).emit("group:updated", conversation);
        }

        return sendSuccess(res, 200, { conversation }, "Group avatar updated successfully");
    } catch (error:any) {
        logger.error("updateGroupAvatar error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId, targetUserId } = req.params;
        const { newRole } = req.body;
        const requesterId = req.user?.id;
        if (!requesterId) return sendError(res, 401, "Unauthorized");

        const conversation = await updateMemberRoleService({ groupId : groupId as string, targetUserId : targetUserId as string, newRole, requesterId });

        const io = getIO();
        if (io) {
            io.to(`conv_${groupId}`).emit("group:updated", conversation);
        }

        return sendSuccess(res, 200, { conversation }, `Member role updated to ${newRole}`);
    } catch (error:any) {
        logger.error("updateMemberRole error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const leaveGroup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;
        const userId = req.user?.id;
        if (!userId) return sendError(res, 401, "Unauthorized");

        const result = await leaveGroupService({ groupId : groupId as string, userId });

        const io = getIO();
        if (io) {
            
            io.to(`user_${userId}`).emit("conversation:removed", { conversationId: groupId });

            if (result?.disbanded) {
                (result.remainingMemberIds || []).forEach((mId) => {
                    io.to(`user_${mId}`).emit("conversation:removed", {
                        conversationId: groupId,
                        disbanded: true,
                    });
                });
                io.to(`conv_${groupId}`).emit("conversation:removed", {
                    conversationId: groupId,
                    disbanded: true,
                });
            } else if (result?.convertedToPrivate && result?.conversation) {
                // Notify remaining 2 members that the group was converted to 1-to-1 private chat
                (result.remainingMemberIds || []).forEach((mId) => {
                    io.to(`user_${mId}`).emit("conversation:new", result.conversation);
                    io.to(`user_${mId}`).emit("group:updated", result.conversation);
                });
                io.to(`conv_${groupId}`).emit("group:updated", result.conversation);
            } else if (result?.conversation) {
                io.to(`conv_${groupId}`).emit("group:updated", result.conversation);
            }
        }

        return sendSuccess(res, 200, { result }, "Left group successfully");
    } catch (error:any) {
        logger.error("leaveGroup error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};

export const kickMember = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { groupId, targetUserId } = req.params;
        const requesterId = req.user?.id;
        if (!requesterId) return sendError(res, 401, "Unauthorized");

        const result = await kickMemberService({ groupId : groupId as string, targetUserId : targetUserId as string, requesterId });

        const io = getIO();
        if (io) {
            io.to(`user_${targetUserId}`).emit("conversation:removed", { conversationId: groupId });

            if (result?.disbanded) {
                (result.remainingMemberIds || []).forEach((mId) => {
                    io.to(`user_${mId}`).emit("conversation:removed", {
                        conversationId: groupId,
                        disbanded: true,
                    });
                });
                io.to(`conv_${groupId}`).emit("conversation:removed", {
                    conversationId: groupId,
                    disbanded: true,
                });
            } else if (result?.convertedToPrivate && result?.conversation) {
                (result.remainingMemberIds || []).forEach((mId) => {
                    io.to(`user_${mId}`).emit("conversation:new", result.conversation);
                    io.to(`user_${mId}`).emit("group:updated", result.conversation);
                });
                io.to(`conv_${groupId}`).emit("group:updated", result.conversation);
            } else if (result?.conversation) {
                io.to(`conv_${groupId}`).emit("group:updated", result.conversation);
            }
        }

        return sendSuccess(res, 200, { conversation: result?.conversation }, "Member removed from group");
    } catch (error:any) {
        logger.error("kickMember error:", { error: error.message, stack: error.stack });
        return next(error);
    }
};