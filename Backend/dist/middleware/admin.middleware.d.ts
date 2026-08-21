import type { NextFunction, Request, Response } from "express";
export interface isAdminRequest extends Request {
    user: {
        id: string;
    };
}
export declare const isAdmin: (req: isAdminRequest, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=admin.middleware.d.ts.map