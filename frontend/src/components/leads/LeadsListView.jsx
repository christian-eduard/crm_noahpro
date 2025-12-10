import React, { useState } from 'react';
import { Eye, UserPlus, Trash2 } from 'lucide-react';
import ConfirmModal from '../shared/ConfirmModal';
import Button from '../shared/Button';
import { useToast } from '../../contexts/ToastContext';

const LeadsListView = ({ leads, onLeadClick, onStatusChange, onDeleteLead }) => {
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', leadToDelete: null });
    const [convertModal, setConvertModal] = useState({ isOpen: false, lead: null });
    const [sortBy, setSortBy] = useState('date');
    const [filterStatus, setFilterStatus] = useState('all');
    const toast = useToast();

    const handleConvertToClient = async (e, lead) => {
        e.stopPropagation();
        setConvertModal({ isOpen: true, lead });
    };

    const confirmConvertToClient = async () => {
        if (!convertModal.lead) return;

        try {
            const response = await fetch('http://localhost:3002/api/clients/convert-lead', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                },
                body: JSON.stringify({ leadId: convertModal.lead.id })
            });

            if (response.ok) {
                toast.success('Lead convertido a cliente exitosamente');
                onStatusChange(convertModal.lead.id, 'won');
                setConvertModal({ isOpen: false, lead: null });
            } else {
                const errorData = await response.json();
                toast.error(errorData.error || 'Error al convertir lead');
            }
        } catch (error) {
            console.error('Error converting lead:', error);
            toast.error('Error de conexión');
        }
    };

    const handleDeleteLead = async (e, lead) => {
        e.stopPropagation();

        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Lead',
            message: `¿Estás seguro de eliminar el lead "${lead.name}"? Esta acción no se puede deshacer.`,
            leadToDelete: lead
        });
    };

    const confirmDelete = async () => {
        if (!confirmDialog.leadToDelete) return;

        try {
            const response = await fetch(`http://localhost:3002/api/leads/${confirmDialog.leadToDelete.id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                }
            });

            if (response.ok) {
                toast.success('Lead eliminado correctamente');
                if (onDeleteLead) {
                    onDeleteLead(confirmDialog.leadToDelete.id);
                }
            } else {
                throw new Error('Error al eliminar');
            }
        } catch (error) {
            toast.error('Error al eliminar el lead');
            console.error(error);
        } finally {
            setConfirmDialog({ ...confirmDialog, isOpen: false, leadToDelete: null });
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            new: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
            contacted: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
            qualified: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
            proposal_sent: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
            won: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
            lost: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
        };
        return badges[status] || badges.new;
    };

    const getStatusLabel = (status) => {
        const labels = {
            new: 'Nuevo',
            contacted: 'Contactado',
            qualified: 'Calificado',
            proposal_sent: 'Propuesta Enviada',
            won: 'Ganado',
            lost: 'Perdido'
        };
        return labels[status] || status;
    };

    const filteredLeads = leads.filter(lead =>
        filterStatus === 'all' || lead.status === filterStatus
    );

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="new">Nuevos</option>
                        <option value="contacted">Contactados</option>
                        <option value="qualified">Calificados</option>
                        <option value="proposal_sent">Propuesta Enviada</option>
                        <option value="won">Ganados</option>
                        <option value="lost">Perdidos</option>
                    </select>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {filteredLeads.length} leads
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
                <table className="w-full min-w-[900px]">
                    <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Lead</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Empresa</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Estado</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Propuesta</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Última Vista</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Email Abierto</th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredLeads.map((lead) => (
                            <tr
                                key={lead.id}
                                onClick={() => onLeadClick(lead)}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-medium text-gray-900 dark:text-white">{lead.name}</p>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">{lead.email}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                    {lead.business_name || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(lead.status)}`}>
                                        {getStatusLabel(lead.status)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {lead.has_proposal ? (
                                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                            ✓ Enviada
                                        </span>
                                    ) : (
                                        <span className="text-sm text-gray-400 dark:text-gray-500">-</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                    {lead.last_proposal_view || '-'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                    {lead.last_email_open || '-'}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onLeadClick(lead);
                                            }}
                                            className="p-2 text-gray-500 hover:text-orange-600 dark:text-gray-400 dark:hover:text-orange-400 transition-colors rounded-lg hover:bg-orange-50 dark:hover:bg-orange-900/20"
                                            title="Ver detalles"
                                        >
                                            <Eye size={18} />
                                        </button>
                                        {lead.status !== 'won' && (
                                            <button
                                                onClick={(e) => handleConvertToClient(e, lead)}
                                                className="p-2 text-gray-500 hover:text-green-600 dark:text-gray-400 dark:hover:text-green-400 transition-colors rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
                                                title="Convertir a Cliente"
                                            >
                                                <UserPlus size={18} />
                                            </button>
                                        )}
                                        <button
                                            onClick={(e) => handleDeleteLead(e, lead)}
                                            className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20"
                                            title="Eliminar Lead"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <ConfirmModal
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false, leadToDelete: null })}
                onConfirm={confirmDelete}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type="danger"
            />

            {/* Convert to Client Modal */}
            {convertModal.isOpen && convertModal.lead && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Convertir a Cliente</h3>

                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6 border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                                ¿Estás seguro de convertir este lead a cliente?
                            </p>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</label>
                                <p className="text-gray-900 dark:text-white font-semibold mt-1">{convertModal.lead.name}</p>
                            </div>

                            {convertModal.lead.business_name && (
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Empresa</label>
                                    <p className="text-gray-900 dark:text-white font-semibold mt-1">{convertModal.lead.business_name}</p>
                                </div>
                            )}

                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</label>
                                <p className="text-gray-900 dark:text-white mt-1">{convertModal.lead.email}</p>
                            </div>

                            {convertModal.lead.phone && (
                                <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3">
                                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Teléfono</label>
                                    <p className="text-gray-900 dark:text-white mt-1">{convertModal.lead.phone}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => setConvertModal({ isOpen: false, lead: null })}
                                className="flex-1"
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={confirmConvertToClient}
                                className="flex-1"
                            >
                                Convertir a Cliente
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LeadsListView;
