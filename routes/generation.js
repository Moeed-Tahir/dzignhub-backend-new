const express = require('express');
const multer = require('multer');
const router = express.Router();
const imageGeneration = require('../controller/generation/image-generation');
const videoGeneration = require('../controller/generation/video-generation');

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
router.route('/generate-image').post(imageGeneration);

// Add multer middleware to video generation route
router.route('/generate-video').post(
    upload.fields([
        { name: 'startImage', maxCount: 1 },
        { name: 'endImage', maxCount: 1 }
    ]), 
    videoGeneration
);

module.exports = router;