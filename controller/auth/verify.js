const User = require("../../models/User");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async")
const login = asyncWrapper(async (req, res) => {

  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Unauthorized', type: 'error' });
    }
    const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
    if (!verification) {
      return res.status(200).json({ type: "error", message: "Invalid Token" })
    }
    const user = await User.findOne({ email: verification.email }, { password: 0, createdAt: 0, updatedAt: 0, __v: 0 });

    if (!user) {
      return res.status(404).json({ type: "error", message: "User not found" });
    }

    res.status(200).json({ type: "success", message: "Token verified", user: user });
  }
  catch (error) {
    console.log(error)
    res.status(500).json({ type: "error", message: "Something went wrong" });

  }


})
module.exports = login