const db = require('../config/database');

// Get notifications for a user
const getNotifications = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id || 1; // Default to admin user for now
        const { limit = 50, unreadOnly = false } = req.query;

        let query = 'SELECT * FROM notifications WHERE user_id = $1';
        const params = [userId];

        if (unreadOnly === 'true') {
            query += ' AND read = FALSE';
        }

        query += ' ORDER BY created_at DESC LIMIT $2';
        params.push(parseInt(limit));

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting notifications:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user?.id || 1;

        const result = await db.query(
            'UPDATE notifications SET read = TRUE WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Mark all notifications as read
const markAllAsRead = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id || 1;

        await db.query(
            'UPDATE notifications SET read = TRUE WHERE user_id = $1 AND read = FALSE',
            [userId]
        );

        res.json({ message: 'Todas las notificaciones marcadas como leídas' });
    } catch (error) {
        console.error('Error marking all as read:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Get unread count
const getUnreadCount = async (req, res) => {
    try {
        const userId = req.user?.userId || req.user?.id || 1;

        const result = await db.query(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = $1 AND read = FALSE',
            [userId]
        );

        res.json({ count: parseInt(result.rows[0].count) });
    } catch (error) {
        console.error('Error getting unread count:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Delete notification
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?.userId || req.user?.id || 1;

        const result = await db.query(
            'DELETE FROM notifications WHERE id = $1 AND user_id = $2 RETURNING *',
            [id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }

        res.json({ message: 'Notificación eliminada' });
    } catch (error) {
        console.error('Error deleting notification:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Create notification and trigger Pusher event
const createNotification = async (userId, type, title, message, data = {}) => {
    try {
        // Save to database
        const result = await db.query(
            'INSERT INTO notifications (user_id, type, title, message, data) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [userId, type, title, message, data]
        );

        const notification = result.rows[0];

        // Trigger Pusher event
        const pusherService = require('../services/pusherService');
        pusherService.trigger(`user_${userId}`, 'new_notification', notification);

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    markAllAsRead,
    getUnreadCount,
    deleteNotification,
    createNotification
};
