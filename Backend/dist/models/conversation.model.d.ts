import mongoose, { Types } from "mongoose";
type LastMessage = {
    text: string;
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
};
export interface ConversationInterface {
    type: 'private' | 'group';
    name?: string;
    avatarUrl?: string;
    isConvertedFromGroup?: boolean;
    formerGroupName?: string;
    createdBy?: Types.ObjectId;
    participants: ParticipantInterface[];
    lastMessage: LastMessage | null;
    uploadStatus?: 'pending' | 'completed' | 'failed';
}
export interface ParticipantInterface {
    user: Types.ObjectId | string;
    role: "admin" | "member";
    isOwner?: boolean;
    lastReadMessageId?: Types.ObjectId | null;
    muted?: boolean;
    joinedAt?: Date;
}
declare const Conversation: mongoose.Model<ConversationInterface, {}, {}, {}, mongoose.Document<unknown, {}, ConversationInterface, {}, mongoose.DefaultSchemaOptions> & ConversationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, ConversationInterface>;
export default Conversation;
//# sourceMappingURL=conversation.model.d.ts.map