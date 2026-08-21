import mongoose, {  Types } from "mongoose";
import type { UserInterface } from "../Interfaces/BacknedInterfaces.js";



const userSchema = new mongoose.Schema<UserInterface>({

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
    phone : {
        type : String ,
        required : true,
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
    friends : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User',
        },
    ],

    invitations : [
        {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Invitation',
        }
    ],
    isVerified: {
        type: Boolean,
        default: false
    },
    isDeleted : {
        type : Boolean,
        default : false
    },
    tokenVersion: {
        type: Number,
        default: 0
    }
},
    { timestamps: true },
);

userSchema.index({ username: 1});
userSchema.index({ phone: 1});
//TTL indexing for otp ;
// userSchema.session.createIndex

const User = mongoose.model<UserInterface>("User", userSchema);
export default User;