import { useEffect, useRef, useState } from "react";
import useChatStore from "../Stores/useChatStore";
import useAuthStore from "../Stores/useAuthStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

let typingTimeout = null;
const reactionOptions = [
    "👍",
    "❤️",
    "😂",
    "😮",
    "😢",
    "🙏",
];

export default function ChatWindow() {
    const { user } = useAuthStore();
    const {
        activeConversation,
        messages,
        isLoadingMessages,
        isLoadingOlderMessages,
        hasMoreMessages,
        sendMessage,
        emitTyping,
        typingUsers,
        loadOlderMessages,
        reactToMessage,
    } = useChatStore();
    const [draft, setDraft] = useState("");
    const bottomRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const previousMessageCount = useRef(0);
    const olderLoadPrevHeightRef = useRef(null);
    const olderLoadPrevScrollRef = useRef(null);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || !messages?.length) return;

        const wasNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;

        if (messages.length > previousMessageCount.current && !isLoadingOlderMessages && wasNearBottom) {
            container.scrollTop = container.scrollHeight;
        }

        previousMessageCount.current = messages.length;
    }, [messages, activeConversation?._id, isLoadingOlderMessages]);

    // When switching conversations, reset previous message count so initial load scrolls to bottom
    useEffect(() => {
        previousMessageCount.current = 0;
    }, [activeConversation?._id]);

    // On initial messages load for a conversation, scroll to bottom
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        if (!isLoadingMessages && messages.length > 0 && previousMessageCount.current === 0) {
            container.scrollTop = container.scrollHeight;
            previousMessageCount.current = messages.length;
        }
    }, [isLoadingMessages, messages.length, activeConversation?._id]);

    // Preserve scroll position after loading older messages
    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        if (!isLoadingOlderMessages && olderLoadPrevHeightRef.current) {
            const prevHeight = olderLoadPrevHeightRef.current || 0;
            const prevScroll = olderLoadPrevScrollRef.current || 0;
            const delta = container.scrollHeight - prevHeight;
            container.scrollTop = delta + prevScroll;
            olderLoadPrevHeightRef.current = null;
            olderLoadPrevScrollRef.current = null;
        }
    }, [isLoadingOlderMessages]);

    if (!activeConversation) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <MessageCircle className="h-10 w-10" />
                <p>Select a conversation to start chatting</p>
            </div>
        );
    }

    const other = activeConversation.participants.find((participant) => participant.user._id !== user?._id)?.user;
    const othersTyping = typingUsers[activeConversation._id];
    const isOtherTyping = othersTyping && othersTyping.size > 0;

    const handleChange = (e) => {
        setDraft(e.target.value);
        emitTyping(true);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => emitTyping(false), 1500);
    };

    const handleSend = (e) => {
        e.preventDefault();
        if (!draft.trim()) return;
        sendMessage(draft);
        setDraft("");
        emitTyping(false);
        clearTimeout(typingTimeout);
    };

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container || isLoadingOlderMessages || !hasMoreMessages) return;
        if (container.scrollTop <= 80) {
            olderLoadPrevHeightRef.current = container.scrollHeight;
            olderLoadPrevScrollRef.current = container.scrollTop;
            loadOlderMessages();
        }
    };

    return (
        <div className="flex h-full min-h-0 flex-col">
            <div className="flex items-center gap-3 border-b p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                    <div className="font-medium">{other?.username || other?.email || "Chat"}</div>
                    {isOtherTyping ? (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:120ms]" />
                            <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-current [animation-delay:240ms]" />
                            <span>typing</span>
                        </div>
                    ) : null}
                </div>
            </div>

            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 space-y-3 overflow-y-auto p-4 pb-24">
                {isLoadingMessages ? (
                    <div className="text-sm text-muted-foreground">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No messages yet. Say hello!</div>
                ) : (
                    messages.map((message) => {
                        const isMine = (message.sender?._id || message.sender) === user?._id;
                        const statusLabel = isMine ? (message.status === "read" ? "✓✓" : "✓") : null;

                        return (
                            <div key={message._id} className={cn("group flex flex-col gap-1", isMine ? "items-end" : "items-start")}>
                                <div className={cn("group relative flex flex-col gap-1", isMine ? "items-end" : "items-start")}>
                                    {/* Floating reaction picker */}
                                    <div
                                        className={cn(
                                            "absolute top-1/2 -translate-y-1/2 z-20",
                                            "opacity-0 scale-95 pointer-events-none",
                                            "group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto",
                                            "transition-all duration-200",
                                            isMine ? "right-full mr-3" : "left-full ml-3"
                                        )}
                                    >
                                        <div className="flex gap-1 rounded-full border bg-white px-2 py-1 shadow-xl">
                                            {reactionOptions.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => reactToMessage(message._id, emoji)}
                                                    className="text-lg transition hover:scale-125"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Message bubble */}
                                    <div
                                        className={cn(
                                            "max-w-[70%] rounded-2xl px-3 py-2 text-sm shadow-sm",
                                            isMine
                                                ? "bg-primary text-primary-foreground"
                                                : "bg-muted text-foreground"
                                        )}
                                    >
                                        {message.content}
                                    </div>

                                    {/* Existing reactions */}
                                    {message.reactions?.length > 0 && (
                                        <div
                                            className={cn(
                                                "flex gap-1",
                                                isMine ? "justify-end" : "justify-start"
                                            )}
                                        >
                                            {message.reactions.map((reaction) => (
                                                <span
                                                    key={`${reaction.user}-${reaction.type}`}
                                                    className="rounded-full border bg-background px-2 py-0.5 text-xs shadow"
                                                >
                                                    {reaction.type}
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Read status */}
                                    {statusLabel && (
                                        <span
                                            className={cn(
                                                "text-[11px]",
                                                message.status === "read"
                                                    ? "text-sky-500"
                                                    : "text-muted-foreground"
                                            )}
                                        >
                                            {statusLabel}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                {isLoadingOlderMessages ? <div className="text-center text-xs text-muted-foreground">Loading older messages...</div> : null}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
                <Input value={draft} onChange={handleChange} placeholder="Type a message..." className="flex-1" />
                <Button type="submit" size="icon" disabled={!draft.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}