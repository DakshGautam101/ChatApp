import express from "express";
import { chatUpload, avatarUpload } from "../config/multer.js";
import { uploadOneFile, uploadMultipleFiles, registerUploadSession, markUploadInterrupted, getUploadSessionStatus, uploadAvatar, } from "../controllers/multer.controller.js";
import { verifyAuth, optionalAuth } from "../middleware/verifyAuth.middleware.js";
const router = express.Router();
router.post("/avatar", optionalAuth, avatarUpload.single("file"), uploadAvatar);
router.post("/single", verifyAuth, chatUpload.single("file"), uploadOneFile);
router.post("/multiple", verifyAuth, chatUpload.array("files", 10), uploadMultipleFiles);
router.post("/session/start", verifyAuth, registerUploadSession);
router.get("/session/:uploadId", verifyAuth, getUploadSessionStatus);
router.post("/interrupt", verifyAuth, markUploadInterrupted);
export default router;
//# sourceMappingURL=upload.routes.js.map