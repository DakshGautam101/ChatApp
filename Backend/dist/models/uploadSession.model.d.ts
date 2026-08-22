import mongoose, { Types } from "mongoose";
import type { UploadSessionInterface } from "../Interfaces/BacknedInterfaces.js";
declare const UploadSession: mongoose.Model<UploadSessionInterface, {}, {}, {}, mongoose.Document<unknown, {}, UploadSessionInterface, {}, mongoose.DefaultSchemaOptions> & UploadSessionInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, UploadSessionInterface>;
export default UploadSession;
//# sourceMappingURL=uploadSession.model.d.ts.map