/**
 * AIGatewaySettings Component
 * Configuration panel for AI Gateway (Direct Gemini vs Stormsboys Gateway)
 */

import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import {
    Settings,
    Cloud,
    Cpu,
    Check,
    X,
    Loader2,
    RefreshCw,
    Eye,
    EyeOff,
    AlertTriangle,
    Zap,
    Server,
    Activity,
    ExternalLink
} from 'lucide-react';

const AIGatewaySettings = () => {
    const [config, setConfig] = useState({
        mode: 'direct',
        enabled: false,
        url: 'https://api.stormsboys-gateway.com/v1',
        apiKey: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [testResults, setTestResults] = useState(null);
    const [message, setMessage] = useState(null);

    // Get token - try both keys for compatibility
    const token = localStorage.getItem('crm_token') || localStorage.getItem('token');

    // Load current configuration
    useEffect(() => {
        loadConfig();
    }, []);

    const loadConfig = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/hunter/config/gateway`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setConfig({
                    mode: data.mode || 'direct',
                    enabled: data.enabled || false,
                    url: data.url || 'https://api.stormsboys-gateway.com/v1',
                    apiKey: data.apiKey || ''
                });
            }
        } catch (error) {
            console.error('Error loading config:', error);
            setMessage({ type: 'error', text: 'Error cargando configuración' });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setMessage(null);

        try {
            const response = await fetch(`${API_URL}/hunter/config/gateway`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
            } else {
                const data = await response.json();
                setMessage({ type: 'error', text: data.error || 'Error al guardar' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResults(null);

        try {
            const response = await fetch(`${API_URL}/hunter/config/test-providers`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setTestResults(data);
            } else {
                setMessage({ type: 'error', text: 'Error al probar conexiones' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Error de conexión' });
        } finally {
            setTesting(false);
        }
    };

    const toggleGateway = () => {
        const newEnabled = !config.enabled;
        setConfig({
            ...config,
            enabled: newEnabled,
            mode: newEnabled ? 'stormsboys_gateway' : 'direct'
        });
    };

    if (loading) {
        return (
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 shadow-xl border border-purple-500/30">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-purple-300" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 shadow-xl border border-purple-500/30 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl" />

            {/* Header */}
            <div className="relative flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-lg">
                        <Cloud className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">AI Gateway Stormsboys</h3>
                        <p className="text-purple-200 text-sm">Enrutador de IA empresarial</p>
                    </div>
                </div>

                {/* Status Indicator */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${config.enabled
                    ? 'bg-purple-500/30 text-purple-200'
                    : 'bg-green-500/30 text-green-200'
                    }`}>
                    <div className={`w-2.5 h-2.5 rounded-full ${config.enabled ? 'bg-purple-400 animate-pulse' : 'bg-green-400'
                        }`} />
                    <span className="text-sm font-medium">
                        {config.enabled ? '🟣 Stormsboys Gateway' : '🟢 Gemini Direct'}
                    </span>
                </div>
            </div>

            {/* Main Toggle */}
            <div className="relative bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-400/20">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Server className="w-5 h-5 text-purple-300" />
                        <div>
                            <p className="font-medium text-white">Habilitar Stormsboys Gateway</p>
                            <p className="text-sm text-purple-200">
                                Enruta las peticiones de IA a través del gateway empresarial
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={toggleGateway}
                        className={`relative w-14 h-8 rounded-full transition-all duration-300 ${config.enabled
                            ? 'bg-gradient-to-r from-purple-500 to-indigo-600'
                            : 'bg-gray-600'
                            }`}
                    >
                        <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg transition-all duration-300 ${config.enabled ? 'left-7' : 'left-1'
                            }`}>
                            {config.enabled ? (
                                <Cloud className="w-4 h-4 text-purple-600 absolute top-1 left-1" />
                            ) : (
                                <Cpu className="w-4 h-4 text-gray-600 absolute top-1 left-1" />
                            )}
                        </div>
                    </button>
                </div>
            </div>

            {/* Gateway Configuration */}
            {config.enabled && (
                <div className="relative space-y-4 mb-6 bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-purple-400/20">
                    <h4 className="font-medium text-white flex items-center gap-2">
                        <Settings className="w-4 h-4" />
                        Configuración del Gateway
                    </h4>

                    {/* Gateway URL */}
                    <div>
                        <label className="block text-sm text-purple-200 mb-1">Gateway URL</label>
                        <input
                            type="text"
                            value={config.url}
                            onChange={(e) => setConfig({ ...config, url: e.target.value })}
                            placeholder="https://api.stormsboys-gateway.com/v1"
                            className="w-full px-4 py-2.5 bg-white/10 border border-purple-400/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                    </div>

                    {/* API Key */}
                    <div>
                        <label className="block text-sm text-purple-200 mb-1">API Key del Gateway</label>
                        <div className="relative">
                            <input
                                type={showApiKey ? 'text' : 'password'}
                                value={config.apiKey}
                                onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                                placeholder="sk-gateway-..."
                                className="w-full px-4 py-2.5 pr-12 bg-white/10 border border-purple-400/30 rounded-lg text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            />
                            <button
                                onClick={() => setShowApiKey(!showApiKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white"
                            >
                                {showApiKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        <p className="text-xs text-purple-300/70 mt-1">
                            La API key se almacena encriptada en la base de datos
                        </p>
                    </div>
                </div>
            )}

            {/* Test Results */}
            {testResults && (
                <div className="relative bg-white/5 backdrop-blur-sm rounded-xl p-4 mb-6 border border-purple-400/20">
                    <h4 className="font-medium text-white flex items-center gap-2 mb-3">
                        <Activity className="w-4 h-4" />
                        Estado de los Proveedores
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Direct Gemini Status */}
                        <div className={`p-3 rounded-lg border ${testResults.direct?.success
                            ? 'bg-green-500/20 border-green-500/30'
                            : 'bg-red-500/20 border-red-500/30'
                            }`}>
                            <div className="flex items-center gap-2 mb-1">
                                {testResults.direct?.success ? (
                                    <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                    <X className="w-4 h-4 text-red-400" />
                                )}
                                <span className="font-medium text-white">Gemini Direct</span>
                            </div>
                            <p className="text-sm text-white/70">{testResults.direct?.message}</p>
                            {testResults.direct?.latency && (
                                <p className="text-xs text-white/50 mt-1">Latencia: {testResults.direct.latency}ms</p>
                            )}
                        </div>

                        {/* Gateway Status */}
                        <div className={`p-3 rounded-lg border ${testResults.gateway?.success
                            ? 'bg-purple-500/20 border-purple-500/30'
                            : 'bg-yellow-500/20 border-yellow-500/30'
                            }`}>
                            <div className="flex items-center gap-2 mb-1">
                                {testResults.gateway?.success ? (
                                    <Check className="w-4 h-4 text-purple-400" />
                                ) : (
                                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                                )}
                                <span className="font-medium text-white">Stormsboys Gateway</span>
                            </div>
                            <p className="text-sm text-white/70">{testResults.gateway?.message}</p>
                            {testResults.gateway?.latency && (
                                <p className="text-xs text-white/50 mt-1">Latencia: {testResults.gateway.latency}ms</p>
                            )}
                        </div>
                    </div>

                    <p className="text-xs text-purple-300/70 mt-3">
                        Modo activo: <span className="font-medium">{testResults.activeMode}</span>
                    </p>
                </div>
            )}

            {/* Message */}
            {message && (
                <div className={`relative mb-4 p-3 rounded-lg ${message.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/30 text-green-200'
                    : 'bg-red-500/20 border border-red-500/30 text-red-200'
                    }`}>
                    <div className="flex items-center gap-2">
                        {message.type === 'success' ? (
                            <Check className="w-4 h-4" />
                        ) : (
                            <X className="w-4 h-4" />
                        )}
                        {message.text}
                    </div>
                </div>
            )}

            {/* Action Buttons */}
            <div className="relative flex items-center gap-3">
                <button
                    onClick={handleTest}
                    disabled={testing}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 border border-purple-400/30 text-white rounded-lg transition-all disabled:opacity-50"
                >
                    {testing ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4" />
                    )}
                    Probar Conexiones
                </button>

                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg transition-all disabled:opacity-50"
                >
                    {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                        <Check className="w-4 h-4" />
                    )}
                    Guardar Configuración
                </button>
            </div>

            {/* Info Footer */}
            <div className="relative mt-6 pt-4 border-t border-purple-400/20">
                <div className="flex items-start gap-2 text-purple-200/70 text-sm">
                    <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <div>
                        <p className="font-medium text-purple-200">¿Qué es Stormsboys Gateway?</p>
                        <p className="mt-1">
                            Es nuestra infraestructura propietaria que enruta, optimiza y monitoriza las peticiones de IA.
                            Permite cambiar entre modelos (GPT-4, Claude, Gemini) sin modificar código y centraliza el coste y uso.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIGatewaySettings;
