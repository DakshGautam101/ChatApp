import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateOtp from "../helper/generateOtp.js";
import generateToken from "../helper/generateToken.js";
import { verifyEmail } from "./email.service.js";
import { setAuthCookie } from "../utils/authCookie.js";

const checkExistingUser = async (email) => {
    return Boolean(await User.findOne({ email }));
};

const checkExistingUserByID = async (id) => {
    return Boolean(await User.findById(id));
};

const createUserWithOtp = async ({ username, email,phone , password, avatar }) => {
    const hashedPassword = await bcrypt.hash(password, 12);
    const otp = generateOtp(6);
    const user = new User({
        username,
        email,
        phone,
        password: hashedPassword,
        avatar: avatar || "",
        emailVerificationOtp: otp,
        emailVerificationOtpExpires: Date.now() + 10 * 60 * 1000,
    });

    await user.save();
    return user;
};

const issueToken = (user) => generateToken(user._id);

const attachAuthResponse = (res, user) => {
    const token = issueToken(user);
    setAuthCookie(res, token);
    return token;
};

const createSafeUserResponse = async (userId) => {
    return User.findById(userId).select("-emailVerificationOtp -emailVerificationOtpExpires -password");
};

const sendVerificationEmail = async (email, otp) => {
    try {
        await verifyEmail(email, otp);
    } catch (error) {
        console.error("Email verification failed", error);
    }
};

export {
    checkExistingUser,
    checkExistingUserByID,
    createUserWithOtp,
    issueToken,
    attachAuthResponse,
    createSafeUserResponse,
    sendVerificationEmail,
};