import User from "../models/user.model.js";

export const getCurrentUser = async(req, res) => {
    console.log("hitted")
    try {
        const userId = req.userId;
        console.log("User Id : ", userId)
        const user = await User.findById(userId);
        if(!user){
            return res.status(404).json({message : "User does not found"});
        }
        
        return res.status(200).json(user);
    } catch (error) {
        return res.status(500).json({message : `failed to get currentuser due to ${error}`});
    }
}