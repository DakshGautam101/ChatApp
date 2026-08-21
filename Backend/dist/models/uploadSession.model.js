import mongoose, { Types } from "mongoose";
const uploadSessionSchema = new mongoose.Schema({
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
}, { timestamps: true });
uploadSessionSchema.index({ uploader: 1, status: 1 });
const UploadSession = mongoose.model("UploadSession", uploadSessionSchema);
export default UploadSession;
//# sourceMappingURL=uploadSession.model.js.map