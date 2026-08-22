import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateOtp from "../helper/generateOtp.js";
import generateToken from "../helper/generateToken.js";
import { verifyEmail } from "./email.service.js";
import { setAuthCookie } from "../utils/authCookie.js";
import cacheService from "./cache.service.js";
import logger from "../utils/logger.js";
const findUserByEmail = async (email) => {
    return await User.findOne({ email: email.toLowerCase() });
};
const checkExistingUser = async (email) => {
    const user = await User.findOne({ email: email.toLowerCase() });
    return Boolean(user && user.isVerified);
};
const checkExistingUserByID = async (id) => {
    return Boolean(await User.findById(id));
};
const createUserWithOtp = async ({ username, email, phone, password, avatar }) => {
    const normalizedEmail = email.toLowerCase();
    const hashedPassword = await bcrypt.hash(String(password), 12);
    const otp = generateOtp(6);
    let user = await User.findOne({ email: normalizedEmail });
    if (user && !user.isVerified) {
        user.username = username;
        user.phone = phone;
        user.password = String(hashedPassword);
        if (avatar !== undefined)
            user.avatar = avatar || "";
        await user.save();
    }
    else {
        user = new User({
            username,
            email: normalizedEmail,
            phone,
            password: hashedPassword,
            avatar: avatar || "",
            isVerified: false,
        });
        await user.save();
    }
    await cacheService.set(`otp:${normalizedEmail}`, otp, 300);
    // user.generatedOtp = otp;
    return user;
};
const issueToken = (user) => generateToken(user, Number(user.tokenVersion));
const attachAuthResponse = (res, user) => {
    const token = issueToken(user);
    setAuthCookie(res, token);
    return token;
};
const createSafeUserResponse = async (userId) => {
    return User.findById(userId).select("-password");
};
const sendVerificationEmail = async (email) => {
    try {
        const otp = await cacheService.get(`otp:${email}`);
        if (!otp) {
            logger.error("otp not found");
        }
        await verifyEmail(email.toLowerCase(), Number(otp));
    }
    catch (error) {
        logger.error("Email verification failed:", { error: error.message, stack: error.stack });
    }
};
export { findUserByEmail, checkExistingUser, checkExistingUserByID, createUserWithOtp, issueToken, attachAuthResponse, createSafeUserResponse, sendVerificationEmail, };
//# sourceMappingURL=auth.service.js.map