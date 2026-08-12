import React, { useEffect, useState } from 'react';
import useAuthStore from '@/modules/auth/stores/useAuthStore';
import useChatStore from '../stores/useChatStore';
import { cn } from '@/core/utils/utils';
import { MessageCircle, Users, Plus } from 'lucide-react';
import Avatar from '@/core/components/Avatar';
import CreateGroupModal from '../groupChat/CreateGroupModal';

const ConversationList = () => {
    const { user } = useAuthStore();
    const [showCreateGroup, setShowCreateGroup] = useState(false);

    const {
        conversations,
        activeConversation,
        fetchConversations,
        openConversation,
        isLoadingConversations,
    } = useChatStore();

    useEffect(() => {
        fetchConversations();
    }, []);

    const getOtherParticipant = (conversation) =>
        conversation.participants?.find((p) => (p.user?._id || p.user) !== user?._id)?.user;

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <div className="p-3 border-b border-slate-200/80 flex items-center justify-between bg-white/50">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Conversations</span>
                <button
                    onClick={() => setShowCreateGroup(true)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all text-xs font-bold border border-blue-200/60"
                    title="Create a new group chat"
                >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New Group</span>
                </button>
            </div>

            {isLoadingConversations && (
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

            {!isLoadingConversations && !conversations.length && (
                <div className="flex flex-col items-center justify-center p-8 h-full text-center flex-1">
                    <div className="bg-slate-100 p-4 rounded-full mb-3">
                        <MessageCircle className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-sm font-semibold text-slate-900">No chats yet</p>
                    <p className="text-xs text-slate-500 mt-1">Start a private chat or create a group to begin messaging.</p>
                    <button
                        onClick={() => setShowCreateGroup(true)}
                        className="mt-4 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs transition-all flex items-center gap-1.5 shadow-md shadow-blue-500/20"
                    >
                        <Users className="h-4 w-4" />
                        Create a Group
                    </button>
                </div>
            )}

            {!isLoadingConversations && conversations.length > 0 && (
                <div className="flex flex-col p-2 space-y-1 overflow-y-auto flex-1">
                    {conversations.map((conversation, idx) => {
                        const isGroup = conversation.type === 'group';
                        const other = isGroup ? null : getOtherParticipant(conversation);
                        const isActive = activeConversation?._id === conversation._id;
                        const title = isGroup
                            ? conversation.name || 'Group Chat'
                            : other?.username || other?.email || 'Unknown user';

                        return (
                            <button
                                key={conversation._id}
                                onClick={() => openConversation(conversation)}
                                className={cn(
                                    "group flex items-center gap-3 px-3.5 py-3 rounded-xl text-left transition-all duration-150 border stagger-item active:scale-[0.98]",
                                    isActive
                                        ? "bg-blue-50/80 border-blue-200 shadow-xs"
                                        : "bg-transparent border-transparent hover:bg-slate-100/80"
                                )}
                                style={{ "--stagger-index": idx }}
                            >
                                {isGroup ? (
                                    <div className="relative shrink-0">
                                        {conversation.avatarUrl ? (
                                            <Avatar
                                                src={conversation.avatarUrl}
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
                                    <div className="flex justify-between items-baseline mb-0.5">
                                        <div className={cn(
                                            "truncate text-sm font-semibold flex items-center gap-1.5",
                                            isActive ? "text-blue-900" : "text-slate-900"
                                        )}>
                                            <span className="truncate">{title}</span>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "truncate text-xs",
                                        isActive ? "text-blue-700 font-medium" : "text-slate-500"
                                    )}>
                                        {conversation.lastMessage?.text ||
                                            (isGroup ? `${conversation.participants?.length || 0} members` : "No messages yet")}
                                    </div>
                                </div>
                            </button>
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
