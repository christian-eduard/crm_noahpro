const db = require('../config/database');
const invoiceNumberService = require('./invoiceNumberService');
const clientService = require('./clientService');
const { sendInvoiceEmail } = require('./invoiceEmailService');

/**
 * Auto-Invoice Service
 * Handles automatic invoice creation from accepted proposals
 */

/**
 * Get invoice configuration from crm_settings
 */
const getInvoiceSettings = async () => {
    try {
        const result = await db.query(
            `SELECT 
                invoice_prefix,
                next_invoice_number,
                default_tax_rate,
                invoice_due_days,
                auto_invoice_on_proposal_accept
             FROM crm_settings 
             LIMIT 1`
        );

        if (result.rows.length === 0) {
            // Return defaults if no settings found
            return {
                invoice_prefix: 'INV',
                next_invoice_number: 1,
                default_tax_rate: 21,
                invoice_due_days: 30,
                auto_invoice_on_proposal_accept: false
            };
        }

        return result.rows[0];
    } catch (error) {
        console.error('Error getting invoice settings:', error);
        throw error;
    }
};

/**
 * Map proposal items to invoice items format
 * Both use the same structure, so this is a direct copy
 */
const mapProposalItemsToInvoiceItems = (proposalItems) => {
    if (!proposalItems || !Array.isArray(proposalItems)) {
        return [];
    }

    return proposalItems.map(item => ({
        description: item.description || '',
        quantity: parseFloat(item.quantity) || 1,
        price: parseFloat(item.price) || 0,
        total: parseFloat(item.total) || (parseFloat(item.quantity) * parseFloat(item.price))
    }));
};

/**
 * Create invoice from accepted proposal
 * @param {Object} proposal - The accepted proposal
 * @param {Object} lead - The lead associated with the proposal
 * @returns {Object|null} - Created invoice or null if auto-invoice is disabled
 */
const createInvoiceFromProposal = async (proposal, lead) => {
    try {
        // Get invoice settings
        const settings = await getInvoiceSettings();

        // Check if auto-invoice is enabled
        if (!settings.auto_invoice_on_proposal_accept) {
            console.log('Auto-invoice is disabled in settings');
            return null;
        }

        // Convert lead to client (or get existing client)
        console.log(`Converting lead ${lead.id} to client...`);
        const client = await clientService.getOrCreateClientFromLead(lead.id, lead);
        console.log(`Client ${client.id} ready for invoice creation`);

        // Extract items from proposal content_json
        let proposalItems = [];
        if (proposal.content_json && typeof proposal.content_json === 'object') {
            proposalItems = proposal.content_json.items || [];
        } else if (typeof proposal.content_json === 'string') {
            try {
                const parsed = JSON.parse(proposal.content_json);
                proposalItems = parsed.items || [];
            } catch (e) {
                console.error('Error parsing proposal content_json:', e);
            }
        }

        // Map items to invoice format
        const invoiceItems = mapProposalItemsToInvoiceItems(proposalItems);

        if (invoiceItems.length === 0) {
            console.log('No items found in proposal, skipping auto-invoice');
            return null;
        }

        // Calculate totals
        const subtotal = invoiceItems.reduce((sum, item) => sum + item.total, 0);
        const taxRate = settings.default_tax_rate || 21;
        const taxAmount = (subtotal * taxRate) / 100;
        const totalAmount = subtotal + taxAmount;

        // Calculate dates
        const issueDate = new Date();
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (settings.invoice_due_days || 30));

        // Generate invoice number
        const invoiceNumber = await invoiceNumberService.generateInvoiceNumber();

        // Generate unique token for public access
        const { v4: uuidv4 } = require('uuid');
        const token = uuidv4();

        // Create invoice
        const result = await db.query(
            `INSERT INTO invoices (
                client_id, invoice_number, token, title, description,
                items, tax_rate, subtotal, tax_amount, total_amount,
                issue_date, due_date, notes, payment_status,
                paid_amount, remaining_amount, proposal_id
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *`,
            [
                client.id,
                invoiceNumber,
                token,
                proposal.title,
                proposal.description || '',
                JSON.stringify(invoiceItems),
                taxRate,
                subtotal,
                taxAmount,
                totalAmount,
                issueDate,
                dueDate,
                `Generada automáticamente desde propuesta aceptada el ${new Date(proposal.accepted_at || new Date()).toLocaleDateString('es-ES')}`,
                'pending',
                0,
                totalAmount,
                proposal.id
            ]
        );

        const invoice = result.rows[0];

        // Register activity
        await db.query(
            `INSERT INTO activities (lead_id, type, description, metadata)
             VALUES ($1, $2, $3, $4)`,
            [
                lead.id,
                'invoice_created',
                `Factura ${invoiceNumber} creada automáticamente desde propuesta "${proposal.title}"`,
                JSON.stringify({
                    invoiceId: invoice.id,
                    invoiceNumber: invoiceNumber,
                    proposalId: proposal.id,
                    proposalTitle: proposal.title,
                    totalAmount: totalAmount,
                    autoGenerated: true
                })
            ]
        );

        // Send email to client
        try {
            await sendInvoiceEmail(invoice, client);

            // Update email sent status
            await db.query(
                'UPDATE invoices SET email_sent = true, email_sent_at = CURRENT_TIMESTAMP WHERE id = $1',
                [invoice.id]
            );

            console.log(`Invoice email sent to ${client.email}`);
        } catch (emailError) {
            console.error('Error sending auto-invoice email:', emailError);
            // Don't fail the whole process if email fails
        }

        console.log(`Auto-invoice ${invoiceNumber} created successfully for client ${client.id} (from lead ${lead.id})`);
        return invoice;

    } catch (error) {
        console.error('Error creating auto-invoice:', error);
        throw error;
    }
};

/**
 * Check if an invoice already exists for a proposal
 * @param {number} proposalId - The proposal ID
 * @returns {boolean} - True if invoice exists
 */
const invoiceExistsForProposal = async (proposalId) => {
    try {
        const result = await db.query(
            `SELECT COUNT(*) as count
             FROM invoices i
             WHERE i.notes LIKE $1`,
            [`%propuesta%${proposalId}%`]
        );

        return parseInt(result.rows[0].count) > 0;
    } catch (error) {
        console.error('Error checking if invoice exists:', error);
        return false;
    }
};

module.exports = {
    createInvoiceFromProposal,
    mapProposalItemsToInvoiceItems,
    getInvoiceSettings,
    invoiceExistsForProposal
};
