import jwt from "jsonwebtoken";
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
import { getIO } from "../socket/socket.js";
import cacheService from "../services/cache.service.js";
import type { NextFunction, Request, Response } from "express";

export const signup = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { username, email, phone, password, avatar } = req.body;
        const normalizedEmail = email ? email.toLowerCase().trim() : "";

        if (await checkExistingUser(normalizedEmail)) {
            return sendError(res, 400, "An account with this email is already registered and verified. Please sign in.");
        }

        const user = await createUserWithOtp({
            username: String(username?.trim()),
            email: String(normalizedEmail),
            password,
            phone: String(phone?.trim()),
            avatar,
        });

        await sendVerificationEmail(normalizedEmail);

        return sendSuccess(
            res,
            201,
            {
                user: {
                    id: user._id,
                    email: user.email,
                    username: user.username,
                    phone: user.phone,
                    avatar: user.avatar,
                    isVerified: false,
                },
            },
            "Signup successful. A 6-digit verification code has been sent to your email."
        );
    } catch (error) {
        next(error);
    }
};

export const login = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return sendError(res, 400, "Please fill all the fields");
        }

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail }).select("+password +isVerified +tokenVersion");
        if (!user) {
            return sendError(res, 404, "User does not exist");
        }

        if (!user.isVerified) {
            return sendError(res, 403, "Please verify your email before logging in");
        }

        const isPasswordCorrect = await bcrypt.compare(password, String(user.password));
        if (!isPasswordCorrect) {
            return sendError(res, 400, "Invalid credentials");
        }

        const token = attachAuthResponse(res, user);
        const safeUser = await createSafeUserResponse(String(user._id));

        return sendSuccess(res, 200, { token, user: safeUser }, "Login successful");
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
    try {
        let userId = req.user?.id;

        if (!userId) {
            let token = req.cookies?.token;
            if (!token && req.headers.authorization) {
                if (req.headers.authorization.startsWith("Bearer ")) {
                    token = req.headers.authorization.split(" ")[1];
                } else {
                    token = req.headers.authorization;
                }
            }
            if (token) {
                try {
                    type DecodedType = {
                        id: string,
                        tokenVersion: number
                    }
                    const decoded = jwt.decode(token) as DecodedType | null;
                    userId = decoded?.id;
                } catch (e) {
                    // Ignore decode error
                }
            }
        }

        if (userId) {
            await User.findByIdAndUpdate(userId, { $inc: { tokenVersion: 1 } });
            try {
                const io = getIO();
                if (io) {
                    io.in(`user_${userId}`).disconnectSockets(true);
                }
            } catch (e) {
                // Ignore socket disconnect error
            }
        }

        clearAuthCookie(res);
        return sendSuccess(res, 200, {}, "Logged out");
    } catch (error) {
        next(error);
    }
};

export const verifyUserEmailOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return sendError(res, 400, "Email and OTP are required");

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return sendError(res, 400, "Invalid request. User not found.");

        const cachedOtp = await cacheService.get(`otp:${normalizedEmail}`);
        if (!cachedOtp) {
            return sendError(res, 400, "OTP expired or invalid. Please request a new one.");
        }

        if (String(cachedOtp) !== String(otp).trim()) {
            return sendError(res, 400, "Invalid OTP code");
        }

        user.isVerified = true;
        await user.save();

        await cacheService.del(`otp:${normalizedEmail}`);
        await cacheService.del(`user:profile:${user._id}`);

        const token = attachAuthResponse(res, user);
        const safeUser = await createSafeUserResponse(String(user._id));
        return sendSuccess(res, 200, { token, user: safeUser }, "Email verified successfully");
    } catch (error) {
        next(error);
    }
};

export const resendEmailOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email } = req.body;
        if (!email) return sendError(res, 400, "Email is required");

        const normalizedEmail = email.toLowerCase().trim();
        const user = await User.findOne({ email: normalizedEmail });
        if (!user) return sendError(res, 400, "User does not exist");
        if (user.isVerified) return sendError(res, 400, "User already verified");

        const otp = generateOtp(6);
        await cacheService.set(`otp:${normalizedEmail}`, otp, 300);

        await sendVerificationEmail(normalizedEmail);

        return sendSuccess(res, 200, {}, "A new 6-digit OTP has been sent to your email");
    } catch (error) {
        next(error);
    }
};

export const me = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = req.user?.id;
        if (!userId) return sendError(res, 401, "Unauthorized");

        const cacheKey = `user:profile:${userId}`;
        const cachedUser = await cacheService.get(cacheKey);
        if (cachedUser) {
            return sendSuccess(res, 200, { user: cachedUser });
        }

        const exists = await checkExistingUserByID(userId);
        if (!exists) return sendError(res, 404, "User not found");

        const user = await User.findById(userId).select("-password").lean();
        if (user) {
            await cacheService.set(cacheKey, user, 3600);
        }
        return sendSuccess(res, 200, { user });
    } catch (err) {
        next(err);
    }
};