import { useEffect, useRef, useState } from "react";
import useChatStore from "../Stores/useChatStore";
import useAuthStore from "../Stores/useAuthStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

let typingTimeout = null;

export default function ChatWindow() {
    const { user } = useAuthStore();
    const { activeConversation, messages, isLoadingMessages, sendMessage, emitTyping, typingUsers } =
        useChatStore();
    const [draft, setDraft] = useState("");
    const bottomRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    if (!activeConversation) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-muted-foreground">
                <MessageCircle className="h-10 w-10" />
                <p>Select a conversation to start chatting</p>
            </div>
        );
    }

    const other = activeConversation.participants.find((p) => p.user._id !== user?._id)?.user;
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

    return (
        <div className="flex h-full flex-col">
            <div className="flex items-center gap-3 border-b p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                    <div className="font-medium">{other?.username || other?.email || "Chat"}</div>
                    {isOtherTyping && <div className="text-xs text-muted-foreground">typing...</div>}
                </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto p-4">
                {isLoadingMessages ? (
                    <div className="text-sm text-muted-foreground">Loading messages...</div>
                ) : messages.length === 0 ? (
                    <div className="text-sm text-muted-foreground">
                        No messages yet. Say hello!
                    </div>
                ) : (
                    messages.map((message) => {
                        const isMine =
                            (message.sender?._id || message.sender) === user?._id;
                        return (
                            <div
                                key={message._id}
                                className={cn("flex", isMine ? "justify-end" : "justify-start")}
                            >
                                <div
                                    className={cn(
                                        "max-w-[70%] rounded-lg px-3 py-2 text-sm",
                                        isMine
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted text-foreground"
                                    )}
                                >
                                    {message.content}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={handleSend} className="flex gap-2 border-t p-3">
                <Input
                    value={draft}
                    onChange={handleChange}
                    placeholder="Type a message..."
                    className="flex-1"
                />
                <Button type="submit" size="icon" disabled={!draft.trim()}>
                    <Send className="h-4 w-4" />
                </Button>
            </form>
        </div>
    );
}