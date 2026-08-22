import mongoose, { Types } from "mongoose";
import type { NotificationInterface } from "../Interfaces/BacknedInterfaces.js";
declare const Notification: mongoose.Model<NotificationInterface, {}, {}, {}, mongoose.Document<unknown, {}, NotificationInterface, {}, mongoose.DefaultSchemaOptions> & NotificationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, NotificationInterface>;
export default Notification;
//# sourceMappingURL=notification.model.d.ts.map