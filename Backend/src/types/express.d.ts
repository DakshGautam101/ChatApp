import type { AuthTokenPayload } from "../middleware/verifyAuth.middleware.js";

declare global {
    namespace Express {
        interface Request {
            user?: AuthTokenPayload;
        }
    }
}

export {};