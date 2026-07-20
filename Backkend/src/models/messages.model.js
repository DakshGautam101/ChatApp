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


 