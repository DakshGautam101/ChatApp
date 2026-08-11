import Invitation from "../models/invitation.model.js";
import User from "../models/user.model.js";
import Conversation from "../models/conversation.model.js";
import { getIO } from "../socket/socket.js";

export const sendInvitationService = async (senderId, receiverId) => {
    if (!receiverId) {
        throw { status: 400, message: "Receiver ID is required" };
    }

    if (senderId === receiverId) {
        throw { status: 400, message: "You cannot send an invitation to yourself" };
    }

    const [sender, receiver] = await Promise.all([
        User.findById(senderId),
        User.findById(receiverId),
    ]);

    if (!sender || !receiver) {
        throw { status: 404, message: "User not found" };
    }

    if (sender.friends.includes(receiver._id)) {
        throw { status: 400, message: "Already friends" };
    }

    const existingInvitation = await Invitation.findOne({
        $or: [
            { sender: senderId, receiver: receiverId },
            { sender: receiverId, receiver: senderId },
        ],
    });

    const io = getIO();

    if (existingInvitation) {
        if (existingInvitation.status === "pending") {
            throw { status: 400, message: "Invitation already pending" };
        }

        if (existingInvitation.status === "accepted") {
            throw { status: 400, message: "Users are already friends" };
        }

        if (
            existingInvitation.status === "rejected" &&
            existingInvitation.rejectedUntil &&
            existingInvitation.rejectedUntil > new Date()
        ) {
            throw { status: 400, message: "Invitation was rejected. Try again after 24 hours." };
        }

        existingInvitation.sender = senderId;
        existingInvitation.receiver = receiverId;
        existingInvitation.status = "pending";
        existingInvitation.rejectedUntil = null;

        await existingInvitation.save();

        if (io) {
            io.to(`user_${receiverId}`).emit("invitation:created", {
                invitationId: existingInvitation._id,
                sender: {
                    _id: sender._id,
                    username: sender.username,
                },
            });
        }

        return { invitation: existingInvitation, statusCode: 200 };
    }

    const invitation = await Invitation.create({
        sender: senderId,
        receiver: receiverId,
    });

    sender.invitations.addToSet(invitation._id);
    receiver.invitations.addToSet(invitation._id);

    await Promise.all([sender.save(), receiver.save()]);

    if (io) {
        io.to(`user_${receiverId}`).emit("invitation:created", {
            invitationId: invitation._id,
            sender: {
                _id: sender._id,
                username: sender.username,
            },
        });
    }

    return { invitation, statusCode: 201 };
};

export const changeInvitationStatusService = async (invitationId, receiverId, statusInput) => {
    const status = String(statusInput || "").toLowerCase();

    if (!["accepted", "rejected"].includes(status)) {
        throw { status: 400, message: "Invalid invitation status" };
    }

    const invitation = await Invitation.findById(invitationId);

    if (!invitation) {
        throw { status: 404, message: "Invitation not found" };
    }

    if (invitation.receiver.toString() !== receiverId) {
        throw { status: 403, message: "Unauthorized" };
    }

    if (invitation.status !== "pending") {
        throw { status: 400, message: "Invitation already processed" };
    }

    const sender = await User.findById(invitation.sender);
    const receiver = await User.findById(invitation.receiver);

    if (!sender || !receiver) {
        throw { status: 404, message: "User not found" };
    }

    if (status === "accepted") {
        invitation.status = "accepted";

        sender.friends.addToSet(receiver._id);
        receiver.friends.addToSet(sender._id);

        sender.invitations.pull(invitation._id);
        receiver.invitations.pull(invitation._id);

        await Promise.all([
            invitation.save(),
            sender.save(),
            receiver.save(),
        ]);

        let conversation = await Conversation.findOne({
            type: "private",
            "participants.user": { $all: [invitation.sender, invitation.receiver] },
        });

        if (!conversation) {
            conversation = await Conversation.create({
                type: "private",
                createdBy: invitation.sender,
                participants: [
                    { user: invitation.sender },
                    { user: invitation.receiver },
                ],
            });
        }
    } else {
        invitation.status = "rejected";
        invitation.rejectedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);

        sender.invitations.pull(invitation._id);
        receiver.invitations.pull(invitation._id);

        await Promise.all([
            invitation.save(),
            sender.save(),
            receiver.save(),
        ]);
    }

    const io = getIO();
    if (io) {
        io.to(`user_${sender._id}`).emit("invitation:statusChanged", {
            invitationId: invitation._id,
            status: invitation.status,
            receiver: {
                _id: receiver._id,
                username: receiver.username,
            },
        });
    }

    return invitation;
};

export const getUserInvitationsService = async (userId) => {
    const [received, sent] = await Promise.all([
        Invitation.find({ receiver: userId })
            .populate("sender", "username email avatar status")
            .sort({ createdAt: -1 })
            .lean(),

        Invitation.find({ sender: userId })
            .populate("receiver", "username email avatar status")
            .sort({ createdAt: -1 })
            .lean(),
    ]);

    return { received, sent };
};
