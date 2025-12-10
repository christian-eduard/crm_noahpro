const db = require('../config/database');

// Get SMTP settings
const getSMTPSettings = async (req, res) => {
    try {
        const result = await db.query(
            `SELECT smtp_host, smtp_port, smtp_user, smtp_secure, smtp_from_name, smtp_from_email
             FROM crm_settings
             LIMIT 1`
        );

        if (result.rows.length === 0) {
            return res.json({
                smtp_host: '',
                smtp_port: 587,
                smtp_user: '',
                smtp_secure: true,
                smtp_from_name: 'NoahPro CRM',
                smtp_from_email: ''
            });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting SMTP settings:', error);
        res.status(500).json({ error: 'Error al obtener configuración SMTP' });
    }
};

// Update SMTP settings
const updateSMTPSettings = async (req, res) => {
    try {
        const { smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, smtp_from_name, smtp_from_email } = req.body;

        if (!smtp_host || !smtp_port || !smtp_user || !smtp_from_email) {
            return res.status(400).json({ error: 'Faltan campos requeridos' });
        }

        // Check if settings exist
        const existing = await db.query('SELECT id FROM crm_settings LIMIT 1');

        if (existing.rows.length === 0) {
            // Insert new settings
            await db.query(
                `INSERT INTO crm_settings (smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, smtp_from_name, smtp_from_email)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, smtp_from_name, smtp_from_email]
            );
        } else {
            // Update existing settings
            const updateFields = [];
            const values = [];
            let paramCount = 1;

            if (smtp_host !== undefined) {
                updateFields.push(`smtp_host = $${paramCount++}`);
                values.push(smtp_host);
            }
            if (smtp_port !== undefined) {
                updateFields.push(`smtp_port = $${paramCount++}`);
                values.push(smtp_port);
            }
            if (smtp_user !== undefined) {
                updateFields.push(`smtp_user = $${paramCount++}`);
                values.push(smtp_user);
            }
            if (smtp_password !== undefined && smtp_password !== '') {
                updateFields.push(`smtp_password = $${paramCount++}`);
                values.push(smtp_password);
            }
            if (smtp_secure !== undefined) {
                updateFields.push(`smtp_secure = $${paramCount++}`);
                values.push(smtp_secure);
            }
            if (smtp_from_name !== undefined) {
                updateFields.push(`smtp_from_name = $${paramCount++}`);
                values.push(smtp_from_name);
            }
            if (smtp_from_email !== undefined) {
                updateFields.push(`smtp_from_email = $${paramCount++}`);
                values.push(smtp_from_email);
            }

            if (updateFields.length > 0) {
                await db.query(
                    `UPDATE crm_settings SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP`,
                    values
                );
            }
        }

        res.json({ message: 'Configuración SMTP actualizada correctamente' });
    } catch (error) {
        console.error('Error updating SMTP settings:', error);
        res.status(500).json({ error: 'Error al actualizar configuración SMTP' });
    }
};

// Test SMTP connection
const testSMTPConnection = async (req, res) => {
    try {
        let { smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, smtp_from_name, smtp_from_email, testEmail } = req.body;
        console.log('SMTP Test Request:', { smtp_host, smtp_port, smtp_user, smtp_secure, hasPassword: !!smtp_password, testEmail });

        const nodemailer = require('nodemailer');

        // If password is not provided, fetch from database
        if (!smtp_password) {
            console.log('Fetching SMTP password from database...');
            const result = await db.query('SELECT smtp_password FROM crm_settings LIMIT 1');
            if (result.rows.length > 0) {
                smtp_password = result.rows[0].smtp_password;
                console.log('SMTP password fetched from DB:', !!smtp_password);
            } else {
                console.log('No settings found in DB');
            }
        }

        if (!smtp_password) {
            console.error('SMTP Error: No password provided or found');
            return res.status(400).json({
                success: false,
                message: 'No se proporcionó contraseña y no se encontró ninguna guardada.'
            });
        }

        // If from_name or from_email not provided, fetch from database
        if (!smtp_from_name || !smtp_from_email) {
            const result = await db.query('SELECT smtp_from_name, smtp_from_email FROM crm_settings LIMIT 1');
            if (result.rows.length > 0) {
                smtp_from_name = smtp_from_name || result.rows[0].smtp_from_name || 'NoahPro CRM';
                smtp_from_email = smtp_from_email || result.rows[0].smtp_from_email || smtp_user;
            } else {
                smtp_from_name = smtp_from_name || 'NoahPro CRM';
                smtp_from_email = smtp_from_email || smtp_user;
            }
        }

        const transporter = nodemailer.createTransport({
            host: smtp_host,
            port: smtp_port,
            secure: smtp_secure,
            auth: {
                user: smtp_user,
                pass: smtp_password
            }
        });

        // First verify the connection
        await transporter.verify();

        // If testEmail is provided, send an actual test email
        if (testEmail) {
            const mailOptions = {
                from: `"${smtp_from_name}" <${smtp_from_email}>`,
                to: testEmail,
                subject: '✅ Prueba de Configuración SMTP - NoahPro CRM',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                        <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                            <h1 style="color: white; margin: 0; font-size: 24px;">✅ Configuración SMTP Exitosa</h1>
                        </div>
                        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                            <p style="color: #374151; font-size: 16px; line-height: 1.6;">
                                ¡Excelente! Tu configuración SMTP está funcionando correctamente.
                            </p>
                            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                                <h3 style="color: #1f2937; margin-top: 0;">Detalles de la Prueba:</h3>
                                <ul style="color: #6b7280; line-height: 1.8;">
                                    <li><strong>Servidor SMTP:</strong> ${smtp_host}:${smtp_port}</li>
                                    <li><strong>Usuario:</strong> ${smtp_user}</li>
                                    <li><strong>Conexión Segura:</strong> ${smtp_secure ? 'Sí (TLS/SSL)' : 'No'}</li>
                                    <li><strong>Email de Prueba:</strong> ${testEmail}</li>
                                </ul>
                            </div>
                            <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
                                Este es un correo de prueba automático generado por NoahPro CRM para verificar la configuración de tu servidor SMTP.
                            </p>
                            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
                            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                                NoahPro CRM - Sistema de Gestión de Leads<br>
                                ${new Date().toLocaleString('es-ES')}
                            </p>
                        </div>
                    </div>
                `,
                text: `
✅ Configuración SMTP Exitosa

¡Excelente! Tu configuración SMTP está funcionando correctamente.

Detalles de la Prueba:
- Servidor SMTP: ${smtp_host}:${smtp_port}
- Usuario: ${smtp_user}
- Conexión Segura: ${smtp_secure ? 'Sí (TLS/SSL)' : 'No'}
- Email de Prueba: ${testEmail}

Este es un correo de prueba automático generado por NoahPro CRM.

NoahPro CRM - Sistema de Gestión de Leads
${new Date().toLocaleString('es-ES')}
                `
            };

            await transporter.sendMail(mailOptions);
            console.log('Test email sent successfully to:', testEmail);
        }

        res.json({
            success: true,
            message: testEmail ? `Email de prueba enviado a ${testEmail}` : 'Conexión SMTP exitosa'
        });
    } catch (error) {
        console.error('SMTP test error:', error);
        res.status(400).json({
            success: false,
            message: 'Error de conexión SMTP',
            error: error.message
        });
    }
};

// Send a test email using the provided SMTP config
const sendTestEmail = async (req, res) => {
    try {
        const { email, smtp_config } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Se requiere un email de destino' });
        }

        const nodemailer = require('nodemailer');

        // Get SMTP config from request or database
        let config = smtp_config || {};

        // If config is incomplete, fetch from database
        if (!config.host || !config.user) {
            const result = await db.query(
                'SELECT smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, smtp_from_name, smtp_from_email FROM crm_settings LIMIT 1'
            );
            if (result.rows.length > 0) {
                const dbConfig = result.rows[0];
                config = {
                    host: config.host || dbConfig.smtp_host,
                    port: config.port || dbConfig.smtp_port || 587,
                    secure: config.secure !== undefined ? config.secure : dbConfig.smtp_secure,
                    user: config.user || dbConfig.smtp_user,
                    password: config.password || dbConfig.smtp_password,
                    from_name: config.from_name || dbConfig.smtp_from_name || 'NoahPro CRM',
                    from_email: config.from_email || dbConfig.smtp_from_email
                };
            }
        }

        if (!config.host || !config.user || !config.password) {
            return res.status(400).json({ error: 'Configuración SMTP incompleta. Guarda primero la configuración.' });
        }

        const transporter = nodemailer.createTransport({
            host: config.host,
            port: config.port,
            secure: config.secure,
            auth: {
                user: config.user,
                pass: config.password
            }
        });

        await transporter.verify();

        const mailOptions = {
            from: `"${config.from_name}" <${config.from_email || config.user}>`,
            to: email,
            subject: '✅ Prueba de Configuración SMTP - NoahPro CRM',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #f97316 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
                        <h1 style="color: white; margin: 0; font-size: 24px;">✅ Correo de Prueba Exitoso</h1>
                    </div>
                    <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb;">
                        <p style="color: #374151; font-size: 16px;">
                            Tu configuración SMTP está funcionando correctamente.
                        </p>
                        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f97316;">
                            <p><strong>Servidor:</strong> ${config.host}:${config.port}</p>
                            <p><strong>Conexión Segura:</strong> ${config.secure ? 'Sí' : 'No'}</p>
                            <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                        </div>
                    </div>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: `Correo enviado a ${email}` });
    } catch (error) {
        console.error('Error sending test email:', error);
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    getSMTPSettings,
    updateSMTPSettings,
    testSMTPConnection,
    sendTestEmail
};
