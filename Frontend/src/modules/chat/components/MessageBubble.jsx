import { forwardRef } from "react";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/core/utils/utils";
import Avatar from "@/core/components/Avatar";
import { MessageAttachments } from "./MessageAttachments";
import { MessageReactions, ReactionPicker } from "./MessageReactions";

const SENDER_COLORS = [
    "text-blue-600 font-semibold",
    "text-emerald-600 font-semibold",
    "text-violet-600 font-semibold",
    "text-amber-600 font-semibold",
    "text-rose-600 font-semibold",
    "text-cyan-600 font-semibold",
    "text-indigo-600 font-semibold",
    "text-teal-600 font-semibold",
];

function getSenderColor(senderId) {
    if (!senderId) return "text-slate-600 font-semibold";
    const str = senderId.toString();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SENDER_COLORS.length;
    return SENDER_COLORS[index];
}

export const MessageBubble = forwardRef(function MessageBubble(
    { message, isMine, isFirstUnread, isGroup, reactToMessage, onImageClick, onRetry },
    ref
) {
    const hasAttachments = message.attachments?.length > 0;
    const showSeparateTextBubble = message.content?.trim() && !hasAttachments;

    const senderObj = typeof message.sender === "object" ? message.sender : null;
    const senderName = isMine
        ? "You"
        : senderObj?.username || senderObj?.email?.split("@")[0] || "User";
    const senderAvatar = senderObj?.avatar;
    const senderId = senderObj?._id || message.sender;
    const nameColorClass = isMine ? "text-blue-600 font-semibold" : getSenderColor(senderId);

    return (
        <div className="w-full flex flex-col gap-1">
            {isFirstUnread && (
                <div ref={ref} className="flex items-center my-3 text-xs font-semibold">
                    <div className="flex-grow border-t border-blue-200" />
                    <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-600 rounded-full shadow-xs shrink-0">
                        Unread Messages
                    </span>
                    <div className="flex-grow border-t border-blue-200" />
                </div>
            )}

            <div className={cn("group flex items-end gap-2 w-full animate-message-in", isMine ? "justify-end" : "justify-start")}>
                {/* Avatar for incoming group message */}
                {isGroup && !isMine && (
                    <Avatar
                        src={senderAvatar}
                        name={senderName}
                        size="sm"
                        className="mb-1 shrink-0 shadow-xs"
                    />
                )}

                <div className={cn("group relative flex flex-col gap-0.5 max-w-[75%]", isMine ? "items-end" : "items-start")}>
                    {/* Sender Name in Group Chat */}
                    {isGroup && (
                        <div className={cn("text-[11px] px-1 mb-0.5 tracking-tight flex items-center gap-1", nameColorClass)}>
                            <span>{senderName}</span>
                        </div>
                    )}

                    {/* Floating Reaction Picker */}
                    <ReactionPicker
                        isMine={isMine}
                        onSelectReaction={(emoji) => reactToMessage(message._id, emoji)}
                    />

                    {/* Attachments inside message bubble */}
                    {hasAttachments && (
                        <MessageAttachments
                            attachments={message.attachments}
                            message={message}
                            isMine={isMine}
                            onImageClick={onImageClick}
                            onRetry={onRetry}
                        />
                    )}

                    {/* Text Message Content */}
                    {showSeparateTextBubble && (
                        <div
                            className={cn(
                                "rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap wrap-break-words",
                                isMine
                                    ? "bg-blue-600 text-white font-normal shadow-sm shadow-blue-500/10 rounded-tr-xs"
                                    : "bg-white border border-slate-200/80 text-slate-800 shadow-xs rounded-tl-xs"
                            )}
                        >
                            {message.content}
                        </div>
                    )}

                    {/* Status & Reaction Badges */}
                    <div className={cn("flex items-center gap-2 mt-0.5", isMine ? "flex-row-reverse" : "flex-row")}>
                        {isMine && (
                            <span className="inline-flex items-center">
                                {message.status === "read" ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-blue-600" />
                                ) : message.status === "delivered" ? (
                                    <CheckCheck className="h-3.5 w-3.5 text-slate-400" />
                                ) : (
                                    <Check className="h-3.5 w-3.5 text-slate-400" />
                                )}
                            </span>
                        )}

                        <MessageReactions reactions={message.reactions} />
                    </div>
                </div>

                {/* Avatar for outgoing group message */}
                {isGroup && isMine && (
                    <Avatar
                        src={senderAvatar}
                        name="You"
                        size="sm"
                        className="mb-1 shrink-0 shadow-xs"
                    />
                )}
            </div>
        </div>
    );
});

export default MessageBubble;

