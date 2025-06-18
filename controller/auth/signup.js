
const bcrypt = require("bcryptjs");
const asyncWrapper = require("../../middleware/async");
const TempUser = require("../../models/TempUser");
const { generateOtp } = require("../../services/generateOTP");
const { sendOtp } = require("../../services/sendOTP");

const signup = asyncWrapper(async (req, res) => {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    
    try {
        // Validate input
        if (!req.body.email || !req.body.phone || !req.body.password) {
            return res.status(400).json({ type: "error", message: "Email, phone number, and password are required." });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(req.body.email)) {
            return res.status(400).json({ type: "error", message: "Valid email is required." });
        }

        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, salt);
        let user = new TempUser({
            email: req.body.email,
            phoneNumber: req.body.phone,
            password: hashedPassword,
            hashedOtp: hashedOtp,
            otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000) // OTP expires in 10 minutes,
        })
    
        await user.save();

        // Send OTP email - if this fails, we should handle it properly
        try {
            await sendOtp(req.body.email, otp);
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
        return res.status(400).json({ type: "error", message: "Error occurred while creating your account, please try again." });
    }
})

// ...existing code...


module.exports = signup; 