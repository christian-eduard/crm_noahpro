const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { generateInvoiceNumber, calculateInvoiceTotals } = require('../services/invoiceNumberService');
const { sendInvoiceEmail } = require('../services/invoiceEmailService');
const logger = require('../config/logger');

/**
 * Get all invoices with filters
 */
const getInvoices = async (req, res) => {
    try {
        const { status, client_id, search, page = 1, limit = 50 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT i.*, c.name as client_name, c.email as client_email, c.nif as business_name
            FROM invoices i
            LEFT JOIN clients c ON i.client_id = c.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 1;

        if (status) {
            query += ` AND i.payment_status = $${paramCount}`;
            params.push(status);
            paramCount++;
        }

        if (client_id) {
            query += ` AND i.client_id = $${paramCount}`;
            params.push(client_id);
            paramCount++;
        }

        if (search) {
            query += ` AND (i.invoice_number ILIKE $${paramCount} OR i.title ILIKE $${paramCount} OR c.name ILIKE $${paramCount})`;
            params.push(`%${search}%`);
            paramCount++;
        }

        query += ` ORDER BY i.created_at DESC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        // Get total count
        let countQuery = 'SELECT COUNT(*) FROM invoices i LEFT JOIN clients c ON i.client_id = c.id WHERE 1=1';
        const countParams = [];
        let countParamCount = 1;

        if (status) {
            countQuery += ` AND i.payment_status = $${countParamCount}`;
            countParams.push(status);
            countParamCount++;
        }

        if (client_id) {
            countQuery += ` AND i.client_id = $${countParamCount}`;
            countParams.push(client_id);
            countParamCount++;
        }

        if (search) {
            countQuery += ` AND (i.invoice_number ILIKE $${countParamCount} OR i.title ILIKE $${countParamCount} OR c.name ILIKE $${countParamCount})`;
            countParams.push(`%${search}%`);
        }

        const countResult = await db.query(countQuery, countParams);
        const total = parseInt(countResult.rows[0].count);

        res.json({
            invoices: result.rows,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ error: 'Error al obtener facturas' });
    }
};

/**
 * Get invoice by ID
 */
const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT i.*, c.name as client_name, c.email as client_email, c.nif as business_name, c.phone, 
                    c.address as client_address, c.city as client_city, c.postal_code as client_postal_code
             FROM invoices i
             LEFT JOIN clients c ON i.client_id = c.id
             WHERE i.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        // Get payments
        const paymentsResult = await db.query(
            'SELECT * FROM invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
            [id]
        );

        // Get company settings
        const settingsResult = await db.query('SELECT company_name, company_address, company_city, company_postal_code, company_nif, company_phone, company_email, company_website, company_logo FROM crm_settings ORDER BY id DESC LIMIT 1');
        const companySettings = settingsResult.rows[0] || {};

        const invoice = {
            ...result.rows[0],
            payments: paymentsResult.rows,
            company: companySettings
        };

        res.json(invoice);
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ error: 'Error al obtener factura' });
    }
};

/**
 * Create new invoice
 */
const createInvoice = async (req, res) => {
    try {
        const {
            client_id,
            proposal_id,
            title,
            description,
            items,
            tax_rate,
            issue_date,
            due_date,
            notes
        } = req.body;

        // Validation
        if (!client_id || !title || !items || items.length === 0) {
            return res.status(400).json({ error: 'Campos requeridos: client_id, title, items' });
        }

        // Get tax rate from settings if not provided
        let finalTaxRate = tax_rate;
        if (!finalTaxRate) {
            const settingsResult = await db.query('SELECT default_tax_rate FROM crm_settings LIMIT 1');
            finalTaxRate = settingsResult.rows[0]?.default_tax_rate || 21;
        }

        // Calculate totals
        const { subtotal, taxAmount, totalAmount } = calculateInvoiceTotals(items, finalTaxRate);

        if (isNaN(subtotal) || isNaN(taxAmount) || isNaN(totalAmount)) {
            logger.error('Invalid invoice totals:', { subtotal, taxAmount, totalAmount, items });
            return res.status(400).json({ error: 'Error en el cálculo de totales. Verifique los items.' });
        }

        // Generate invoice number and token
        const invoiceNumber = await generateInvoiceNumber();
        const token = uuidv4();

        // Calculate due date if not provided
        let finalDueDate = due_date;
        if (!finalDueDate && issue_date) {
            const settingsResult = await db.query('SELECT invoice_due_days FROM crm_settings LIMIT 1');
            const dueDays = settingsResult.rows[0]?.invoice_due_days || 30;
            const dueDate = new Date(issue_date);
            dueDate.setDate(dueDate.getDate() + dueDays);
            finalDueDate = dueDate.toISOString().split('T')[0];
        }

        const result = await db.query(
            `INSERT INTO invoices (
                invoice_number, client_id, proposal_id, title, description, items,
                subtotal, tax_rate, tax_amount, total_amount, remaining_amount,
                issue_date, due_date, token, notes, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *`,
            [
                invoiceNumber,
                client_id,
                proposal_id || null,
                title,
                description || '',
                JSON.stringify(items),
                subtotal,
                finalTaxRate,
                taxAmount,
                totalAmount,
                totalAmount,
                issue_date || new Date().toISOString().split('T')[0],
                finalDueDate,
                token,
                notes || '',
                req.user?.userId || null
            ]
        );

        // Register activity
        /*
        // TODO: Enable activity logging when activities table supports client_id
        try {
            await db.query(
                `INSERT INTO activities (client_id, type, description, metadata)
                 VALUES ($1, $2, $3, $4)`,
                [
                    client_id,
                    'invoice_created',
                    `Factura "${invoiceNumber}" creada`,
                    JSON.stringify({ invoiceId: result.rows[0].id })
                ]
            );
        } catch (error) {
            console.error('Error logging activity:', error);
        }
        */

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating invoice:', error);
        res.status(500).json({ error: 'Error al crear factura: ' + error.message });
    }
};

/**
 * Update invoice
 */
const updateInvoice = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            title,
            description,
            items,
            tax_rate,
            issue_date,
            due_date,
            notes
        } = req.body;

        // Check if invoice exists
        const checkResult = await db.query('SELECT * FROM invoices WHERE id = $1', [id]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        const currentInvoice = checkResult.rows[0];

        // Recalculate totals if items changed
        let subtotal = currentInvoice.subtotal;
        let taxAmount = currentInvoice.tax_amount;
        let totalAmount = currentInvoice.total_amount;
        let remainingAmount = currentInvoice.remaining_amount;

        if (items) {
            const finalTaxRate = tax_rate || currentInvoice.tax_rate;
            const totals = calculateInvoiceTotals(items, finalTaxRate);
            subtotal = totals.subtotal;
            taxAmount = totals.taxAmount;
            totalAmount = totals.totalAmount;
            // Recalculate remaining based on new total
            remainingAmount = totalAmount - currentInvoice.paid_amount;
        }

        const result = await db.query(
            `UPDATE invoices SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                items = COALESCE($3, items),
                tax_rate = COALESCE($4, tax_rate),
                subtotal = $5,
                tax_amount = $6,
                total_amount = $7,
                remaining_amount = $8,
                issue_date = COALESCE($9, issue_date),
                due_date = COALESCE($10, due_date),
                notes = COALESCE($11, notes),
                updated_at = CURRENT_TIMESTAMP
             WHERE id = $12
             RETURNING *`,
            [
                title, description, items ? JSON.stringify(items) : null, tax_rate,
                subtotal, taxAmount, totalAmount, remainingAmount,
                issue_date, due_date, notes, id
            ]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating invoice:', error);
        res.status(500).json({ error: 'Error al actualizar factura' });
    }
};

/**
 * Delete invoice
 */
const deleteInvoice = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query('DELETE FROM invoices WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        res.json({ message: 'Factura eliminada exitosamente' });
    } catch (error) {
        console.error('Error deleting invoice:', error);
        res.status(500).json({ error: 'Error al eliminar factura' });
    }
};

/**
 * Resend invoice email
 */
const resendInvoiceEmail = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            `SELECT i.*, c.name, c.email, c.nif as business_name
             FROM invoices i
             JOIN clients c ON i.client_id = c.id
             WHERE i.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        const invoice = result.rows[0];
        const client = {
            name: invoice.name,
            email: invoice.email
        };

        if (!client.email) {
            return res.status(400).json({ error: 'El cliente no tiene email' });
        }

        try {
            await sendInvoiceEmail(invoice, client);
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            return res.status(500).json({ error: 'Error al enviar el email: ' + (emailError.message || 'Error desconocido') });
        }

        // Update email sent status
        await db.query(
            'UPDATE invoices SET email_sent = true, email_sent_at = CURRENT_TIMESTAMP WHERE id = $1',
            [id]
        );

        // Register activity
        /*
        // TODO: Enable activity logging when activities table supports client_id
        await db.query(
            `INSERT INTO activities (client_id, type, description, metadata)
             VALUES ($1, $2, $3, $4)`,
            [
                invoice.client_id,
                'invoice_sent',
                `Factura "${invoice.invoice_number}" enviada por email`,
                JSON.stringify({ invoiceId: id })
            ]
        );
        */

        res.json({ message: 'Factura enviada exitosamente' });
    } catch (error) {
        console.error('Error resending invoice:', error);
        res.status(500).json({ error: 'Error al enviar factura' });
    }
};

/**
 * Get public invoice by token
 */
const getPublicInvoice = async (req, res) => {
    try {
        const { token } = req.params;

        const result = await db.query(
            `SELECT i.*, c.name as client_name, c.email as client_email, c.nif as business_name, c.address as client_address, c.city as client_city, c.postal_code as client_postal_code, c.phone as client_phone
             FROM invoices i
             LEFT JOIN clients c ON i.client_id = c.id
             WHERE i.token = $1`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada' });
        }

        const invoice = result.rows[0];

        // Register view if it's a new view (simple logic for now)
        // We could implement a more robust view tracking system
        await db.query(
            'UPDATE invoices SET view_count = view_count + 1, viewed = true, viewed_at = COALESCE(viewed_at, CURRENT_TIMESTAMP) WHERE id = $1',
            [invoice.id]
        );

        // Get payments
        const paymentsResult = await db.query(
            'SELECT * FROM invoice_payments WHERE invoice_id = $1 ORDER BY payment_date DESC',
            [invoice.id]
        );

        // Get company settings
        const settingsResult = await db.query('SELECT company_name, company_address, company_city, company_postal_code, company_nif, company_phone, company_email, company_website, company_logo FROM crm_settings ORDER BY id DESC LIMIT 1');
        const companySettings = settingsResult.rows[0] || {};

        const finalInvoice = {
            ...invoice,
            payments: paymentsResult.rows,
            company: companySettings
        };

        res.json(finalInvoice);
    } catch (error) {
        console.error('Error fetching public invoice:', error);
        res.status(500).json({ error: 'Error al obtener factura pública' });
    }
};

module.exports = {
    getInvoices,
    getInvoiceById,
    getPublicInvoice,
    createInvoice,
    updateInvoice,
    deleteInvoice,
    resendInvoiceEmail
};
