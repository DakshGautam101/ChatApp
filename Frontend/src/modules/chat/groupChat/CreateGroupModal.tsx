import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/core/components/ui/dialog";
import { Button } from "@/core/components/ui/button";
import { Input } from "@/core/components/ui/input";
import Avatar from "@/core/components/Avatar";
import { axiosInstance } from "@/core/api/axiosInstance";
import useChatStore from "../stores/useChatStore";
import toast from "react-hot-toast";
import { Users, Check, Search, Loader2 } from "lucide-react";
import { cn } from "@/core/utils/utils";
import type { UserInterface } from "@/core/types/UserInterface";

export default function CreateGroupModal({ open, onOpenChange }) {
    const [name, setName] = useState("");
    const [selectedMemberIds, setSelectedMemberIds] = useState([]);
    const [friends, setFriends] = useState([]);
    const [loadingFriends, setLoadingFriends] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const { createGroup } = useChatStore();

    useEffect(() => {
        if (!open) {
            setName("");
            setSelectedMemberIds([]);
            setSearchTerm("");
            return;
        }

        const fetchFriends = async () => {
            setLoadingFriends(true);
            try {
                const res = await axiosInstance.get("/user/userlist");
                const allUsers = res.data?.data || [];
                const friendUsers = allUsers.filter((u) => u.isFriend);
                setFriends(friendUsers);
            } catch (err) {
                toast.error("Failed to load connections");
            } finally {
                setLoadingFriends(false);
            }
        };

        fetchFriends();
    }, [open]);

    const toggleSelectMember = (userId: string) => {
        setSelectedMemberIds((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!name.trim()) {
            toast.error("Please enter a group name");
            return;
        }

        if (selectedMemberIds.length < 2) {
            toast.error("Minimum 2 other members required from your connections");
            return;
        }

        setIsSubmitting(true);
        try {
            await createGroup({ name: name.trim(), members: selectedMemberIds });
            toast.success(`Group "${name.trim()}" created successfully!`);
            onOpenChange(false);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to create group");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredFriends = friends.filter((f: UserInterface) => {
        const query = searchTerm.toLowerCase().trim();
        if (!query) return true;
        return (
            (f.username || "").toLowerCase().includes(query) ||
            (f.email || "").toLowerCase().includes(query)
        );
    });

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-col items-center justify-center text-center gap-1">
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-100 mb-1">
                        <Users className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-slate-900">Create New Group</DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Create a group with a name and select at least 2 members from your connections.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleCreate} className="space-y-4 py-2">
                    <div>
                        <label htmlFor="group-name" className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Group Name <span className="text-red-500">*</span>
                        </label>
                        <Input
                            id="group-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter your group name :"
                            maxLength={50}
                            className="rounded-xl bg-slate-50 border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500/20 text-slate-900 h-11"
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="text-xs font-semibold text-slate-700">
                                Select Members ({selectedMemberIds.length} selected)
                            </label>
                            <span className="text-xs text-slate-400">Min 2 required</span>
                        </div>

                        {friends.length > 0 && (
                            <div className="relative mb-2">
                                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Search connections..."
                                    className="pl-9 h-9 text-xs rounded-lg bg-slate-50 border-slate-200"
                                />
                            </div>
                        )}

                        <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 space-y-1">
                            {loadingFriends ? (
                                <div className="flex items-center justify-center p-6 text-slate-400 gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                    <span className="text-xs">Loading connections...</span>
                                </div>
                            ) : friends.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-500">
                                    No connections found. Connect with friends first to add them to a group.
                                </div>
                            ) : filteredFriends.length === 0 ? (
                                <div className="p-6 text-center text-xs text-slate-500">
                                    No connection matches "{searchTerm}"
                                </div>
                            ) : (
                                filteredFriends.map((friend) => {
                                    const isSelected = selectedMemberIds.includes(friend._id);
                                    return (
                                        <div
                                            key={friend._id}
                                            onClick={() => toggleSelectMember(friend._id)}
                                            className={cn(
                                                "flex items-center justify-between p-2.5 rounded-lg cursor-pointer transition-all border",
                                                isSelected
                                                    ? "bg-blue-50/80 border-blue-200 shadow-xs"
                                                    : "bg-white border-slate-100 hover:border-slate-200"
                                            )}
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Avatar
                                                    src={friend.avatar}
                                                    name={friend.username || friend.email}
                                                    size="sm"
                                                    showStatus={true}
                                                    status={friend.status || "offline"}
                                                />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-900 truncate">
                                                        {friend.username || friend.email}
                                                    </p>
                                                    <p className="text-[11px] text-slate-500 truncate">{friend.email}</p>
                                                </div>
                                            </div>
                                            <div
                                                className={cn(
                                                    "h-5 w-5 rounded-md flex items-center justify-center border transition-all",
                                                    isSelected
                                                        ? "bg-blue-600 border-blue-600 text-white"
                                                        : "border-slate-300 bg-white"
                                                )}
                                            >
                                                {isSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isSubmitting}
                            onClick={() => onOpenChange(false)}
                            className="rounded-xl border-slate-200 text-slate-700 font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting || selectedMemberIds.length < 2 || !name.trim()}
                            className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md shadow-blue-500/20 gap-2 border-none"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin text-white" />
                                    Creating...
                                </>
                            ) : (
                                "Create Group"
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
