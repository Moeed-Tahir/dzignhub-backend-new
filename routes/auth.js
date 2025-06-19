const express = require('express');
const router = express.Router();
const login = require('../controller/auth/login')
const signup = require('../controller/auth/signup')
const verify = require('../controller/auth/verify')
const confirmOtp = require('../controller/auth/confirm-otp')
const forgotPassword = require('../controller/auth/forgot-password')
const verifyResetOtp = require('../controller/auth/verify-reset-otp')
const resetPassword = require('../controller/auth/reset-password')
const resendOtp = require('../controller/auth/resend-otp')
const socialLogin = require('../controller/auth/social-login')


router.route('/login').post(login)
router.route('/signup').post(signup);
router.route('/verify').post(verify);
router.route('/confirm-otp').post(confirmOtp);
router.route('/forgot-password').post(forgotPassword);
router.route('/verify-reset-otp').post(verifyResetOtp);
router.route('/reset-password').post(resetPassword);
router.route('/resend-otp').post(resendOtp);
router.route('/social-login').post(socialLogin);

module.exports = router;