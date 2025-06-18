const express = require('express');
const router = express.Router();
const login = require('../controller/auth/login')
const signup = require('../controller/auth/signup')
const verify = require('../controller/auth/verify')


router.route('/login').post(login)
router.route('/signup').post(signup);
router.route('/verify').post(verify);

module.exports = router;