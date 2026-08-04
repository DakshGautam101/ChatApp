import express from "express";

const router = express.Router();
router.get("/conversations", verifyAuth, getConversations);
router.get("/:conversationId", verifyAuth, getMessages);

export default router;