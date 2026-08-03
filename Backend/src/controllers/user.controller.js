import User from "../models/user.model.js"


const getUserList = async function(req , res){
    try {
        const data = await User.find();
        res.status(200).json({success : true , data});
    } catch (error) {
        res.status(500).json({success : false , message : "Error fetching user list in getUserList controller function" , error});
    }
}

export {getUserList};