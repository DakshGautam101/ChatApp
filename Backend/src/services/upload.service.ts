import { GetObjectAclCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import UploadSession from "../models/uploadSession.model.js";
import User from "../models/user.model.js";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import s3Client from "../config/aws-s3.config.js";
import logger from "../utils/logger.js";
import type { S3File } from "../Interfaces/BacknedInterfaces.js";


const PUBLIC_UPLOAD_PREFIX = "/uploads";

export const toAttachment = (file : S3File) => ({
    url: file.location,
    key : file.key,
    fileType: file.mimetype,
    size: file.size,
    name: file.originalname,
});

export const downloadUrlService = async(key : string , originalFileName : string)=>{
    try {
        const command = new GetObjectCommand({
            Bucket : process.env.AWS_BUCKET_NAME,
            Key : key,
            ResponseContentDisposition : `attachment; filename="${encodeURIComponent(originalFileName || "download")}"`,
        });
        return await getSignedUrl(s3Client , command , {expiresIn : 900});
    } catch (error) {
        logger?.error("Error generating download URL:", error);
        throw error;
    }
};

export const processAvatarUpload = async (file : S3File, userId : string) => {
    const attachment = toAttachment(file);
    if (userId) {
        await User.findByIdAndUpdate(userId, { avatar: attachment.url }, { new: true });
    }
    return attachment;
};

export const processSingleUpload = async (file : S3File, userId : string, uploadId : string) => {
    const attachment = toAttachment(file);

    if (uploadId) {
        await UploadSession.findOneAndUpdate(
            { uploadId },
            {
                uploadId,
                uploader: userId,
                filename: file.originalname,
                mimetype: file.mimetype,
                size: file.size,
                status: "completed",
                url: attachment.url,
                $inc: { attempts: 1 },
            },
            { upsert: true, setDefaultsOnInsert: true }
        );
    }

    return attachment;
};

export const registerSessionService = async (userId : string, bodyData : any) => {
    const { uploadId, filename, mimetype, size, conversationId } = bodyData || {};
    if (!uploadId || !filename) {
        throw { status: 400, message: "uploadId and filename are required" };
    }

    const session = await UploadSession.findOneAndUpdate(
        { uploadId },
        {
            $setOnInsert: {
                uploadId,
                uploader: userId,
                conversation: conversationId || null,
                filename,
                mimetype: mimetype || null,
                size: size || null,
            },
            $set: { status: "uploading" },
            $inc: { attempts: 1 },
        },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true }
    );

    return session;
};

export const markInterruptedService = async (uploadId : string) => {
    if (!uploadId) return;

    await UploadSession.findOneAndUpdate(
        { uploadId, status: { $ne: "completed" } },
        { $set: { status: "interrupted" } }
    );
};

export const getUploadSessionStatusService = async (uploadId : string, userId : string) => {
    const session = await UploadSession.findOne({ uploadId, uploader: userId });
    if (!session) {
        throw { status: 404, message: "No such upload session" };
    }
    return session;
};
