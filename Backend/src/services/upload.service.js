import UploadSession from "../models/uploadSession.model.js";
import User from "../models/user.model.js";

const PUBLIC_UPLOAD_PREFIX = "/uploads";

export const toAttachment = (file) => ({
    url: `${PUBLIC_UPLOAD_PREFIX}/${file.filename}`,
    fileType: file.mimetype,
    size: file.size,
    name: file.originalname,
});

export const processAvatarUpload = async (file, userId) => {
    const attachment = toAttachment(file);
    if (userId) {
        await User.findByIdAndUpdate(userId, { avatar: attachment.url }, { new: true });
    }
    return attachment;
};

export const processSingleUpload = async (file, userId, uploadId) => {
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

export const registerSessionService = async (userId, bodyData) => {
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

export const markInterruptedService = async (uploadId) => {
    if (!uploadId) return;

    await UploadSession.findOneAndUpdate(
        { uploadId, status: { $ne: "completed" } },
        { $set: { status: "interrupted" } }
    );
};

export const getUploadSessionStatusService = async (uploadId, userId) => {
    const session = await UploadSession.findOne({ uploadId, uploader: userId });
    if (!session) {
        throw { status: 404, message: "No such upload session" };
    }
    return session;
};
