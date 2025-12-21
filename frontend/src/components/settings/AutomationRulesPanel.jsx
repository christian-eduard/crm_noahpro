import React, { useState, useEffect } from 'react';
import {
    Zap, Plus, Trash2, Power, Play, Pause,
    ArrowRight, Tag, Mail, UserPlus, Bell,
    Clock, CheckCircle, X, AlertCircle, Edit,
    RefreshCw, Settings, ChevronDown, Save
} from 'lucide-react';
import { API_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import Button from '../shared/Button';

/**
 * AutomationRulesPanel - Panel completo para gestión de reglas IF/THEN
 */
const AutomationRulesPanel = () => {
    const toast = useToast();
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showEditor, setShowEditor] = useState(false);
    const [editingRule, setEditingRule] = useState(null);
    const [saving, setSaving] = useState(false);
    const [stats, setStats] = useState({ activeRules: 0, executionsToday: 0 });

    const token = localStorage.getItem('crm_token');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        trigger_type: 'status_change',
        trigger_config: {},
        action_type: 'send_email',
        action_config: {},
        is_active: true
    });

    // Trigger options
    const triggerTypes = [
        { value: 'status_change', label: 'Cambio de Estado', icon: <ArrowRight className="w-4 h-4" /> },
        { value: 'tag_added', label: 'Tag Añadido', icon: <Tag className="w-4 h-4" /> },
        { value: 'time_based', label: 'Tiempo sin Actividad', icon: <Clock className="w-4 h-4" /> },
        { value: 'lead_created', label: 'Lead Creado', icon: <Plus className="w-4 h-4" /> }
    ];

    // Action options
    const actionTypes = [
        { value: 'send_email', label: 'Enviar Email', icon: <Mail className="w-4 h-4" /> },
        { value: 'assign_user', label: 'Asignar Usuario', icon: <UserPlus className="w-4 h-4" /> },
        { value: 'add_tag', label: 'Añadir Tag', icon: <Tag className="w-4 h-4" /> },
        { value: 'create_task', label: 'Crear Tarea', icon: <CheckCircle className="w-4 h-4" /> },
        { value: 'notification', label: 'Notificación', icon: <Bell className="w-4 h-4" /> }
    ];

    // Status options
    const statusOptions = [
        { value: 'new', label: 'Nuevo' },
        { value: 'contacted', label: 'Contactado' },
        { value: 'qualified', label: 'Cualificado' },
        { value: 'proposal_sent', label: 'Propuesta Enviada' },
        { value: 'won', label: 'Ganado' },
        { value: 'lost', label: 'Perdido' }
    ];

    useEffect(() => {
        fetchRules();
        fetchStats();
    }, []);

    const fetchRules = async () => {
        try {
            const response = await fetch(`${API_URL}/automation/rules`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setRules(data);
            }
        } catch (error) {
            console.error('Error fetching rules:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/automation/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStats(data);
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const handleSaveRule = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error('El nombre de la regla es requerido');
            return;
        }

        setSaving(true);
        try {
            const url = editingRule
                ? `${API_URL}/automation/rules/${editingRule.id}`
                : `${API_URL}/automation/rules`;

            const method = editingRule ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                toast.success(editingRule ? 'Regla actualizada' : 'Regla creada');
                setShowEditor(false);
                setEditingRule(null);
                resetForm();
                fetchRules();
                fetchStats();
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            toast.error('Error al guardar la regla');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleRule = async (ruleId, isActive) => {
        try {
            const response = await fetch(`${API_URL}/automation/rules/${ruleId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ is_active: !isActive })
            });

            if (response.ok) {
                setRules(rules.map(r =>
                    r.id === ruleId ? { ...r, is_active: !isActive } : r
                ));
                toast.success(isActive ? 'Regla desactivada' : 'Regla activada');
                fetchStats();
            }
        } catch (error) {
            toast.error('Error al cambiar estado');
        }
    };

    const handleDeleteRule = async (ruleId) => {
        if (!window.confirm('¿Eliminar esta regla de automatización?')) return;

        try {
            const response = await fetch(`${API_URL}/automation/rules/${ruleId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                setRules(rules.filter(r => r.id !== ruleId));
                toast.success('Regla eliminada');
                fetchStats();
            }
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            trigger_type: 'status_change',
            trigger_config: {},
            action_type: 'send_email',
            action_config: {},
            is_active: true
        });
    };

    const openEditor = (rule = null) => {
        if (rule) {
            setEditingRule(rule);
            setFormData({
                name: rule.name,
                trigger_type: rule.trigger_type,
                trigger_config: rule.trigger_config || {},
                action_type: rule.action_type,
                action_config: rule.action_config || {},
                is_active: rule.is_active
            });
        } else {
            setEditingRule(null);
            resetForm();
        }
        setShowEditor(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-12">
                <RefreshCw className="w-6 h-6 animate-spin text-indigo-600" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header with Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl">
                            <Zap className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        Reglas de Automatización
                    </h2>
                    <p className="text-gray-500 mt-1">Automatiza acciones basadas en eventos del CRM</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Reglas activas</p>
                        <p className="text-2xl font-bold text-indigo-600">{stats.activeRules || 0}</p>
                    </div>
                    <Button onClick={() => openEditor()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        <Plus className="w-4 h-4 mr-2" />
                        Nueva Regla
                    </Button>
                </div>
            </div>

            {/* Rule Editor Modal/Panel */}
            {showEditor && (
                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-indigo-100 dark:border-indigo-900/30 overflow-hidden animate-slideDown">
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/30 flex justify-between items-center">
                        <h3 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
                            <Settings className="w-5 h-5" />
                            {editingRule ? 'Editar Regla' : 'Crear Nueva Regla'}
                        </h3>
                        <button onClick={() => setShowEditor(false)} className="p-1 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 rounded-lg">
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    <form onSubmit={handleSaveRule} className="p-6 space-y-6">
                        {/* Rule Name */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">
                                Nombre de la Regla
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
                                placeholder="Ej: Enviar email cuando lead pase a Cualificado"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* WHEN (Trigger) */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-100 dark:border-blue-900/30">
                                <h4 className="font-bold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                                    <Clock className="w-4 h-4" />
                                    CUANDO (Trigger)
                                </h4>
                                <select
                                    value={formData.trigger_type}
                                    onChange={(e) => setFormData({ ...formData, trigger_type: e.target.value, trigger_config: {} })}
                                    className="w-full px-4 py-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-800 mb-3"
                                >
                                    {triggerTypes.map(t => (
                                        <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                </select>

                                {/* Trigger Value Config */}
                                {formData.trigger_type === 'status_change' && (
                                    <div className="space-y-2">
                                        <select
                                            value={formData.trigger_config.from || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                trigger_config: { ...formData.trigger_config, from: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 rounded-lg border text-sm"
                                        >
                                            <option value="">Cualquier estado previo</option>
                                            {statusOptions.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                        <div className="text-center text-gray-400">→</div>
                                        <select
                                            value={formData.trigger_config.to || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                trigger_config: { ...formData.trigger_config, to: e.target.value }
                                            })}
                                            className="w-full px-3 py-2 rounded-lg border text-sm"
                                        >
                                            <option value="">Selecciona estado destino</option>
                                            {statusOptions.map(s => (
                                                <option key={s.value} value={s.value}>{s.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {formData.trigger_type === 'time_based' && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-gray-600">Sin actividad por</span>
                                        <input
                                            type="number"
                                            value={formData.trigger_config.days || 3}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                trigger_config: { days: parseInt(e.target.value) }
                                            })}
                                            className="w-20 px-3 py-2 rounded-lg border text-sm text-center"
                                            min="1"
                                        />
                                        <span className="text-sm text-gray-600">días</span>
                                    </div>
                                )}
                            </div>

                            {/* THEN (Action) */}
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 rounded-xl border border-green-100 dark:border-green-900/30">
                                <h4 className="font-bold text-green-900 dark:text-green-300 mb-3 flex items-center gap-2">
                                    <Zap className="w-4 h-4" />
                                    ENTONCES (Acción)
                                </h4>
                                <select
                                    value={formData.action_type}
                                    onChange={(e) => setFormData({ ...formData, action_type: e.target.value, action_config: {} })}
                                    className="w-full px-4 py-3 rounded-lg border border-green-200 dark:border-green-800 bg-white dark:bg-gray-800 mb-3"
                                >
                                    {actionTypes.map(a => (
                                        <option key={a.value} value={a.value}>{a.label}</option>
                                    ))}
                                </select>

                                {/* Action Value Config */}
                                {formData.action_type === 'send_email' && (
                                    <input
                                        type="text"
                                        value={formData.action_config.template || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            action_config: { template: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 rounded-lg border text-sm"
                                        placeholder="ID de plantilla de email"
                                    />
                                )}

                                {formData.action_type === 'add_tag' && (
                                    <input
                                        type="text"
                                        value={formData.action_config.tag_name || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            action_config: { tag_name: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 rounded-lg border text-sm"
                                        placeholder="Nombre del tag a añadir"
                                    />
                                )}

                                {formData.action_type === 'notification' && (
                                    <input
                                        type="text"
                                        value={formData.action_config.message || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            action_config: { message: e.target.value }
                                        })}
                                        className="w-full px-3 py-2 rounded-lg border text-sm"
                                        placeholder="Mensaje de notificación"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Active Toggle */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, is_active: !formData.is_active })}
                                className={`relative w-12 h-6 rounded-full transition-colors ${formData.is_active ? 'bg-green-500' : 'bg-gray-300'}`}
                            >
                                <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${formData.is_active ? 'translate-x-6' : 'translate-x-0.5'}`} />
                            </button>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {formData.is_active ? 'Regla Activa' : 'Regla Inactiva'}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <Button type="button" variant="outline" onClick={() => setShowEditor(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                {editingRule ? 'Actualizar' : 'Crear Regla'}
                            </Button>
                        </div>
                    </form>
                </div>
            )}

            {/* Rules List */}
            <div className="space-y-4">
                {rules.length === 0 ? (
                    <div className="text-center py-16 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                        <Zap className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-bold text-gray-500 mb-2">Sin reglas de automatización</h3>
                        <p className="text-gray-400 mb-4">Crea tu primera regla para automatizar acciones del CRM</p>
                        <Button onClick={() => openEditor()} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                            <Plus className="w-4 h-4 mr-2" />
                            Crear Primera Regla
                        </Button>
                    </div>
                ) : (
                    rules.map(rule => (
                        <div
                            key={rule.id}
                            className={`bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm transition-all hover:shadow-md ${rule.is_active
                                ? 'border-green-200 dark:border-green-900/30'
                                : 'border-gray-200 dark:border-gray-700 opacity-60'
                                }`}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <div className={`p-2 rounded-lg ${rule.is_active ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {rule.is_active ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
                                        </div>
                                        <h4 className="font-bold text-gray-900 dark:text-white">{rule.name}</h4>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${rule.is_active
                                            ? 'bg-green-100 text-green-700'
                                            : 'bg-gray-100 text-gray-500'
                                            }`}>
                                            {rule.is_active ? 'ACTIVA' : 'PAUSADA'}
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium text-blue-600">CUANDO:</span>
                                            {triggerTypes.find(t => t.value === rule.trigger_type)?.label || rule.trigger_type}
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-gray-300" />
                                        <div className="flex items-center gap-1">
                                            <span className="font-medium text-green-600">ENTONCES:</span>
                                            {actionTypes.find(a => a.value === rule.action_type)?.label || rule.action_type}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleRule(rule.id, rule.is_active)}
                                        className={`p-2 rounded-lg transition-colors ${rule.is_active
                                            ? 'hover:bg-red-50 text-red-500'
                                            : 'hover:bg-green-50 text-green-500'
                                            }`}
                                        title={rule.is_active ? 'Pausar' : 'Activar'}
                                    >
                                        <Power className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => openEditor(rule)}
                                        className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg text-indigo-600"
                                        title="Editar"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteRule(rule.id)}
                                        className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg text-red-500"
                                        title="Eliminar"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Info Box */}
            <div className="p-6 bg-amber-50 dark:bg-amber-900/10 rounded-xl border border-amber-100 dark:border-amber-900/30 flex gap-4">
                <AlertCircle className="w-6 h-6 text-amber-600 flex-shrink-0" />
                <div>
                    <h4 className="font-bold text-amber-900 dark:text-amber-200 mb-1">¿Cómo funcionan las reglas?</h4>
                    <p className="text-sm text-amber-800/80 dark:text-amber-300/80">
                        Las reglas se ejecutan automáticamente cuando se cumple la condición del trigger.
                        Por ejemplo, puedes enviar un email automáticamente cuando un lead cambie a estado "Cualificado",
                        o añadir un tag cuando pase cierto tiempo sin actividad.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AutomationRulesPanel;
