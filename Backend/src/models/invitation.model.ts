import mongoose, { Document, Types, type Date } from "mongoose";
import type { InvitationInterface } from "../Interfaces/BacknedInterfaces.js";


const invitationSchema = new mongoose.Schema<InvitationInterface>({
    sender : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User' , 
        required : true
    },
    receiver : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    status : {
        type : String,
        enum : ['pending' , 'accepted' , 'rejected'],
        default : 'pending'
    },
    rejectedUntil  : {
        type : Date,
    }
} ,{timestamps : true});


const Invitation = mongoose.model<InvitationInterface>('Invitation' , invitationSchema);
export default Invitation; 