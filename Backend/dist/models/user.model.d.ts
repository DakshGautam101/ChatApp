import mongoose, { Types } from "mongoose";
export interface UserInterface {
    username: string;
    email: string;
    password?: string;
    phone: string;
    avatar?: string | null;
    status?: "online" | "offline";
    blockedUsers?: Types.ObjectId[];
    friends?: Types.ObjectId[];
    invitations?: Types.ObjectId[];
    isVerified?: boolean;
    isDeleted?: boolean;
    tokenVersion?: number;
}
declare const User: mongoose.Model<UserInterface, {}, {}, {}, mongoose.Document<unknown, {}, UserInterface, {}, mongoose.DefaultSchemaOptions> & UserInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, UserInterface>;
export default User;
//# sourceMappingURL=user.model.d.ts.map