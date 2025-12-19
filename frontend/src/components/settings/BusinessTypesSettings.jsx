import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { Plus, X, Pencil, Trash2, Search, Wand2, Store, Briefcase, Truck, Music, Beer, PartyPopper, Utensils, Coffee, Hotel, ShoppingBag, Dumbbell, Pill, Home, Wrench, Scissors, Stethoscope, ShoppingCart, AlertTriangle } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import Modal from '../shared/Modal';
import Button from '../shared/Button';

const BusinessTypesSettings = () => {
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({ name: '', icon: 'Building', google_query: '', is_active: true });
    const [aiTopic, setAiTopic] = useState('');
    const [aiSuggestions, setAiSuggestions] = useState([]);
    const [aiLoading, setAiLoading] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const toast = useToast();

    // Lucide Icons mapping for selection
    const availableIcons = {
        Store, Briefcase, Truck, Music, Beer, PartyPopper, Utensils, Coffee, Hotel, ShoppingBag,
        Dumbbell, Pill, Home, Wrench, Scissors, Stethoscope, ShoppingCart
    };

    useEffect(() => {
        fetchTypes();
    }, []);

    const fetchTypes = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/business-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTypes(data);
            }
        } catch (error) {
            console.error('Error fetching business types:', error);
            toast.error('Error cargando tipos de negocio');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('crm_token');
            const url = editingType
                ? `${API_URL}/business-types/${editingType.id}`
                : `${API_URL}/business-types`;

            const method = editingType ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) throw new Error('Error guardando tipo');

            toast.success(editingType ? 'Tipo actualizado' : 'Tipo creado');
            fetchTypes();
            setShowModal(false);
            setEditingType(null);
            setFormData({ name: '', icon: 'Building', google_query: '', is_active: true });
        } catch (error) {
            console.error('Error saving:', error);
            toast.error('Error guardando tipo de negocio');
        }
    };

    const handleDeleteClick = (id) => {
        setConfirmModal({
            isOpen: true,
            title: '¿Eliminar tipo de negocio?',
            message: 'Esta acción borrará este tipo de negocio. Los prospectos asociados perderán su clasificación.',
            onConfirm: () => handleDelete(id)
        });
    };

    const handleDelete = async (id) => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/business-types/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!response.ok) throw new Error('Error deleting');

            toast.success('Tipo eliminado');
            fetchTypes();
        } catch (error) {
            console.error('Error deleting:', error);
            toast.error('Error eliminando tipo');
        } finally {
            setConfirmModal({ ...confirmModal, isOpen: false });
        }
    };

    const handleAiSuggest = async () => {
        if (!aiTopic) return;
        setAiLoading(true);
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/business-types/ai-suggest`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ topic: aiTopic })
            });

            if (response.ok) {
                const data = await response.json();
                setAiSuggestions(data);
            }
        } catch (error) {
            console.error('Error AI suggest:', error);
            toast.error('Error generando sugerencias');
        } finally {
            setAiLoading(false);
        }
    };

    const applyAiSuggestion = (suggestion) => {
        setFormData({
            name: suggestion.name,
            icon: suggestion.icon || 'Store',
            google_query: suggestion.google_query,
            is_active: true
        });
        setShowAiModal(false);
        setShowModal(true);
    };

    const filteredTypes = types.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const IconComponent = ({ name, className }) => {
        const Icon = availableIcons[name] || Store;
        return <Icon className={className} />;
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div className="relative flex-1 max-w-sm">
                    <input
                        type="text"
                        placeholder="Buscar tipos..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500"
                    />
                    <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                </div>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setShowAiModal(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center space-x-2"
                    >
                        <Wand2 className="w-5 h-5" />
                        <span>Asistente IA</span>
                    </button>
                    <button
                        onClick={() => {
                            setEditingType(null);
                            setFormData({ name: '', icon: 'Store', google_query: '', is_active: true });
                            setShowModal(true);
                        }}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition flex items-center space-x-2"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nuevo Tipo</span>
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTypes.map(type => (
                    <div key={type.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center text-orange-600 dark:text-orange-400">
                                <IconComponent name={type.icon} className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="font-medium text-gray-900 dark:text-white">{type.name}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400 max-w-[150px] truncate" title={type.google_query}>
                                    {type.google_query}
                                </p>
                            </div>
                        </div>
                        <div className="flex space-x-2">
                            <button
                                onClick={() => {
                                    setEditingType(type);
                                    setFormData(type);
                                    setShowModal(true);
                                }}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 hover:text-blue-600 transition"
                            >
                                <Pencil className="w-4 h-4" />
                            </button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteClick(type.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Crear/Editar */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-2xl">
                        <h2 className="text-xl font-bold mb-4 dark:text-white">
                            {editingType ? 'Editar Tipo' : 'Nuevo Tipo de Negocio'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nombre</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Icono</label>
                                <div className="grid grid-cols-6 gap-2 p-2 border rounded-lg dark:border-gray-600 max-h-32 overflow-y-auto">
                                    {Object.keys(availableIcons).map(iconName => (
                                        <button
                                            key={iconName}
                                            type="button"
                                            onClick={() => setFormData({ ...formData, icon: iconName })}
                                            className={`p-2 rounded-lg flex justify-center ${formData.icon === iconName ? 'bg-orange-100 text-orange-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300'}`}
                                            title={iconName}
                                        >
                                            <IconComponent name={iconName} className="w-5 h-5" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Query de Búsqueda (Google Maps)</label>
                                <input
                                    type="text"
                                    value={formData.google_query}
                                    onChange={e => setFormData({ ...formData, google_query: e.target.value })}
                                    placeholder="ej: restaurant food dining"
                                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 mt-1">Palabras clave en inglés/español para mejorar resultados en Maps</p>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg dark:text-gray-300 dark:hover:bg-gray-700"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
                                >
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal IA */}
            {showAiModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl w-full max-w-lg shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold dark:text-white flex items-center">
                                <Wand2 className="w-5 h-5 mr-2 text-purple-600" />
                                Asistente IA
                            </h2>
                            <button onClick={() => setShowAiModal(false)}><X className="w-5 h-5 text-gray-500" /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1 dark:text-gray-300">¿Qué tipo de negocios buscas?</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        value={aiTopic}
                                        onChange={e => setAiTopic(e.target.value)}
                                        placeholder="Ej: vida nocturna, mascotas, salud..."
                                        className="flex-1 p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    />
                                    <button
                                        onClick={handleAiSuggest}
                                        disabled={aiLoading || !aiTopic}
                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                                    >
                                        {aiLoading ? 'Pensando...' : 'Sugerir'}
                                    </button>
                                </div>
                            </div>

                            {aiSuggestions.length > 0 && (
                                <div className="mt-4">
                                    <p className="text-sm font-medium text-gray-500 mb-2">Sugerencias encontradas:</p>
                                    <div className="space-y-2 max-h-60 overflow-y-auto">
                                        {aiSuggestions.map((suggestion, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => applyAiSuggestion(suggestion)}
                                                className="w-full text-left p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-purple-50 dark:hover:bg-purple-900/20 transition flex items-center justify-between group"
                                            >
                                                <div className="flex items-center space-x-3">
                                                    <IconComponent name={suggestion.icon} className="w-5 h-5 text-gray-500 group-hover:text-purple-600" />
                                                    <div>
                                                        <p className="font-medium dark:text-white">{suggestion.name}</p>
                                                        <p className="text-xs text-gray-500">{suggestion.google_query}</p>
                                                    </div>
                                                </div>
                                                <Plus className="w-4 h-4 text-purple-600 opacity-0 group-hover:opacity-100" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
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

export default BusinessTypesSettings;
