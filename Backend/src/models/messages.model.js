import mongoose from "mongoose";

const attachmentSchema = new mongoose.Schema({
    url : {
        type : String, 
        required : true,
    },
    fileType : {
        type : String,
        required : true,
    },
    size : {
        type : Number,
        required : true,
    }
},
{_id : false}
);

const messageSchema = new mongoose.Schema({
    sender : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User', 
        required : true
    },
    reciever : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true
    },
    content : {
        type : String,
        required : true
    },
    attachments : [attachmentSchema],
    reactions : [
        {
            user : {
                type : mongoose.Schema.Types.ObjectId,  
                ref : 'User',
                required : true
            },
            type : {
                type : String,
                default : 'like',
            }
        }
    ],
    messageStatus : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'MessageStatus',
        required : true
    }
});

const Message = mongoose.model("Message" , messageSchema);

export default Message;