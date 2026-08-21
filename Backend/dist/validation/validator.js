import { body } from "express-validator";
const registerSchema = [
    body("username")
        .trim()
        .notEmpty().withMessage("Username is required")
        .isLength({ min: 3, max: 30 }).withMessage("Username must be between 3 and 30 characters"),
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),
    body("phone")
        .trim()
        .notEmpty().withMessage("Phone number is required")
        .matches(/^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9]{6,15}$/).withMessage("Please provide a valid phone number"),
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
];
const loginSchema = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),
    body("password")
        .notEmpty().withMessage("Password is required")
        .isLength({ min: 6 }).withMessage("Password must be at least 6 characters long"),
];
const verifyOtpSchema = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),
    body("otp")
        .trim()
        .notEmpty().withMessage("OTP is required")
        .isLength({ min: 6, max: 6 }).withMessage("OTP must be exactly 6 digits")
        .matches(/^\d{6}$/).withMessage("OTP must contain only digits"),
];
const resendOtpSchema = [
    body("email")
        .trim()
        .notEmpty().withMessage("Email is required")
        .isEmail().withMessage("Please provide a valid email address")
        .normalizeEmail(),
];
export { registerSchema, loginSchema, verifyOtpSchema, resendOtpSchema };
//# sourceMappingURL=validator.js.map