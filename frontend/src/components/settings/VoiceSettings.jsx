/**
 * VoiceSettings.jsx
 * Configuración de credenciales SIP y parámetros de voz.
 */
import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import { Phone, Check, RefreshCw, Eye, EyeOff, Save } from 'lucide-react';
import Button from '../shared/Button';

const VoiceSettings = () => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [config, setConfig] = useState({
        sip_server: '',
        sip_username: '',
        sip_password: '',
        sip_port: 5060,
        is_active: false
    });

    const toast = useToast();
    const token = localStorage.getItem('crm_token');

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const response = await fetch(`${API_URL}/config/voice`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.user_id) { // Check if data exists
                    setConfig({
                        ...data,
                        sip_password: '' // Don't show encrypted password placeholder unless needed
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching voice config', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/config/voice`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                const result = await response.json();
                toast.success('Configuración de Voz guardada');
                setConfig(prev => ({ ...prev, ...result.config, sip_password: '' }));
            } else {
                toast.error('Error al guardar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-8 text-center"><RefreshCw className="animate-spin" /></div>;

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Phone className="w-5 h-5 text-indigo-500" />
                Configuración SIP / WebRTC
            </h3>
            <p className="text-sm text-gray-500 mb-6">
                Ingresa las credenciales de tu proveedor VoIP para habilitar el Softphone en el CRM.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Servidor SIP / Dominio
                    </label>
                    <input
                        type="text"
                        value={config.sip_server}
                        onChange={e => setConfig({ ...config, sip_server: e.target.value })}
                        placeholder="sip.provider.com"
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Puerto SIP (WSS)
                    </label>
                    <input
                        type="number"
                        value={config.sip_port}
                        onChange={e => setConfig({ ...config, sip_port: e.target.value })}
                        placeholder="5060 o 443"
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Usuario / Extensión
                    </label>
                    <input
                        type="text"
                        value={config.sip_username}
                        onChange={e => setConfig({ ...config, sip_username: e.target.value })}
                        placeholder="101"
                        className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Contraseña SIP
                    </label>
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            value={config.sip_password}
                            onChange={e => setConfig({ ...config, sip_password: e.target.value })}
                            placeholder={config.id ? "(Sin cambios)" : "Ingresa contraseña"}
                            className="w-full px-3 py-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 flex justify-end">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? <RefreshCw className="animate-spin w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                    Guardar Configuración
                </Button>
            </div>
        </div>
    );
};

export default VoiceSettings;
