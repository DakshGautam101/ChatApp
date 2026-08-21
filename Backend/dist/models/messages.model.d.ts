import mongoose, { Types } from "mongoose";
export interface AttachmentInterface {
    url: string;
    fileType: string;
    size: number;
    name: string;
}
type DeliveredToType = {
    user: Types.ObjectId;
    deliveredAt: Date;
};
type ReadByType = {
    user: Types.ObjectId;
    readAt: Date;
};
type ReactionType = {
    user: Types.ObjectId;
    tpye: string;
};
export interface MessagInterface {
    conversation: Types.ObjectId;
    sender: Types.ObjectId;
    content: string;
    status: 'sent' | 'delivered' | 'read';
    deliveredTo?: DeliveredToType;
    readBy?: ReadByType;
    attachments?: AttachmentInterface;
    reactions?: ReactionType;
}
declare const Message: mongoose.Model<MessagInterface, {}, {}, {}, mongoose.Document<unknown, {}, MessagInterface, {}, mongoose.DefaultSchemaOptions> & MessagInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, MessagInterface>;
export default Message;
//# sourceMappingURL=messages.model.d.ts.map