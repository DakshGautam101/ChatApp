import mongoose, { Types } from "mongoose";


export interface NotificationInterface{
    recipient : Types.ObjectId,
    sender : Types.ObjectId,
    type : 'message' | 'invitation' | 'group_invitation' | 'system' | 'notification',
    title : string | null,
    message : string,
    conversation ?: Types.ObjectId,
    invitation ?: Types.ObjectId,
    isRead : boolean
}

const notificationSchema = new mongoose.Schema<NotificationInterface>(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        type: {
            type: String,
            enum: ["message", "invitation", "group_invitation", "system"],
            default: "notification",
        },
        title: {
            type: String,
            default: "",
        },
        message: {
            type: String,
            required: true,
        },
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
            default: null,
        },
        invitation: {
            type: mongoose.Schema.Types.ObjectId,
            default: null,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);

const Notification = mongoose.model<NotificationInterface>("Notification", notificationSchema);

export default Notification;
