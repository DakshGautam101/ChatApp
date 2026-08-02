import express from "express";

import {signup , login , logout , verifyUserEmailOtp, resendEmailOtp} from "../controllers/auth.controller.js"; 

const router = express.Router();

router.post("/signup" , signup);
router.post("/login" , login);
router.post("/logout" , logout);
router.post("/verify-email-otp" , verifyUserEmailOtp);
router.post("/resend-email-otp" , resendEmailOtp);

export default router;