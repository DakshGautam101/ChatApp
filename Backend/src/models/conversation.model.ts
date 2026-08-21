import mongoose, { Types, type HydratedDocument } from "mongoose";
import type { ConversationInterface, ParticipantInterface } from "../Interfaces/BacknedInterfaces.js";



const participantSchema = new mongoose.Schema<ParticipantInterface>({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    role: {
        type: String,
        enum: ['admin', 'member'],
        default: 'member'
    },
    isOwner: {
        type: Boolean,
        default: false,
    },
    lastReadMessageId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message',
        default: null,
    },
    muted: {
        type: Boolean,
        default: false
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
},
    {
        _id: false,
    }
);


const conversationSchema = new mongoose.Schema<ConversationInterface>({
    type: {
        type: String,
        enum: ['private', 'group'],
        required: true
    },
    name: {
        type: String,
        default: null,
        trim: true,
        minLength: 3,
        maxLength: 50
    },
    avatarUrl: {
        type: String,
        default: null
    },
    isConvertedFromGroup: {
        type: Boolean,
        default: false,
    },
    formerGroupName: {
        type: String,
        default: null,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    participants: {
        type: [participantSchema],
        validate: {
            validator: function ( this: any, arr: ParticipantInterface[] ) {
                const uniqueUsers = new Set(
                    arr.map(p => p.user.toString())
                );

                if (uniqueUsers.size !== arr.length) {
                    return false;
                }

                if (this.type === "private") {
                    return arr.length === 2;
                }

                return arr.length >= 2;
            }
        },
    },
    lastMessage: {
        text: {
            type: String,
            default: null,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        },
        receiver: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: null,
        }
    },
    uploadStatus: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    }

},
    { timestamps: true }
)

conversationSchema.index({ 'participants.user': 1 });
conversationSchema.index({ type: 1, 'participants.user': 1 });

const Conversation = mongoose.model<ConversationInterface>("Conversation", conversationSchema);
export default Conversation;