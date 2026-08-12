import { create } from "zustand";
import { axiosInstance as axios } from "@/core/api/axiosInstance.js";
import { socket } from "@/core/socket/socket.js";

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
        set({ isLoadingConversations: true, _conversationsRequestToken: token });
        try {
            const res = await axios.get("/message/conversations");
            if (get()._conversationsRequestToken !== token) return; 

            const fetched = res.data.conversations || [];
            set((state) => {
                const localById = new Map(state.conversations.map((c) => [c._id, c]));
                const merged = fetched.map((incoming) => {
                    const local = localById.get(incoming._id);
                    if (!local?.lastMessage?.at || !incoming.lastMessage?.at) return incoming;
                    return new Date(local.lastMessage.at) > new Date(incoming.lastMessage.at) ? local : incoming;
                });
                return { conversations: merged };
            });
        }
        catch (error) {
            console.error("fetchConversation error:", error);
        } finally {
            if (get()._conversationsRequestToken === token) set({ isLoadingConversations: false });
        }
    },
    openConversation: async (conversation) => {
        const token = get()._requestToken + 1;
        set({
            activeConversation: conversation,
            messages: [],
            isLoadingMessages: true,
            isLoadingOlderMessages: false,
            hasMoreMessages: true,
            _requestToken: token,
        });
        socket.emit("conversation:join", conversation._id);

        try {
            const res = await axios.get(`/message/${conversation._id}`);
            if (get()._requestToken !== token) return;

            const loadedMessages = res.data.messages || [];
            set({ messages: loadedMessages, hasMoreMessages: res.data.hasMore });

            const last = loadedMessages[loadedMessages.length - 1];
            if (last) {
                socket.emit("message:read", {
                    conversationId: conversation._id,
                    lastMessageId: last._id,
                });
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

    sendMessage: (payload) => {
        const { content = "", attachments = [] } =
            typeof payload === "string" ? { content: payload } : payload || {};
        const { activeConversation } = get();

        if (!activeConversation) return;

        const hasText = content.trim().length > 0;
        const hasAttachments = attachments.length > 0;

        if (!hasText && !hasAttachments) return;

        socket.emit("message:send", {
            conversationId: activeConversation._id,
            content: content.trim(),
            attachments,
        });
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
        const { activeConversation, conversations } = get();

        if (activeConversation?._id === message.conversation) {
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
                return { messages: [...state.messages, message] };
            });
            socket.emit("message:read", {
                conversationId: message.conversation,
                lastMessageId: message._id,
            });
        }

        const idx = conversations.findIndex((conversation) => conversation._id === message.conversation);
        if (idx !== -1) {
            const updated = [...conversations];
            const [conversation] = updated.splice(idx, 1);
            let preview = message.content;

            if (!preview && message.attachments?.length) {
                const type = message.attachments[0].fileType;

                if (type.startsWith("image/")) preview = "📷 Photo";
                else if (type.startsWith("video/")) preview = "🎥 Video";
                else if (type === "application/pdf") preview = "📄 PDF";
                else preview = "📎 Attachment";
            }

            conversation.lastMessage = {
                text: preview,
                sender: message.sender?._id || message.sender,
            };
            updated.unshift(conversation);
            set({ conversations: updated });
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
            const idx = state.conversations.findIndex((conversation) => conversation._id === conversationId);
            if (idx === -1) return state;
            const updated = [...state.conversations];
            const [conversation] = updated.splice(idx, 1);
            conversation.lastMessage = lastMessage;
            updated.unshift(conversation);
            return { conversations: updated };
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
                conversations: updatedConvs,
                activeConversation: updatedActive,
            };
        });
    },

    removeConversation: (conversationId) => {
        set((state) => ({
            conversations: state.conversations.filter((c) => c._id !== conversationId),
            activeConversation:
                state.activeConversation?._id === conversationId ? null : state.activeConversation,
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
}));

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
socket.on("typing", ({ userId, isTyping }) => {
    const { activeConversation } = useChatStore.getState();
    if (activeConversation) {
        useChatStore.getState().setTyping(activeConversation._id, userId, isTyping);
    }
});

export default useChatStore;
