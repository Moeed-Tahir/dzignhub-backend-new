
const bcrypt = require("bcryptjs");
const asyncWrapper = require("../../middleware/async");
const User = require("../../models/User");
const { generateOtp } = require("../../services/generateOTP");
const { sendOtp } = require("../../services/sendOTP");

const signup = asyncWrapper(async (req, res) => {
    const salt = await bcrypt.genSalt(10);
    

    
    try {
        // Validate input
        if (!req.body.email) {
            return res.status(400).json({ type: "error", message: "Email is required." });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
            return res.status(400).json({ type: "error", message: "Valid email is required." });
        }

        let user = await User.findOne({ email: req.body.email });
        if (!user) {
            return res.status(404).json({ type: "error", message: "User not found." });
        }



        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, salt);
        user.resetOtp = hashedOtp;
        user.resetOtpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes
        user.resetSessionToken = null; // Clear any existing session token
        await user.save();
      

        // Send OTP email - if this fails, we should handle it properly
        try {
            await sendOtp(req.body.email, otp, true);
            return res.status(200).json({ type: "success", message: "OTP has been sent to your email." });
        } catch (emailError) {
            console.error("Error sending OTP email:", emailError);
            // Delete the user since OTP couldn't be sent
            await TempUser.findByIdAndDelete(user._id);
            return res.status(500).json({ type: "error", message: "Failed to send OTP email. Please try again." });
        }
        
    } 
    catch(error) {
        console.error("Error creating user:", error);
        return res.status(400).json({ type: "error", message: "Error occurred, please try again." });
    }
})

// ...existing code...


module.exports = signup; 