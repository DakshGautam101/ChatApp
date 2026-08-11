import { body } from "express-validator";

const registerSchema = [
    body("username")
        .trim()
        .notEmpty().withMessage("Username is required")
        .isLength({ min: 3 }).withMessage("Username must be at least 3 characters long"),
    body("email")
        .trim()
        .isEmail().withMessage("Please provide a valid email"),
    body("password")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
];

const loginSchema = [
    body("email")
        .trim()
        .isEmail().withMessage("Please provide a valid email"),
    body("password")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
];

const verifyOtpSchema = [
    body("email")
        .trim()
        .isEmail().withMessage("Please provide a valid email"),
    body("otp")
        .isLength({ min: 4 }).withMessage("OTP must be at least 4 characters long"),
];

const resendOtpSchema = [
    body("email")
        .trim()
        .isEmail().withMessage("Please provide a valid email"),
];

export { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema };

