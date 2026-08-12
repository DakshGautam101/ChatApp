import Conversation from "../models/conversation.model.js";
import User from "../models/user.model.js";
import GroupInvitation from "../models/groupInvitation.model.js";

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
        ...new Set(
            members
                .map((id) => id?.toString())
                .filter((id) => id && id !== creatorId.toString() && friendIdsSet.has(id))
        ),
    ];

    if (validMemberIds.length < 2) {
        const error = new Error("A minimum of 2 other members selected from your connections is required");
        error.statusCode = 400;
        throw error;
    }

    const groupParticipants = [
        {
            user: creatorId,
            role: "admin",
            isOwner: true,
        },
        ...validMemberIds.map((id) => ({
            user: id,
            role: "member",
            isOwner: false,
        })),
    ];

    const conversation = await Conversation.create({
        type: "group",
        name: name.trim(),
        createdBy: creatorId,
        participants: groupParticipants,
    });

    const populatedConversation = await Conversation.findById(conversation._id)
        .populate("participants.user", "username email avatar status phone")
        .populate("createdBy", "username email avatar");

    return populatedConversation;
};

export const sendGroupInvitationService = async ({ groupId, senderId, receiverId, query }) => {
    const group = await Conversation.findById(groupId);
    if (!group || group.type !== "group") {
        const error = new Error("Group conversation not found");
        error.statusCode = 404;
        throw error;
    }

    let targetUser = null;
    if (receiverId) {
        targetUser = await User.findById(receiverId);
    } else if (query && query.trim()) {
        const searchRegex = new RegExp(query.trim(), "i");
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

    const isAlreadyMember = group.participants.some(
        (p) => p.user.toString() === targetUser._id.toString()
    );
    if (isAlreadyMember) {
        const error = new Error("User is already a member of this group");
        error.statusCode = 400;
        throw error;
    }

    const existingInvitation = await GroupInvitation.findOne({
        group: groupId,
        receiver: targetUser._id,
        status: "pending",
    });

    if (existingInvitation) {
        const error = new Error("An invitation has already been sent to this user");
        error.statusCode = 400;
        throw error;
    }

    const invitation = await GroupInvitation.create({
        group: groupId,
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
        .sort({ createdAt: -1 });

    return invitations;
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

        const participantIndex = group.participants.findIndex((p) => p.user.toString() === userId.toString());
        if (participantIndex === -1) {
            group.participants.push({
                user: userId,
                role: "member",
                isOwner: false,
                joinedAt: new Date(),
            });
            await group.save();
        } else {
            group.participants[participantIndex].joinedAt = new Date();
            await group.save();
        }

        updatedConversation = await Conversation.findById(group._id)
            .populate("participants.user", "username email avatar status phone")
            .populate("createdBy", "username email avatar");
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

    const isParticipant = group.participants.some(
        (p) => p.user.toString() === currentUserId.toString()
    );
    if (!isParticipant) {
        const error = new Error("You are not a member of this group");
        error.statusCode = 403;
        throw error;
    }

    const memberUserIds = group.participants.map((p) => p.user.toString());
    const trimmedQuery = query?.trim() || "";

    const filter = {
        _id: { $nin: memberUserIds },
    };

    if (trimmedQuery) {
        const searchRegex = new RegExp(trimmedQuery, "i");
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

    const requester = group.participants.find((p) => p.user.toString() === requesterId.toString());
    if (!requester || requester.role !== "admin") {
        const error = new Error("Only group admins can update group avatar");
        error.statusCode = 403;
        throw error;
    }

    group.avatarUrl = avatarUrl;
    await group.save();

    return await Conversation.findById(groupId)
        .populate("participants.user", "username email avatar status phone")
        .populate("createdBy", "username email avatar");
};

export const updateMemberRoleService = async ({ groupId, targetUserId, newRole, requesterId }) => {
    const group = await Conversation.findById(groupId);
    if (!group || group.type !== "group") {
        const error = new Error("Group conversation not found");
        error.statusCode = 404;
        throw error;
    }

    const requester = group.participants.find((p) => p.user.toString() === requesterId.toString());
    if (!requester || requester.role !== "admin") {
        const error = new Error("Only group admins can change member roles");
        error.statusCode = 403;
        throw error;
    }

    const targetIndex = group.participants.findIndex((p) => p.user.toString() === targetUserId.toString());
    if (targetIndex === -1) {
        const error = new Error("User is not a member of this group");
        error.statusCode = 404;
        throw error;
    }

    if (group.participants[targetIndex].isOwner) {
        const error = new Error("Cannot change role of group owner");
        error.statusCode = 400;
        throw error;
    }

    group.participants[targetIndex].role = newRole === "admin" ? "admin" : "member";
    await group.save();

    return await Conversation.findById(groupId)
        .populate("participants.user", "username email avatar status phone")
        .populate("createdBy", "username email avatar");
};

export const leaveGroupService = async ({ groupId, userId }) => {
    const group = await Conversation.findById(groupId);
    if (!group || group.type !== "group") {
        const error = new Error("Group conversation not found");
        error.statusCode = 404;
        throw error;
    }

    const participantIndex = group.participants.findIndex((p) => p.user.toString() === userId.toString());
    if (participantIndex === -1) {
        const error = new Error("You are not a member of this group");
        error.statusCode = 400;
        throw error;
    }

    const wasOwner = group.participants[participantIndex].isOwner;
    group.participants.splice(participantIndex, 1);

    if (group.participants.length > 0) {
        if (wasOwner) {
            const nextAdmin = group.participants.find((p) => p.role === "admin") || group.participants[0];
            nextAdmin.role = "admin";
            nextAdmin.isOwner = true;
        }
        await group.save();
    } else {
        await Conversation.findByIdAndDelete(groupId);
        return null;
    }

    return await Conversation.findById(groupId)
        .populate("participants.user", "username email avatar status phone")
        .populate("createdBy", "username email avatar");
};

export const kickMemberService = async ({ groupId, targetUserId, requesterId }) => {
    const group = await Conversation.findById(groupId);
    if (!group || group.type !== "group") {
        const error = new Error("Group conversation not found");
        error.statusCode = 404;
        throw error;
    }

    const requester = group.participants.find((p) => p.user.toString() === requesterId.toString());
    if (!requester || requester.role !== "admin") {
        const error = new Error("Only group admins can kick members");
        error.statusCode = 403;
        throw error;
    }

    const targetIndex = group.participants.findIndex((p) => p.user.toString() === targetUserId.toString());
    if (targetIndex === -1) {
        const error = new Error("User is not a member of this group");
        error.statusCode = 404;
        throw error;
    }

    if (group.participants[targetIndex].isOwner) {
        const error = new Error("Cannot kick group owner");
        error.statusCode = 400;
        throw error;
    }

    group.participants.splice(targetIndex, 1);
    await group.save();

    return await Conversation.findById(groupId)
        .populate("participants.user", "username email avatar status phone")
        .populate("createdBy", "username email avatar");
};

