
const bcrypt = require("bcryptjs");
const asyncWrapper = require("../../middleware/async");
const User = require("../../models/User");
const crypto = require('crypto');
const verifyResetOtp = asyncWrapper(async (req, res) => {
  

    try {
        const { resetToken, email, newPassword } = req.body;
        if (!resetToken || !email) {
            return res.status(400).json({ type: "error", message: "OTP and Reset Token are required." });
        }
        const user = await User.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ type: "error", message: "User not found." });
        }

        if (user.resetSessionExpires < new Date()) {
            return res.status(400).json({ type: "error", message: "Token has expired. Please request a new one." });
        }

       const isTokenValid = user.resetSessionToken === resetToken;
        if (!isTokenValid) {
            return res.status(400).json({ type: "error", message: "Invalid Reset Token." });
        }

        // Hash the new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        user.password = hashedPassword; // Update the user's password
        user.resetSessionToken = null; // Clear the session token after successful verification
        user.resetSessionExpires = null; // Clear the session expiration time
        await user.save();


        return res.status(200).json({ type: "success", message: "Password reset successful." });
    } 
    catch(error) {
        console.error("Error reseting your password:", error);
        return res.status(400).json({ type: "error", message: "Error occurred while reseting your password, please try again." });
    }
})

module.exports = verifyResetOtp; 