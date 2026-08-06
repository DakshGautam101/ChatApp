import { create } from "zustand";
import { axiosInstance as axios } from "../lib/axiosInstance.js";
import { socket } from "../lib/socket.js";

const useChatStore = create((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    typingUsers: {},
    isLoadingConversations: false,
    isLoadingMessages: false,
    isLoadingOlderMessages: false,
    hasMoreMessages: true,

    fetchConversations: async () => {
        try {
            set({ isLoadingConversations: true });
            const res = await axios.get("/message/conversations");
            set({ conversations: res.data.conversations || [] });
        } catch (error) {
            console.error("fetchConversation error:", error);
        } finally {
            set({ isLoadingConversations: false });
        }
    },

    openConversation: async (conversation) => {
        set({
            activeConversation: conversation,
            messages: [],
            isLoadingMessages: true,
            isLoadingOlderMessages: false,
            hasMoreMessages: true,
        });
        socket.emit("conversation:join", conversation._id);

        try {
            const res = await axios.get(`/message/${conversation._id}`);
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
            set({ isLoadingMessages: false });
        }
    },

    closeConversation: () => {
        set({ activeConversation: null, messages: [], hasMoreMessages: true });
    },

    loadOlderMessages: async () => {
        const { activeConversation, messages, isLoadingOlderMessages, hasMoreMessages } = get();
        if (!activeConversation || isLoadingOlderMessages || !hasMoreMessages || messages.length === 0) {
            return;
        }

        const oldest = [...messages].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        )[0];

        if (!oldest?.createdAt) return;

        set({ isLoadingOlderMessages: true });

        try {
            const res = await axios.get(`/message/${activeConversation._id}`, {
                params: { before: oldest.createdAt },
            });
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
            set({ isLoadingOlderMessages: false });
        }
    },

    sendMessage: ({ content = "", attachments = [] }) => {
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
            formData.append("files", file)
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
            set((state) => ({
                messages: [...state.messages, message],
            }));
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
            }
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
socket.on("typing", ({ userId, isTyping }) => {
    const { activeConversation } = useChatStore.getState();
    if (activeConversation) {
        useChatStore.getState().setTyping(activeConversation._id, userId, isTyping);
    }
});

export default useChatStore;