import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    fileType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
}, 
{ _id: false });

const messageSchema = new mongoose.Schema({
    conversation: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        trim: true,
        default: "",
    },
    status: {
        type: String,
        enum: ['sent', 'delivered', 'read'],
        default: 'sent',
    },
    attachments: [attachmentSchema],
    reactions: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            type: { type: String, default: 'like' }
        }
    ],
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model("Message", messageSchema);
export default Message;