import React, { useEffect, useState } from 'react'
import useAuthStore from '../Stores/useAuthStore';
import { Button } from '@/components/ui/button'
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
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import AnimatedBackground from '@/components/AnimatedBackground';

// Framer motion variants
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
        opacity: 1, 
        transition: { staggerChildren: 0.1 } 
    }
};

const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
        opacity: 1, 
        y: 0, 
        transition: { type: "spring", stiffness: 300, damping: 24 } 
    }
};

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
        <div className="grid min-h-screen grid-cols-1 lg:grid-cols-2 bg-background">
            {/* Brand panel */}
            <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-background lg:flex">
                <AnimatedBackground />
                <div className="absolute inset-0 grain-noise opacity-40 mix-blend-overlay" />
                
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7 }}
                    className="relative flex items-center gap-2 z-10"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-background text-foreground animate-float">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-gradient">Chat App</span>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="relative space-y-6 z-10"
                >
                    <h2 className="max-w-md text-4xl font-semibold leading-tight tracking-tight">
                        Every conversation, in one focused place.
                    </h2>
                    <p className="max-w-sm text-sm text-background/60">
                        Sign in to pick up where you left off — invitations, messages,
                        and everyone you talk to.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="relative grid grid-cols-2 gap-4 z-10"
                >
                    <div className="flex items-start gap-2 rounded-xl border border-background/15 bg-background/5 p-3 glass-subtle transition-transform hover:scale-105">
                        <Zap className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-xs text-background/70">Realtime updates, no refresh needed</p>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl border border-background/15 bg-background/5 p-3 glass-subtle transition-transform hover:scale-105">
                        <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-xs text-background/70">Session verified securely</p>
                    </div>
                </motion.div>
            </div>

            {/* Form panel */}
            <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-4 py-10 relative">
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="flex items-center gap-2 lg:hidden z-10"
                >
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background animate-float">
                        <MessageSquare className="h-5 w-5" />
                    </div>
                    <span className="text-lg font-semibold tracking-tight text-gradient">Chat App</span>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, scale: 0.95, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="w-full max-w-sm z-10"
                >
                    <Card className="w-full border-none shadow-none sm:border sm:shadow-sm glass">
                        <CardHeader>
                            <CardTitle className="text-xl">Sign in</CardTitle>
                            <CardDescription>
                                Enter your email below to sign in to your account
                            </CardDescription>
                            <CardAction>
                                <Button variant="link" onClick={handleSignUpClick} className="px-0 transition-transform hover:scale-105">
                                    Sign up
                                </Button>
                            </CardAction>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleLogin} noValidate>
                                <motion.div 
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="flex flex-col gap-5"
                                >
                                    <motion.div variants={itemVariants} className="grid gap-2 stagger-item" style={{ "--stagger-index": 1 }}>
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
                                            className="transition-all focus:ring-2 focus:ring-primary/20"
                                        />
                                        {errors.email && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="text-xs text-muted-foreground"
                                            >
                                                {errors.email}
                                            </motion.p>
                                        )}
                                    </motion.div>
                                    <motion.div variants={itemVariants} className="grid gap-2 stagger-item" style={{ "--stagger-index": 2 }}>
                                        <div className="flex items-center">
                                            <Label htmlFor="password">Password</Label>
                                            <a
                                                href="#"
                                                className="ml-auto inline-block text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline transition-colors"
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
                                            className="transition-all focus:ring-2 focus:ring-primary/20"
                                        />
                                        {errors.password && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="text-xs text-muted-foreground"
                                            >
                                                {errors.password}
                                            </motion.p>
                                        )}
                                    </motion.div>
                                </motion.div>
                                <CardFooter className="mt-6 flex-col gap-2 px-0 pb-0">
                                    <motion.div 
                                        variants={itemVariants} 
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full"
                                    >
                                        <Button type="submit" className="w-full gap-2 relative overflow-hidden" disabled={isLoading}>
                                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                            {isLoading ? "Signing in…" : "Sign in"}
                                            {!isLoading && <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />}
                                        </Button>
                                    </motion.div>
                                </CardFooter>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>

                <motion.p 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center text-xs text-muted-foreground lg:hidden z-10"
                >
                    Don't have an account?{" "}
                    <button onClick={handleSignUpClick} className="font-medium text-foreground underline-offset-4 hover:underline">
                        Sign up
                    </button>
                </motion.p>
            </div>
        </div>
    )
}

export default LoginPage