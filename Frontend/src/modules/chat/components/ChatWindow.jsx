import { useEffect, useLayoutEffect, useRef, useState } from "react";
import useChatStore from "../stores/useChatStore";
import useAuthStore from "@/modules/auth/stores/useAuthStore";
import useFileStore from "../stores/useFileStore";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Send, MessageCircle, ChevronDown, Link } from "lucide-react";
import { cn } from "@/core/utils/utils";
import AnimatedBackground from "@/core/components/AnimatedBackground";
import Avatar from "@/core/components/Avatar";
import MessageBubble from "./MessageBubble";
import FileAttachmentBar from "./FileAttachmentBar";
import ImageViewDialog from "./ImageViewDialog";

let typingTimeout = null;

export default function ChatWindow() {
    const { user } = useAuthStore();
    const {
        activeConversation,
        messages,
        isLoadingMessages,
        isLoadingOlderMessages,
        hasMoreMessages,
        sendMessage,
        addOptimisticMessage,
        emitTyping,
        typingUsers,
        loadOlderMessages,
        reactToMessage,
    } = useChatStore();

    const { items, addFiles, sendItemsAsOptimisticMessage, retryUpload } = useFileStore();

    const [draft, setDraft] = useState("");
    const [showScrollButton, setShowScrollButton] = useState(false);
    const bottomRef = useRef(null);
    const firstUnreadRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const previousMessageCount = useRef(0);
    const initialScrollDoneRef = useRef(false);
    const isAutoScrollingRef = useRef(false);
    const unreadMessageIdRef = useRef(null);
    const olderLoadPrevHeightRef = useRef(null);
    const olderLoadPrevScrollRef = useRef(null);
    const fileInputRef = useRef(null);

    const [chatViewerOpen, setChatViewerOpen] = useState(false);
    const [chatViewerImages, setChatViewerImages] = useState([]);
    const [chatViewerIndex, setChatViewerIndex] = useState(0);

    const canSend = draft.trim().length > 0 || (items && items.length > 0);

    useLayoutEffect(() => {
        previousMessageCount.current = 0;
        initialScrollDoneRef.current = false;
        unreadMessageIdRef.current = null;
        isAutoScrollingRef.current = false;
    }, [activeConversation?._id]);

    useLayoutEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || isLoadingMessages || messages.length === 0) return;

        if (!initialScrollDoneRef.current) {
            isAutoScrollingRef.current = true;

            const firstUnread = messages.find(
                (m) => (m.sender?._id || m.sender) !== user?._id && m.status !== "read"
            );
            if (firstUnread) {
                unreadMessageIdRef.current = firstUnread._id;
            } else {
                unreadMessageIdRef.current = null;
            }

            requestAnimationFrame(() => {
                if (unreadMessageIdRef.current && firstUnreadRef.current) {
                    firstUnreadRef.current.scrollIntoView({ block: "start", behavior: "auto" });
                } else if (bottomRef.current) {
                    bottomRef.current.scrollIntoView({ block: "end", behavior: "auto" });
                } else {
                    container.scrollTop = container.scrollHeight;
                }

                setShowScrollButton(false);
                initialScrollDoneRef.current = true;
                previousMessageCount.current = messages.length;

                setTimeout(() => {
                    isAutoScrollingRef.current = false;
                }, 300);
            });
            return;
        }

        const isAppendingAtBottom = messages.length > previousMessageCount.current && !isLoadingOlderMessages;
        if (isAppendingAtBottom) {
            const lastMessage = messages[messages.length - 1];
            const isMine = (lastMessage?.sender?._id || lastMessage?.sender) === user?._id;
            const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;

            if (isMine || isNearBottom) {
                isAutoScrollingRef.current = true;
                if (bottomRef.current) {
                    bottomRef.current.scrollIntoView({ block: "end", behavior: isMine ? "smooth" : "auto" });
                } else {
                    container.scrollTop = container.scrollHeight;
                }
                setShowScrollButton(false);
                setTimeout(() => {
                    isAutoScrollingRef.current = false;
                }, 300);
            }
        }

        previousMessageCount.current = messages.length;
    }, [messages, activeConversation?._id, isLoadingMessages, isLoadingOlderMessages, user?._id]);

    useEffect(() => {
        const container = scrollContainerRef.current;
        if (!container) return;
        if (!isLoadingOlderMessages && olderLoadPrevHeightRef.current !== null) {
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
                <div className="z-10 flex flex-col items-center text-muted-foreground glass p-10 rounded-3xl border border-white/10 shadow-2xl animate-scale-in">
                    <div className="bg-primary/20 p-4 rounded-full mb-4 animate-float">
                        <MessageCircle className="h-10 w-10 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground mb-1 text-gradient">Your Messages</h2>
                    <p className="text-sm">Select a conversation to start chatting</p>
                </div>
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

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            addFiles(files);
        }
        e.target.value = "";
    };

    const handleSend = (e) => {
        e.preventDefault();
        const text = draft.trim();

        if (items && items.length > 0) {
            const tempId = `temp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
            const optimisticAttachments = sendItemsAsOptimisticMessage({
                messageId: tempId,
                content: text,
            });

            const optimisticMsg = {
                _id: tempId,
                sender: user,
                conversation: activeConversation._id,
                content: text,
                attachments: optimisticAttachments,
                status: "sending",
                createdAt: new Date().toISOString(),
                isOptimistic: true,
            };

            addOptimisticMessage(optimisticMsg);
            setDraft("");
            emitTyping(false);
            clearTimeout(typingTimeout);
            return;
        }

        if (text) {
            sendMessage({ content: text });
            setDraft("");
            emitTyping(false);
            clearTimeout(typingTimeout);
        }
    };

    const handleScroll = () => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 200;
        setShowScrollButton(!isNearBottom);

        if (
            isLoadingMessages ||
            !initialScrollDoneRef.current ||
            isLoadingOlderMessages ||
            !hasMoreMessages ||
            isAutoScrollingRef.current
        ) {
            return;
        }

        if (container.scrollTop <= 80) {
            olderLoadPrevHeightRef.current = container.scrollHeight;
            olderLoadPrevScrollRef.current = container.scrollTop;
            loadOlderMessages();
        }
    };

    const scrollToBottom = () => {
        const container = scrollContainerRef.current;
        if (container) {
            container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        }
    };

    const handleChatMessageImageClick = (message, clickedIdx) => {
        const imageAttachments = (message.attachments || []).filter((att) => att.fileType?.startsWith("image/"));
        const formattedImages = imageAttachments.map((att) => {
            const fileUrl = att.url?.startsWith("http") || att.url?.startsWith("blob:")
                ? att.url
                : new URL(att.url, import.meta.env.VITE_API_URL || "http://localhost:5000").toString();
            return {
                src: fileUrl,
                name: att.name || "Attachment",
            };
        });

        if (formattedImages.length > 0) {
            setChatViewerImages(formattedImages);
            setChatViewerIndex(clickedIdx);
            setChatViewerOpen(true);
        }
    };

    return (
        <div className="relative flex h-full min-h-0 flex-col bg-slate-50/50">
            {/* Header */}
            <div className="flex items-center gap-3.5 border-b border-slate-200/80 bg-white p-4 z-10 shadow-xs">
                <Avatar
                    src={other?.avatar}
                    name={other?.username || other?.email}
                    size="md"
                    showStatus={true}
                    status={other?.status || "online"}
                />
                <div className="flex-1 min-w-0">
                    <div className="font-bold text-slate-900 truncate text-base">
                        {other?.username || other?.email || "Chat"}
                    </div>
                    {isOtherTyping ? (
                        <div className="flex items-center gap-1 text-xs text-blue-600 font-semibold animate-fade-in">
                            <span>typing</span>
                            <span className="flex gap-0.5 ml-0.5">
                                <span className="h-1 w-1 animate-dot-bounce rounded-full bg-blue-600" />
                                <span className="h-1 w-1 animate-dot-bounce rounded-full bg-blue-600 [animation-delay:150ms]" />
                                <span className="h-1 w-1 animate-dot-bounce rounded-full bg-blue-600 [animation-delay:300ms]" />
                            </span>
                        </div>
                    ) : (
                        <div className="text-xs text-slate-500 truncate animate-fade-in font-normal">
                            {other?.email}
                        </div>
                    )}
                </div>
            </div>

            {/* Messages Scroll Area */}
            <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4 pb-6">
                {isLoadingOlderMessages && (
                    <div className="flex justify-center py-2">
                        <div className="bg-white border border-slate-200 shadow-xs px-4 py-1.5 rounded-full text-xs font-medium text-slate-600 flex items-center gap-2">
                            <span className="loading loading-spinner loading-xs text-blue-600"></span>
                            Loading older messages...
                        </div>
                    </div>
                )}

                {isLoadingMessages ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="bg-white border border-slate-200 shadow-lg shadow-blue-900/5 p-6 rounded-2xl flex flex-col items-center gap-3">
                            <span className="loading loading-spinner text-blue-600 loading-md"></span>
                            <span className="text-sm font-medium text-slate-700">Loading messages...</span>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                        <div className="bg-white border border-slate-200 shadow-xs px-6 py-4 rounded-2xl text-sm font-medium text-slate-500 animate-fade-in">
                            No messages yet. Say hello! 👋
                        </div>
                    </div>
                ) : (
                    messages.map((message) => {
                        const isMine = (message.sender?._id || message.sender) === user?._id;
                        const isFirstUnread = unreadMessageIdRef.current && message._id === unreadMessageIdRef.current;

                        return (
                            <MessageBubble
                                key={message._id}
                                ref={isFirstUnread ? firstUnreadRef : null}
                                message={message}
                                isMine={isMine}
                                isFirstUnread={isFirstUnread}
                                reactToMessage={reactToMessage}
                                onImageClick={handleChatMessageImageClick}
                                onRetry={(att) => retryUpload(att)}
                            />
                        );
                    })
                )}
                <div ref={bottomRef} className="h-1" />
            </div>

            {/* Scroll to bottom button */}
            {showScrollButton && (
                <div className="absolute bottom-20 right-6 z-30 animate-fade-in-up">
                    <Button
                        size="icon"
                        variant="secondary"
                        className="h-10 w-10 rounded-full shadow-md border border-slate-200 bg-white hover:bg-slate-50 text-blue-600"
                        onClick={scrollToBottom}
                    >
                        <ChevronDown className="h-5 w-5" />
                    </Button>
                </div>
            )}

            {/* Inline File Attachment Bar (Pre-Send Preview & Captions) */}
            <FileAttachmentBar onAddMoreFiles={() => fileInputRef.current?.click()} />

            {/* Input Form Bar */}
            <div className="p-3.5 bg-white border-t border-slate-200/80 z-20 shadow-xs">
                <form onSubmit={handleSend} className="flex gap-2.5 max-w-4xl mx-auto items-center">
                    <input
                        type="file"
                        ref={fileInputRef}
                        multiple
                        className="hidden"
                        accept="image/jpeg,image/png,image/gif,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,video/mp4"
                        onChange={handleFileChange}
                    />

                    <Button
                        size="icon"
                        variant="outline"
                        className="h-11 w-11 rounded-full border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 shrink-0 cursor-pointer"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Link className="h-4 w-4" />
                    </Button>

                    <Input
                        value={draft}
                        onChange={handleChange}
                        placeholder="Type a message..."
                        className="flex-1 h-11 rounded-full bg-slate-50/80 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 px-5 text-sm"
                    />

                    <Button
                        type="submit"
                        size="icon"
                        disabled={!canSend}
                        className={cn(
                            "rounded-full h-11 w-11 shrink-0 transition-all duration-200",
                            canSend
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 hover:scale-105 active:scale-95 border-none cursor-pointer"
                                : "bg-slate-100 text-slate-400 border-none cursor-not-allowed"
                        )}
                    >
                        <Send className="h-4 w-4" />
                    </Button>
                </form>
            </div>

            {/* Lightbox Image View Dialog */}
            <ImageViewDialog
                open={chatViewerOpen}
                onOpenChange={setChatViewerOpen}
                images={chatViewerImages}
                initialIndex={chatViewerIndex}
            />
        </div>
    );
}