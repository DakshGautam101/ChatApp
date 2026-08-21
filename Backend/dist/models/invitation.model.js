import mongoose, { Document, Types } from "mongoose";
const invitationSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    rejectedUntil: {
        type: Date,
    }
}, { timestamps: true });
const Invitation = mongoose.model('Invitation', invitationSchema);
export default Invitation;
//# sourceMappingURL=invitation.model.js.map