import type { NextFunction, Request, Response } from "express";
export declare const uploadAvatar: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const uploadOneFile: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const uploadMultipleFiles: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const registerUploadSession: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const markUploadInterrupted: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUploadSessionStatus: (req: Request, res: Response, next: NextFunction) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=multer.controller.d.ts.map