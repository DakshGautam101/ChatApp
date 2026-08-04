import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axiosInstance";
import { socket } from "../lib/socket";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import { AlertCircle, Check, Inbox, Loader2, Send, X } from "lucide-react";

function Avatar({ name }) {
    const initial = (name || "?").trim().charAt(0).toUpperCase();
    return (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold">
            {initial || "?"}
        </div>
    );
}

function StatusBadge({ status }) {
    const map = {
        pending: "border border-border text-muted-foreground",
        accepted: "bg-foreground text-background",
        rejected: "border border-border text-muted-foreground line-through decoration-1",
    };
    return (
        <span className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${map[status] || map.pending}`}>
            {status}
        </span>
    );
}

function RowSkeleton() {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
            <div className="flex items-center gap-3">
                <div className="h-10 w-10 shrink-0 rounded-full bg-shimmer animate-shimmer" />
                <div className="space-y-2">
                    <div className="h-3 w-28 rounded bg-shimmer animate-shimmer" />
                    <div className="h-2.5 w-36 rounded bg-shimmer animate-shimmer" />
                </div>
            </div>
            <div className="h-6 w-16 rounded-full bg-shimmer animate-shimmer" />
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
        <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-4">
            <div className="mb-4 flex items-center gap-1 rounded-xl bg-secondary p-1">
                <button
                    onClick={() => setTab("received")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition-colors ${tab === "received" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Inbox className="h-3.5 w-3.5" />
                    Received
                    {pendingReceivedCount > 0 && (
                        <span className="ml-1 rounded-full bg-foreground px-1.5 text-[10px] font-semibold text-background">
                            {pendingReceivedCount}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setTab("sent")}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-1.5 text-sm font-medium transition-colors ${tab === "sent" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Send className="h-3.5 w-3.5" />
                    Sent
                </button>
            </div>

            {loading && (
                <div className="space-y-2">
                    <RowSkeleton />
                    <RowSkeleton />
                </div>
            )}

            {!loading && error && (
                <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border py-12 text-center animate-in fade-in duration-300">
                    <AlertCircle className="h-5 w-5 text-muted-foreground" />
                    <p className="max-w-[240px] text-sm text-muted-foreground">{error}</p>
                    <Button size="sm" variant="outline" onClick={fetchInvitations}>
                        Try again
                    </Button>
                </div>
            )}

            {!loading && !error && tab === "received" && (
                received.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center animate-in fade-in duration-300">
                        <Inbox className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No invitations yet</p>
                    </div>
                ) : (
                    <ul className="space-y-2 overflow-y-auto">
                        {received.map((invite, i) => (
                            <li
                                key={invite._id}
                                style={{ "--stagger-index": i }}
                                className="stagger-item flex flex-col gap-3 rounded-xl border border-border p-3 opacity-0 animate-fade-in-up sm:flex-row sm:items-center sm:justify-between"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <Avatar name={invite.sender?.username || invite.sender?.email} />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{invite.sender?.username}</p>
                                        <p className="truncate text-xs text-muted-foreground">{invite.sender?.email}</p>
                                    </div>
                                </div>

                                {invite.status === "pending" ? (
                                    <div className="flex gap-2 sm:shrink-0">
                                        <Button
                                            size="sm"
                                            className="gap-1.5"
                                            disabled={!!updating[invite._id]}
                                            onClick={() => updateStatus(invite._id, "accepted")}
                                        >
                                            {updating[invite._id] === "accepted" ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Check className="h-3.5 w-3.5" />
                                            )}
                                            Accept
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="gap-1.5"
                                            disabled={!!updating[invite._id]}
                                            onClick={() => updateStatus(invite._id, "rejected")}
                                        >
                                            {updating[invite._id] === "rejected" ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
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
                )
            )}

            {!loading && !error && tab === "sent" && (
                sent.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center animate-in fade-in duration-300">
                        <Send className="h-5 w-5 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">No invitations sent</p>
                    </div>
                ) : (
                    <ul className="space-y-2 overflow-y-auto">
                        {sent.map((invite, i) => (
                            <li
                                key={invite._id}
                                style={{ "--stagger-index": i }}
                                className="stagger-item flex items-center justify-between gap-3 rounded-xl border border-border p-3 opacity-0 animate-fade-in-up"
                            >
                                <div className="flex min-w-0 items-center gap-3">
                                    <Avatar name={invite.receiver?.username || invite.receiver?.email} />
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">{invite.receiver?.username}</p>
                                        <p className="truncate text-xs text-muted-foreground">{invite.receiver?.email}</p>
                                    </div>
                                </div>
                                <StatusBadge status={invite.status} />
                            </li>
                        ))}
                    </ul>
                )
            )}
        </div>
    );
}