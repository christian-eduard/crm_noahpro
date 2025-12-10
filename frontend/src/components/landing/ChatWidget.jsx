import { API_URL, SOCKET_URL } from '../../config';
import React, { useState, useEffect, useRef } from 'react';
import Pusher from 'pusher-js';
import { v4 as uuidv4 } from 'uuid';
import { MessageCircle, X, Send, User, Headphones } from 'lucide-react';

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [config, setConfig] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sessionId, setSessionId] = useState('');
    const [pusher, setPusher] = useState(null);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        // Load config
        fetch(`${API_URL}/settings/public`)
            .then(res => res.json())
            .then(data => {
                if (data.chat_enabled) {
                    setConfig(data);
                    // Initialize Pusher if keys exist
                    if (data.pusher_key && data.pusher_cluster) {
                        const pusherInstance = new Pusher(data.pusher_key, {
                            cluster: data.pusher_cluster,
                            encrypted: true
                        });
                        setPusher(pusherInstance);
                    }
                }
            })
            .catch(err => console.error('Error loading chat config:', err));

        // Setup session
        let storedSession = localStorage.getItem('chat_session_id');
        if (!storedSession) {
            storedSession = uuidv4();
            localStorage.setItem('chat_session_id', storedSession);
        }
        setSessionId(storedSession);

        // Load previous messages
        fetch(`${API_URL}/chat/conversations/${storedSession}/messages`)
            .then(res => {
                if (res.ok) return res.json();
                return [];
            })
            .then(data => setMessages(data))
            .catch(err => console.error('Error loading messages:', err));

        return () => {
            if (pusher) pusher.disconnect();
        };
    }, []);

    useEffect(() => {
        if (pusher && sessionId) {
            const channel = pusher.subscribe(`chat_${sessionId}`);

            channel.bind('new_message', (data) => {
                setMessages(prev => [...prev, data]);
            });

            return () => {
                channel.unbind_all();
                channel.unsubscribe();
            };
        }
    }, [pusher, sessionId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const messageData = {
            sessionId,
            senderType: 'visitor',
            senderName: 'Visitante',
            message: newMessage,
            timestamp: new Date()
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
                setNewMessage('');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    if (!config) return null;

    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end font-sans">
            {isOpen && (
                <div className="bg-white rounded-2xl shadow-2xl w-[350px] sm:w-[380px] mb-4 overflow-hidden border border-slate-100 animate-fade-in-up flex flex-col h-[500px]">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 p-4 flex justify-between items-center text-white shadow-md z-10">
                        <div className="flex items-center space-x-3">
                            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
                                <Headphones size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-tight">{config.chat_title || 'Soporte NoahPro'}</h3>
                                <div className="flex items-center space-x-1.5">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    <span className="text-xs font-medium text-orange-50">En línea ahora</span>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-white/80 hover:text-white hover:bg-white/10 rounded-full p-2 transition-colors"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages Area */}
                    <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-4">
                        {/* Welcome Message */}
                        <div className="flex justify-start">
                            <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm max-w-[85%] border border-slate-100 text-slate-700 text-sm leading-relaxed">
                                {config.chat_welcome_message}
                            </div>
                        </div>

                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex ${msg.senderType === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                                <div
                                    className={`p-3 px-4 rounded-2xl shadow-sm max-w-[85%] text-sm leading-relaxed ${msg.senderType === 'visitor'
                                            ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-tr-none shadow-orange-500/20'
                                            : 'bg-white text-slate-700 rounded-tl-none border border-slate-100'
                                        }`}
                                >
                                    {msg.message}
                                </div>
                            </div>
                        ))}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input Area */}
                    <form onSubmit={sendMessage} className="p-4 bg-white border-t border-slate-100">
                        <div className="flex items-center space-x-2 bg-slate-50 rounded-full px-4 py-2 border border-slate-200 focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20 transition-all">
                            <input
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Escribe tu mensaje..."
                                className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-slate-700 placeholder:text-slate-400"
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim()}
                                className="p-2 rounded-full text-orange-600 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                <Send size={18} />
                            </button>
                        </div>
                        <div className="text-center mt-2">
                            <p className="text-[10px] text-slate-400">Powered by NoahPro Tpv</p>
                        </div>
                    </form>
                </div>
            )}

            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`p-4 rounded-full shadow-2xl hover:shadow-orange-500/30 transform hover:scale-105 transition-all duration-300 group ${isOpen ? 'bg-slate-800 text-white rotate-90' : 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                    }`}
            >
                {isOpen ? (
                    <X size={28} />
                ) : (
                    <MessageCircle size={28} className="group-hover:animate-pulse" />
                )}
            </button>
        </div>
    );
};

export default ChatWidget;
