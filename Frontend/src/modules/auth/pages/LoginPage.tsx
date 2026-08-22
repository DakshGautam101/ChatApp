import React, { useEffect, useState } from 'react';
import useAuthStore from '../stores/useAuthStore';
import { Button } from '@/core/components/ui/button';
import { toast } from 'react-hot-toast';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/core/components/ui/card";
import { Input } from "@/core/components/ui/input";
import { Label } from "@/core/components/ui/label";
import { useNavigate } from 'react-router-dom';
import { Loader2, MessageSquare, ShieldCheck, Zap } from 'lucide-react';
import AnimatedBackground from '@/core/components/AnimatedBackground';
import type { UserInterface } from '@/core/types/UserInterface';

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
    }, [isAuthenticated, navigate]);

    const handleSignUpClick = () => {
        navigate("/signup");
    };

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<any>({});

    const validate = () => {
        const next : UserInterface = {} as UserInterface;
        if (!email.trim()) next.email = "Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Enter a valid email";
        if (!password) next.password = "Password is required";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const success = await login({ email, password });
            if (success) {
                toast.success("Welcome back");
            }
        } catch (error: any) {
            console.error("Login failed:", error);
            const msg = error?.response?.data?.message || "Login failed. Check your credentials and try again.";
            toast.error(msg);
        }
    };

    return (
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-slate-50">
            {/* Brand panel */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-12 text-white lg:flex shadow-2xl">
                <AnimatedBackground />
                <div className="absolute inset-0 bg-blue-900/10 backdrop-blur-[1px] pointer-events-none" />
                
                <div className="relative flex items-center gap-3 z-10 animate-fade-in-down">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white shadow-lg backdrop-blur-md animate-float">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">Chat App</span>
                </div>

                <div className="relative space-y-4 z-10 animate-fade-in-up">
                    <h2 className="max-w-md text-4xl font-extrabold leading-tight tracking-tight text-white">
                        Every conversation, in one focused place.
                    </h2>
                    <p className="max-w-sm text-sm text-blue-100/80 font-normal leading-relaxed">
                        Sign in to pick up where you left off — invitations, messages,
                        and everyone you talk to.
                    </p>
                </div>

                <div className="relative grid grid-cols-2 gap-4 z-10 animate-fade-in-up">
                    <div className="flex items-start gap-2.5 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md transition-transform hover:scale-[1.02]">
                        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
                        <p className="text-xs font-medium text-blue-50">Realtime updates, no refresh needed</p>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md transition-transform hover:scale-[1.02]">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
                        <p className="text-xs font-medium text-blue-50">Session verified securely</p>
                    </div>
                </div>
            </div>

            {/* Form panel */}
            <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-6 py-12 relative bg-slate-50">
                <div className="flex items-center gap-2.5 lg:hidden z-10 animate-fade-in">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-md animate-float">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-slate-900">Chat App</span>
                </div>

                <div className="w-full max-w-md z-10 animate-scale-in">
                    <Card className="w-full border border-slate-200/80 shadow-xl shadow-blue-900/5 bg-white rounded-2xl p-2 sm:p-4">
                        <CardHeader>
                            <CardTitle className="text-2xl font-bold text-slate-900">Sign in</CardTitle>
                            <CardDescription className="text-slate-500">
                                Enter your email below to sign in to your account
                            </CardDescription>
                            <CardAction>
                                <Button variant="link" onClick={handleSignUpClick} className="px-0 font-semibold text-blue-600 hover:text-blue-700 transition-transform hover:scale-105">
                                    Sign up
                                </Button>
                            </CardAction>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} noValidate>
                                <div className="flex flex-col gap-5">
                                    <div className="grid gap-2">
                                        <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="you@example.com"
                                            autoComplete="email"
                                            aria-invalid={!!errors.email}
                                            value={email}
                                            onChange={(e) => {
                                                setEmail(e.target.value);
                                                if (errors.email) setErrors((p: Record<string, string | undefined>) => ({ ...p, email: undefined }));
                                            }}
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                        />
                                        {errors.email && (
                                            <p className="text-xs text-red-500 animate-fade-in">
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>
                                    <div className="grid gap-2 stagger-item">
                                        <div className="flex items-center">
                                            <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                                            <a
                                                href="#"
                                                className="ml-auto inline-block text-xs text-blue-600 font-medium hover:underline transition-colors"
                                            >
                                                Forgot password?
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
                                                if (errors.password) setErrors((p: Record<string, string | undefined>) => ({ ...p, password: undefined }));
                                            }}
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                        />
                                        {errors.password && (
                                            <p className="text-xs text-red-500 animate-fade-in">
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <CardFooter className="mt-6 flex-col gap-2 px-0 pb-0">
                                    <div className="w-full">
                                        <Button type="submit" className="w-full h-11 gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 border-none transition-all active:scale-[0.98]" disabled={isLoading}>
                                            {isLoading && <span className="loading loading-spinner loading-xs text-white"><Loader2/></span>}
                                            {isLoading ? "Signing in…" : "Sign in"}
                                        </Button>
                                    </div>
                                </CardFooter>
                            </form>
                        </CardContent>
                    </Card>
                </div>

                <p className="text-center text-xs text-muted-foreground lg:hidden z-10 animate-fade-in">
                    Don't have an account?{" "}
                    <button onClick={handleSignUpClick} className="font-medium text-foreground underline-offset-4 hover:underline">
                        Sign up
                    </button>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
