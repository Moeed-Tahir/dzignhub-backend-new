const express = require('express');
const router = express.Router();
const multer = require('multer');

const login = require('../controller/auth/login')
const signup = require('../controller/auth/signup')
const verify = require('../controller/auth/verify')
const confirmOtp = require('../controller/auth/confirm-otp')
const forgotPassword = require('../controller/auth/forgot-password')
const verifyResetOtp = require('../controller/auth/verify-reset-otp')
const resetPassword = require('../controller/auth/reset-password')
const resendOtp = require('../controller/auth/resend-otp')
const socialLogin = require('../controller/auth/social-login')
const changePassword = require('../controller/auth/change-password')
const editProfile = require('../controller/auth/edit-profile')
const getProfileData = require('../controller/auth/get-profile-data')

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit per file
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'), false);
        }
    }
});

router.route('/login').post(login)
router.route('/signup').post(signup);
router.route('/verify').post(verify);
router.route('/confirm-otp').post(confirmOtp);
router.route('/forgot-password').post(forgotPassword);
router.route('/verify-reset-otp').post(verifyResetOtp);
router.route('/reset-password').post(resetPassword);
router.route('/resend-otp').post(resendOtp);
router.route('/social-login').post(socialLogin);
router.route('/change-password').post(changePassword);
router.route('/get-profile-data').get(getProfileData);
router.route('/edit-profile').post(
    upload.fields([
        { name: 'avatar', maxCount: 1 }
    ]), 
    editProfile
);
module.exports = router;