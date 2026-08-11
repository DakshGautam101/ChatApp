import { io as clientIo } from "socket.io-client";
import { hasAuthCookie } from "../utils/authCookie.js";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket = clientIo(API_URL, {
    withCredentials: true,
    autoConnect: false,
    transports: ["websocket"],
});

socket.on("connect", () => console.log("socket connected", socket.id));
socket.on("disconnect", () => console.log("socket disconnected"));
socket.on("connect_error", (error) => console.error("socket connect error", error.message));

socket.on("invitation:created", (data) => {
    console.log("invitation received", data);
});

socket.on("invitation:statusChanged", (data) => {
    console.log("invitation status changed", data);
});

socket.on("notification:new", (data) => {
    console.log("notification", data);
});

export const ensureSocket = () => {
    if (!hasAuthCookie()) {
        if (socket.connected) socket.disconnect();
        return;
    }

    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) socket.disconnect();
};

