import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, User } from 'lucide-react';

const EventModal = ({ isOpen, onClose, onSave, event = null, leads = [] }) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start_time: '',
        end_time: '',
        type: 'meeting',
        lead_id: '',
        created_by: 'Admin'
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (event) {
            setFormData({
                title: event.title || '',
                description: event.description || '',
                start_time: event.start_time ? new Date(event.start_time).toISOString().slice(0, 16) : '',
                end_time: event.end_time ? new Date(event.end_time).toISOString().slice(0, 16) : '',
                type: event.type || 'meeting',
                lead_id: event.lead_id || '',
                created_by: event.created_by || 'Admin'
            });
        } else {
            setFormData({
                title: '',
                description: '',
                start_time: '',
                end_time: '',
                type: 'meeting',
                lead_id: '',
                created_by: 'Admin'
            });
        }
        setErrors({});
    }, [event, isOpen]);

    const validate = () => {
        const newErrors = {};
        if (!formData.title.trim()) {
            newErrors.title = 'El título es requerido';
        }
        if (!formData.start_time) {
            newErrors.start_time = 'La fecha de inicio es requerida';
        }
        if (!formData.end_time) {
            newErrors.end_time = 'La fecha de fin es requerida';
        }
        if (formData.start_time && formData.end_time && new Date(formData.start_time) >= new Date(formData.end_time)) {
            newErrors.end_time = 'La fecha de fin debe ser posterior a la de inicio';
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {event ? 'Editar Evento' : 'Nuevo Evento'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-6">
                            {/* Title */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Título *
                                </label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.title ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                        }`}
                                    placeholder="Ej: Reunión con cliente"
                                />
                                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
                            </div>

                            {/* Type */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Tipo de Evento
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                >
                                    <option value="meeting">Reunión</option>
                                    <option value="call">Llamada</option>
                                    <option value="demo">Demo</option>
                                    <option value="followup">Seguimiento</option>
                                    <option value="other">Otro</option>
                                </select>
                            </div>

                            {/* Lead Association */}
                            {leads && leads.length > 0 && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Asociar con Lead (opcional)
                                    </label>
                                    <div className="relative">
                                        <select
                                            value={formData.lead_id}
                                            onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                        >
                                            <option value="">Sin asociar</option>
                                            {leads.map(lead => (
                                                <option key={lead.id} value={lead.id}>
                                                    {lead.name} - {lead.business_name || 'Sin empresa'}
                                                </option>
                                            ))}
                                        </select>
                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Start Time */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Fecha y Hora de Inicio *
                                </label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        value={formData.start_time}
                                        onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.start_time ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                    />
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                                {errors.start_time && <p className="mt-1 text-sm text-red-500">{errors.start_time}</p>}
                            </div>

                            {/* End Time */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Fecha y Hora de Fin *
                                </label>
                                <div className="relative">
                                    <input
                                        type="datetime-local"
                                        value={formData.end_time}
                                        onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                        className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${errors.end_time ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                    />
                                    <Clock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                                </div>
                                {errors.end_time && <p className="mt-1 text-sm text-red-500">{errors.end_time}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Full Width Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            rows="4"
                            placeholder="Detalles del evento..."
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all"
                        >
                            {event ? 'Guardar Cambios' : 'Crear Evento'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventModal;
