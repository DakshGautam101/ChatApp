import User from "../models/user.model.js";
import { getSockets } from "../socket/socket.js";

export const fetchUserList = async (currentUserId : string) => {
    const users = await User.find({ _id: { $ne: currentUserId } })
        .select("username email avatar status createdAt")
        .lean();

    const currentUser = await User.findById(currentUserId).select("friends").lean();
    const friendIdsSet = new Set((currentUser?.friends || []).map((fId) => fId.toString()));

    return users.map((user) => {
        const isOnline = getSockets(user._id.toString()).length > 0;
        return {
            ...user,
            status: isOnline ? "online" : "offline",
            isFriend: friendIdsSet.has(user._id.toString()),
        };
    });
};
