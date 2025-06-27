const Session = require("../models/Session");

const smartSessionUpdate = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            // Only update if last activity was more than 2 minutes ago
            const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
            
            // Non-blocking update - don't wait for it to complete
            Session.findOneAndUpdate(
                { 
                    token,
                    lastActivity: { $lt: twoMinutesAgo }
                },
                { lastActivity: new Date() }
            ).exec().catch(err => {
                // Silent error handling - don't block the request
                console.error('Error updating session activity:', err);
            });
        }
    } catch (error) {
        // Don't block the request if middleware fails
        console.error('Error in smart session update middleware:', error);
    }
    next();
};

module.exports = smartSessionUpdate;