import type { NextFunction, Request, Response } from "express";
import type { isAdminRequest } from "../middleware/admin.middleware.js";
export declare const createGroup: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const sendGroupInvitation: (req: isAdminRequest, res: Response, next: NextFunction) => Promise<any>;
export declare const getPendingGroupInvitations: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const respondToGroupInvitation: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const searchUsersForGroup: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const updateGroupAvatar: (req: isAdminRequest, res: Response, next: NextFunction) => Promise<any>;
export declare const updateMemberRole: (req: isAdminRequest, res: Response, next: NextFunction) => Promise<any>;
export declare const leaveGroup: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const kickMember: (req: isAdminRequest, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=group.controller.d.ts.map