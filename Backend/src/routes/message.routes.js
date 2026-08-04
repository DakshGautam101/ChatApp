import express from "express";
import { verifyAuth } from "../middleware/verifyAuth.middleware.js";
import {getConversation, getMessages} from "../controllers/message.controller.js"

const router = express.Router();
router.get("/conversations", verifyAuth, getConversation);
router.get("/:conversationId", verifyAuth, getMessages);

export default router;