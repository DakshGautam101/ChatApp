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
                        Join a place built for real conversations.
                    </h2>
                    <p className="max-w-sm text-sm text-background/60">
                        Create an account to send invitations, manage connections,
                        and keep every thread organized.
                    </p>
                </div>

                <div className="relative grid grid-cols-2 gap-4 animate-in fade-in-up duration-700 delay-300">
                    <div className="flex items-start gap-2 rounded-xl border border-background/15 p-3">
                        <Users className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="text-xs text-background/70">Invite anyone with one click</p>
                    </div>
                    <div className="flex items-start gap-2 rounded-xl border border-background/15 p-3">
                        <MessagesSquare className="mt-0.5 h-4 w-4 shrink-0" />
                        <p className="text-xs text-background/70">Notifications the moment things move</p>
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
                        <CardTitle className="text-xl">Create an account</CardTitle>
                        <CardDescription>
                            Enter your details below to create your account.
                        </CardDescription>
                        <CardAction>
                            <Button variant="link" className="px-0" onClick={() => navigate("/login")}>
                                Sign in
                            </Button>
                        </CardAction>
                    </CardHeader>

                    <CardContent>
                        <form className="space-y-5" onSubmit={handleSubmit} noValidate>

                            <div className="space-y-2">
                                <Label htmlFor="fullname">Full name</Label>
                                <Input
                                    id="fullname"
                                    type="text"
                                    placeholder="Enter your full name"
                                    autoComplete="name"
                                    aria-invalid={!!errors.username}
                                    value={formData.username}
                                    onChange={setField("username")}
                                />
                                {errors.username && (
                                    <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                                        {errors.username}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="Enter your email"
                                    autoComplete="email"
                                    aria-invalid={!!errors.email}
                                    value={formData.email}
                                    onChange={setField("email")}
                                />
                                {errors.email && (
                                    <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                                        {errors.email}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
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
                                        className="pr-10"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
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
                                    <p className="text-xs text-destructive animate-in fade-in slide-in-from-top-1 duration-200">
                                        {errors.password}
                                    </p>
                                )}
                            </div>
                            <Button className="w-full gap-2" type="submit" disabled={isLoading}>
                                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                                {isLoading ? "Creating account…" : "Create account"}
                            </Button>
                        </form>
                    </CardContent>

                    <CardFooter className="flex flex-col gap-3">
                        <p className="text-center text-sm text-muted-foreground">
                            Already have an account?{" "}
                            <Button variant="link" className="h-auto p-0" onClick={() => navigate("/login")}>
                                Sign in
                            </Button>
                        </p>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}