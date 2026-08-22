import React, { forwardRef, memo } from "react";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/core/utils/utils";
import Avatar from "@/core/components/Avatar";
import { MessageAttachments } from "./MessageAttachments";
import { MessageReactions, ReactionPicker } from "./MessageReactions";
import type { MessageInterface } from "@/core/types/MessageInterface";

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

function getSenderColor(senderId: string) {
    if (!senderId) return "text-slate-600 font-semibold";
    const str = senderId.toString();
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const index = Math.abs(hash) % SENDER_COLORS.length;
    return SENDER_COLORS[index];
}

export interface MessageBubbleProps {
    message?: MessageInterface
    isMine?: boolean
    isFirstUnread?: boolean
    reactToMessage?: (messageId: string, reaction: string) => void;
    onImageClick?: (message: MessageInterface, index: number) => void;
    onRetry?: (message: MessageInterface) => void;
    isGroup?: boolean
    ref?: React.RefObject<HTMLDivElement>
}

export const MessageBubble = memo(
    forwardRef<HTMLDivElement, MessageBubbleProps>((props: MessageBubbleProps, ref) => {
        const { message, isMine, isFirstUnread, isGroup, reactToMessage, onImageClick, onRetry } = props;
        const hasAttachments = message.attachments?.length > 0;
        const showSeparateTextBubble = message.content?.trim() && !hasAttachments;

        const senderObj = typeof message.sender === "object" ? message.sender : null;
        const senderName = isMine
            ? "You"
            : senderObj?.username || senderObj?.email?.split("@")[0] || "User";
        const senderAvatar = senderObj?.avatar || null;
        const senderId = (senderObj?._id || message.sender)?.toString();

        const timeStr = message.createdAt
            ? new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
            })
            : "";

        return (
            <div
                ref={ref}
                className={cn(
                    "flex flex-col gap-1 w-full text-slate-900 animate-fade-in my-1",
                    isMine ? "items-end" : "items-start"
                )}
            >
                {/* First unread divider */}
                {isFirstUnread && (
                    <div className="flex items-center gap-3 w-full my-4 animate-scale-in">
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                        <span className="text-[11px] font-extrabold text-blue-600 bg-primary border border-blue-200/80 px-3 py-1 rounded-full shadow-2xs tracking-wide">
                            NEW MESSAGES BELOW
                        </span>
                        <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />
                    </div>
                )}

                <div className={cn("flex gap-2 max-w-[85%] sm:max-w-[75%]", isMine ? "flex-row-reverse" : "flex-row")}>
                    {/* Avatar for incoming group message */}
                    {isGroup && !isMine && (
                        <Avatar
                            src={senderAvatar}
                            name={senderName}
                            size="sm"
                            className="mt-1 shrink-0 shadow-xs"
                        />
                    )}

                    <div className={cn("flex flex-col min-w-0 group/bubble relative", isMine ? "items-end" : "items-start")}>
                        {/* Sender Name for group messages */}
                        {isGroup && !isMine && (
                            <span className={cn("text-[11px] mb-1 px-1 truncate max-w-xs", getSenderColor(senderId))}>
                                {senderName}
                            </span>
                        )}

                        <div className="relative flex items-center gap-1 group/item">
                            {/* Combined Card or Separate Text Bubble */}
                            {hasAttachments ? (
                                <div
                                    className={cn(
                                        "rounded-2xl p-2 transition-all duration-200 border shadow-xs min-w-[220px]",
                                        isMine
                                            ? "bg-primary border-primary shadow-primary/10 rounded-tr-xs"
                                            : "bg-secondary border-secondary shadow-secondary rounded-tl-xs"
                                    )}
                                >
                                    <MessageAttachments
                                        attachments={message.attachments}
                                        message={message}
                                        isMine={isMine}
                                        onImageClick={onImageClick}
                                    />
                                    {message.content?.trim() && (
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words px-1.5 pt-2 pb-1 font-medium">
                                            {message.content}
                                        </p>
                                    )}
                                    <div
                                        className={cn(
                                            "flex items-center justify-end gap-1.5 px-1 pt-1 text-[10px]",
                                            isMine ? "text-primary font-medium" : "text-secondary font-medium"
                                        )}
                                    >
                                        <span>{timeStr}</span>
                                        {isMine && (
                                            <span className="inline-flex items-center ml-0.5">
                                                {message.status === "sending" ? (
                                                    <span className="loading loading-spinner loading-xs h-3 w-3 text-blue-100 opacity-80" />
                                                ) : message.status === "failed" ? (
                                                    <button
                                                        onClick={() => onRetry?.(message)}
                                                        className="text-red-300 hover:text-white underline font-bold cursor-pointer"
                                                    >
                                                        Retry
                                                    </button>
                                                ) : message.status === "read" ? (
                                                    <CheckCheck className="h-3.5 w-3.5 text-sky-200 font-bold" />
                                                ) : message.status === "delivered" ? (
                                                    <CheckCheck className="h-3.5 w-3.5 text-blue-200/80 font-bold" />
                                                ) : (
                                                    <Check className="h-3.5 w-3.5 text-blue-200/80 font-bold" />
                                                )}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                showSeparateTextBubble && (
                                    <div
                                        className={cn(
                                            "rounded-2xl px-4 py-2.5 transition-all duration-200 border shadow-xs max-w-full",
                                            isMine
                                                ? "bg-primary text-secondary border-primary shadow-primary/10 rounded-tr-xs"
                                                : "bg-secondary text-primary border-secondary shadow-secondary rounded-tl-xs"
                                        )}
                                    >
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words font-medium">
                                            {message.content}
                                        </p>
                                        <div
                                            className={cn(
                                                "flex items-center justify-end gap-1.5 pt-1 text-[10px] -mr-1 -mb-0.5",
                                                isMine ? "text-blue-100/90 font-medium" : "text-slate-500 font-medium"
                                            )}
                                        >
                                            <span>{timeStr}</span>
                                            {isMine && (
                                                <span className="inline-flex items-center ml-0.5">
                                                    {message.status === "sending" ? (
                                                        <span className="loading loading-spinner loading-xs h-3 w-3 text-blue-100 opacity-80" />
                                                    ) : message.status === "failed" ? (
                                                        <button
                                                            onClick={() => onRetry?.(message)}
                                                            className="text-red-300 hover:text-white underline font-bold cursor-pointer"
                                                        >
                                                            Retry
                                                        </button>
                                                    ) : message.status === "read" ? (
                                                        <CheckCheck className="h-3.5 w-3.5 text-sky-200 font-bold" />
                                                    ) : message.status === "delivered" ? (
                                                        <CheckCheck className="h-3.5 w-3.5 text-blue-200/80 font-bold" />
                                                    ) : (
                                                        <Check className="h-3.5 w-3.5 text-blue-200/80 font-bold" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Reaction Picker Trigger */}
                            <ReactionPicker
                                isMine={isMine}
                                onSelectReaction={(reaction: string) => {
                                    if (message?._id) {
                                        reactToMessage?.(message._id, reaction);
                                    }
                                }}
                            />
                        </div>

                        {/* Reactions Container */}
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
        );
    })
);

export default MessageBubble;
