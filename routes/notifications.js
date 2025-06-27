const express = require('express');
const router = express.Router();
const updateNotificationSettings = require('../controller/notifications/update-notification-settings');
const getNotificationSettings = require('../controller/notifications/get-notification-settings');


// Routes
router.route('/update-notification-settings').post(updateNotificationSettings);
router.route('/get-notification-settings').get(getNotificationSettings);

module.exports = router;