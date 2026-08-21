import express from "express";
import { signup, login, logout, verifyUserEmailOtp, resendEmailOtp, me } from "../controllers/auth.controller.js";
import validate from "../middleware/validation.middleware.js";
import { verifyAuth } from "../middleware/verifyAuth.middleware.js";
import { loginSchema, registerSchema, resendOtpSchema, verifyOtpSchema } from "../validation/validator.js";
const router = express.Router();
router.post("/signup", validate(registerSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/logout", logout);
router.post("/verify-email-otp", validate(verifyOtpSchema), verifyUserEmailOtp);
router.post("/resend-email-otp", validate(resendOtpSchema), resendEmailOtp);
router.get("/me", verifyAuth, me);
export default router;
//# sourceMappingURL=auth.routes.js.map