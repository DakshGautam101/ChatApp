import type { AttachmentInterface } from "./AttachmentInterface";
import type { UserInterface } from "./UserInterface";

export interface MessageReactionInterface {
    emoji?: string;
    reaction?: string;
    user?: UserInterface | string | any;
    userId?: string;
    users?: (UserInterface | string | any)[];
    count?: number;
    type ?: string;
}

export interface MessageInterface {
    _id?: string;
    _tempId?: string;
    id?: string;
    senderId?: string;
    sender?: UserInterface | string | any;
    text?: string;
    content?: string;
    conversation?: any;
    conversationId?: string;
    attachments?: AttachmentInterface[];
    reactions?: (MessageReactionInterface | string | any)[];
    createdAt?: string | Date;
    updatedAt?: string | Date;
    status?: "delivered" | "seen" | "sent" | string;
    isOptimistic?: boolean;
    seenBy?: (UserInterface | string | any)[];
    deliveredTo?: (UserInterface | string | any)[];
}