const db = require('../config/database');
const logger = require('../config/logger');

const getClients = async (req, res) => {
    try {
        let query = 'SELECT c.* FROM clients c';
        const params = [];

        if (req.user.role === 'commercial') {
            query += ' JOIN leads l ON c.lead_id = l.id WHERE l.assigned_commercial_id = $1';
            params.push(req.user.id || req.user.userId);
        }

        query += ' ORDER BY c.created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        logger.error('Error fetching clients:', error);
        res.status(500).json({ error: 'Error fetching clients' });
    }
};

const getClientById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM clients WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error fetching client:', error);
        res.status(500).json({ error: 'Error fetching client' });
    }
};

const createClient = async (req, res) => {
    try {
        const { name, email, phone, company, nif, address, city, postal_code, notes } = req.body;

        const result = await db.query(
            `INSERT INTO clients (name, email, phone, company, nif, address, city, postal_code, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
             RETURNING *`,
            [name, email, phone, company, nif, address, city, postal_code, notes]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        logger.error('Error creating client:', error);
        res.status(500).json({ error: 'Error creating client' });
    }
};

const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, phone, company, nif, address, city, postal_code, notes } = req.body;

        const result = await db.query(
            `UPDATE clients 
             SET name = $1, email = $2, phone = $3, company = $4, nif = $5, address = $6, city = $7, postal_code = $8, notes = $9, updated_at = NOW()
             WHERE id = $10 
             RETURNING *`,
            [name, email, phone, company, nif, address, city, postal_code, notes, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        logger.error('Error updating client:', error);
        res.status(500).json({ error: 'Error updating client' });
    }
};

const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Client not found' });
        }

        res.json({ message: 'Client deleted successfully' });
    } catch (error) {
        logger.error('Error deleting client:', error);
        res.status(500).json({ error: 'Error deleting client' });
    }
};

const convertLead = async (req, res) => {
    try {
        const { leadId } = req.body;

        // Get lead details
        const leadResult = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        if (leadResult.rows.length === 0) {
            return res.status(404).json({ error: 'Lead no encontrado' });
        }
        const lead = leadResult.rows[0];

        // Check if client already exists with this email
        const existingClient = await db.query('SELECT id FROM clients WHERE email = $1', [lead.email]);
        if (existingClient.rows.length > 0) {
            return res.status(409).json({ error: 'Ya existe un cliente con este email' });
        }

        // Create client
        const clientResult = await db.query(
            `INSERT INTO clients (name, email, phone, company, address, notes, lead_id, status) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'active') 
             RETURNING *`,
            [lead.name, lead.email, lead.phone, lead.business_name, lead.address, lead.message, leadId]
        );

        // Update lead status to won
        await db.query('UPDATE leads SET status = $1 WHERE id = $2', ['won', leadId]);

        res.status(201).json(clientResult.rows[0]);
    } catch (error) {
        logger.error('Error converting lead:', error);
        res.status(500).json({ error: 'Error al convertir el lead' });
    }
};

module.exports = {
    getClients,
    getClientById,
    createClient,
    updateClient,
    deleteClient,
    convertLead
};
