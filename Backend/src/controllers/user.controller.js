import User from "../models/user.model.js"


const getUserList = async function(req , res){
    try {
        const users = await User.find({
            _id : {$ne : req.user.id}
        });

        const currentUser = await User.findById(req.user.id).select("friends");
        const data =  users.map(user => ({
            ...user.toObject(),
            isFriend : currentUser.friends.some(
                friendId => friendId.toString() === user._id.toString()
            ),
        }) );
        res.status(200).json({success : true , data});
    } catch (error) {
        res.status(500).json({success : false , message : "Error fetching user list in getUserList controller function" , error});
    }
}

export {getUserList};