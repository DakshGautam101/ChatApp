import { io as clientIo } from "socket.io-client";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const socket = clientIo(API_URL, {
    withCredentials: true,
});

socket.on("connect", () => console.log("socket connected", socket.id));
socket.on("disconnect", () => console.log("socket disconnected"));

socket.on("invitation:created", data => {

    console.log("invitation received", data);
});

socket.on("invitation:statusChanged", data => {
    console.log("invitation status changed", data);
});

socket.on("notification:new", data => {
    console.log("notification", data);
});