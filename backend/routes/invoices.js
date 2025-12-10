const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const invoicePaymentController = require('../controllers/invoicePaymentController');
const { protect } = require('../middleware/authMiddleware');

// Public routes (no auth required)
router.get('/public/:token', invoiceController.getPublicInvoice);

// All routes require authentication
router.use(protect);

// Invoice routes
router.get('/', invoiceController.getInvoices);
router.get('/:id', invoiceController.getInvoiceById);
router.post('/', invoiceController.createInvoice);
router.put('/:id', invoiceController.updateInvoice);
router.delete('/:id', invoiceController.deleteInvoice);
router.post('/:id/resend-email', invoiceController.resendInvoiceEmail);

// Payment routes
router.post('/:invoice_id/payments', invoicePaymentController.registerPayment);
router.get('/:invoice_id/payments', invoicePaymentController.getPaymentsByInvoice);
router.delete('/payments/:id', invoicePaymentController.deletePayment);
router.post('/payments/:id/resend-receipt', invoicePaymentController.resendReceipt);

module.exports = router;
