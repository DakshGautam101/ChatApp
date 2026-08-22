import type { NextFunction, Request, Response } from "express";
declare const getUserList: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
declare const updateProfile: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export { getUserList, updateProfile };
//# sourceMappingURL=user.controller.d.ts.map