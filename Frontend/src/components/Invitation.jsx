import { useEffect, useState } from "react";
import { axiosInstance } from "../lib/axiosInstance";
import { socket } from "../lib/socket";
import { Button } from "./ui/button";
import toast from "react-hot-toast";

export default function Invitation() {
    const [received, setReceived] = useState([]);
    const [sent, setSent] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchInvitations = async () => {
        try {
            const res = await axiosInstance.get("/invitation/invitation");

            setReceived(res.data.received);
            setSent(res.data.sent);
        } catch (err) {
            toast.error("Unable to load invitations");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvitations();
    }, []);

    useEffect(() => {
        if (!socket) return;

        socket.on("invitation:created", () => {
            toast.success("You received a new invitation");
            fetchInvitations();
        });

        socket.on("invitation:statusChanged", (data) => {
            toast.success(`Invitation ${data.status}`);
            fetchInvitations();
        });

        return () => {
            socket.off("invitation:created");
            socket.off("invitation:statusChanged");
        };
    }, [socket]);

    const updateStatus = async (id, status) => {
        try {
            await axiosInstance.patch(
                `/invitation/${id}?invitationStatus=${status}`
            );

            toast.success(
                status === "accepted"
                    ? "Invitation accepted"
                    : "Invitation rejected"
            );

            fetchInvitations();
        } catch (err) {
            toast.error(err.response?.data?.message || "Something went wrong");
        }
    };

    if (loading) return <p>Loading...</p>;

    return (
        <div className="space-y-8">

            <div>
                <h2 className="text-xl font-bold mb-4">
                    Received Invitations
                </h2>

                {received.length === 0 ? (
                    <p className="text-gray-500">
                        No invitations
                    </p>
                ) : (
                    <div className="space-y-3">
                        {received.map((invite) => (
                            <div
                                key={invite._id}
                                className="border rounded-lg p-4 flex justify-between items-center"
                            >
                                <div>
                                    <p className="font-semibold">
                                        {invite.sender.username}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        {invite.sender.email}
                                    </p>

                                    <p className="text-sm mt-2">
                                        Status :
                                        <span className="font-semibold ml-1">
                                            {invite.status}
                                        </span>
                                    </p>
                                </div>

                                {invite.status === "pending" && (
                                    <div className="flex gap-2">
                                        <Button
                                            onClick={() =>
                                                updateStatus(
                                                    invite._id,
                                                    "accepted"
                                                )
                                            }
                                        >
                                            Accept
                                        </Button>

                                        <Button
                                            variant="destructive"
                                            onClick={() =>
                                                updateStatus(
                                                    invite._id,
                                                    "rejected"
                                                )
                                            }
                                        >
                                            Reject
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div>
                <h2 className="text-xl font-bold mb-4">
                    Sent Invitations
                </h2>

                {sent.length === 0 ? (
                    <p className="text-gray-500">
                        No invitations sent
                    </p>
                ) : (
                    <div className="space-y-3">
                        {sent.map((invite) => (
                            <div
                                key={invite._id}
                                className="border rounded-lg p-4 flex justify-between"
                            >
                                <div>
                                    <p className="font-semibold">
                                        {invite.receiver.username}
                                    </p>

                                    <p className="text-sm text-gray-500">
                                        {invite.receiver.email}
                                    </p>
                                </div>

                                <div>
                                    {invite.status === "pending" && (
                                        <span className="text-yellow-600 font-semibold">
                                            Pending
                                        </span>
                                    )}

                                    {invite.status === "accepted" && (
                                        <span className="text-green-600 font-semibold">
                                            Accepted
                                        </span>
                                    )}

                                    {invite.status === "rejected" && (
                                        <span className="text-red-600 font-semibold">
                                            Rejected
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

        </div>
    );
} 