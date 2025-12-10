const db = require('../config/database');

/**
 * Get public invoice by token
 */
const getPublicInvoice = async (req, res) => {
    try {
        const { token } = req.params;

        const result = await db.query(
            `SELECT i.*, c.name as client_name, c.nif as business_name, c.phone
             FROM invoices i
             LEFT JOIN clients c ON i.client_id = c.id
             WHERE i.token = $1`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        const invoice = result.rows[0];

        // Get payments
        const paymentsResult = await db.query(
            'SELECT amount, payment_date, payment_method FROM invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
            [invoice.id]
        );

        // Update view tracking
        const viewCount = invoice.view_count + 1;
        const updateFields = {
            view_count: viewCount
        };

        if (!invoice.viewed) {
            updateFields.viewed = true;
            updateFields.viewed_at = new Date();
        }

        await db.query(
            `UPDATE invoices SET
                viewed = COALESCE($1, viewed),
                viewed_at = COALESCE($2, viewed_at),
                view_count = $3,
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [updateFields.viewed, updateFields.viewed_at, viewCount, invoice.id]
        );

        // Register activity
        if (!invoice.viewed) {
            await db.query(
                `INSERT INTO activities (client_id, type, description, metadata)
                 VALUES ($1, $2, $3, $4)`,
                [
                    invoice.client_id,
                    'invoice_viewed',
                    `Factura "${invoice.invoice_number}" visualizada`,
                    JSON.stringify({ invoiceId: invoice.id })
                ]
            );
        }

        // Return invoice with payments (excluding sensitive data)
        const publicInvoice = {
            invoice_number: invoice.invoice_number,
            title: invoice.title,
            description: invoice.description,
            items: invoice.items,
            subtotal: invoice.subtotal,
            tax_rate: invoice.tax_rate,
            tax_amount: invoice.tax_amount,
            total_amount: invoice.total_amount,
            paid_amount: invoice.paid_amount,
            remaining_amount: invoice.remaining_amount,
            payment_status: invoice.payment_status,
            issue_date: invoice.issue_date,
            due_date: invoice.due_date,
            paid_date: invoice.paid_date,
            notes: invoice.notes,
            lead_name: invoice.lead_name,
            business_name: invoice.business_name,
            payments: paymentsResult.rows
        };

        res.json(publicInvoice);
    } catch (error) {
        console.error('Error fetching public invoice:', error);
        res.status(500).json({ error: 'Error al obtener factura' });
    }
};

/**
 * Track email open (tracking pixel)
 */
const trackEmailOpen = async (req, res) => {
    try {
        const { token } = req.params;

        const result = await db.query(
            'SELECT id, client_id, invoice_number, email_opened FROM invoices WHERE token = $1',
            [token]
        );

        if (result.rows.length > 0) {
            const invoice = result.rows[0];

            if (!invoice.email_opened) {
                await db.query(
                    'UPDATE invoices SET email_opened = true, email_opened_at = CURRENT_TIMESTAMP WHERE id = $1',
                    [invoice.id]
                );

                // Register activity
                await db.query(
                    `INSERT INTO activities (client_id, type, description, metadata)
                     VALUES ($1, $2, $3, $4)`,
                    [
                        invoice.client_id,
                        'invoice_email_opened',
                        `Email de factura "${invoice.invoice_number}" abierto`,
                        JSON.stringify({ invoiceId: invoice.id })
                    ]
                );
            }
        }

        // Return 1x1 transparent pixel
        const pixel = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64'
        );

        res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length,
            'Cache-Control': 'no-store, no-cache, must-revalidate, private'
        });
        res.end(pixel);
    } catch (error) {
        console.error('Error tracking email open:', error);
        // Still return pixel even on error
        const pixel = Buffer.from(
            'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
            'base64'
        );
        res.writeHead(200, {
            'Content-Type': 'image/gif',
            'Content-Length': pixel.length
        });
        res.end(pixel);
    }
};

module.exports = {
    getPublicInvoice,
    trackEmailOpen
};
