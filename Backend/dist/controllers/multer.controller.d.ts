import type { NextFunction, Request, Response } from "express";
interface FileRequest {
    file: Express.Multer.File;
    user?: {
        id: string;
    };
    files?: Express.Multer.File[];
    body: {
        uploadId?: string;
    };
}
export declare const uploadAvatar: (req: FileRequest, res: Response, next: NextFunction) => Promise<any>;
export declare const uploadOneFile: (req: FileRequest, res: Response, next: NextFunction) => Promise<any>;
export declare const uploadMultipleFiles: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const registerUploadSession: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export declare const markUploadInterrupted: (req: Request, res: Response) => Promise<Response<any, Record<string, any>>>;
export declare const getUploadSessionStatus: (req: Request, res: Response, next: NextFunction) => Promise<any>;
export {};
//# sourceMappingURL=multer.controller.d.ts.map