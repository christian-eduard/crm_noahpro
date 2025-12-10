const db = require('../config/database');

// Obtener configuración pública (sin secretos)
const getPublicSettings = async (req, res) => {
    try {
        console.log('Fetching public settings...');
        const result = await db.query('SELECT demo_url, chat_title, chat_welcome_message, chat_primary_color, chat_enabled, pusher_key, pusher_cluster, pusher_app_id FROM crm_settings ORDER BY id DESC LIMIT 1');
        console.log('Query result:', result.rows);

        if (result.rows.length === 0) {
            console.log('No settings found, returning defaults');
            return res.json({
                demo_url: 'http://localhost:5173/demo',
                chat_enabled: true,
                pusher_cluster: 'eu'
            });
        }

        console.log('Returning settings:', result.rows[0]);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting public settings:', error);
        console.error('Error stack:', error.stack);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
};

// Obtener configuración completa (admin)
const getSettings = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM crm_settings ORDER BY id DESC LIMIT 1');
        // ... rest of getSettings

        if (result.rows.length === 0) {
            // Crear configuración por defecto si no existe
            const defaultSettings = await db.query(
                'INSERT INTO crm_settings (demo_url) VALUES ($1) RETURNING *',
                ['http://localhost:5173/demo']
            );
            return res.json(defaultSettings.rows[0]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting settings:', error);
        res.status(500).json({ error: 'Error al obtener configuración' });
    }
};

// Actualizar configuración
const updateSettings = async (req, res) => {
    try {
        const {
            demo_url = null,
            chat_title = null,
            chat_welcome_message = null,
            chat_primary_color = null,
            chat_enabled = null,
            pusher_app_id = null,
            pusher_key = null,
            pusher_secret = null,
            pusher_cluster = null,
            // Invoice settings
            invoice_prefix = null,
            next_invoice_number = null,
            default_tax_rate = null,
            invoice_due_days = null,
            auto_invoice_on_proposal_accept = null,
            // Company settings
            company_name = null,
            company_address = null,
            company_city = null,
            company_postal_code = null,
            company_nif = null,
            company_phone = null,
            company_email = null,
            company_website = null,
            company_logo = null,
            // SMTP settings
            smtp_host = null,
            smtp_port = null,
            smtp_user = null,
            smtp_password = null,
            smtp_secure = null,
            smtp_from_name = null,
            smtp_from_email = null
        } = req.body;

        // Validar URL solo si se proporciona
        if (demo_url) {
            try {
                new URL(demo_url);
            } catch (e) {
                return res.status(400).json({ error: 'URL inválida' });
            }
        }

        const result = await db.query(
            `UPDATE crm_settings 
             SET demo_url = COALESCE($1, demo_url), 
                 chat_title = COALESCE($2, chat_title),
                 chat_welcome_message = COALESCE($3, chat_welcome_message),
                 chat_primary_color = COALESCE($4, chat_primary_color),
                 chat_enabled = COALESCE($5, chat_enabled),
                 pusher_app_id = COALESCE($6, pusher_app_id),
                 pusher_key = COALESCE($7, pusher_key),
                 pusher_secret = COALESCE($8, pusher_secret),
                 pusher_cluster = COALESCE($9, pusher_cluster),
                 invoice_prefix = COALESCE($10, invoice_prefix),
                 next_invoice_number = COALESCE($11, next_invoice_number),
                 default_tax_rate = COALESCE($12, default_tax_rate),
                 invoice_due_days = COALESCE($13, invoice_due_days),
                 auto_invoice_on_proposal_accept = COALESCE($14, auto_invoice_on_proposal_accept),
                 company_name = COALESCE($15, company_name),
                 company_address = COALESCE($16, company_address),
                 company_city = COALESCE($17, company_city),
                 company_postal_code = COALESCE($18, company_postal_code),
                 company_nif = COALESCE($19, company_nif),
                 company_phone = COALESCE($20, company_phone),
                 company_email = COALESCE($21, company_email),
                 company_website = COALESCE($22, company_website),
                 company_logo = COALESCE($23, company_logo),
                 smtp_host = COALESCE($24, smtp_host),
                 smtp_port = COALESCE($25, smtp_port),
                 smtp_user = COALESCE($26, smtp_user),
                 smtp_password = COALESCE($27, smtp_password),
                 smtp_secure = COALESCE($28, smtp_secure),
                 smtp_from_name = COALESCE($29, smtp_from_name),
                 smtp_from_email = COALESCE($30, smtp_from_email),
                 updated_at = CURRENT_TIMESTAMP 
             WHERE id = (SELECT id FROM crm_settings ORDER BY id DESC LIMIT 1) 
             RETURNING *`,
            [
                demo_url,
                chat_title,
                chat_welcome_message,
                chat_primary_color,
                chat_enabled,
                pusher_app_id,
                pusher_key,
                pusher_secret,
                pusher_cluster,
                invoice_prefix,
                next_invoice_number,
                default_tax_rate,
                invoice_due_days,
                auto_invoice_on_proposal_accept,
                company_name,
                company_address,
                company_city,
                company_postal_code,
                company_nif,
                company_phone,
                company_email,
                company_website,
                company_logo,
                smtp_host,
                smtp_port,
                smtp_user,
                smtp_password,
                smtp_secure,
                smtp_from_name,
                smtp_from_email
            ]
        );

        if (result.rows.length === 0) {
            // Si no existe, crear
            const newSettings = await db.query(
                `INSERT INTO crm_settings (
                    demo_url, chat_title, chat_welcome_message, chat_primary_color, chat_enabled,
                    pusher_app_id, pusher_key, pusher_secret, pusher_cluster,
                    invoice_prefix, next_invoice_number, default_tax_rate, invoice_due_days, auto_invoice_on_proposal_accept,
                    company_name, company_address, company_nif, company_phone, company_email, company_website, company_logo,
                    smtp_host, smtp_port, smtp_user, smtp_password, smtp_secure, smtp_from_name, smtp_from_email
                ) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
                         $22, $23, $24, $25, $26, $27, $28) 
                 RETURNING *`,
                [
                    demo_url,
                    chat_title || 'Soporte NoahPro',
                    chat_welcome_message || '¡Hola! ¿En qué podemos ayudarte hoy?',
                    chat_primary_color || '#0ea5e9',
                    chat_enabled !== undefined ? chat_enabled : true,
                    pusher_app_id,
                    pusher_key,
                    pusher_secret,
                    pusher_cluster || 'eu',
                    invoice_prefix || 'INV-',
                    next_invoice_number || 1,
                    default_tax_rate || 21,
                    invoice_due_days || 30,
                    auto_invoice_on_proposal_accept !== undefined ? auto_invoice_on_proposal_accept : false,
                    company_name,
                    company_address,
                    company_nif,
                    company_phone,
                    company_email,
                    company_website,
                    company_logo,
                    smtp_host,
                    smtp_port,
                    smtp_user,
                    smtp_password,
                    smtp_secure !== undefined ? smtp_secure : true,
                    smtp_from_name || 'NoahPro CRM',
                    smtp_from_email
                ]
            );
            return res.json(newSettings.rows[0]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ error: 'Error al actualizar configuración' });
    }
};



// Obtener estados de leads
const getLeadStatuses = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM lead_statuses ORDER BY position ASC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting lead statuses:', error);
        res.status(500).json({ error: 'Error al obtener estados' });
    }
};

// Actualizar estados de leads (reordenar, crear, eliminar)
const updateLeadStatuses = async (req, res) => {
    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');
        const { statuses } = req.body;

        if (!Array.isArray(statuses)) {
            throw new Error('Formato inválido');
        }

        // 1. Eliminar estados que no están en la lista (excepto sistema)
        // Primero obtenemos los IDs actuales para saber cuáles borrar
        const currentIds = statuses.filter(s => s.id).map(s => s.id);
        if (currentIds.length > 0) {
            await client.query(
                'DELETE FROM lead_statuses WHERE id NOT IN (' + currentIds.join(',') + ') AND is_system = false'
            );
        }

        // 2. Actualizar o Insertar
        for (let i = 0; i < statuses.length; i++) {
            const status = statuses[i];

            if (status.id) {
                // Actualizar existente
                await client.query(
                    `UPDATE lead_statuses 
                     SET name = $1, color = $2, icon = $3, position = $4 
                     WHERE id = $5`,
                    [status.name, status.color, status.icon, i + 1, status.id]
                );
            } else {
                // Insertar nuevo
                await client.query(
                    `INSERT INTO lead_statuses (name, color, icon, position, is_system) 
                     VALUES ($1, $2, $3, $4, $5)`,
                    [status.name, status.color, status.icon, i + 1, false]
                );
            }
        }

        await client.query('COMMIT');

        // Devolver lista actualizada
        const result = await client.query('SELECT * FROM lead_statuses ORDER BY position ASC');
        res.json(result.rows);

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating lead statuses:', error);
        res.status(500).json({ error: 'Error al actualizar estados' });
    } finally {
        client.release();
    }
};

module.exports = {
    getSettings,
    updateSettings,
    getPublicSettings,
    getLeadStatuses,
    updateLeadStatuses
};
