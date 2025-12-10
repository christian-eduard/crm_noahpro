const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const db = require('../config/database');

/**
 * Invoice Email Service
 * Handles sending invoice and receipt emails using templates
 */

// Create reusable transporter dynamically based on settings
const createConfiguredTransporter = async () => {
    let smtpSettings = {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    };

    try {
        const result = await db.query('SELECT smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure FROM crm_settings LIMIT 1');
        if (result.rows.length > 0 && result.rows[0].smtp_host) {
            const dbSettings = result.rows[0];
            smtpSettings = {
                host: dbSettings.smtp_host,
                port: dbSettings.smtp_port,
                secure: dbSettings.smtp_secure,
                user: dbSettings.smtp_user,
                pass: dbSettings.smtp_password
            };
        }
    } catch (error) {
        console.warn('Error fetching SMTP settings from DB, using defaults:', error.message);
    }

    return nodemailer.createTransport({
        host: smtpSettings.host,
        port: smtpSettings.port,
        secure: smtpSettings.secure,
        auth: {
            user: smtpSettings.user,
            pass: smtpSettings.pass
        }
    });
};

/**
 * Replace template variables with actual values
 */
const replaceVariables = (template, variables) => {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
        const regex = new RegExp(`{{${key}}}`, 'g');
        result = result.replace(regex, value || '');
    }
    return result;
};

/**
 * Format currency to EUR
 */
const formatCurrency = (amount) => {
    return new Intl.NumberFormat('es-ES', {
        style: 'currency',
        currency: 'EUR'
    }).format(amount);
};

/**
 * Format date to Spanish format
 */
const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

/**
 * Get payment status text in Spanish
 */
const getPaymentStatusText = (status) => {
    const statusMap = {
        'pending': 'Pendiente',
        'partial': 'Pago Parcial',
        'paid': 'Pagada'
    };
    return statusMap[status] || 'Pendiente';
};

/**
 * Send invoice email to client
 */
const sendInvoiceEmail = async (invoice, client) => {
    try {
        // Get sender info settings
        let fromName = process.env.EMAIL_FROM_NAME || 'NoahPro CRM';
        let fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;

        try {
            const settingsResult = await db.query('SELECT smtp_from_name, smtp_from_email, smtp_user FROM crm_settings LIMIT 1');
            if (settingsResult.rows.length > 0) {
                const s = settingsResult.rows[0];
                if (s.smtp_from_name) fromName = s.smtp_from_name;
                if (s.smtp_from_email) fromEmail = s.smtp_from_email;
                else if (s.smtp_user) fromEmail = s.smtp_user;
            }
        } catch (e) {
            console.warn('Error fetching sender settings:', e.message);
        }

        // Read template
        const templatePath = path.join(__dirname, '../templates/invoice.html');
        const template = await fs.readFile(templatePath, 'utf-8');

        // Prepare variables
        const variables = {
            clientName: client.name,
            invoiceNumber: invoice.invoice_number,
            invoiceTitle: invoice.title,
            invoiceDescription: invoice.description || 'Factura por servicios prestados',
            issueDate: formatDate(invoice.issue_date),
            dueDate: formatDate(invoice.due_date),
            totalAmount: formatCurrency(invoice.total_amount),
            paymentStatus: invoice.payment_status,
            paymentStatusText: getPaymentStatusText(invoice.payment_status),
            invoiceUrl: `${process.env.APP_URL || 'http://localhost:5173'}/invoice/${invoice.token}`,
            trackingPixelUrl: `${process.env.API_URL || 'http://localhost:3002'}/api/invoices/public/${invoice.token}/track-open`,
            year: new Date().getFullYear()
        };

        // Replace variables in template
        const html = replaceVariables(template, variables);

        // Send email
        const transporter = await createConfiguredTransporter();
        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: client.email,
            subject: `Factura ${invoice.invoice_number}`,
            html
        });

        console.log(`Invoice email sent to ${client.email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('Error sending invoice email:', error);
        throw error;
    }
};

/**
 * Send receipt email to client
 */
const sendReceiptEmail = async (payment, invoice, client) => {
    try {
        // Get sender info settings
        let fromName = process.env.EMAIL_FROM_NAME || 'NoahPro CRM';
        let fromEmail = process.env.EMAIL_FROM || process.env.SMTP_USER;

        try {
            const settingsResult = await db.query('SELECT smtp_from_name, smtp_from_email, smtp_user FROM crm_settings LIMIT 1');
            if (settingsResult.rows.length > 0) {
                const s = settingsResult.rows[0];
                if (s.smtp_from_name) fromName = s.smtp_from_name;
                if (s.smtp_from_email) fromEmail = s.smtp_from_email;
                else if (s.smtp_user) fromEmail = s.smtp_user;
            }
        } catch (e) {
            console.warn('Error fetching sender settings:', e.message);
        }

        // Read template
        const templatePath = path.join(__dirname, '../templates/receipt.html');
        const template = await fs.readFile(templatePath, 'utf-8');

        // Calculate invoice status message
        let invoiceStatusMessage = '';
        if (invoice.payment_status === 'paid') {
            invoiceStatusMessage = 'La factura ha sido pagada completamente. ¡Gracias!';
        } else if (invoice.payment_status === 'partial') {
            const remaining = invoice.remaining_amount;
            invoiceStatusMessage = `Pago parcial recibido. Pendiente: ${formatCurrency(remaining)}`;
        } else {
            invoiceStatusMessage = 'Pago recibido y registrado correctamente.';
        }

        // Prepare variables
        const variables = {
            clientName: client.name,
            receiptNumber: payment.receipt_number,
            invoiceNumber: invoice.invoice_number,
            paymentDate: formatDate(payment.payment_date),
            paymentMethod: payment.payment_method || 'Transferencia',
            paymentAmount: formatCurrency(payment.amount),
            invoiceStatusMessage,
            invoiceUrl: `${process.env.APP_URL || 'http://localhost:5173'}/invoice/${invoice.token}`,
            year: new Date().getFullYear()
        };

        // Replace variables in template
        const html = replaceVariables(template, variables);

        // Send email
        const transporter = await createConfiguredTransporter();
        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: client.email,
            subject: `Recibo de Pago ${payment.receipt_number}`,
            html
        });

        console.log(`Receipt email sent to ${client.email}: ${info.messageId}`);
        return { success: true, messageId: info.messageId };

    } catch (error) {
        console.error('Error sending receipt email:', error);
        throw error;
    }
};

module.exports = {
    sendInvoiceEmail,
    sendReceiptEmail
};
