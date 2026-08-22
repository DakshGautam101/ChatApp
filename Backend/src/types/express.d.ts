import type { AuthTokenPayload } from "../Interfaces/BacknedInterfaces.ts";

declare global {
    namespace Express {
        interface Request {
            user?: AuthTokenPayload;
        }
    }
}

export {};