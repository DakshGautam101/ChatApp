import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import User from "../models/user.model.js";
import sendEmail from "../services/mailer.js";

const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

const generateOtp = (length = 6) => {
    const min = 10 ** (length - 1);
    const max = 10 ** length - 1;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
}

export const signup = async (req, res) => {
    try {
        const body = req.body;
        const { username, email, password, avatar } = body;

        if (!username || !email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: "Password must be at least 6 characters" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        const user = new User({ username, email, password: hashedPassword, avatar: avatar || "" });

        const otp = generateOtp(6);
        user.emailVerificationOtp = otp;
        user.emailVerificationOtpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

        await user.save();

        const subject = "Verify your email";
        const html = `<p>Hi ${username},</p><p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
        try {
            await sendEmail({ to: email, subject, html });
        } catch (mailErr) {
            console.error("Error sending verification email:", mailErr);
        }
        const token = generateToken(user._id);
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });
        res.status(201).json({
            success: true,
            message: "Signup successful. Verification email sent.",
            user: { id: user._id, email: user.email, username: user.username, isVerified: user.isVerified }
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error in signup controller function" });
    }
}

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ message: "Please fill all the fields" });
        }
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(400).json({ message: "User does not exist" });
        }
        // if (!user.isVerified) {
        //     return res.status(403).json({ message: "Please verify your email before logging in" });
        // }
        const isPasswordCorrect = await bcrypt.compare(password, user.password);
        if (!isPasswordCorrect) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        const token = generateToken(user._id);

        const safeUser = await User.findById(user._id).select('-emailVerificationOtp -emailVerificationOtpExpires -password');
        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
        res.status(200).json({
            success: true,
            token,
            user: safeUser
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error in login controller function" });
    }

}

export const logout = async (req, res) => {
    try {
        res.clearCookie("token",{
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });
        return res.status(200).json({ success: true, message: "Logged out" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error in logout controller function" });
    }
}

export const verifyUserEmailOtp = async (req, res) => {
    try {
        const { email, otp } = req.body;
        if (!email || !otp) return res.status(400).json({ message: "Email and otp required" });

        const user = await User.findOne({ email }).select('+emailVerificationOtp +emailVerificationOtpExpires');
        if (!user) return res.status(400).json({ message: "Invalid request" });

        if (!user.emailVerificationOtp || !user.emailVerificationOtpExpires) {
            return res.status(400).json({ message: "No OTP requested for this account" });
        }

        if (user.emailVerificationOtp !== otp) {
            return res.status(400).json({ message: "Invalid OTP" });
        }

        if (Date.now() > user.emailVerificationOtpExpires) {
            return res.status(400).json({ message: "OTP expired" });
        }

        user.isVerified = true;
        user.emailVerificationOtp = undefined;
        user.emailVerificationOtpExpires = undefined;
        await user.save();

        const token = generateToken(user._id);
        const safeUser = await User.findById(user._id).select('-emailVerificationOtp -emailVerificationOtpExpires -password');
        return res.status(200).json({ success: true, token, user: safeUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error in verifyUserEmailOtp" });
    }
}

export const resendEmailOtp = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email required" });

        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "User does not exist" });
        if (user.isVerified) return res.status(400).json({ message: "User already verified" });

        const otp = generateOtp(6);
        user.emailVerificationOtp = otp;
        user.emailVerificationOtpExpires = Date.now() + 10 * 60 * 1000;
        await user.save();

        const subject = "Your verification code";
        const html = `<p>Your verification code is <strong>${otp}</strong>. It expires in 10 minutes.</p>`;
        try { await sendEmail({ to: email, subject, html }); } catch (err) { console.error(err); }

        return res.status(200).json({ success: true, message: "OTP resent" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Internal server error in resendEmailOtp" });
    }
}

export const me = async (req, res) => {
    try {
        // verifyAuth middleware attaches decoded token to req.user
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const safeUser = await User.findById(userId).select('-emailVerificationOtp -emailVerificationOtpExpires -password');
        if (!safeUser) return res.status(404).json({ message: "User not found" });

        return res.status(200).json({ success: true, user: safeUser });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
};