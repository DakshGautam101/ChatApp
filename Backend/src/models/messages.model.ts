import mongoose, { Types } from "mongoose";

export interface AttachmentInterface{
    url : string,
    fileType : string,
    size : number,
    name : string
}

type DeliveredToType = {
    user : Types.ObjectId,
    deliveredAt : Date
}

type ReadByType = {
    user : Types.ObjectId,
    readAt : Date
}

type ReactionType={
    user : Types.ObjectId,
    tpye : string
}


export interface MessagInterface{
    conversation : Types.ObjectId,
    sender : Types.ObjectId,
    content : string,
    status : 'sent'|'delivered'|'read',
    deliveredTo ?: DeliveredToType,
    readBy ?: ReadByType,
    attachments ?: AttachmentInterface,
    reactions ?: ReactionType
}

const attachmentSchema = new mongoose.Schema<AttachmentInterface>({
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
    deliveredTo: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },

            deliveredAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    readBy: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },

            readAt: {
                type: Date,
                default: Date.now
            }
        }
    ],
    attachments: [attachmentSchema],
    reactions: [
        {
            user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            type: { type: String, default: 'like' }
        }
    ],
}, { timestamps: true });

messageSchema.index({ conversation: 1, createdAt: -1 });

const Message = mongoose.model<MessagInterface>("Message", messageSchema);
export default Message;