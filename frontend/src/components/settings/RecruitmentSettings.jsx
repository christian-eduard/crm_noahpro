/**
 * RecruitmentSettings.jsx
 * Gestión de plantillas de entrevista para Talent Hunter AI.
 */
import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import { Briefcase, Plus, Clock, FileText, CheckCircle, RefreshCw, XCircle, Edit2 } from 'lucide-react';
import Button from '../shared/Button';
import Modal from '../shared/Modal';

const RecruitmentSettings = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [templateForm, setTemplateForm] = useState({
        name: '',
        description: '',
        system_prompt: 'Eres un entrevistador profesional...',
        duration_minutes: 15,
        questions: [],
        difficulty_level: 'mid',
        is_active: true
    });
    const [questionText, setQuestionText] = useState('');
    const [editingId, setEditingId] = useState(null);

    const toast = useToast();
    const token = localStorage.getItem('crm_token');

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch(`${API_URL}/recruitment/templates`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setTemplates(data.templates || []);
            }
        } catch (error) {
            console.error('Error fetching templates', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddQuestion = () => {
        if (!questionText.trim()) return;
        setTemplateForm(prev => ({
            ...prev,
            questions: [...prev.questions, { text: questionText, duration: 60 }]
        }));
        setQuestionText('');
    };

    const handleRemoveQuestion = (index) => {
        setTemplateForm(prev => ({
            ...prev,
            questions: prev.questions.filter((_, i) => i !== index)
        }));
    };

    const handleEdit = (template) => {
        setTemplateForm({
            name: template.name,
            description: template.description || '',
            system_prompt: template.system_prompt || '',
            duration_minutes: template.duration_minutes || 15,
            questions: Array.isArray(template.questions) ? template.questions : [],
            difficulty_level: template.difficulty_level || 'mid',
            is_active: template.is_active
        });
        setEditingId(template.id);
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const url = editingId
                ? `${API_URL}/recruitment/templates/${editingId}`
                : `${API_URL}/recruitment/templates`;

            const method = editingId ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method: method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(templateForm)
            });

            if (response.ok) {
                toast.success(editingId ? 'Plantilla actualizada' : 'Plantilla creada');
                setIsModalOpen(false);
                resetForm();
                fetchTemplates();
            } else {
                toast.error('Error al guardar plantilla');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const resetForm = () => {
        setTemplateForm({
            name: '',
            description: '',
            system_prompt: 'Eres un entrevistador profesional...',
            duration_minutes: 15,
            questions: [],
            difficulty_level: 'mid',
            is_active: true
        });
        setEditingId(null);
        setQuestionText('');
    };

    if (loading) return <div className="p-8 text-center"><RefreshCw className="animate-spin text-gray-400 mx-auto" /></div>;

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold flex items-center gap-2 text-gray-800 dark:text-gray-100">
                    <Briefcase className="w-6 h-6 text-green-600" />
                    Plantillas de Entrevista
                </h3>
                <Button onClick={() => { resetForm(); setIsModalOpen(true); }}>
                    <Plus className="w-4 h-4 mr-2" /> Nueva Plantilla
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map(template => (
                    <div key={template.id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all group relative">
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-lg text-gray-900 dark:text-white truncate pr-8">{template.name}</h4>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${template.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400'
                                }`}>
                                {template.is_active ? 'Activa' : 'Inactiva'}
                            </span>
                        </div>

                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-2 min-h-[2.5em]">{template.description || 'Sin descripción'}</p>

                        <div className="flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500 mb-4">
                            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                                <Clock className="w-3 h-3" />
                                {template.duration_minutes} min
                            </div>
                            <div className="flex items-center gap-1 bg-gray-50 dark:bg-gray-700/50 px-2 py-1 rounded">
                                <FileText className="w-3 h-3" />
                                {Array.isArray(template.questions) ? template.questions.length : 0} p.
                            </div>
                            <div className="ml-auto text-[10px] bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300 px-2 py-1 rounded uppercase">
                                {template.difficulty_level}
                            </div>
                        </div>

                        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                                onClick={() => handleEdit(template)}
                                className="p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 text-gray-500 hover:text-blue-500 hover:border-blue-500 transition-colors"
                            >
                                <Edit2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={() => { setIsModalOpen(false); resetForm(); }}
                title={editingId ? "Editar Plantilla" : "Nueva Plantilla"}
                size="lg"
            >
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nombre</label>
                            <input
                                className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={templateForm.name}
                                onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                placeholder="Ej: Desarrollador Senior"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Dificultad</label>
                            <select
                                className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                value={templateForm.difficulty_level}
                                onChange={(e) => setTemplateForm({ ...templateForm, difficulty_level: e.target.value })}
                            >
                                <option value="junior">Junior</option>
                                <option value="mid">Mid</option>
                                <option value="senior">Senior</option>
                                <option value="expert">Expert</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300">Descripción</label>
                        <textarea
                            className="w-full border rounded p-2 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            rows="2"
                            value={templateForm.description}
                            onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                            placeholder="Descripción interna para los reclutadores"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1 dark:text-gray-300 flex justify-between">
                            <span>System Prompt (Personalidad IA)</span>
                            <span className="text-xs text-gray-500">Instrucciones para la IA entrevistadora</span>
                        </label>
                        <textarea
                            className="w-full border rounded p-2 h-24 text-xs font-mono bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-300"
                            value={templateForm.system_prompt}
                            onChange={(e) => setTemplateForm({ ...templateForm, system_prompt: e.target.value })}
                        />
                    </div>

                    <div className="border-t dark:border-gray-700 pt-4">
                        <label className="block text-sm font-medium mb-2 dark:text-gray-300">Preguntas de la Entrevista</label>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 mb-3 max-h-40 overflow-y-auto space-y-2">
                            {templateForm.questions.length === 0 && <p className="text-sm text-center text-gray-400 py-2">Sin preguntas definidas</p>}
                            {templateForm.questions.map((q, i) => (
                                <div key={i} className="flex justify-between items-center bg-white dark:bg-gray-800 p-2 rounded border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{q.text}</span>
                                    <button onClick={() => handleRemoveQuestion(i)} className="text-red-400 hover:text-red-600 p-1">
                                        <XCircle className="w-4 h-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                className="flex-1 border rounded p-2 text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                placeholder="Escribe una pregunta..."
                                value={questionText}
                                onChange={(e) => setQuestionText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddQuestion()}
                            />
                            <Button size="sm" onClick={handleAddQuestion}>Añadir</Button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="is_active"
                            checked={templateForm.is_active}
                            onChange={(e) => setTemplateForm({ ...templateForm, is_active: e.target.checked })}
                            className="rounded text-green-600 focus:ring-green-500"
                        />
                        <label htmlFor="is_active" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                            Plantilla Activa (Visible para reclutadores)
                        </label>
                    </div>

                    <div className="flex justify-end gap-2 pt-4 border-t dark:border-gray-700">
                        <Button variant="outline" onClick={() => { setIsModalOpen(false); resetForm(); }}>Cancelar</Button>
                        <Button onClick={handleSave}>{editingId ? 'Actualizar' : 'Guardar'}</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default RecruitmentSettings;
