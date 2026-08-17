const userSockets = new Map();
let ioInstance = null;

function setIO(io) {
    ioInstance = io;
}

function getIO() {
    return ioInstance;
}

function addSocket(userId, socketId) {
    if (!userId) return;
    const key = userId.toString();
    if (!userSockets.has(key)) {
        userSockets.set(key, new Set());
    }
    userSockets.get(key).add(socketId);
}

function removeSocket(userId, socketId) {
    if (!userId) return;
    const key = userId.toString();
    const s = userSockets.get(key);
    if (!s) return;
    s.delete(socketId);
    if (s.size === 0) userSockets.delete(key);
}

function getSockets(userId) {
    if (!userId) return [];
    const key = userId.toString();
    return userSockets.has(key) ? Array.from(userSockets.get(key)) : [];
}

export { addSocket, removeSocket, getSockets, setIO, getIO };