import mongoose, { Document, Types } from "mongoose";

export interface GroupInvitationInterface extends Document{
    group : Types.ObjectId,
    sender : Types.ObjectId,
    receiver : Types.ObjectId,
    status : "pending" | "accepted" | "rejected"
}


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