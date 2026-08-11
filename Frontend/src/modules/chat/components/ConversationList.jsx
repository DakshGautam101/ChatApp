import React, { useEffect } from 'react';
import useAuthStore from '@/modules/auth/stores/useAuthStore';
import useChatStore from '../stores/useChatStore';
import { cn } from '@/core/utils/utils';
import { MessageCircle } from 'lucide-react';
import Avatar from '@/core/components/Avatar';

const ConversationList = () => {

    const { user } = useAuthStore();

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
        conversation.participants.find((p) => p.user._id !== user?._id)?.user;

    if (isLoadingConversations) {
        return (
            <div className="flex flex-col p-3 gap-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border/30 glass-subtle">
                        <div className="h-12 w-12 rounded-full bg-shimmer animate-shimmer shrink-0" />
                        <div className="space-y-2 flex-1">
                            <div className="h-3 w-1/2 rounded bg-shimmer animate-shimmer" />
                            <div className="h-2 w-3/4 rounded bg-shimmer animate-shimmer" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    if (!conversations.length) {
        return (
            <div className="flex flex-col items-center justify-center p-8 h-full text-center">
                <div className="bg-white/10 p-4 rounded-full mb-4 animate-float">
                    <MessageCircle className="h-8 w-8 text-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground">No chats yet</p>
                <p className="text-xs text-muted-foreground mt-1">Accept an invitation to start chatting.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col p-2 space-y-1 animate-fade-in">
            {conversations.map((conversation, idx) => {
                const other = getOtherParticipant(conversation);
                const isActive = activeConversation?._id === conversation._id;

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
                        <Avatar
                            src={other?.avatar}
                            name={other?.username || other?.email}
                            size="lg"
                            showStatus={true}
                            status={other?.status || "online"}
                        />
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <div className={cn(
                                    "truncate text-sm font-semibold",
                                    isActive ? "text-blue-900" : "text-slate-900"
                                )}>
                                    {other?.username || other?.email || "Unknown user"}
                                </div>
                            </div>
                            <div className={cn(
                                "truncate text-xs",
                                isActive ? "text-blue-700 font-medium" : "text-slate-500"
                            )}>
                                {conversation.lastMessage?.text || "No messages yet"}
                            </div>
                        </div>
                    </button>
                );
            })}
        </div>
    );
};

export default ConversationList;
