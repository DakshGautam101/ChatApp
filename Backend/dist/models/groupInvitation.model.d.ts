import mongoose, { Types } from "mongoose";
import type { GroupInvitationInterface } from "../Interfaces/BacknedInterfaces.js";
declare const GroupInvitation: mongoose.Model<GroupInvitationInterface, {}, {}, {}, mongoose.Document<unknown, {}, GroupInvitationInterface, {}, mongoose.DefaultSchemaOptions> & GroupInvitationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, GroupInvitationInterface>;
export default GroupInvitation;
//# sourceMappingURL=groupInvitation.model.d.ts.map