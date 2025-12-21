import React, { useState, useEffect } from 'react';
import {
    Brain, Save, Plus, Trash2, Edit,
    BookOpen, Sparkles, MessageSquare,
    AlertCircle, RefreshCw,
    Shield, Briefcase, Zap, Info,
    TrendingUp, Activity, Database, Key
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { API_URL } from '../../config';
import Button from '../shared/Button';

const AIBrainSettings = () => {
    const toast = useToast();
    const [settings, setSettings] = useState({
        personality_tone: 'professional',
        system_instruction_prefix: '',
        system_instruction_suffix: '',
        max_context_units: 5
    });
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showUnitForm, setShowUnitForm] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [activeTab, setActiveTab] = useState('settings'); // 'settings' | 'knowledge'
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'success_story',
        tags: '',
        is_active: true
    });

    const token = localStorage.getItem('crm_token');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [settingsRes, unitsRes] = await Promise.all([
                fetch(`${API_URL}/knowledge/settings`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch(`${API_URL}/knowledge/units`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (settingsRes.ok) {
                const data = await settingsRes.json();
                if (data) {
                    setSettings({
                        ...data,
                        system_instruction_prefix: data.system_instruction_prefix || '',
                        system_instruction_suffix: data.system_instruction_suffix || ''
                    });
                }
            }

            if (unitsRes.ok) {
                const data = await unitsRes.json();
                setUnits(data || []);
            }
        } catch (error) {
            console.error('Error fetching brain data:', error);
            toast.error('Error al cargar datos del cerebro');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            const response = await fetch(`${API_URL}/knowledge/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                toast.success('Configuración del cerebro guardada');
            } else {
                throw new Error('Error al guardar settings');
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    const handleSaveUnit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const url = editingUnit
                ? `${API_URL}/knowledge/units/${editingUnit.id}`
                : `${API_URL}/knowledge/units`;

            const method = editingUnit ? 'PUT' : 'POST';

            const payload = {
                ...formData,
                tags: typeof formData.tags === 'string' ? formData.tags.split(',').map(t => t.trim()).filter(t => t) : formData.tags
            };

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                toast.success(editingUnit ? 'Conocimiento actualizado' : 'Nuevo conocimiento añadido');
                setShowUnitForm(false);
                setEditingUnit(null);
                setFormData({ title: '', content: '', category: 'success_story', tags: '', is_active: true });
                fetchData();
            }
        } catch (error) {
            toast.error('Error al guardar unidad de conocimiento');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteUnit = async (id) => {
        if (!window.confirm('¿Estás seguro de eliminar este conocimiento?')) return;

        try {
            const response = await fetch(`${API_URL}/knowledge/units/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Conocimiento eliminado');
                setUnits(units.filter(u => u.id !== id));
            }
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center p-24 space-y-4">
            <div className="relative">
                <Brain className="w-16 h-16 text-indigo-600 animate-pulse" />
                <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            </div>
            <p className="text-gray-500 font-medium animate-pulse">Sincronizando red neuronal...</p>
        </div>
    );

    const stats = [
        { label: 'Unidades de Conocimiento', value: units.length, icon: <Database className="w-5 h-5" />, color: 'blue' },
        { label: 'Tono Cognitivo', value: settings.personality_tone?.toUpperCase() || 'PROFESSIONAL', icon: <MessageSquare className="w-5 h-5" />, color: 'purple' },
        { label: 'Potencia RAG', value: `${settings.max_context_units || 5} pts`, icon: <Zap className="w-5 h-5" />, color: 'amber' },
        { label: 'Estado del Cerebro', value: 'OPTIMAL', icon: <Activity className="w-5 h-5" />, color: 'emerald' }
    ];

    return (
        <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto">
            {/* Header Dashboard Style */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 bg-gradient-to-br from-indigo-900 to-indigo-700 rounded-2xl shadow-xl border border-indigo-800 text-white relative overflow-hidden">
                <div className="relative z-10">
                    <h1 className="text-3xl font-black mb-2 flex items-center gap-3">
                        <Brain className="w-10 h-10 text-indigo-300" />
                        Cerebro Estratégico NoahPro
                    </h1>
                    <p className="text-indigo-200 max-w-2xl">
                        Panel central de inteligencia artificial. Aquí defines la personalidad, instrucciones maestras
                        y la base de conocimiento que permite a la IA analizar prospectos con precisión quirúrgica.
                    </p>
                </div>
                <div className="absolute right-0 top-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                <div className="absolute left-0 bottom-0 w-48 h-48 bg-indigo-400/10 rounded-full -ml-10 -mb-10 blur-2xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all">
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400`}>
                                {stat.icon}
                            </div>
                            <TrendingUp className="w-4 h-4 text-gray-300" />
                        </div>
                        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1">{stat.value}</h3>
                    </div>
                ))}
            </div>

            {/* Tabs Navigation */}
            <div className="flex space-x-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('settings')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'settings'
                        ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Configuración Cognitiva
                </button>
                <button
                    onClick={() => setActiveTab('knowledge')}
                    className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'knowledge'
                        ? 'bg-white dark:bg-gray-700 text-indigo-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                    Base de Conocimiento (RAG)
                </button>
            </div>

            {activeTab === 'settings' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Personality & Tone */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-amber-500" />
                                Personalidad
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Tono de Comunicación</label>
                                    <select
                                        value={settings.personality_tone}
                                        onChange={(e) => setSettings({ ...settings, personality_tone: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white font-medium"
                                    >
                                        <option value="professional">🤵 Profesional (Estándar)</option>
                                        <option value="aggressive">🎯 Agresivo (Cierre Directo)</option>
                                        <option value="friendly">👋 Amigable / Empático</option>
                                        <option value="analytical">📊 Analítico / Técnico</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Unidades de Contexto (Potencia)</label>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="range"
                                            min="1"
                                            max="15"
                                            value={settings.max_context_units}
                                            onChange={(e) => setSettings({ ...settings, max_context_units: parseInt(e.target.value) })}
                                            className="flex-1 accent-indigo-600"
                                        />
                                        <span className="font-bold text-indigo-600 w-8 text-center">{settings.max_context_units}</span>
                                    </div>
                                    <p className="mt-2 text-[11px] text-gray-400">A mayor número, más "memoria" tendrá la IA de tus casos de éxito, pero consumirá más tokens.</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/20 p-6 rounded-2xl border border-indigo-100 dark:border-indigo-800">
                            <h4 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2 mb-2">
                                <Shield className="w-5 h-5" />
                                Seguridad Cognitiva
                            </h4>
                            <p className="text-xs text-indigo-700/70 dark:text-indigo-300/60 leading-relaxed">
                                Estas configuraciones protegen la integridad de la marca NoahPro. La IA filtrará cualquier
                                respuesta que contradiga la personalidad establecida aquí.
                            </p>
                        </div>
                    </div>

                    {/* Master Instructions */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-8 space-y-6">
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <Key className="w-6 h-6 text-indigo-500" />
                                Instrucciones Maestras (Prompts)
                            </h3>
                            <Button
                                onClick={handleSaveSettings}
                                disabled={saving}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white"
                            >
                                {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Sincronizar Cambios
                            </Button>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <Plus className="w-4 h-4" /> Prefijo del Sistema (Instrucciones que van ANTES)
                                </label>
                                <textarea
                                    value={settings.system_instruction_prefix}
                                    onChange={(e) => setSettings({ ...settings, system_instruction_prefix: e.target.value })}
                                    rows={6}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Ej: Eres el experto comercial de NoahPro..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4" /> Sufijo del Sistema (Reglas de Oro y Limitaciones)
                                </label>
                                <textarea
                                    value={settings.system_instruction_suffix}
                                    onChange={(e) => setSettings({ ...settings, system_instruction_suffix: e.target.value })}
                                    rows={4}
                                    className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-indigo-500 transition-all"
                                    placeholder="Ej: REGLA 1: Nunca menciones precios cerrados sin autorizar..."
                                />
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Knowledge Base Search & Filter */}
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Almacén de Conocimiento (RAG)</h3>
                                <p className="text-sm text-gray-500">Hechos y datos que la IA inyecta dinámicamente en los análisis</p>
                            </div>
                        </div>
                        <Button
                            onClick={() => {
                                setEditingUnit(null);
                                setFormData({ title: '', content: '', category: 'success_story', tags: '', is_active: true });
                                setShowUnitForm(true);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                        >
                            <Plus className="w-4 h-4 mr-2" /> Añadir Nueva Unidad
                        </Button>
                    </div>

                    {showUnitForm && (
                        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-emerald-100 dark:border-emerald-900/30 overflow-hidden animate-slideDown">
                            <div className="p-4 bg-emerald-50 dark:bg-emerald-900/10 border-b border-emerald-100 dark:border-emerald-900/30 flex justify-between items-center">
                                <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                                    {editingUnit ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                                    {editingUnit ? 'Editando Conocimiento' : 'Nuevo Registro de Inteligencia'}
                                </h4>
                                <button onClick={() => setShowUnitForm(false)} className="p-1 hover:bg-emerald-100 dark:hover:bg-emerald-900/30 rounded-full">
                                    <Trash2 className="w-4 h-4 text-gray-400" />
                                </button>
                            </div>
                            <form onSubmit={handleSaveUnit} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Identificador / Título</label>
                                            <input
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:bg-gray-900 dark:text-white dark:border-gray-700"
                                                required
                                                placeholder="Ej: Caso éxito Restaurante Pizzeria"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Categoría Estratégica</label>
                                            <select
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:bg-gray-900 dark:text-white dark:border-gray-700"
                                            >
                                                <option value="success_story">🏆 Caso de Éxito</option>
                                                <option value="product_info">📦 Info Producto / Ventaja</option>
                                                <option value="objection_handling">🛡️ Manejo de Objeciones</option>
                                                <option value="legal_info">⚖️ Legal / Verifactu</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-xs font-black text-gray-400 uppercase mb-2">Etiquetas de Activación (Tags)</label>
                                            <input
                                                value={formData.tags}
                                                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                                                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:bg-gray-900 dark:text-white dark:border-gray-700 font-mono text-sm"
                                                placeholder="hosteleria, verifactu, pequeño_negocio..."
                                            />
                                            <p className="mt-1 text-[10px] text-gray-400">La IA inyectará este contenido si detecta estos tags en el prospecto.</p>
                                        </div>
                                        <div className="flex items-center gap-2 pt-4">
                                            <input
                                                type="checkbox"
                                                checked={formData.is_active}
                                                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                                                className="w-4 h-4 accent-emerald-600 rounded"
                                            />
                                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Conocimiento Activo</label>
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-gray-400 uppercase mb-2">Contenido Explicativo (Datos Críticos)</label>
                                    <textarea
                                        value={formData.content}
                                        onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                        rows={6}
                                        className="w-full px-5 py-4 rounded-2xl border border-gray-200 dark:bg-gray-900 dark:text-white dark:border-gray-700 focus:ring-2 focus:ring-emerald-500 transition-all font-medium"
                                        required
                                        placeholder="Describe los hechos, ventajas o argumentario aquí..."
                                    />
                                </div>
                                <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <Button type="button" variant="outline" onClick={() => setShowUnitForm(false)}>Descartar</Button>
                                    <Button
                                        type="submit"
                                        disabled={saving}
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                    >
                                        {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                        {editingUnit ? 'Actualizar Conocimiento' : 'Asimilar Conocimiento'}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* Knowledge Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {units.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-gray-50 dark:bg-gray-900/50 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-3xl">
                                <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500 font-bold text-lg">Cerebro sin datos</p>
                                <p className="text-gray-400">Añade tu primer caso de éxito o argumentario legal para empezar.</p>
                            </div>
                        ) : (
                            units.map(unit => (
                                <div key={unit.id} className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-900 transition-all group overflow-hidden relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-2 h-2 rounded-full ${unit.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                                                <span className="text-[10px] font-black tracking-widest text-gray-400 uppercase">{unit.category}</span>
                                            </div>
                                            <h4 className="font-black text-gray-900 dark:text-white leading-tight">{unit.title}</h4>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => {
                                                    setEditingUnit(unit);
                                                    setFormData({
                                                        title: unit.title || '',
                                                        content: unit.content || '',
                                                        category: unit.category || 'success_story',
                                                        tags: Array.isArray(unit.tags) ? unit.tags.join(', ') : '',
                                                        is_active: unit.is_active ?? true
                                                    });
                                                    setShowUnitForm(true);
                                                }}
                                                className="p-2 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-xl text-indigo-600 dark:text-indigo-400 transition-colors"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteUnit(unit.id)}
                                                className="p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl text-red-500 transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-4 leading-relaxed font-medium mb-6">
                                        {unit.content}
                                    </p>
                                    <div className="flex flex-wrap gap-2 mt-auto">
                                        {Array.isArray(unit.tags) && unit.tags.map(tag => (
                                            <span key={tag} className="px-3 py-1 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 rounded-full text-[10px] font-bold border border-gray-100 dark:border-gray-800">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                    <div className="absolute bottom-0 right-0 p-1 opacity-5 group-hover:opacity-10 transition-opacity">
                                        <Brain className="w-16 h-16 text-indigo-900" />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* AI Capability Tip */}
            <div className="p-8 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/10 dark:to-orange-900/10 rounded-3xl border border-amber-100 dark:border-amber-900/30 relative overflow-hidden">
                <div className="flex flex-col md:flex-row gap-6 items-center relative z-10">
                    <div className="p-4 bg-amber-100 dark:bg-amber-900/50 rounded-2xl shadow-inner">
                        <Zap className="w-8 h-8 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <h4 className="text-lg font-black text-amber-900 dark:text-amber-200 mb-1">Potenciador RAG Inteligente</h4>
                        <p className="text-sm text-amber-800/80 dark:text-amber-300/80 leading-relaxed max-w-3xl">
                            NoahPro utiliza tecnología RAG (Retrieval Augmented Generation). Cuando la IA analiza un prospecto,
                            "recuerda" automáticamente tus unidades de conocimiento que coincidan con el tipo de negocio.
                            <strong> Ejemplo:</strong> Si analizas un restaurante, la IA inyectará automáticamente tus
                            casos de éxito de hostelería en su razonamiento.
                        </p>
                    </div>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10">
                    <Sparkles className="w-40 h-40 text-amber-600" />
                </div>
            </div>
        </div>
    );
};

export default AIBrainSettings;
