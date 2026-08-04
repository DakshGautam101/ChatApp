import React, { useCallback, useEffect, useState } from "react";
import useAuthStore from "../Stores/useAuthStore";
import { axiosInstance } from "../lib/axiosInstance";
import { Button } from "./ui/button";
import { AlertCircle, Loader2, MessageCircle, Send, Users } from "lucide-react";
import toast from "react-hot-toast";

function Avatar({ name }) {
    const initial = (name || "?").trim().charAt(0).toUpperCase();
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold">
            {initial || "?"}
        </div>
    );
}

function UserRowSkeleton() {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-shimmer animate-shimmer" />
                <div className="space-y-2">
                    <div className="h-3 w-28 rounded bg-shimmer animate-shimmer" />
                    <div className="h-2.5 w-36 rounded bg-shimmer animate-shimmer" />
                </div>
            </div>
            <div className="h-8 w-20 rounded-lg bg-shimmer animate-shimmer" />
        </div>
    );
}

export default function UserList() {
    const { user } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sending, setSending] = useState({});
    const [sentTo, setSentTo] = useState({});

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosInstance.get("/user/userlist");
            setUsers(res.data.data || []);
        } catch (err) {
            console.error(err);
            setError(err?.response?.data?.message || "Couldn't load people. Check your connection and try again.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        let mounted = true;
        (async () => {
            if (!mounted) return;
            await fetchUsers();
        })();
        return () => { mounted = false; };
    }, [fetchUsers]);

    const sendInvitation = async (targetId) => {
        if (!targetId) return;
        setSending((s) => ({ ...s, [targetId]: true }));
        try {
            await axiosInstance.post(`/invitation/send/${targetId}`);
            setSentTo((s) => ({ ...s, [targetId]: true }));
            toast.success("Invitation sent");
        } catch (err) {
            console.error("send invitation error", err.response || err.message || err);
            toast.error(err?.response?.data?.message || "Couldn't send the invitation");
        } finally {
            setSending((s) => ({ ...s, [targetId]: false }));
        }
    };

    const visibleUsers = users.filter((u) => u._id !== user?._id);

    return (
        <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold tracking-tight">People</h2>
                {!loading && !error && (
                    <span className="ml-auto rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground">
                        {visibleUsers.length}
                    </span>
                )}
            </div>

            {loading && (
                <div className="space-y-2">
                    <UserRowSkeleton />
                    <UserRowSkeleton />
                    <UserRowSkeleton />
                </div>
            )}

            {!loading && error && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-10 text-center animate-in fade-in duration-300">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <p className="max-w-[220px] text-sm text-muted-foreground">{error}</p>
                    <Button size="sm" variant="outline" onClick={fetchUsers}>
                        Try again
                    </Button>
                </div>
            )}

            {!loading && !error && visibleUsers.length === 0 && (
                <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-10 text-center animate-in fade-in duration-300">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">No one else here yet</p>
                </div>
            )}

            {!loading && !error && visibleUsers.length > 0 && (
                <ul className="space-y-2 overflow-y-auto">
                    {visibleUsers.map((u, i) => (
                        <li
                            key={u._id}
                            style={{ "--stagger-index": i }}
                            className="stagger-item flex items-center justify-between gap-3 rounded-xl border border-border p-3 opacity-0 animate-fade-in-up transition-colors hover:bg-accent"
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <Avatar name={u.username || u.email} />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">{u.username || u.email}</p>
                                    <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                                </div>
                            </div>
                            {
                                u.isFriend ? (
                                    <Button
                                    size = "sm"
                                    variant="secondary"
                                    disabled
                                    className={"shrink-0"}
                                    >
                                        Chat <MessageCircle className="h-3.5 w-3.5"/>
                                    </Button>
                                ):(
                                <Button
                                size="sm"
                                variant={sentTo[u._id] ? "secondary" : "default"}
                                disabled={!!sending[u._id] || !!sentTo[u._id]}
                                onClick={() => sendInvitation(u._id)}
                                className="shrink-0 gap-1.5"
                            >
                                {sending[u._id] ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <Send className="h-3.5 w-3.5" />
                                )}
                                {sentTo[u._id] ? "Sent" : sending[u._id] ? "Sending" : "Invite"}
                            </Button>
                                )
                            }
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}