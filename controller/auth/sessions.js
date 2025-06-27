const Session = require("../../models/Session");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async");

// Get all active sessions for a user
const getUserSessions = asyncWrapper(async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized', type: 'error' });
        }

        const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
        
        // Only get sessions that exist in DB (all are active)
        const sessions = await Session.find({ 
            userId: verification.userId
        }).sort({ lastActivity: -1 });

        const sessionData = sessions.map(session => ({
            _id: session._id,
            deviceInfo: session.deviceInfo,
            ipAddress: session.ipAddress,
            location: session.location,
            lastActivity: session.lastActivity,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            isCurrent: session.token === token
        }));

        return res.status(200).json({ 
            type: "success", 
            sessions: sessionData 
        });

    } catch (error) {
        console.error('Error fetching sessions:', error);
        return res.status(500).json({ 
            type: "error", 
            message: "Something went wrong" 
        });
    }
});

// Remove a specific session (logout from device)
const removeSession = asyncWrapper(async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized', type: 'error' });
        }

        const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
        const { sessionId } = req.params;

        // Delete session from database
        const session = await Session.findOneAndDelete(
            { 
                _id: sessionId, 
                userId: verification.userId 
            }
        );

        if (!session) {
            return res.status(404).json({ 
                type: "error", 
                message: "Session not found" 
            });
        }

        return res.status(200).json({ 
            type: "success", 
            message: "Session removed successfully" 
        });

    } catch (error) {
        console.error('Error removing session:', error);
        return res.status(500).json({ 
            type: "error", 
            message: "Something went wrong" 
        });
    }
});

// Logout from all devices except current
const logoutAllOtherDevices = asyncWrapper(async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized', type: 'error' });
        }

        const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);

        // Delete all sessions except current one
        await Session.deleteMany(
            { 
                userId: verification.userId, 
                token: { $ne: token }
            }
        );

        return res.status(200).json({ 
            type: "success", 
            message: "Logged out from all other devices" 
        });

    } catch (error) {
        console.error('Error logging out from other devices:', error);
        return res.status(500).json({ 
            type: "error", 
            message: "Something went wrong" 
        });
    }
});

// Logout current session
const logout = asyncWrapper(async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized', type: 'error' });
        }

        // Delete current session
        await Session.findOneAndDelete({ token });

        return res.status(200).json({ 
            type: "success", 
            message: "Logged out successfully" 
        });

    } catch (error) {
        console.error('Error logging out:', error);
        return res.status(500).json({ 
            type: "error", 
            message: "Something went wrong" 
        });
    }
});

module.exports = {
    getUserSessions,
    removeSession,
    logoutAllOtherDevices,
    logout
};