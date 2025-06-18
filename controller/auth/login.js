const User = require("../../models/User");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async")
const login = asyncWrapper(async (req, res) => {
    const rUsername = req.body.username;
    const rPassword = req.body.password;
    let user = await User.findOne({ username: rUsername })
    console.log(user)
    if (user && (await bcrypt.compare(rPassword, user.password))) {
        console.log('user')
        var token = jwt.sign({ email: user.email, userId: user._id, username: user.username, password: user.password, firstName: user.firstName, lastName: user.lastName, avatar: user.avatar }, process.env.JWT_SECRET, { expiresIn: '1d' });

        const newUser = {
            userId: user._id,
            username: user.username,
            fullName: user.fullName,
            email: user.email,
            isAdmin: user.isAdmin,
            isBlocked: user.isBlocked
        }

        return res.status(200).json({ type: "success", message: "You are logged in successfully", token: token, user: newUser })

    }
    else {
        return res.status(400).json({ message: "Invalid Credientials", type: "error" })
    }

})
module.exports = login