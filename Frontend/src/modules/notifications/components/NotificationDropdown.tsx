import React, { useState, useEffect, useRef } from "react";
import { Bell, Trash2 } from "lucide-react";
import { axiosInstance } from "@/core/api/axiosInstance";
import { socket } from "@/core/socket/socket";
import Avatar from "@/core/components/Avatar";
import useChatStore from "@/modules/chat/stores/useChatStore";
import toast from "react-hot-toast";

export interface NotificationItem {
    _id: string;
    sender?: {
        avatar?: string;
        username?: string;
        email?: string;
    };
    title?: string;
    message?: string;
    createdAt?: string;
    isRead?: boolean;
    conversation?: string | { _id: string };
    type?: string;
}

interface NotificationDropdownProps {
    onNavigateTab?: (tab: string) => void;
    pendingInvitationsCount?: number;
}

export default function NotificationDropdown({ onNavigateTab, pendingInvitationsCount = 0 }: NotificationDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const dropdownRef = useRef<HTMLDivElement | null>(null);

    const fetchNotifications = async () => {
        try {
            const res = await axiosInstance.get("/notification");
            const data = res.data?.data || res.data || {};
            setNotifications(Array.isArray(data.notifications) ? data.notifications : []);
            setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
        } catch (err) {
            console.error("Failed to fetch notifications:", err);
        }
    };

    useEffect(() => {
        fetchNotifications();

        if (!socket) return;

        const onNewNotification = (newNotif: NotificationItem) => {
            if (!newNotif) return;
            setNotifications((prev) => [newNotif, ...prev.filter((n) => n._id !== newNotif._id)]);
            setUnreadCount((count) => count + 1);
        };

        socket.on("notification:new", onNewNotification);
        socket.on("invitation:created", fetchNotifications);

        return () => {
            socket.off("notification:new", onNewNotification);
            socket.off("invitation:created", fetchNotifications);
        };
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    const handleItemClick = async (notif: NotificationItem) => {
        setIsOpen(false);

        // Mark as read locally and on server
        if (!notif.isRead) {
            setNotifications((prev) =>
                prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
            );
            setUnreadCount((c) => Math.max(0, c - 1));

            try {
                await axiosInstance.patch(`/notification/${notif._id}/read`);
            } catch (e) {
                // Ignore silent failure
            }
        }

        // Navigate directly to target context
        if (notif.conversation) {
            const convId = typeof notif.conversation === "object" ? notif.conversation._id : notif.conversation;
            const { conversations, openConversation } = useChatStore.getState();
            const targetConv = conversations.find((c) => (c._id?.toString() || c._id) === (convId?.toString() || convId));
            if (targetConv) {
                openConversation(targetConv);
            }
            if (onNavigateTab) onNavigateTab("chats");
        } else if (notif.type === "invitation" || notif.type === "group_invitation") {
            if (onNavigateTab) onNavigateTab("invitations");
        } else {
            if (onNavigateTab) onNavigateTab("chats");
        }
    };

    const handleMarkAllRead = async () => {
        try {
            setNotifications([]);
            setUnreadCount(0);
            await axiosInstance.patch("/notification/read-all");
            toast.success("All notifications cleared");
        } catch (err) {
            toast.error("Failed to clear notifications");
        }
    };

    const handleDelete = async (e: React.MouseEvent, notifId: string) => {
        e.stopPropagation();
        try {
            setNotifications((prev) => prev.filter((n) => n._id !== notifId));
            const res = await axiosInstance.delete(`/notification/${notifId}`);
            if (typeof res.data?.data?.unreadCount === "number") {
                setUnreadCount(res.data.data.unreadCount);
            }
        } catch (err) {
            // Ignore error
        }
    };

    const totalBadgeCount = unreadCount + pendingInvitationsCount;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 rounded-full hover:bg-base-200 text-base-content transition-colors cursor-pointer"
                title="Notifications"
            >
                <Bell className="h-5 w-5" />
                {totalBadgeCount > 0 && (
                    <span className="absolute top-1 right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-extrabold text-primary-content shadow-xs animate-pulse">
                        {totalBadgeCount > 99 ? "99+" : totalBadgeCount}
                    </span>
                )}
            </button>

            {/* Dropdown Popover */}
            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl border border-base-300 bg-base-100 shadow-2xl z-50 overflow-hidden animate-scale-in text-base-content">
                    <div className="flex items-center justify-between px-4 py-3 border-b border-base-300 bg-base-200/50">
                        <div className="flex items-center gap-2">
                            <Bell className="h-4 w-4 text-primary" />
                            <h3 className="text-sm font-bold text-base-content">Notifications</h3>
                            {unreadCount > 0 && (
                                <span className="badge badge-sm bg-primary text-primary-content font-extrabold border-none text-[10px]">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>
                        {notifications.length > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-1 text-xs font-semibold text-base-content/70 hover:text-error transition-colors cursor-pointer"
                                title="Clear all notifications"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                                Clear all
                            </button>
                        )}
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-base-300">
                        {notifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                                <div className="p-3 rounded-full bg-base-200 text-base-content/40 mb-2">
                                    <Bell className="h-6 w-6" />
                                </div>
                                <p className="text-xs font-medium text-base-content/60">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map((notif) => {
                                return (
                                    <div
                                        key={notif._id}
                                        onClick={() => handleItemClick(notif)}
                                        className={`group flex items-start gap-3 p-3.5 transition-colors cursor-pointer hover:bg-base-200/80 ${!notif.isRead ? "bg-primary/10" : ""
                                            }`}
                                    >
                                        <Avatar
                                            src={notif.sender?.avatar}
                                            name={notif.sender?.username || notif.sender?.email || "System"}
                                            size="sm"
                                        />

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-1 mb-0.5">
                                                <p className="text-xs font-bold text-base-content truncate">
                                                    {notif.sender?.username || notif.title || "Notification"}
                                                </p>
                                                <span className="text-[10px] text-base-content/50 shrink-0">
                                                    {notif.createdAt ? new Date(notif.createdAt).toLocaleTimeString([], {
                                                        hour: "2-digit",
                                                        minute: "2-digit",
                                                    }) : ""}
                                                </span>
                                            </div>
                                            <p className="text-xs font-medium text-base-content/70 line-clamp-2 leading-relaxed">
                                                {notif.message}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0 self-center">
                                            {!notif.isRead && (
                                                <span className="h-2 w-2 rounded-full bg-primary shrink-0" title="Unread" />
                                            )}
                                            <button
                                                onClick={(e) => handleDelete(e, notif._id)}
                                                className="p-1 rounded-md text-base-content/40 hover:text-error hover:bg-error/10 opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                                                title="Delete"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
