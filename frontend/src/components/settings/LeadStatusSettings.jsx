import { API_URL, SOCKET_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import {
    Plus, Edit, Trash2, GripVertical, Save,
    User, Phone, Mail, FileText, CheckCircle, XCircle,
    Clock, AlertCircle, Star, Flag, Send, MessageSquare,
    Briefcase, Target, Award, Ban
} from 'lucide-react';

const LeadStatusSettings = () => {
    const [statuses, setStatuses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [newStatus, setNewStatus] = useState({ name: '', color: 'blue', icon: 'Star' });
    const [showAddForm, setShowAddForm] = useState(false);

    const colorOptions = [
        { value: 'blue', label: 'Azul', class: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
        { value: 'green', label: 'Verde', class: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' },
        { value: 'yellow', label: 'Amarillo', class: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' },
        { value: 'red', label: 'Rojo', class: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
        { value: 'purple', label: 'Morado', class: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' },
        { value: 'orange', label: 'Naranja', class: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
        { value: 'gray', label: 'Gris', class: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }
    ];

    const iconOptions = [
        { name: 'Star', icon: <Star className="w-5 h-5" /> },
        { name: 'User', icon: <User className="w-5 h-5" /> },
        { name: 'Phone', icon: <Phone className="w-5 h-5" /> },
        { name: 'Mail', icon: <Mail className="w-5 h-5" /> },
        { name: 'FileText', icon: <FileText className="w-5 h-5" /> },
        { name: 'Send', icon: <Send className="w-5 h-5" /> },
        { name: 'MessageSquare', icon: <MessageSquare className="w-5 h-5" /> },
        { name: 'CheckCircle', icon: <CheckCircle className="w-5 h-5" /> },
        { name: 'XCircle', icon: <XCircle className="w-5 h-5" /> },
        { name: 'Clock', icon: <Clock className="w-5 h-5" /> },
        { name: 'AlertCircle', icon: <AlertCircle className="w-5 h-5" /> },
        { name: 'Flag', icon: <Flag className="w-5 h-5" /> },
        { name: 'Briefcase', icon: <Briefcase className="w-5 h-5" /> },
        { name: 'Target', icon: <Target className="w-5 h-5" /> },
        { name: 'Award', icon: <Award className="w-5 h-5" /> },
        { name: 'Ban', icon: <Ban className="w-5 h-5" /> }
    ];

    useEffect(() => {
        fetchStatuses();
    }, []);

    const fetchStatuses = async () => {
        try {
            const response = await fetch(`${API_URL}/settings/lead-statuses`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setStatuses(data);
            }
        } catch (error) {
            console.error('Error fetching statuses:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddStatus = () => {
        if (!newStatus.name.trim()) return;

        const newId = Math.max(...statuses.map(s => s.id), 0) + 1;
        const status = {
            id: newId,
            ...newStatus,
            position: statuses.length + 1,
            is_system: false
        };

        setStatuses([...statuses, status]);
        setNewStatus({ name: '', color: 'blue', icon: 'Star' });
        setShowAddForm(false);
    };

    const handleDeleteStatus = (id) => {
        const status = statuses.find(s => s.id === id);
        if (status?.is_system) {
            alert('No puedes eliminar estados del sistema');
            return;
        }

        if (confirm('¿Estás seguro de eliminar este estado?')) {
            setStatuses(statuses.filter(s => s.id !== id));
        }
    };

    const handleDragStart = (e, index) => {
        e.dataTransfer.setData('dragIndex', index.toString());
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, dropIndex) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('dragIndex'));

        const newStatuses = [...statuses];
        const [draggedItem] = newStatuses.splice(dragIndex, 1);
        newStatuses.splice(dropIndex, 0, draggedItem);

        // Update positions
        newStatuses.forEach((status, index) => {
            status.position = index + 1;
        });

        setStatuses(newStatuses);
    };

    const getColorClass = (color) => {
        return colorOptions.find(c => c.value === color)?.class || colorOptions[0].class;
    };

    const getIconComponent = (iconName) => {
        const iconOption = iconOptions.find(i => i.name === iconName);
        return iconOption ? iconOption.icon : <Star className="w-5 h-5" />;
    };

    return (
        <div className="max-w-4xl space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Estados de Leads</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Personaliza los estados del pipeline de ventas
                    </p>
                </div>
                <button
                    onClick={() => setShowAddForm(!showAddForm)}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Estado</span>
                </button>
            </div>

            {/* Add Form */}
            {showAddForm && (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Agregar Nuevo Estado</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nombre
                            </label>
                            <input
                                type="text"
                                value={newStatus.name}
                                onChange={(e) => setNewStatus({ ...newStatus, name: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                placeholder="Ej: En Negociación"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Color
                            </label>
                            <select
                                value={newStatus.color}
                                onChange={(e) => setNewStatus({ ...newStatus, color: e.target.value })}
                                className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                            >
                                {colorOptions.map(color => (
                                    <option key={color.value} value={color.value}>{color.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Icono
                            </label>
                            <div className="grid grid-cols-8 gap-2">
                                {iconOptions.map((option) => (
                                    <button
                                        key={option.name}
                                        onClick={() => setNewStatus({ ...newStatus, icon: option.name })}
                                        className={`p-2 rounded-lg flex items-center justify-center transition-all ${newStatus.icon === option.name
                                            ? 'bg-orange-100 text-orange-600 ring-2 ring-orange-500'
                                            : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                            }`}
                                        title={option.name}
                                    >
                                        {option.icon}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <button
                            onClick={() => setShowAddForm(false)}
                            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleAddStatus}
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>Guardar</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Statuses List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden shadow-sm">
                <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center space-x-2">
                        <GripVertical className="w-4 h-4" />
                        <span>Arrastra para reordenar. Los estados del sistema no se pueden eliminar.</span>
                    </p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                    {statuses.map((status, index) => (
                        <div
                            key={status.id}
                            draggable={!status.is_system}
                            onDragStart={(e) => handleDragStart(e, index)}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, index)}
                            className={`p-4 flex items-center justify-between ${!status.is_system ? 'cursor-move hover:bg-gray-50 dark:hover:bg-gray-700/50' : ''} transition-colors`}
                        >
                            <div className="flex items-center space-x-4 flex-1">
                                {!status.is_system && (
                                    <GripVertical className="w-5 h-5 text-gray-400" />
                                )}
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300`}>
                                        {getIconComponent(status.icon)}
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{status.name}</p>
                                        {status.is_system && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">Estado del sistema</p>
                                        )}
                                    </div>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getColorClass(status.color)}`}>
                                    {status.color}
                                </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-500 dark:text-gray-400 mr-4">
                                    Posición {status.position}
                                </span>
                                {!status.is_system && (
                                    <>
                                        <button
                                            onClick={() => setEditingId(status.id)}
                                            className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteStatus(status.id)}
                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
                <button
                    onClick={async () => {
                        try {
                            const response = await fetch(`${API_URL}/settings/lead-statuses`, {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                                },
                                body: JSON.stringify({ statuses })
                            });

                            if (response.ok) {
                                const updatedStatuses = await response.json();
                                setStatuses(updatedStatuses);
                                alert('Estados guardados correctamente');
                            } else {
                                alert('Error al guardar estados');
                            }
                        } catch (error) {
                            console.error('Error saving statuses:', error);
                            alert('Error al guardar estados');
                        }
                    }}
                    className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2"
                >
                    <Save className="w-4 h-4" />
                    <span>Guardar Cambios</span>
                </button>
            </div>
        </div>
    );
};

export default LeadStatusSettings;
