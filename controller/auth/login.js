const User = require("../../models/User");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async")
const login = asyncWrapper(async (req, res) => {
    const rEmail = req.body.email;
    const rPassword = req.body.password;
    let user = await User.findOne({ email: rEmail })
    console.log(user)
    if (!user) {
        return res.status(400).json({ message: "The email you entered is not registered", type: "error", field: "email" })
    }
    if (user && (await bcrypt.compare(rPassword, user.password))) {
        console.log('user')
        var token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET_KEY, { expiresIn:  '1d' });

        const newUser = {
            userId: user._id,
            email: user.email,
        }

        return res.status(200).json({ type: "success", message: "You are logged in successfully", token: token, user: newUser })

    }
    else {
        return res.status(400).json({ message: "The password you entered is incorrect", type: "error", field: "password" })
    }

})
module.exports = login