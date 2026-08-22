import mongoose, { Document, Types } from "mongoose";
import type { Invitation } from "../Interfaces/BacknedInterfaces.js";
declare const Invitation: mongoose.Model<Invitation, {}, {}, {}, Document<unknown, {}, Invitation, {}, mongoose.DefaultSchemaOptions> & Invitation & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, Invitation>;
export default Invitation;
//# sourceMappingURL=invitation.model.d.ts.map