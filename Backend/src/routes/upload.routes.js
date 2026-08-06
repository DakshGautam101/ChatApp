import express from "express";
import upload from "../config/multer.js";
import { uploadOneFile, uploadMultipleFiles } from "../controllers/multer.controller.js";
import {verifyAuth} from "../middleware/verifyAuth.middleware.js"
const router = express.Router();

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

export default router;