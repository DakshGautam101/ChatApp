import { useState } from "react";
import { cn } from "@/core/utils/utils";
import Avatar from "@/core/components/Avatar";
import useAuthStore from "@/modules/auth/stores/useAuthStore";

const reactionOptions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];

export function ReactionPicker({ isMine, onSelectReaction }) {
    return (
        <div
            className={cn(
                "absolute top-1/2 -translate-y-1/2 z-20",
                "opacity-0 scale-90 pointer-events-none",
                "group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto",
                "transition-all duration-200 ease-out",
                isMine ? "right-full mr-2" : "left-full ml-2"
            )}
        >
            <div className="flex gap-1 rounded-full border border-slate-200 bg-white px-2 py-1 shadow-md">
                {reactionOptions.map((emoji) => (
                    <button
                        key={emoji}
                        type="button"
                        onClick={() => onSelectReaction(emoji)}
                        className="text-base transition-transform hover:scale-125 hover:-translate-y-0.5 px-1 cursor-pointer"
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}

export function MessageReactions({ reactions }) {
    const { user: currentUser } = useAuthStore();
    const [hoveredEmoji, setHoveredEmoji] = useState(null);

    if (!reactions || reactions.length === 0) return null;

    const currentUserId = (currentUser?._id || currentUser?.id)?.toString();

    // Group reactions by emoji type
    const grouped = reactions.reduce((acc, r) => {
        const type = r.type || "👍";
        if (!acc[type]) acc[type] = [];
        acc[type].push(r.user);
        return acc;
    }, {});

    return (
        <div className="flex flex-wrap gap-1 mt-0.5">
            {Object.entries(grouped).map(([emoji, users]) => {
                const isReactedByMe = users.some((u) => {
                    const uId = typeof u === "object" ? u?._id?.toString() : u?.toString();
                    return uId === currentUserId;
                });

                const count = users.length;
                const reactorNames = users.map((u) => {
                    if (typeof u === "object" && u !== null) {
                        const uId = u._id?.toString();
                        return uId === currentUserId ? "You" : (u.username || u.email?.split("@")[0] || "Someone");
                    }
                    return u?.toString() === currentUserId ? "You" : "Someone";
                });

                const isHovered = hoveredEmoji === emoji;

                return (
                    <div
                        key={emoji}
                        className="relative group/pill"
                        onMouseEnter={() => setHoveredEmoji(emoji)}
                        onMouseLeave={() => setHoveredEmoji(null)}
                    >
                        <span
                            className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs shadow-2xs transition-all cursor-pointer select-none",
                                isReactedByMe
                                    ? "bg-blue-50 border-blue-300 text-blue-700 font-semibold"
                                    : "bg-white/90 border-slate-200/90 text-slate-700 hover:bg-slate-50"
                            )}
                        >
                            <span>{emoji}</span>
                            {count > 1 && <span className="text-[11px] font-bold">{count}</span>}
                        </span>

                        {/* Hover Tooltip showing reactor avatars and names */}
                        <div
    className={cn(
        "absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-30",
        "pointer-events-none transition-all duration-200 ease-out",
        isHovered
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-1"
    )}
>
    <div
        className="
            relative
            flex items-center
            gap-3
            w-max
            max-w-[280px]
            min-h-[64px]
            px-4 py-3
            rounded-2xl
            bg-slate-900/95
            backdrop-blur-xl
            text-white
            shadow-[0_12px_35px_rgba(0,0,0,0.28)]
        "
    >
        {/* Avatars */}
        <div className="flex items-center shrink-0">
            {users.slice(0, 3).map((u, idx) => {
                const uObj = typeof u === "object" ? u : null;
                const uName = uObj
                    ? uObj.username || uObj.email
                    : "User";

                return (
                    <div
                        key={uObj?._id || idx}
                        className={cn(
                            "shrink-0",
                            idx > 0 && "-ml-2"
                        )}
                    >
                        <Avatar
                            src={uObj?.avatar}
                            name={uName}
                            size="xs"
                            className="
                                !border-2
                                !border-slate-900
                                !ring-0
                                shadow-sm
                            "
                        />
                    </div>
                );
            })}
        </div>

        {/* Names */}
        <div className="min-w-0 max-w-[200px]">
            <span
                className="
                    block
                    text-sm
                    font-medium
                    leading-5
                    truncate
                "
            >
                {reactorNames.join(", ")}
            </span>
        </div>

        {/* Caret */}
        <div
            className="
                absolute
                top-full
                left-1/2
                -translate-x-1/2
                -mt-[1px]
                w-4
                h-4
                bg-slate-900/95
                rotate-45
            "
        />
    </div>
</div>
                    </div>
                );
            })}
        </div>
    );
}

export default MessageReactions;

