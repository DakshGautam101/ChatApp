import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCwIcon, Mail } from "lucide-react";
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

export function EmailVerification() {
    const navigate = useNavigate();
    const { user, isAuthenticated, isVerified, verifyEmail, resendEmail, isLoading } = useAuthStore();
    const [otp, setOtp] = useState("");

    useEffect(() => {
        if (isVerified) {
            navigate("/");
        }
    }, [isVerified, navigate]);

    const handleVerify = async () => {
        if (!user?.email) {
            toast.error("No email found for this account.");
            return;
        }

        if (otp.length !== 6) {
            toast.error("Please enter the 6-digit code.");
            return;
        }

        try {
            await verifyEmail(user.email, otp);
            toast.success("Email verified successfully.");
            navigate("/");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to verify your email.");
        }
    };

    const handleResend = async () => {
        if (!user?.email) {
            toast.error("No email found for this account.");
            return;
        }

        try {
            await resendEmail(user.email);
            toast.success("A new verification code has been sent.");
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to resend the code.");
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
            <Card className="w-full max-w-md shadow-xl border">
                <CardHeader className="space-y-4 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                        <Mail className="h-7 w-7 text-primary" />
                    </div>

                    <div>
                        <CardTitle className="text-2xl font-bold">
                            Verify Email
                        </CardTitle>

                        <CardDescription className="mt-2 text-sm leading-6">
                            We've sent a 6-digit verification code to
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
                                Verification Code
                            </FieldLabel>

                            <Button
                                variant="ghost"
                                size="sm"
                                className="gap-2 text-xs"
                                onClick={handleResend}
                                disabled={isLoading}
                            >
                                <RefreshCwIcon className="h-4 w-4" />
                                Resend
                            </Button>
                        </div>

                        <InputOTP
                            maxLength={6}
                            value={otp}
                            onChange={setOtp}
                            className="justify-center"
                        >
                            <InputOTPGroup className="gap-2">
                                <InputOTPSlot
                                    index={0}
                                    className="h-14 w-12 rounded-lg border text-lg"
                                />
                                <InputOTPSlot
                                    index={1}
                                    className="h-14 w-12 rounded-lg border text-lg"
                                />
                                <InputOTPSlot
                                    index={2}
                                    className="h-14 w-12 rounded-lg border text-lg"
                                />
                                <InputOTPSlot
                                    index={3}
                                    className="h-14 w-12 rounded-lg border text-lg"
                                />
                                <InputOTPSlot
                                    index={4}
                                    className="h-14 w-12 rounded-lg border text-lg"
                                />
                                <InputOTPSlot
                                    index={5}
                                    className="h-14 w-12 rounded-lg border text-lg"
                                />
                            </InputOTPGroup>
                        </InputOTP>
                    </Field>

                    <Button className="h-11 w-full text-base" onClick={handleVerify} disabled={isLoading}>
                        Verify Email
                    </Button>
                </CardContent>

                <CardFooter className="justify-center pt-0">
                    <p className="text-center text-sm text-muted-foreground">
                        Didn't receive the code?
                        <button className="ml-1 font-medium text-primary hover:underline" onClick={handleResend}>
                            Send again
                        </button>
                    </p>
                </CardFooter>
            </Card>
        </div>
    );
}