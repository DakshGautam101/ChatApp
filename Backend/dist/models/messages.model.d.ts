import mongoose, { Types } from "mongoose";
import type { MessagInterface } from "../Interfaces/BacknedInterfaces.js";
declare const Message: mongoose.Model<MessagInterface, {}, {}, {}, mongoose.Document<unknown, {}, MessagInterface, {}, mongoose.DefaultSchemaOptions> & MessagInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, MessagInterface>;
export default Message;
//# sourceMappingURL=messages.model.d.ts.map