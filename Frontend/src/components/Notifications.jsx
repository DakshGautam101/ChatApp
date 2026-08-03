import React, { useEffect, useState } from "react";
import { socket } from "../lib/socket";

export default function Notifications() {
    const [items, setItems] = useState([]);

    useEffect(() => {
        function onInvitation(data) {
            setItems((s) => [{ type: "invitation", ...data, id: Date.now() }, ...s]);
        }

        function onNotification(data) {
            setItems((s) => [{ type: "notification", ...data, id: Date.now() }, ...s]);
        }

        socket.on("invitation:created", onInvitation);
        socket.on("notification:new", onNotification);
        socket.on("invitation:statusChanged", (d) => {
            setItems((s) => [{ type: "status", ...d, id: Date.now() }, ...s]);
        });

        return () => {
            socket.off("invitation:created", onInvitation);
            socket.off("notification:new", onNotification);
            socket.off("invitation:statusChanged");
        };
    }, []);

    if (!items.length) return null;

    return (
        <div className="fixed right-4 top-16 w-80 z-50">
            <div className="space-y-2">
                {items.map((it) => (
                    <div key={it.id} className="p-3 bg-white shadow rounded">
                        <div className="text-sm font-medium">
                            {it.type === "invitation" && `Invitation from ${it.from}`}
                            {it.type === "notification" && `Notification: ${it.message || JSON.stringify(it)}`}
                            {it.type === "status" && `Invitation ${it.status} by ${it.by}`}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
