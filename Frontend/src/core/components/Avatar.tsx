import { useState } from "react";
import { cn } from "@/core/utils/utils";

export function getAvatarUrl(avatar?: string | null) {
    if (!avatar) return null;
    if (
        avatar.startsWith("http://") ||
        avatar.startsWith("https://") ||
        avatar.startsWith("data:") ||
        avatar.startsWith("blob:")
    ) {
        return avatar;
    }
    
    const apiBase = import.meta.env.VITE_API_URL || "https://chatapp-backend-s1n2.onrender.com"|| "http://localhost:5000/api";
    const serverOrigin = apiBase.replace(/\/api\/?$/, "");
    const cleanPath = avatar.startsWith("/") ? avatar : `/${avatar}`;
    return `${serverOrigin}${cleanPath}`;
}

const sizeClasses: Record<string, string> = {
    xs: "h-7 w-7 text-xs",
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
    xl: "h-16 w-16 text-xl",
    "2xl": "h-20 w-20 text-2xl",
};

type AvatarProps = {
    src ?: string | null;
    name ?: string | null;
    className ?: string;
    size ?: string;
    showStatus ?: boolean;
    status ?: string;
    onClick ?: () => void;
}

export function Avatar({
    src,
    name,
    className,
    size = "md",
    showStatus = false,
    status = "offline",
   onClick,
} : AvatarProps) {
    const [hasError, setHasError] = useState(false);
    const resolvedUrl = !hasError ? getAvatarUrl(src) : null;
    const initial = (name || "?").trim().charAt(0).toUpperCase() || "?";
    const sizeStyle = sizeClasses[size] || sizeClasses.md;

    return (
        <div
            className={cn("relative inline-flex shrink-0 select-none", onClick && "cursor-pointer", className)}
            onClick={onClick}
        >
            {resolvedUrl ? (
                <img
                    src={resolvedUrl}
                    alt={name || "User avatar"}
                    onError={() => setHasError(true)}
                    className={cn(
                        "rounded-full object-cover shadow-xs border border-slate-200/80 transition-opacity duration-200",
                        sizeStyle
                    )}
                />
            ) : (
                <div
                    className={cn(
                        "flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-700 font-bold border border-blue-200/80 shadow-xs",
                        sizeStyle
                    )}
                >
                    {initial}
                </div>
            )}

            {showStatus && (
                <span
                    className={cn(
                        "absolute bottom-0 right-0 rounded-full border-2 border-white",
                        size === "xs" || size === "sm" ? "h-2.5 w-2.5" : "h-3.5 w-3.5",
                        status === "online" ? "bg-emerald-500" : "bg-slate-300"
                    )}
                />
            )}
        </div>
    );
}

export default Avatar;
