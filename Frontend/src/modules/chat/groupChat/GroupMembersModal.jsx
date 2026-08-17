import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import Avatar from "@/core/components/Avatar";
import useAuthStore from "@/modules/auth/stores/useAuthStore";
import useChatStore from "../stores/useChatStore";
import toast from "react-hot-toast";
import { ShieldCheck, ShieldAlert, UserMinus, LogOut, Users, Loader2 } from "lucide-react";
import { cn } from "@/core/utils/utils";

export default function GroupMembersModal({ open, onOpenChange, group }) {
    const { user: currentUser } = useAuthStore();
    const { updateMemberRole, kickMember, leaveGroup } = useChatStore();
    const [actionLoading, setActionLoading] = useState({});
    const [leaving, setLeaving] = useState(false);

    const participants = (group?.participants || []).filter(
        (p) => p.user && (p.user._id || p.user.id || p.user)
    );
    const currentParticipant = participants.find(
        (p) => (p.user?._id || p.user?.id || p.user)?.toString() === currentUser?._id
    );
    const isCurrentAdmin = currentParticipant?.role === "admin";

    const handleRoleToggle = async (memberId, currentRole) => {
        const newRole = currentRole === "admin" ? "member" : "admin";
        setActionLoading((prev) => ({ ...prev, [`role_${memberId}`]: true }));
        try {
            await updateMemberRole(group._id, memberId, newRole);
            toast.success(newRole === "admin" ? "Promoted to Admin" : "Demoted to Member");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to update role");
        } finally {
            setActionLoading((prev) => ({ ...prev, [`role_${memberId}`]: false }));
        }
    };

    const handleKick = async (memberId, username) => {
        if (!window.confirm(`Are you sure you want to remove ${username || "this member"} from the group?`)) {
            return;
        }
        setActionLoading((prev) => ({ ...prev, [`kick_${memberId}`]: true }));
        try {
            await kickMember(group._id, memberId);
            toast.success("Member removed from group");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to remove member");
        } finally {
            setActionLoading((prev) => ({ ...prev, [`kick_${memberId}`]: false }));
        }
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm("Are you sure you want to leave this group?")) {
            return;
        }
        setLeaving(true);
        try {
            await leaveGroup(group._id);
            toast.success("You left the group");
            onOpenChange(false);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to leave group");
        } finally {
            setLeaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-col items-center justify-center text-center gap-1">
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-100 mb-1">
                        <Users className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-slate-900">
                        {group?.name || "Group"} Members
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        {participants.length} participant{participants.length === 1 ? "" : "s"} in this group
                    </DialogDescription>
                </DialogHeader>

                <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 space-y-2 py-2">
                    {participants.map((p) => {
                        const memberUser = p.user || {};
                        const memberId = (memberUser._id || memberUser)?.toString();
                        const isAdmin = p.role === "admin";
                        const isOwner = p.isOwner;
                        const isSelf = memberId === currentUser?._id;

                        const isRoleLoading = actionLoading[`role_${memberId}`];
                        const isKickLoading = actionLoading[`kick_${memberId}`];

                        return (
                            <div
                                key={memberId || Math.random()}
                                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-white border border-slate-100 shadow-xs"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <Avatar
                                        src={memberUser.avatar}
                                        name={memberUser.username || memberUser.email}
                                        size="md"
                                        showStatus={true}
                                        status={memberUser.status || "offline"}
                                    />
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-1.5">
                                            <p className="text-xs font-bold text-slate-900 truncate">
                                                {memberUser.username || memberUser.email || "User"}
                                            </p>
                                            {isSelf && (
                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-semibold">
                                                    You
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-slate-500 truncate">
                                            {memberUser.email}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                                    {isAdmin ? (
                                        <span className="badge badge-sm font-bold bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1">
                                            <ShieldCheck className="h-3 w-3 text-amber-600" />
                                            {isOwner ? "Owner" : "Admin"}
                                        </span>
                                    ) : (
                                        <span className="badge badge-sm font-medium bg-slate-100 text-slate-600 border-slate-200">
                                            Member
                                        </span>
                                    )}

                                    {isCurrentAdmin && !isSelf && !isOwner && (
                                        <div className="flex items-center gap-1">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={isRoleLoading || isKickLoading}
                                                onClick={() => handleRoleToggle(memberId, p.role)}
                                                className={cn(
                                                    "h-7 text-[11px] px-2 rounded-lg font-semibold border",
                                                    isAdmin
                                                        ? "text-slate-600 hover:bg-slate-100 border-slate-200"
                                                        : "text-amber-700 hover:bg-amber-50 border-amber-200"
                                                )}
                                                title={isAdmin ? "Dismiss as Admin" : "Promote to Admin"}
                                            >
                                                {isRoleLoading ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : isAdmin ? (
                                                    "Dismiss Admin"
                                                ) : (
                                                    "Make Admin"
                                                )}
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={isRoleLoading || isKickLoading}
                                                onClick={() => handleKick(memberId, memberUser.username)}
                                                className="h-7 text-[11px] px-2 rounded-lg font-semibold border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                                title="Remove from group"
                                            >
                                                {isKickLoading ? (
                                                    <Loader2 className="h-3 w-3 animate-spin" />
                                                ) : (
                                                    <UserMinus className="h-3.5 w-3.5" />
                                                )}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="pt-2 border-t border-slate-100 flex justify-end">
                    <Button
                        size="sm"
                        variant="outline"
                        disabled={leaving}
                        onClick={handleLeaveGroup}
                        className="w-full gap-2 rounded-xl h-10 border-red-200 bg-red-50/50 text-red-600 hover:bg-red-600 hover:text-white font-semibold transition-all"
                    >
                        {leaving ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <LogOut className="h-4 w-4" />
                        )}
                        Leave Group
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}

