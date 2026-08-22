import type { Server } from "socket.io";
declare function setIO(io: Server): void;
declare function getIO(): Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any> | null;
declare function addSocket(userId: string, socketId: string): void;
declare function removeSocket(userId: string, socketId: string): void;
declare function getSockets(userId: string): string[];
export { addSocket, removeSocket, getSockets, setIO, getIO };
//# sourceMappingURL=socket.d.ts.map