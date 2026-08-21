import mongoose, { Types } from "mongoose";
import type { GroupInvitationInterface } from "../Interfaces/BacknedInterfaces.js";


const groupInvitationSchema = new mongoose.Schema<GroupInvitationInterface>(
    {
        group : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'Conversation',
            required : true,
        },
        
        sender : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User',
            required : true,
        },

        receiver : {
            type : mongoose.Schema.Types.ObjectId,
            ref : 'User',
            required : true,
        },

        status : {
            type : String,
            enum : ["pending" , "accepted" , "rejected"],
            default : "pending",
        },
    },
    {
        timestamps : true,
    }
)


groupInvitationSchema.index({
    group: 1,
    receiver: 1,
    status: 1
});

const GroupInvitation = mongoose.model<GroupInvitationInterface>('GroupInvitation' , groupInvitationSchema);
export default GroupInvitation;