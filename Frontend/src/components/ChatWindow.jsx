import { useEffect, useLayoutEffect, useRef, useState } from "react";
import useChatStore from "../Stores/useChatStore";
import useAuthStore from "../Stores/useAuthStore";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Send, MessageCircle, ChevronDown, Link } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import AnimatedBackground from "@/components/AnimatedBackground";
import { FileInputDialog } from "./FileInputDialog";

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
    const [showScrollButton, setShowScrollButton] = useState(false);
    const bottomRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const previousMessageCount = useRef(0);
    const initialScrollDoneRef = useRef(false);
    const olderLoadPrevHeightRef = useRef(null);
    const olderLoadPrevScrollRef = useRef(null);
    const [visiblity, setVisiblity] = useState(false);

    useLayoutEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || messages.length === 0) return;

        const isOpeningConversation = previousMessageCount.current === 0 && !isLoadingMessages;
        const isAppendingAtBottom = messages.length > previousMessageCount.current && !isLoadingOlderMessages;
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120;

        if (isOpeningConversation || (isAppendingAtBottom && isNearBottom)) {
            container.scrollTop = container.scrollHeight;
            initialScrollDoneRef.current = true;
        }

        previousMessageCount.current = messages.length;
    }, [messages, activeConversation?._id, isLoadingMessages, isLoadingOlderMessages]);

    useEffect(() => {
        previousMessageCount.current = 0;
        initialScrollDoneRef.current = false;
    }, [activeConversation?._id]);

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
            <div className="relative flex h-full flex-col items-center justify-center gap-2 overflow-hidden bg-background">
                <AnimatedBackground />
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    transition={{ type: "spring", damping: 20, stiffness: 100 }}
                    className="z-10 flex flex-col items-center text-muted-foreground glass p-10 rounded-3xl border border-white/10 shadow-2xl"
                >
                    <div className="bg-primary/20 p-4 rounded-full mb-4 animate-float">
                        <MessageCircle className="h-10 w-10 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-1 text-gradient">Your Messages</h2>
                    <p className="text-sm">Select a conversation to start chatting</p>
                </motion.div>
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
        if (!container) return;
        
        // Show scroll button if not near bottom
        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
        setShowScrollButton(!isNearBottom);

        if (isLoadingMessages || !initialScrollDoneRef.current || isLoadingOlderMessages || !hasMoreMessages) return;
        
        if (container.scrollTop <= 80) {
            olderLoadPrevHeightRef.current = container.scrollHeight;
            olderLoadPrevScrollRef.current = container.scrollTop;
            loadOlderMessages();
        }
    };

    const scrollToBottom = () => {
        const container = scrollContainerRef.current;
        if (container) {
            container.scrollTo({ top: container.scrollHeight, behavior: 'smooth' });
        }
    };

    return (
        <div className="relative flex h-full min-h-0 flex-col bg-background/50">
            <div className="flex items-center gap-4 border-b border-white/10 glass-subtle p-4 z-10 shadow-sm">
                <div className="relative">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-foreground shadow-md">
                        <span className="font-bold text-lg">
                            {(other?.username || other?.email || "C").trim().charAt(0).toUpperCase()}
                        </span>
                    </div>
                    <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-white/70 border-2 border-background animate-pulse"></div>
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground truncate text-lg">
                        {other?.username || other?.email || "Chat"}
                    </div>
                    <AnimatePresence mode="wait">
                        {isOtherTyping ? (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="flex items-center gap-1 text-xs text-foreground font-medium"
                            >
                                <span>typing</span>
                                <span className="flex gap-0.5 ml-0.5">
                                    <span className="h-1 w-1 animate-dot-bounce rounded-full bg-current" />
                                    <span className="h-1 w-1 animate-dot-bounce rounded-full bg-current [animation-delay:150ms]" />
                                    <span className="h-1 w-1 animate-dot-bounce rounded-full bg-current [animation-delay:300ms]" />
                                </span>
                            </motion.div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="text-xs text-muted-foreground truncate"
                            >
                                {other?.email}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4 pb-6 scroll-smooth">
                {isLoadingOlderMessages && (
                    <div className="flex justify-center py-2">
                        <div className="glass-subtle px-4 py-1.5 rounded-full text-xs font-medium text-muted-foreground flex items-center gap-2">
                            <span className="h-3 w-3 border-2 border-border border-t-transparent rounded-full animate-spin"></span>
                            Loading older messages...
                        </div>
                    </div>
                )}
                
                {isLoadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="glass p-6 rounded-2xl flex flex-col items-center gap-3">
                            <span className="h-6 w-6 border-2 border-border border-t-transparent rounded-full animate-spin"></span>
                            <span className="text-sm font-medium">Loading messages...</span>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="glass px-6 py-4 rounded-2xl text-sm font-medium text-muted-foreground"
                        >
                            No messages yet. Say hello! 👋
                        </motion.div>
                    </div>
                ) : (
                    messages.map((message, i) => {
                        const isMine = (message.sender?._id || message.sender) === user?._id;
                        const statusLabel = isMine ? (message.status === "read" ? "✓✓" : "✓") : null;

                        return (
                            <motion.div 
                                key={message._id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ duration: 0.2, delay: Math.min(i * 0.02, 0.2) }}
                                className={cn("group flex flex-col gap-1 w-full", isMine ? "items-end" : "items-start")}
                            >
                                <div className={cn("group relative flex flex-col gap-1 max-w-[75%]", isMine ? "items-end" : "items-start")}>
                                    {/* Floating reaction picker */}
                                    <div
                                        className={cn(
                                            "absolute top-1/2 -translate-y-1/2 z-20",
                                            "opacity-0 scale-90 pointer-events-none",
                                            "group-hover:opacity-100 group-hover:scale-100 group-hover:pointer-events-auto",
                                            "transition-all duration-300 ease-out",
                                            isMine ? "right-full mr-2" : "left-full ml-2"
                                        )}
                                    >
                                        <div className="flex gap-1 rounded-full border border-white/20 glass px-2 py-1.5 shadow-xl backdrop-blur-md">
                                            {reactionOptions.map((emoji) => (
                                                <button
                                                    key={emoji}
                                                    type="button"
                                                    onClick={() => reactToMessage(message._id, emoji)}
                                                    className="text-lg transition-transform hover:scale-150 hover:-translate-y-1 px-1"
                                                >
                                                    {emoji}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Message bubble */}
                                    <div
                                        className={cn(
                                            "rounded-2xl px-4 py-2.5 text-[15px] shadow-md leading-relaxed whitespace-pre-wrap wrap-break-words",
                                            isMine
                                                ? "msg-own rounded-tr-sm text-white"
                                                : "msg-other rounded-tl-sm border border-border/50 text-foreground"
                                        )}
                                    >
                                        {message.content}
                                    </div>

                                    {/* Status & Reactions */}
                                    <div className={cn("flex items-center gap-2", isMine ? "flex-row-reverse" : "flex-row")}>
                                        {/* Read status */}
                                        {statusLabel && (
                                            <span
                                                className={cn(
                                                    "text-[10px] font-medium tracking-tighter",
                                                    message.status === "read"
                                                        ? "text-muted-foreground"
                                                        : "text-muted-foreground/60"
                                                )}
                                            >
                                                {statusLabel}
                                            </span>
                                        )}
                                        
                                        {/* Existing reactions */}
                                        {message.reactions?.length > 0 && (
                                            <div className="flex gap-1">
                                                {message.reactions.map((reaction) => (
                                                    <motion.span
                                                        initial={{ scale: 0 }}
                                                        animate={{ scale: 1 }}
                                                        key={`${reaction.user}-${reaction.type}`}
                                                        className="rounded-full border border-white/10 glass-subtle px-1.5 py-0.5 text-[10px] shadow-sm"
                                                    >
                                                        {reaction.type}
                                                    </motion.span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
                <div ref={bottomRef} className="h-1" />
            </div>

            {/* Scroll to bottom button */}
            <AnimatePresence>
                {showScrollButton && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.8 }}
                        className="absolute bottom-20 right-6 z-30"
                    >
                        <Button 
                            size="icon" 
                            variant="secondary" 
                            className="h-10 w-10 rounded-full shadow-lg border bg-primary/20 border-primary/30 glass hover:bg-primary/10"
                            onClick={scrollToBottom}
                        >
                            <ChevronDown className="h-5 w-5" />
                        </Button>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="p-4 glass-subtle border-t border-white/10 z-20 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
                <form onSubmit={handleSend} className="flex gap-3 max-w-4xl mx-auto items-center">
                    <Button 
                        size="icon"
                        className="cursor-pointer"
                        onClick={e=>setVisiblity(true)}
                    >
                    <Link className="h-3.5 w-4" />
                    </Button>
                    <Input 
                        value={draft} 
                        onChange={handleChange} 
                        placeholder="Type a message..." 
                        className="flex-1 rounded-full bg-background/50 border-border/50 focus-visible:ring-primary focus-visible:ring-offset-0 px-5 shadow-inner" 
                    />
                    <Button 
                        type="submit" 
                        size="icon" 
                        disabled={!draft.trim()}
                        className={cn(
                            "rounded-full h-10 w-10 shrink-0 transition-all duration-300",
                            draft.trim() ? "bg-white/10 shadow-md hover:bg-white/20 hover:shadow-lg hover:scale-105 text-foreground" : "bg-muted text-muted-foreground"
                        )}
                    >
                        <Send className={cn("h-4 w-4", draft.trim() && "text-foreground")} />
                    </Button>
                </form>
            </div>
            <FileInputDialog openFileDialog={visiblity} setOpenFileDialog={setVisiblity}/>
        </div>
    );
}