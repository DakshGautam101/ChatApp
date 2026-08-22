import mongoose, { Types } from "mongoose";
import type { ConversationInterface } from "../Interfaces/BacknedInterfaces.js";
declare const Conversation: mongoose.Model<ConversationInterface, {}, {}, {}, mongoose.Document<unknown, {}, ConversationInterface, {}, mongoose.DefaultSchemaOptions> & ConversationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, ConversationInterface>;
export default Conversation;
//# sourceMappingURL=conversation.model.d.ts.map