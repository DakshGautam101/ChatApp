import mongoose, { Types } from "mongoose";
export interface NotificationInterface {
    recipient: Types.ObjectId;
    sender: Types.ObjectId;
    type: 'message' | 'invitation' | 'group_invitation' | 'system' | 'notification';
    title: string | null;
    message: string;
    conversation?: Types.ObjectId;
    invitation?: Types.ObjectId;
    isRead: boolean;
}
declare const Notification: mongoose.Model<NotificationInterface, {}, {}, {}, mongoose.Document<unknown, {}, NotificationInterface, {}, mongoose.DefaultSchemaOptions> & NotificationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, NotificationInterface>;
export default Notification;
//# sourceMappingURL=notification.model.d.ts.map