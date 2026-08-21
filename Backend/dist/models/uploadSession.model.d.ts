import mongoose, { Types } from "mongoose";
export interface UploadSessionInterface {
    uploadId: string;
    uploader: Types.ObjectId;
    conversation: Types.ObjectId;
    filename: string;
    mimetype?: string | null;
    size?: number;
    status: 'uploading' | 'interrupted' | 'completed' | 'failed';
    attempts?: number;
    url?: string | null;
}
declare const UploadSession: mongoose.Model<UploadSessionInterface, {}, {}, {}, mongoose.Document<unknown, {}, UploadSessionInterface, {}, mongoose.DefaultSchemaOptions> & UploadSessionInterface & {
    _id: Types.ObjectId;
} & {
    __v: number;
} & {
    id: string;
}, any, UploadSessionInterface>;
export default UploadSession;
//# sourceMappingURL=uploadSession.model.d.ts.map