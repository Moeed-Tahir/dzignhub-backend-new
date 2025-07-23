const express = require('express');
const router = express.Router();
const zaraBrandDesigner = require('../controller/agents/zara-brand-designer');
const logoDesigner = require('../controller/agents/logo-designer');
const contentCreation = require('../controller/agents/content-creation');
const updateBrandDesignData = require('../controller/agents/update-brand-design-data');
const getBrandDesignData = require('../controller/agents/get-brand-designer-data');
const noviSeoAgent = require('../controller/agents/novi-seo-agent');
const strategistMira = require('../controller/agents/strategist-mira');


// Routes
router.route('/agents/zara-brand-designer').post(zaraBrandDesigner);
router.route('/agents/logo-designer').post(logoDesigner);
router.route('/agents/content-creation').post(contentCreation);
router.route('/agents/update-brand-design-data').post(updateBrandDesignData);
router.route('/agents/get-brand-designer-data').post(getBrandDesignData);
router.route('/agents/novi-seo-agent').post(noviSeoAgent);
router.route('/agents/strategist-mira').post(strategistMira);

module.exports = router;