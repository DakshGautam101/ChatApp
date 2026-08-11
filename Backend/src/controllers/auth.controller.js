import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateOtp from "../helper/generateOtp.js";
import {
    attachAuthResponse,
    checkExistingUser,
    checkExistingUserByID,
    createSafeUserResponse,
    createUserWithOtp,
    sendVerificationEmail,
} from "../services/auth.service.js";
import { sendError, sendSuccess } from "../utils/response.js";
import { clearAuthCookie } from "../utils/authCookie.js";

export const signup = async (req, res, next) => {
    try {
        const { username, email, phone , password, avatar } = req.body;

        if (await checkExistingUser(email)) {
            return sendError(res, 400, "User already exists");
        }

        const user = await createUserWithOtp({ username, email, password, phone, avatar });
        await sendVerificationEmail(email, user.emailVerificationOtp);
        const token = attachAuthResponse(res, user);

        return sendSuccess(res, 201, {
            token,
            user: {
                id: user._id,
                email: user.email,
                username: user.username,
                phone: user.phone,
                avatar: user.avatar,
                isVerified: user.isVerified,
            },
        }, "Signup successful. Verification email sent.");
    } catch (error) {
        next(error);
    }
};

export const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 400, "Please fill all the fields");
        }

        const user = await User.findOne({ email }).select("+password +isVerified");
        if (!user) {
            return sendError(res, 404, "User does not exist");
        }

        if (!user.isVerified) {
            return sendError(res, 403, "Please verify your email before logging in");
        }

        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return sendError(res, 400, "Invalid credentials");
        }

        const token = attachAuthResponse(res, user);
        const safeUser = await createSafeUserResponse(user._id);

        return sendSuccess(res, 200, { token, user: safeUser }, "Login successful");
    } catch (error) {
        next(error);
    }
};

export const logout = async (req, res, next) => {
    try {
        clearAuthCookie(res);
        return sendSuccess(res, 200, {}, "Logged out");
    } catch (error) {
        next(error);
    }
};

export const verifyUserEmailOtp = async (req, res, next) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return sendError(res, 400, "Email and otp required");

        const user = await User.findOne({ email }).select("+emailVerificationOtp +emailVerificationOtpExpires");
        if (!user) return sendError(res, 400, "Invalid request");

        if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires) {
            return sendError(res, 400, "No OTP requested for this account");
        }

        if (user.emailVerificationOtp !== otp) {
            return sendError(res, 400, "Invalid OTP");
        }

        if (Date.now() > user.emailVerificationOtpExpires) {
            return sendError(res, 400, "OTP expired");
        }

        user.isVerified = true;
        user.emailVerificationOtp = undefined;
        user.emailVerificationOtpExpires = undefined;
        await user.save();

        const token = attachAuthResponse(res, user);
        const safeUser = await createSafeUserResponse(user._id);
        return sendSuccess(res, 200, { token, user: safeUser }, "Email verified successfully");
    } catch (error) {
        next(error);
    }
};

export const resendEmailOtp = async (req, res, next) => {
    try {
        const { email } = req.body;
        if (!email) return sendError(res, 400, "Email required");

        const user = await User.findOne({ email });
        if (!user) return sendError(res, 400, "User does not exist");
        if (user.isVerified) return sendError(res, 400, "User already verified");

        const otp = generateOtp(6);
        user.emailVerificationOtp = otp;
        user.emailVerificationOtpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        await sendVerificationEmail(email, otp);

        return sendSuccess(res, 200, {}, "OTP resent");
    } catch (error) {
        next(error);
    }
};

export const me = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) return sendError(res, 401, "Unauthorized");

        const exists = await checkExistingUserByID(userId);
        if (!exists) return sendError(res, 404, "User not found");

        const user = await User.findById(userId).select("-emailVerificationOtp -emailVerificationOtpExpires -password");
        return sendSuccess(res, 200, { user });
    } catch (err) {
        next(err);
    }
};