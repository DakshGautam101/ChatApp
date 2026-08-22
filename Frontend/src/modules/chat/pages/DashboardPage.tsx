import  { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, useParams} from 'react-router-dom';
import useAuthStore from '@/modules/auth/stores/useAuthStore';
import { MessageSquare, Power, UserPlus, Users, MessagesSquare, Camera, Trash2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/core/components/ui/dialog";
import Avatar from '@/core/components/Avatar';
import ThemeSelector from '@/core/components/ThemeSelector';
import UserList from '@/modules/user/components/UserList';
import NotificationDropdown from '@/modules/notifications/components/NotificationDropdown';
import Invitation from '@/modules/invitation/components/Invitation';
import ConversationList from '../components/ConversationList';
import ChatWindow from '../components/ChatWindow';
import useChatStore from '../stores/useChatStore';
import { axiosInstance } from '@/core/api/axiosInstance';
import { socket } from '@/core/socket/socket';
import toast from 'react-hot-toast';


const DashboardPage = () => {
    const { user, logout, updateProfile } = useAuthStore();
    const activeConversation = useChatStore((state) => state.activeConversation);
    const closeConversation = useChatStore((state) => state.closeConversation);
    const totalUnreadMessages = useChatStore((state) =>
        state.conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)
    );
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
    const fileInputRef = useRef(null);

    const location = useLocation();
    const navigate = useNavigate();
    const params = useParams();

    const activeTab = location.pathname.startsWith("/people")
        ? "people"
        : location.pathname.startsWith("/invitations")
            ? "invitations"
            : "chats";

    // Auto select conversation if URL has :conversationId
    useEffect(() => {
        if (params.conversationId) {
            const { conversations, activeConversation, openConversation } = useChatStore.getState();
            if (activeConversation?._id !== params.conversationId && conversations.length > 0) {
                const found = conversations.find((c) => c._id === params.conversationId);
                if (found) {
                    openConversation(found);
                }
            }
        }
    }, [params.conversationId]);

    const fetchPendingCount = async () => {
        try {
            const [directRes, groupRes] = await Promise.all([
                axiosInstance.get("/invitation/invitation"),
                axiosInstance.get("/group/invitations"),
            ]);
            const received = Array.isArray(directRes.data?.received) ? directRes.data.received : [];
            const groupInvites = Array.isArray(groupRes.data?.invitations)
                ? groupRes.data.invitations
                : Array.isArray(groupRes.data?.data)
                    ? groupRes.data.data
                    : [];
            const pendingDirect = received.filter((i) => i?.status === "pending").length;
            const pendingGroup = groupInvites.filter((i) => i?.status === "pending").length;
            setPendingInvitationsCount(pendingDirect + pendingGroup);
        } catch (e) {
            // Ignore fetch error
        }
    };

    useEffect(() => {
        fetchPendingCount();
        if (!socket) return;

        socket.on("invitation:created", fetchPendingCount);
        socket.on("invitation:statusChanged", fetchPendingCount);
        socket.on("group:invitation", fetchPendingCount);
        socket.on("group:invitationStatusChanged", fetchPendingCount);

        return () => {
            socket.off("invitation:created", fetchPendingCount);
            socket.off("invitation:statusChanged", fetchPendingCount);
            socket.off("group:invitation", fetchPendingCount);
            socket.off("group:invitationStatusChanged", fetchPendingCount);
        };
    }, []);

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login", { replace: true });
        } catch (error) {
            toast.error(error?.response?.data?.message || "Couldn't log out. Please try again.");
        }
    };

    const handleAvatarChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("Please select an image file");
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File size should be less than 5MB");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        setIsUploading(true);
        try {
            const res = await axiosInstance.post("/upload/single", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const avatarUrl = res.data?.file?.url;
            if (avatarUrl) {
                await updateProfile({ avatar: avatarUrl });
                toast.success("Profile avatar updated successfully!");
            }
        } catch (err) {
            toast.error(err?.response?.data?.message || "Failed to update profile picture");
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = "";
        }
    };

    const handleRemoveAvatar = async () => {
        try {
            setIsUploading(true);
            await updateProfile({ avatar: "" });
            toast.success("Profile picture removed");
        } catch (err) {
            toast.error("Failed to remove profile picture");
        } finally {
            setIsUploading(false);
        }
    };

    const navItems = [
        { key: "people", path: "/people", label: "People", icon: Users },
        { key: "invitations", path: "/invitations", label: "Invitations", icon: UserPlus, badge: pendingInvitationsCount },
        { key: "chats", path: "/chats", label: "Chats", icon: MessagesSquare, badge: totalUnreadMessages },
    ];

    return (
        <div className="flex h-screen flex-col bg-base-200 text-base-content overflow-hidden">
            <header className="sticky top-0 z-40 border-b border-base-300 bg-base-100/90 backdrop-blur-md shadow-xs animate-fade-in-down">
                <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-content shadow-md shadow-primary/20">
                            <MessageSquare className="h-5 w-5" />
                        </div>
                        <div className="hidden sm:block">
                            <p className="text-lg font-bold leading-tight text-base-content">Chat App</p>
                            <p className="text-xs font-medium leading-tight text-base-content/70">
                                {user?.username || "Welcome"}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {/* Theme Selector Dropdown */}
                        <ThemeSelector />

                        {/* Notification Bell Dropdown */}
                        <NotificationDropdown
                            onNavigateTab={(tabKey) => navigate(`/${tabKey}`)}
                            pendingInvitationsCount={pendingInvitationsCount}
                        />

                        <div
                            onClick={() => setShowProfileModal(true)}
                            className="flex items-center gap-2 cursor-pointer group rounded-full p-1 hover:bg-base-200 transition-colors"
                            title="Click to view & update profile"
                        >
                            <Avatar
                                src={user?.avatar}
                                name={user?.username || user?.email}
                                size="md"
                                showStatus={true}
                                status="online"
                            />
                            <span className="hidden md:inline-block text-xs font-semibold text-base-content group-hover:text-primary">
                                {user?.username || "Profile"}
                            </span>
                        </div>

                        <Button
                            onClick={handleLogout}
                            variant="outline"
                            size="sm"
                            className="gap-1.5 border-base-300 hover:bg-base-200 text-base-content font-medium rounded-xl transition-all"
                        >
                            <Power className="h-4 w-4 opacity-70" />
                            <span className="hidden sm:inline">Log out</span>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Mobile tab switcher */}
            <div className="p-2 border-b border-base-300 bg-base-100 lg:hidden relative z-30">
                <div className="flex bg-base-200/80 p-1 rounded-xl">
                    {navItems.map(({ key, path, label, icon: Icon, badge }) => (
                        <button
                            key={key}
                            onClick={() => navigate(path)}
                            className={`flex flex-1 items-center justify-center gap-1.5 py-2 px-3 text-xs font-medium rounded-lg transition-all ${activeTab === key
                                ? "bg-base-100 text-primary shadow-xs font-bold"
                                : "text-base-content/70 hover:text-base-content"
                                }`}
                        >
                            <div className="relative flex items-center gap-1.5">
                                <Icon className="h-4 w-4" />
                                <span>{label}</span>
                                {badge > 0 && (
                                    <span className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full text-white ${key === "invitations" ? "bg-amber-500" : "bg-primary"}`}>
                                        {badge}
                                    </span>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Desktop tab switcher */}
            <div className="border-b border-base-300 bg-base-100 hidden lg:flex relative z-30">
                <div className="mx-auto flex w-full max-w-6xl px-6 py-2">
                    <div className="flex bg-base-200/80 p-1 rounded-xl">
                        {navItems.map(({ key, path, label, icon: Icon, badge }) => (
                            <button
                                key={key}
                                onClick={() => navigate(path)}
                                className={`flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === key
                                    ? "bg-base-100 text-primary shadow-xs font-bold"
                                    : "text-base-content/70 hover:text-base-content"
                                    }`}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{label}</span>
                                {badge > 0 && (
                                    <span className={`px-1.5 py-0.5 text-[10px] font-extrabold rounded-full text-white ${key === "invitations" ? "bg-amber-500" : "bg-primary"}`}>
                                        {badge}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <main className="mx-auto flex flex-1 min-h-0 w-full max-w-6xl flex-col px-4 py-6 sm:px-6 overflow-hidden relative">
                {activeTab === "people" && (
                    <section key="people" className="flex-1 min-h-0 animate-fade-in">
                        <UserList />
                    </section>
                )}

                {activeTab === "invitations" && (
                    <section key="invitations" className="flex-1 min-h-0 animate-fade-in">
                        <Invitation />
                    </section>
                )}

                {activeTab === "chats" && (
                    <section
                        key="chats"
                        className="flex-1 min-h-0 grid overflow-hidden rounded-2xl border border-base-300 bg-base-100 shadow-xl lg:grid-cols-[320px_1fr] animate-fade-in text-base-content"
                    >
                        <div
                            className={`
                                ${activeConversation ? "hidden" : "block"}
                                lg:block
                                border-r
                                border-base-300
                                overflow-y-auto
                                min-h-0
                                bg-base-200/40
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
                                    onClick={() => {
                                        closeConversation();
                                        navigate("/chats");
                                    }}
                                    className="border-b border-base-300 bg-base-100 p-3 text-sm font-medium text-base-content/70 hover:text-base-content lg:hidden flex items-center gap-2"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                                    Back to conversations
                                </button>
                            )}
                            <ChatWindow />
                        </div>
                    </section>
                )}
            </main>

            <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
                <DialogContent className="sm:max-w-md bg-base-100 text-base-content border-base-300">
                    <DialogHeader className="flex flex-col items-center justify-center text-center gap-1">
                        <DialogTitle className="text-xl font-bold text-base-content">Your Profile</DialogTitle>
                        <DialogDescription className="text-xs text-base-content/70">
                            Manage your account profile picture and details
                        </DialogDescription>
                    </DialogHeader>

                    <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarChange}
                    />

                    <div className="flex flex-col items-center gap-4 py-4">
                        <div className="relative group">
                            <Avatar
                                src={user?.avatar}
                                name={user?.username || user?.email}
                                size="2xl"
                            />
                            <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-content shadow-md hover:opacity-90 transition-all hover:scale-110 cursor-pointer"
                                title="Change profile picture"
                            >
                                <Camera className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={isUploading}
                                onClick={() => fileInputRef.current?.click()}
                                className="gap-2 border-base-300 hover:bg-base-200 text-base-content font-semibold"
                            >
                                {isUploading ? (
                                    <span className="loading loading-spinner loading-xs text-primary"></span>
                                ) : (
                                    <Camera className="h-4 w-4 text-primary" />
                                )}
                                {user?.avatar ? "Change Picture" : "Upload Picture"}
                            </Button>

                            {user?.avatar && (
                                <Button
                                    type="button"
                                    variant="ghost"
                                    size="sm"
                                    disabled={isUploading}
                                    onClick={handleRemoveAvatar}
                                    className="gap-1.5 text-xs text-error hover:bg-error/10 font-medium"
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Remove
                                </Button>
                            )}
                        </div>

                        <div className="w-full space-y-3 pt-4 border-t border-base-300">
                            <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-base-200/80 border border-base-300">
                                <span className="text-base-content/70 font-medium">Username</span>
                                <span className="text-base-content font-bold">{user?.username || "—"}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-base-200/80 border border-base-300">
                                <span className="text-base-content/70 font-medium">Email</span>
                                <span className="text-base-content font-semibold">{user?.email || "—"}</span>
                            </div>
                            {user?.phone && (
                                <div className="flex justify-between items-center text-sm p-3 rounded-xl bg-base-200/80 border border-base-300">
                                    <span className="text-base-content/70 font-medium">Phone</span>
                                    <span className="text-base-content font-semibold">{user.phone}</span>
                                </div>
                            )}
                        </div>

                        {/* Theme Customization */}
                        <div className="w-full pt-3 border-t border-base-300">
                            <ThemeSelector variant="inline" />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default DashboardPage;
