const db = require('../config/database');

/**
 * Generate next invoice number
 * Format: PREFIX-YEAR-NUMBER (e.g., INV-2025-0001)
 */
const generateInvoiceNumber = async () => {
    try {
        // Get settings
        const settingsResult = await db.query('SELECT invoice_prefix, next_invoice_number FROM crm_settings LIMIT 1');

        if (settingsResult.rows.length === 0) {
            throw new Error('CRM settings not found');
        }

        const { invoice_prefix, next_invoice_number } = settingsResult.rows[0];
        const currentYear = new Date().getFullYear();
        const paddedNumber = String(next_invoice_number).padStart(4, '0');

        const invoiceNumber = `${invoice_prefix}-${currentYear}-${paddedNumber}`;

        // Increment next number
        await db.query(
            'UPDATE crm_settings SET next_invoice_number = next_invoice_number + 1'
        );

        return invoiceNumber;
    } catch (error) {
        console.error('Error generating invoice number:', error);
        throw error;
    }
};

/**
 * Generate receipt number
 * Format: REC-YEAR-NUMBER (e.g., REC-2025-0001)
 */
const generateReceiptNumber = async () => {
    try {
        // Get last receipt number
        const result = await db.query(
            `SELECT receipt_number FROM invoice_payments 
             ORDER BY id DESC LIMIT 1`
        );

        let nextNumber = 1;
        if (result.rows.length > 0) {
            const lastReceipt = result.rows[0].receipt_number;
            const match = lastReceipt.match(/REC-\d{4}-(\d{4})/);
            if (match) {
                nextNumber = parseInt(match[1]) + 1;
            }
        }

        const currentYear = new Date().getFullYear();
        const paddedNumber = String(nextNumber).padStart(4, '0');

        return `REC-${currentYear}-${paddedNumber}`;
    } catch (error) {
        console.error('Error generating receipt number:', error);
        throw error;
    }
};

/**
 * Calculate invoice totals
 */
const calculateInvoiceTotals = (items, taxRate = 21) => {
    const subtotal = items.reduce((sum, item) => {
        return sum + (item.quantity * item.price);
    }, 0);

    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        taxAmount: parseFloat(taxAmount.toFixed(2)),
        totalAmount: parseFloat(totalAmount.toFixed(2))
    };
};

module.exports = {
    generateInvoiceNumber,
    generateReceiptNumber,
    calculateInvoiceTotals
};
