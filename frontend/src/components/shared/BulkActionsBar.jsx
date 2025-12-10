import React from 'react';
import Button from './Button';

const BulkActionsBar = ({ selectedCount, onUpdateStatus, onAssign, onAddTag, onDelete, onCancel }) => {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slide-up">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-4 flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <span className="text-blue-700 dark:text-blue-300 font-bold text-lg">{selectedCount}</span>
                    <span className="text-blue-600 dark:text-blue-400 text-sm">seleccionados</span>
                </div>

                <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

                <div className="flex items-center space-x-2">
                    {/* Change Status */}
                    <div className="relative group">
                        <button className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
                            Cambiar Estado
                        </button>
                        <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-2 min-w-[150px]">
                            {['new', 'contacted', 'qualified', 'proposal_sent', 'won', 'lost'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => onUpdateStatus(status)}
                                    className="w-full text-left px-3 py-2 text-sm rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                                >
                                    {status === 'new' && 'Nuevo'}
                                    {status === 'contacted' && 'Contactado'}
                                    {status === 'qualified' && 'Cualificado'}
                                    {status === 'proposal_sent' && 'Propuesta Enviada'}
                                    {status === 'won' && 'Ganado'}
                                    {status === 'lost' && 'Perdido'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <Button variant="secondary" onClick={onAddTag} size="sm">
                        🏷️ Agregar Tag
                    </Button>

                    <Button variant="secondary" onClick={onDelete} size="sm" className="text-red-600 hover:bg-red-50">
                        🗑️ Eliminar
                    </Button>

                    <div className="h-8 w-px bg-gray-300 dark:bg-gray-600" />

                    <button
                        onClick={onCancel}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Cancelar"
                    >
                        ✕
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BulkActionsBar;
