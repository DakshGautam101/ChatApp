import mongoose, { Types } from "mongoose";
import type { UserInterface } from "../Interfaces/BacknedInterfaces.js";
declare const User: mongoose.Model<UserInterface, {}, {}, {}, mongoose.Document<unknown, {}, UserInterface, {}, mongoose.DefaultSchemaOptions> & UserInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, UserInterface>;
export default User;
//# sourceMappingURL=user.model.d.ts.map