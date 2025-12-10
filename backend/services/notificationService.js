const db = require('../config/database');
const io = require('../socket/socketInstance');

// Notification types
const NOTIFICATION_TYPES = {
    NEW_LEAD: 'new_lead',
    PROPOSAL_VIEWED: 'proposal_viewed',
    PROPOSAL_ACCEPTED: 'proposal_accepted',
    NEW_COMMENT: 'new_comment',
    CHAT_MESSAGE: 'chat_message'
};

// Create notification
const createNotification = async (userId, type, title, message, link = null) => {
    try {
        const result = await db.query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING *`,
            [userId, type, title, message, link]
        );

        const notification = result.rows[0];

        // Emit real-time notification via Socket.io
        const socketIo = io.getIO();
        if (socketIo) {
            socketIo.to(`user_${userId}`).emit('new_notification', notification);
        }

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        throw error;
    }
};

// Create notification for all admins
const createNotificationForAllAdmins = async (type, title, message, link = null) => {
    try {
        // Get all admin users
        const adminsResult = await db.query('SELECT id FROM users WHERE role = $1', ['admin']);
        const adminIds = adminsResult.rows.map(row => row.id);

        const notifications = [];
        for (const adminId of adminIds) {
            const notification = await createNotification(adminId, type, title, message, link);
            notifications.push(notification);
        }

        return notifications;
    } catch (error) {
        console.error('Error creating notifications for admins:', error);
        throw error;
    }
};

// Notification helpers for specific events
const notifyNewLead = async (lead) => {
    const title = `🎯 Nuevo Lead: ${lead.name}`;
    const message = `${lead.business_name || 'Sin empresa'} - ${lead.email}`;
    const link = `/crm/dashboard?lead=${lead.id}`;

    return createNotificationForAllAdmins(
        NOTIFICATION_TYPES.NEW_LEAD,
        title,
        message,
        link
    );
};

const notifyProposalViewed = async (proposal, lead) => {
    const title = `👁️ Propuesta Vista`;
    const message = `${lead.name} ha visto la propuesta "${proposal.title}"`;
    const link = `/crm/dashboard?lead=${lead.id}`;

    return createNotificationForAllAdmins(
        NOTIFICATION_TYPES.PROPOSAL_VIEWED,
        title,
        message,
        link
    );
};

const notifyProposalAccepted = async (proposal, lead) => {
    const title = `✅ Propuesta Aceptada`;
    const message = `${lead.name} ha aceptado la propuesta "${proposal.title}"`;
    const link = `/crm/dashboard?lead=${lead.id}`;

    return createNotificationForAllAdmins(
        NOTIFICATION_TYPES.PROPOSAL_ACCEPTED,
        title,
        message,
        link
    );
};

const notifyNewComment = async (comment, proposal, lead) => {
    const title = `💬 Nuevo Comentario`;
    const message = `${comment.author} comentó en la propuesta de ${lead.name}`;
    const link = `/crm/dashboard?lead=${lead.id}`;

    return createNotificationForAllAdmins(
        NOTIFICATION_TYPES.NEW_COMMENT,
        title,
        message,
        link
    );
};

const notifyNewChatMessage = async (sessionId, message) => {
    const title = `💬 Nuevo Mensaje de Chat`;
    const messageText = message.length > 50 ? message.substring(0, 50) + '...' : message;
    const link = `/crm/dashboard?tab=chat&session=${sessionId}`;

    return createNotificationForAllAdmins(
        NOTIFICATION_TYPES.CHAT_MESSAGE,
        title,
        messageText,
        link
    );
};

module.exports = {
    NOTIFICATION_TYPES,
    createNotification,
    createNotificationForAllAdmins,
    notifyNewLead,
    notifyProposalViewed,
    notifyProposalAccepted,
    notifyNewComment,
    notifyNewChatMessage
};
