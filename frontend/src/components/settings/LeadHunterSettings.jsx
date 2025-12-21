/**
 * Lead Hunter Settings
 * Panel de configuración de APIs y control de acceso para administradores
 */

import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import Button from '../shared/Button';
import Modal from '../shared/Modal';

import {
    Settings, Key, Globe, Sparkles, MessageSquare, Users,
    Check, X, RefreshCw, Eye, EyeOff, AlertCircle, TrendingUp,
    Search, Zap, Shield, LayoutTemplate, Utensils, Plus, Store, Phone,
    Briefcase, ShoppingBag, Coffee, Hotel, Dumbbell, Scissors, Stethoscope, Trash2, CloudLightning, Server, Lock
} from 'lucide-react';

const LeadHunterSettings = () => {
    const [activeTab, setActiveTab] = useState('apis');
    const [apiConfigs, setApiConfigs] = useState([]);
    const [users, setUsers] = useState([]);
    const [globalStats, setGlobalStats] = useState({});
    const [loading, setLoading] = useState(true);
    const [testingApi, setTestingApi] = useState(null);
    const [savingApi, setSavingApi] = useState(null);
    const [showKeys, setShowKeys] = useState({});
    const [editingConfig, setEditingConfig] = useState({});
    const [gatewayConfig, setGatewayConfig] = useState({ enabled: false, url: '', apiKey: '', mode: 'direct' });
    const [adminLoading, setAdminLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const toast = useToast();
    const token = localStorage.getItem('crm_token');

    useEffect(() => {
        fetchApiConfigs();
        fetchUsers();
        fetchGlobalStats();
        fetchGatewayConfig();
    }, []);

    const fetchGatewayConfig = async () => {
        try {
            const response = await fetch(`${API_URL}/hunter/config/gateway`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setGatewayConfig(await response.json());
            }
        } catch (error) {
            console.error('Error fetching gateway config:', error);
        }
    };

    const fetchApiConfigs = async () => {
        try {
            const response = await fetch(`${API_URL}/hunter/admin/config`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setApiConfigs(data);
                // Inicializar estado de edición
                const editing = {};
                data.forEach(config => {
                    editing[config.api_name] = { ...config, api_key: '' };
                });
                setEditingConfig(editing);
            }
        } catch (error) {
            console.error('Error fetching configs:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/hunter/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setUsers(await response.json());
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        }
    };

    const fetchGlobalStats = async () => {
        try {
            const response = await fetch(`${API_URL}/hunter/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setGlobalStats(await response.json());
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleSaveConfig = async (apiName) => {
        setSavingApi(apiName);
        try {
            const config = editingConfig[apiName];
            const body = {
                is_active: config.is_active,
                config_json: config.config_json
            };

            // Solo enviar api_key si se ha modificado
            if (config.api_key && config.api_key !== '********') {
                body.api_key = config.api_key;
            }

            const response = await fetch(`${API_URL}/hunter/admin/config/${apiName}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(body)
            });

            if (response.ok) {
                toast.success('Configuración guardada');
                fetchApiConfigs();
            } else {
                const error = await response.json();
                toast.error(error.error || 'Error al guardar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setSavingApi(null);
        }
    };

    const handleTestApi = async (apiName) => {
        setTestingApi(apiName);
        try {
            const response = await fetch(`${API_URL}/hunter/admin/test/${apiName}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }

            fetchApiConfigs();
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setTestingApi(null);
        }
    };

    const handleUpdateUserAccess = async (userId, field, value) => {
        try {
            const response = await fetch(`${API_URL}/hunter/admin/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ [field]: value })
            });

            if (response.ok) {
                toast.success('Usuario actualizado');
                fetchUsers();
            } else {
                toast.error('Error al actualizar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const handleSaveGatewayConfig = async () => {
        setSavingApi('gateway');
        try {
            const response = await fetch(`${API_URL}/hunter/config/gateway`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(gatewayConfig)
            });

            if (response.ok) {
                toast.success('Configuración del Gateway guardada');
                fetchGatewayConfig();
            } else {
                toast.error('Error al guardar configuración del Gateway');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setSavingApi(null);
        }
    };

    const getApiIcon = (apiName) => {
        switch (apiName) {
            case 'google_places': return <Globe className="w-5 h-5 text-blue-500" />;
            case 'gemini_vertex': return <Sparkles className="w-5 h-5 text-purple-500" />;
            case 'whatsapp_business': return <MessageSquare className="w-5 h-5 text-green-500" />;
            default: return <Key className="w-5 h-5 text-gray-500" />;
        }
    };

    const getApiLabel = (apiName) => {
        switch (apiName) {
            case 'google_places': return 'Google Places API';
            case 'gemini_vertex': return 'Gemini AI (Vertex)';
            case 'whatsapp_business': return 'WhatsApp Business';
            default: return apiName;
        }
    };

    const getApiDescription = (apiName) => {
        switch (apiName) {
            case 'google_places':
                return 'Para buscar negocios en Google Maps. Requiere API Key de Google Cloud con Places API habilitada.';
            case 'gemini_vertex':
                return 'Para análisis inteligente de prospectos con IA. Usa tu API Key de Google AI Studio.';
            case 'whatsapp_business':
                return 'Para enviar mensajes de WhatsApp. Requiere cuenta de Meta Business configurada.';
            default: return '';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                        <Search className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Lead Hunter AI</h2>
                        <p className="text-sm text-gray-500">Configuración del módulo de prospección</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 pb-2">
                {[
                    { id: 'apis', label: 'APIs', icon: Key },
                    { id: 'gateway', label: 'Integración Gateway', icon: CloudLightning },
                    { id: 'demos', label: 'Demos Avanzado', icon: LayoutTemplate },
                    { id: 'users', label: 'Control de Acceso', icon: Users },
                    { id: 'stats', label: 'Estadísticas', icon: TrendingUp }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${activeTab === tab.id
                            ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                    >
                        <tab.icon className="w-4 h-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab: APIs */}
            {activeTab === 'apis' && (
                <div className="space-y-6">
                    {apiConfigs.map(config => (
                        <div
                            key={config.api_name}
                            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    {getApiIcon(config.api_name)}
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white">
                                            {getApiLabel(config.api_name)}
                                        </h3>
                                        <p className="text-sm text-gray-500">{getApiDescription(config.api_name)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.is_active
                                        ? 'bg-green-100 text-green-700'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {config.is_active ? 'Activa' : 'Inactiva'}
                                    </span>
                                    {config.test_result && (
                                        <span className={`px-2 py-1 rounded-full text-xs ${config.test_result === 'success'
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-red-100 text-red-700'
                                            }`}>
                                            {config.test_result === 'success' ? '✓ Test OK' : '✗ Test Fallido'}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        API Key
                                    </label>
                                    <div className="relative">
                                        <input
                                            type={showKeys[config.api_name] ? 'text' : 'password'}
                                            value={editingConfig[config.api_name]?.api_key || ''}
                                            onChange={(e) => setEditingConfig({
                                                ...editingConfig,
                                                [config.api_name]: {
                                                    ...editingConfig[config.api_name],
                                                    api_key: e.target.value
                                                }
                                            })}
                                            placeholder={config.api_key ? '(guardada)' : 'Introduce tu API Key'}
                                            className="w-full px-4 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowKeys({ ...showKeys, [config.api_name]: !showKeys[config.api_name] })}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showKeys[config.api_name] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex items-end gap-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={editingConfig[config.api_name]?.is_active || false}
                                            onChange={(e) => setEditingConfig({
                                                ...editingConfig,
                                                [config.api_name]: {
                                                    ...editingConfig[config.api_name],
                                                    is_active: e.target.checked
                                                }
                                            })}
                                            className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Activar API</span>
                                    </label>
                                </div>
                            </div>

                            {/* Gemini Specific Config */}
                            {config.api_name === 'gemini_vertex' && (
                                <div className="space-y-4 mb-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Modelo Gemini
                                        </label>
                                        <select
                                            value={editingConfig[config.api_name]?.config_json?.model || 'gemini-2.0-flash-exp'}
                                            onChange={(e) => setEditingConfig({
                                                ...editingConfig,
                                                [config.api_name]: {
                                                    ...editingConfig[config.api_name],
                                                    config_json: {
                                                        ...editingConfig[config.api_name].config_json,
                                                        model: e.target.value
                                                    }
                                                }
                                            })}
                                            className="block w-full sm:text-sm border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                        >
                                            <option value="gemini-2.0-flash-exp">Gemini 2.0 Flash (Recomendado)</option>
                                            <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                                            <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                            Instrucciones del Sistema (Prompt)
                                        </label>
                                        <textarea
                                            value={editingConfig[config.api_name]?.config_json?.systemInstruction || ''}
                                            onChange={(e) => setEditingConfig({
                                                ...editingConfig,
                                                [config.api_name]: {
                                                    ...editingConfig[config.api_name],
                                                    config_json: {
                                                        ...editingConfig[config.api_name].config_json,
                                                        systemInstruction: e.target.value
                                                    }
                                                }
                                            })}
                                            rows={10}
                                            className="block w-full font-mono text-sm border-gray-300 rounded-md focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                            placeholder="Instrucciones personalizadas para la IA..."
                                        />
                                        <p className="mt-1 text-xs text-gray-500">Dejar en blanco para usar el prompt por defecto del sistema.</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button
                                    onClick={() => handleSaveConfig(config.api_name)}
                                    disabled={savingApi === config.api_name}
                                    size="sm"
                                >
                                    {savingApi === config.api_name ? (
                                        <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                                    ) : (
                                        <Check className="w-4 h-4 mr-1" />
                                    )}
                                    Guardar
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleTestApi(config.api_name)}
                                    disabled={testingApi === config.api_name || !config.is_active}
                                    size="sm"
                                >
                                    {testingApi === config.api_name ? (
                                        <RefreshCw className="w-4 h-4 animate-spin mr-1" />
                                    ) : (
                                        <Zap className="w-4 h-4 mr-1" />
                                    )}
                                    Probar Conexión
                                </Button>
                            </div>
                        </div>
                    ))}

                    {/* Guía de Configuración - Estilo unificado con Redes Sociales */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-5 border border-blue-200 dark:border-blue-800">
                        <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                            <AlertCircle className="w-5 h-5" />
                            Guía Rápida de Configuración (API Keys)
                        </h4>
                        <p className="text-sm text-blue-700 dark:text-blue-300 mb-4">
                            Sigue estos pasos para habilitar las funcionalidades principales del Lead Hunter.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            {/* Google Places Card */}
                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">📍</span>
                                    <strong className="text-blue-700 dark:text-blue-400">Google Places</strong>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                    Necesario para encontrar negocios y obtener sus datos de Maps.
                                </p>
                                <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                                    <li>Ir a <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-600">Cloud Console</a></li>
                                    <li>Habilitar <strong>Places API</strong></li>
                                    <li>Crear API Key en Credenciales</li>
                                </ol>
                            </div>

                            {/* Gemini AI Card */}
                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-purple-100 dark:border-purple-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">✨</span>
                                    <strong className="text-purple-700 dark:text-purple-400">Gemini AI</strong>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                    El cerebro de la IA para análisis estratégico y demos.
                                </p>
                                <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                                    <li>Ir a <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="underline text-purple-600">AI Studio</a></li>
                                    <li>Pulsar en <strong>Create API Key</strong></li>
                                    <li>Copiar la clave generada</li>
                                </ol>
                            </div>

                            {/* WhatsApp Card */}
                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-green-100 dark:border-green-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xl">💬</span>
                                    <strong className="text-green-700 dark:text-green-400">WhatsApp Cloud</strong>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                                    Para enviar notificaciones y demos directamente.
                                </p>
                                <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                                    <li>Ir a <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline text-green-600">Meta Devs</a></li>
                                    <li>Configurar <strong>WhatsApp</strong></li>
                                    <li>Obtener Token de acceso</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    {/* Redes Sociales APIs - Próximamente */}
                    <div className="bg-gradient-to-br from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-xl p-5 border border-pink-200 dark:border-pink-800">
                        <h4 className="font-semibold text-pink-800 dark:text-pink-300 mb-3 flex items-center gap-2">
                            <Sparkles className="w-5 h-5" />
                            APIs de Redes Sociales (Próximamente)
                        </h4>
                        <p className="text-sm text-pink-700 dark:text-pink-300 mb-4">
                            Configurar estas APIs permitirá obtener información detallada de los perfiles sociales de los prospectos.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            {/* Instagram API */}
                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-pink-100 dark:border-pink-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">📸</span>
                                    <strong className="text-pink-700">Instagram Basic Display API</strong>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                    Para obtener datos públicos de perfiles de Instagram.
                                </p>
                                <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                                    <li>Ir a <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline text-pink-600">developers.facebook.com</a></li>
                                    <li>Crear una App de tipo "Consumer"</li>
                                    <li>Añadir producto "Instagram Basic Display"</li>
                                    <li>Configurar OAuth y obtener Access Token</li>
                                </ol>
                                <div className="mt-3 flex gap-2">
                                    <input
                                        type="password"
                                        placeholder="Instagram Access Token"
                                        className="flex-1 px-3 py-1.5 text-xs border rounded-lg bg-gray-50"
                                        disabled
                                    />
                                    <button className="px-3 py-1.5 text-xs bg-gray-200 text-gray-500 rounded-lg" disabled>
                                        Próximamente
                                    </button>
                                </div>
                            </div>

                            {/* Facebook Graph API */}
                            <div className="bg-white/80 dark:bg-gray-800/80 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">📘</span>
                                    <strong className="text-blue-700 dark:text-blue-400">Facebook Graph API</strong>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                                    Para información de páginas de negocios en Facebook.
                                </p>
                                <ol className="text-xs text-gray-600 dark:text-gray-400 space-y-1 list-decimal list-inside">
                                    <li>Ir a <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="underline text-blue-600 dark:text-blue-400">developers.facebook.com</a></li>
                                    <li>Crear una App de tipo "Business"</li>
                                    <li>Añadir producto "Facebook Login" y "Pages API"</li>
                                    <li>Generar Access Token con permisos de páginas</li>
                                </ol>
                                <div className="mt-3 flex gap-2">
                                    <input
                                        type="password"
                                        placeholder="Facebook Access Token"
                                        className="flex-1 px-3 py-1.5 text-xs border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-white dark:border-gray-600"
                                        disabled
                                    />
                                    <button className="px-3 py-1.5 text-xs bg-gray-200 text-gray-500 rounded-lg" disabled>
                                        Próximamente
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Gateway Integration */}
            {activeTab === 'gateway' && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900 via-purple-900 to-slate-900 rounded-xl p-8 text-white shadow-xl relative overflow-hidden">
                        {/* Background Effect */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
                        <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

                        <div className="relative z-10 flex items-start justify-between">
                            <div>
                                <h3 className="text-2xl font-bold flex items-center gap-3 mb-2">
                                    <CloudLightning className="w-8 h-8 text-yellow-400" />
                                    Stormsboys AI Gateway
                                </h3>
                                <p className="text-indigo-200 max-w-xl">
                                    Conecta NoahPro a la infraestructura de supercomputación Stormsboys.
                                    Esto permitirá orquestación multimodelo (GPT-4, Gemini Ultra, Claude 3)
                                    y procesamiento de datos masivos con cifrado de grado militar.
                                </p>
                            </div>
                            <div className={`px-4 py-2 rounded-full font-bold flex items-center gap-2 ${gatewayConfig.enabled
                                ? 'bg-green-500/20 text-green-300 border border-green-500/50'
                                : 'bg-gray-700/50 text-gray-400 border border-gray-600'
                                }`}>
                                <div className={`w-3 h-3 rounded-full ${gatewayConfig.enabled ? 'bg-green-400 animate-pulse' : 'bg-gray-500'}`}></div>
                                {gatewayConfig.enabled ? 'CONECTADO' : 'DESCONECTADO'}
                            </div>
                        </div>

                        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-indigo-200 mb-1">Gateway Endpoint URL</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Server className="h-5 w-5 text-indigo-400" />
                                        </div>
                                        <input
                                            type="text"
                                            value={gatewayConfig.url}
                                            onChange={(e) => setGatewayConfig({ ...gatewayConfig, url: e.target.value })}
                                            className="block w-full pl-10 pr-3 py-2 border border-indigo-500/30 rounded-lg bg-indigo-900/50 text-white placeholder-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="https://api.stormsboys-gateway.com/v1"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-indigo-200 mb-1">API Key Maestra</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <Lock className="h-5 w-5 text-indigo-400" />
                                        </div>
                                        <input
                                            type="password"
                                            value={gatewayConfig.apiKey}
                                            onChange={(e) => setGatewayConfig({ ...gatewayConfig, apiKey: e.target.value })}
                                            className="block w-full pl-10 pr-3 py-2 border border-indigo-500/30 rounded-lg bg-indigo-900/50 text-white placeholder-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                            placeholder="sk-stormsboys-..."
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-xl p-6 border border-white/10">
                                <h4 className="font-semibold text-white mb-4">Estado de la Integración</h4>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between items-center text-indigo-200">
                                        <span>Modo Actual:</span>
                                        <span className="font-mono bg-indigo-900/50 px-2 py-1 rounded">
                                            {gatewayConfig.enabled ? 'GATEWAY (Remoto)' : 'DIRECTO (Local/Gemini)'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center text-indigo-200">
                                        <span>Latencia Estimada:</span>
                                        <span className="text-gray-400">-- ms</span>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-white/10">
                                        <label className="flex items-center gap-3 cursor-pointer">
                                            <div className="relative">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={gatewayConfig.enabled}
                                                    onChange={(e) => setGatewayConfig({ ...gatewayConfig, enabled: e.target.checked })}
                                                />
                                                <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
                                            </div>
                                            <span className="text-white font-medium">
                                                Habilitar Gateway
                                            </span>
                                        </label>
                                        <p className="text-xs text-indigo-300 mt-2">
                                            Al activar, todo el tráfico de IA será enrutado a través del Gateway.
                                            Asegúrate de que la API Key sea válida.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-end">
                            <Button
                                onClick={handleSaveGatewayConfig}
                                disabled={savingApi === 'gateway'}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white border-0"
                            >
                                {savingApi === 'gateway' && <RefreshCw className="w-4 h-4 animate-spin mr-2" />}
                                Guardar Configuración
                            </Button>
                        </div>
                    </div>

                    {/* Placeholder Info */}
                    <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-6">
                        <div className="flex gap-4">
                            <div className="p-3 bg-orange-100 dark:bg-orange-900/40 rounded-lg h-fit">
                                <AlertCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                            </div>
                            <div>
                                <h4 className="font-bold text-orange-800 dark:text-orange-300 mb-2">Desarrollo en Progreso</h4>
                                <p className="text-orange-700 dark:text-orange-200 text-sm">
                                    La integración con Stormsboys Gateway está preparada pero a la espera del despliegue final del servicio.
                                    Por el momento, el sistema seguirá utilizando la configuración de <strong>IA Directa</strong> (Gemini API) definida en la pestaña "APIs".
                                    Una vez el Gateway esté operativo, introduce aquí tu API Key maestra para escalar la capacidad de procesamiento.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}



            {/* Tab: Demos Avanzado */}
            {activeTab === 'demos' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Tipos de Demo Personalizados</h3>
                                <p className="text-sm text-gray-500">Configura los estilos y prompts base para las generaciones</p>
                            </div>
                            <Button onClick={() => {
                                const label = prompt("Nombre del nuevo tipo (ej: Dentista):");
                                if (label) {
                                    const saved = localStorage.getItem('hunter_custom_demo_types');
                                    const current = saved ? JSON.parse(saved) : [];
                                    const newType = {
                                        id: label.toLowerCase().replace(/\s+/g, '_'),
                                        label: `🎨 ${label}`,
                                        desc: `Estilo personalizado para ${label}`,
                                        isCustom: true
                                    };
                                    localStorage.setItem('hunter_custom_demo_types', JSON.stringify([...current, newType]));
                                    toast.success("Tipo añadido. Recarga el dashboard para verlo.");
                                    fetchGlobalStats(); // dummy call to trigger re-render if needed, though this is settings
                                }
                            }}>
                                <Plus className="w-4 h-4 mr-2" /> Añadir Tipo
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {[
                                { id: 'modern', label: 'Moderno', icon: Zap, desc: 'Diseño actual y minimalista', system: true },
                                { id: 'restaurant', label: 'Restaurante', icon: Utensils, desc: 'Menús, reservas, ambiente', system: true },
                                { id: 'store', label: 'Tienda', icon: Store, desc: 'Productos, catálogo, ofertas', system: true },
                                { id: 'services', label: 'Servicios', icon: Briefcase, desc: 'Profesional, contacto, portfolio', system: true },
                                { id: 'luxury', label: 'Premium', icon: Sparkles, desc: 'Elegante y exclusivo', system: true },
                                { id: 'custom', label: 'Personalizado', icon: MessageSquare, desc: 'Prompt libre del usuario', system: true },
                                ...(JSON.parse(localStorage.getItem('hunter_custom_demo_types') || '[]').map(t => ({
                                    ...t,
                                    iconComponent: [Zap, Utensils, Store, Briefcase, Sparkles, MessageSquare, ShoppingBag, Coffee, Hotel, Dumbbell, Scissors, Stethoscope].find(i => i.name === t.icon) || Zap
                                })))
                            ].map(type => (
                                <div key={type.id} className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 relative group">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-indigo-600 dark:text-indigo-400">
                                            {(() => {
                                                const Icon = (typeof type.icon === 'function' ? type.icon : null) || type.iconComponent || Zap;
                                                return <Icon className="w-5 h-5" />;
                                            })()}
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{type.label}</h4>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-3">{type.desc}</p>
                                    <div className="flex items-center justify-between mt-auto">
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${type.system ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'}`}>
                                            {type.system ? 'Sistema' : 'Personalizado'}
                                        </span>
                                        {!type.system && (
                                            <button
                                                onClick={() => {
                                                    if (confirm("¿Eliminar este tipo?")) {
                                                        const current = JSON.parse(localStorage.getItem('hunter_custom_demo_types') || '[]');
                                                        localStorage.setItem('hunter_custom_demo_types', JSON.stringify(current.filter(t => t.id !== type.id)));
                                                        toast.success("Tipo eliminado");
                                                        fetchGlobalStats();
                                                    }
                                                }}
                                                className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Advanced Logic Config */}
                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-indigo-100 dark:border-indigo-800">
                        <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-4 flex items-center gap-2">
                            <Settings className="w-5 h-5" /> Configuración Lógica Avanzada
                        </h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Generación de Imágenes Multi-Fuente</p>
                                    <p className="text-xs text-gray-500">Combina Google Places con Unsplash/Stock para máxima calidad</p>
                                </div>
                                <div className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full font-bold">ACTIVO</div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/60 dark:bg-gray-800/60 rounded-lg opacity-50">
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Auto-publicación en Hosting Temporal</p>
                                    <p className="text-xs text-gray-500">Genera una URL compartible automáticamente al terminar</p>
                                </div>
                                <div className="bg-gray-100 text-gray-500 text-xs px-2 py-1 rounded-full font-bold">MODO EXPERTO</div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Users */}
            {activeTab === 'users' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Usuario</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Acceso</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Límite Diario</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Prospectos</th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Leads</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {users.map(user => (
                                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{user.full_name || user.username}</p>
                                            <p className="text-sm text-gray-500">{user.email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button
                                            onClick={() => handleUpdateUserAccess(user.id, 'has_lead_hunter_access', !user.has_lead_hunter_access)}
                                            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${user.has_lead_hunter_access
                                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {user.has_lead_hunter_access ? '✓ Activo' : 'Inactivo'}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <input
                                            type="number"
                                            value={user.hunter_daily_limit || 50}
                                            onChange={(e) => handleUpdateUserAccess(user.id, 'hunter_daily_limit', parseInt(e.target.value))}
                                            className="w-20 px-2 py-1 text-center border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                            min="0"
                                            max="500"
                                        />
                                    </td>
                                    <td className="px-6 py-4 text-center text-gray-600 dark:text-gray-400">
                                        {user.total_searched || 0}
                                    </td>
                                    <td className="px-6 py-4 text-center font-medium text-gray-900 dark:text-white">
                                        {user.total_leads || 0}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Tab: Stats */}
            {activeTab === 'stats' && globalStats && (
                <div className="space-y-6">
                    {/* Stats globales */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {globalStats.global?.total_searched || 0}
                            </div>
                            <div className="text-sm text-gray-500">Prospectos buscados</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                {globalStats.global?.total_analyzed || 0}
                            </div>
                            <div className="text-sm text-gray-500">Analizados con IA</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="text-3xl font-bold text-green-600">
                                {globalStats.global?.total_leads || 0}
                            </div>
                            <div className="text-sm text-gray-500">Leads creados</div>
                        </div>
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="text-3xl font-bold text-orange-600">
                                {globalStats.today?.leads || 0}
                            </div>
                            <div className="text-sm text-gray-500">Leads hoy</div>
                        </div>
                    </div>

                    {/* Top usuarios */}
                    {globalStats.topUsers && globalStats.topUsers.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Top Comerciales</h3>
                            <div className="space-y-3">
                                {globalStats.topUsers.map((user, idx) => (
                                    <div key={idx} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : idx === 2 ? 'bg-orange-700' : 'bg-gray-300'
                                                }`}>
                                                {idx + 1}
                                            </span>
                                            <span className="text-gray-900 dark:text-white">{user.full_name || user.username}</span>
                                        </div>
                                        <span className="font-semibold text-green-600">{user.leads_created} leads</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Confirmation Modal */}
            <Modal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                title={confirmModal.title}
                size="sm"
            >
                <div className="space-y-6">
                    <p className="text-sm text-gray-600 dark:text-gray-300">{confirmModal.message}</p>
                    <div className="flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setConfirmModal({ ...confirmModal, isOpen: false })}>Cancelar</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            onClick={confirmModal.onConfirm}
                        >
                            Eliminar
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default LeadHunterSettings;
