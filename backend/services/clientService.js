const db = require('../config/database');

/**
 * Client Service
 * Handles client-related operations including lead-to-client conversion
 */

/**
 * Convert a lead to a client
 * @param {number} leadId - The lead ID to convert
 * @param {Object} leadData - Optional lead data (if already fetched)
 * @returns {Object} - The created client
 */
const convertLeadToClient = async (leadId, leadData = null) => {
    const client = await db.connect();

    try {
        await client.query('BEGIN');

        // Get lead data if not provided
        let lead = leadData;
        if (!lead) {
            const leadResult = await client.query(
                'SELECT * FROM leads WHERE id = $1',
                [leadId]
            );

            if (leadResult.rows.length === 0) {
                throw new Error('Lead no encontrado');
            }
            lead = leadResult.rows[0];
        }

        // Check if client already exists for this lead
        const existingClient = await client.query(
            'SELECT * FROM clients WHERE lead_id = $1',
            [leadId]
        );

        if (existingClient.rows.length > 0) {
            // Client already exists, return it
            await client.query('COMMIT');
            console.log(`Client already exists for lead ${leadId}, returning existing client`);
            return existingClient.rows[0];
        }

        // Create client from lead
        const clientResult = await client.query(
            `INSERT INTO clients (name, email, phone, nif, address, city, postal_code, lead_id, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             RETURNING *`,
            [
                lead.name,
                lead.email || null,
                lead.phone || null,
                lead.nif || null,
                lead.address || null,
                lead.city || null,
                lead.postal_code || null,
                leadId,
                'active'
            ]
        );

        const newClient = clientResult.rows[0];

        // Update lead status to 'won' (converted)
        await client.query(
            'UPDATE leads SET status = $1 WHERE id = $2',
            ['won', leadId]
        );

        // Register activity
        await client.query(
            `INSERT INTO activities (lead_id, type, description, metadata)
             VALUES ($1, $2, $3, $4)`,
            [
                leadId,
                'lead_converted',
                `Lead convertido a cliente: ${lead.name}`,
                JSON.stringify({
                    clientId: newClient.id,
                    convertedAt: new Date()
                })
            ]
        );

        await client.query('COMMIT');
        console.log(`Lead ${leadId} converted to client ${newClient.id}`);
        return newClient;

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error converting lead to client:', error);
        throw error;
    } finally {
        client.release();
    }
};

/**
 * Get client by lead ID
 * @param {number} leadId - The lead ID
 * @returns {Object|null} - The client or null if not found
 */
const getClientByLeadId = async (leadId) => {
    try {
        const result = await db.query(
            'SELECT * FROM clients WHERE lead_id = $1',
            [leadId]
        );

        return result.rows.length > 0 ? result.rows[0] : null;
    } catch (error) {
        console.error('Error getting client by lead ID:', error);
        throw error;
    }
};

/**
 * Get or create client from lead
 * If client already exists for the lead, return it
 * Otherwise, convert lead to client
 * @param {number} leadId - The lead ID
 * @param {Object} leadData - Optional lead data
 * @returns {Object} - The client
 */
const getOrCreateClientFromLead = async (leadId, leadData = null) => {
    try {
        // Check if client already exists
        const existingClient = await getClientByLeadId(leadId);

        if (existingClient) {
            return existingClient;
        }

        // Convert lead to client
        return await convertLeadToClient(leadId, leadData);
    } catch (error) {
        console.error('Error getting or creating client from lead:', error);
        throw error;
    }
};

module.exports = {
    convertLeadToClient,
    getClientByLeadId,
    getOrCreateClientFromLead
};
