const User = require("../../models/User");
const jwt = require("jsonwebtoken");
const asyncWrapper = require("../../middleware/async")
const updateNotificationSettings = asyncWrapper(async (req, res) => {

    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'Unauthorized', type: 'error' });
        }
        const verification = jwt.verify(token, process.env.JWT_SECRET_KEY);
        if (!verification) {
            return res.status(200).json({ type: "error", message: "Invalid Token" })
        }
        const user = await User.findOne({ email: verification.email }, { password: 0, createdAt: 0, updatedAt: 0, __v: 0 });

        if (!user) {
            return res.status(404).json({ type: "error", message: "User not found" });
        }

        const { notifications, newNotifications, softwareUpdatesNewsletter, newMessagesFromBots } = req.body;

        if (notifications) {
            await User.updateOne(
                { _id: user._id }, 
                { 
                    $set: {
                        "notificationSettings.newNotifications": true,
                        "notificationSettings.softwareUpdatesNewsletter": true,
                        "notificationSettings.newMessagesFromBots": true
                    } 
                }
            );
        }
        else {
            await User.updateOne(
                { _id: user._id }, 
                { 
                    $set: {
                        "notificationSettings.newNotifications": newNotifications,
                        "notificationSettings.softwareUpdatesNewsletter": softwareUpdatesNewsletter,
                        "notificationSettings.newMessagesFromBots": newMessagesFromBots
                    } 
                }
            );
        }

        res.status(200).json({ type: "success", message: "Notification settings updated successfully" });

    }
    catch (error) {
        console.log(error)
        res.status(500).json({ type: "error", message: "Something went wrong" });

    }


})
module.exports = updateNotificationSettings;