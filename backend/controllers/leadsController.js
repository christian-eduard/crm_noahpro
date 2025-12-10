const db = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const emailService = require('../services/emailService');
const { notifyNewLead } = require('../services/notificationService');

// Get all leads
const getLeads = async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = `
            SELECT 
                l.*,
                u.name as assigned_user_name,
                COALESCE(
                    json_agg(
                        json_build_object('id', t.id, 'name', t.name, 'color', t.color)
                    ) FILTER (WHERE t.id IS NOT NULL),
                    '[]'
                ) as tags
            FROM leads l
            LEFT JOIN users u ON (l.assigned_to ~ '^[0-9]+$' AND l.assigned_to::integer = u.id)
            LEFT JOIN lead_tags lt ON l.id = lt.lead_id
            LEFT JOIN tags t ON lt.tag_id = t.id
            WHERE 1=1
        `;
        const params = [];
        let paramIndex = 1;

        if (status) {
            query += ` AND l.status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (req.user.role === 'commercial') {
            query += ` AND l.assigned_commercial_id = $${paramIndex}`;
            params.push(req.user.id || req.user.userId);
            paramIndex++;
        }

        if (search) {
            query += ` AND (l.name ILIKE $${paramIndex} OR l.email ILIKE $${paramIndex} OR l.business_name ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
        }

        query += ' GROUP BY l.id, u.name ORDER BY l.created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting leads:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Create lead
const createLead = async (req, res) => {
    try {
        const { name, email, phone, businessName, message, source = 'landing_form', commercialCode } = req.body;

        if (!name || !email) {
            return res.status(400).json({ error: 'Nombre y email son requeridos' });
        }

        const existingLead = await db.query('SELECT id FROM leads WHERE email = $1', [email]);
        if (existingLead.rows.length > 0) {
            return res.status(409).json({ error: 'Ya existe un lead con este email' });
        }

        // Buscar comercial por código si se proporciona
        let assignedCommercialId = null;
        if (commercialCode) {
            const commercialResult = await db.query(
                'SELECT user_id FROM commercial_profiles WHERE commercial_code = $1',
                [commercialCode]
            );
            if (commercialResult.rows.length > 0) {
                assignedCommercialId = commercialResult.rows[0].user_id;
            }
        }

        const result = await db.query(
            `INSERT INTO leads (name, email, phone, business_name, message, source, status, commercial_code, assigned_commercial_id)
             VALUES ($1, $2, $3, $4, $5, $6, 'new', $7, $8)
             RETURNING *`,
            [name, email, phone, businessName, message, source, commercialCode || null, assignedCommercialId]
        );

        const lead = result.rows[0];

        // Send notification email to sales team
        try {
            await emailService.sendNotificationEmail(lead);
        } catch (emailError) {
            console.error('Error sending notification email:', emailError);
        }

        // Send confirmation email to lead
        try {
            await emailService.sendWelcomeEmail(lead);
        } catch (emailError) {
            console.error('Error sending confirmation email:', emailError);
        }

        // Create in-app notification
        try {
            await notifyNewLead(lead);
        } catch (notifError) {
            console.error('Error creating notification:', notifError);
        }

        res.status(201).json(lead);
    } catch (error) {
        console.error('Error creating lead:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Update lead
const updateLead = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, businessName, status, assignedTo } = req.body;

        const result = await db.query(
            `UPDATE leads 
             SET name = COALESCE($1, name),
                 email = COALESCE($2, email),
                 phone = COALESCE($3, phone),
                 business_name = COALESCE($4, business_name),
                 status = COALESCE($5, status),
                 assigned_to = COALESCE($6, assigned_to)
             WHERE id = $7
             RETURNING *`,
            [name, email, phone, businessName, status, assignedTo, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating lead:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Get lead by ID
const getLeadById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM leads WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting lead:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Get lead statistics
const getLeadStats = async (req, res) => {
    try {
        const stats = await db.query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'new') as new,
                COUNT(*) FILTER (WHERE status = 'contacted') as contacted,
                COUNT(*) FILTER (WHERE status = 'qualified') as qualified,
                COUNT(*) FILTER (WHERE status = 'proposal_sent') as proposal_sent,
                COUNT(*) FILTER (WHERE status = 'won') as won,
                COUNT(*) FILTER (WHERE status = 'lost') as lost,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as last_7_days,
                COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as last_30_days
            FROM leads
        `);

        res.json(stats.rows[0]);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Delete lead
const deleteLead = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM leads WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Lead no encontrado' });
        }

        res.json({ message: 'Lead eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting lead:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    getLeads,
    createLead,
    updateLead,
    getLeadById,
    getLeadStats,
    deleteLead
};
