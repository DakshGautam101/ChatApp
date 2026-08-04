import { addSocket, removeSocket } from "./socket.js";
import cookie from "cookie";
import jwt from "jsonwebtoken";
import Message from "../models/messages.model.js";
import Conversation from "../models/conversation.model.js";

function init(io) {
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
                if (!conversation) return; // not a participant — silently ignore
                socket.join(`conv_${conversationId}`);
            } catch (err) {
                console.error("conversation:join error:", err.message);
            }
        });

        socket.on("message:send", async ({ conversationId, content }) => {
            try {
                if (!content || !content.trim()) return;

                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    "participants.user": userId,
                });
                if (!conversation) return; // not a participant

                const message = await Message.create({
                    conversation: conversationId,
                    sender: userId,
                    content: content.trim(),
                });

                await Conversation.updateOne(
                    { _id: conversationId },
                    { $set: { lastMessage: { text: content.trim(), sender: userId } } }
                );

                const recipients = conversation.participants
                    .map((p) => p.user.toString())
                    .filter((id) => id !== userId);

                const populated = await message.populate("sender", "username email avatar");

                io.to(`conv_${conversationId}`).emit("message:new", populated);

                // notify offline/not-in-room recipients so their sidebar can update
                recipients.forEach((recipientId) => {
                    io.to(`user_${recipientId}`).emit("conversation:updated", {
                        conversationId,
                        lastMessage: { text: content.trim(), sender: userId },
                    });
                });
            } catch (err) {
                console.error("message:send error:", err.message);
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