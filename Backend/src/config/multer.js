import multer from "multer";
import path from "path";
import multerS3 from "multer-s3";
import s3Client from "./aws-s3.config.js";


const allowedChatMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "video/mp4"
];

const allowedChatExtensions = [
    ".jpg", ".jpeg", ".png", ".gif", ".pdf", ".docx", ".mp4"
];

const allowedAvatarMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp"
];

const allowedAvatarExtensions = [
    ".jpg", ".jpeg", ".png", ".gif", ".webp"
];

function checkChatFileType(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedChatMimeTypes.includes(file.mimetype) && allowedChatExtensions.includes(ext)) {
        cb(null, true);
    } else {
        const error = new Error("Unsupported file type. Supported types: JPEG, PNG, GIF, PDF, DOCX, MP4");
        error.statusCode = 400;
        cb(error, false);
    }
}

function checkAvatarFileType(req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedAvatarMimeTypes.includes(file.mimetype) && allowedAvatarExtensions.includes(ext)) {
        cb(null, true);
    } else {
        const error = new Error("Unsupported avatar format. Only JPEG, PNG, GIF, and WEBP images are allowed");
        error.statusCode = 400;
        cb(error, false);
    }
}

const storage = multer.diskStorage({
    destination(req, file, cb) {
        cb(null, "uploads/");
    },
    filename(req, file, cb) {
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBaseName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9-_]/g, "_").slice(0, 50);
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, `${safeBaseName}-${uniqueSuffix}${ext}`);
    },
});

const s3Storage = multerS3({
    s3 : s3Client,
    bucket : process.env.AWS_BUCKET_NAME,
    contentType : multerS3.AUTO_CONTENT_TYPE,
    metadata : (req,file,cb)=>{
        cb(null , {fieldName : file.fieldname});
    },
    key : (req , file , cb)=>{
        const ext = path.extname(file.originalname).toLowerCase();
        const safeBaseName = path.basename(file.originalname,ext).replace(/[^a-zA-Z0-9-_]/g, "_");
        const folder = file.fieldname === "avatar" ? "avatars" : "attachments";
        cb(null , `${folder}/${safeBaseName}-${Date.now()}${ext}`);
    },
});



export const avatarUpload = multer({
    storage : s3Storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
    fileFilter: checkAvatarFileType,
});

export const chatUpload = multer({
    storage : s3Storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB
    fileFilter: checkChatFileType,
});

export default chatUpload;
