import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCwIcon, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";

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

const RESEND_COOLDOWN = 30;

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
        <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4">
            <Card className="w-full max-w-md border-none shadow-xl animate-in fade-in-up duration-500 sm:border">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-foreground text-background animate-in zoom-in-75 duration-500 delay-150">
                        <Mail className="h-6 w-6" />
                    </div>

                    <div>
                        <CardTitle className="text-2xl font-bold tracking-tight">
                            Verify your email
                        </CardTitle>

                        <CardDescription className="mt-2 text-sm leading-6">
                            We've sent a 6-digit code to
                            <br />
                            <span className="font-semibold text-foreground">
                                {user?.email || "your email"}
                            </span>
                        </CardDescription>
                    </div>
                </CardHeader>

                <CardContent className="space-y-6">
                    <Field className="space-y-3">
                        <div className="flex items-center justify-between">
                            <FieldLabel>
                                Verification code
                            </FieldLabel>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-xs"
                                onClick={handleResend}
                                disabled={isLoading || cooldown > 0}
                            >
                                <RefreshCwIcon className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />
                                {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend"}
                            </Button>
                        </div>

                        <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={(val) => {
                                setOtp(val);
                                if (otpError) setOtpError("");
                            }}
                            className="justify-center"
                        >
                            <InputOTPGroup className="gap-2">
                                {[0, 1, 2, 3, 4, 5].map((i) => (
                                    <InputOTPSlot
                                        key={i}
                                        index={i}
                                        aria-invalid={!!otpError}
                                        className="h-14 w-12 rounded-lg border text-lg transition-transform focus:scale-105"
                                    />
                                ))}
                            </InputOTPGroup>
                        </InputOTP>

                        {otpError ? (
                            <p className="text-center text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                                {otpError}
                            </p>
                        ) : (
                            <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                Codes expire after a few minutes for your security
                            </p>
                        )}
                    </Field>

                    <Button
                        className="h-11 w-full gap-2 text-base"
                        onClick={handleVerify}
                        disabled={isLoading || otp.length !== 6}
                    >
                        {isLoading ? (
                            <RefreshCwIcon className="h-4 w-4 animate-spin" />
                        ) : null}
                        {isLoading ? "Verifying…" : "Verify email"}
                    </Button>
                </CardContent>

                <CardFooter className="justify-center pt-0">
                    <p className="text-center text-sm text-muted-foreground">
                        Didn't receive the code?
                        <button
                            className="ml-1 font-medium text-foreground underline-offset-4 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                            onClick={handleResend}
                            disabled={isLoading || cooldown > 0}
                        >
                            Send again
                        </button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}