import mongoose, { Document, Types } from "mongoose";
import type { InvitationInterface } from "../Interfaces/BacknedInterfaces.js";
declare const Invitation: mongoose.Model<InvitationInterface, {}, {}, {}, Document<unknown, {}, InvitationInterface, {}, mongoose.DefaultSchemaOptions> & InvitationInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, InvitationInterface>;
export default Invitation;
//# sourceMappingURL=invitation.model.d.ts.map