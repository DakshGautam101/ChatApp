import { addSocket, removeSocket, getSockets, setIO } from "./socket.js";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Message from "../models/messages.model.js";
import Conversation from "../models/conversation.model.js";

function init(io) {
    setIO(io);
    io.use((socket, next) => {
        const cookies = cookie.parse(socket.handshake.headers.cookie || "");
        const token = socket.handshake.auth?.token || cookies.token;

        if (!token) {
            return next(new Error("Unauthorized"));
        }

        try {
            const user = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = user;
            next();
        } catch (err) {
            next(new Error("Invalid token"));
        }
    });

    io.on("connection", (socket) => {
        const userId = socket.user?.id;
        if (!userId) return socket.disconnect(true);

        socket.join(`user_${userId}`);
        addSocket(userId, socket.id);

        socket.on("disconnect", () => {
            removeSocket(userId, socket.id);
        });

        socket.on("conversation:join", async (conversationId) => {
            try {
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    "participants.user": userId,
                });
                if (!conversation) return;
                socket.join(`conv_${conversationId}`);
                const undelivered = await Message.find({
                    conversation: conversationId,
                    sender: { $ne: userId },
                    status: "sent",
                }).select("_id");

                if (undelivered.length) {
                    await Message.updateMany(
                        { _id: { $in: undelivered.map((m) => m._id) } },
                        { $set: { status: "delivered" } }
                    );
                    io.to(`conv_${conversationId}`).emit("message:statusUpdated", {
                        messageIds: undelivered.map((m) => m._id.toString()),
                        status: "delivered",
                    });
                }
            } catch (err) {
                console.error("conversation:join error:", err.message);
            }
        });

        socket.on("message:send", async ({ conversationId, content, attachments = [] }) => {
            try {
                const hasText = content && content.trim();
                const hasAttachment = attachments.length > 0;

                if (!hasText && !hasAttachment) {
                    return;
                }

                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    "participants.user": userId,
                });
                if (!conversation) return;

                const recipients = conversation.participants
                    .map((p) => p.user.toString())
                    .filter((id) => id !== userId);

                const recipientIsOnline = recipients.some((id) => getSockets(id).length > 0);

                const message = await Message.create({
                    conversation: conversationId,
                    sender: userId,
                    content: content.trim(),
                    attachments,
                    status: recipientIsOnline ? "delivered" : "sent",
                });

                let previewText = content.trim();
                if (!previewText && attachments.length > 0) {
                    const type = attachments[0].fileType || "";
                    if (type.startsWith("image/")) previewText = "📷 Photo";
                    else if (type.startsWith("video/")) previewText = "🎥 Video";
                    else if (type === "application/pdf") previewText = "📄 PDF";
                    else previewText = "📎 Attachment";
                }

                await Conversation.updateOne(
                    { _id: conversationId },
                    { $set: { lastMessage: { text: previewText, sender: userId } } }
                );

                const populated = await message.populate("sender", "username email avatar");

                socket.emit("message:statusUpdated", {
                    messageId: populated._id.toString(),
                    status: populated.status,
                });
                io.to(`conv_${conversationId}`).emit("message:new", populated);

                // notify offline/not-in-room recipients so their sidebar can update
                recipients.forEach((recipientId) => {
                    io.to(`user_${recipientId}`).emit("conversation:updated", {
                        conversationId,
                        lastMessage: { text: previewText, sender: userId },
                    });
                });
            } catch (err) {
                console.error("message:send error:", err.message);
            }
        });

        socket.on("message:react", async ({ conversationId, messageId, reactionType }) => {
            try {
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    "participants.user": userId,
                });
                if (!conversation) return;

                const message = await Message.findOne({
                    _id: messageId,
                    conversation: conversationId,
                });
                if (!message) return;

                const existing = message.reactions.find(
                    (reaction) => reaction.user.toString() === userId
                );

                if (existing) {
                    message.reactions = message.reactions.filter(
                        (reaction) => reaction.user.toString() !== userId
                    );
                } else {
                    message.reactions.push({
                        user: userId,
                        type: reactionType || "like",
                    });
                }

                await message.save();
                const populated = await message.populate("sender", "username email avatar");
                io.to(`conv_${conversationId}`).emit("message:reactionUpdated", populated);
            } catch (err) {
                console.error("message:react error:", err.message);
            }
        });

        socket.on("typing", ({ conversationId, isTyping }) => {
            socket.to(`conv_${conversationId}`).emit("typing", { userId, isTyping });
        });

        socket.on("message:read", async ({ conversationId, lastMessageId }) => {
            try {
                await Conversation.updateOne(
                    { _id: conversationId, "participants.user": userId },
                    { $set: { "participants.$.lastReadMessageId": lastMessageId } }
                );

                const upperBound = mongoose.Types.ObjectId.isValid(lastMessageId)
                    ? new mongoose.Types.ObjectId(lastMessageId)
                    : null;

                const affectedMessages = upperBound
                    ? await Message.find({
                        conversation: conversationId,
                        sender: { $ne: userId },
                        _id: { $lte: upperBound },
                    }).select("_id")
                    : [];

                if (affectedMessages.length) {
                    await Message.updateMany(
                        {
                            conversation: conversationId,
                            sender: { $ne: userId },
                            _id: { $lte: upperBound },
                        },
                        { $set: { status: "read" } }
                    );

                    io.to(`conv_${conversationId}`).emit("message:statusUpdated", {
                        messageIds: affectedMessages.map((message) => message._id.toString()),
                        status: "read",
                    });
                }

                socket.to(`conv_${conversationId}`).emit("message:readReceipt", {
                    userId,
                    lastMessageId,
                });
            } catch (err) {
                console.error("message:read error:", err.message);
            }
        });
    });
}

export { init };