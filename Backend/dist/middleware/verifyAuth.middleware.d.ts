import { type JwtPayload } from "jsonwebtoken";
import type { NextFunction, Request, Response } from "express";
export interface AuthTokenPayload extends JwtPayload {
    id: string;
    tokenVersion: number;
}
export declare const verifyAuth: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const optionalAuth: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=verifyAuth.middleware.d.ts.map