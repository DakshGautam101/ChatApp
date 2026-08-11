import React, { useEffect, useState } from "react";
import { socket } from "@/core/socket/socket";
import { Bell, UserPlus, X } from "lucide-react";

const AUTO_DISMISS_MS = 6000;

const ICONS = {
    invitation: UserPlus,
    notification: Bell,
    status: Bell,
};

export default function Notifications() {
    const [items, setItems] = useState([]);

    const dismiss = (id) => {
        setItems((s) => s.filter((it) => it.id !== id));
    };

    useEffect(() => {
        if (!socket) return;

        const push = (entry) => {
            const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
            setItems((s) => [{ ...entry, id }, ...s].slice(0, 5));
            setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
        };

        const onInvitation = (data) => push({ type: "invitation", ...data });
        const onNotification = (data) => push({ type: "notification", ...data });
        const onStatusChanged = (data) => push({ type: "status", ...data });

        socket.on("invitation:created", onInvitation);
        socket.on("notification:new", onNotification);
        socket.on("invitation:statusChanged", onStatusChanged);

        return () => {
            socket.off("invitation:created", onInvitation);
            socket.off("notification:new", onNotification);
            socket.off("invitation:statusChanged", onStatusChanged);
        };
    }, []);

    if (!items.length) return null;

    return (
        <div className="pointer-events-none fixed right-4 top-20 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 sm:right-6">
            {items.map((it) => {
                const Icon = ICONS[it.type] || Bell;
                let message = "";
                if (it.type === "invitation") message = `Invitation from ${it.from || "someone new"}`;
                if (it.type === "notification") message = it.message || "You have a new notification";
                if (it.type === "status") message = `Invitation ${it.status} by ${it.by || "a user"}`;

                return (
                    <div
                        key={it.id}
                        className="pointer-events-auto flex items-start gap-3 rounded-xl glass p-3 shadow-lg shadow-sky-500/10 animate-slide-in-right"
                    >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                            <Icon className="h-4 w-4 text-foreground" />
                        </div>
                        <p className="min-w-0 flex-1 text-sm leading-snug text-foreground">{message}</p>
                        <button
                            onClick={() => dismiss(it.id)}
                            className="shrink-0 rounded-md p-0.5 text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
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
