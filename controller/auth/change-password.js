const User = require("../../models/User");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async")
const changePassword = asyncWrapper(async (req, res) => {

    const rPassword = req.body.oldPassword;
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
        var newPassword = await bcrypt.hash(req.body.newPassword, 10);
        user.password = newPassword;
        await user.save();
        var newToken = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });

        return res.status(200).json({ type: "success", message: "Password changed successfully", token: newToken })

    }
    else {
        return res.status(400).json({ message: "The old password is incorrect", type: "error", field: "password" })
    }

})
module.exports = changePassword