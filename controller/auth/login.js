const User = require("../../models/User");
const Session = require("../../models/Session");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

// Helper function to parse user agent
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

const login = asyncWrapper(async (req, res) => {
    const rEmail = req.body.email;
    const rPassword = req.body.password;
    
    let user = await User.findOne({ email: rEmail });
    
    if (!user) {
        return res.status(400).json({ 
            message: "The email you entered is not registered", 
            type: "error", 
            field: "email" 
        });
    }
    
    if (user && (await bcrypt.compare(rPassword, user.password))) {
        // Generate JWT token with expiration
        const expirationTime = '1d'; // 1 day
        var token = jwt.sign(
            { userId: user._id, email: user.email }, 
            process.env.JWT_SECRET_KEY, 
            { expiresIn: expirationTime }
        );

        // Calculate expiration date for database
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 1); // 1 day from now

        // Get device and IP information
        const userAgent = req.headers['user-agent'] || '';
        const ipAddress = req.ip || req.connection.remoteAddress || req.headers['x-forwarded-for'];
        const deviceInfo = parseUserAgent(userAgent);

        // Create session record
        const session = new Session({
            userId: user._id,
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

        const newUser = {
            userId: user._id,
            email: user.email,
        };

        return res.status(200).json({ 
            type: "success", 
            message: "You are logged in successfully", 
            token: token, 
            user: newUser 
        });

    } else {
        return res.status(400).json({ 
            message: "The password you entered is incorrect", 
            type: "error", 
            field: "password" 
        });
    }
});

module.exports = login;