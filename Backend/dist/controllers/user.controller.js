import User from "../models/user.model.js";
import { fetchUserList } from "../services/user.service.js";
import { sendSuccess, sendError } from "../utils/response.js";
import cacheService from "../services/cache.service.js";
const getUserList = async function (req, res, next) {
    try {
        const data = await fetchUserList(req.user.id);
        return sendSuccess(res, 200, { data });
    }
    catch (error) {
        next(error);
    }
};
const updateProfile = async function (req, res, next) {
    try {
        const userId = req.user.id;
        const { username, phone, avatar } = req.body;
        const updates = {};
        if (username !== undefined)
            updates.username = username;
        if (phone !== undefined)
            updates.phone = phone;
        if (avatar !== undefined)
            updates.avatar = avatar;
        const updatedUser = await User.findByIdAndUpdate(userId, updates, { new: true }).select("-password");
        if (!updatedUser) {
            return sendError(res, 404, "User not found");
        }
        await cacheService.del(`user:profile:${userId}`);
        return sendSuccess(res, 200, { user: updatedUser }, "Profile updated successfully");
    }
    catch (error) {
        next(error);
    }
};
export { getUserList, updateProfile };
//# sourceMappingURL=user.controller.js.map