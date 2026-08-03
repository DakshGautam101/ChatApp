import express from "express";
import { signup, login, logout, verifyUserEmailOtp, resendEmailOtp, me } from "../controllers/auth.controller.js";
import { verifyAuth } from "../middleware/verifyAuth.middleware.js";

const router = express.Router();

router.post("/signup", signup);
router.post("/login", login);
router.post("/logout", logout);
router.post("/verify-email-otp", verifyUserEmailOtp);
router.post("/resend-email-otp", resendEmailOtp);
router.get("/me", verifyAuth, me);

export default router;