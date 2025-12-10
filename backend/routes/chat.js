const express = require('express');
const router = express.Router();

// Mock data for development
let conversations = [];

let messages = {};

// Get all active conversations
router.get('/conversations', (req, res) => {
    res.json(conversations);
});

// Get messages for a specific session
router.get('/conversations/:sessionId/messages', (req, res) => {
    const { sessionId } = req.params;
    res.json(messages[sessionId] || []);
});

// Send a message (mock)
router.post('/message', (req, res) => {
    const { sessionId, message, senderType } = req.body;

    if (!messages[sessionId]) {
        messages[sessionId] = [];
    }

    const newMessage = {
        senderType,
        message,
        created_at: new Date().toISOString()
    };

    messages[sessionId].push(newMessage);

    // Update conversation last message
    const convIndex = conversations.findIndex(c => c.session_id === sessionId);
    if (convIndex >= 0) {
        conversations[convIndex].last_message = message;
        conversations[convIndex].updated_at = new Date().toISOString();
    } else {
        conversations.unshift({
            id: Date.now(),
            session_id: sessionId,
            last_message: message,
            updated_at: new Date().toISOString(),
            unread_count: 0
        });
    }

    // Trigger Pusher event
    const pusherService = require('../services/pusherService');

    // Trigger event for the specific chat session (private channel)
    pusherService.trigger(`chat_${sessionId}`, 'new_message', newMessage);

    // If message is from visitor, notify admins (public channel or admin channel)
    if (senderType === 'visitor') {
        pusherService.trigger('admin_notifications', 'new_chat_message', {
            sessionId,
            message,
            timestamp: new Date().toISOString()
        });
    }

    res.json(newMessage);
});

module.exports = router;

