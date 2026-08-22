import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '@/modules/auth/stores/useAuthStore';
import useChatStore from '../stores/useChatStore';
import { cn } from '@/core/utils/utils';
import { MessageCircle, Users, Plus } from 'lucide-react';
import Avatar from '@/core/components/Avatar';
import CreateGroupModal from '../groupChat/CreateGroupModal';
import type { ConversationInterface } from '@/core/types/ConversationInterface';

function formatConversationTime(timestamp : string) {
    if (!timestamp) return "";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "";

    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    const diffDays = Math.floor((Number(now) - Number(date)) / (1000 * 60 * 60 * 24));

    if (isToday) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (isYesterday) {
        return "Yesterday";
    } else if (diffDays < 7) {
        return date.toLocaleDateString([], { weekday: 'short' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

interface ConversationListItemProps{
    conversation:ConversationInterface;
    isActive:boolean;
    currentUserId:string;
    onSelect:(conversation:ConversationInterface)=>void;
    idx:number;
}

const ConversationListItem : React.FC<ConversationListItemProps> = React.memo(function ConversationListItem({
    conversation,
    isActive,
    currentUserId,
    onSelect,
    idx,
}) {
    const isGroup = conversation.type === 'group';
    const other = isGroup
        ? null
        : conversation.participants?.find(
            (p) => p.user && String(p.user?._id || p.user?.id || p.user) !== currentUserId
        )?.user;
    const title = isGroup
        ? conversation.name || 'Group Chat'
        : other?.username || other?.email || 'User';

    const lastMessageAt = conversation.lastMessage?.at || conversation.lastMessage?.createdAt || conversation.updatedAt || conversation.createdAt;
    const timeStr = formatConversationTime(lastMessageAt);
    const unreadCount = isActive ? 0 : (conversation.unreadCount || 0);

    return (
        <button
            onClick={() => onSelect(conversation)}
            className={cn(
                "group flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150 border stagger-item active:scale-[0.98] w-full",
                isActive
                    ? "bg-blue-50/80 border-blue-200 shadow-xs"
                    : "bg-transparent border-transparent hover:bg-slate-100/80"
            )}
            style={{ "--stagger-index": idx }as React.CSSProperties}
        >
            {isGroup ? (
                <div className="relative shrink-0">
                    {conversation.avatar ? (
                        <Avatar
                            src={conversation.avatar}
                            name={title}
                            size="lg"
                        />
                    ) : (
                        <div className="h-11 w-11 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                            <Users className="h-5 w-5" />
                        </div>
                    )}
                    <span className="absolute -bottom-0.5 -right-0.5 bg-blue-600 text-white text-[9px] font-extrabold px-1 rounded-full border border-white">
                        GRP
                    </span>
                </div>
            ) : (
                <Avatar
                    src={other?.avatar}
                    name={title}
                    size="lg"
                    showStatus={true}
                    status={other?.status || "offline"}
                />
            )}
            <div className="min-w-0 flex-1">
                <div className="flex justify-between items-baseline gap-2 mb-0.5">
                    <div className={cn(
                        "truncate text-sm font-semibold flex items-center gap-1.5 min-w-0 flex-1",
                        isActive ? "text-blue-900" : "text-slate-900"
                    )}>
                        <span className="truncate">{title}</span>
                        {conversation.isConvertedFromGroup && (
                            <span
                                className="inline-flex items-center shrink-0 px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs"
                                title={conversation.formerGroupName ? `Converted from group: ${conversation.formerGroupName}` : "Converted from group"}
                            >
                                From Group
                            </span>
                        )}
                    </div>
                    {timeStr && (
                        <span className={cn(
                            "text-[11px] shrink-0 font-medium",
                            unreadCount > 0 ? "text-blue-600 font-bold" : "text-slate-400"
                        )}>
                            {timeStr}
                        </span>
                    )}
                </div>
                <div className="flex justify-between items-center gap-2">
                    <div className={cn(
                        "truncate text-xs min-w-0 flex-1",
                        unreadCount > 0
                            ? "text-slate-900 font-semibold"
                            : isActive
                                ? "text-blue-700 font-medium"
                                : "text-slate-500"
                    )}>
                        {conversation.lastMessage?.text ||
                            (isGroup ? `${conversation.participants?.length || 0} members` : "No messages yet")}
                    </div>
                    {unreadCount > 0 && (
                        <span className="inline-flex items-center justify-center shrink-0 rounded-full bg-blue-600 text-white font-extrabold text-[10px] px-1.5 py-0.5 min-w-[18px] shadow-xs animate-scale-in">
                            {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
});

const ConversationList = () => {
    const { user } = useAuthStore();
    const navigate = useNavigate();
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    const conversations = useChatStore((state) => state.conversations);
    const activeConversationId = useChatStore((state) => state.activeConversation?._id?.toString());
    const fetchConversations = useChatStore((state) => state.fetchConversations);
    const openConversation = useChatStore((state) => state.openConversation);
    const isLoadingConversations = useChatStore((state) => state.isLoadingConversations);

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    const currentUserId = String(user?._id || user?.id || "");

    const validConversations = React.useMemo(() => {
        return conversations.filter((conversation) => {
            if (conversation.type === "group") {
                const validMembers = (conversation.participants || []).filter(
                    (p) => p.user && (p.user._id || p.user.id || p.user)
                );
                return validMembers.length > 1;
            }
            const other = conversation.participants?.find(
                (p) => p.user && String(p.user?._id || p.user?.id || p.user) !== currentUserId
            )?.user;
            return !!other;
        });
    }, [conversations, currentUserId]);

    const handleSelectConversation = React.useCallback((conversation) => {
        openConversation(conversation);
        navigate(`/chats/${conversation._id}`);
    }, [openConversation, navigate]);

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="p-3 border-b border-slate-200/80 flex items-center justify-between bg-white/50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Conversations</span>
                <button
                    onClick={() => setShowCreateGroup(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all text-xs font-bold border border-blue-200/60 cursor-pointer"
                    title="Create a new group chat"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Group</span>
                </button>
            </div>

            {isLoadingConversations && conversations.length === 0 && (
                <div className="flex flex-col p-3 gap-2 flex-1">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50">
                            <div className="h-12 w-12 rounded-full bg-slate-200 animate-pulse shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-1/2 rounded bg-slate-200 animate-pulse" />
                                <div className="h-2 w-3/4 rounded bg-slate-200 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {(!isLoadingConversations || conversations.length > 0) && validConversations.length === 0 && (
                <div className="flex flex-col items-center justify-center p-8 h-full text-center flex-1">
                    <div className="bg-slate-100 p-4 rounded-full mb-3">
                        <MessageCircle className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">No chats yet</p>
                    <p className="text-xs text-slate-500 mt-1">Start a private chat or create a group to begin messaging.</p>
                    <button
                        onClick={() => setShowCreateGroup(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20 cursor-pointer"
                    >
                        <Users className="h-4 w-4" />
                        Create a Group
                    </button>
                </div>
            )}

            {validConversations.length > 0 && (
                <div className="flex flex-col p-2 space-y-1 overflow-y-auto flex-1">
                    {validConversations.map((conversation, idx) => {
                        const convIdStr = conversation._id?.toString() || conversation._id;
                        const isActive = activeConversationId === convIdStr;

                        return (
                            <ConversationListItem
                                key={convIdStr}
                                conversation={conversation}
                                isActive={isActive}
                                currentUserId={currentUserId}
                                onSelect={handleSelectConversation}
                                idx={idx}
                            />
                        );
                    })}
                </div>
            )}

            <CreateGroupModal
                open={showCreateGroup}
                onOpenChange={setShowCreateGroup}
            />
        </div>
    );
};

export default ConversationList;
