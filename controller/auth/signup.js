const bcrypt = require("bcryptjs");
const asyncWrapper = require("../../middleware/async");
const TempUser = require("../../models/TempUser");
const User = require("../../models/User");
const { generateOtp } = require("../../services/generateOTP");
const { sendOtp } = require("../../services/sendOTP");
const connectDB = require("../../db/connect"); // update path if needed

const signup = asyncWrapper(async (req, res) => {
    await connectDB(process.env.MONGO_URI); // ensure DB is connected before anything else

    const { email, phone, password } = req.body;

    if (!email || !phone || !password) {
        return res.status(400).json({ type: "error", message: "Email, phone number, and password are required." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ type: "error", message: "Valid email is required." });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    try {
        const previousUser = await User.findOne({ email });
        if (previousUser) {
            return res.status(400).json({ type: "error", message: "Account with this email already exists.", field: "email" });
        }

        const otp = generateOtp();
        const hashedOtp = await bcrypt.hash(otp, salt);

        const existingTemp = await TempUser.findOne({ email });
        if (existingTemp) {
            await TempUser.findByIdAndDelete(existingTemp._id);
        }

        const tempUser = new TempUser({
            email,
            phoneNumber: phone,
            password: hashedPassword,
            hashedOtp,
            otpExpiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 mins
        });

        await tempUser.save();

        try {
            await sendOtp(email, otp);
            return res.status(200).json({ type: "success", message: "OTP has been sent to your email." });
        } catch (emailError) {
            console.error("Error sending OTP email:", emailError);
            await TempUser.findByIdAndDelete(tempUser._id);
            return res.status(500).json({ type: "error", message: "Failed to send OTP email. Please try again.", field: "email" });
        }

    } catch (error) {
        console.error("Error during signup:", error);
        return res.status(500).json({ type: "error", message: "Server error. Please try again later." });
    }
});

module.exports = signup;
