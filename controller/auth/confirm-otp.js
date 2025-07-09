
const bcrypt = require("bcryptjs");
const asyncWrapper = require("../../middleware/async");
const TempUser = require("../../models/TempUser");
var jwt = require("jsonwebtoken");

const User = require("../../models/User");
const Session = require("../../models/Session");

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

        console.log("User:", user);
        console.log("OTP Verified Successfully");

        const newUser = new User({
            email: user.email,
            phoneNumber: user.phoneNumber,
            password: user.password, // Assuming password is already hashed
        });
        await newUser.save();

        var token = jwt.sign({ userId: newUser._id, email: newUser.email }, process.env.JWT_SECRET_KEY, { expiresIn: '1d' });


        // creating new session
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1); // 1 day from now

        // Get device and IP information
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
        const deviceInfo = parseUserAgent(userAgent);

        // Create session record
        const session = new Session({
            userId: newUser._id,
            token: token,
            deviceInfo: {
                userAgent,
                ...deviceInfo
            },
            ipAddress,
            lastActivity: new Date(),
            expiresAt: expiresAt
        });

        await session.save();


        // Delete the temporary user after successful verification
        await TempUser.findByIdAndDelete(user._id);
        
        console.log("New User Created:", newUser);
        return res.status(200).json({ type: "success", message: "OTP verified successfully.", token: token, user: newUser });

    }
    catch (error) {
        console.error("Error creating user:", error);
        return res.status(400).json({ type: "error", message: "Error occurred while creating your account, please try again." });
    }
})

const parseUserAgent = (userAgent) => {
    const browser = userAgent.includes('Chrome') ? 'Chrome' :
        userAgent.includes('Firefox') ? 'Firefox' :
            userAgent.includes('Safari') ? 'Safari' : 'Unknown';

    const os = userAgent.includes('Windows') ? 'Windows' :
        userAgent.includes('Mac') ? 'macOS' :
            userAgent.includes('Linux') ? 'Linux' :
                userAgent.includes('Android') ? 'Android' :
                    userAgent.includes('iOS') ? 'iOS' : 'Unknown';

    const device = userAgent.includes('Mobile') ? 'Mobile' : 'Desktop';

    return { browser, os, device };
};



module.exports = confirmOtp; 