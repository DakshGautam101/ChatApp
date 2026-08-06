import React, { useState } from 'react'
import useAuthStore from '../Stores/useAuthStore'
import { MessageSquare, Power, UserPlus, Users, MessagesSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import UserList from '../components/UserList';
import Notifications from '../components/Notifications';
import Invitation from '../components/Invitation';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import useChatStore from '../Stores/useChatStore';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardPage = () => {

    const { user, logout } = useAuthStore();
    const { activeConversation, closeConversation } = useChatStore();
    const [mobileTab, setMobileTab] = useState("chats");

    const handleLogout = async () => {
        try {
            await logout();
            window.location.href = "/login";
        } catch (error) {
            toast.error(error?.response?.data?.message || "Couldn't log out. Please try again.");
        }
    }

    const initials = (user?.username || user?.email || "U")
        .trim()
        .charAt(0)
        .toUpperCase();

    return (
        <div className="flex h-screen flex-col bg-background overflow-hidden">
            <motion.header 
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="sticky top-0 z-40 border-b border-white/10 glass shadow-sm"
            >
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-foreground shadow-lg animate-float">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-lg font-bold leading-tight text-gradient">Chat App</p>
                            <p className="text-xs font-medium leading-tight text-muted-foreground">
                                {user?.username || "Welcome"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold shadow-inner border-2 border-transparent bg-clip-padding relative z-10">
                                {initials}
                            </div>
                            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-white/70 border-2 border-background z-20"></div>
                        </div>
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-border/50 hover:bg-white/10 hover:text-foreground hover:border-white/20 transition-all"
                        >
                            <Power className="h-4 w-4" />
                            <span className="hidden sm:inline font-medium">Log out</span>
                        </Button>
                    </div>
                </div>
            </motion.header>

            {/* Mobile tab switcher */}
            <div className="flex border-b border-border/50 glass-subtle lg:hidden relative z-30">
                {[
                    { key: "people", label: "People", icon: Users },
                    { key: "invitations", label: "Invitations", icon: UserPlus },
                    { key: "chats", label: "Chats", icon: MessagesSquare },
                ].map(({ key, label, icon: Icon }) => (
                    <button
                        key={key}
                        onClick={() => setMobileTab(key)}
                        className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${mobileTab === key
                            ? "text-primary"
                            : "text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        <Icon className="h-5 w-5" />
                        {label}
                        {mobileTab === key && (
                            <motion.div 
                                layoutId="mobile-tab-indicator"
                                className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Desktop tab switcher */}
            <div className="hidden border-b border-border/50 glass-subtle lg:flex relative z-30">
                <div className="mx-auto flex w-full max-w-6xl px-6">
                    {[
                        { key: "people", label: "People", icon: Users },
                        { key: "invitations", label: "Invitations", icon: UserPlus },
                        { key: "chats", label: "Chats", icon: MessagesSquare },
                    ].map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setMobileTab(key)}
                            className={`relative flex items-center gap-2 px-6 py-4 text-sm font-medium transition-colors ${mobileTab === key
                                ? "text-foreground"
                                : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            {label}
                            {mobileTab === key && (
                                <motion.div 
                                    layoutId="desktop-tab-indicator"
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                                />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <main className="mx-auto flex flex-1 min-h-0 w-full max-w-6xl flex-col px-4 py-6 sm:px-6 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {mobileTab === "people" && (
                        <motion.section 
                            key="people"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 min-h-0"
                        >
                            <UserList />
                        </motion.section>
                    )}

                    {mobileTab === "invitations" && (
                        <motion.section 
                            key="invitations"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 min-h-0"
                        >
                            <Invitation />
                        </motion.section>
                    )}

                    {mobileTab === "chats" && (
                        <motion.section
                            key="chats"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 min-h-0 grid overflow-hidden rounded-2xl border border-white/10 glass-subtle shadow-xl lg:grid-cols-[320px_1fr]"
                        >
                            <div
                                className={`
                                    ${activeConversation ? "hidden" : "block"}
                                    lg:block
                                    border-r
                                    border-black/25
                                    overflow-y-auto
                                    min-h-0
                                    bg-background/40
                                `}
                            >
                                <ConversationList />
                            </div>
                            <div
                                className={`
                                    flex
                                    flex-col
                                    flex-1
                                    min-h-0
                                    overflow-hidden
                                    relative
                                    ${activeConversation ? "block lg:flex" : "hidden"}
                                `}
                            >
                                {activeConversation && (
                                    <button
                                        onClick={closeConversation}
                                        className="border-b border-border/50 glass-subtle p-3 text-sm font-medium text-muted-foreground hover:text-foreground lg:hidden flex items-center gap-2"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                        Back to conversations
                                    </button>
                                )}
                                <ChatWindow />
                            </div>
                        </motion.section>
                    )}
                </AnimatePresence>
            </main>

            <Notifications />
        </div>
    )
}

export default DashboardPage