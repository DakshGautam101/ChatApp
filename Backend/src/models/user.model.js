import mongoose from "mongoose";

const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        trim: true,
        minLength: 3,
        maxLength: 20
    },
    email: {
        type: String,
        required: true,
        lowercase: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
        select: false,
        minLength: 6
    },
    avatar: {
        type: String,
        default: null
    },
    status: {
        type: String,
        enum: ['online', 'offline'],
        default: 'offline'
    },

    blockedUsers: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
    ],

    emailVerificationOtp: {
        type: String,
        select: false,
    },
    emailVerificationOtpExpires: {
        type: Date,
        select: false,
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    isDeleted : {
        type : Boolean,
        default : false
    }
},
    { timestamps: true },
);

userSchema.index({ username: 1, email: 1 });

const User = mongoose.model("User", userSchema);
export default User;