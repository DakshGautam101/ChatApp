import React, { useCallback, useEffect, useMemo, useState } from "react";
import useAuthStore from "@/modules/auth/stores/useAuthStore";
import { axiosInstance } from "@/core/api/axiosInstance";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import { AlertCircle, Loader2, MessageCircle, Search, Send, Users } from "lucide-react";
import toast from "react-hot-toast";
import { cn } from "@/core/utils/utils";
import Avatar from "@/core/components/Avatar";

function UserRowSkeleton() {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 mb-2">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-3.5 w-32 rounded bg-slate-200 animate-pulse" />
                    <div className="h-2.5 w-40 rounded bg-slate-200 animate-pulse" />
                </div>
            </div>
            <div className="h-9 w-20 rounded-lg bg-slate-200 animate-pulse" />
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
        <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-blue-900/5">
            <div className="mb-5 flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100">
                    <Users className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-bold tracking-tight text-slate-900">People</h2>
                {!loading && !error && (
                    <span className="badge badge-sm font-bold bg-blue-100 text-blue-700 border-none ml-auto">
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
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-red-200 bg-red-50/50 py-12 text-center animate-scale-in">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <p className="max-w-55 text-sm font-medium text-red-600">{error}</p>
                    <Button size="sm" variant="outline" onClick={fetchUsers} className="mt-2 border-red-200 hover:bg-red-500 hover:text-white">
                        Try again
                    </Button>
                </div>
            )}

            {!loading && !error && (
                <div className="mb-4">
                    <label htmlFor="user-search" className="sr-only">
                        Search people
                    </label>
                    <div className="relative group">
                        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            id="user-search"
                            value={searchTerm}
                            onChange={(event) => setSearchTerm(event.target.value)}
                            placeholder="Search by name or email"
                            className="pl-10 rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-900 placeholder:text-slate-400 h-11"
                        />
                    </div>
                </div>
            )}

            {!loading && !error && visibleUsers.length === 0 && (
                <div className="flex flex-1 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center animate-fade-in">
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                        <Users className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-500">
                        {searchTerm.trim() ? "No users match your search" : "No one else here yet"}
                    </p>
                </div>
            )}

            {!loading && !error && visibleUsers.length > 0 && (
                <ul className="space-y-2 overflow-y-auto pr-1 pb-4 flex-1 animate-fade-in">
                    {visibleUsers.map((u, i) => (
                        <li
                            key={u._id}
                            className="group flex items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-white p-3.5 transition-all duration-200 hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 stagger-item"
                            style={{ "--stagger-index": i }}
                        >
                            <div className="flex min-w-0 items-center gap-3.5">
                                <Avatar src={u.avatar} name={u.username || u.email} size="md" showStatus={true} status={u.status} />
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-bold text-slate-900">{u.username || u.email}</p>
                                    <p className="truncate text-xs font-medium text-slate-500">{u.email}</p>
                                </div>
                            </div>
                            {
                                u.isFriend ? (
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        disabled
                                        className="shrink-0 rounded-lg h-9 font-semibold text-xs border border-slate-200 bg-slate-100 text-slate-500"
                                    >
                                        Friends <MessageCircle className="h-3.5 w-3.5 ml-1.5 text-blue-600"/>
                                    </Button>
                                ):(
                                    <Button
                                        size="sm"
                                        disabled={!!sending[u._id] || !!sentTo[u._id]}
                                        onClick={() => sendInvitation(u._id)}
                                        className={cn(
                                            "shrink-0 gap-1.5 rounded-lg h-9 font-semibold text-xs transition-all border-none shadow-xs",
                                            !sentTo[u._id] && !sending[u._id] 
                                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:scale-105 active:scale-95" 
                                                : "bg-slate-100 text-slate-600 border border-slate-200"
                                        )}
                                    >
                                        {sending[u._id] ? (
                                            <span className="loading loading-spinner loading-xs text-blue-600"></span>
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
