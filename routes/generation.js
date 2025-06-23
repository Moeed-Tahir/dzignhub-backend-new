const express = require('express');
const router = express.Router();
const imageGeneration = require('../controller/generation/image-generation')



router.route('/generate-image').post(imageGeneration)


module.exports = router;