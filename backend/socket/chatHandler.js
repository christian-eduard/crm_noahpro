const db = require('../config/database');

module.exports = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join a chat room (based on session ID)
        socket.on('join_room', (sessionId) => {
            socket.join(sessionId);
            console.log(`User with ID: ${socket.id} joined room: ${sessionId}`);
        });

        // Send message
        socket.on('send_message', async (data) => {
            const { sessionId, senderType, senderName, message } = data;

            try {
                // Find or create conversation
                let conversationResult = await db.query(
                    'SELECT id FROM chat_conversations WHERE session_id = $1',
                    [sessionId]
                );

                let conversationId;
                if (conversationResult.rows.length === 0) {
                    const newConv = await db.query(
                        'INSERT INTO chat_conversations (session_id) VALUES ($1) RETURNING id',
                        [sessionId]
                    );
                    conversationId = newConv.rows[0].id;
                } else {
                    conversationId = conversationResult.rows[0].id;
                }

                // Save message
                await db.query(
                    'INSERT INTO chat_messages (conversation_id, sender_type, sender_name, message) VALUES ($1, $2, $3, $4)',
                    [conversationId, senderType, senderName, message]
                );

                // Broadcast to room
                io.to(sessionId).emit('receive_message', data);

                // Notify admin dashboard (broadcast to all admins)
                io.emit('admin_notification', {
                    type: 'new_message',
                    sessionId,
                    message
                });

            } catch (error) {
                console.error('Error saving message:', error);
            }
        });

        socket.on('typing', (data) => {
            socket.to(data.room).emit('typing', data);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};
