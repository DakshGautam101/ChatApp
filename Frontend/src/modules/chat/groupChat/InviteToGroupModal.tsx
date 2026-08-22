import { useState, useEffect } from "react";
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
import { UserPlus, Search, Send, Loader2, CheckCircle2 } from "lucide-react";

export default function InviteToGroupModal({ open, onOpenChange, group }) {
    const [query, setQuery] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [searching, setSearching] = useState(false);
    const [invitingState, setInvitingState] = useState({});
    const [invitedState, setInvitedState] = useState({});
    const { sendGroupInvitation } = useChatStore();

    const fetchUsers = async (searchQuery = "") => {
        if (!group?._id) return;
        setSearching(true);
        try {
            const res = await axiosInstance.get(`/group/${group._id}/search-users`, {
                params: { query: searchQuery.trim() },
            });
            const users = res.data?.users || res.data?.data || (Array.isArray(res.data) ? res.data : []);
            setSearchResults(Array.isArray(users) ? users : []);
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to search users");
        } finally {
            setSearching(false);
        }
    };

    useEffect(() => {
        if (open && group?._id) {
            setQuery("");
            setInvitedState({});
            setInvitingState({});
            fetchUsers("");
        } else if (!open) {
            setQuery("");
            setSearchResults([]);
        }
    }, [open, group?._id]);

    const handleSearch = (e) => {
        e?.preventDefault();
        fetchUsers(query);
    };

    const handleInviteUser = async (userId : string) => {
        if (!group?._id || !userId) return;

        setInvitingState((prev) => ({ ...prev, [userId]: true }));
        try {
            await sendGroupInvitation(group._id, { receiverId: userId });
            setInvitedState((prev) => ({ ...prev, [userId]: true }));
            toast.success("Group invitation sent successfully");
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to send invitation");
        } finally {
            setInvitingState((prev) => ({ ...prev, [userId]: false }));
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader className="flex flex-col items-center justify-center text-center gap-1">
                    <div className="p-3 rounded-full bg-blue-50 text-blue-600 border border-blue-100 mb-1">
                        <UserPlus className="h-6 w-6" />
                    </div>
                    <DialogTitle className="text-xl font-bold text-slate-900">
                        Invite Members to Group
                    </DialogTitle>
                    <DialogDescription className="text-xs text-slate-500">
                        Search and invite users to <span className="font-semibold text-slate-700">"{group?.name}"</span> by email, phone number, or username.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <Input
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Email, phone number, or username..."
                                className="pl-9 h-11 rounded-xl bg-slate-50 border-slate-200 focus:bg-white text-xs"
                            />
                        </div>
                        <Button
                            type="submit"
                            disabled={searching || !query.trim()}
                            className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold gap-1.5 px-4"
                        >
                            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
                        </Button>
                    </form>

                    <div className="max-h-60 overflow-y-auto rounded-xl border border-slate-200/80 bg-slate-50/50 p-2 space-y-1">
                        {searching ? (
                            <div className="flex items-center justify-center p-6 text-slate-400 gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                                <span className="text-xs">Searching users...</span>
                            </div>
                        ) : searchResults.length === 0 ? (
                            <div className="p-6 text-center text-xs text-slate-500">
                                {query.trim()
                                    ? "No non-member users found matching search"
                                    : "Type a username, email, or phone number to search"}
                            </div>
                        ) : (
                            searchResults.map((user) => {
                                const isInvited = invitedState[user._id];
                                const isInviting = invitingState[user._id];

                                return (
                                    <div
                                        key={user._id}
                                        className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-slate-100 shadow-xs"
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <Avatar
                                                src={user.avatar}
                                                name={user.username || user.email}
                                                size="sm"
                                                showStatus={true}
                                                status={user.status || "offline"}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-slate-900 truncate">
                                                    {user.username || user.email}
                                                </p>
                                                <p className="text-[11px] text-slate-500 truncate">
                                                    {user.email} {user.phone ? `• ${user.phone}` : ""}
                                                </p>
                                            </div>
                                        </div>

                                        {isInvited ? (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                disabled
                                                className="gap-1 rounded-lg h-8 text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200"
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                                Invited
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                disabled={isInviting}
                                                onClick={() => handleInviteUser(user._id)}
                                                className="gap-1.5 rounded-lg h-8 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                                            >
                                                {isInviting ? (
                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                ) : (
                                                    <Send className="h-3.5 w-3.5" />
                                                )}
                                                Invite
                                            </Button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
