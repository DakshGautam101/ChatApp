import { Button } from "@/components/ui/button";
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Eye, EyeOff, Loader2, MessageSquare, Users, MessagesSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../Stores/useAuthStore";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import AnimatedBackground from "@/components/AnimatedBackground";

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

export default function SignUpPage() {

    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { signup, isLoading } = useAuthStore();

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: ""
    });
    const [errors, setErrors] = useState({});

    const validate = () => {
        const next = {};
        if (!formData.username.trim()) next.username = "Full name is required";
        if (!formData.email.trim()) next.email = "Email is required";
        else if (!/^\S+@\S+\.\S+$/.test(formData.email)) next.email = "Enter a valid email";
        if (!formData.password) next.password = "Password is required";
        else if (formData.password.length < 6) next.password = "Use at least 6 characters";
        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const setField = (field) => (e) => {
        setFormData((prev) => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const { username, email, password } = formData;
            const success = await signup({ username, email, password });

            if (success) {
                toast.success("Account created — let's verify your email");
                setFormData({ username: "", email: "", password: "" })
                navigate("/verify-email");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to create account. Please try again.");
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
                        Join a place built for real conversations.
                    </h2>
                    <p className="max-w-sm text-sm text-background/60">
                        Create an account to send invitations, manage connections,
                        and keep every thread organized.
                    </p>
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.4 }}
                    className="relative grid grid-cols-2 gap-4 z-10"
                >
                    <div className="flex items-start gap-2 rounded-xl border border-background/15 bg-background/5 p-3 glass-subtle transition-transform hover:scale-105">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-xs text-background/70">Invite anyone with one click</p>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl border border-background/15 bg-background/5 p-3 glass-subtle transition-transform hover:scale-105">
                        <MessagesSquare className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                        <p className="text-xs text-background/70">Notifications the moment things move</p>
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
                            <CardTitle className="text-xl">Create an account</CardTitle>
                            <CardDescription>
                                Enter your details below to create your account.
                            </CardDescription>
                            <CardAction>
                                <Button variant="link" className="px-0 transition-transform hover:scale-105" onClick={() => navigate("/login")}>
                                    Sign in
                                </Button>
                            </CardAction>
                        </CardHeader>

                        <CardContent>
                            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                                <motion.div 
                                    variants={containerVariants}
                                    initial="hidden"
                                    animate="visible"
                                    className="space-y-5"
                                >
                                    <motion.div variants={itemVariants} className="space-y-2 stagger-item" style={{ "--stagger-index": 1 }}>
                                        <Label htmlFor="fullname">Full name</Label>
                                        <Input
                                            id="fullname"
                                            type="text"
                                            placeholder="Enter your full name"
                                            autoComplete="name"
                                            aria-invalid={!!errors.username}
                                            value={formData.username}
                                            onChange={setField("username")}
                                            className="transition-all focus:ring-2 focus:ring-primary/20"
                                        />
                                        {errors.username && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="text-xs text-destructive"
                                            >
                                                {errors.username}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="space-y-2 stagger-item" style={{ "--stagger-index": 2 }}>
                                        <Label htmlFor="email">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            autoComplete="email"
                                            aria-invalid={!!errors.email}
                                            value={formData.email}
                                            onChange={setField("email")}
                                            className="transition-all focus:ring-2 focus:ring-primary/20"
                                        />
                                        {errors.email && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="text-xs text-destructive"
                                            >
                                                {errors.email}
                                            </motion.p>
                                        )}
                                    </motion.div>

                                    <motion.div variants={itemVariants} className="space-y-2 stagger-item" style={{ "--stagger-index": 3 }}>
                                        <Label htmlFor="password">Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                autoComplete="new-password"
                                                aria-invalid={!!errors.password}
                                                value={formData.password}
                                                onChange={setField("password")}
                                                className="pr-10 transition-all focus:ring-2 focus:ring-primary/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer hover:scale-110"
                                                aria-label={showPassword ? "Hide password" : "Show password"}
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-4 w-4" />
                                                ) : (
                                                    <Eye className="h-4 w-4" />
                                                )}
                                            </button>
                                        </div>
                                        {errors.password && (
                                            <motion.p 
                                                initial={{ opacity: 0, height: 0 }}
                                                animate={{ opacity: 1, height: "auto" }}
                                                className="text-xs text-destructive"
                                            >
                                                {errors.password}
                                            </motion.p>
                                        )}
                                    </motion.div>
                                    
                                    <motion.div variants={itemVariants} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                        <Button className="w-full gap-2 relative overflow-hidden" type="submit" disabled={isLoading}>
                                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                            {isLoading ? "Creating account…" : "Create account"}
                                            {!isLoading && <div className="absolute inset-0 bg-white/20 translate-y-full hover:translate-y-0 transition-transform duration-300" />}
                                        </Button>
                                    </motion.div>
                                </motion.div>
                            </form>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3">
                            <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.5 }}
                                className="text-center text-sm text-muted-foreground"
                            >
                                Already have an account?{" "}
                                <Button variant="link" className="h-auto p-0 transition-transform hover:scale-105" onClick={() => navigate("/login")}>
                                    Sign in
                                </Button>
                            </motion.p>
                        </CardFooter>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}