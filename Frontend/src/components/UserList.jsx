import React, { useEffect, useState } from "react";
import useAuthStore from "../Stores/useAuthStore";
import { axiosInstance } from "../lib/axiosInstance";
import { Button } from "./ui/button";

export default function UserList() {
    const { user } = useAuthStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sending, setSending] = useState({});

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        axiosInstance
            .get("/user/userlist")
            .then((res) => {
                if (!mounted) return;
                setUsers(res.data.data || []);
            })
            .catch((err) => console.error(err))
            .finally(() => mounted && setLoading(false));

        return () => (mounted = false);
    }, []);

    const sendInvitation = async (targetId) => {
        if (!targetId) return;
        setSending((s) => ({ ...s, [targetId]: true }));
        try {
            await axiosInstance.post(`/invitation/send/${targetId}`);
        } catch (err) {
            console.error("send invitation error", err.response || err.message || err);
        } finally {
            setSending((s) => ({ ...s, [targetId]: false }));
        }
    };

    if (loading) return <div>Loading users...</div>;

    return (
        <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Users</h2>
            <ul className="space-y-2">
                {users
                    .filter((u) => u._id !== user?._id)
                    .map((u) => (
                        <li
                            key={u._id}
                            className="flex items-center justify-between p-2 border rounded"
                        >
                            <div>
                                <div className="font-medium">{u.username || u.email}</div>
                                <div className="text-sm text-gray-500">{u.email}</div>
                            </div>

                            <Button
                                disabled={!!sending[u._id]}
                                onClick={() => sendInvitation(u._id)}
                            >
                                {sending[u._id] ? "Sending..." : "Send Invitation"}
                            </Button>
                        </li>
                    ))}
            </ul>
        </div>
    );
}


