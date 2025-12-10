import React, { useState, useEffect, useRef } from 'react';
import { Mail, Code, Eye, Save, ArrowLeft, Loader, Copy, RefreshCw } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';

const HTMLEmailTemplatesEditor = () => {
    const toast = useToast();
    const [templates, setTemplates] = useState([]);
    const [selectedTemplate, setSelectedTemplate] = useState(null);
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [viewMode, setViewMode] = useState('split'); // 'split', 'code', 'preview'
    const textareaRef = useRef(null);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const response = await fetch('http://localhost:3002/api/email-templates', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setTemplates(data);
            } else {
                toast.error('Error al cargar plantillas');
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTemplate = (template) => {
        setSelectedTemplate(template);
        setContent(template.content);
        setViewMode('split');
    };

    const handleSave = async () => {
        if (!selectedTemplate) return;

        setSaving(true);
        try {
            const response = await fetch(`http://localhost:3002/api/email-templates/${selectedTemplate.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                },
                body: JSON.stringify({ content })
            });

            if (response.ok) {
                toast.success('✅ Plantilla guardada correctamente');
                fetchTemplates();
            } else {
                toast.error('Error al guardar plantilla');
            }
        } catch (error) {
            console.error('Error saving template:', error);
            toast.error('Error de conexión');
        } finally {
            setSaving(false);
        }
    };

    const insertVariable = (variable) => {
        if (!textareaRef.current) return;

        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const text = content;
        const before = text.substring(0, start);
        const after = text.substring(end, text.length);

        setContent(before + variable + after);

        // Restore focus and cursor position
        setTimeout(() => {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(start + variable.length, start + variable.length);
        }, 0);
    };

    const getTemplateDisplayName = (template) => {
        const names = {
            'proposal': '📧 Plantilla de Propuesta',
            'welcome': '👋 Plantilla de Bienvenida',
            'notification': '🔔 Plantilla de Notificación',
            'invoice': '📄 Plantilla de Factura',
            'receipt': '✅ Plantilla de Recibo'
        };
        return names[template.id] || template.name;
    };

    const availableVariables = [
        { var: '{{name}}', desc: 'Nombre del cliente' },
        { var: '{{businessName}}', desc: 'Nombre del negocio' },
        { var: '{{proposalTitle}}', desc: 'Título de la propuesta' },
        { var: '{{proposalPrice}}', desc: 'Precio total' },
        { var: '{{proposalUrl}}', desc: 'Enlace a la propuesta' },
        { var: '{{frontendUrl}}', desc: 'URL del CRM' },
        { var: '{{year}}', desc: 'Año actual' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader className="w-8 h-8 text-orange-500 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4 h-full max-w-full overflow-x-hidden">
            {!selectedTemplate ? (
                <>
                    <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Plantillas de Email HTML</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Edita el código HTML de tus plantillas de correo con vista previa en tiempo real
                        </p>
                    </div>

                    <div className="grid gap-4 max-w-full">
                        {templates.map(template => (
                            <div
                                key={template.id}
                                onClick={() => handleSelectTemplate(template)}
                                className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-orange-500 hover:shadow-lg transition-all cursor-pointer group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-4">
                                        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400 group-hover:scale-110 transition-transform">
                                            <Mail className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900 dark:text-white text-lg">
                                                {getTemplateDisplayName(template)}
                                            </h4>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                Última actualización: {new Date(template.updated_at).toLocaleDateString('es-ES')}
                                            </p>
                                        </div>
                                    </div>
                                    <Eye className="w-5 h-5 text-gray-400 group-hover:text-orange-500 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            ) : (
                <div className="flex flex-col h-[calc(100vh-100px)] space-y-1 max-w-full">
                    {/* Header */}
                    <div className="flex items-center justify-between shrink-0">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setSelectedTemplate(null)}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5 text-gray-500" />
                            </button>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {getTemplateDisplayName(selectedTemplate)}
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Editor HTML con Vista Previa
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                <button
                                    onClick={() => setViewMode('code')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${viewMode === 'code'
                                        ? 'bg-white dark:bg-gray-600 text-orange-600 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                                        }`}
                                >
                                    <Code className="w-4 h-4" />
                                    <span>Código</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('split')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${viewMode === 'split'
                                        ? 'bg-white dark:bg-gray-600 text-orange-600 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                                        }`}
                                >
                                    <RefreshCw className="w-4 h-4" />
                                    <span>Dividido</span>
                                </button>
                                <button
                                    onClick={() => setViewMode('preview')}
                                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center space-x-2 ${viewMode === 'preview'
                                        ? 'bg-white dark:bg-gray-600 text-orange-600 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900'
                                        }`}
                                >
                                    <Eye className="w-4 h-4" />
                                    <span>Vista Previa</span>
                                </button>
                            </div>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2 disabled:opacity-50"
                            >
                                {saving ? (
                                    <Loader className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                <span>{saving ? 'Guardando...' : 'Guardar'}</span>
                            </button>
                        </div>
                    </div>

                    {/* Variables Toolbar */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-1.5 rounded border border-blue-100 dark:border-blue-800 shrink-0">
                        <div className="flex flex-wrap gap-1">
                            {availableVariables.map((v) => (
                                <button
                                    key={v.var}
                                    onClick={() => insertVariable(v.var)}
                                    className="px-2 py-1 bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded text-xs hover:bg-blue-50 dark:hover:bg-blue-900/50 transition-colors font-mono shadow-sm whitespace-nowrap"
                                    title={v.desc}
                                >
                                    {v.var}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Editor Area */}
                    <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex">
                        {/* Code Editor */}
                        {(viewMode === 'code' || viewMode === 'split') && (
                            <div className={`flex flex-col border-r border-gray-200 dark:border-gray-700 ${viewMode === 'split' ? 'w-[40%]' : 'w-full'} overflow-hidden`}>
                                <div className="bg-gray-100 dark:bg-gray-900 px-4 py-2 text-xs font-mono text-gray-500 border-b border-gray-200 dark:border-gray-700 shrink-0">
                                    HTML SOURCE
                                </div>
                                <textarea
                                    ref={textareaRef}
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="flex-1 w-full p-4 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 font-mono text-xs focus:outline-none resize-none overflow-auto"
                                    spellCheck={false}
                                />
                            </div>
                        )}

                        {/* Preview */}
                        {(viewMode === 'preview' || viewMode === 'split') && (
                            <div className={`flex flex-col bg-white ${viewMode === 'split' ? 'w-[60%]' : 'w-full'} overflow-hidden`}>
                                <div className="bg-gray-100 dark:bg-gray-900 px-4 py-2 text-xs font-mono text-gray-500 border-b border-gray-200 dark:border-gray-700 flex justify-between shrink-0">
                                    <span>PREVIEW</span>
                                    <span className="text-orange-500">Renderizado Real</span>
                                </div>
                                <div className="flex-1 bg-gray-200 p-4 overflow-auto">
                                    <div className="bg-white shadow-lg mx-auto" style={{ maxWidth: '100%' }}>
                                        <iframe
                                            title="preview"
                                            srcDoc={content}
                                            className="w-full border-none"
                                            style={{ height: '1400px', maxWidth: '100%' }}
                                            sandbox="allow-same-origin"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HTMLEmailTemplatesEditor;
