import type { Server } from "socket.io";

const userSockets = new Map<string , Set<string>>();
let ioInstance : Server | null = null;

function setIO(io : Server) {
    ioInstance = io;
}

function getIO() {
    return ioInstance;
}

function addSocket(userId : string, socketId : string) {
    if (!userId) return;
    const key = userId.toString();
    if (!userSockets.has(key)) {
        userSockets.set(key, new Set<string>());
    }
    userSockets.get(key)!.add(socketId);
}

function removeSocket(userId : string, socketId:string) {
    if (!userId) return;
    const key = userId.toString();
    const s = userSockets.get(key);
    if (!s) return;
    s.delete(socketId);
    if (s.size === 0) userSockets.delete(key);
}

function getSockets(userId : string) {
    if (!userId) return [];
    const key = userId.toString();
    const sockets = userSockets.get(key);
    return sockets ? Array.from(sockets) : [];
}

export { addSocket, removeSocket, getSockets, setIO, getIO };