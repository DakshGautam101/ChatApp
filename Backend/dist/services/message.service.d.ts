import { Types } from "mongoose";
import type { GetMessagesResult, SendMessageParams } from "../Interfaces/BacknedInterfaces.js";
export declare const sendMessageService: ({ userId, conversationId, content, attachments, }: SendMessageParams) => Promise<import("mongoose").PopulateDocumentResult<import("mongoose").Document<unknown, {}, import("../Interfaces/BacknedInterfaces.js").MessagInterface, {}, import("mongoose").DefaultSchemaOptions> & import("../Interfaces/BacknedInterfaces.js").MessagInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, {}, import("../Interfaces/BacknedInterfaces.js").MessagInterface, import("../Interfaces/BacknedInterfaces.js").MessagInterface>>;
export declare const getMessagesService: (conversationId?: string | Types.ObjectId, before?: string | Date, userId?: string | Types.ObjectId) => Promise<GetMessagesResult>;
export declare const getConversationsService: (userId: string | Types.ObjectId) => Promise<any[]>;
//# sourceMappingURL=message.service.d.ts.map