
const asyncWrapper = require("../../middleware/async");
const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const socialLogin = asyncWrapper(async (req, res) => {
    const { email, provider } = req.body;

    
    try {
        let user = await User.findOne({ email });

        if (!user) {
          user = await User.create({
            email,   
            provider,
            isVerified: true,
            password: ''
          });
        }
        console.log("User found or created:", user);
    
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET_KEY, {
          expiresIn: '1d',
        });

        console.log("JWT Token generated:", token);
    
        return res.status(200).json({ jwtToken: token, userId: user._id });
    } 
    catch(error) {
        console.error("Error creating user:", error);
        return res.status(400).json({ type: "error", message: "Login Failed." });
    }
})




module.exports = socialLogin; 