
const bcrypt = require("bcryptjs");
const asyncWrapper = require("../../middleware/async");
const User = require("../../models/User");
const crypto = require('crypto');
const verifyResetOtp = asyncWrapper(async (req, res) => {
  

    try {
        const { otp, email } = req.body;
        if (!otp || !email) {
            return res.status(400).json({ type: "error", message: "OTP and email are required." });
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ type: "error", message: "User not found." });
        }

        if (user.resetOtpExpires < new Date()) {
            return res.status(400).json({ type: "error", message: "OTP has expired." });
        }

        const isOtpValid = await bcrypt.compare(otp, user.resetOtp);
        if (!isOtpValid) {
            return res.status(400).json({ type: "error", message: "Invalid OTP." });
        }


        // Generate a new session token
        const resetSessionToken = crypto.randomBytes(32).toString('hex');
        user.resetSessionToken = resetSessionToken; 
        user.resetSessionExpires = Date.now() + 10 * 60 * 1000; // Session valid for 10 minutes
        user.resetOtp = null; // Clear the OTP after successful verification
        user.resetOtpExpires = null; // Clear the OTP expiration time
        await user.save();

        return res.status(200).json({ type: "success", message: "OTP verified successfully.", resetSessionToken });
    
    } 
    catch(error) {
        console.error("Error creating user:", error);
        return res.status(400).json({ type: "error", message: "Error occurred while creating your account, please try again." });
    }
})

module.exports = verifyResetOtp; 