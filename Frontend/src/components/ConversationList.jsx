import React, { useEffect } from 'react'
import useAuthStore from '../Stores/useAuthStore'
import useChatStore from '../Stores/useChatStore';
import { cn } from '../lib/utils';
import { MessageCircle } from 'lucide-react';

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
        return <div className="p-4 text-sm text-muted-foreground">Loading conversations...</div>;
    }

    if (!conversations.length) {
        return (
            <div className="p-6 text-center text-sm text-muted-foreground">
                No conversations yet. Accept an invitation to start chatting.
            </div>
        );
    }

    return (
        <>
            <div className="flex flex-col">
                {conversations.map((conversation) => {
                    const other = getOtherParticipant(conversation);
                    const isActive = activeConversation?._id === conversation._id;

                    return (
                        <button
                            key={conversation._id}
                            onClick={() => openConversation(conversation)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted",
                                isActive && "bg-muted"
                            )}
                        >
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                <MessageCircle className="h-5 w-5" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="truncate font-medium">
                                    {other?.username || other?.email || "Unknown user"}
                                </div>
                                <div className="truncate text-sm text-muted-foreground">
                                    {conversation.lastMessage?.text || "No messages yet"}
                                </div>
                            </div>
                        </button>
                    );
                })}
            </div>
        </>
    )
}

export default ConversationList
