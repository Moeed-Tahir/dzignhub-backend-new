const express = require('express');
const router = express.Router();
const { getUserSessions, removeSession, logoutAllOtherDevices, logout } = require('../controller/auth/sessions');


router.get('/sessions', getUserSessions);
router.delete('/sessions/:sessionId', removeSession);
router.post('/logout-all-devices', logoutAllOtherDevices);
router.post('/logout', logout);


module.exports = router;