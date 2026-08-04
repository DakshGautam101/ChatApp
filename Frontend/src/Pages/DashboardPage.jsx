import React, { useState } from 'react'
import useAuthStore from '../Stores/useAuthStore'
import { MessageSquare, Power, UserPlus, Users } from 'lucide-react';
import { Button } from '../components/ui/button';
import UserList from '../components/UserList';
import Notifications from '../components/Notifications';
import Invitation from '../components/Invitation';
import toast from 'react-hot-toast';

const DashboardPage = () => {

    const { user, logout } = useAuthStore();
    const [mobileTab, setMobileTab] = useState("people");

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
        <div className="flex min-h-screen flex-col bg-background">
            <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur animate-in fade-in-down duration-500">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-sm font-semibold leading-tight">Chat App</p>
                            <p className="text-xs leading-tight text-muted-foreground">
                                {user?.username || "Welcome"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-secondary text-sm font-semibold">
                            {initials}
                        </div>
                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            size="sm"
                            className="gap-1.5"
                        >
                            <Power className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Log out</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Mobile tab switcher */}
            <div className="flex border-b border-border lg:hidden">
                <button
                    onClick={() => setMobileTab("people")}
                    className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-sm font-medium transition-colors ${mobileTab === "people"
                            ? "border-foreground text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <Users className="h-4 w-4" />
                    People
                </button>
                <button
                    onClick={() => setMobileTab("invitations")}
                    className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-3 text-sm font-medium transition-colors ${mobileTab === "invitations"
                            ? "border-foreground text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                >
                    <UserPlus className="h-4 w-4" />
                    Invitations
                </button>
            </div>

            <main className="mx-auto grid w-full max-w-6xl flex-1 gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[340px_1fr]">
                <section className={`${mobileTab === "people" ? "block" : "hidden"} lg:block animate-in fade-in-up duration-500`}>
                    <UserList />
                </section>

                <section className={`${mobileTab === "invitations" ? "block" : "hidden"} lg:block animate-in fade-in-up duration-500 delay-100`}>
                    <Invitation />
                </section>
            </main>

            <Notifications />
        </div>
    )
}

export default DashboardPage