/**
 * AIBrainDashboard - Cerebro IA Module
 * Central dashboard for AI Knowledge, Learning Status, and Metrics
 */

import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import {
    Brain,
    Zap,
    TrendingUp,
    Database,
    Activity,
    Target,
    Sparkles,
    RefreshCw,
    ChevronRight,
    BarChart3,
    MessageSquare,
    Users,
    Lightbulb,
    Award,
    Clock,
    CheckCircle,
    AlertTriangle,
    Edit3,
    Save,
    Plus,
    Trash2,
    Settings,
    ToggleLeft,
    ToggleRight,
    FileText
} from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const AIBrainDashboard = () => {
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentAnalyses, setRecentAnalyses] = useState([]);
    const [knowledgeStats, setKnowledgeStats] = useState(null);

    // Prompt Editor States
    const [prompts, setPrompts] = useState([]);
    const [activePrompt, setActivePrompt] = useState(null);
    const [editingPrompt, setEditingPrompt] = useState(null);
    const [promptText, setPromptText] = useState('');
    const [savingPrompt, setSavingPrompt] = useState(false);
    const [showPromptEditor, setShowPromptEditor] = useState(false);

    // Config & Scoring States
    const [activeTab, setActiveTab] = useState('overview'); // overview, prompts, scoring, config
    const [userSettings, setUserSettings] = useState(null);
    const [savingSettings, setSavingSettings] = useState(false);
    const [scoringWeights, setScoringWeights] = useState({
        web_weight: 20,
        rating_weight: 15,
        tpv_weight: 30,
        social_weight: 15,
        ads_weight: 10
    });

    const toast = useToast();

    const token = localStorage.getItem('crm_token') || localStorage.getItem('token');

    useEffect(() => {
        loadDashboardData();
        loadPrompts();
        loadUserSettings();
    }, []);

    const loadUserSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/hunter/user-settings`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUserSettings(data);
                if (data.scoring_weights) setScoringWeights(data.scoring_weights);
            }
        } catch (error) {
            console.error('Error loading settings:', error);
        }
    };

    const saveScoringConfig = async () => {
        setSavingSettings(true);
        try {
            const res = await fetch(`${API_URL}/hunter/user-settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    ...userSettings,
                    scoring_weights: scoringWeights
                })
            });

            if (res.ok) {
                toast.success('Configuración de scoring actualizada');
                loadUserSettings();
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            toast.error('Error al guardar configuración');
        } finally {
            setSavingSettings(false);
        }
    };

    // Load system prompts
    const loadPrompts = async () => {
        try {
            const res = await fetch(`${API_URL}/brain/prompts?category=hunter`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setPrompts(data);
                const active = data.find(p => p.is_active);
                if (active) {
                    setActivePrompt(active);
                    setPromptText(active.prompt_text);
                }
            }
        } catch (error) {
            console.error('Error loading prompts:', error);
        }
    };

    // Save prompt changes
    const savePrompt = async () => {
        if (!activePrompt) return;
        setSavingPrompt(true);
        try {
            const res = await fetch(`${API_URL}/brain/prompts/${activePrompt.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ prompt_text: promptText })
            });
            if (res.ok) {
                toast.success('Prompt guardado correctamente');
                loadPrompts();
            } else {
                toast.error('Error al guardar el prompt');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setSavingPrompt(false);
        }
    };

    // Toggle prompt active status
    const togglePromptActive = async (promptId) => {
        try {
            const res = await fetch(`${API_URL}/brain/prompts/${promptId}/activate`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success('Prompt activado');
                loadPrompts();
            }
        } catch (error) {
            toast.error('Error al activar prompt');
        }
    };


    const loadDashboardData = async () => {
        setLoading(true);
        try {
            // Load brain stats
            const [statsRes, analysesRes] = await Promise.all([
                fetch(`${API_URL}/hunter/brain/stats`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null),
                fetch(`${API_URL}/hunter/prospects?limit=5&orderBy=analyzed_at&order=desc`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).catch(() => null)
            ]);

            if (statsRes?.ok) {
                const data = await statsRes.json();
                setStats(data);
            } else {
                // Mock data for display if endpoint doesn't exist yet
                setStats({
                    totalAnalyses: 127,
                    avgScore: 72,
                    topCategory: 'Restaurantes',
                    successRate: 68,
                    learningProgress: 45
                });
            }

            if (analysesRes?.ok) {
                const data = await analysesRes.json();
                setRecentAnalyses(data.prospects || data || []);
            }

            // Load knowledge base stats
            const knowledgeRes = await fetch(`${API_URL}/hunter/knowledge/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }).catch(() => null);

            if (knowledgeRes?.ok) {
                setKnowledgeStats(await knowledgeRes.json());
            } else {
                setKnowledgeStats({
                    totalEntries: 42,
                    categories: 8,
                    lastUpdated: new Date().toISOString()
                });
            }

        } catch (error) {
            console.error('Error loading brain data:', error);
        } finally {
            setLoading(false);
        }
    };

    const StatCard = ({ icon: Icon, label, value, subValue, color = 'orange', trend }) => (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm hover:shadow-lg transition-all group">
            <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 group-hover:scale-110 transition-transform`}>
                    <Icon className={`w-6 h-6 text-${color}-600 dark:text-${color}-400`} />
                </div>
                {trend && (
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${trend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                        }`}>
                        {trend > 0 ? '+' : ''}{trend}%
                    </span>
                )}
            </div>
            <div className="mt-4">
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{label}</p>
                {subValue && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subValue}</p>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <Brain className="w-16 h-16 text-purple-500 animate-pulse mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Cargando Cerebro IA...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Navigation */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl shadow-lg">
                            <Brain className="w-7 h-7 text-white" />
                        </div>
                        Cerebro IA
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Centro de control de inteligencia artificial
                    </p>
                </div>

                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'overview' ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Vista General
                    </button>
                    <button
                        onClick={() => setActiveTab('prompts')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'prompts' ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Prompts
                    </button>
                    <button
                        onClick={() => setActiveTab('scoring')}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'scoring' ? 'bg-white dark:bg-gray-700 shadow text-purple-600 dark:text-purple-400' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                    >
                        Scoring Financiero
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <>

                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <StatCard
                            icon={Target}
                            label="Análisis Realizados"
                            value={stats?.totalAnalyses || 0}
                            subValue="Total histórico"
                            color="purple"
                            trend={12}
                        />
                        <StatCard
                            icon={Award}
                            label="Score Promedio"
                            value={`${stats?.avgScore || 0}%`}
                            subValue="Oportunidad media"
                            color="green"
                        />
                        <StatCard
                            icon={Lightbulb}
                            label="Categoría Top"
                            value={stats?.topCategory || 'N/A'}
                            subValue="Mejor rendimiento"
                            color="yellow"
                        />
                        <StatCard
                            icon={TrendingUp}
                            label="Tasa de Éxito"
                            value={`${stats?.successRate || 0}%`}
                            subValue="Conversión a cliente"
                            color="blue"
                            trend={5}
                        />
                    </div>

                    {/* Learning Progress & Knowledge Base */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Learning Progress */}
                        <div className="bg-gradient-to-br from-purple-900 to-indigo-900 rounded-2xl p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />
                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-pink-500/20 rounded-full blur-3xl" />

                            <div className="relative">
                                <div className="flex items-center gap-3 mb-4">
                                    <Sparkles className="w-6 h-6 text-purple-300" />
                                    <h3 className="text-lg font-semibold">Progreso de Aprendizaje</h3>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-sm mb-2">
                                            <span className="text-purple-200">Datos Acumulados</span>
                                            <span className="text-white font-medium">{stats?.learningProgress || 45}%</span>
                                        </div>
                                        <div className="h-3 bg-purple-800 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full transition-all duration-1000"
                                                style={{ width: `${stats?.learningProgress || 45}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-3 mt-4">
                                        <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            <p className="text-2xl font-bold">{knowledgeStats?.totalEntries || 42}</p>
                                            <p className="text-xs text-purple-200">Entradas</p>
                                        </div>
                                        <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            <p className="text-2xl font-bold">{knowledgeStats?.categories || 8}</p>
                                            <p className="text-xs text-purple-200">Categorías</p>
                                        </div>
                                        <div className="text-center p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                                            <p className="text-2xl font-bold">∞</p>
                                            <p className="text-xs text-purple-200">Potencial</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* AI Status */}
                        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                            <div className="flex items-center gap-3 mb-4">
                                <Activity className="w-6 h-6 text-green-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Estado del Sistema</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                                        <span className="text-gray-700 dark:text-gray-300">Gemini Direct</span>
                                    </div>
                                    <span className="text-sm text-green-600 dark:text-green-400 font-medium">Activo</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-purple-500 rounded-full" />
                                        <span className="text-gray-700 dark:text-gray-300">Stormsboys Gateway</span>
                                    </div>
                                    <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Configurado</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                                    <div className="flex items-center gap-3">
                                        <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
                                        <span className="text-gray-700 dark:text-gray-300">Base de Conocimiento</span>
                                    </div>
                                    <span className="text-sm text-blue-600 dark:text-blue-400 font-medium">Aprendiendo</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Recent Analyses */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Clock className="w-6 h-6 text-orange-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Análisis Recientes</h3>
                            </div>
                            <button className="text-sm text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1">
                                Ver todos <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="space-y-3">
                            {recentAnalyses.length > 0 ? (
                                recentAnalyses.slice(0, 5).map((analysis, idx) => (
                                    <div
                                        key={analysis.id || idx}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center">
                                                <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white">{analysis.name || 'Prospecto'}</p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">{analysis.business_type || 'Negocio'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${(analysis.opportunity_score || 70) >= 70
                                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                                }`}>
                                                {analysis.opportunity_score || 70}%
                                            </span>
                                            <ChevronRight className="w-5 h-5 text-gray-400" />
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                    <Brain className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                    <p>No hay análisis recientes</p>
                                    <p className="text-sm mt-1">Usa Lead Hunter para generar datos</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Prompt Editor Section - CEREBRO ABIERTO */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <Settings className="w-6 h-6 text-purple-500" />
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Configuración del Cerebro
                                </h3>
                            </div>
                            <button
                                onClick={() => setShowPromptEditor(!showPromptEditor)}
                                className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1"
                            >
                                {showPromptEditor ? 'Ocultar' : 'Editar Prompt'} <Edit3 className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Prompt List */}
                        <div className="space-y-2 mb-4">
                            {prompts.map(prompt => (
                                <div
                                    key={prompt.id}
                                    className={`flex items-center justify-between p-3 rounded-xl transition-all ${prompt.is_active
                                        ? 'bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700'
                                        : 'bg-gray-50 dark:bg-gray-700/50 border border-transparent'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className={`w-5 h-5 ${prompt.is_active ? 'text-purple-600' : 'text-gray-400'}`} />
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{prompt.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                v{prompt.version} · {new Date(prompt.updated_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => togglePromptActive(prompt.id)}
                                        className="flex items-center gap-2"
                                    >
                                        {prompt.is_active ? (
                                            <ToggleRight className="w-8 h-8 text-purple-600" />
                                        ) : (
                                            <ToggleLeft className="w-8 h-8 text-gray-400 hover:text-purple-500" />
                                        )}
                                    </button>
                                </div>
                            ))}
                            {prompts.length === 0 && (
                                <p className="text-center text-gray-500 py-4">No hay prompts configurados</p>
                            )}
                        </div>

                        {/* Prompt Editor Textarea */}
                        {showPromptEditor && activePrompt && (
                            <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Instrucciones para la IA ({activePrompt.name})
                                    </label>
                                    <textarea
                                        value={promptText}
                                        onChange={(e) => setPromptText(e.target.value)}
                                        className="w-full h-64 p-4 border border-gray-300 dark:border-gray-600 rounded-xl 
                                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                                           focus:ring-2 focus:ring-purple-500 focus:border-transparent
                                           font-mono text-sm resize-y"
                                        placeholder="Escribe las instrucciones que le darás a la IA para analizar prospectos..."
                                    />
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        Este prompt se usará para todos los análisis de Lead Hunter.
                                        Puedes personalizarlo para priorizar ciertos tipos de negocio o servicios.
                                    </p>
                                </div>
                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setPromptText(activePrompt.prompt_text)}
                                        className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    >
                                        Descartar cambios
                                    </button>
                                    <button
                                        onClick={savePrompt}
                                        disabled={savingPrompt}
                                        className="flex items-center gap-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 
                                           text-white rounded-lg transition-colors disabled:opacity-50"
                                    >
                                        {savingPrompt ? (
                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4" />
                                        )}
                                        Guardar Prompt
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="p-6 bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl text-white text-left hover:shadow-xl hover:scale-[1.02] transition-all group">
                            <Zap className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                            <h4 className="font-semibold text-lg">Nuevo Análisis</h4>
                            <p className="text-orange-100 text-sm mt-1">Analizar prospecto con IA</p>
                        </button>

                        <button className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl text-white text-left hover:shadow-xl hover:scale-[1.02] transition-all group">
                            <Database className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                            <h4 className="font-semibold text-lg">Base de Conocimiento</h4>
                            <p className="text-purple-100 text-sm mt-1">Gestionar datos de aprendizaje</p>
                        </button>

                        <button className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl text-white text-left hover:shadow-xl hover:scale-[1.02] transition-all group">
                            <BarChart3 className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform" />
                            <h4 className="font-semibold text-lg">Reportes IA</h4>
                            <p className="text-green-100 text-sm mt-1">Ver métricas detalladas</p>
                        </button>
                    </div>
                </>
            )}

            {activeTab === 'prompts' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                    {/* Prompt List */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Prompts del Sistema</h2>
                            <button
                                onClick={() => {
                                    setEditingPrompt(null);
                                    setPromptText('');
                                    setShowPromptEditor(true);
                                }}
                                className="p-2 bg-purple-50 text-purple-600 rounded-lg hover:bg-purple-100 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-3">
                            {prompts.map(prompt => (
                                <div
                                    key={prompt.id}
                                    onClick={() => {
                                        setEditingPrompt(prompt);
                                        setPromptText(prompt.prompt_text);
                                        setActivePrompt(prompt);
                                    }}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer ${activePrompt?.id === prompt.id
                                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 shadow-md ring-1 ring-purple-500'
                                        : 'border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-gray-600'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className={`font-semibold ${activePrompt?.id === prompt.id ? 'text-purple-700 dark:text-purple-300' : 'text-gray-900 dark:text-white'}`}>
                                            {prompt.name}
                                        </h3>
                                        {prompt.is_active && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                                                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                                                Activo
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                                        {prompt.description || 'Sin descripción'}
                                    </p>
                                    <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
                                        <span>v{prompt.version}</span>
                                        <span>{new Date(prompt.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col h-[600px]">
                        {activePrompt ? (
                            <>
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Edit3 className="w-5 h-5 text-purple-500" />
                                            {activePrompt.name}
                                        </h2>
                                        <p className="text-sm text-gray-500">Editando Prompt ID: {activePrompt.id}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {!activePrompt.is_active && (
                                            <button
                                                onClick={() => activatePrompt(activePrompt.id)}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                                            >
                                                <ToggleLeft className="w-4 h-4" />
                                                Activar
                                            </button>
                                        )}
                                        <button
                                            onClick={savePrompt}
                                            disabled={savingPrompt}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 shadow-lg shadow-purple-200 dark:shadow-none"
                                        >
                                            {savingPrompt ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                            Guardar Cambios
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 relative">
                                    <textarea
                                        value={promptText}
                                        onChange={(e) => setPromptText(e.target.value)}
                                        className="w-full h-full p-6 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none font-mono text-sm leading-relaxed text-gray-800 dark:text-gray-200"
                                        placeholder="Escribe aquí las instrucciones del sistema..."
                                    />
                                    <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-white/80 dark:bg-gray-800/80 px-2 py-1 rounded backdrop-blur-sm">
                                        {promptText.length} caracteres
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                                <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
                                <p>Selecciona un prompt para editar o crea uno nuevo</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === 'scoring' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
                    {/* Financial Config */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                                <Target className="w-6 h-6 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Objetivos Financieros</h2>
                                <p className="text-sm text-gray-500">Define los parámetros base para el cálculo de ROI</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Ticket Medio (€)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                                    <input
                                        type="number"
                                        value={userSettings?.average_ticket_value || ''}
                                        onChange={(e) => setUserSettings({ ...userSettings, average_ticket_value: e.target.value })}
                                        className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Valor promedio de venta por cliente cerrado.</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Coste Diario del Comercial (€)
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">€</span>
                                    <input
                                        type="number"
                                        value={userSettings?.daily_salary_cost || ''}
                                        onChange={(e) => setUserSettings({ ...userSettings, daily_salary_cost: e.target.value })}
                                        className="w-full pl-8 pr-4 py-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-1">Salario + Seguridad Social / 20 días laborales.</p>
                            </div>
                        </div>
                    </div>

                    {/* Scoring Weights */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                                <Activity className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Ponderación del Algoritmo</h2>
                                <p className="text-sm text-gray-500">Ajusta cómo la IA prioriza los prospectos</p>
                            </div>
                        </div>

                        <div className="space-y-6">
                            {[
                                { key: 'tpv_weight', label: 'Urgencia TPV (Efectivo, Quejas)', icon: Zap, color: 'text-amber-500' },
                                { key: 'web_weight', label: 'Calidad Web / Presencia', icon: Database, color: 'text-blue-500' },
                                { key: 'social_weight', label: 'Redes Sociales & Engagement', icon: MessageSquare, color: 'text-pink-500' },
                                { key: 'rating_weight', label: 'Reputación & Reseñas', icon: Award, color: 'text-yellow-500' },
                                { key: 'ads_weight', label: 'Inversión Publicitaria Detectada', icon: TrendingUp, color: 'text-green-500' }
                            ].map((item) => (
                                <div key={item.key}>
                                    <div className="flex justify-between mb-2">
                                        <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                                            <item.icon className={`w-4 h-4 ${item.color}`} />
                                            {item.label}
                                        </label>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">{scoringWeights[item.key]}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={scoringWeights[item.key]}
                                        onChange={(e) => setScoringWeights({ ...scoringWeights, [item.key]: parseInt(e.target.value) })}
                                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                                    />
                                </div>
                            ))}

                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-4 flex justify-between items-center">
                                <div className="text-sm">
                                    <span className="text-gray-500">Total: </span>
                                    <span className={`font-bold ${Object.values(scoringWeights).reduce((a, b) => a + b, 0) === 100
                                        ? 'text-green-600'
                                        : 'text-red-500'
                                        }`}>
                                        {Object.values(scoringWeights).reduce((a, b) => a + b, 0)}%
                                    </span>
                                </div>
                                <button
                                    onClick={saveScoringConfig}
                                    disabled={savingSettings}
                                    className="px-6 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 font-medium"
                                >
                                    {savingSettings ? 'Guardando...' : 'Aplicar Cambios'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AIBrainDashboard;
