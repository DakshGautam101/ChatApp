import mongoose, { Document, Types, type Date } from "mongoose";
export interface Invitation {
    sender: Types.ObjectId;
    receiver: Types.ObjectId;
    status: "pending" | "accepted" | "rejected";
    rejectedUntil: Date;
}
declare const Invitation: mongoose.Model<Invitation, {}, {}, {}, Document<unknown, {}, Invitation, {}, mongoose.DefaultSchemaOptions> & Invitation & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, Invitation>;
export default Invitation;
//# sourceMappingURL=invitation.model.d.ts.map