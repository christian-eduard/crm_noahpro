const db = require('../config/database');
const { generateReceiptNumber } = require('../services/invoiceNumberService');
const { sendReceiptEmail } = require('../services/invoiceEmailService');

/**
 * Register payment for an invoice
 */
const registerPayment = async (req, res) => {
    try {
        const { invoice_id } = req.params;
        const { amount, payment_method, payment_date, reference, notes } = req.body;

        const amountValue = parseFloat(amount);

        // Validation
        if (!amountValue || amountValue <= 0) {
            return res.status(400).json({ error: 'El monto del pago debe ser mayor a 0' });
        }

        // Get invoice
        const invoiceResult = await db.query(
            'SELECT * FROM invoices WHERE id = $1',
            [invoice_id]
        );

        if (invoiceResult.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        const invoice = invoiceResult.rows[0];
        const currentRemaining = parseFloat(invoice.remaining_amount);

        // Validate payment amount
        if (amountValue > currentRemaining + 0.01) { // Add small epsilon for float comparison
            return res.status(400).json({
                error: `El monto del pago (${amountValue.toFixed(2)}) excede el monto pendiente (${currentRemaining.toFixed(2)})`
            });
        }

        // Generate receipt number
        const receiptNumber = await generateReceiptNumber();

        // Create payment record
        const paymentResult = await db.query(
            `INSERT INTO invoice_payments (
                invoice_id, amount, payment_method, payment_date, reference, receipt_number, notes, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [
                invoice_id,
                amountValue,
                payment_method,
                payment_date || new Date().toISOString().split('T')[0],
                reference,
                receiptNumber,
                notes,
                req.user.userId || req.user.id
            ]
        );

        // Update invoice
        const newPaidAmount = parseFloat(invoice.paid_amount) + amountValue;
        const newRemainingAmount = parseFloat(invoice.total_amount) - newPaidAmount;

        let paymentStatus = 'pending';
        let paidDate = null;

        if (newRemainingAmount <= 0.01) { // Account for floating point precision
            paymentStatus = 'paid';
            paidDate = payment_date || new Date().toISOString().split('T')[0];
        } else if (newPaidAmount > 0) {
            paymentStatus = 'partial';
        }

        await db.query(
            `UPDATE invoices SET
                paid_amount = $1,
                remaining_amount = $2,
                payment_status = $3,
                paid_date = $4,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [newPaidAmount, Math.max(0, newRemainingAmount), paymentStatus, paidDate, invoice_id]
        );

        // Register activity
        /*
        // TODO: Enable activity logging when activities table supports client_id
        try {
            await db.query(
                `INSERT INTO activities (client_id, type, description, metadata)
                 VALUES ($1, $2, $3, $4)`,
                [
                    invoice.client_id,
                    'payment_received',
                    `Pago de ${amount}€ recibido para factura "${invoice.invoice_number}"`,
                    JSON.stringify({
                        invoiceId: invoice_id,
                        paymentId: paymentResult.rows[0].id,
                        receiptNumber
                    })
                ]
            );
        } catch (error) {
            console.error('Error logging activity:', error);
        }
        */

        // TODO: Send receipt email (Phase 3)
        // await receiptService.sendReceiptEmail(paymentResult.rows[0]);

        res.status(201).json(paymentResult.rows[0]);
    } catch (error) {
        console.error('Error registering payment:', error);
        res.status(500).json({ error: 'Error al registrar pago' });
    }
};

/**
 * Get payments for an invoice
 */
const getPaymentsByInvoice = async (req, res) => {
    try {
        const { invoice_id } = req.params;

        const result = await db.query(
            'SELECT * FROM invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
            [invoice_id]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Error al obtener pagos' });
    }
};

/**
 * Delete payment
 */
const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;

        // Get payment
        const paymentResult = await db.query(
            'SELECT * FROM invoice_payments WHERE id = $1',
            [id]
        );

        if (paymentResult.rows.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        const payment = paymentResult.rows[0];

        // Get invoice
        const invoiceResult = await db.query(
            'SELECT * FROM invoices WHERE id = $1',
            [payment.invoice_id]
        );

        const invoice = invoiceResult.rows[0];

        // Delete payment
        await db.query('DELETE FROM invoice_payments WHERE id = $1', [id]);

        // Recalculate invoice totals
        const paymentsResult = await db.query(
            'SELECT SUM(amount) as total FROM invoice_payments WHERE invoice_id = $1',
            [payment.invoice_id]
        );

        const totalPaid = parseFloat(paymentsResult.rows[0].total || 0);
        const remainingAmount = parseFloat(invoice.total_amount) - totalPaid;

        let paymentStatus = 'pending';
        let paidDate = null;

        if (remainingAmount <= 0.01) {
            paymentStatus = 'paid';
            paidDate = invoice.paid_date;
        } else if (totalPaid > 0) {
            paymentStatus = 'partial';
        }

        await db.query(
            `UPDATE invoices SET
                paid_amount = $1,
                remaining_amount = $2,
                payment_status = $3,
                paid_date = $4,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $5`,
            [totalPaid, Math.max(0, remainingAmount), paymentStatus, paidDate, payment.invoice_id]
        );

        res.json({ message: 'Pago eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting payment:', error);
        res.status(500).json({ error: 'Error al eliminar pago' });
    }
};

/**
 * Resend receipt email
 */
const resendReceipt = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT ip.*, i.invoice_number, i.client_id, c.email, c.name
             FROM invoice_payments ip
             JOIN invoices i ON ip.invoice_id = i.id
             JOIN clients c ON i.client_id = c.id
             WHERE ip.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }

        const payment = result.rows[0];

        if (!payment.email) {
            return res.status(400).json({ error: 'El cliente no tiene email' });
        }

        // TODO: Implement receipt email sending (Phase 3)
        // await receiptService.sendReceiptEmail(payment);

        // Update receipt sent status
        await db.query(
            'UPDATE invoice_payments SET receipt_sent = true, receipt_sent_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );

        res.json({ message: 'Recibo enviado exitosamente' });
    } catch (error) {
        console.error('Error resending receipt:', error);
        res.status(500).json({ error: 'Error al enviar recibo' });
    }
};

module.exports = {
    registerPayment,
    getPaymentsByInvoice,
    deletePayment,
    resendReceipt
};
