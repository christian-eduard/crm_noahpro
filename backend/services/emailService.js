const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const db = require('../config/database');

// Create transporter dynamically using database settings
const createTransporter = async () => {
    try {
        // Fetch SMTP settings from database
        const result = await db.query('SELECT * FROM crm_settings LIMIT 1');

        if (result.rows.length === 0 || !result.rows[0].smtp_host) {
            console.error('No SMTP settings found in database');
            return null;
        }

        const settings = result.rows[0];

        return nodemailer.createTransport({
            host: settings.smtp_host,
            port: settings.smtp_port || 587,
            secure: settings.smtp_secure || false,
            auth: {
                user: settings.smtp_user,
                pass: settings.smtp_password
            }
        });
    } catch (error) {
        console.error('Error creating email transporter:', error);
        return null;
    }
};

const readTemplate = (templateName, replacements) => {
    try {
        const templatePath = path.join(__dirname, '../templates', templateName);
        let html = fs.readFileSync(templatePath, 'utf8');

        // Add common replacements
        replacements.year = new Date().getFullYear();
        replacements.frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

        for (const key in replacements) {
            const regex = new RegExp(`{{${key}}}`, 'g');
            html = html.replace(regex, replacements[key] || '');
        }
        return html;
    } catch (error) {
        console.error(`Error reading template ${templateName}:`, error);
        return '';
    }
};

const sendEmail = async (to, subject, html) => {
    try {
        const transporter = await createTransporter();

        if (!transporter) {
            console.error('No transporter available - SMTP not configured');
            return null;
        }

        // Get sender info from database
        const settingsResult = await db.query('SELECT smtp_from_name, smtp_from_email FROM crm_settings LIMIT 1');
        const fromName = settingsResult.rows[0]?.smtp_from_name || 'NoahPro CRM';
        const fromEmail = settingsResult.rows[0]?.smtp_from_email || 'noreply@noahpro.com';

        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            html
        });
        console.log('Message sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending email:', error);
        return null;
    }
};

const sendWelcomeEmail = async (lead) => {
    const subject = '✅ Hemos recibido tu solicitud - NoahPro Tpv';
    const html = readTemplate('welcome.html', {
        name: lead.name,
        businessName: lead.business_name || 'tu negocio'
    });
    return sendEmail(lead.email, subject, html);
};

const sendNotificationEmail = async (lead) => {
    const subject = `🎯 Nuevo Lead: ${lead.name} - ${lead.business_name || 'Sin nombre'}`;
    const html = readTemplate('notification.html', {
        name: lead.name,
        email: lead.email,
        phone: lead.phone || 'No proporcionado',
        businessName: lead.business_name || 'No proporcionado',
        message: lead.message || 'Sin mensaje',
        source: lead.source || 'web',
        dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/crm/dashboard`
    });
    return sendEmail('desarrollo@noahpro.com', subject, html);
};

const sendProposalEmail = async (lead, proposal, proposalUrl) => {
    const subject = `📋 Propuesta Comercial: ${proposal.title} - NoahPro`;
    const html = readTemplate('proposal.html', {
        name: lead.name,
        businessName: lead.business_name || lead.name,
        proposalTitle: proposal.title,
        proposalPrice: parseFloat(proposal.total_price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' }),
        proposalUrl
    });

    return sendEmail(lead.email, subject, html);
};

const sendCommercialWelcomeEmail = async (user) => {
    const subject = '🚀 Bienvenido al equipo de NoahPro';

    // Leer plantilla
    const html = readTemplate('welcome_commercial.html', {
        name: user.full_name,
        username: user.username,
        password: user.password,
        dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/crm/login`
    });

    try {
        // Timeout de 5 segundos para evitar bloqueos
        const emailPromise = (async () => {
            const transporter = await createTransporter();
            if (!transporter) return null;

            const settingsResult = await db.query('SELECT smtp_from_name, smtp_from_email FROM crm_settings LIMIT 1');
            const fromName = settingsResult.rows[0]?.smtp_from_name || 'NoahPro CRM';
            const fromEmail = settingsResult.rows[0]?.smtp_from_email || 'noreply@noahpro.com';

            const info = await transporter.sendMail({
                from: `"${fromName}" <${fromEmail}>`,
                to: user.email,
                subject,
                html
            });

            console.log('Welcome commercial email sent: %s', info.messageId);
            return info;
        })();

        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Email timeout')), 5000)
        );

        return await Promise.race([emailPromise, timeoutPromise]);
    } catch (error) {
        console.error('Error sending commercial welcome email:', error);
        return null;
    }
};

const sendSupportTicketEmail = async (ticket, commercial, message) => {
    const priorityLabels = { low: 'Baja', normal: 'Normal', high: 'Alta', urgent: 'Urgente' };
    const subject = `🎫 Nuevo Ticket de Soporte: ${ticket.subject}`;

    const html = readTemplate('support_ticket.html', {
        commercialName: commercial.full_name,
        commercialEmail: commercial.email,
        priority: ticket.priority || 'normal',
        priorityLabel: priorityLabels[ticket.priority] || 'Normal',
        subject: ticket.subject,
        message: message.replace(/\n/g, '<br>'),
        dashboardUrl: `${process.env.FRONTEND_URL || 'http://localhost:5174'}/crm/commercials`
    });

    try {
        // Obtener emails de todos los admins
        const adminsResult = await db.query("SELECT email FROM users WHERE role = 'admin'");
        const adminEmails = adminsResult.rows.map(r => r.email).join(', ');

        if (!adminEmails) {
            console.error('No admin emails found');
            return null;
        }

        const transporter = await createTransporter();
        if (!transporter) return null;

        const settingsResult = await db.query('SELECT smtp_from_name, smtp_from_email FROM crm_settings LIMIT 1');
        const fromName = settingsResult.rows[0]?.smtp_from_name || 'NoahPro CRM';
        const fromEmail = settingsResult.rows[0]?.smtp_from_email || 'noreply@noahpro.com';

        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to: adminEmails,
            subject,
            html
        });

        console.log('Support ticket email sent: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('Error sending support ticket email:', error);
        return null;
    }
};

/**
 * Enviar invitación de entrevista a candidato
 */
const sendInterviewInvitation = async ({ to, candidateName, interviewUrl, templateName, expiresAt }) => {
    const subject = `🎯 Invitación a Entrevista - ${templateName}`;

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f9fafb; padding: 30px; }
                .button { display: inline-block; background: #f97316; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎯 Invitación a Entrevista - NoahPro CRM</h1>
                </div>
                <div class="content">
                    <h2>¡Hola ${candidateName}!</h2>
                    <p>Nos ha encantado tu perfil y queremos conocerte mejor.</p>
                    <p>Hemos preparado una <strong>entrevista con IA</strong> personalizada para ti.</p>
                    
                    <h3>📋 Detalles:</h3>
                    <ul>
                        <li><strong>Tipo:</strong> ${templateName}</li>
                        <li><strong>Válido hasta:</strong> ${new Date(expiresAt).toLocaleDateString('es-ES')}</li>
                    </ul>

                    <p style="text-align: center;">
                        <a href="${interviewUrl}" class="button">🚀 Iniciar Entrevista</a>
                    </p>

                    <p style="color: #ef4444;"><strong>⏰ Este enlace expira el ${new Date(expiresAt).toLocaleDateString('es-ES')}</strong></p>
                </div>
                <div class="footer">
                    <p>NoahPro CRM - AI Talent Hunter</p>
                </div>
            </div>
        </body>
        </html>
    `;

    return sendEmail(to, subject, html);
};

/**
 * Notificar a admin de nueva postulación
 */
const notifyNewApplication = async ({ adminEmail, candidateName, candidateEmail }) => {
    const subject = `🆕 Nueva Postulación: ${candidateName}`;

    const html = `
        <h2>🆕 Nueva Postulación Recibida</h2>
        <p>Un nuevo candidato se ha postulado:</p>
        <ul>
            <li><strong>Nombre:</strong> ${candidateName}</li>
            <li><strong>Email:</strong> ${candidateEmail}</li>
        </ul>
        <p>Revisa el perfil en el panel de administración.</p>
    `;

    return sendEmail(adminEmail, subject, html);
};

module.exports = {
    sendEmail,
    sendWelcomeEmail,
    sendNotificationEmail,
    sendProposalEmail,
    sendCommercialWelcomeEmail,
    sendSupportTicketEmail,
    sendInterviewInvitation,
    notifyNewApplication
};
