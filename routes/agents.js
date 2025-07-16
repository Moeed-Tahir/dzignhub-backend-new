const express = require('express');
const router = express.Router();
const zaraBrandDesigner = require('../controller/agents/zara-brand-designer');
const logoDesigner = require('../controller/agents/logo-designer');


// Routes
router.route('/agents/zara-brand-designer').post(zaraBrandDesigner);
router.route('/agents/logo-designer').post(logoDesigner);

module.exports = router;