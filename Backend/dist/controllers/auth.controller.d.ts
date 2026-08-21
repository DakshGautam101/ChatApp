import type { NextFunction, Request, Response } from "express";
export declare const signup: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const login: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const logout: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const verifyUserEmailOtp: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const resendEmailOtp: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const me: (req: Request, res: Response, next: NextFunction) => Promise<any>;
//# sourceMappingURL=auth.controller.d.ts.map