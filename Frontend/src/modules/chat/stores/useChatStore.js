import React from "react";
import { create } from "zustand";
import { axiosInstance as axios } from "@/core/api/axiosInstance.js";
import { socket } from "@/core/socket/socket.js";
import useAuthStore from "@/modules/auth/stores/useAuthStore";
import toast from "react-hot-toast";

function sortConversations(convs) {
    return [...convs].sort((a, b) => {
        const timeA = new Date(a.lastMessage?.at || a.lastMessage?.createdAt || a.updatedAt || a.createdAt || 0).getTime();
        const timeB = new Date(b.lastMessage?.at || b.lastMessage?.createdAt || b.updatedAt || b.createdAt || 0).getTime();
        return timeB - timeA;
    });
}

const useChatStore = create((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    typingUsers: {},
    isLoadingConversations: false,
    isLoadingMessages: false,
    isLoadingOlderMessages: false,
    hasMoreMessages: true,
    _requestToken: 0,
    _conversationsRequestToken: 0,

    fetchConversations: async () => {
        const token = get()._conversationsRequestToken + 1;
        if (get().conversations.length === 0) {
            set({ isLoadingConversations: true });
        }
        set({ _conversationsRequestToken: token });
        try {
            const res = await axios.get("/message/conversations");
            if (get()._conversationsRequestToken !== token) return; 

            const currentUserId = (useAuthStore.getState().user?._id || useAuthStore.getState().user?.id)?.toString();
            const rawFetched = res.data.conversations || [];
            const fetched = rawFetched.filter((c) => {
                if (c.type === "group") {
                    const validMembers = (c.participants || []).filter((p) => p.user && (p.user._id || p.user.id || p.user));
                    return validMembers.length > 1;
                }
                const other = (c.participants || []).find(
                    (p) => p.user && String(p.user?._id || p.user?.id || p.user) !== currentUserId
                )?.user;
                return !!other;
            });

            set((state) => {
                const activeId = state.activeConversation?._id?.toString();
                const localById = new Map(state.conversations.map((c) => [c._id?.toString(), c]));
                const merged = fetched.map((incoming) => {
                    const incomingId = incoming._id?.toString();
                    const local = localById.get(incomingId);
                    const isActive = activeId && activeId === incomingId;

                    let base = incoming;
                    if (local?.lastMessage?.at && incoming.lastMessage?.at) {
                        const localTime = new Date(local.lastMessage.at).getTime();
                        const incomingTime = new Date(incoming.lastMessage.at).getTime();
                        if (localTime > incomingTime) {
                            base = { ...incoming, lastMessage: local.lastMessage };
                        }
                    } else if (local?.lastMessage?.at && !incoming.lastMessage?.at) {
                        base = { ...incoming, lastMessage: local.lastMessage };
                    }

                    return {
                        ...base,
                        unreadCount: isActive ? 0 : (incoming.unreadCount ?? 0),
                    };
                });
                return { conversations: sortConversations(merged) };
            });
        }
        catch (error) {
            console.error("fetchConversation error:", error);
        } finally {
            if (get()._conversationsRequestToken === token) set({ isLoadingConversations: false });
        }
    },
    openConversation: async (conversation) => {
        if (!conversation?._id) return;
        const convId = conversation._id.toString();
        const currentActive = get().activeConversation;
        const isAlreadyActive = currentActive?._id?.toString() === convId;

        // If conversation is already active and has messages loaded, avoid wiping messages or flashing loader
        if (isAlreadyActive && get().messages.length > 0) {
            set((state) => ({
                conversations: state.conversations.map((c) =>
                    (c._id?.toString() === convId) ? { ...c, unreadCount: 0 } : c
                ),
            }));
            return;
        }

        const token = get()._requestToken + 1;
        set((state) => ({
            activeConversation: conversation,
            conversations: state.conversations.map((c) =>
                (c._id?.toString() === convId) ? { ...c, unreadCount: 0 } : c
            ),
            messages: isAlreadyActive ? state.messages : [],
            isLoadingMessages: isAlreadyActive ? false : true,
            isLoadingOlderMessages: false,
            hasMoreMessages: true,
            _requestToken: token,
        }));
        socket.emit("conversation:join", conversation._id);

        try {
            const res = await axios.get(`/message/${conversation._id}`);
            if (get()._requestToken !== token) return;

            const loadedMessages = res.data.messages || [];
            set({ messages: loadedMessages, hasMoreMessages: res.data.hasMore });
            if (loadedMessages.length > 0) {
                const lastMsg = loadedMessages[loadedMessages.length - 1];
                if (lastMsg?._id) {
                    socket.emit("message:read", {
                        conversationId: conversation._id,
                        lastMessageId: lastMsg._id,
                    });
                }
            }
        } catch (error) {
            console.error("fetchConversation error:", error);
        } finally {
            if (get()._requestToken === token) set({ isLoadingMessages: false });
        }
    },

    closeConversation: () => {
        set((state) => ({
            activeConversation: null,
            messages: [],
            hasMoreMessages: true,
            _requestToken: state._requestToken + 1,
        }));
    },

    loadOlderMessages: async () => {
        const { activeConversation, messages, isLoadingOlderMessages, hasMoreMessages, _requestToken } = get();
        if (!activeConversation || isLoadingOlderMessages || !hasMoreMessages || messages.length === 0) {
            return;
        }

        const oldest = [...messages].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        )[0];

        if (!oldest?.createdAt) return;

        const token = _requestToken;
        set({ isLoadingOlderMessages: true });

        try {
            const res = await axios.get(`/message/${activeConversation._id}`, {
                params: { before: oldest.createdAt },
            });
            if (get()._requestToken !== token) return;

            const olderMessages = res.data.messages || [];

            if (olderMessages.length > 0) {
                set((state) => ({
                    messages: [...olderMessages, ...state.messages],
                }));
            }

            set({ hasMoreMessages: res.data.hasMore });
        } catch (error) {
            console.error("loadOlderMessages error:", error);
        } finally {
            if (get()._requestToken === token) set({ isLoadingOlderMessages: false });
        }
    },

    addOptimisticMessage: (optimisticMsg) => {
        set((state) => ({ messages: [...state.messages, optimisticMsg] }));
    },

    updateOptimisticAttachment: (messageId, itemId, patch) => {
        set((state) => ({
            messages: state.messages.map((msg) => {
                const matchesMsg = messageId ? msg._id === messageId : false;
                const hasAttachment = (msg.attachments || []).some(
                    (att) => att.id === itemId || att._id === itemId || att.uploadId === itemId
                );

                if (!matchesMsg && !hasAttachment) return msg;

                const updatedAttachments = (msg.attachments || []).map((att) =>
                    att.id === itemId || att._id === itemId || att.uploadId === itemId
                        ? { ...att, ...patch }
                        : att
                );
                return { ...msg, attachments: updatedAttachments };
            }),
        }));
    },

    removeOptimisticMessage: (tempId) => {
        set((state) => ({
            messages: state.messages.filter((m) => m._id !== tempId),
        }));
    },

    sendMessage: async (payload) => {
        const { content = "", attachments = [] } =
            typeof payload === "string" ? { content: payload } : payload || {};
        const { activeConversation } = get();

        if (!activeConversation) return;

        const hasText = content.trim().length > 0;
        const hasAttachments = attachments.length > 0;

        if (!hasText && !hasAttachments) return;

        try {
            const res = await axios.post("/message/send", {
                conversationId: activeConversation._id,
                content: content.trim(),
                attachments,
            });
            const sentMsg = res.data?.message || res.data?.data?.message || res.data;
            if (sentMsg?._id) {
                get().receiveMessage(sentMsg);
            }
        } catch (error) {
            console.error("Failed to send message:", error);
            throw error;
        }
    },

    uploadFile: async (file) => {
        const formData = new FormData();
        formData.append("file", file);

        const res = await axios.post("/upload/single", formData);

        return res.data;
    },

    uploadMultipleFiles: async (files) => {
        const formData = new FormData();
        files.forEach(file => {
            formData.append("files", file);
        });
        const res = await axios.post("/upload/multiple", formData);

        return res.data.files;
    },

    reactToMessage: (messageId, reactionType) => {
        const { activeConversation } = get();
        if (!activeConversation) return;
        socket.emit("message:react", {
            conversationId: activeConversation._id,
            messageId,
            reactionType,
        });
    },

    receiveMessage: (message) => {
        if (!message) return;
        const { activeConversation, conversations } = get();
        const currentUserId = (useAuthStore.getState().user?._id || useAuthStore.getState().user?.id)?.toString();
        const messageSenderId = (message.sender?._id || message.sender)?.toString();
        const isFromOther = messageSenderId && messageSenderId !== currentUserId;
        const convId = (message.conversation?._id || message.conversation)?.toString();
        const activeConvId = activeConversation?._id?.toString();
        const isActive = activeConvId && activeConvId === convId;

        if (isActive) {
            set((state) => {
                const optIdx = state.messages.findIndex(
                    (m) =>
                        m.isOptimistic &&
                        (m._id === message._tempId ||
                            (m.content === message.content &&
                                m.attachments?.length === message.attachments?.length))
                );
                if (optIdx !== -1) {
                    const next = [...state.messages];
                    next[optIdx] = message;
                    return { messages: next };
                }
                const msgIdStr = (message._id?.toString?.() || message._id);
                const exists = state.messages.some((m) => (m._id?.toString?.() || m._id) === msgIdStr);
                return { messages: exists ? state.messages : [...state.messages, message] };
            });
            if (isFromOther) {
                socket.emit("message:read", {
                    conversationId: convId,
                    lastMessageId: message._id,
                });
            }
        }

        if (isFromOther && !isActive) {
            const senderName = typeof message.sender === "object"
                ? (message.sender?.username || message.sender?.email || "Someone")
                : "Someone";
            let preview = message.content;
            if (!preview && message.attachments?.length) {
                const type = message.attachments[0].fileType || "";
                if (type.startsWith("image/")) preview = "📷 Photo";
                else if (type.startsWith("video/")) preview = "🎥 Video";
                else if (type === "application/pdf") preview = "📄 PDF";
                else preview = "📎 Attachment";
            }
            if (!preview) preview = "Sent a message";

            toast((t) =>
                React.createElement("div", {
                    onClick: () => {
                        toast.dismiss(t.id);
                        const conv = get().conversations.find((c) => (c._id?.toString() || c._id) === convId);
                        if (conv) {
                            get().openConversation(conv);
                        }
                    },
                    className: "flex items-center gap-3 cursor-pointer select-none"
                },
                React.createElement("div", {
                    className: "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-600 font-bold text-white text-xs shadow-xs"
                }, senderName.charAt(0).toUpperCase()),
                React.createElement("div", {
                    className: "min-w-0 flex-1"
                },
                React.createElement("p", {
                    className: "text-xs font-bold text-slate-900 truncate"
                }, `💬 ${senderName}`),
                React.createElement("p", {
                    className: "text-xs font-medium text-slate-600 truncate"
                }, preview)
                )
            ), {
                duration: 4000,
                position: "top-right",
                style: {
                    borderRadius: '12px',
                    background: '#ffffff',
                    color: '#0f172a',
                    boxShadow: '0 10px 25px -5px rgba(59, 130, 246, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    border: '1px solid #cbd5e1',
                    padding: '10px 14px',
                },
            });
        }

        const idx = conversations.findIndex((c) => (c._id?.toString() || c._id) === convId);
        if (idx !== -1) {
            const updated = [...conversations];
            const conversation = { ...updated[idx] };
            let preview = message.content;

            if (!preview && message.attachments?.length) {
                const type = message.attachments[0].fileType || "";

                if (type.startsWith("image/")) preview = "📷 Photo";
                else if (type.startsWith("video/")) preview = "🎥 Video";
                else if (type === "application/pdf") preview = "📄 PDF";
                else preview = "📎 Attachment";
            }

            conversation.lastMessage = {
                text: preview,
                sender: message.sender?._id || message.sender,
                at: message.createdAt || new Date().toISOString(),
            };

            if (isActive) {
                conversation.unreadCount = 0;
            } else if (isFromOther) {
                conversation.unreadCount = (conversation.unreadCount || 0) + 1;
            }

            updated[idx] = conversation;
            set({ conversations: sortConversations(updated) });
        } else {
            get().fetchConversations();
        }
    },

    updateMessageStatus: (payload) => {
        const messageIds = Array.isArray(payload?.messageIds)
            ? payload.messageIds
            : payload?.messageId
                ? [payload.messageId]
                : [];
        const status = payload?.status;

        if (!status || messageIds.length === 0) return;

        set((state) => ({
            messages: state.messages.map((message) =>
                messageIds.includes(message._id?.toString?.() || message._id)
                    ? { ...message, status }
                    : message
            ),
        }));
    },

    updateMessageReaction: (message) => {
        set((state) => ({
            messages: state.messages.map((item) => {
                const itemId = item._id?.toString?.() || item._id;
                const messageId = message._id?.toString?.() || message._id;
                return itemId === messageId ? message : item;
            }),
        }));
    },

    updateConversationPreview: ({ conversationId, lastMessage }) => {
        set((state) => {
            const convId = conversationId?.toString();
            const idx = state.conversations.findIndex((c) => (c._id?.toString() || c._id) === convId);
            if (idx === -1) {
                setTimeout(() => get().fetchConversations(), 100);
                return state;
            }
            const updated = [...state.conversations];
            const conversation = { ...updated[idx] };
            conversation.lastMessage = lastMessage;

            const activeConvId = state.activeConversation?._id?.toString();
            if (activeConvId === convId) {
                conversation.unreadCount = 0;
            }

            updated[idx] = conversation;
            return { conversations: sortConversations(updated) };
        });
    },

    setTyping: (conversationId, userId, isTyping) => {
        set((state) => {
            const current = new Set(state.typingUsers[conversationId] || []);
            isTyping ? current.add(userId) : current.delete(userId);
            return { typingUsers: { ...state.typingUsers, [conversationId]: current } };
        });
    },

    emitTyping: (isTyping) => {
        const { activeConversation } = get();
        if (!activeConversation) return;
        socket.emit("typing", {
            conversationId: activeConversation._id,
            isTyping,
        });
    },

    createGroup: async ({ name, members }) => {
        const res = await axios.post("/group/create", { name, members });
        const createdGroup = res.data?.data || res.data;
        if (createdGroup?._id) {
            set((state) => {
                const exists = state.conversations.some((c) => c._id === createdGroup._id);
                return {
                    conversations: exists ? state.conversations : [createdGroup, ...state.conversations],
                    activeConversation: createdGroup,
                };
            });
        }
        return createdGroup;
    },

    sendGroupInvitation: async (groupId, payload) => {
        const res = await axios.post(`/group/${groupId}/invitation`, payload);
        return res.data;
    },

    fetchGroupInvitations: async () => {
        const res = await axios.get("/group/invitations");
        const data = res.data?.invitations || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        return Array.isArray(data) ? data : [];
    },

    respondToGroupInvitation: async (invitationId, action) => {
        const res = await axios.post(`/group/invitation/${invitationId}/respond`, { action });
        const { conversation } = res.data?.data || res.data || {};
        if (action === "accepted" && conversation?._id) {
            set((state) => {
                const exists = state.conversations.some((c) => c._id === conversation._id);
                const updated = exists
                    ? state.conversations.map((c) => (c._id === conversation._id ? conversation : c))
                    : [conversation, ...state.conversations];
                return {
                    conversations: updated,
                    activeConversation: conversation,
                };
            });
        }
        return res.data;
    },

    addOrUpdateConversation: (conversation) => {
        if (!conversation?._id) return;
        set((state) => {
            const idx = state.conversations.findIndex((c) => c._id === conversation._id);
            let updatedConvs = [];
            if (idx !== -1) {
                updatedConvs = [...state.conversations];
                updatedConvs[idx] = { ...updatedConvs[idx], ...conversation };
            } else {
                updatedConvs = [conversation, ...state.conversations];
            }

            const updatedActive =
                state.activeConversation?._id === conversation._id
                    ? { ...state.activeConversation, ...conversation }
                    : state.activeConversation;

            return {
                conversations: sortConversations(updatedConvs),
                activeConversation: updatedActive,
            };
        });
    },

    removeConversation: (conversationId) => {
        if (!conversationId) return;
        const convId = conversationId.toString();
        set((state) => ({
            conversations: state.conversations.filter((c) => (c._id?.toString() || c._id) !== convId),
            activeConversation:
                (state.activeConversation?._id?.toString() === convId) ? null : state.activeConversation,
        }));
    },

    updateGroupAvatar: async (groupId, avatarUrl) => {
        const res = await axios.patch(`/group/${groupId}/avatar`, { avatarUrl });
        const updated = res.data?.conversation || res.data?.data || res.data;
        if (updated?._id) {
            useChatStore.getState().addOrUpdateConversation(updated);
        }
        return updated;
    },

    updateMemberRole: async (groupId, targetUserId, newRole) => {
        const res = await axios.patch(`/group/${groupId}/members/${targetUserId}/role`, { newRole });
        const updated = res.data?.conversation || res.data?.data || res.data;
        if (updated?._id) {
            useChatStore.getState().addOrUpdateConversation(updated);
        }
        return updated;
    },

    leaveGroup: async (groupId) => {
        await axios.post(`/group/${groupId}/leave`);
        useChatStore.getState().removeConversation(groupId);
    },

    kickMember: async (groupId, targetUserId) => {
        const res = await axios.delete(`/group/${groupId}/members/${targetUserId}`);
        const updated = res.data?.conversation || res.data?.data || res.data;
        if (updated?._id) {
            useChatStore.getState().addOrUpdateConversation(updated);
        }
        return updated;
    },

    emitTyping: (isTyping) => {
        const { activeConversation } = get();
        if (!activeConversation?._id) return;
        socket.emit("typing", {
            conversationId: activeConversation._id,
            isTyping,
        });
    },

    handleTypingEvent: ({ conversationId, userId, isTyping }) => {
        if (!conversationId || !userId) return;
        set((state) => {
            const currentSet = new Set(state.typingUsers[conversationId] || []);
            if (isTyping) {
                currentSet.add(userId);
            } else {
                currentSet.delete(userId);
            }
            return {
                typingUsers: {
                    ...state.typingUsers,
                    [conversationId]: currentSet,
                },
            };
        });
    },

    handleUserStatusEvent: ({ userId, status }) => {
        if (!userId) return;
        set((state) => {
            const targetId = userId.toString();
            const updatedConversations = state.conversations.map((c) => ({
                ...c,
                participants: c.participants?.map((p) => {
                    const pId = (p.user?._id || p.user?.id || p.user)?.toString();
                    if (pId === targetId) {
                        return typeof p.user === "object" && p.user !== null
                            ? { ...p, user: { ...p.user, status } }
                            : p;
                    }
                    return p;
                }),
            }));

            let updatedActive = state.activeConversation;
            if (updatedActive?.participants) {
                updatedActive = {
                    ...updatedActive,
                    participants: updatedActive.participants.map((p) => {
                        const pId = (p.user?._id || p.user?.id || p.user)?.toString();
                        if (pId === targetId) {
                            return typeof p.user === "object" && p.user !== null
                                ? { ...p, user: { ...p.user, status } }
                                : p;
                        }
                        return p;
                    }),
                };
            }

            return {
                conversations: updatedConversations,
                activeConversation: updatedActive,
            };
        });
    },
}));

socket.on("connect", () => {
    const { activeConversation } = useChatStore.getState();
    if (activeConversation?._id) {
        socket.emit("conversation:join", activeConversation._id);
    }
});
socket.on("message:new", (message) => useChatStore.getState().receiveMessage(message));
socket.on("message:statusUpdated", (payload) => {
    useChatStore.getState().updateMessageStatus(payload);
});
socket.on("message:reactionUpdated", (message) => {
    useChatStore.getState().updateMessageReaction(message);
});
socket.on("conversation:updated", (payload) => {
    useChatStore.getState().updateConversationPreview(payload);
});
socket.on("conversation:new", (conversation) => {
    useChatStore.getState().addOrUpdateConversation(conversation);
});
socket.on("group:created", (conversation) => {
    useChatStore.getState().addOrUpdateConversation(conversation);
});
socket.on("group:updated", (conversation) => {
    useChatStore.getState().addOrUpdateConversation(conversation);
});
socket.on("conversation:removed", ({ conversationId }) => {
    useChatStore.getState().removeConversation(conversationId);
});
socket.on("group:memberJoined", ({ conversation }) => {
    if (conversation) {
        useChatStore.getState().addOrUpdateConversation(conversation);
    }
});
socket.on("notification:new", (newNotif) => {
    if (newNotif?.type === "message" || newNotif?.conversation) {
        useChatStore.getState().fetchConversations();
    }
});
socket.on("conversation:read", ({ conversationId }) => {
    if (!conversationId) return;
    const convId = conversationId.toString();
    useChatStore.setState((state) => ({
        conversations: state.conversations.map((c) =>
            (c._id?.toString() === convId) ? { ...c, unreadCount: 0 } : c
        ),
    }));
});
socket.on("typing", (payload) => {
    useChatStore.getState().handleTypingEvent(payload);
});
socket.on("user:status", (payload) => {
    useChatStore.getState().handleUserStatusEvent(payload);
});

export default useChatStore;
