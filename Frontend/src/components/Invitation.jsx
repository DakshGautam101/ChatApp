import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axiosInstance";
import { socket } from "../lib/socket";
import { Button } from "./ui/button";
import toast from "react-hot-toast";
import { AlertCircle, Check, Inbox, Loader2, Send, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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

function StatusBadge({ status }) {
    const isPending = status === "pending";
    const isAccepted = status === "accepted";
    
    return (
        <span className={cn(
            "rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wider",
            isPending && "bg-secondary text-muted-foreground border border-border/50",
            isAccepted && "bg-white/10 text-foreground border border-white/20",
            !isPending && !isAccepted && "bg-white/10 text-muted-foreground border border-white/10 line-through decoration-muted-foreground/50"
        )}>
            {status}
        </span>
    );
}

function RowSkeleton() {
    return (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 glass-subtle p-4 mb-2">
            <div className="flex items-center gap-3">
                <div className="h-11 w-11 shrink-0 rounded-full bg-shimmer animate-shimmer" />
                <div className="space-y-2.5">
                    <div className="h-3.5 w-32 rounded bg-shimmer animate-shimmer" />
                    <div className="h-2.5 w-40 rounded bg-shimmer animate-shimmer" />
                </div>
            </div>
            <div className="h-8 w-20 rounded-full bg-shimmer animate-shimmer" />
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

    const listVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };
    const itemVariants = {
        hidden: { opacity: 0, x: -20 },
        show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
        exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    };

    return (
        <div className="flex h-full flex-col rounded-2xl border border-white/10 glass p-5 shadow-xl">
            <div className="mb-5 flex p-1.5 rounded-xl glass-subtle border border-border/50 relative">
                <button
                    onClick={() => setTab("received")}
                    className={cn(
                        "relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors z-10",
                        tab === "received" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Inbox className="h-4 w-4" />
                    Received
                    {pendingReceivedCount > 0 && (
                        <span className="ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                            {pendingReceivedCount}
                        </span>
                    )}
                    {tab === "received" && (
                        <motion.div 
                            layoutId="invite-tab"
                            className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/50 -z-10"
                        />
                    )}
                </button>
                <button
                    onClick={() => setTab("sent")}
                    className={cn(
                        "relative flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors z-10",
                        tab === "sent" ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    )}
                >
                    <Send className="h-4 w-4" />
                    Sent
                    {tab === "sent" && (
                        <motion.div 
                            layoutId="invite-tab"
                            className="absolute inset-0 bg-background rounded-lg shadow-sm border border-border/50 -z-10"
                        />
                    )}
                </button>
            </div>

            {loading && (
                <div className="space-y-1 mt-2">
                    <RowSkeleton />
                    <RowSkeleton />
                </div>
            )}

            {!loading && error && (
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-white/10 bg-white/5 py-12 text-center mt-4"
                >
                    <AlertCircle className="h-8 w-8 text-muted-foreground" />
                    <p className="max-w-60 text-sm font-medium text-muted-foreground">{error}</p>
                    <Button size="sm" variant="outline" onClick={fetchInvitations} className="mt-2 border-white/20 hover:bg-white/20 hover:text-foreground">
                        Try again
                    </Button>
                </motion.div>
            )}

            {!loading && !error && (
                <div className="flex-1 overflow-y-auto pr-1 pb-4">
                    <AnimatePresence mode="wait">
                        {tab === "received" && (
                            <motion.div
                                key="received"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                {received.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-muted/20 py-12 text-center">
                                        <div className="p-4 rounded-full bg-secondary/50">
                                            <Inbox className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">No invitations yet</p>
                                    </div>
                                ) : (
                                    <motion.ul 
                                        variants={listVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="space-y-3"
                                    >
                                        <AnimatePresence>
                                            {received.map((invite) => (
                                                <motion.li
                                                    layout
                                                    variants={itemVariants}
                                                    key={invite._id}
                                                    className="flex flex-col gap-4 rounded-xl border border-white/10 glass-subtle p-4 shadow-sm transition-all hover:border-primary/20 sm:flex-row sm:items-center sm:justify-between"
                                                >
                                                    <div className="flex min-w-0 items-center gap-4">
                                                        <Avatar name={invite.sender?.username || invite.sender?.email} />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold">{invite.sender?.username || "Unknown"}</p>
                                                            <p className="truncate text-xs font-medium text-muted-foreground">{invite.sender?.email}</p>
                                                        </div>
                                                    </div>

                                                    {invite.status === "pending" ? (
                                                        <div className="flex gap-2 sm:shrink-0">
                                                            <Button
                                                                size="sm"
                                                                className="gap-1.5 rounded-lg h-9 font-semibold bg-primary text-white hover:bg-primary/90 border-transparent hover:scale-105 transition-transform"
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
                                                                className="gap-1.5 rounded-lg h-9 font-semibold text-foreground border border-primary/20 hover:bg-primary/10 hover:text-foreground hover:border-primary/30 hover:scale-105 transition-transform"
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
                                                </motion.li>
                                            ))}
                                        </AnimatePresence>
                                    </motion.ul>
                                )}
                            </motion.div>
                        )}

                        {tab === "sent" && (
                            <motion.div
                                key="sent"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                                className="h-full"
                            >
                                {sent.length === 0 ? (
                                    <div className="flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border/50 bg-muted/20 py-12 text-center">
                                        <div className="p-4 rounded-full bg-secondary/50">
                                            <Send className="h-8 w-8 text-muted-foreground" />
                                        </div>
                                        <p className="text-sm font-medium text-muted-foreground">No invitations sent</p>
                                    </div>
                                ) : (
                                    <motion.ul 
                                        variants={listVariants}
                                        initial="hidden"
                                        animate="show"
                                        className="space-y-3"
                                    >
                                        <AnimatePresence>
                                            {sent.map((invite) => (
                                                <motion.li
                                                    layout
                                                    variants={itemVariants}
                                                    key={invite._id}
                                                    className="flex items-center justify-between gap-4 rounded-xl border border-white/10 glass-subtle p-4 shadow-sm"
                                                >
                                                    <div className="flex min-w-0 items-center gap-4">
                                                        <Avatar name={invite.receiver?.username || invite.receiver?.email} />
                                                        <div className="min-w-0">
                                                            <p className="truncate text-sm font-bold">{invite.receiver?.username || "Unknown"}</p>
                                                            <p className="truncate text-xs font-medium text-muted-foreground">{invite.receiver?.email}</p>
                                                        </div>
                                                    </div>
                                                    <StatusBadge status={invite.status} />
                                                </motion.li>
                                            ))}
                                        </AnimatePresence>
                                    </motion.ul>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}