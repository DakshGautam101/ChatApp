import "dotenv/config";
import { Server } from "socket.io";
declare const server: import("node:http").Server<typeof import("node:http").IncomingMessage, typeof import("node:http").ServerResponse>;
declare const io: Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { io, server };
//# sourceMappingURL=app.d.ts.map