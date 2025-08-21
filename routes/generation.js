const express = require('express');
const multer = require('multer');
const router = express.Router();
const imageGeneration = require('../controller/generation/image-generation');
const videoGeneration = require('../controller/generation/video-generation');
const saveGeneration = require('../controller/generation/save-generation');
const getGenerations = require('../controller/generation/get-generations');
const getUserGenerations = require('../controller/generation/get-user-generations');
const saveLocalGenerations = require('../controller/generation/save-local-generations');

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

// Routes
router.route('/save-local-generations').post(saveLocalGenerations);
// Add multer middleware to image generation route
router.route('/generate-image').post(
    upload.single('uploadedImageFromTextArea'),
    imageGeneration
);

router.route('/save-generation').post(saveGeneration);
router.route('/get-generations').get(getGenerations);
router.route('/get-user-generations').post(getUserGenerations);

// Add multer middleware to video generation route
router.route('/generate-video').post(
    upload.fields([
        { name: 'startImage', maxCount: 1 },
        { name: 'endImage', maxCount: 1 }
    ]),
    videoGeneration
);

module.exports = router;