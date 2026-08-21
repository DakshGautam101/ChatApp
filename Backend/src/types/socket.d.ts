
import type { JwtPayload } from "jsonwebtoken";

declare module "socket.io" {
    interface Socket {
        user?: {
            id: string;
            tokenVersion: number;
        };
    }
}