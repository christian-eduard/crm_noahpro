import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Eye, Mail, Copy, Check, X, FileText, ArrowLeft } from 'lucide-react';
import Button from '../shared/Button';
import Input from '../shared/Input';

const EmailTemplatesView = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingTemplate, setEditingTemplate] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        subject: '',
        body: '',
        type: 'initial_proposal'
    });

    const templateTypes = {
        initial_proposal: 'Propuesta Inicial',
        reminder_1: 'Recordatorio 1',
        reminder_2: 'Recordatorio 2',
        custom: 'Personalizada'
    };

    const availableVariables = [
        { var: '{{lead_name}}', desc: 'Nombre del lead' },
        { var: '{{business_name}}', desc: 'Nombre del negocio' },
        { var: '{{proposal_link}}', desc: 'Link a la propuesta' },
        { var: '{{proposal_title}}', desc: 'Título de la propuesta' },
        { var: '{{company_name}}', desc: 'Nombre de tu empresa' }
    ];

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            // Simulated - replace with actual API call
            const sampleTemplates = [
                {
                    id: 1,
                    name: 'Propuesta Inicial Estándar',
                    subject: 'Tu propuesta personalizada de {{company_name}}',
                    body: 'Hola {{lead_name}},\n\nNos complace presentarte nuestra propuesta para {{business_name}}.\n\nPuedes revisarla aquí: {{proposal_link}}\n\nSaludos,\nEquipo {{company_name}}',
                    type: 'initial_proposal',
                    created_at: '2025-12-01'
                },
                {
                    id: 2,
                    name: 'Recordatorio Amigable',
                    subject: 'Recordatorio: {{proposal_title}}',
                    body: 'Hola {{lead_name}},\n\nQueremos recordarte que tienes una propuesta pendiente de revisión.\n\nLink: {{proposal_link}}\n\n¿Tienes alguna duda?\n\nSaludos',
                    type: 'reminder_1',
                    created_at: '2025-12-01'
                }
            ];
            setTemplates(sampleTemplates);
        } catch (error) {
            console.error('Error fetching templates:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            // Simulated save - replace with actual API call
            if (editingTemplate) {
                setTemplates(templates.map(t =>
                    t.id === editingTemplate.id ? { ...t, ...formData } : t
                ));
            } else {
                const newTemplate = {
                    id: Math.max(...templates.map(t => t.id), 0) + 1,
                    ...formData,
                    created_at: new Date().toISOString().split('T')[0]
                };
                setTemplates([...templates, newTemplate]);
            }
            resetForm();
        } catch (error) {
            console.error('Error saving template:', error);
        }
    };

    const handleEdit = (template) => {
        setEditingTemplate(template);
        setFormData({
            name: template.name,
            subject: template.subject,
            body: template.body,
            type: template.type
        });
        setIsCreating(true);
    };

    const handleDelete = async (id) => {
        if (confirm('¿Estás seguro de eliminar esta plantilla?')) {
            setTemplates(templates.filter(t => t.id !== id));
        }
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingTemplate(null);
        setFormData({ name: '', subject: '', body: '', type: 'initial_proposal' });
    };

    const insertVariable = (variable) => {
        setFormData({
            ...formData,
            body: formData.body + variable
        });
    };

    const renderPreview = (template) => {
        let preview = template.body;
        preview = preview.replace(/{{lead_name}}/g, 'Juan Pérez');
        preview = preview.replace(/{{business_name}}/g, 'Empresa Demo S.L.');
        preview = preview.replace(/{{proposal_link}}/g, 'https://tucrm.com/propuesta/123');
        preview = preview.replace(/{{proposal_title}}/g, 'Propuesta Comercial 2025');
        preview = preview.replace(/{{company_name}}/g, 'Tu Empresa');
        return preview;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">Plantillas de Email</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona los correos para la automatización de marketing
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

            {/* Content: Form or Grid */}
            {isCreating ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <div className="flex items-center space-x-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-700">
                        <button
                            onClick={resetForm}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-500" />
                        </button>
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                            <FileText className="w-5 h-5 text-orange-500" />
                            <span>{editingTemplate ? 'Editar Plantilla' : 'Nueva Plantilla'}</span>
                        </h4>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nombre Interno
                                </label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ej: Propuesta Inicial Estándar"
                                    required
                                />
                            </div>
                            <div>
                                <label htmlFor="type" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tipo de Email
                                </label>
                                <select
                                    id="type"
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 transition-shadow"
                                >
                                    {Object.entries(templateTypes).map(([key, label]) => (
                                        <option key={key} value={key}>{label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Asunto del Correo
                            </label>
                            <Input
                                id="subject"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                placeholder="Ej: Propuesta comercial para {{business_name}}"
                                required
                            />
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="body" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                    Cuerpo del Email
                                </label>
                                <span className="text-xs text-gray-500">Soporta variables dinámicas</span>
                            </div>
                            <textarea
                                id="body"
                                value={formData.body}
                                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                                rows="10"
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white font-mono text-sm focus:ring-2 focus:ring-orange-500 transition-shadow"
                                required
                                placeholder="Escribe el contenido de tu email aquí..."
                            />
                        </div>

                        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p className="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-3 flex items-center space-x-2">
                                <Copy className="w-4 h-4" />
                                <span>Variables Disponibles</span>
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {availableVariables.map((v) => (
                                    <button
                                        key={v.var}
                                        type="button"
                                        onClick={() => insertVariable(v.var)}
                                        className="px-3 py-1.5 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-md text-xs hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors font-mono shadow-sm"
                                        title={v.desc}
                                    >
                                        {v.var}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 dark:border-gray-700">
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
                                    <Mail className="w-6 h-6" />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h4 className="font-semibold text-gray-900 dark:text-white text-lg">{template.name}</h4>
                                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium rounded-full border border-gray-200 dark:border-gray-600">
                                            {templateTypes[template.type]}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        <span className="font-medium">Asunto:</span> {template.subject}
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        Creada el {new Date(template.created_at).toLocaleDateString('es-ES')}
                                    </p>
                                </div>
                            </div>
                            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setPreviewTemplate(template)}
                                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                    title="Vista Previa"
                                >
                                    <Eye className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => handleEdit(template)}
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
                            <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 dark:text-gray-400">No hay plantillas de email creadas aún.</p>
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

            {/* Preview Modal */}
            {previewTemplate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full mx-4 border border-gray-200 dark:border-gray-700">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 rounded-t-xl">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                                <Eye className="w-5 h-5 text-gray-500" />
                                <span>Vista Previa</span>
                            </h2>
                            <button
                                onClick={() => setPreviewTemplate(null)}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Asunto</p>
                                <p className="text-gray-900 dark:text-white font-medium text-lg">{previewTemplate.subject}</p>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Cuerpo del Mensaje</p>
                                <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-100 dark:border-gray-700">
                                    <pre className="whitespace-pre-wrap text-sm text-gray-800 dark:text-gray-200 font-sans leading-relaxed">
                                        {renderPreview(previewTemplate)}
                                    </pre>
                                </div>
                            </div>
                            <div className="flex justify-end pt-2">
                                <button
                                    onClick={() => setPreviewTemplate(null)}
                                    className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cerrar Vista Previa
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmailTemplatesView;
