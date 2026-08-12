import { io as clientIo } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const getToken = () => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("chatapp_token");
};

export const socket = clientIo(API_URL, {
    withCredentials: true,
    auth: { token: getToken() },
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
    const token = getToken();

    if (!token) {
        if (socket.connected) socket.disconnect();
        return;
    }

    socket.auth = { token };

    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) socket.disconnect();
};
