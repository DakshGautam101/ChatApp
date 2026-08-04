// import mongoose from "mongoose";

// const messageStatusSchema = new mongoose.Schema({
//     message: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'Message',
//         required: true,
//     },
//     user: {
//         type: mongoose.Schema.Types.ObjectId,
//         ref: 'User',
//         required: true,
//     },
//     status: {
//         type: String,
//         enum: ['sent', 'delivered', 'read'],
//         default: 'sent',
//     },
//     deliveredAt: {
//         type: Date,
//         default: null,
//     },
//     readAt: {
//         type: Date,
//         default: null,
//     },
// }, { timestamps: true });

// messageStatusSchema.index({ message: 1, user: 1 }, { unique: true });
// messageStatusSchema.index({ user: 1, status: 1 });

// const MessageStatus = mongoose.model("MessageStatus", messageStatusSchema);
// export default MessageStatus;