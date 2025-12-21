/**
 * WebSoftphone
 * Widget de telefonía SIP integrado en el CRM.
 * Permite realizar llamadas y activa el Sales Copilot.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
    Phone, PhoneOff, Mic, MicOff, User, History, X, Minimize2, Maximize2,
    Delete, GripHorizontal, Brain, Sparkles, Volume2
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const WebSoftphone = ({ onCallStart, onCallEnd }) => {
    const [isOpen, setIsOpen] = useState(false); // Widget expandido o colapsado
    const [isMinimized, setIsMinimized] = useState(false); // Minimizado en barra
    const [number, setNumber] = useState('');
    const [status, setStatus] = useState('idle'); // idle, dialing, connected, incoming
    const [duration, setDuration] = useState(0);
    const [isMuted, setIsMuted] = useState(false);
    const [copilotActive, setCopilotActive] = useState(false);

    const timerRef = useRef(null);
    const toast = useToast();

    // Keypad numbers
    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '*', '0', '#'];

    useEffect(() => {
        if (status === 'connected') {
            timerRef.current = setInterval(() => {
                setDuration(prev => prev + 1);
            }, 1000);
        } else {
            clearInterval(timerRef.current);
            setDuration(0);
        }
        return () => clearInterval(timerRef.current);
    }, [status]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
        const secs = (seconds % 60).toString().padStart(2, '0');
        return `${mins}:${secs}`;
    };

    const handleKeyPress = (key) => {
        setNumber(prev => prev + key);
        // Play DTMF sound effect logic here
    };

    const handleCall = () => {
        if (!number) return;
        setStatus('dialing');

        // Simular conexión SIP
        setTimeout(() => {
            setStatus('connected');
            toast.success(`Llamada conectada con ${number}`);
            if (onCallStart) onCallStart({ number });
        }, 1500);
    };

    const handleHangup = () => {
        setStatus('idle');
        setCopilotActive(false);
        setNumber('');
        if (onCallEnd) onCallEnd();
    };

    const toggleCopilot = () => {
        const newState = !copilotActive;
        setCopilotActive(newState);
        if (newState) {
            toast.info('Sales Copilot activado: Escuchando objeciones...');
            // Emitir evento para activar HUD
            window.dispatchEvent(new CustomEvent('crm_copilot_toggle', { detail: { active: true, number } }));
        } else {
            window.dispatchEvent(new CustomEvent('crm_copilot_toggle', { detail: { active: false } }));
        }
    };

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full shadow-lg shadow-green-500/40 flex items-center justify-center text-white hover:scale-110 transition-transform z-50"
            >
                <Phone className="w-6 h-6 animate-pulse" />
            </button>
        );
    }

    return (
        <div className={`fixed bottom-6 right-6 w-80 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-700 overflow-hidden transition-all z-50 flex flex-col ${isMinimized ? 'h-16' : 'h-[500px]'}`}>

            {/* Header */}
            <div className="bg-slate-900 p-3 flex justify-between items-center text-white shrink-0">
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="font-semibold text-sm">SIP Phone</span>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsMinimized(!isMinimized)} className="hover:text-gray-300">
                        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                    </button>
                    <button onClick={() => setIsOpen(false)} className="hover:text-red-400">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Minimized View */}
            {isMinimized && (
                <div className="flex-1 flex items-center justify-between px-4" onClick={() => setIsMinimized(false)}>
                    <div className="flex items-center gap-2">
                        {status === 'connected' && <span className="text-green-500 text-sm font-mono">{formatTime(duration)}</span>}
                        <span className="text-sm font-medium dark:text-gray-200">{status === 'idle' ? 'Listo' : number}</span>
                    </div>
                </div>
            )}

            {/* Expanded View */}
            {!isMinimized && (
                <div className="flex-1 flex flex-col bg-gray-50 dark:bg-slate-900">

                    {/* Screen / Display */}
                    <div className="p-6 flex flex-col items-center justify-center bg-white dark:bg-slate-800 border-b border-gray-100 dark:border-slate-700 h-32 shrink-0 relative">
                        {status === 'idle' ? (
                            <>
                                <input
                                    type="text"
                                    value={number}
                                    onChange={(e) => setNumber(e.target.value)}
                                    placeholder="Marcar número..."
                                    className="text-2xl font-bold text-center bg-transparent border-none focus:ring-0 w-full text-gray-800 dark:text-white"
                                />
                                {number && (
                                    <button
                                        onClick={() => setNumber(prev => prev.slice(0, -1))}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        <Delete className="w-5 h-5" />
                                    </button>
                                )}
                            </>
                        ) : (
                            <>
                                <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-2">
                                    <User className="w-8 h-8 text-gray-400" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-800 dark:text-white">{number}</h3>
                                <p className={`text-sm font-mono ${status === 'connected' ? 'text-green-500' : 'text-orange-500'}`}>
                                    {status === 'connected' ? formatTime(duration) : 'Llamando...'}
                                </p>
                            </>
                        )}
                    </div>

                    {/* Keypad or In-Call Controls */}
                    <div className="flex-1 p-4">
                        {status === 'idle' ? (
                            // Dialpad
                            <div className="grid grid-cols-3 gap-3 h-full">
                                {keys.map(key => (
                                    <button
                                        key={key}
                                        onClick={() => handleKeyPress(key)}
                                        className="rounded-xl bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 shadow-sm border border-gray-200 dark:border-slate-700 text-xl font-semibold text-gray-700 dark:text-gray-200 transition-colors active:scale-95"
                                    >
                                        {key}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            // In-Call Controls
                            <div className="h-full flex flex-col text-white">
                                <div className="grid grid-cols-2 gap-3 mb-4">
                                    <button
                                        onClick={() => setIsMuted(!isMuted)}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all ${isMuted ? 'bg-red-500 text-white' : 'bg-slate-800 dark:bg-slate-700 text-gray-300 hover:bg-slate-700'}`}
                                    >
                                        {isMuted ? <MicOff className="w-6 h-6 mb-1" /> : <Mic className="w-6 h-6 mb-1" />}
                                        <span className="text-xs">{isMuted ? 'Unmute' : 'Mute'}</span>
                                    </button>

                                    <button
                                        onClick={toggleCopilot}
                                        className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all border ${copilotActive ? 'bg-indigo-600 border-indigo-500 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-slate-800 dark:bg-slate-700 border-indigo-500/30 text-indigo-300 hover:bg-slate-700'}`}
                                    >
                                        {copilotActive ? <Sparkles className="w-6 h-6 mb-1 animate-spin-slow" /> : <Brain className="w-6 h-6 mb-1" />}
                                        <span className="text-xs font-bold">Copilot</span>
                                    </button>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <button className="bg-slate-800 dark:bg-slate-700 rounded-xl flex items-center justify-center text-gray-400">
                                        <Volume2 className="w-5 h-5" />
                                    </button>
                                    <button className="bg-slate-800 dark:bg-slate-700 rounded-xl flex items-center justify-center text-gray-400">
                                        <GripHorizontal className="w-5 h-5" />
                                    </button>
                                    <button className="bg-slate-800 dark:bg-slate-700 rounded-xl flex items-center justify-center text-gray-400">
                                        <User className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Button (Call / Hangup) */}
                    <div className="p-4 pt-0">
                        {status === 'idle' ? (
                            <button
                                onClick={handleCall}
                                disabled={!number}
                                className="w-full py-3 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-lg font-bold rounded-xl shadow-lg shadow-green-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Phone className="w-5 h-5" /> Llamar
                            </button>
                        ) : (
                            <button
                                onClick={handleHangup}
                                className="w-full py-3 bg-red-500 hover:bg-red-600 text-white text-lg font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <PhoneOff className="w-5 h-5" /> Colgar
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default WebSoftphone;
