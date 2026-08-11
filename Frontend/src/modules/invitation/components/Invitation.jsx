import { useEffect, useState } from "react";
import { axiosInstance } from "@/core/api/axiosInstance";
import { socket } from "@/core/socket/socket";
import { Button } from "@/core/components/ui/button";
import toast from "react-hot-toast";
import { AlertCircle, Check, Inbox, Loader2, Send, X } from "lucide-react";
import { cn } from "@/core/utils/utils";
import Avatar from "@/core/components/Avatar";

function StatusBadge({ status }) {
    const isPending = status === "pending";
    const isAccepted = status === "accepted";
    
    return (
        <span className={cn(
            "badge badge-sm font-bold uppercase tracking-wider border",
            isPending && "bg-amber-50 text-amber-700 border-amber-200",
            isAccepted && "bg-blue-50 text-blue-700 border-blue-200",
            !isPending && !isAccepted && "bg-slate-100 text-slate-400 border-slate-200 line-through opacity-70"
        )}>
            {status}
        </span>
    );
}

function RowSkeleton() {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/50 p-4 mb-2">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-slate-200 animate-pulse" />
                <div className="space-y-2">
                    <div className="h-3.5 w-32 rounded bg-slate-200 animate-pulse" />
                    <div className="h-2.5 w-40 rounded bg-slate-200 animate-pulse" />
                </div>
            </div>
            <div className="h-8 w-20 rounded-lg bg-slate-200 animate-pulse" />
        </div>
    );
}

export default function Invitation() {
    const [received, setReceived] = useState([]);
    const [sent, setSent] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState({});
    const [tab, setTab] = useState("received");

    const fetchInvitations = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await axiosInstance.get("/invitation/invitation");
            setReceived(res.data.received || []);
            setSent(res.data.sent || []);
        } catch (err) {
            setError(err?.response?.data?.message || "Couldn't load invitations. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    useEffect(() => {
        if (!socket) return;

        const onCreated = () => {
            toast.success("You received a new invitation");
            fetchInvitations();
        };
        const onStatusChanged = (data) => {
            toast.success(`Invitation ${data.status}`);
            fetchInvitations();
        };

        socket.on("invitation:created", onCreated);
        socket.on("invitation:statusChanged", onStatusChanged);

        return () => {
            socket.off("invitation:created", onCreated);
            socket.off("invitation:statusChanged", onStatusChanged);
        };
    }, []);

    const updateStatus = async (id, status) => {
        setUpdating((s) => ({ ...s, [id]: status }));
        try {
            await axiosInstance.patch(`/invitation/${id}?invitationStatus=${status}`);
            toast.success(status === "accepted" ? "Invitation accepted" : "Invitation rejected");
            fetchInvitations();
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong");
        } finally {
            setUpdating((s) => ({ ...s, [id]: undefined }));
        }
    };

    const pendingReceivedCount = received.filter((i) => i.status === "pending").length;

    return (
        <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xl shadow-blue-900/5">
            <div className="mb-5 flex p-1 rounded-xl bg-slate-100 border border-slate-200/60">
                <button
                    onClick={() => setTab("received")}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all",
                        tab === "received" ? "bg-white text-blue-600 font-bold shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"
                    )}
                >
                    <Inbox className="h-4 w-4" />
                    Received
                    {pendingReceivedCount > 0 && (
                        <span className="badge badge-sm font-bold bg-blue-600 text-white border-none ml-1">
                            {pendingReceivedCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setTab("sent")}
                    className={cn(
                        "flex flex-1 items-center justify-center gap-2 rounded-lg py-2 text-sm font-medium transition-all",
                        tab === "sent" ? "bg-white text-blue-600 font-bold shadow-xs border border-slate-200/60" : "text-slate-600 hover:text-slate-900"
                    )}
                >
                    <Send className="h-4 w-4" />
                    Sent
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
                    <Button size="sm" variant="outline" onClick={fetchInvitations} className="mt-2 border-red-200 hover:bg-red-500 hover:text-white">
                        Try again
                    </Button>
                </div>
            )}

            {!loading && !error && (
                <div className="flex-1 overflow-y-auto pr-1 pb-4">
                    {tab === "received" && (
                        <div key="received" className="h-full animate-fade-in">
                            {received.length === 0 ? (
                                <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 py-12 text-center">
                                    <div className="p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                                        <Inbox className="h-6 w-6" />
                                    </div>
                                    <p className="text-sm font-medium text-slate-500">No invitations yet</p>
                                </div>
                            ) : (
                                <ul className="space-y-3">
                                    {received.map((invite, idx) => (
                                        <li
                                            key={invite._id}
                                            className="flex flex-col gap-4 rounded-xl border border-slate-200/70 bg-white p-4 shadow-xs transition-all hover:border-blue-200 hover:shadow-md hover:shadow-blue-500/5 sm:flex-row sm:items-center sm:justify-between stagger-item"
                                            style={{ "--stagger-index": idx }}
                                        >
                                            <div className="flex min-w-0 items-center gap-4">
                                                <Avatar src={invite.sender?.avatar} name={invite.sender?.username || invite.sender?.email} size="md" showStatus={true} status={invite.sender?.status || "offline"} />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-slate-900">{invite.sender?.username || "Unknown"}</p>
                                                    <p className="truncate text-xs font-medium text-slate-500">{invite.sender?.email}</p>
                                                </div>
                                            </div>

                                            {invite.status === "pending" ? (
                                                <div className="flex gap-2 sm:shrink-0">
                                                    <Button
                                                        size="sm"
                                                        className="h-9 gap-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-xs hover:scale-105 active:scale-95 transition-all border-none"
                                                        disabled={!!updating[invite._id]}
                                                        onClick={() => updateStatus(invite._id, "accepted")}
                                                    >
                                                        {updating[invite._id] === "accepted" ? (
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
                                                        disabled={!!updating[invite._id]}
                                                        onClick={() => updateStatus(invite._id, "rejected")}
                                                    >
                                                        {updating[invite._id] === "rejected" ? (
                                                            <span className="loading loading-spinner loading-xs text-slate-600"></span>
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
                                            style={{ "--stagger-index": idx }}
                                        >
                                            <div className="flex min-w-0 items-center gap-4">
                                                <Avatar src={invite.receiver?.avatar} name={invite.receiver?.username || invite.receiver?.email} size="md" showStatus={true} status={invite.receiver?.status || "offline"} />
                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-bold text-slate-900">{invite.receiver?.username || "Unknown"}</p>
                                                    <p className="truncate text-xs font-medium text-slate-500">{invite.receiver?.email}</p>
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
