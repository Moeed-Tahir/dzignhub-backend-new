const User = require("../../models/User");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async")
const updateBrandDesign = asyncWrapper(async (req, res) => {

    
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
        return res.status(400).json({ message: "User not found", type: "error", field: "email" })
    }

    console.log(req.body.brandDesign)
    await User.findByIdAndUpdate(
        user._id,
        {
          $set: {
            brandDesign: req.body.brandDesign || {}
          }
        },
        { new: true }
      );

    return res.status(200).json({ type: "success", message: "Brand design data updated successfully" })

})
module.exports = updateBrandDesign