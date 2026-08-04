import React, { useEffect, useState } from 'react'
import useAuthStore from '../Stores/useAuthStore';
import { Button } from '../components/ui/button.jsx'
import { toast } from 'react-hot-toast';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare, ShieldCheck, Zap } from 'lucide-react';

const LoginPage = () => {
    const {
        isLoading,
        login,
        isAuthenticated,
    } = useAuthStore();

    const navigate = useNavigate();

    useEffect(() => {
        if (isAuthenticated) {
            navigate("/");
        }
    }, [isAuthenticated, navigate])

    const handleSignUpClick = () => {
        navigate("/signup");
    }

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errors, setErrors] = useState({});

    const validate = () => {
        const next = {};
        if (!email.trim()) next.email = "Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email";
        if (!password) next.password = "Password is required";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const success = await login(email, password);
            if (success) {
                toast.success("Welcome back");
            }
        } catch (error) {
            console.error("Login failed:", error);
            const msg = error?.response?.data?.message || "Login failed. Check your credentials and try again.";
            toast.error(msg);
        }
    }

    return (
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2">
            {/* Brand panel */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
                <div className="absolute inset-0 grain-noise opacity-40" />
                <div className="relative flex items-center gap-2 animate-in fade-in-down duration-700">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight">Chat App</span>
                </div>

                <div className="relative space-y-6 animate-in fade-in-up duration-700 delay-150">
                    <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
                        Every conversation, in one focused place.
                    </h2>
                    <p className="max-w-sm text-sm text-background/60">
                        Sign in to pick up where you left off — invitations, messages,
                        and everyone you talk to.
                    </p>
                </div>

                <div className="relative grid grid-cols-2 gap-4 animate-in fade-in-up duration-700 delay-300">
                    <div className="flex items-start gap-2 rounded-xl border border-background/15 p-3">
                        <Zap className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="text-xs text-background/70">Realtime updates, no refresh needed</p>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl border border-background/15 p-3">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="text-xs text-background/70">Session verified securely</p>
                    </div>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10">
                <div className="flex items-center gap-2 lg:hidden animate-in fade-in-down duration-500">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight">Chat App</span>
                </div>

                <Card className="w-full max-w-sm border-none shadow-none sm:border sm:shadow-sm animate-in fade-in-up duration-500">
                    <CardHeader>
                        <CardTitle className="text-xl">Sign in</CardTitle>
                        <CardDescription>
                            Enter your email below to sign in to your account
                        </CardDescription>
                        <CardAction>
                            <Button variant="link" onClick={handleSignUpClick} className="px-0">
                                Sign up
                            </Button>
                        </CardAction>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleLogin} noValidate>
                            <div className="flex flex-col gap-5">
                                <div className="grid gap-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@example.com"
                                        autoComplete="email"
                                        aria-invalid={!!errors.email}
                                        value={email}
                                        onChange={(e) => {
                                            setEmail(e.target.value);
                                            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
                                        }}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                                            {errors.email}
                                        </p>
                                    )}
                                </div>
                                <div className="grid gap-2">
                                    <div className="flex items-center">
                                        <Label htmlFor="password">Password</Label>
                                        <a
                                            href="#"
                                            className="ml-auto inline-block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                                        >
                                            Forgot your password?
                                        </a>
                                    </div>
                                    <Input
                                        id="password"
                                        type="password"
                                        autoComplete="current-password"
                                        aria-invalid={!!errors.password}
                                        value={password}
                                        onChange={(e) => {
                                            setPassword(e.target.value);
                                            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
                                        }}
                                    />
                                    {errors.password && (
                                        <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                                            {errors.password}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <CardFooter className="mt-6 flex-col gap-2 px-0 pb-0">
                                <Button type="submit" className="w-full gap-2" disabled={isLoading}>
                                    {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {isLoading ? "Signing in…" : "Sign in"}
                                </Button>
                            </CardFooter>
                        </form>
                    </CardContent>
                </Card>

                <p className="text-center text-xs text-muted-foreground lg:hidden">
                    Don't have an account?{" "}
                    <button onClick={handleSignUpClick} className="font-medium text-foreground underline-offset-4 hover:underline">
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    )
}

export default LoginPage