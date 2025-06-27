const Session = require("../models/Session");
const jwt = require("jsonwebtoken");

const authMiddleware = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized', type: 'error' });
        }

        // Verify JWT token
        const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        // Check if session exists in database
        const session = await Session.findOne({ token });
        
        if (!session) {
            return res.status(401).json({ 
                message: 'Session not found or expired', 
                type: 'error' 
            });
        }

        // Remove this blocking update - smartSessionUpdate handles it now
        // await Session.findOneAndUpdate(
        //     { token },
        //     { lastActivity: new Date() }
        // );

        req.user = verification;
        req.session = session;
        next();

    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            // Remove expired session from database
            const token = req.headers.authorization?.split(' ')[1];
            if (token) {
                await Session.findOneAndDelete({ token });
            }
            return res.status(401).json({ 
                message: 'Token expired', 
                type: 'error' 
            });
        }
        
        return res.status(401).json({ 
            message: 'Invalid token', 
            type: 'error' 
        });
    }
};

module.exports = authMiddleware;