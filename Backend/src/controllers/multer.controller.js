import {
    toAttachment,
    processSingleUpload,
    registerSessionService,
    markInterruptedService,
    getUploadSessionStatusService,
    processAvatarUpload,
} from "../services/upload.service.js";
import { sendError, sendSuccess } from "../utils/response.js";


export const uploadAvatar = async (req, res, next) => {
    try {
        if (!req.file) {
            return sendError(res, 400, "No file uploaded");
        }

        const userId = req.user?.id;
        const attachment = await processAvatarUpload(req.file, userId);

        return sendSuccess(res, 200, { file: attachment }, "File uploaded successfully");
    } catch (error) {
        next(error);
    }
};

export const uploadOneFile = async (req, res, next) => {
    try {
        if (!req.file) {
            return sendError(res, 400, "No file uploaded");
        }

        const uploadId = req.body?.uploadId;
        const userId = req.user?.id;
        const attachment = await processSingleUpload(req.file, userId, uploadId);

        return sendSuccess(res, 200, { file: attachment }, "File uploaded successfully");
    } catch (error) {
        next(error);
    }
};

export const uploadMultipleFiles = async (req, res, next) => {
    try {
        if (!req.files || req.files.length === 0) {
            return sendError(res, 400, "No files uploaded");
        }

        const attachments = req.files.map(toAttachment);

        return sendSuccess(res, 200, { files: attachments }, "Files uploaded successfully");
    } catch (error) {
        next(error);
    }
};

export const registerUploadSession = async (req, res, next) => {
    try {
        const session = await registerSessionService(req.user.id, req.body);
        return sendSuccess(res, 200, { session });
    } catch (error) {
        if (error.status) {
            return sendError(res, error.status, error.message);
        }
        next(error);
    }
};

export const markUploadInterrupted = async (req, res) => {
    try {
        const uploadId = req.body?.uploadId;
        await markInterruptedService(uploadId);
        return res.status(204).end();
    } catch (error) {
        return res.status(204).end();
    }
};

export const getUploadSessionStatus = async (req, res, next) => {
    try {
        const { uploadId } = req.params;
        const session = await getUploadSessionStatusService(uploadId, req.user.id);
        return sendSuccess(res, 200, { session });
    } catch (error) {
        if (error.status) {
            return sendError(res, error.status, error.message);
        }
        next(error);
    }
};

// IndexDb in browser ...
