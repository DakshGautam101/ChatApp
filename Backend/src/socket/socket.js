const userSockets = new Map();

function addSocket(userId, socketId) {
    if (!userSockets.has(userId)) {
        userSockets.set(userId, new Set());
    }
    userSockets.get(userId).add(socketId);
}

function removeSocket(userId, socketId) {
    const s = userSockets.get(userId);
    if (!s) return;
    s.delete(socketId);
    if (s.size === 0) userSockets.delete(userId);
}

function getSockets(userId) {
    return userSockets.has(userId) ? Array.from(userSockets.get(userId)) : [];
}

export { addSocket, removeSocket, getSockets };