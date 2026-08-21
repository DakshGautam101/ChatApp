import { addSocket, removeSocket, getSockets, setIO } from "./socket.js";
import { parseCookie } from "cookie";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Message from "../models/messages.model.js";
import Conversation from "../models/conversation.model.js";
import logger from "../utils/logger.js";
import User from "../models/user.model.js";
import { sendMessageService } from "../services/message.service.js";
import cacheService from "../services/cache.service.js";
import type { Server } from "socket.io";

function init(io : Server) {
    setIO(io);
    io.use(async (socket, next) => {
        const cookies = parseCookie(socket.handshake.headers.cookie || "");
        const token = socket.handshake.auth?.token || cookies.token;

        if (!token) {
            return next(new Error("Unauthorized"));
        }
        try {
             type DecodedType = {
                        id: string,
                        tokenVersion: number
                    }
            const decoded = jwt.verify(token, process.env.JWT_SECRET!) as DecodedType;
            if(decoded == null){
                return next(new Error("Token not found"));
            }
            const dbUser = await User.findById(decoded.id).select("tokenVersion isVerified");
            if (!dbUser || (dbUser.tokenVersion ?? 0) !== (decoded.tokenVersion ?? 0)) {
                return next(new Error("Token has been revoked"));
            }
            if (!dbUser.isVerified) {
                return next(new Error("Account is not verified"));
            }
            socket.user = decoded;
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
        User.findByIdAndUpdate(userId, { status: "online" }).catch(() => {});
        cacheService.set(`user:status:${userId}`, "online", 3600);
        io.emit("user:status", { userId, status: "online" });

        socket.on("disconnect", () => {
            removeSocket(userId, socket.id);
            if (getSockets(userId).length === 0) {
                User.findByIdAndUpdate(userId, { status: "offline" }).catch(() => {});
                cacheService.set(`user:status:${userId}`, "offline", 3600);
                io.emit("user:status", { userId, status: "offline" });
            }
        });

        socket.on("conversation:join", async (conversationId) => {
            try {
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    "participants.user": userId,
                });
                if (!conversation) return;
                socket.join(`conv_${conversationId}`);

                const participant = conversation.participants.find(
                    (p:any) => (p.user?._id || p.user).toString() === userId.toString()
                );
                const minDate = conversation.type === "group" ? participant?.joinedAt : null;

                const filter: Record<string, any> = {
                    conversation: conversationId,
                    sender: { $ne: userId },
                    status: "sent",
                };
                if (minDate) filter.createdAt = { $gte: minDate };

                const undelivered = await Message.find(filter).select("_id");

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
            } catch (err : any) {
                logger.error("conversation:join error:", { error: err.message });
            }
        });

        socket.on("message:send", async ({ conversationId, content, attachments = [] }) => {
            try {
                const dbUser = await User.findById(userId).select("tokenVersion");
                if (!dbUser || (dbUser.tokenVersion ?? 0) !== (socket.user?.tokenVersion ?? 0)) {
                    socket.emit("error", { message: "Unauthorized" });
                    return socket.disconnect(true);
                }

                const populated = await sendMessageService({
                    userId,
                    conversationId,
                    content,
                    attachments,
                });

                socket.emit("message:statusUpdated", {
                    messageId: populated._id.toString(),
                    status: populated.status,
                });
            } catch (err:any) {
                logger.error("message:send error:", { error: err.message });
                socket.emit("error", { message: err.message || "Failed to send message" });
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
                        (reaction: any) => (reaction.user._id || reaction.user).toString() === userId
                    );
                    if (existing) {
                        message.reactions = message.reactions.filter(
                            (reaction : any) => (reaction.user._id || reaction.user).toString() !== userId
                        );
                    } else {
                        message.reactions.push({
                            user: new mongoose.Types.ObjectId(userId),
                            type: reactionType || "like",
                        });
                    }
            


                await message.save();
                const populated = await message.populate([
                    { path: "sender", select: "username email avatar" },
                    { path: "reactions.user", select: "username email avatar" },
                ]);
                io.to(`conv_${conversationId}`).emit("message:reactionUpdated", populated);
            } catch (err : any) {
                logger.error("message:react error:", { error: err.message });
            }
        });

        socket.on("typing", ({ conversationId, isTyping }) => {
            socket.to(`conv_${conversationId}`).emit("typing", { conversationId, userId, isTyping });
        });

        socket.on("message:read", async ({ conversationId, lastMessageId }) => {
            try {
                const conversation = await Conversation.findById(conversationId);
                if (!conversation) return;

                await Conversation.updateOne(
                    { _id: conversationId, "participants.user": userId },
                    { $set: { "participants.$.lastReadMessageId": lastMessageId } }
                );

                const upperBound = mongoose.Types.ObjectId.isValid(lastMessageId)
                    ? new mongoose.Types.ObjectId(lastMessageId)
                    : null;

                if (!upperBound) return;

                const participant = conversation.participants.find(
                    (p : any) => (p.user?._id || p.user).toString() === userId.toString()
                );
                const minDate = conversation.type === "group" ? participant?.joinedAt : null;

                const msgFilter: Record<string, any> = {
                    conversation: conversationId,
                    sender: { $ne: userId },
                    _id: { $lte: upperBound },
                };
                if (minDate) msgFilter.createdAt = { $gte: minDate };

                const messagesToUpdate = await Message.find(msgFilter);

                if (!messagesToUpdate.length) return;

                const readMessageIds = [];
                const deliveredMessageIds = [];

                for (const msg of messagesToUpdate) {
                    const alreadyRead = msg.readBy.some(
                        (r: any) => r.user.toString() === userId.toString()
                    );
                    if (!alreadyRead) {
                        msg.readBy.push({ user: new mongoose.Types.ObjectId(userId), readAt: new Date() });
                    }

                    const senderIdStr = msg.sender.toString();
                    const recipientIds = conversation.participants
                        .map((p:any) => (p.user._id ? p.user._id.toString() : p.user.toString()))
                        .filter((id) => id !== senderIdStr);

                    const readUserIds = new Set(msg.readBy.map((r:any) => r.user.toString()));
                    const allRecipientsRead =
                        recipientIds.length > 0 &&
                        recipientIds.every((id) => readUserIds.has(id));

                    const oldStatus = msg.status;
                    if (allRecipientsRead) {
                        msg.status = "read";
                    } else {
                        msg.status = "delivered";
                    }

                    await msg.save();

                    if (msg.status === "read") {
                        readMessageIds.push(msg._id.toString());
                    } else if (msg.status === "delivered" && oldStatus !== "delivered") {
                        deliveredMessageIds.push(msg._id.toString());
                    }
                }

                const participantRooms = conversation.participants.map(
                    (p:any) => `user_${(p.user?._id || p.user).toString()}`
                );

                if (readMessageIds.length) {
                    io.to(`conv_${conversationId}`).to(participantRooms).emit("message:statusUpdated", {
                        messageIds: readMessageIds,
                        status: "read",
                    });
                }
                if (deliveredMessageIds.length) {
                    io.to(`conv_${conversationId}`).to(participantRooms).emit("message:statusUpdated", {
                        messageIds: deliveredMessageIds,
                        status: "delivered",
                    });
                }

                io.to(`conv_${conversationId}`).to(participantRooms).emit("message:readReceipt", {
                    conversationId,
                    userId,
                    lastMessageId,
                });
                io.to(`user_${userId}`).emit("conversation:read", {
                    conversationId,
                });

                try {
                    await cacheService.del(`user:conversations:${userId}`);
                } catch (cacheErr:any) {
                    logger.warn(`Cache invalidation notice in message:read: ${cacheErr.message}`);
                }
            } catch (err:any) {
                logger.error("message:read error:", { error: err.message });
            }
        });
    });
}

export { init };