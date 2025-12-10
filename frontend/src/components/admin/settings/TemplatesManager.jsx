import { API_URL, SOCKET_URL } from '../../../config';
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, FileText, DollarSign, Check, X } from 'lucide-react';
import Button from '../../shared/Button';
import Input from '../../shared/Input';

const TemplatesManager = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        title: '',
        totalPrice: '',
        is_default: false
    });

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch(`${API_URL}/proposal-templates`);
            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const payload = {
            name: formData.name,
            description: formData.description,
            is_default: formData.is_default,
            content_json: {
                title: formData.title,
                totalPrice: parseFloat(formData.totalPrice),
                description: formData.description,
                items: []
            }
        };

        try {
            const url = editingTemplate
                ? `${API_URL}/proposal-templates/${editingTemplate.id}`
                : `${API_URL}/proposal-templates`;

            const method = editingTemplate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                fetchTemplates();
                resetForm();
            }
        } catch (error) {
            console.error('Error saving template:', error);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta plantilla?')) return;

        try {
            await fetch(`${API_URL}/proposal-templates/${id}`, {
                method: 'DELETE'
            });
            fetchTemplates();
        } catch (error) {
            console.error('Error deleting template:', error);
        }
    };

    const startEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            description: template.description || '',
            title: template.content_json.title || '',
            totalPrice: template.content_json.totalPrice || '',
            is_default: template.is_default
        });
        setIsCreating(true);
    };

    const resetForm = () => {
        setEditingTemplate(null);
        setIsCreating(false);
        setFormData({
            name: '',
            description: '',
            title: '',
            totalPrice: '',
            is_default: false
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Plantillas de Propuestas</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona los modelos base para tus propuestas comerciales
                    </p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2"
                    >
                        <Plus className="w-4 h-4" />
                        <span>Nueva Plantilla</span>
                    </button>
                )}
            </div>

            {isCreating ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-6 flex items-center space-x-2">
                        <FileText className="w-5 h-5 text-orange-500" />
                        <span>{editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}</span>
                    </h4>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Nombre Interno</label>
                                <Input
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Plantilla Básica"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">Nombre para identificar la plantilla en el sistema.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Título Propuesta</label>
                                <Input
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Ej: Propuesta TPV Completo"
                                    required
                                />
                                <p className="mt-1 text-xs text-gray-500">Título que verá el cliente en la propuesta.</p>
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Descripción</label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm focus:ring-2 focus:ring-orange-500 transition-shadow"
                                    rows="3"
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe el contenido de esta plantilla..."
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Precio Total (€)</label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        value={formData.totalPrice}
                                        onChange={e => setFormData({ ...formData, totalPrice: e.target.value })}
                                        placeholder="0.00"
                                        required
                                        className="pl-10"
                                    />
                                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>
                            <div className="flex items-center pt-8">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.is_default}
                                        onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                                        className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded transition-colors"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Marcar como plantilla predeterminada
                                    </span>
                                </label>
                            </div>
                        </div>
                        <div className="flex justify-end space-x-3 pt-6 border-t border-gray-100 dark:border-gray-700">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2"
                            >
                                <Check className="w-4 h-4" />
                                <span>{editingTemplate ? 'Actualizar Plantilla' : 'Crear Plantilla'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            ) : (
                <div className="grid gap-4">
                    {templates.map(template => (
                        <div key={template.id} className="bg-white dark:bg-gray-800 p-5 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center hover:shadow-md transition-shadow group">
                            <div className="flex items-start space-x-4">
                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400">
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{template.name}</h4>
                                        {template.is_default && (
                                            <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-xs font-medium rounded-full border border-green-200 dark:border-green-800">
                                                Predeterminada
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.description || 'Sin descripción'}</p>
                                    <div className="flex items-center space-x-4 mt-2">
                                        <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                            {template.content_json.title}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {parseFloat(template.content_json.totalPrice).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEdit(template)}
                                    className="p-2 text-gray-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    <Edit className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleDelete(template.id)}
                                    className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                    title="Eliminar"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                    {templates.length === 0 && !loading && (
                        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No hay plantillas creadas aún.</p>
                            <button
                                onClick={() => setIsCreating(true)}
                                className="mt-4 text-orange-600 hover:text-orange-700 font-medium text-sm"
                            >
                                Crear la primera plantilla
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default TemplatesManager;
