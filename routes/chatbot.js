const express = require('express');
const router = express.Router();
const processMessage = require('../controller/chatbot/process-message');


// Routes
router.route('/chatbot/process-message').post(processMessage);


module.exports = router;