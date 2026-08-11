import express from "express";
import upload from "../config/multer.js";
import {
    uploadOneFile,
    uploadMultipleFiles,
    registerUploadSession,
    markUploadInterrupted,
    getUploadSessionStatus,
    uploadAvatar,
} from "../controllers/multer.controller.js";
import { verifyAuth } from "../middleware/verifyAuth.middleware.js";

const router = express.Router();

router.post(
    "/avatar",
    upload.single("file"),
    uploadAvatar
);

router.post(
    "/single",
    verifyAuth,
    upload.single("file"),
    uploadOneFile
);

router.post(
    "/multiple",
    verifyAuth,
    upload.array("files", 10),
    uploadMultipleFiles
);

router.post("/session/start", verifyAuth, registerUploadSession);
router.get("/session/:uploadId", verifyAuth, getUploadSessionStatus);

router.post("/interrupt", markUploadInterrupted);

export default router;
