import React, { useEffect, useLayoutEffect, useRef, useState, type ChangeEvent } from "react";
import useChatStore from "../stores/useChatStore";
import useAuthStore from "@/modules/auth/stores/useAuthStore";
import useFileStore from "../stores/useFileStore";
import { socket } from "@/core/socket/socket.js";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { Send, MessageCircle, ChevronDown,  Link, Users, UserPlus, Camera } from "lucide-react";
import { cn } from "@/core/utils/utils";
import AnimatedBackground from "@/core/components/AnimatedBackground";
import Avatar from "@/core/components/Avatar";
import MessageBubble from "./MessageBubble";
import FileAttachmentBar from "./FileAttachmentBar";
import ImageViewDialog from "./ImageViewDialog";
import InviteToGroupModal from "../groupChat/InviteToGroupModal";
import GroupMembersModal from "../groupChat/GroupMembersModal";
import { axiosInstance } from "@/core/api/axiosInstance";
import toast from "react-hot-toast";
import type { MessageInterface } from "@/core/types/MessageInterface";
import type { AttachmentInterface } from "@/core/types/AttachmentInterface";

let typingTimeout = null;

export default function ChatWindow() {
    const { user } = useAuthStore();
    const activeConversation = useChatStore((state) => state.activeConversation);
    const messages = useChatStore((state) => state.messages);
    const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
    const isLoadingOlderMessages = useChatStore((state) => state.isLoadingOlderMessages);
    const hasMoreMessages = useChatStore((state) => state.hasMoreMessages);
    const sendMessage = useChatStore((state) => state.sendMessage);
    const addOptimisticMessage = useChatStore((state) => state.addOptimisticMessage);
    const emitTyping = useChatStore((state) => state.emitTyping);
    const typingUsers = useChatStore((state) => state.typingUsers);
    const loadOlderMessages = useChatStore((state) => state.loadOlderMessages);
    const reactToMessage = useChatStore((state) => state.reactToMessage);
    const updateGroupAvatar = useChatStore((state) => state.updateGroupAvatar);

    const { items, addFiles, sendItemsAsOptimisticMessage, retryUpload } = useFileStore();

    const [draft, setDraft] = useState("");
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [firstUnreadId, setFirstUnreadId] = useState(undefined);
    const bottomRef = useRef(null);
    const firstUnreadRef = useRef(null);
    const scrollContainerRef = useRef(null);
    const previousMessageCount = useRef(0);
    const initialScrollDoneRef = useRef(false);
    const isAutoScrollingRef = useRef(false);
    const olderLoadPrevHeightRef = useRef(null);
    const olderLoadPrevScrollRef = useRef(null);
    const fileInputRef = useRef(null);
    const groupAvatarInputRef = useRef(null);

    const [chatViewerOpen, setChatViewerOpen] = useState(false);
    const [chatViewerImages, setChatViewerImages] = useState([]);
    const [chatViewerIndex, setChatViewerIndex] = useState(0);

    const [showInviteModal, setShowInviteModal] = useState(false);
    const [showMembersModal, setShowMembersModal] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    const canSend = draft.trim().length > 0 || (items && items.length > 0);

    const isUnreadForMe = (m) => {
        if (!m || !user) return false;
        const senderId = (m.sender?._id || m.sender)?.toString();
        const myId = (user._id || user.id)?.toString();
        if (!senderId || !myId || senderId === myId) return false;

        if (Array.isArray(m.readBy) && m.readBy.length > 0) {
            const hasRead = m.readBy.some((r) => {
                const rUserId = (r.user?._id || r.user)?.toString();
                return rUserId === myId;
            });
            if (hasRead) return false;
        }

        return m.status !== "read";
    };

    const handleGroupAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !activeConversation?._id) return;
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append("file", file);
            const res = await axiosInstance.post("/upload/avatar", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const fileUrl = res.data?.file?.url || res.data?.url;
            if (fileUrl) {
                await updateGroupAvatar(activeConversation._id, fileUrl);
                toast.success("Group avatar updated successfully");
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to upload group avatar");
        } finally {
            setUploadingAvatar(false);
            e.target.value = "";
        }
    };

    useLayoutEffect(() => {
        previousMessageCount.current = 0;
        initialScrollDoneRef.current = false;
        isAutoScrollingRef.current = false;
        // setShowJumpToUnread(false);
        setFirstUnreadId(undefined);
    }, [activeConversation?._id]);

    // Effect A — compute the first unread message id once messages load
    useLayoutEffect(() => {
        if (isLoadingMessages || messages.length === 0) return;
        if (initialScrollDoneRef.current) return;
        if (firstUnreadId !== undefined) return;

        const firstUnread = messages.find(isUnreadForMe);
        setFirstUnreadId(firstUnread ? (firstUnread._id?.toString?.() || firstUnread._id) : null);
    }, [messages, isLoadingMessages, firstUnreadId]);

    // Effect B — scroll once firstUnreadId is known. Because this depends on
    // firstUnreadId (state), it only runs on the render AFTER the correct
    // bubble has already received firstUnreadRef — so the ref is guaranteed set.
    useLayoutEffect(() => {
        if (firstUnreadId === undefined) return;
        if (initialScrollDoneRef.current) return;
        const container = scrollContainerRef.current;
        if (!container || isLoadingMessages || messages.length === 0) return;

        isAutoScrollingRef.current = true;

        requestAnimationFrame(() => {
            if (firstUnreadId && firstUnreadRef.current) {
                firstUnreadRef.current.scrollIntoView({ block: "center", behavior: "auto" });
            } else if (bottomRef.current) {
                bottomRef.current.scrollIntoView({ block: "end", behavior: "auto" });
            } else {
                container.scrollTop = container.scrollHeight;
            }

            setShowScrollButton(false);
            // setShowJumpToUnread(false);
            initialScrollDoneRef.current = true;
            previousMessageCount.current = messages.length;

            const last = messages[messages.length - 1];
            if (last && activeConversation?._id) {
                socket.emit("message:read", {
                    conversationId: activeConversation._id,
                    lastMessageId: last._id,
                });
            }

            setTimeout(() => {
                isAutoScrollingRef.current = false;
            }, 300);
        });
    }, [firstUnreadId, messages, isLoadingMessages, activeConversation?._id]);

    // Effect C — auto-scroll to bottom for new messages after the initial load
    useLayoutEffect(() => {
        const container = scrollContainerRef.current;
        if (!container || isLoadingMessages || messages.length === 0) return;
        if (!initialScrollDoneRef.current) return;

        const isAppendingAtBottom = messages.length > previousMessageCount.current && !isLoadingOlderMessages;
        if (isAppendingAtBottom) {
            const lastMessage = messages[messages.length - 1];
            const isMine = (lastMessage?.sender?._id || lastMessage?.sender) === user?._id;
            if (isMine || container.scrollHeight - container.scrollTop - container.clientHeight < 150) {
                requestAnimationFrame(() => {
                    if (bottomRef.current) {
                        bottomRef.current.scrollIntoView({ block: "end", behavior: "smooth" });
                    }
                });
            }
        }
        previousMessageCount.current = messages.length;
    }, [messages, isLoadingMessages, isLoadingOlderMessages, user?._id]);

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

    const isGroup = activeConversation.type === "group";
    const currentUserId = (user?._id || user?.id)?.toString();
    const otherParticipant = activeConversation.participants?.find(
        (p) => p.user && (p.user?._id || p.user?.id || p.user)?.toString() !== currentUserId
    );
    const other = isGroup ? null : otherParticipant?.user;

    const currentParticipant = activeConversation.participants?.find(
        (p) => (p.user?._id || p.user)?.toString() === currentUserId
    );
    const isAdmin = isGroup && currentParticipant?.role === "admin";

    const othersTyping = typingUsers[activeConversation._id];
    const isOtherTyping = othersTyping && othersTyping.size > 0;

    const getTypingText = () => {
        if (!isOtherTyping) return null;
        const currentUserId = (user?._id || user?.id)?.toString();
        const typingIds = Array.from(othersTyping).filter((id) => id !== currentUserId);
        if (typingIds.length === 0) return null;

        const names = typingIds.map((id) => {
            const participant = activeConversation.participants?.find(
                (p) => (p.user?._id || p.user)?.toString() === id
            );
            const u = participant?.user;
            if (typeof u === "object" && u !== null) {
                return u.username || u.email?.split("@")[0] || "Someone";
            }
            return "Someone";
        });

        if (names.length === 1) {
            return `${names[0]} is typing...`;
        } else if (names.length === 2) {
            return `${names[0]} and ${names[1]} are typing...`;
        } else if (names.length === 3) {
            return `${names[0]}, ${names[1]}, and ${names[2]} are typing...`;
        } else {
            return `${names[0]}, ${names[1]} and ${names.length - 2} others are typing...`;
        }
    };

    const typingText = getTypingText();

    const handleChange = (e:ChangeEvent<HTMLInputElement, HTMLInputElement>) => {
        setDraft(e.target.value);
        emitTyping(true);
        clearTimeout(typingTimeout);
        typingTimeout = setTimeout(() => emitTyping(false), 1500);
    };

    const handleFileChange = (e : React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 0) {
            addFiles(files);
        }
        e.target.value = "";
    };

    const handleSend = (e : React.FormEvent<HTMLFormElement>) => {
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


    const handleChatMessageImageClick = (message : MessageInterface, clickedIdx : number) => {
        const imageAttachments = (message.attachments || []).filter((att) => att.fileType?.startsWith("image/"));
        const formattedImages = imageAttachments.map((att) => {
            const fileUrl = att.url?.startsWith("http") || att.url?.startsWith("blob:")
                ? att.url
                : new URL(att.url, import.meta.env.VITE_API_URL||"https://chatapp-backend-s1n2.onrender.com" || "http://localhost:5000").toString();
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
        <div className="relative flex h-full min-h-0 flex-col bg-base-200/30 text-base-content">
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-base-300 bg-base-100/90 backdrop-blur-md p-3.5 z-10 shadow-xs">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                    {isGroup ? (
                        <div className="relative shrink-0 group">
                            {activeConversation.avatar ? (
                                <Avatar
                                    src={activeConversation.avatar}
                                    name={activeConversation.name}
                                    size="md"
                                />
                            ) : (
                                <div className="h-10 w-10 rounded-full bg-primary text-primary-content flex items-center justify-center font-bold shadow-xs">
                                    <Users className="h-5 w-5" />
                                </div>
                            )}
                            {isAdmin && (
                                <button
                                    onClick={() => groupAvatarInputRef.current?.click()}
                                    disabled={uploadingAvatar}
                                    className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    title="Upload group avatar"
                                >
                                    {uploadingAvatar ? (
                                        <span className="loading loading-spinner loading-xs text-white"></span>
                                    ) : (
                                        <Camera className="h-4 w-4" />
                                    )}
                                </button>
                            )}
                            <input
                                type="file"
                                ref={groupAvatarInputRef}
                                onChange={handleGroupAvatarChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <Avatar
                            src={other?.avatar}
                            name={other?.username || other?.email}
                            size="md"
                            showStatus={true}
                            status={other?.status || "offline"}
                        />
                    )}

                    <div className="flex-1 min-w-0">
                        <div className="font-bold text-base-content truncate text-base flex items-center gap-2">
                            <span>{isGroup ? (activeConversation.name || "Group Chat") : (other?.username || other?.email || "User")}</span>
                            {isGroup && isAdmin && (
                                <span className="badge badge-sm bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px]">
                                    Admin
                                </span>
                            )}
                            {!isGroup && activeConversation.isConvertedFromGroup && (
                                <span
                                    className="badge badge-sm bg-amber-50 text-amber-700 border-amber-200 font-bold text-[10px]"
                                    title={activeConversation.formerGroupName ? `Converted from group: ${activeConversation.formerGroupName}` : "Converted from group"}
                                >
                                    From Group{activeConversation.formerGroupName ? `: ${activeConversation.formerGroupName}` : ""}
                                </span>
                            )}
                        </div>
                        {typingText ? (
                            <div className="flex items-center gap-1.5 text-xs text-primary font-semibold animate-fade-in">
                                <span>{typingText}</span>
                                <span className="flex gap-0.5 ml-0.5">
                                    <span className="h-1 w-1 animate-dot-bounce rounded-full bg-primary" />
                                    <span className="h-1 w-1 animate-dot-bounce rounded-full bg-primary [animation-delay:150ms]" />
                                    <span className="h-1 w-1 animate-dot-bounce rounded-full bg-primary [animation-delay:300ms]" />
                                </span>
                            </div>
                        ) : (
                            <div className="text-xs text-base-content/60 truncate animate-fade-in font-normal flex items-center gap-1">
                                {isGroup ? (
                                    <button
                                        onClick={() => setShowMembersModal(true)}
                                        className="hover:text-primary hover:underline flex items-center gap-1"
                                    >
                                        <Users className="h-3 w-3 text-base-content/40" />
                                        <span>{(activeConversation.participants?.filter((p) => p.user && (p.user._id || p.user.id || p.user)).length) || 0} members</span>
                                    </button>
                                ) : (
                                    <span>{other?.email}</span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {isGroup && (
                    <div className="flex items-center gap-1.5 shrink-0">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowMembersModal(true)}
                            className="h-8 gap-1 rounded-lg text-xs font-semibold border-base-300 text-base-content hover:bg-base-200"
                        >
                            <Users className="h-3.5 w-3.5 opacity-70" />
                            <span className="hidden sm:inline">Members</span>
                        </Button>
                        {isAdmin && <Button
                            size="sm"
                            onClick={() => setShowInviteModal(true)}
                            className="h-8 gap-1.5 rounded-lg text-xs font-semibold bg-primary hover:opacity-90 text-primary-content shadow-xs border-none"
                        >
                            <UserPlus className="h-3.5 w-3.5" />
                            <span>Invite</span>
                        </Button>}
                    </div>
                )}
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
                        <div className="bg-ssecondary border border-slate-200 shadow-xs px-6 py-4 rounded-2xl text-sm text-primary font-medium animate-fade-in">
                            No messages yet. Say hello! 👋
                        </div>
                    </div>
                ) : (
                    messages.map((message) => {
                        const msgIdStr = (message._id?.toString?.() || message._id);
                        const senderIdStr = (message.sender?._id || message.sender)?.toString();
                        const myIdStr = (user?._id || user?.id)?.toString();
                        const isMine = Boolean(senderIdStr && myIdStr && senderIdStr === myIdStr);
                        const unreadIdStr = firstUnreadId?.toString?.();
                        const isFirstUnread = Boolean(unreadIdStr && msgIdStr === unreadIdStr);

                        return (
                            <MessageBubble
                                key={message._id}
                                ref={isFirstUnread ? firstUnreadRef : null}
                                message={message}
                                isMine={isMine}
                                isGroup={isGroup}
                                isFirstUnread={isFirstUnread}
                                reactToMessage={reactToMessage}
                                onImageClick={handleChatMessageImageClick}
                                onRetry={(att : AttachmentInterface) => retryUpload(att)}
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

            {/* Animated Typing Bar above input form */}
            {typingText && (
                <div className="px-4 py-2 bg-white/95 backdrop-blur-md border-t border-slate-200/60 flex items-center gap-2.5 text-xs text-blue-600 font-semibold animate-fade-in z-10 shadow-2xs">
                    <div className="flex gap-1 items-center bg-blue-50 px-2 py-1 rounded-full border border-blue-200/60">
                        <span className="h-1.5 w-1.5 animate-dot-bounce rounded-full bg-blue-600" />
                        <span className="h-1.5 w-1.5 animate-dot-bounce rounded-full bg-blue-600 [animation-delay:150ms]" />
                        <span className="h-1.5 w-1.5 animate-dot-bounce rounded-full bg-blue-600 [animation-delay:300ms]" />
                    </div>
                    <span>{typingText}</span>
                </div>
            )}

            {/* Inline File Attachment Bar (Pre-Send Preview & Captions) */}
            <FileAttachmentBar onAddMoreFiles={() => fileInputRef.current?.click()} />

            {/* Input Form Bar */}
            <div className="p-3.5 bg-base-100 border-t border-base-300 z-20 shadow-xs">
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
                        className="h-11 w-11 rounded-full border-base-300 bg-base-200/80 hover:bg-base-300 text-base-content shrink-0 cursor-pointer"
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Link className="h-4 w-4" />
                    </Button>

                    <Input
                        value={draft}
                        onChange={handleChange}
                        placeholder="Type a message..."
                        className="flex-1 h-11 rounded-full bg-base-200/80 border-base-300 text-base-content placeholder:text-base-content/40 focus:bg-base-100 focus:ring-2 focus:ring-primary/20 px-5 text-sm"
                    />

                    <Button
                        type="submit"
                        size="icon"
                        disabled={!canSend}
                        className={cn(
                            "rounded-full h-11 w-11 shrink-0 transition-all duration-200",
                            canSend
                                ? "bg-primary hover:opacity-90 text-primary-content shadow-md shadow-primary/20 hover:scale-105 active:scale-95 border-none cursor-pointer"
                                : "bg-base-300 text-base-content/40 border-none cursor-not-allowed"
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

            {/* Group Modals */}
            <InviteToGroupModal
                open={showInviteModal}
                onOpenChange={setShowInviteModal}
                group={activeConversation}
            />

            <GroupMembersModal
                open={showMembersModal}
                onOpenChange={setShowMembersModal}
                group={activeConversation}
            />
        </div>
    );
}