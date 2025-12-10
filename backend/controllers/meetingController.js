const db = require('../config/database');
const { sendEmail } = require('../services/emailService');

// Get meetings for a lead or proposal
const getMeetings = async (req, res) => {
    try {
        const { leadId, proposalId } = req.query;
        let query = 'SELECT * FROM meetings WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (leadId) {
            query += ` AND lead_id = $${paramIndex}`;
            params.push(leadId);
            paramIndex++;
        }

        if (proposalId) {
            query += ` AND proposal_id = $${paramIndex}`;
            params.push(proposalId);
            paramIndex++;
        }

        query += ' ORDER BY scheduled_date ASC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting meetings:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Schedule a meeting
const scheduleMeeting = async (req, res) => {
    try {
        const { proposalId, leadId, title, description, scheduledDate, durationMinutes } = req.body;

        if (!leadId || !scheduledDate) {
            return res.status(400).json({ error: 'Lead y fecha son requeridos' });
        }

        // Generate Google Meet link (simulated for now)
        const meetingLink = `https://meet.google.com/${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}-${Math.random().toString(36).substring(7)}`;

        const result = await db.query(
            `INSERT INTO meetings (proposal_id, lead_id, title, description, scheduled_date, duration_minutes, meeting_link, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
             RETURNING *`,
            [proposalId, leadId, title, description, scheduledDate, durationMinutes || 60, meetingLink]
        );

        const meeting = result.rows[0];

        // Get lead details
        const leadResult = await db.query('SELECT * FROM leads WHERE id = $1', [leadId]);
        const lead = leadResult.rows[0];

        // Send confirmation email
        const subject = `📅 Reunión Confirmada: ${title}`;
        const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Reunión Confirmada</h2>
                <p>Hola ${lead.name},</p>
                <p>Tu reunión ha sido agendada correctamente.</p>
                <div style="background: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <p><strong>Tema:</strong> ${title}</p>
                    <p><strong>Fecha:</strong> ${new Date(scheduledDate).toLocaleString()}</p>
                    <p><strong>Duración:</strong> ${durationMinutes || 60} minutos</p>
                    <p><strong>Enlace:</strong> <a href="${meetingLink}">${meetingLink}</a></p>
                </div>
                <p>Te esperamos.</p>
            </div>
        `;

        await sendEmail(lead.email, subject, html);

        // Notify admin
        await sendEmail('desarrollo@noahpro.com', `Nueva Reunión: ${title}`, html);

        res.status(201).json(meeting);
    } catch (error) {
        console.error('Error scheduling meeting:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    getMeetings,
    scheduleMeeting
};
