import { cn } from "@/core/utils/utils";

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
    if (!reactions || reactions.length === 0) return null;

    return (
        <div className="flex gap-1">
            {reactions.map((reaction) => (
                <span
                    key={`${reaction.user}-${reaction.type}`}
                    className="rounded-full border border-slate-200 bg-white px-2 py-0.5 text-xs shadow-xs animate-scale-in"
                >
                    {reaction.type}
                </span>
            ))}
        </div>
    );
}

export default MessageReactions;
