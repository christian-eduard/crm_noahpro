const express = require('express');
const router = express.Router();
const { getEmailTemplates, updateEmailTemplate } = require('../controllers/emailTemplatesController');
const { protect } = require('../middleware/authMiddleware');

// Get all email templates
router.get('/', protect, getEmailTemplates);

// Update email template
router.put('/:id', protect, updateEmailTemplate);

module.exports = router;
