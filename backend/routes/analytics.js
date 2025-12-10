const express = require('express');
const router = express.Router();
const { trackVisit, getAnalytics, getConversionFunnel } = require('../controllers/analyticsController');

// Track page visit
router.post('/track', trackVisit);

// Get analytics data
router.get('/stats', getAnalytics);

// Get conversion funnel
router.get('/funnel', getConversionFunnel);

module.exports = router;
