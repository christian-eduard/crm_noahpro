const db = require('../config/database');
const { sendSupportTicketEmail } = require('../services/emailService');
const socketInstance = require('../socket/socketInstance');

// ==================== TICKETS ====================

// Obtener todos los tickets (admin)
const getAllTickets = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT st.*, u.full_name as commercial_name, u.email as commercial_email,
                   (SELECT COUNT(*) FROM support_messages WHERE ticket_id = st.id AND is_read = false AND sender_id != $1) as unread_count
            FROM support_tickets st
            JOIN users u ON st.commercial_id = u.id
            ORDER BY 
                CASE WHEN st.status = 'open' THEN 0 ELSE 1 END,
                st.updated_at DESC
        `, [req.user.userId || req.user.id]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting tickets:', error);
        res.status(500).json({ error: 'Error al obtener tickets' });
    }
};

// Obtener tickets del comercial logueado
const getMyTickets = async (req, res) => {
    const userId = req.user.userId || req.user.id;
    try {
        const result = await db.query(`
            SELECT st.*,
                   (SELECT COUNT(*) FROM support_messages WHERE ticket_id = st.id AND is_read = false AND sender_id != $1) as unread_count
            FROM support_tickets st
            WHERE st.commercial_id = $1
            ORDER BY st.updated_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting tickets:', error);
        res.status(500).json({ error: 'Error al obtener tickets' });
    }
};

// Obtener ticket por ID con mensajes
const getTicketById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId || req.user.id;
    const isAdmin = req.user.role === 'admin';

    try {
        // Obtener ticket
        const ticketResult = await db.query(`
            SELECT st.*, u.full_name as commercial_name, u.email as commercial_email
            FROM support_tickets st
            JOIN users u ON st.commercial_id = u.id
            WHERE st.id = $1
        `, [id]);

        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        const ticket = ticketResult.rows[0];

        // Verificar acceso (admin o propietario)
        if (!isAdmin && ticket.commercial_id !== userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Obtener mensajes
        const messagesResult = await db.query(`
            SELECT sm.*, u.full_name as sender_name, u.role as sender_role
            FROM support_messages sm
            JOIN users u ON sm.sender_id = u.id
            WHERE sm.ticket_id = $1
            ORDER BY sm.created_at ASC
        `, [id]);

        // Marcar mensajes como leídos
        await db.query(`
            UPDATE support_messages 
            SET is_read = true 
            WHERE ticket_id = $1 AND sender_id != $2
        `, [id, userId]);

        res.json({
            ...ticket,
            messages: messagesResult.rows
        });
    } catch (error) {
        console.error('Error getting ticket:', error);
        res.status(500).json({ error: 'Error al obtener ticket' });
    }
};

// Crear ticket (comercial)
const createTicket = async (req, res) => {
    const { subject, message, priority } = req.body;
    const userId = req.user.userId || req.user.id;

    if (!subject || !message) {
        return res.status(400).json({ error: 'Asunto y mensaje son requeridos' });
    }

    const client = await db.pool.connect();
    try {
        await client.query('BEGIN');

        // Crear ticket
        const ticketResult = await client.query(`
            INSERT INTO support_tickets (commercial_id, subject, priority)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [userId, subject, priority || 'normal']);
        const ticket = ticketResult.rows[0];

        // Crear primer mensaje
        await client.query(`
            INSERT INTO support_messages (ticket_id, sender_id, message)
            VALUES ($1, $2, $3)
        `, [ticket.id, userId, message]);

        await client.query('COMMIT');

        // Obtener datos del comercial
        const userResult = await db.query('SELECT full_name, email FROM users WHERE id = $1', [userId]);
        const commercial = userResult.rows[0];

        // Enviar email a admins
        try {
            await sendSupportTicketEmail(ticket, commercial, message);
        } catch (e) {
            console.error('Error sending support email:', e);
        }

        // Notificación en tiempo real a admins
        try {
            const io = socketInstance.getIO();
            if (io) {
                io.emit('new_support_ticket', {
                    ticketId: ticket.id,
                    subject: ticket.subject,
                    commercialName: commercial.full_name
                });
            }
        } catch (e) {
            console.error('Socket notification error:', e);
        }

        res.status(201).json(ticket);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating ticket:', error);
        res.status(500).json({ error: 'Error al crear ticket' });
    } finally {
        client.release();
    }
};

// Responder a ticket (añadir mensaje)
const replyToTicket = async (req, res) => {
    const { id } = req.params;
    const { message } = req.body;
    const userId = req.user.userId || req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!message) {
        return res.status(400).json({ error: 'Mensaje requerido' });
    }

    try {
        // Verificar ticket existe y acceso
        const ticketResult = await db.query('SELECT * FROM support_tickets WHERE id = $1', [id]);
        if (ticketResult.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        const ticket = ticketResult.rows[0];
        if (!isAdmin && ticket.commercial_id !== userId) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // Añadir mensaje
        const messageResult = await db.query(`
            INSERT INTO support_messages (ticket_id, sender_id, message)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [id, userId, message]);

        // Actualizar timestamp del ticket
        await db.query('UPDATE support_tickets SET updated_at = NOW() WHERE id = $1', [id]);

        // Si es admin respondiendo, cambiar estado a in_progress si estaba open
        if (isAdmin && ticket.status === 'open') {
            await db.query("UPDATE support_tickets SET status = 'in_progress' WHERE id = $1", [id]);
        }

        // Notificación socket
        try {
            const io = socketInstance.getIO();
            if (io) {
                io.emit('support_message', {
                    ticketId: parseInt(id),
                    message: messageResult.rows[0]
                });
            }
        } catch (e) { }

        res.status(201).json(messageResult.rows[0]);
    } catch (error) {
        console.error('Error replying to ticket:', error);
        res.status(500).json({ error: 'Error al responder' });
    }
};

// Actualizar estado del ticket (admin)
const updateTicketStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: 'Estado no válido' });
    }

    try {
        const result = await db.query(`
            UPDATE support_tickets SET 
                status = $1, 
                updated_at = NOW(),
                closed_at = CASE WHEN $1 IN ('resolved', 'closed') THEN NOW() ELSE NULL END
            WHERE id = $2
            RETURNING *
        `, [status, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Ticket no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating ticket:', error);
        res.status(500).json({ error: 'Error al actualizar ticket' });
    }
};

module.exports = {
    getAllTickets,
    getMyTickets,
    getTicketById,
    createTicket,
    replyToTicket,
    updateTicketStatus
};
