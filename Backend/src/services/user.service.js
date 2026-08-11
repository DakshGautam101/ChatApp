import User from "../models/user.model.js";

export const fetchUserList = async (currentUserId) => {
    const users = await User.find({ _id: { $ne: currentUserId } })
        .select("username email avatar status createdAt")
        .lean();

    const currentUser = await User.findById(currentUserId).select("friends").lean();
    const friendIdsSet = new Set((currentUser?.friends || []).map((fId) => fId.toString()));

    return users.map((user) => ({
        ...user,
        isFriend: friendIdsSet.has(user._id.toString()),
    }));
};
