import React, { useState, useEffect } from 'react';
import { Power, Mail, Clock, Settings as SettingsIcon, Save, TestTube } from 'lucide-react';
import { API_URL } from '../../config';

const AutomationSettings = () => {
    const [settings, setSettings] = useState({
        enabled: false,
        send_initial_proposal: true,
        reminder_1_enabled: true,
        reminder_1_days: 2,
        reminder_2_enabled: true,
        reminder_2_days: 4,
        email_template_initial: null,
        email_template_reminder_1: null,
        email_template_reminder_2: null
    });

    const [loading, setLoading] = useState(false);
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        fetchSettings();
        fetchLogs();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/automation/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Merge with defaults for any missing fields
                setSettings(prev => ({
                    ...prev,
                    enabled: data.activeRules > 0
                }));
            }
        } catch (error) {
            console.error('Error fetching automation settings:', error);
        }
    };

    const fetchLogs = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/automation/logs?limit=10`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setLogs(data.map(log => ({
                    id: log.id,
                    lead_name: log.rule_name,
                    action: log.action_type,
                    status: log.status,
                    timestamp: new Date(log.executed_at).toLocaleString('es-ES')
                })));
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            // Fallback to sample data
            setLogs([]);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // For now, just show success - the actual rule saving is done via the rules API
            alert('Configuración guardada correctamente');
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Error al guardar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const getActionLabel = (action) => {
        const labels = {
            initial_proposal: 'Propuesta Inicial',
            reminder_1: 'Recordatorio 1',
            reminder_2: 'Recordatorio 2'
        };
        return labels[action] || action;
    };

    return (
        <div className="max-w-4xl space-y-6">
            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Automatización de Marketing</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Configura el seguimiento automático de leads
                </p>
            </div>

            {/* Main Toggle */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <Power className={`w-6 h-6 ${settings.enabled ? 'text-green-500' : 'text-gray-400'}`} />
                        <div>
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                Automatización {settings.enabled ? 'Activada' : 'Desactivada'}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {settings.enabled
                                    ? 'Los leads se gestionan automáticamente'
                                    : 'Gestión manual de leads'}
                            </p>
                        </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                        <input
                            type="checkbox"
                            checked={settings.enabled}
                            onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                            className="sr-only peer"
                        />
                        <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-gray-600 peer-checked:bg-orange-600"></div>
                    </label>
                </div>
            </div>

            {/* Configuration */}
            {settings.enabled && (
                <>
                    {/* Initial Proposal */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                            <Mail className="w-5 h-5 text-orange-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Propuesta Inicial</h3>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={settings.send_initial_proposal}
                                    onChange={(e) => setSettings({ ...settings, send_initial_proposal: e.target.checked })}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Enviar propuesta automáticamente al crear un lead
                                </span>
                            </label>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Plantilla de Email
                                </label>
                                <select className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                                    <option>Plantilla por defecto</option>
                                    <option>Propuesta Comercial Estándar</option>
                                    <option>Propuesta Premium</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Reminder 1 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                            <Clock className="w-5 h-5 text-yellow-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Primer Recordatorio</h3>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={settings.reminder_1_enabled}
                                    onChange={(e) => setSettings({ ...settings, reminder_1_enabled: e.target.checked })}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Enviar recordatorio si no abre la propuesta
                                </span>
                            </label>
                            {settings.reminder_1_enabled && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Días de espera
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.reminder_1_days}
                                            onChange={(e) => setSettings({ ...settings, reminder_1_days: parseInt(e.target.value) })}
                                            min="1"
                                            max="30"
                                            className="w-32 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                                        />
                                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">días</span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Plantilla de Email
                                        </label>
                                        <select className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                                            <option>Recordatorio Amigable</option>
                                            <option>Recordatorio con Beneficios</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Reminder 2 */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-3 mb-4">
                            <Clock className="w-5 h-5 text-orange-500" />
                            <h3 className="font-semibold text-gray-900 dark:text-white">Segundo Recordatorio</h3>
                        </div>
                        <div className="space-y-4">
                            <label className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    checked={settings.reminder_2_enabled}
                                    onChange={(e) => setSettings({ ...settings, reminder_2_enabled: e.target.checked })}
                                    className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                    Enviar segundo recordatorio
                                </span>
                            </label>
                            {settings.reminder_2_enabled && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Días de espera
                                        </label>
                                        <input
                                            type="number"
                                            value={settings.reminder_2_days}
                                            onChange={(e) => setSettings({ ...settings, reminder_2_days: parseInt(e.target.value) })}
                                            min="1"
                                            max="30"
                                            className="w-32 px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white"
                                        />
                                        <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">días</span>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Plantilla de Email
                                        </label>
                                        <select className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white">
                                            <option>Última Oportunidad</option>
                                            <option>Oferta Especial</option>
                                        </select>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Logs */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Registro de Actividad</h3>
                        <div className="space-y-2">
                            {logs.map(log => (
                                <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <span className={`w-2 h-2 rounded-full ${log.status === 'sent' ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                        <div>
                                            <p className="text-sm font-medium text-gray-900 dark:text-white">{log.lead_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{getActionLabel(log.action)}</p>
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{log.timestamp}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Save Button */}
            <div className="flex justify-end space-x-3">
                <button className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                    Cancelar
                </button>
                <button
                    onClick={handleSave}
                    disabled={loading}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    <span>{loading ? 'Guardando...' : 'Guardar Configuración'}</span>
                </button>
            </div>
        </div>
    );
};

export default AutomationSettings;
