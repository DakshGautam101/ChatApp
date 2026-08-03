import Invitation from "../models/invitation.model.js";
import User from "../models/user.model.js"
import { io } from "../main.js";

export const sendInvitation = async function (req, res) {
    try {
        const receiverId = req.params.receiverId || req.params.id;
        if (!receiverId) {
            return res.status(400).json({ message: "Provide a valid ID" });
        }
        const reciever = await User.findById(receiverId);
        if (!reciever) {
            return res.status(404).json({ message: "User does not exists" });
        }
        const senderId = req.user.id;
        if (!senderId) {
            return res.status(401).json({
                message: "Unauthorized"
            });
        }
        if (senderId === receiverId) {
            return res.status(400).json({
                message: "you cannot send invitation to yourself"
            })
        }

        const invitation = new Invitation({
            sender: senderId,
            receiver: receiverId,
        });


        const existingInvitation = await Invitation.findOne({
            sender: senderId,
            receiver: receiverId,
        });

        if (existingInvitation) {

            if (existingInvitation.status === "pending") {
                return res.status(400).json({
                    message: "Invitation already sent."
                });
            }

            if (existingInvitation.status === "accepted") {
                return res.status(400).json({
                    message: "Invitation already accepted."
                });
            }

            if (
                existingInvitation.status === "rejected" &&
                existingInvitation.rejectedUntil > Date.now()
            ) {
                return res.status(400).json({
                    message: "Invitation was rejected. Try again after 24 hours."
                });
            }

            if (existingInvitation.status === "rejected") {
                existingInvitation.status = "pending";
                existingInvitation.rejectedUntil = null;
                await existingInvitation.save();

                io.to(`user_${receiverId}`).emit("invitation:created");

                return res.json({
                    success: true,
                    message: "Invitation sent again."
                });
            }
        }

        await invitation.save();

        try {
            io.to(`user_${receiverId}`).emit('invitation:created', {
                invitationId: invitation._id,
                from: senderId,
                to: receiverId
            });
        } catch (err) {
            console.error('Socket emit error (invitation:created):', err.message);
        }

        return res.status(201).json({
            success: true,
            message: "invitation sent successfully"
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
}

export const changeStatus = async (req, res) => {
    try {
        const invitationStatus = String(req.query.invitationStatus || "").toLowerCase();
        const invitationId = req.params.id;
        const recieverId = req.user?.id;

        if (!recieverId) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        if (!invitationStatus || !["accepted", "rejected"].includes(invitationStatus)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }
        if (!invitationId) {
            return res.status(400).json({
                message: "Invitation ID is required"
            });
        }

        const invitation = await Invitation.findById(invitationId);
        if (!invitation) {
            return res.status(404).json({
                message: "Invitation not found"
            });
        }
        if (invitation.receiver.toString() != recieverId) {
            return res.status(403).json({
                message: "Forbidden - Invalid user access",
            })
        }
        if (invitation.status !== "pending") {
            return res.status(400).json({
                message: "Invitation already processed"
            });
        }
        if (invitationStatus.toLowerCase() == "rejected") {
            invitation.rejectedUntil = new Date(Date.now() + 24 * 60 * 60 * 1000);
        }
        invitation.status = invitationStatus;
        await invitation.save();

        try {
            const senderId = invitation.sender.toString();
            io.to(`user_${senderId}`).emit('invitation:statusChanged', {
                invitationId: invitation._id,
                status: invitation.status,
                by: recieverId
            });
        } catch (err) {
            console.error('Socket emit error (invitation:statusChanged):', err.message);
        }

        return res.status(200).json({
            message: "status updated",
        })
    } catch (error) {
        console.error("changeStatus error:", error);
        return res.status(500).json({
            message: "Error in invitation status controller",
            error: error.message,
        });
    }
}

export const getInvitation = async (req, res) => {
    try {
        const userId = req.user.id;
        const received = await Invitation.find({
            receiver: userId
        }).populate("sender", "username email").sort({ createdAt: -1 });

        const sent = await Invitation.find({
            sender: userId
        }).populate("receiver", "username email").sort({ createdAt: -1 });

        return res.json({
            success: true,
            received,
            sent,
        });

    } catch (error) {
        return res.status(500).json({
            message: err.message,
        });
    }
}