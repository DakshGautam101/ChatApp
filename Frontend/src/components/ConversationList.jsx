import React, { useEffect } from 'react'
import useAuthStore from '../Stores/useAuthStore'
import useChatStore from '../Stores/useChatStore';
import { cn } from '../lib/utils';
import { MessageCircle } from 'lucide-react';
import { motion } from 'framer-motion';

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

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 10, scale: 0.95 },
        show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <motion.div 
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col p-2 space-y-1"
        >
            {conversations.map((conversation) => {
                const other = getOtherParticipant(conversation);
                const isActive = activeConversation?._id === conversation._id;
                const initials = (other?.username || other?.email || "U").trim().charAt(0).toUpperCase();

                return (
                    <motion.button
                        variants={item}
                        key={conversation._id}
                        onClick={() => openConversation(conversation)}
                        className={cn(
                            "group flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-200 border border-transparent",
                            isActive 
                                ? "bg-white/10 border-white/20 shadow-sm" 
                                : "hover:bg-muted/60 hover:border-border/50"
                        )}
                        whileHover={{ scale: 0.98 }}
                        whileTap={{ scale: 0.95 }}
                    >
                        <div className="relative shrink-0">
                            <div className={cn(
                                "flex h-12 w-12 items-center justify-center rounded-full text-lg font-bold shadow-inner transition-colors",
                                isActive 
                                    ? "bg-white/10 text-foreground" 
                                    : "bg-secondary text-foreground group-hover:bg-white/15 group-hover:text-foreground"
                            )}>
                                {initials}
                            </div>
                            <div className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-white/70 border-2 border-background z-10"></div>
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex justify-between items-baseline mb-0.5">
                                <div className={cn(
                                    "truncate font-semibold text-sm",
                                    isActive ? "text-foreground" : "text-foreground"
                                )}>
                                    {other?.username || other?.email || "Unknown user"}
                                </div>
                            </div>
                            <div className={cn(
                                "truncate text-xs",
                                isActive ? "text-foreground/80 font-medium" : "text-muted-foreground"
                            )}>
                                {conversation.lastMessage?.text || "No messages yet"}
                            </div>
                        </div>
                    </motion.button>
                );
            })}
        </motion.div>
    )
}

export default ConversationList
