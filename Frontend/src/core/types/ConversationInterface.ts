import type { MessageInterface } from "./MessageInterface";
import type { UserInterface } from "./UserInterface";

export interface ParticipantInterface {
    user?: UserInterface | any;
    role?: "admin" | "member" | string;
    joinedAt?: string | Date;
}

export interface ConversationLastMessage {
    _id?: string;
    text?: string;
    content?: string;
    sender?: UserInterface | string | any;
    at?: string | Date;
    createdAt?: string | Date;
}

export interface ConversationInterface {
    _id: string;
    id?: string;
    type: "private" | "group" | string;
    participants: (ParticipantInterface | UserInterface | any)[];
    name?: string;
    avatar?: string;
    createdAt?: string | Date;
    updatedAt?: string | Date;
    lastMessage?: ConversationLastMessage | MessageInterface | any;
    unreadCount?: number;
    admins?: (UserInterface | string | any)[];
    createdBy?: UserInterface | string | any;
    isConvertedFromGroup : boolean;
    formerGroupName ?: string
}