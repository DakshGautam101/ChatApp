import React, { useEffect, useState } from "react";
import { socket } from "@/core/socket/socket";
import { Bell, MessageSquare, UserPlus, X } from "lucide-react";
import useChatStore from "@/modules/chat/stores/useChatStore";

const AUTO_DISMISS_MS = 6000;

const ICONS = {
    invitation: UserPlus,
    message: MessageSquare,
    notification: Bell,
    status: Bell,
};

export default function Notifications({ onNavigateTab }) {
    const [items, setItems] = useState([]);

    const dismiss = (id) => {
        setItems((s) => s.filter((it) => it.id !== id));
    };

    const handleItemClick = (it) => {
        dismiss(it.id);

        if (it.conversationId) {
            const { conversations, openConversation } = useChatStore.getState();
            const targetConv = conversations.find((c) => (c._id?.toString() || c._id) === (it.conversationId?.toString() || it.conversationId));
            if (targetConv) {
                openConversation(targetConv);
            }
            if (onNavigateTab) onNavigateTab("chats");
        } else if (it.type === "invitation" || it.type === "status") {
            if (onNavigateTab) onNavigateTab("invitations");
        } else {
            if (onNavigateTab) onNavigateTab("chats");
        }
    };

    useEffect(() => {
        if (!socket) return;
        const push = (entry) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            setItems((s) => [{ ...entry, id }, ...s].slice(0, 5));
            setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
        };

        const onInvitation = (data) => push({ type: "invitation", ...data });
        const onNotification = (data) => push({ type: data.type || "notification", ...data });
        const onStatusChanged = (data) => push({ type: "status", ...data });
        const onGroupInvitation = (data) => push({ type: "invitation", ...data });

        socket.on("invitation:created", onInvitation);
        socket.on("notification:new", onNotification);
        socket.on("invitation:statusChanged", onStatusChanged);
        socket.on("group:invitation", onGroupInvitation);

        return () => {
            socket.off("invitation:created", onInvitation);
            socket.off("notification:new", onNotification);
            socket.off("invitation:statusChanged", onStatusChanged);
            socket.off("group:invitation", onGroupInvitation);
        };
    }, []);

    if (!items.length) return null;

    return (
        <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:right-6">
            {items.map((it) => {
                const Icon = ICONS[it.type] || Bell;
                let message = "";
                if (it.type === "invitation") message = `Invitation from ${it.from || "someone new"}`;
                else if (it.type === "message" || it.conversationId) message = it.message || `New message from ${it.senderName || "someone"}`;
                else if (it.type === "notification") message = it.message || "You have a new notification";
                else if (it.type === "status") message = `Invitation ${it.status} by ${it.by || "a user"}`;

                return (
                    <div
                        key={it.id}
                        onClick={() => handleItemClick(it)}
                        className="pointer-events-auto flex items-start gap-3 rounded-xl border border-blue-200/80 bg-white/95 p-3.5 shadow-lg shadow-blue-500/10 backdrop-blur-md transition-all hover:scale-[1.02] cursor-pointer animate-slide-in-right group"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                            <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                                {it.type === "invitation" ? "Invitation" : it.conversationId ? "New Message" : "Notification"}
                            </p>
                            <p className="text-sm leading-snug font-medium text-slate-800 line-clamp-2">{message}</p>
                        </div>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                dismiss(it.id);
                            }}
                            className="shrink-0 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
                            aria-label="Dismiss notification"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
