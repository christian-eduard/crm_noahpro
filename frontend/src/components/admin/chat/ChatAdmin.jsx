import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';

const ChatAdmin = () => {
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [socket, setSocket] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Connect socket
        const newSocket = io('http://localhost:3002');
        setSocket(newSocket);

        // Listen for new messages (admin notification)
        newSocket.on('admin_notification', (data) => {
            if (data.type === 'new_message') {
                // Refresh conversations list to show new activity
                fetchConversations();

                // If this conversation is active, append message
                if (activeConversation && activeConversation.session_id === data.sessionId) {
                    setMessages(prev => [...prev, {
                        senderType: 'visitor',
                        message: data.message,
                        created_at: new Date().toISOString()
                    }]);
                }
            }
        });

        fetchConversations();

        return () => newSocket.close();
    }, [activeConversation]);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.session_id);
            // Join room to send messages
            socket?.emit('join_room', activeConversation.session_id);
        }
    }, [activeConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const fetchConversations = async () => {
        try {
            const response = await fetch('http://localhost:3002/api/chat/conversations');
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }
    };

    const fetchMessages = async (sessionId) => {
        try {
            const response = await fetch(`http://localhost:3002/api/chat/conversations/${sessionId}/messages`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const sendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !socket) return;

        const messageData = {
            sessionId: activeConversation.session_id,
            senderType: 'admin',
            senderName: 'Agente',
            message: newMessage,
            timestamp: new Date()
        };

        socket.emit('send_message', messageData);

        // Optimistic update
        setMessages(prev => [...prev, {
            senderType: 'admin',
            message: newMessage,
            created_at: new Date().toISOString()
        }]);

        setNewMessage('');
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-12rem)]">
            {/* Conversations List */}
            <div className="lg:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <h3 className="font-semibold text-gray-900 dark:text-white">Conversaciones Activas</h3>
                </div>
                <div className="overflow-y-auto flex-1 p-2 space-y-2">
                    {conversations.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">No hay chats activos</div>
                    ) : (
                        conversations.map(conv => (
                            <div
                                key={conv.id}
                                onClick={() => setActiveConversation(conv)}
                                className={`p-3 rounded-lg cursor-pointer transition-colors border ${activeConversation?.id === conv.id
                                    ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
                                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent'
                                    }`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-medium text-gray-900 dark:text-white truncate">
                                        Visitante {conv.session_id.substring(0, 8)}
                                    </span>
                                    <span className="text-xs text-gray-400">
                                        {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                                    {conv.last_message || 'Nueva conversación'}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Area */}
            <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col">
                {activeConversation ? (
                    <>
                        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50">
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white">
                                    Chat con Visitante {activeConversation.session_id.substring(0, 8)}
                                </h3>
                                <p className="text-xs text-gray-500">ID: {activeConversation.session_id}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/30 flex flex-col space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-2xl shadow-sm max-w-[80%] ${msg.senderType === 'admin'
                                        ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-tr-none'
                                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-200 dark:border-gray-700'
                                        }`}>
                                        <p className="text-sm">{msg.message}</p>
                                        <p className={`text-[10px] mt-1 ${msg.senderType === 'admin' ? 'text-orange-100' : 'text-gray-400'}`}>
                                            {new Date(msg.created_at || Date.now()).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        <form onSubmit={sendMessage} className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Escribe una respuesta..."
                                    className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
                                />
                                <button
                                    type="submit"
                                    disabled={!newMessage.trim()}
                                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                >
                                    Enviar
                                </button>
                            </div>
                        </form>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <span className="text-4xl mb-2">💬</span>
                        <p>Selecciona una conversación para chatear</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatAdmin;
