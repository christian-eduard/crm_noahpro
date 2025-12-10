const db = require('../config/database');

// Get all clients
exports.getClients = async (req, res) => {
    try {
        const [clients] = await db.query('SELECT * FROM clients ORDER BY created_at DESC');
        res.json(clients);
    } catch (error) {
        console.error('Error getting clients:', error);
        res.status(500).json({ message: 'Error al obtener clientes' });
    }
};

// Get single client with installation details
exports.getClient = async (req, res) => {
    try {
        const [clients] = await db.query('SELECT * FROM clients WHERE id = ?', [req.params.id]);
        if (clients.length === 0) {
            return res.status(404).json({ message: 'Cliente no encontrado' });
        }

        const client = clients[0];
        const [installations] = await db.query('SELECT * FROM client_installations WHERE client_id = ?', [client.id]);

        client.installation = installations.length > 0 ? installations[0] : null;

        res.json(client);
    } catch (error) {
        console.error('Error getting client:', error);
        res.status(500).json({ message: 'Error al obtener cliente' });
    }
};

// Create new client
exports.createClient = async (req, res) => {
    const { name, email, phone, nif, address, city, postal_code } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO clients (name, email, phone, nif, address, city, postal_code) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, email, phone, nif, address, city, postal_code]
        );

        // Create empty installation record
        await db.query('INSERT INTO client_installations (client_id) VALUES (?)', [result.insertId]);

        res.status(201).json({ id: result.insertId, message: 'Cliente creado exitosamente' });
    } catch (error) {
        console.error('Error creating client:', error);
        res.status(500).json({ message: 'Error al crear cliente' });
    }
};

// Convert Lead to Client
exports.convertLeadToClient = async (req, res) => {
    const { leadId } = req.body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // Get lead data
        const [leads] = await connection.query('SELECT * FROM leads WHERE id = ?', [leadId]);
        if (leads.length === 0) {
            throw new Error('Lead no encontrado');
        }
        const lead = leads[0];

        // Create client from lead
        const [result] = await connection.query(
            'INSERT INTO clients (name, email, phone, lead_id, status) VALUES (?, ?, ?, ?, ?)',
            [lead.name, lead.email, lead.phone, leadId, 'active']
        );
        const clientId = result.insertId;

        // Create empty installation record
        await connection.query('INSERT INTO client_installations (client_id) VALUES (?)', [clientId]);

        // Update lead status to 'won' (converted)
        await connection.query('UPDATE leads SET status = ? WHERE id = ?', ['won', leadId]);

        await connection.commit();
        res.status(201).json({ id: clientId, message: 'Lead convertido a cliente exitosamente' });
    } catch (error) {
        await connection.rollback();
        console.error('Error converting lead:', error);
        res.status(500).json({ message: error.message || 'Error al convertir lead' });
    } finally {
        connection.release();
    }
};

// Update client installation details
exports.updateInstallation = async (req, res) => {
    const { clientId } = req.params;
    const {
        domain, server_ip, admin_url, admin_user, admin_password,
        db_name, db_user, db_password, notes, status
    } = req.body;

    try {
        // Check if installation exists
        const [exists] = await db.query('SELECT id FROM client_installations WHERE client_id = ?', [clientId]);

        if (exists.length === 0) {
            await db.query(
                `INSERT INTO client_installations 
                (client_id, domain, server_ip, admin_url, admin_user, admin_password, db_name, db_user, db_password, notes, status) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [clientId, domain, server_ip, admin_url, admin_user, admin_password, db_name, db_user, db_password, notes, status]
            );
        } else {
            await db.query(
                `UPDATE client_installations SET 
                domain = ?, server_ip = ?, admin_url = ?, admin_user = ?, admin_password = ?, 
                db_name = ?, db_user = ?, db_password = ?, notes = ?, status = ? 
                WHERE client_id = ?`,
                [domain, server_ip, admin_url, admin_user, admin_password, db_name, db_user, db_password, notes, status, clientId]
            );
        }

        res.json({ message: 'Datos de instalación actualizados' });
    } catch (error) {
        console.error('Error updating installation:', error);
        res.status(500).json({ message: 'Error al actualizar instalación' });
    }
};
