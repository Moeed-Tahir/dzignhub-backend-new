const User = require("../../models/User");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async")
const changePassword = asyncWrapper(async (req, res) => {

    const rPassword = req.body.password;
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ message: 'Unauthorized', type: 'error' });
    }


    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!verification) {
        return res.status(200).json({ type: "error", message: "Invalid Token" })
    }

    let user = await User.findOne({ email: verification.email })
    console.log(user)
    if (!user) {
        return res.status(400).json({ message: "The email you entered is not registered", type: "error", field: "email" })
    }

    if (user && (await bcrypt.compare(rPassword, user.password))) {
       await User.findByIdAndDelete(user._id);
        return res.status(200).json({ type: "success", message: "Account deleted successfully" })

    }
    else {
        return res.status(400).json({ message: "Password you entered is incorrect", type: "error", field: "password" })
    }

})
module.exports = changePassword