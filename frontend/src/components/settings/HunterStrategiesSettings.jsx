import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import {
    Plus, Edit2, Trash2, Save, X, Target, Scale, Laptop, Glasses,
    Zap, Store, Briefcase, Search, Sparkles, MessageSquare, AlertCircle
} from 'lucide-react';

const HunterStrategiesSettings = () => {
    const [strategies, setStrategies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingStrategy, setEditingStrategy] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const toast = useToast();

    // Default icon list for selection
    const availableIcons = [
        { name: 'Target', icon: Target },
        { name: 'Scale', icon: Scale },
        { name: 'Laptop', icon: Laptop },
        { name: 'Spy', icon: Glasses }, // Use Glasses for Spy concept
        { name: 'Zap', icon: Zap },
        { name: 'Store', icon: Store },
        { name: 'Briefcase', icon: Briefcase },
        { name: 'Search', icon: Search },
        { name: 'Sparkles', icon: Sparkles },
        { name: 'MessageSquare', icon: MessageSquare }
    ];

    useEffect(() => {
        fetchStrategies();
    }, []);

    const fetchStrategies = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/hunter-strategies`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setStrategies(await response.json());
            }
        } catch (error) {
            console.error('Error loading strategies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('crm_token');
            const url = editingStrategy.id
                ? `${API_URL}/hunter-strategies/${editingStrategy.id}`
                : `${API_URL}/hunter-strategies`;

            const method = editingStrategy.id ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(editingStrategy)
            });

            if (response.ok) {
                toast.success(editingStrategy.id ? 'Estrategia actualizada' : 'Estrategia creada');
                setEditingStrategy(null);
                fetchStrategies();
            } else {
                toast.error('Error al guardar estrategia');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmModal({
            isOpen: true,
            title: '¿Eliminar estrategia?',
            message: 'Eliminar esta estrategia podría afectar a los análisis futuros. ¿Estás seguro?',
            onConfirm: () => handleDelete(id)
        });
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/hunter-strategies/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                toast.success('Estrategia eliminada');
                fetchStrategies();
            } else {
                toast.error('No se pudo eliminar');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    // Helper to render icon component
    const renderIcon = (iconName) => {
        const IconComponent = availableIcons.find(i => i.name === iconName)?.icon || Target;
        return <IconComponent className="w-5 h-5" />;
    };

    if (loading) return <div className="p-4 text-center">Cargando estrategias...</div>;

    if (editingStrategy) {
        return (
            <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                        {editingStrategy.id ? 'Editar Estrategia' : 'Nueva Estrategia IA'}
                    </h3>
                    <button
                        onClick={() => setEditingStrategy(null)}
                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nombre de la Estrategia
                            </label>
                            <input
                                type="text"
                                required
                                value={editingStrategy.name || ''}
                                onChange={(e) => setEditingStrategy({ ...editingStrategy, name: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-orange-500"
                                placeholder="Ej: Venta Agresiva, Novedades 2025..."
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Icono
                            </label>
                            <select
                                value={editingStrategy.icon || 'Target'}
                                onChange={(e) => setEditingStrategy({ ...editingStrategy, icon: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            >
                                {availableIcons.map(icon => (
                                    <option key={icon.name} value={icon.name}>{icon.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Descripción Corta
                        </label>
                        <input
                            type="text"
                            value={editingStrategy.description || ''}
                            onChange={(e) => setEditingStrategy({ ...editingStrategy, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                            placeholder="Breve explicación para el usuario..."
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-2">
                            Instrucciones del Sistema (Prompt)
                            <span className="text-xs text-gray-500 font-normal">(Define cómo debe actuar la IA)</span>
                        </label>
                        {/* Added border specifically as requested by user */}
                        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-1 focus-within:ring-2 focus-within:ring-orange-500 bg-white dark:bg-gray-700">
                            <textarea
                                required
                                value={editingStrategy.prompt_template || ''}
                                onChange={(e) => setEditingStrategy({ ...editingStrategy, prompt_template: e.target.value })}
                                rows={8}
                                className="w-full px-3 py-2 border-none bg-transparent dark:text-white focus:ring-0 resize-y text-sm font-mono"
                                placeholder="Instrucciones detalladas para Gemini..."
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingStrategy(null)}
                        >
                            Cancelar
                        </Button>
                        <Button type="submit">
                            <Save className="w-4 h-4 mr-2" />
                            Guardar Estrategia
                        </Button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-purple-50 dark:bg-purple-900/20 p-4 rounded-xl border border-purple-100 dark:border-purple-800">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-100 dark:bg-purple-800 rounded-lg text-purple-600 dark:text-purple-300">
                        <Zap className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white">Estrategias de IA</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Define cómo la IA analiza y contacta a los prospectos.</p>
                    </div>
                </div>
                <Button onClick={() => setEditingStrategy({ name: '', icon: 'Target', prompt_template: '' })}>
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Estrategia
                </Button>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {strategies.map(strategy => (
                    <div
                        key={strategy.id}
                        className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-xl ${strategy.is_active ? 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300' : 'bg-red-50 text-red-400'}`}>
                                {renderIcon(strategy.icon)}
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    {strategy.name}
                                    {strategy.is_system && (
                                        <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 border border-blue-100 rounded-full">Sistema</span>
                                    )}
                                </h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md truncate">
                                    {strategy.description || 'Sin descripción'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setEditingStrategy(strategy)}
                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg dark:hover:bg-blue-900/30 dark:text-blue-400"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                {!strategy.is_system && (
                                    <button
                                        onClick={() => handleDeleteClick(strategy.id)}
                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg dark:hover:bg-red-900/30 dark:text-red-400"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                ))}

                {strategies.length === 0 && (
                    <div className="text-center py-8 text-gray-500 bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300">
                        No hay estrategias personalizadas definidas.
                    </div>
                )}
            </div>
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

export default HunterStrategiesSettings;
