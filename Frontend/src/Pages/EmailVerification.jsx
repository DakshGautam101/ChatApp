import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCwIcon, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";
import useAuthStore from "../Stores/useAuthStore";
import AnimatedBackground from "@/components/AnimatedBackground";
import { cn } from "@/lib/utils";

const RESEND_COOLDOWN = 30;

const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { staggerChildren: 0.05 } 
    }
};

const slotVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 10 },
    visible: { 
        opacity: 1, 
        scale: 1, 
        y: 0,
        transition: { type: "spring", stiffness: 300, damping: 20 }
    }
};

export function EmailVerification() {
    const navigate = useNavigate();
    const { user, isVerified, verifyEmail, resendEmail, isLoading } = useAuthStore();
    const [otp, setOtp] = useState("");
    const [otpError, setOtpError] = useState("");
    const [cooldown, setCooldown] = useState(0);
    const timerRef = useRef(null);

    useEffect(() => {
        if (isVerified) {
            navigate("/");
        }
    }, [isVerified, navigate]);

    useEffect(() => {
        if (cooldown <= 0) return;
        timerRef.current = setTimeout(() => setCooldown((c) => c - 1), 1000);
        return () => clearTimeout(timerRef.current);
    }, [cooldown]);

    const handleVerify = async () => {
        if (!user?.email) {
            toast.error("No email found for this account.");
            return;
        }

        if (otp.length !== 6) {
            setOtpError("Enter all 6 digits.");
            return;
        }

        try {
            setOtpError("");
            await verifyEmail(user.email, otp);
            toast.success("Email verified successfully.");
            navigate("/");
        } catch (error) {
            const msg = error?.response?.data?.message || "Unable to verify your email.";
            setOtpError(msg);
            toast.error(msg);
        }
    };

    const handleResend = async () => {
        if (!user?.email || cooldown > 0) return;

        try {
            await resendEmail(user.email);
            toast.success("A new verification code has been sent.");
            setCooldown(RESEND_COOLDOWN);
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to resend the code.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-background px-4 relative overflow-hidden">
            <AnimatedBackground />
            <div className="absolute inset-0 grain-noise opacity-30 mix-blend-overlay pointer-events-none" />
            
            <motion.div 
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, type: "spring", bounce: 0.3 }}
                className="w-full max-w-md z-10"
            >
                <Card className="w-full border-none shadow-2xl glass sm:border">
                    <CardHeader className="space-y-4 text-center">
                        <motion.div 
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.2 }}
                            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background animate-float"
                        >
                            <Mail className="h-6 w-6" />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <CardTitle className="text-2xl font-bold tracking-tight text-gradient">
                                Verify your email
                            </CardTitle>

                            <CardDescription className="mt-2 text-sm leading-6">
                                We've sent a 6-digit code to
                                <br />
                                <span className="font-semibold text-foreground">
                                    {user?.email || "your email"}
                                </span>
                            </CardDescription>
                        </motion.div>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        <Field className="space-y-3">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="flex items-center justify-between"
                            >
                                <FieldLabel>
                                    Verification code
                                </FieldLabel>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="gap-2 text-xs transition-transform hover:scale-105"
                                    onClick={handleResend}
                                    disabled={isLoading || cooldown > 0}
                                >
                                    <RefreshCwIcon className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
                                    {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
                                </Button>
                            </motion.div>

                            <InputOTP
                                maxLength={6}
                                value={otp}
                                onChange={(val) => {
                                    setOtp(val);
                                    if (otpError) setOtpError("");
                                }}
                                className="justify-center"
                            >
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: 0.5 }}
                                    className="flex justify-center w-full"
                                >
                                    <InputOTPGroup className="gap-2">
                                        {[0, 1, 2, 3, 4, 5].map((i) => (
                                            <InputOTPSlot
                                                key={i}
                                                index={i}
                                                aria-invalid={!!otpError}
                                                className="h-14 w-12 rounded-lg border text-lg transition-transform focus:scale-110 focus:ring-2 focus:ring-primary/20 bg-background/50"
                                            />
                                        ))}
                                    </InputOTPGroup>
                                </motion.div>
                            </InputOTP>

                            {otpError ? (
                                <motion.p 
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    className="text-center text-xs text-destructive"
                                >
                                    {otpError}
                                </motion.p>
                            ) : (
                                <motion.p 
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.6 }}
                                    className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground"
                                >
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    Codes expire after a few minutes for your security
                                </motion.p>
                            )}
                        </Field>

                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.7 }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <Button
                                className="h-11 w-full gap-2 text-base relative overflow-hidden"
                                onClick={handleVerify}
                                disabled={isLoading || otp.length !== 6}
                            >
                                {isLoading ? (
                                    <RefreshCwIcon className="h-4 w-4 animate-spin" />
                                ) : null}
                                {isLoading ? "Verifying…" : "Verify email"}
                                {!isLoading && otp.length === 6 && (
                                    <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />
                                )}
                            </Button>
                        </motion.div>
                    </CardContent>

                    <CardFooter className="justify-center pt-0">
                        <motion.p 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                            className="text-center text-sm text-muted-foreground"
                        >
                            Didn't receive the code?
                            <button
                                className="ml-1 font-medium text-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                                onClick={handleResend}
                                disabled={isLoading || cooldown > 0}
                            >
                                Send again
                            </button>
                        </motion.p>
                    </CardFooter>
                </Card>
            </motion.div>
        </div>
    );
}