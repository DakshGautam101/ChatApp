import mongoose, { Types } from "mongoose";

export interface UploadSessionInterface{
    uploadId : string,
    uploader : Types.ObjectId,
    conversation : Types.ObjectId,
    filename : string
    mimetype ?: string | null
    size ?: number
    status : 'uploading'| 'interrupted' | 'completed' | 'failed'
    attempts ?: number
    url ?: string | null
}


const uploadSessionSchema = new mongoose.Schema<UploadSessionInterface>(
    {
        uploadId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        uploader: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            default: null,
        },
        filename: {
            type: String,
            required: true,
        },
        mimetype: {
            type: String,
            default: null,
        },
        size: {
            type: Number,
            default: null,
        },
        status: {
            type: String,
            enum: ["uploading", "interrupted", "completed", "failed"],
            default: "uploading",
        },
        attempts: {
            type: Number,
            default: 1,
        },
        url: {
            type: String,
            default: null,
        },
    },
    { timestamps: true }
);

uploadSessionSchema.index({ uploader: 1, status: 1 });

const UploadSession = mongoose.model<UploadSessionInterface>("UploadSession", uploadSessionSchema);
export default UploadSession;
