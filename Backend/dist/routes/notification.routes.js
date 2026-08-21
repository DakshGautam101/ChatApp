import express from "express";
import { verifyAuth } from "../middleware/verifyAuth.middleware.js";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification, } from "../controllers/notification.controller.js";
const router = express.Router();
router.get("/", verifyAuth, getNotifications);
router.patch("/read-all", verifyAuth, markAllAsRead);
router.patch("/:id/read", verifyAuth, markAsRead);
router.delete("/:id", verifyAuth, deleteNotification);
export default router;
//# sourceMappingURL=notification.routes.js.map