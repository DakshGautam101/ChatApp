import type React from "react";
import { useEffect, useState } from "react";
import { axiosInstance } from "@/core/api/axiosInstance";
import { socket } from "@/core/socket/socket";
import { Button } from "@/core/components/ui/button";
import toast from "react-hot-toast";
import { AlertCircle, Check, Inbox, Send, Users, X } from "lucide-react";
import { cn } from "@/core/utils/utils";
import Avatar from "@/core/components/Avatar";
import useChatStore from "@/modules/chat/stores/useChatStore";

export interface DirectInvitationItem {
    _id: string;
    sender?: {
        _id?: string;
        id?: string;
        username?: string;
        email?: string;
        avatar?: string;
        status?: string;
    };
    receiver?: {
        _id?: string;
        id?: string;
        username?: string;
        email?: string;
        avatar?: string;
        status?: string;
    };
    status: string;
}

export interface GroupInvitationItem {
    _id: string;
    group?: {
        _id?: string;
        name?: string;
        avatarUrl?: string;
    };
    sender?: {
        _id?: string;
        id?: string;
        username?: string;
        email?: string;
        avatar?: string;
    };
    status: string;
}

function StatusBadge({ status }: { status?: string }) {
    const isPending = status === "pending";
    const isAccepted = status === "accepted";

    return (
        <span
            className={cn(
                "badge badge-sm font-bold uppercase tracking-wider border",
                isPending && "bg-amber-50 text-amber-700 border-amber-200",
                isAccepted && "bg-blue-50 text-blue-700 border-blue-200",
                !isPending && !isAccepted && "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70"
            )}
        >
            {status}
        </span>
    );
}

function RowSkeleton() {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-secondary/20 bg-secondary/10 p-4 mb-2">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-secondary/20 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-3.5 w-32 rounded bg-secondary/20 animate-pulse" />
                    <div className="h-2.5 w-40 rounded bg-secondary/20 animate-pulse" />
                </div>
            </div>
            <div className="h-8 w-20 rounded-lg bg-secondary/20 animate-pulse" />
        </div>
    );
}

export default function Invitation() {
    const [received, setReceived] = useState<DirectInvitationItem[]>([]);
    const [sent, setSent] = useState<DirectInvitationItem[]>([]);
    const [groupInvitations, setGroupInvitations] = useState<GroupInvitationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [updating, setUpdating] = useState<Record<string, string | undefined>>({});
    const [tab, setTab] = useState("received"); // 'received' | 'group' | 'sent'
    const { fetchConversations, respondToGroupInvitation } = useChatStore();

    const fetchAllInvitations = async () => {
        setLoading(true);
        setError(null);
        try {
            const [directRes, groupRes] = await Promise.all([
                axiosInstance.get("/invitation/invitation"),
                axiosInstance.get("/group/invitations"),
            ]);
            const directData = directRes.data || {};
            const groupData = groupRes.data || {};

            const rawReceived = Array.isArray(directData.received) ? directData.received : [];
            const rawSent = Array.isArray(directData.sent) ? directData.sent : [];
            const rawGroup =
                groupData.invitations ||
                groupData.data ||
                (Array.isArray(groupData) ? groupData : []);

            setReceived(rawReceived.filter((i: any) => i.sender && (i.sender._id || i.sender.id)));
            setSent(rawSent.filter((i: any) => i.receiver && (i.receiver._id || i.receiver.id)));
            setGroupInvitations(
                rawGroup.filter((i: any) => i.group && i.sender && (i.sender._id || i.sender.id))
            );
        } catch (err: any) {
            setError(err?.response?.data?.message || "Couldn't load invitations. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAllInvitations();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const onCreated = () => {
            toast.success("You received a new friend invitation");
            fetchAllInvitations();
        };
        const onStatusChanged = (data: any) => {
            toast.success(`Invitation ${data?.status || "updated"}`);
            fetchAllInvitations();
        };
        const onGroupInvitation = (invitation: any) => {
            toast.success(`You received a group invitation to join "${invitation?.group?.name || "a group"}"`);
            fetchAllInvitations();
        };

        socket.on("invitation:created", onCreated);
        socket.on("invitation:statusChanged", onStatusChanged);
        socket.on("group:invitation", onGroupInvitation);
        socket.on("group:invitationStatusChanged", fetchAllInvitations);

        return () => {
            socket.off("invitation:created", onCreated);
            socket.off("invitation:statusChanged", onStatusChanged);
            socket.off("group:invitation", onGroupInvitation);
            socket.off("group:invitationStatusChanged", fetchAllInvitations);
        };
    }, []);

    const updateStatus = async (id: string, status: string) => {
        setUpdating((s) => ({ ...s, [id]: status }));
        try {
            await axiosInstance.patch(`/invitation/${id}?invitationStatus=${status}`);
            toast.success(status === "accepted" ? "Friend invitation accepted" : "Friend invitation rejected");
            fetchAllInvitations();
            if (status === "accepted") fetchConversations();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Something went wrong");
        } finally {
            setUpdating((s) => ({ ...s, [id]: undefined }));
        }
    };

    const updateGroupStatus = async (invitationId: string, action: "accepted" | "rejected") => {
        setUpdating((s) => ({ ...s, [`group_${invitationId}`]: action }));
        try {
            await respondToGroupInvitation(invitationId, action);
            toast.success(action === "accepted" ? "Group invitation accepted!" : "Group invitation declined");
            fetchAllInvitations();
            if (action === "accepted") fetchConversations();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Something went wrong responding to group invitation");
        } finally {
            setUpdating((s) => ({ ...s, [`group_${invitationId}`]: undefined }));
        }
    };

    const pendingDirectCount = Array.isArray(received) ? received.filter((i) => i?.status === "pending").length : 0;
    const pendingGroupCount = Array.isArray(groupInvitations)
        ? groupInvitations.filter((i) => i?.status === "pending").length
        : 0;

    return (
        <div className="flex h-full flex-col rounded-2xl border border-base-300 bg-base-100 p-5 shadow-xl text-base-content">
            <div className="mb-5 flex p-1 rounded-xl bg-base-200/80 border border-base-300 gap-1">
                <button
                    onClick={() => setTab("received")}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all",
                        tab === "received"
                            ? "bg-base-100 text-primary font-bold shadow-xs border border-base-300"
                            : "text-base-content/70 hover:text-base-content"
                    )}
                >
                    <Inbox className="h-3.5 w-3.5" />
                    <span>Direct</span>
                    {pendingDirectCount > 0 && (
                        <span className="badge badge-sm font-bold bg-primary text-primary-content border-none ml-1">
                            {pendingDirectCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setTab("group")}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all",
                        tab === "group"
                            ? "bg-base-100 text-primary font-bold shadow-xs border border-base-300"
                            : "text-base-content/70 hover:text-base-content"
                    )}
                >
                    <Users className="h-3.5 w-3.5" />
                    <span>Group Invites</span>
                    {pendingGroupCount > 0 && (
                        <span className="badge badge-sm font-bold bg-amber-500 text-white border-none ml-1">
                            {pendingGroupCount}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setTab("sent")}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all",
                        tab === "sent"
                            ? "bg-base-100 text-primary font-bold shadow-xs border border-base-300"
                            : "text-base-content/70 hover:text-base-content"
                    )}
                >
                    <Send className="h-3.5 w-3.5" />
                    <span>Sent</span>
                </button>
            </div>

            {loading && (
                <div className="space-y-1 mt-2">
                    <RowSkeleton />
                    <RowSkeleton />
                </div>
            )}

            {!loading && error && (
                <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-red-200 bg-red-50/50 py-12 text-center mt-4 animate-scale-in">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                    <p className="max-w-60 text-sm font-medium text-red-600">{error}</p>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={fetchAllInvitations}
                        className="mt-2 border-red-200 hover:bg-red-500 hover:text-white"
                    >
                        Try again
                    </Button>
                </div>
            )}

            {!loading && !error && (
                <div className="flex-1 overflow-y-auto pr-1 pb-4">
                    {/* Direct Received Invitations */}
                    {tab === "received" && (
                        <div key="received" className="h-full animate-fade-in">
                            {received.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                                    <div className="p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                        <Inbox className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">No direct invitations yet</p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {received.map((invite, idx) => (
                                         <li
                                             key={invite._id}
                                             className="flex flex-col gap-4 rounded-xl border border-base-300 bg-base-100 p-4 shadow-xs transition-all hover:border-primary/40 hover:shadow-md sm:flex-row sm:items-center sm:justify-between stagger-item"
                                             style={{ "--stagger-index": idx } as React.CSSProperties}
                                         >
                                             <div className="flex min-w-0 items-center gap-4">
                                                 <Avatar
                                                     src={invite.sender?.avatar}
                                                     name={invite.sender?.username || invite.sender?.email}
                                                     size="md"
                                                     showStatus={true}
                                                     status={invite.sender?.status || "offline"}
                                                 />
                                                 <div className="min-w-0">
                                                     <p className="truncate text-sm font-bold text-base-content">
                                                         {invite.sender?.username || invite.sender?.email || "User"}
                                                     </p>
                                                     <p className="truncate text-xs font-medium text-base-content/60">
                                                         {invite.sender?.email}
                                                     </p>
                                                 </div>
                                             </div>

                                             {invite.status === "pending" ? (
                                                 <div className="flex gap-2 sm:shrink-0">
                                                     <Button
                                                         size="sm"
                                                         className="h-9 gap-1.5 rounded-lg bg-primary hover:opacity-90 text-primary-content font-semibold shadow-xs hover:scale-105 active:scale-95 transition-all border-none"
                                                         disabled={!!updating[invite._id]}
                                                         onClick={() => updateStatus(invite._id, "accepted")}
                                                     >
                                                         {updating[invite._id] === "accepted" ? (
                                                             <span className="loading loading-spinner loading-xs text-primary-content"></span>
                                                         ) : (
                                                             <Check className="h-3.5 w-3.5" />
                                                         )}
                                                         Accept
                                                     </Button>
                                                     <Button
                                                         size="sm"
                                                         variant="outline"
                                                         className="h-9 gap-1.5 rounded-lg bg-base-200 hover:bg-base-300 text-base-content font-semibold border border-base-300 hover:scale-105 active:scale-95 transition-all"
                                                         disabled={!!updating[invite._id]}
                                                         onClick={() => updateStatus(invite._id, "rejected")}
                                                     >
                                                         {updating[invite._id] === "rejected" ? (
                                                             <span className="loading loading-spinner loading-xs text-base-content"></span>
                                                         ) : (
                                                             <X className="h-3.5 w-3.5" />
                                                         )}
                                                         Reject
                                                     </Button>
                                                 </div>
                                             ) : (
                                                 <StatusBadge status={invite.status} />
                                             )}
                                         </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Group Invitations */}
                    {tab === "group" && (
                        <div key="group" className="h-full animate-fade-in">
                            {groupInvitations.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                                    <div className="p-3 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                                        <Users className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">No group invitations yet</p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {groupInvitations.map((invite, idx) => (
                                        <li
                                            key={invite._id}
                                            className="flex flex-col gap-4 rounded-xl border border-amber-200/60 bg-gradient-to-r from-amber-50/30 to-white p-4 shadow-xs transition-all hover:border-amber-300 hover:shadow-md hover:shadow-amber-500/5 sm:flex-row sm:items-center sm:justify-between stagger-item"
                                            style={{ "--stagger-index": idx } as React.CSSProperties}
                                        >
                                            <div className="flex min-w-0 items-center gap-4">
                                                <div className="h-11 w-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-sm">
                                                    <Users className="h-5 w-5" />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-2">
                                                        <p className="truncate text-sm font-bold text-slate-900">
                                                            {invite.group?.name || "Group"}
                                                        </p>
                                                        <span className="badge badge-sm bg-amber-100 text-amber-800 font-bold border-amber-200 text-[10px]">
                                                            Group Invite
                                                        </span>
                                                    </div>
                                                    <p className="truncate text-xs font-medium text-slate-500 mt-0.5">
                                                        Invited by{" "}
                                                        <span className="font-semibold text-slate-700">
                                                            {invite.sender?.username || invite.sender?.email || "Admin"}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>

                                            {invite.status === "pending" ? (
                                                <div className="flex gap-2 sm:shrink-0">
                                                    <Button
                                                        size="sm"
                                                        className="h-9 gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs hover:scale-105 active:scale-95 transition-all border-none"
                                                        disabled={!!updating[`group_${invite._id}`]}
                                                        onClick={() => updateGroupStatus(invite._id, "accepted")}
                                                    >
                                                        {updating[`group_${invite._id}`] === "accepted" ? (
                                                            <span className="loading loading-spinner loading-xs text-white"></span>
                                                        ) : (
                                                            <Check className="h-3.5 w-3.5" />
                                                        )}
                                                        Accept
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="h-9 gap-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border border-slate-200 hover:scale-105 active:scale-95 transition-all"
                                                        disabled={!!updating[`group_${invite._id}`]}
                                                        onClick={() => updateGroupStatus(invite._id, "rejected")}
                                                    >
                                                        {updating[`group_${invite._id}`] === "rejected" ? (
                                                            <span className="loading loading-spinner loading-xs text-slate-600"></span>
                                                        ) : (
                                                            <X className="h-3.5 w-3.5" />
                                                        )}
                                                        Decline
                                                    </Button>
                                                </div>
                                            ) : (
                                                <StatusBadge status={invite.status} />
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}

                    {/* Sent Invitations */}
                    {tab === "sent" && (
                        <div key="sent" className="h-full animate-fade-in">
                            {sent.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                                    <div className="p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                        <Send className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">No invitations sent</p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {sent.map((invite, idx) => (
                                        <li
                                            key={invite._id}
                                            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200/70 bg-white p-4 shadow-xs stagger-item"
                                            style={{ "--stagger-index": idx }as React.CSSProperties}
                                        >
                                            <div className="flex min-w-0 items-center gap-4">
                                                <Avatar
                                                    src={invite.receiver?.avatar}
                                                    name={invite.receiver?.username || invite.receiver?.email}
                                                    size="md"
                                                    showStatus={true}
                                                    status={invite.receiver?.status || "offline"}
                                                />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-slate-900">
                                                        {invite.receiver?.username || invite.receiver?.email || "User"}
                                                    </p>
                                                    <p className="truncate text-xs font-medium text-slate-500">
                                                        {invite.receiver?.email}
                                                    </p>
                                                </div>
                                            </div>
                                            <StatusBadge status={invite.status} />
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
