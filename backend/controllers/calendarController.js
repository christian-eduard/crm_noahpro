const db = require('../config/database');

// Get all calendar events
const getEvents = async (req, res) => {
    try {
        const { start, end } = req.query;
        let query = 'SELECT * FROM calendar_events';
        const params = [];

        if (start && end) {
            query += ' WHERE start_time >= $1 AND end_time <= $2';
            params.push(start, end);
        }

        query += ' ORDER BY start_time ASC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting events:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Get single event
const getEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM calendar_events WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting event:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Create event
const createEvent = async (req, res) => {
    try {
        const { title, description, start_time, end_time, type, lead_id, created_by } = req.body;

        if (!title || !start_time || !end_time) {
            return res.status(400).json({ error: 'Título, fecha de inicio y fin son requeridos' });
        }

        const result = await db.query(
            `INSERT INTO calendar_events (title, description, start_time, end_time, type, lead_id, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [title, description, start_time, end_time, type || 'meeting', lead_id, created_by]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating event:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Update event
const updateEvent = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, start_time, end_time, type, lead_id } = req.body;

        const result = await db.query(
            `UPDATE calendar_events 
             SET title = COALESCE($1, title),
                 description = COALESCE($2, description),
                 start_time = COALESCE($3, start_time),
                 end_time = COALESCE($4, end_time),
                 type = COALESCE($5, type),
                 lead_id = COALESCE($6, lead_id),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $7
             RETURNING *`,
            [title, description, start_time, end_time, type, lead_id, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating event:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Delete event
const deleteEvent = async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query('DELETE FROM calendar_events WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Evento no encontrado' });
        }

        res.json({ message: 'Evento eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting event:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    getEvents,
    getEvent,
    createEvent,
    updateEvent,
    deleteEvent
};
