const express = require('express');
const router = express.Router();
const invoicePublicController = require('../controllers/invoicePublicController');

// Public routes (no authentication required)
router.get('/:token', invoicePublicController.getPublicInvoice);
router.get('/:token/track-open', invoicePublicController.trackEmailOpen);

module.exports = router;
