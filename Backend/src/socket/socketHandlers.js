import { addSocket, removeSocket } from "./socket.js";
import cookie from "cookie";
import jwt from "jsonwebtoken";

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
    });
}

export { init };