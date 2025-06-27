const User = require("../../models/User");

var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async")


const getProfileData = asyncWrapper(async (req, res) => {

   
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized', type: 'error' });
    }


    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!verification) {
        return res.status(200).json({ type: "error", message: "Invalid Token" })
    }

    let userData = await User.findOne({ _id: verification.userId }, { password: 0, createdAt: 0, updatedAt: 0, __v: 0 });
    if (!userData) {
        return res.status(400).json({ message: "User not found", type: "error" })
    }
    
    return res.status(200).json({ type: "success", message: "User data fetched successfully", data: userData })

})


module.exports = getProfileData