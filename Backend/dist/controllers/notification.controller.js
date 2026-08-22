import Notification from "../models/notification.model.js";
import { sendError, sendSuccess } from "../utils/response.js";
export const getNotifications = async (req, res, next) => {
    try {
        if (!req.user) {
            return sendError(res, 401, "Unauthorized");
        }
        const userId = req.user.id;
        const notifications = await Notification.find({ recipient: userId })
            .sort({ createdAt: -1 })
            .limit(30)
            .populate("sender", "username email avatar status");
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false,
        });
        return sendSuccess(res, 200, { notifications, unreadCount });
    }
    catch (error) {
        next(error);
    }
};
export const markAsRead = async (req, res, next) => {
    try {
        if (!req.user) {
            return sendError(res, 401, "Unauthorized");
        }
        const userId = req.user.id;
        const { id } = req.params;
        const notification = await Notification.findOneAndUpdate({ _id: id, recipient: userId }, { $set: { isRead: true } }, { new: true });
        if (!notification) {
            return sendError(res, 404, "Notification not found");
        }
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false,
        });
        return sendSuccess(res, 200, { notification, unreadCount });
    }
    catch (error) {
        next(error);
    }
};
export const markAllAsRead = async (req, res, next) => {
    try {
        if (!req.user) {
            return sendError(res, 401, "Unauthorized");
        }
        const userId = req.user.id;
        await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });
        return sendSuccess(res, 200, { unreadCount: 0 }, "All notifications marked as read");
    }
    catch (error) {
        next(error);
    }
};
export const deleteNotification = async (req, res, next) => {
    try {
        if (!req.user) {
            return sendError(res, 401, "Unauthorized");
        }
        const userId = req.user.id;
        const { id } = req.params;
        await Notification.deleteOne({ _id: id, recipient: userId });
        const unreadCount = await Notification.countDocuments({
            recipient: userId,
            isRead: false,
        });
        return sendSuccess(res, 200, { unreadCount }, "Notification deleted");
    }
    catch (error) {
        next(error);
    }
};
//# sourceMappingURL=notification.controller.js.map