import express from "express";
import { verifyAuth } from "../middleware/verifyAuth.middleware.js";
import { getConversation, getMessages, sendMessage } from "../controllers/message.controller.js";

const router = express.Router();
router.post("/send", verifyAuth, sendMessage);
router.post("/", verifyAuth, sendMessage);
router.get("/conversations", verifyAuth, getConversation);
router.get("/:conversationId", verifyAuth, getMessages);

export default router;