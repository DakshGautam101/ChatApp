import React, { useCallback, useEffect, useMemo, useState } from "react";
import useAuthStore from "../Stores/useAuthStore";
import { axiosInstance } from "../lib/axiosInstance";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { AlertCircle, Loader2, MessageCircle, Search, Send, Users } from "lucide-react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";

function Avatar({ name }) {
    const initial = (name || "?").trim().charAt(0).toUpperCase();
    return (
        <div className="relative">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-transparent bg-white/10 text-sm font-bold shadow-sm bg-clip-padding relative z-10">
                {initial || "?"}
            </div>
        </div>
    );
}

function UserRowSkeleton() {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 glass-subtle p-3 mb-2">
            <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-shimmer animate-shimmer" />
                <div className="space-y-2.5">
                    <div className="h-3.5 w-32 rounded bg-shimmer animate-shimmer" />
                    <div className="h-2.5 w-40 rounded bg-shimmer animate-shimmer" />
                </div>
            </div>
            <div className="h-9 w-24 rounded-lg bg-shimmer animate-shimmer" />
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
    const [searchTerm, setSearchTerm] = useState("");

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

    const visibleUsers = useMemo(() => {
        const filtered = users.filter((u) => u._id !== user?._id);
        const normalizedSearch = searchTerm.trim().toLowerCase();

        if (!normalizedSearch) {
            return filtered;
        }

        return filtered.filter((u) => {
            const haystack = `${u.username || ""} ${u.email || ""}`.toLowerCase();
            return haystack.includes(normalizedSearch);
        });
    }, [searchTerm, user?._id, users]);

    return (
        <div className="flex h-full flex-col rounded-2xl border border-white/10 glass p-5 shadow-xl">
            <div className="mb-5 flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white/10 text-foreground">
                    <Users className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-gradient">People</h2>
                {!loading && !error && (
                    <span className="ml-auto flex h-6 min-w-[24px] items-center justify-center rounded-full bg-white/10 px-2 text-xs font-bold text-foreground">
                        {visibleUsers.length}
                    </span>
                )}
            </div>

            {loading && (
                <div className="space-y-1 mt-4">
                    <UserRowSkeleton />
                    <UserRowSkeleton />
                    <UserRowSkeleton />
                    <UserRowSkeleton />
                </div>
            )}

            {!loading && error && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-destructive/30 bg-destructive/5 py-12 text-center"
                >
                    <AlertCircle className="h-8 w-8 text-destructive" />
                    <p className="max-w-55 text-sm font-medium text-destructive">{error}</p>
                    <Button size="sm" variant="outline" onClick={fetchUsers} className="mt-2 border-destructive/20 hover:bg-destructive hover:text-white">
                        Try again
                    </Button>
                </motion.div>
            )}

            {!loading && !error && (
                <div className="mb-4">
                    <label htmlFor="user-search" className="sr-only">
                        Search people
                    </label>
                    <div className="relative group">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground transition-colors" />
                        <Input
                            id="user-search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by name or email"
                            className="pl-10 rounded-xl bg-background/50 border-border/50 focus-visible:ring-primary shadow-inner h-11"
                        />
                    </div>
                </div>
            )}

            {!loading && !error && visibleUsers.length === 0 && (
                <motion.div 
                    initial={{ opacity: 0, y: 10 }} 
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-muted/20 py-12 text-center"
                >
                    <div className="p-3 rounded-full bg-secondary/50">
                        <Users className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {searchTerm.trim() ? "No users match your search" : "No one else here yet"}
                    </p>
                </motion.div>
            )}

            {!loading && !error && visibleUsers.length > 0 && (
                <ul className="space-y-2 overflow-y-auto pr-1 pb-4 flex-1">
                    <AnimatePresence>
                        {visibleUsers.map((u, i) => (
                            <motion.li
                                key={u._id}
                                layout
                                initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                                transition={{ duration: 0.3, delay: Math.min(i * 0.05, 0.3) }}
                                className="group flex items-center justify-between gap-3 rounded-xl border border-border/50 glass-subtle p-3.5 transition-all duration-300 hover:border-white/20 hover:shadow-md hover:bg-white/5"
                            >
                                <div className="flex min-w-0 items-center gap-3.5">
                                    <Avatar name={u.username || u.email} />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-foreground transition-colors">{u.username || u.email}</p>
                                        <p className="truncate text-xs font-medium text-muted-foreground">{u.email}</p>
                                    </div>
                                </div>
                                {
                                    u.isFriend ? (
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            disabled
                                            className="shrink-0 rounded-lg h-9 font-semibold text-xs border border-white/5 opacity-70"
                                        >
                                            Friends <MessageCircle className="h-3.5 w-3.5 ml-1.5"/>
                                        </Button>
                                    ):(
                                        <Button
                                            size="sm"
                                            variant={sentTo[u._id] ? "secondary" : "default"}
                                            disabled={!!sending[u._id] || !!sentTo[u._id]}
                                            onClick={() => sendInvitation(u._id)}
                                            className={cn(
                                                "shrink-0 gap-1.5 rounded-lg h-9 font-semibold text-xs transition-all",
                                                !sentTo[u._id] && !sending[u._id] ? "bg-white/10 hover:bg-white/20 hover:shadow-lg hover:scale-105" : ""
                                            )}
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
                            </motion.li>
                        ))}
                    </AnimatePresence>
                </ul>
            )}
        </div>
    );
}