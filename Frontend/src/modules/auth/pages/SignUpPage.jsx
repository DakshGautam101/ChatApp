import { Button } from "@/core/components/ui/button";
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
import { useState, useRef } from "react";
import { Eye, EyeOff, Camera, Trash2, MessageSquare, Users, MessagesSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../stores/useAuthStore";
import toast from "react-hot-toast";
import { cn } from "@/core/utils/utils";
import AnimatedBackground from "@/core/components/AnimatedBackground";
import Avatar from "@/core/components/Avatar";
import { axiosInstance } from "@/core/api/axiosInstance";

export default function SignUpPage() {

    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();
    const { signup, isLoading } = useAuthStore();
    const avatarInputRef = useRef(null);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phone : "",
        password: "",
        avatar : "",
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

    const handleAvatarUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file (PNG, JPG, GIF)");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("Avatar image size must be less than 5 MB");
            return;
        }

        const formDataUpload = new FormData();
        formDataUpload.append("file", file);

        setUploadingAvatar(true);
        try {
            const res = await axiosInstance.post("/upload/avatar", formDataUpload, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const uploadedUrl = res.data?.file?.url;
            if (uploadedUrl) {
                setFormData((prev) => ({ ...prev, avatar: uploadedUrl }));
                toast.success("Profile picture selected");
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to upload profile picture");
        } finally {
            setUploadingAvatar(false);
            if (e.target) e.target.value = "";
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        try {
            const { username, email, phone, password, avatar } = formData;
            const success = await signup({ username, email, phone, password, avatar });

            if (success) {
                toast.success("Account created — let's verify your email");
                setFormData({ username: "", email: "", phone: "", password: "", avatar: "" });
                navigate("/verify-email");
            }
        } catch (error) {
            toast.error(error?.response?.data?.message || "Unable to create account. Please try again.");
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
                        Join a place built for real conversations.
                    </h2>
                    <p className="max-w-sm text-sm text-blue-100/80 font-normal leading-relaxed">
                        Create an account to send invitations, manage connections,
                        and keep every thread organized.
                    </p>
                </div>

                <div className="relative grid grid-cols-2 gap-4 z-10 animate-fade-in-up">
                    <div className="flex items-start gap-2.5 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md transition-transform hover:scale-[1.02]">
                        <Users className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
                        <p className="text-xs font-medium text-blue-50">Invite anyone with one click</p>
                    </div>
                    <div className="flex items-start gap-2.5 rounded-2xl border border-white/20 bg-white/10 p-4 backdrop-blur-md transition-transform hover:scale-[1.02]">
                        <MessagesSquare className="mt-0.5 h-4 w-4 shrink-0 text-blue-200" />
                        <p className="text-xs font-medium text-blue-50">Notifications the moment things move</p>
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
                            <CardTitle className="text-2xl font-bold text-slate-900">Create an account</CardTitle>
                            <CardDescription className="text-slate-500">
                                Enter your details below to create your account.
                            </CardDescription>
                            <CardAction>
                                <Button variant="link" className="px-0 font-semibold text-blue-600 hover:text-blue-700 transition-transform hover:scale-105" onClick={() => navigate("/login")}>
                                    Sign in
                                </Button>
                            </CardAction>
                        </CardHeader>

                        <CardContent>
                            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                                <div className="space-y-4">
                                    <div className="space-y-1.5 stagger-item" style={{ "--stagger-index": 1 }}>
                                        <Label htmlFor="fullname" className="text-slate-700 font-medium">Full name</Label>
                                        <Input
                                            id="fullname"
                                            type="text"
                                            placeholder="Enter your full name"
                                            autoComplete="name"
                                            aria-invalid={!!errors.username}
                                            value={formData.username}
                                            onChange={setField("username")}
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                        />
                                        {errors.username && (
                                            <p className="text-xs text-red-500 animate-fade-in">
                                                {errors.username}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 stagger-item" style={{ "--stagger-index": 2 }}>
                                        <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="Enter your email"
                                            autoComplete="email"
                                            aria-invalid={!!errors.email}
                                            value={formData.email}
                                            onChange={setField("email")}
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                        />
                                        {errors.email && (
                                            <p className="text-xs text-red-500 animate-fade-in">
                                                {errors.email}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 stagger-item" style={{ "--stagger-index": 2 }}>
                                        <Label htmlFor="phone" className="text-slate-700 font-medium">Phone</Label>
                                        <Input
                                            id="phone"
                                            type="phone"
                                            placeholder="Enter your phone number"
                                            autoComplete="phone"
                                            aria-invalid={!!errors.phone}
                                            value={formData.phone}
                                            onChange={setField("phone")}
                                            className="h-11 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                        />
                                        {errors.phone && (
                                            <p className="text-xs text-red-500 animate-fade-in">
                                                {errors.phone}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-1.5 stagger-item" style={{ "--stagger-index": 3 }}>
                                        <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                                        <div className="relative">
                                            <Input
                                                id="password"
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Enter your password"
                                                autoComplete="new-password"
                                                aria-invalid={!!errors.password}
                                                value={formData.password}
                                                onChange={setField("password")}
                                                className="h-11 pr-10 rounded-xl border-slate-200 bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500/20"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600 cursor-pointer"
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
                                            <p className="text-xs text-red-500 animate-fade-in">
                                                {errors.password}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2 stagger-item" style={{ "--stagger-index": 4 }}>
                                        <Label className="text-slate-700 font-medium block">Profile Picture (Optional)</Label>
                                        <input
                                            type="file"
                                            ref={avatarInputRef}
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleAvatarUpload}
                                        />
                                        <div className="flex items-center gap-4 p-2 rounded-xl bg-slate-50 border border-slate-200/80">
                                            <Avatar src={formData.avatar} name={formData.username || "User"} size="xl" />
                                            <div className="flex flex-col gap-1.5">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={uploadingAvatar}
                                                    onClick={() => avatarInputRef.current?.click()}
                                                    className="gap-2 border-slate-200 hover:bg-slate-100 text-slate-700 font-semibold h-9 rounded-lg"
                                                >
                                                    {uploadingAvatar ? (
                                                        <span className="loading loading-spinner loading-xs text-blue-600"></span>
                                                    ) : (
                                                        <Camera className="h-4 w-4 text-blue-600" />
                                                    )}
                                                    {formData.avatar ? "Change Picture" : "Upload Picture"}
                                                </Button>
                                                {formData.avatar && (
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setFormData((prev) => ({ ...prev, avatar: "" }))}
                                                        className="gap-1.5 text-xs text-red-500 hover:text-red-600 hover:bg-red-50 font-medium h-7 px-2"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                        Remove Picture
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <Button className="w-full h-11 gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 border-none transition-all active:scale-[0.98]" type="submit" disabled={isLoading}>
                                            {isLoading && <span className="loading loading-spinner loading-xs text-white"></span>}
                                            {isLoading ? "Creating account…" : "Create account"}
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        </CardContent>

                        <CardFooter className="flex flex-col gap-3 pt-0">
                            <p className="text-center text-sm text-slate-500 animate-fade-in">
                                Already have an account?{" "}
                                <Button variant="link" className="h-auto p-0 font-semibold text-blue-600 hover:text-blue-700 transition-transform hover:scale-105" onClick={() => navigate("/login")}>
                                    Sign in
                                </Button>
                            </p>
                        </CardFooter>
                    </Card>
                </div>
            </div>
        </div>
    );
}
