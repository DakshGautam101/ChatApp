import { forwardRef } from "react";
import { Check, CheckCheck } from "lucide-react";
import { cn } from "@/core/utils/utils";
import { MessageAttachments } from "./MessageAttachments";
import { MessageReactions, ReactionPicker } from "./MessageReactions";

export const MessageBubble = forwardRef(function MessageBubble(
    { message, isMine, isFirstUnread, reactToMessage, onImageClick, onRetry },
    ref
) {
    const hasAttachments = message.attachments?.length > 0;
    const showSeparateTextBubble = message.content?.trim() && !hasAttachments;

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

            <div className={cn("group flex flex-col gap-1 w-full animate-message-in", isMine ? "items-end" : "items-start")}>
                <div className={cn("group relative flex flex-col gap-1 max-w-[75%]", isMine ? "items-end" : "items-start")}>
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

                    {/* Text Message Content (only shown if not already rendered as attachment caption) */}
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
                    <div className={cn("flex items-center gap-2", isMine ? "flex-row-reverse" : "flex-row")}>
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
            </div>
        </div>
    );
});

export default MessageBubble;
