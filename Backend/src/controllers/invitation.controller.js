import Invitation from "../models/invitation.model.js";
import User from "../models/user.model.js"
import { io } from "../main.js";
import Conversation from "../models/conversation.model.js";

export const sendInvitation = async (req, res) => {
    try {
        const senderId = req.user.id;
        const receiverId = req.params.id;

        if (!receiverId) {
            return res.status(400).json({
                success: false,
                message: "Receiver ID is required",
            });
        }

        if (senderId === receiverId) {
            return res.status(400).json({
                success: false,
                message: "You cannot send an invitation to yourself",
            });
        }

        const [sender, receiver] = await Promise.all([
            User.findById(senderId),
            User.findById(receiverId),
        ]);

        if (!sender || !receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
        }

        // Already friends
        if (sender.friends.includes(receiver._id)) {
            return res.status(400).json({
                success: false,
                message: "Already friends",
            });
        }

        // Check if either direction already has an invitation
        const existingInvitation = await Invitation.findOne({
            $or: [
                { sender: senderId, receiver: receiverId },
                { sender: receiverId, receiver: senderId },
            ],
        });

        if (existingInvitation) {

            if (existingInvitation.status === "pending") {
                return res.status(400).json({
                    success: false,
                    message: "Invitation already pending",
                });
            }

            if (existingInvitation.status === "accepted") {
                return res.status(400).json({
                    success: false,
                    message: "Users are already friends",
                });
            }

            if (
                existingInvitation.status === "rejected" &&
                existingInvitation.rejectedUntil &&
                existingInvitation.rejectedUntil > new Date()
            ) {
                return res.status(400).json({
                    success: false,
                    message: "Invitation was rejected. Try again after 24 hours.",
                });
            }

            // Reuse the old invitation
            existingInvitation.sender = senderId;
            existingInvitation.receiver = receiverId;
            existingInvitation.status = "pending";
            existingInvitation.rejectedUntil = null;

            await existingInvitation.save();

            io.to(`user_${receiverId}`).emit("invitation:created", {
                invitationId: existingInvitation._id,
                sender: {
                    _id: sender._id,
                    username: sender.username,
                },
            });

            return res.status(200).json({
                success: true,
                message: "Invitation sent successfully",
                invitation: existingInvitation,
            });
        }

        // Create new invitation
        const invitation = await Invitation.create({
            sender: senderId,
            receiver: receiverId,
        });

        sender.invitations.addToSet(invitation._id);
        receiver.invitations.addToSet(invitation._id);

        await Promise.all([
            sender.save(),
            receiver.save(),
        ]);

        io.to(`user_${receiverId}`).emit("invitation:created", {
            invitationId: invitation._id,
            sender: {
                _id: sender._id,
                username: sender.username,
            },
        });

        return res.status(201).json({
            success: true,
            message: "Invitation sent successfully",
            invitation,
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const changeStatus = async (req, res) => {
    try {
        const invitationId = req.params.id;
        const receiverId = req.user.id;
        const status = String(req.query.invitationStatus || "").toLowerCase();

        if (!["accepted", "rejected"].includes(status)) {
            return res.status(400).json({
                success: false,
                message: "Invalid invitation status",
            });
        }

        const invitation = await Invitation.findById(invitationId);

        if (!invitation) {
            return res.status(404).json({
                success: false,
                message: "Invitation not found",
            });
        }

        if (invitation.receiver.toString() !== receiverId) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized",
            });
        }

        if (invitation.status !== "pending") {
            return res.status(400).json({
                success: false,
                message: "Invitation already processed",
            });
        }

        const sender = await User.findById(invitation.sender);
        const receiver = await User.findById(invitation.receiver);

        if (!sender || !receiver) {
            return res.status(404).json({
                success: false,
                message: "User not found",
            });
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
            const conversation = await Conversation.findOne({
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
            await conversation.save();
        }

        else {

            invitation.status = "rejected";
            invitation.rejectedUntil = new Date(
                Date.now() + 24 * 60 * 60 * 1000
            );

            sender.invitations.pull(invitation._id);
            receiver.invitations.pull(invitation._id);

            await Promise.all([
                invitation.save(),
                sender.save(),
                receiver.save(),
            ]);
        }

        io.to(`user_${sender._id}`).emit("invitation:statusChanged", {
            invitationId: invitation._id,
            status: invitation.status,
            receiver: {
                _id: receiver._id,
                username: receiver.username,
            },
        });

        return res.status(200).json({
            success: true,
            message: `Invitation ${status}`,
            invitation,
        });

    } catch (error) {

        console.error("changeStatus:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};

export const getInvitation = async (req, res) => {
    try {
        const userId = req.user.id;

        const [received, sent] = await Promise.all([

            Invitation.find({
                receiver: userId,
            })
                .populate("sender", "username email avatar status")
                .sort({ createdAt: -1 })
                .lean(),

            Invitation.find({
                sender: userId,
            })
                .populate("receiver", "username email avatar status")
                .sort({ createdAt: -1 })
                .lean(),
        ]);

        return res.status(200).json({
            success: true,
            received,
            sent,
        });

    } catch (error) {
        console.error("getInvitation:", error);

        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }
};