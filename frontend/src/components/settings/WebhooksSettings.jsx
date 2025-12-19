import React, { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, Play, ExternalLink, Check, X, RefreshCw } from 'lucide-react';
import { API_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';

const WebhooksSettings = () => {
    const toast = useToast();
    const [webhooks, setWebhooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        events: ['*'],
        secret: '',
        is_active: true
    });

    const eventOptions = [
        { value: '*', label: 'Todos los eventos' },
        { value: 'lead_created', label: 'Lead creado' },
        { value: 'lead_updated', label: 'Lead actualizado' },
        { value: 'lead_status_changed', label: 'Estado de lead cambiado' },
        { value: 'proposal_sent', label: 'Propuesta enviada' },
        { value: 'proposal_viewed', label: 'Propuesta vista' },
        { value: 'invoice_created', label: 'Factura creada' }
    ];

    useEffect(() => {
        fetchWebhooks();
    }, []);

    const fetchWebhooks = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/webhooks`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setWebhooks(data);
            }
        } catch (error) {
            console.error('Error fetching webhooks:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/webhooks`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success('Webhook creado correctamente');
                setShowForm(false);
                setFormData({ name: '', url: '', events: ['*'], secret: '', is_active: true });
                fetchWebhooks();
            } else {
                throw new Error('Error al crear webhook');
            }
        } catch (error) {
            toast.error('Error al crear webhook');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Eliminar este webhook?')) return;

        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/webhooks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Webhook eliminado');
                fetchWebhooks();
            }
        } catch (error) {
            toast.error('Error al eliminar webhook');
        }
    };

    const handleTest = async (id) => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/webhooks/${id}/test`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Webhook probado correctamente');
            } else {
                throw new Error('Error en prueba');
            }
        } catch (error) {
            toast.error('Error al probar webhook');
        }
    };

    return (
        <div className="max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Webhooks</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Envía notificaciones a servicios externos cuando ocurran eventos
                    </p>
                </div>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Webhook
                </button>
            </div>

            {/* Form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                placeholder="Mi Webhook"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                URL Endpoint
                            </label>
                            <input
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                                placeholder="https://example.com/webhook"
                                required
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Eventos
                        </label>
                        <select
                            value={formData.events[0]}
                            onChange={(e) => setFormData({ ...formData, events: [e.target.value] })}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                        >
                            {eventOptions.map(opt => (
                                <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Secret (opcional)
                        </label>
                        <input
                            type="text"
                            value={formData.secret}
                            onChange={(e) => setFormData({ ...formData, secret: e.target.value })}
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg"
                            placeholder="whsec_..."
                        />
                        <p className="text-xs text-gray-500 mt-1">Se usará para firmar los payloads con HMAC-SHA256</p>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            type="button"
                            onClick={() => setShowForm(false)}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
                        >
                            Crear Webhook
                        </button>
                    </div>
                </form>
            )}

            {/* Webhooks List */}
            {loading ? (
                <div className="text-center py-12">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto text-gray-400" />
                </div>
            ) : webhooks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
                    <Webhook className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">No hay webhooks</h3>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Crea tu primer webhook para empezar</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {webhooks.map(webhook => (
                        <div
                            key={webhook.id}
                            className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${webhook.is_active ? 'bg-green-500' : 'bg-gray-400'}`} />
                                <div>
                                    <h4 className="font-medium text-gray-900 dark:text-white">{webhook.name}</h4>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-md">{webhook.url}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleTest(webhook.id)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
                                    title="Probar webhook"
                                >
                                    <Play className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleDelete(webhook.id)}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WebhooksSettings;
