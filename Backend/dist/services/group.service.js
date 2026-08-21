import { Types } from "mongoose";
import Conversation, {} from "../models/conversation.model.js";
import User, {} from "../models/user.model.js";
import GroupInvitation, {} from "../models/groupInvitation.model.js";
import cacheService from "./cache.service.js";
export const createGroupService = async ({ name, members, creatorId }) => {
    if (!name || typeof name !== "string" || !name.trim()) {
        const error = new Error("Group name is required");
        error.statusCode = 400;
        throw error;
    }
    if (!Array.isArray(members)) {
        const error = new Error("Members must be an array");
        error.statusCode = 400;
        throw error;
    }
    const creator = await User.findById(creatorId).select("friends");
    if (!creator) {
        const error = new Error("Creator user not found");
        error.statusCode = 404;
        throw error;
    }
    const friendIdsSet = new Set((creator.friends || []).map((f) => f.toString()));
    const validMemberIds = [
        ...new Set(members
            .map((id) => id?.toString())
            .filter((id) => Boolean(id && id !== creatorId.toString() && friendIdsSet.has(id)))),
    ];
    if (validMemberIds.length < 2) {
        const error = new Error("A minimum of 2 other members selected from your connections is required");
        error.statusCode = 400;
        throw error;
    }
    const groupParticipants = [
        {
            user: new Types.ObjectId(creatorId),
            role: "admin",
            isOwner: true,
            joinedAt: new Date(),
        },
        ...validMemberIds.map((id) => ({
            user: new Types.ObjectId(id),
            role: "member",
            isOwner: false,
            joinedAt: new Date(),
        })),
    ];
    const conversation = await Conversation.create({
        type: "group",
        name: name.trim(),
        createdBy: new Types.ObjectId(creatorId),
        participants: groupParticipants,
    });
    const populatedConversation = await Conversation.findById(conversation._id)
        .populate("participants.user", "username email avatar status phone")
        .populate("createdBy", "username email avatar");
    try {
        await cacheService.del(`user:conversations:${creatorId}`);
        for (const mId of validMemberIds) {
            await cacheService.del(`user:conversations:${mId}`);
        }
    }
    catch (e) { }
    return populatedConversation;
};
const escapeRegex = (string) => {
    return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};
export const sendGroupInvitationService = async ({ stringGroupId, senderId, receiverId, query }) => {
    const group = await Conversation.findById(stringGroupId);
    if (!group || group.type !== "group") {
        const error = new Error("Group conversation not found");
        error.statusCode = 404;
        throw error;
    }
    const isSenderMember = group.participants.some((p) => (p.user?._id || p.user)?.toString() === senderId.toString());
    if (!isSenderMember) {
        const error = new Error("You must be a member of the group to send invitations");
        error.statusCode = 403;
        throw error;
    }
    let targetUser = null;
    if (receiverId) {
        targetUser = await User.findById(receiverId);
    }
    else if (query && query.trim()) {
        const sanitized = escapeRegex(query.trim());
        const searchRegex = new RegExp(sanitized, "i");
        targetUser = await User.findOne({
            _id: { $ne: senderId },
            $or: [{ email: searchRegex }, { username: searchRegex }, { phone: searchRegex }],
        });
    }
    if (!targetUser) {
        const error = new Error("User not found matching search criteria");
        error.statusCode = 404;
        throw error;
    }
    const isAlreadyMember = group.participants.some((p) => (p.user?._id || p.user)?.toString() === targetUser._id.toString());
    if (isAlreadyMember) {
        const error = new Error("User is already a member of this group");
        error.statusCode = 400;
        throw error;
    }
    const existingInvitation = await GroupInvitation.findOne({
        group: stringGroupId,
        receiver: targetUser._id,
        status: "pending",
    });
    if (existingInvitation) {
        const error = new Error("An invitation has already been sent to this user");
        error.statusCode = 400;
        throw error;
    }
    const invitation = await GroupInvitation.create({
        group: stringGroupId,
        sender: senderId,
        receiver: targetUser._id,
        status: "pending",
    });
    const populatedInvitation = await GroupInvitation.findById(invitation._id)
        .populate("group", "name avatarUrl type")
        .populate("sender", "username email avatar phone")
        .populate("receiver", "username email avatar phone");
    return populatedInvitation;
};
export const getPendingGroupInvitationsService = async (userId) => {
    const invitations = await GroupInvitation.find({
        receiver: userId,
        status: "pending",
    })
        .populate("group", "name avatarUrl type")
        .populate("sender", "username email avatar phone")
        .sort({ createdAt: -1 })
        .lean();
    return invitations.filter((inv) => inv.group && inv.sender);
};
export const respondToGroupInvitationService = async ({ invitationId, userId, action }) => {
    if (!["accepted", "rejected"].includes(action)) {
        const error = new Error("Invalid action. Must be 'accepted' or 'rejected'");
        error.statusCode = 400;
        throw error;
    }
    const invitation = await GroupInvitation.findOne({
        _id: invitationId,
        receiver: userId,
        status: "pending",
    });
    if (!invitation) {
        const error = new Error("Pending invitation not found");
        error.statusCode = 404;
        throw error;
    }
    invitation.status = action;
    await invitation.save();
    let updatedConversation = null;
    if (action === "accepted") {
        const group = await Conversation.findById(invitation.group);
        if (!group) {
            const error = new Error("Group conversation not found");
            error.statusCode = 404;
            throw error;
        }
        if (group.type === "private" || group.isConvertedFromGroup) {
            group.type = "group";
            group.isConvertedFromGroup = false;
            group.name = group.formerGroupName || group.name || "Group";
            group.set("formerGroupName", undefined);
        }
        const participantIndex = group.participants.findIndex((p) => (p.user?._id || p.user)?.toString() === userId.toString());
        if (participantIndex === -1) {
            group.participants.push({
                user: new Types.ObjectId(userId),
                role: "member",
                isOwner: false,
                joinedAt: new Date(),
            });
            await group.save();
        }
        else {
            const participant = group.participants[participantIndex];
            if (participant) {
                participant.joinedAt = new Date();
            }
            await group.save();
        }
        updatedConversation = await Conversation.findById(group._id)
            .populate("participants.user", "username email avatar status phone")
            .populate("createdBy", "username email avatar");
        try {
            await cacheService.del(`user:conversations:${userId}`);
            for (const p of group.participants) {
                const memberId = p.user?._id?.toString() || p.user?.toString();
                if (memberId) {
                    await cacheService.del(`user:conversations:${memberId}`);
                }
            }
        }
        catch (e) { }
    }
    const populatedInvitation = await GroupInvitation.findById(invitation._id)
        .populate("group", "name avatarUrl type")
        .populate("sender", "username email avatar");
    return { invitation: populatedInvitation, conversation: updatedConversation };
};
export const searchUsersForGroupService = async ({ groupId, query, currentUserId }) => {
    const group = await Conversation.findById(groupId);
    if (!group || group.type !== "group") {
        const error = new Error("Group conversation not found");
        error.statusCode = 404;
        throw error;
    }
    const isParticipant = group.participants.some((p) => (p.user?._id || p.user)?.toString() === currentUserId.toString());
    if (!isParticipant) {
        const error = new Error("You are not a member of this group");
        error.statusCode = 403;
        throw error;
    }
    const memberUserIds = group.participants.map((p) => (p.user?._id || p.user)?.toString());
    const trimmedQuery = query?.trim() || "";
    const filter = {
        _id: { $nin: memberUserIds },
    };
    if (trimmedQuery) {
        const sanitized = escapeRegex(trimmedQuery);
        const searchRegex = new RegExp(sanitized, "i");
        filter.$or = [{ username: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
    }
    const users = await User.find(filter)
        .select("username email phone avatar status")
        .limit(20)
        .lean();
    return users;
};
export const updateGroupAvatarService = async ({ groupId, avatarUrl, requesterId }) => {
    const group = await Conversation.findById(groupId);
    if (!group || group.type !== "group") {
        const error = new Error("Group conversation not found");
        error.statusCode = 404;
        throw error;
    }
    const requester = group.participants.find((p) => (p.user?._id || p.user)?.toString() === requesterId.toString());
    if (!requester || requester.role !== "admin") {
        const error = new Error("Only group admins can update group avatar");
        error.statusCode = 403;
        throw error;
    }
    group.avatarUrl = avatarUrl;
    await group.save();
    const updated = await Conversation.findById(groupId)
        .populate("participants.user", "username email avatar status phone")
        .populate("createdBy", "username email avatar");
    try {
        for (const p of group.participants) {
            const memberId = p.user?._id?.toString() || p.user?.toString();
            if (memberId) {
                await cacheService.del(`user:conversations:${memberId}`);
            }
        }
    }
    catch (e) { }
    return updated;
};
export const updateMemberRoleService = async ({ groupId, targetUserId, newRole, requesterId }) => {
    const group = await Conversation.findById(groupId);
    if (!group || group.type !== "group") {
        const error = new Error("Group conversation not found");
        error.statusCode = 404;
        throw error;
    }
    const requester = group.participants.find((p) => (p.user?._id || p.user)?.toString() === requesterId.toString());
    if (!requester || requester.role !== "admin") {
        const error = new Error("Only group admins can change member roles");
        error.statusCode = 403;
        throw error;
    }
    const targetIndex = group.participants.findIndex((p) => (p.user?._id || p.user)?.toString() === targetUserId.toString());
    if (targetIndex === -1) {
        const error = new Error("User is not a member of this group");
        error.statusCode = 404;
        throw error;
    }
    const targetParticipant = group.participants[targetIndex];
    if (targetParticipant?.isOwner) {
        const error = new Error("Cannot change role of group owner");
        error.statusCode = 400;
        throw error;
    }
    if (targetParticipant) {
        targetParticipant.role = newRole === "admin" ? "admin" : "member";
    }
    await group.save();
    const updated = await Conversation.findById(groupId)
        .populate("participants.user", "username email avatar status phone")
        .populate("createdBy", "username email avatar");
    try {
        for (const p of group.participants) {
            const memberId = p.user?._id?.toString() || p.user?.toString();
            if (memberId) {
                await cacheService.del(`user:conversations:${memberId}`);
            }
        }
    }
    catch (e) { }
    return updated;
};
export const leaveGroupService = async ({ groupId, userId }) => {
    const group = await Conversation.findById(groupId);
    if (!group || group.type !== "group") {
        const error = new Error("Group conversation not found");
        error.statusCode = 404;
        throw error;
    }
    const participantIndex = group.participants.findIndex((p) => (p.user?._id || p.user)?.toString() === userId.toString());
    if (participantIndex === -1) {
        const error = new Error("You are not a member of this group");
        error.statusCode = 400;
        throw error;
    }
    const wasOwner = group.participants[participantIndex]?.isOwner;
    group.participants.splice(participantIndex, 1);
    group.participants = group.participants.filter((p) => p.user && (p.user?._id || p.user?.id || p.user));
    if (group.participants.length <= 1) {
        const remainingMemberIds = group.participants.map((p) => (p.user?._id || p.user?.id || p.user).toString());
        await Conversation.findByIdAndDelete(groupId);
        try {
            for (const mId of remainingMemberIds) {
                await cacheService.del(`user:conversations:${mId}`);
            }
            await cacheService.del(`user:conversations:${userId}`);
        }
        catch (e) { }
        return {
            status: "disbanded",
            disbanded: true,
            conversation: null,
            remainingMemberIds,
        };
    }
    if (group.participants.length === 2) {
        const formerName = group.name || "Group";
        group.type = "private";
        group.isConvertedFromGroup = true;
        group.formerGroupName = formerName;
        group.set("name", undefined);
        group.set("avatarUrl", undefined);
        group.participants = group.participants.map((p) => ({
            user: p.user?._id || p.user?.id || p.user,
            role: "member",
            lastReadMessageId: p.lastReadMessageId,
        }));
        await group.save();
        const remainingMemberIds = group.participants.map((p) => (p.user?._id || p.user?.id || p.user).toString());
        try {
            for (const mId of remainingMemberIds) {
                await cacheService.del(`user:conversations:${mId}`);
            }
            await cacheService.del(`user:conversations:${userId}`);
        }
        catch (e) { }
        const populated = await Conversation.findById(groupId)
            .populate("participants.user", "username email avatar status phone")
            .populate("createdBy", "username email avatar");
        return {
            status: "converted_to_private",
            convertedToPrivate: true,
            conversation: populated,
            remainingMemberIds,
        };
    }
    // 3 or more members remain
    if (wasOwner) {
        const nextAdmin = group.participants.find((p) => p.role === "admin") || group.participants[0];
        if (nextAdmin) {
            nextAdmin.role = "admin";
            nextAdmin.isOwner = true;
            group.createdBy = nextAdmin.user?._id || nextAdmin.user;
        }
    }
    await group.save();
    const remainingMemberIds = group.participants.map((p) => (p.user?._id || p.user?.id || p.user).toString());
    try {
        for (const mId of remainingMemberIds) {
            await cacheService.del(`user:conversations:${mId}`);
        }
        await cacheService.del(`user:conversations:${userId}`);
    }
    catch (e) { }
    const populated = await Conversation.findById(groupId)
        .populate("participants.user", "username email avatar status phone")
        .populate("createdBy", "username email avatar");
    return {
        status: "updated",
        conversation: populated,
        remainingMemberIds,
    };
};
export const kickMemberService = async ({ groupId, targetUserId, requesterId }) => {
    const group = await Conversation.findById(groupId);
    if (!group || group.type !== "group") {
        const error = new Error("Group conversation not found");
        error.statusCode = 404;
        throw error;
    }
    const requester = group.participants.find((p) => (p.user?._id || p.user)?.toString() === requesterId.toString());
    if (!requester || requester.role !== "admin") {
        const error = new Error("Only group admins can kick members");
        error.statusCode = 403;
        throw error;
    }
    const targetIndex = group.participants.findIndex((p) => (p.user?._id || p.user)?.toString() === targetUserId.toString());
    if (targetIndex === -1) {
        const error = new Error("User is not a member of this group");
        error.statusCode = 404;
        throw error;
    }
    if (group.participants[targetIndex]?.isOwner) {
        const error = new Error("Cannot kick group owner");
        error.statusCode = 400;
        throw error;
    }
    group.participants.splice(targetIndex, 1);
    group.participants = group.participants.filter((p) => p.user && (p.user?._id || p.user?.id || p.user));
    if (group.participants.length <= 1) {
        const remainingMemberIds = group.participants.map((p) => (p.user?._id || p.user?.id || p.user).toString());
        await Conversation.findByIdAndDelete(groupId);
        try {
            for (const mId of remainingMemberIds) {
                await cacheService.del(`user:conversations:${mId}`);
            }
            await cacheService.del(`user:conversations:${targetUserId}`);
        }
        catch (e) { }
        return {
            status: "disbanded",
            disbanded: true,
            conversation: null,
            remainingMemberIds,
        };
    }
    if (group.participants.length === 2) {
        const formerName = group.name || "Group";
        group.type = "private";
        group.isConvertedFromGroup = true;
        group.formerGroupName = formerName;
        group.set("name", undefined);
        group.set("avatarUrl", undefined);
        group.participants = group.participants.map((p) => ({
            user: p.user?._id || p.user?.id || p.user,
            role: "member",
            lastReadMessageId: p.lastReadMessageId,
        }));
        await group.save();
        const remainingMemberIds = group.participants.map((p) => (p.user?._id || p.user?.id || p.user).toString());
        try {
            for (const mId of remainingMemberIds) {
                await cacheService.del(`user:conversations:${mId}`);
            }
            await cacheService.del(`user:conversations:${targetUserId}`);
        }
        catch (e) { }
        const populated = await Conversation.findById(groupId)
            .populate("participants.user", "username email avatar status phone")
            .populate("createdBy", "username email avatar");
        return {
            status: "converted_to_private",
            convertedToPrivate: true,
            conversation: populated,
            remainingMemberIds,
        };
    }
    // 3 or more members remain
    await group.save();
    const remainingMemberIds = group.participants.map((p) => (p.user?._id || p.user?.id || p.user).toString());
    try {
        for (const mId of remainingMemberIds) {
            await cacheService.del(`user:conversations:${mId}`);
        }
        await cacheService.del(`user:conversations:${targetUserId}`);
    }
    catch (e) { }
    const populated = await Conversation.findById(groupId)
        .populate("participants.user", "username email avatar status phone")
        .populate("createdBy", "username email avatar");
    return {
        status: "updated",
        conversation: populated,
        remainingMemberIds,
    };
};
//# sourceMappingURL=group.service.js.map