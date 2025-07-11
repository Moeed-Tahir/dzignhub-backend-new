const express = require('express');
const router = express.Router();
const zaraBrandDesigner = require('../controller/agents/zara-brand-designer');


// Routes
router.route('/agents/zara-brand-designer').post(zaraBrandDesigner);

module.exports = router;