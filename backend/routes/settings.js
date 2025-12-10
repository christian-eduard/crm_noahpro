const express = require('express');
const router = express.Router();
const { getSettings, updateSettings, getPublicSettings, getLeadStatuses, updateLeadStatuses } = require('../controllers/settingsController');
const { protect } = require('../middleware/authMiddleware');
const smtpController = require('../controllers/smtpController');

// Public settings route
router.get('/public', getPublicSettings);

// Protected CRM settings routes
router.get('/', protect, getSettings);
router.put('/', protect, updateSettings);

// Lead Statuses routes
router.get('/lead-statuses', protect, getLeadStatuses);
router.put('/lead-statuses', protect, updateLeadStatuses);

// SMTP routes
router.get('/smtp', smtpController.getSMTPSettings);
router.put('/smtp', smtpController.updateSMTPSettings);
router.post('/smtp/test', smtpController.testSMTPConnection);

module.exports = router;
