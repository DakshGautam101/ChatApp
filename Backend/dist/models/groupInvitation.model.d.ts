import mongoose, { Types } from "mongoose";
export interface GroupInvitationInterface {
    group: Types.ObjectId;
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    status: "pending" | "accepted" | "rejected";
}
declare const GroupInvitation: mongoose.Model<GroupInvitationInterface, {}, {}, {}, mongoose.Document<unknown, {}, GroupInvitationInterface, {}, mongoose.DefaultSchemaOptions> & GroupInvitationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, GroupInvitationInterface>;
export default GroupInvitation;
//# sourceMappingURL=groupInvitation.model.d.ts.map