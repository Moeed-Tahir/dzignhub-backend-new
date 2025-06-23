const User = require("../../models/User");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async")
const login = asyncWrapper(async (req, res) => {
   
    try {

        if (!req.body.token) {
            return res.status(200).json({ type: "error", message: "You are not logged in" })
        }
        
        const verification = jwt.verify(req.body.token, process.env.JWT_SECRET_KEY);
        if (!verification) {
            return res.status(200).json({ type: "error", message: "Invalid Token" })
        }
        const user = await User.findOne({ username: verification.username }, { password: 0, createdAt: 0, updatedAt: 0, __v: 0 });
      
        res.status(200).json({ type: "success", message: "Token verified", user: user});
      }
      catch(error) {
        console.log(error)
        res.status(500).json({ type: "error", message: "Something went wrong"});

      }


})
module.exports = login