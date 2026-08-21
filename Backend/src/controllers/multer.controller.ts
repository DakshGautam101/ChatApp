import type { NextFunction, Request, Response } from "express";
import {
    toAttachment,
    processSingleUpload,
    registerSessionService,
    markInterruptedService,
    getUploadSessionStatusService,
    processAvatarUpload,
} from "../services/upload.service.js";
import type { S3File } from "../Interfaces/BacknedInterfaces.js";
import { sendError, sendSuccess } from "../utils/response.js";



export const uploadAvatar = async (req:Request, res:Response, next:NextFunction) => {
    try {
        if (!req.file) {
            return sendError(res, 400, "No file uploaded");
        }

        const userId = req.user?.id;
        if(!req.file){
            sendError(res , 400 , "No file uploaded");
            return;
        }   
        const attachment = await processAvatarUpload(req.file as unknown as S3File, userId ?? "");

        return sendSuccess(res, 200, { file: attachment }, "File uploaded successfully");
    } catch (error) {
        next(error);
    }
};

export const uploadOneFile = async (req:Request, res:Response, next:NextFunction) => {
    try {
        if (!req.file) {
            return sendError(res, 400, "No file uploaded");
        }

        const uploadId = req.body?.uploadId;
        const userId = req.user?.id;
        const attachment = await processSingleUpload(req.file as unknown as S3File, userId ?? "", String(uploadId));

        return sendSuccess(res, 200, { file: attachment }, "File uploaded successfully");
    } catch (error) {
        next(error);
    }
};

export const uploadMultipleFiles = async (req: Request, res: Response, next: NextFunction) => {
    try {
        if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
            return sendError(res, 400, "No files uploaded");
        }

        const attachments = (req.files as unknown as S3File[]).map(toAttachment);

        return sendSuccess(res, 200, { files: attachments }, "Files uploaded successfully");
    } catch (error) {
        next(error);
    }
};

export const registerUploadSession = async (req:Request, res:Response, next:NextFunction) => {
    try {
        if(!req.user){
            return sendError(res,401,"unauthorized")
        }
        const session = await registerSessionService(req.user.id, req.body);
        return sendSuccess(res, 200, { session });
    } catch (error:any) {
        if (error.status) {
            return sendError(res, error.status, error.message);
        }
        next(error);
    }
};

export const markUploadInterrupted = async (req : Request , res : Response) => {
    try {
        const uploadId = req.body?.uploadId;
        await markInterruptedService(uploadId);
        return res.status(204).end();
    } catch (error) {
        return res.status(204).end();
    }
};

export const getUploadSessionStatus = async (req:Request, res:Response, next:NextFunction) => {
    try {
        const { uploadId } = req.params;
        if(!req.user){
            return sendError(res,401,"unauthorized")
        }
        const session = await getUploadSessionStatusService(uploadId as string, req.user.id);
        return sendSuccess(res, 200, { session });
    } catch (error:any) {
        if (error.status) {
            return sendError(res, error.status, error.message);
        }
        next(error);
    }
};

// IndexDb in browser ...
