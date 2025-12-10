import React, { useState, useEffect } from 'react';
import { Calendar, Check, X, ExternalLink } from 'lucide-react';

const GoogleCalendarSettings = () => {
    const [connected, setConnected] = useState(false);
    const [loading, setLoading] = useState(true);
    const [calendars, setCalendars] = useState([]);
    const [selectedCalendar, setSelectedCalendar] = useState('');

    useEffect(() => {
        checkConnection();
    }, []);

    const checkConnection = async () => {
        try {
            // Simulated API call
            // const response = await fetch('http://localhost:3002/api/calendar/status');
            // const data = await response.json();

            // Mock data
            setTimeout(() => {
                setConnected(false);
                setLoading(false);
            }, 1000);
        } catch (error) {
            console.error('Error checking calendar status:', error);
            setLoading(false);
        }
    };

    const handleConnect = () => {
        // Redirect to Google OAuth
        window.location.href = 'http://localhost:3002/api/auth/google';
    };

    const handleDisconnect = async () => {
        if (confirm('¿Estás seguro de desconectar tu cuenta de Google Calendar?')) {
            setConnected(false);
            setCalendars([]);
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando estado de conexión...</div>;
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center space-x-3 mb-6">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Calendar className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            Google Calendar
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Sincroniza tus eventos y reuniones automáticamente
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    <div className={`p-4 rounded-lg border ${connected
                        ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                        : 'bg-gray-50 dark:bg-gray-700/30 border-gray-200 dark:border-gray-600'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`w-3 h-3 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                                <span className="font-medium text-gray-900 dark:text-white">
                                    {connected ? 'Cuenta Conectada' : 'No Conectado'}
                                </span>
                            </div>
                            {connected && (
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    admin@noahpro.com
                                </span>
                            )}
                        </div>
                    </div>

                    {!connected ? (
                        <button
                            onClick={handleConnect}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-gray-700 dark:text-gray-200 font-medium"
                        >
                            <img
                                src="https://www.google.com/favicon.ico"
                                alt="Google"
                                className="w-5 h-5"
                            />
                            <span>Conectar con Google</span>
                        </button>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Calendario Principal
                                </label>
                                <select
                                    value={selectedCalendar}
                                    onChange={(e) => setSelectedCalendar(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                                >
                                    <option value="">Seleccionar calendario...</option>
                                    <option value="primary">Principal (admin@noahpro.com)</option>
                                    <option value="work">Trabajo</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                <button
                                    onClick={handleDisconnect}
                                    className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm font-medium flex items-center space-x-1"
                                >
                                    <X className="w-4 h-4" />
                                    <span>Desconectar cuenta</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Features Info */}
            <div className="space-y-6">
                <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-6 border border-orange-100 dark:border-orange-800">
                    <h4 className="font-semibold text-orange-900 dark:text-orange-100 mb-4">
                        Beneficios de la integración
                    </h4>
                    <ul className="space-y-3">
                        <li className="flex items-start space-x-3 text-sm text-orange-800 dark:text-orange-200">
                            <Check className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            <span>Sincronización bidireccional de eventos</span>
                        </li>
                        <li className="flex items-start space-x-3 text-sm text-orange-800 dark:text-orange-200">
                            <Check className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            <span>Generación automática de links de Google Meet</span>
                        </li>
                        <li className="flex items-start space-x-3 text-sm text-orange-800 dark:text-orange-200">
                            <Check className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                            <span>Bloqueo automático de horarios ocupados</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default GoogleCalendarSettings;
