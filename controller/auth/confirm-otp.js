
const bcrypt = require("bcryptjs");
const asyncWrapper = require("../../middleware/async");
const TempUser = require("../../models/TempUser");

const User = require("../../models/User");

const confirmOtp = asyncWrapper(async (req, res) => {
  

    try {
        const { otp, email } = req.body;
        if (!otp || !email) {
            return res.status(400).json({ type: "error", message: "OTP and email are required." });
        }
        const user = await TempUser.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ type: "error", message: "User not found." });
        }

        if (user.otpExpiresAt < new Date()) {
            return res.status(400).json({ type: "error", message: "OTP has expired." });
        }

        const isOtpValid = await bcrypt.compare(otp, user.hashedOtp);
        if (!isOtpValid) {
            return res.status(400).json({ type: "error", message: "Invalid OTP." });
        }

        const newUser = new User({
            email: user.email,
            phoneNumber: user.phoneNumber,
            password: user.password, // Assuming password is already hashed
        });
        await newUser.save();

        var token = jwt.sign({ userId: user._id, email: user.email }, process.env.JWT_SECRET_KEY, { expiresIn:  '1d' });
        

        // Delete the temporary user after successful verification
        await TempUser.findByIdAndDelete(user._id);

        return res.status(200).json({ type: "success", message: "OTP verified successfully." });
    
    } 
    catch(error) {
        console.error("Error creating user:", error);
        return res.status(400).json({ type: "error", message: "Error occurred while creating your account, please try again." });
    }
})

// ...existing code...


module.exports = confirmOtp; 