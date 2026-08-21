import mongoose, { Types } from "mongoose";
const groupInvitationSchema = new mongoose.Schema({
    group: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Conversation',
        required: true,
    },
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
}, {
    timestamps: true,
});
groupInvitationSchema.index({
    group: 1,
    receiver: 1,
    status: 1
});
const GroupInvitation = mongoose.model('GroupInvitation', groupInvitationSchema);
export default GroupInvitation;
//# sourceMappingURL=groupInvitation.model.js.map