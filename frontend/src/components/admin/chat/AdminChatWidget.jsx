import { API_URL, SOCKET_URL } from '../../../config';
import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Minimize2, Maximize2 } from 'lucide-react';
import { usePusher } from '../../../contexts/PusherContext';

const AdminChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [unreadCount, setUnreadCount] = useState(0);
    const messagesEndRef = useRef(null);

    const pusher = usePusher();

    useEffect(() => {
        if (pusher) {
            // Subscribe to admin notifications for new messages
            const channel = pusher.subscribe('admin_notifications');

            channel.bind('new_chat_message', (data) => {
                fetchConversations();
                if (activeConversation && activeConversation.session_id === data.sessionId) {
                    setMessages(prev => [...prev, {
                        senderType: 'visitor',
                        message: data.message,
                        created_at: data.timestamp || new Date().toISOString()
                    }]);
                } else {
                    setUnreadCount(prev => prev + 1);
                }
            });

            return () => {
                channel.unbind_all();
                channel.unsubscribe();
            };
        }
    }, [pusher, activeConversation]);

    useEffect(() => {
        fetchConversations();
    }, []);

    useEffect(() => {
        if (activeConversation) {
            fetchMessages(activeConversation.session_id);
        }
    }, [activeConversation]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const fetchConversations = async () => {
        try {
            const response = await fetch(`${API_URL}/chat/conversations`);
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
                // Calculate total unread
                const totalUnread = data.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
                setUnreadCount(totalUnread);
            }
        } catch (err) {
            console.error('Error fetching conversations:', err);
        }
    };

    const fetchMessages = async (sessionId) => {
        try {
            const response = await fetch(`${API_URL}/chat/conversations/${sessionId}/messages`);
            if (response.ok) {
                const data = await response.json();
                setMessages(data);
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation) return;

        const messageData = {
            sessionId: activeConversation.session_id,
            senderType: 'admin',
            senderName: 'Agente',
            message: newMessage
        };

        try {
            const response = await fetch(`${API_URL}/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageData)
            });

            if (response.ok) {
                setMessages(prev => [...prev, {
                    senderType: 'admin',
                    message: newMessage,
                    created_at: new Date().toISOString()
                }]);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full shadow-lg hover:shadow-orange-500/40 hover:scale-105 transition-all flex items-center justify-center z-50"
            >
                <MessageSquare className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-white text-red-600 text-xs font-bold rounded-full flex items-center justify-center border-2 border-red-600">
                        {unreadCount}
                    </span>
                )}
            </button>
        );
    }

    return (
        <div className={`fixed bottom-24 right-6 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50 flex flex-col transition-all duration-300 ${isMinimized ? 'w-72 h-14' : 'w-80 md:w-96 h-[500px]'}`}>
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-orange-500 to-red-600 text-white flex justify-between items-center cursor-pointer" onClick={() => setIsMinimized(!isMinimized)}>
                <div className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5" />
                    <span className="font-semibold">Chat Soporte</span>
                </div>
                <div className="flex items-center space-x-1">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                        className="p-1 hover:bg-white/20 rounded transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!isMinimized && (
                <>
                    {activeConversation ? (
                        <>
                            {/* Chat Header */}
                            <div className="p-2 bg-gray-50 dark:bg-gray-700 flex justify-between items-center border-b border-gray-200 dark:border-gray-600">
                                <button
                                    onClick={() => setActiveConversation(null)}
                                    className="text-xs text-orange-600 dark:text-orange-400 hover:underline font-medium"
                                >
                                    ← Volver
                                </button>
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                    Visitante {activeConversation.session_id.substring(0, 6)}
                                </span>
                            </div>

                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-gray-900/50">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex ${msg.senderType === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`p-3 rounded-2xl max-w-[85%] text-sm shadow-sm ${msg.senderType === 'admin'
                                            ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-tr-none'
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-tl-none'
                                            }`}>
                                            {msg.message}
                                        </div>
                                    </div>
                                ))}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={sendMessage} className="p-3 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Escribe..."
                                        className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 disabled:opacity-50 transition-all"
                                    >
                                        <Send className="w-4 h-4" />
                                    </button>
                                </div>
                            </form>
                        </>
                    ) : (
                        /* Conversations List */
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {conversations.length === 0 ? (
                                <div className="text-center py-8 text-gray-500 text-sm">No hay chats activos</div>
                            ) : (
                                conversations.map(conv => (
                                    <div
                                        key={conv.id}
                                        onClick={() => setActiveConversation(conv)}
                                        className="p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <span className="font-medium text-sm text-gray-900 dark:text-white">
                                                Visitante {conv.session_id.substring(0, 6)}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(conv.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {conv.last_message}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AdminChatWidget;
