const express = require('express');
const router = express.Router();
const trackingController = require('../controllers/trackingController');

// Track proposal view
router.post('/proposals/:token/view', trackingController.trackProposalView);

// Get proposal views
router.get('/proposals/:id/views', trackingController.getProposalViews);

// Get proposal analytics
router.get('/proposals/:id/analytics', trackingController.getProposalAnalytics);

module.exports = router;
