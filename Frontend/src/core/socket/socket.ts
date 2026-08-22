import { io as clientIo } from "socket.io-client";

const API_URL =
    import.meta.env.VITE_API_URL ||
    (import.meta.env.DEV ? "http://localhost:5000" : "https://chatapp-backend-s1n2.onrender.com");

export const socket = clientIo(API_URL, {
    withCredentials: true,
    transports: ["polling", "websocket"],
    autoConnect: false,
});

socket.on("connect", () => console.log("socket connected", socket.id));
socket.on("disconnect", () => console.log("socket disconnected"));
socket.on("connect_error", (error : Error) => {
    console.error("socket connect error", error.message);
    if (
        error.message === "Token has been revoked" ||
        error.message === "Unauthorized" ||
        error.message === "Invalid token"
    ) {
        disconnectSocket();
        if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            const publicAuthPaths = ["/login", "/signup", "/verify-email"];
            if (!publicAuthPaths.includes(currentPath)) {
                window.location.href = "/login";
            }
        }
    }
});

socket.on("error", (error:Error) => {
    const errorMsg = typeof error === "string" ? error : error?.message;
    console.error("socket general error", errorMsg);
    if (
        errorMsg === "Unauthorized" ||
        errorMsg === "Token has been revoked" ||
        errorMsg === "Invalid token"
    ) {
        disconnectSocket();
        if (typeof window !== "undefined") {
            const currentPath = window.location.pathname;
            const publicAuthPaths = ["/login", "/signup", "/verify-email"];
            if (!publicAuthPaths.includes(currentPath)) {
                window.location.href = "/login";
            }
        }
    }
});

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
    if (!socket.connected) {
        socket.connect();
    }
};

export const disconnectSocket = () => {
    if (socket.connected) socket.disconnect();
};
