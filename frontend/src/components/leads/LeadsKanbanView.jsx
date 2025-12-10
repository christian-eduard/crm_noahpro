import React, { useState } from 'react';
import { useToast } from '../../contexts/ToastContext';
import {
    Mail, MailOpen, FileText, Eye,
    Star, User, Phone, CheckCircle, XCircle,
    Briefcase, Target, Award, Ban, Trash2,
    Send, MessageSquare, Clock, AlertCircle, Flag
} from 'lucide-react';
import ConfirmModal from '../shared/ConfirmModal';

const LeadsKanbanView = ({ leads, onLeadClick, onStatusChange, statuses, onDeleteLead }) => {
    const toast = useToast();
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', leadToDelete: null });

    const handleDeleteLead = async (e, leadId) => {
        e.stopPropagation();

        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Lead',
            message: '¿Estás seguro de eliminar este lead? Esta acción no se puede deshacer.',
            leadToDelete: { id: leadId }
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

    const getLeadsByStatus = (statusId) => {
        // Handle both string IDs (legacy) and number IDs (new system)
        return leads.filter(lead => {
            if (typeof statusId === 'number') {
                // If statusId is number, lead.status might be string 'new' or number 1
                // We need to map legacy string statuses to new IDs if possible, or just match loosely
                // For now, let's assume lead.status matches the ID type or we do a loose comparison if needed
                return lead.status === statusId || lead.status_id === statusId;
            }
            return lead.status === statusId;
        });
    };

    const handleDragStart = (e, lead) => {
        e.dataTransfer.setData('leadId', lead.id.toString());
    };

    const handleDragOver = (e) => {
        e.preventDefault();
    };

    const handleDrop = (e, newStatus) => {
        e.preventDefault();
        const leadId = parseInt(e.dataTransfer.getData('leadId'));
        onStatusChange(leadId, newStatus);
    };

    const iconMap = {
        Star, User, Phone, Mail, FileText, Send, MessageSquare,
        CheckCircle, XCircle, Clock, AlertCircle, Flag,
        Briefcase, Target, Award, Ban
    };

    const getIconComponent = (iconName) => {
        const Icon = iconMap[iconName] || Star;
        return <Icon className="w-4 h-4" />;
    };

    const getColorClass = (color) => {
        const colors = {
            blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
            green: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
            yellow: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
            red: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
            purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
            orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
            gray: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
        };
        return colors[color] || colors.gray;
    };

    // Use passed statuses
    const displayStatuses = statuses || [];

    return (
        <div className="flex space-x-4 overflow-x-auto pb-4 min-h-[calc(100vh-250px)]">
            {displayStatuses.map((status) => {
                // We need to handle the matching logic carefully. 
                // If leads use string statuses ('new') and settings use IDs (1), we might need a mapping.
                // For this implementation, we'll try to match by ID first, then by name/key if needed.
                // Assuming the backend returns leads with 'status' field matching one of the status identifiers.

                // Temporary fix for legacy string statuses vs new numeric IDs:
                // If status.id is a number, we might need to check if lead.status matches status.name or a mapped key.
                // But ideally, the backend should normalize this. 
                // Let's filter by checking if the lead's status matches the status.id OR status.key (if it existed)

                const statusLeads = leads.filter(l => {
                    // Direct match
                    if (l.status === status.id) return true;
                    // String vs Number match
                    if (l.status == status.id) return true; // loose equality
                    // Name match (fallback for legacy data)
                    if (l.status === status.name) return true;

                    // Specific legacy mapping (using actual DB IDs: 7, 8, 9, 10)
                    if (status.id === 7 && l.status === 'new') return true;
                    if (status.id === 8 && (l.status === 'contacted' || l.status === 'qualified' || l.status === 'proposal_sent')) return true;
                    if (status.id === 9 && l.status === 'won') return true;
                    if (status.id === 10 && l.status === 'lost') return true;

                    return false;
                });

                return (
                    <div
                        key={status.id}
                        className="flex-shrink-0 w-72"
                        onDragOver={handleDragOver}
                        onDrop={(e) => handleDrop(e, status.id)}
                    >
                        {/* Column Header */}
                        <div className="bg-white dark:bg-gray-800 rounded-t-xl p-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between sticky top-0 z-10 shadow-sm">
                            <div className="flex items-center space-x-2">
                                <div className={`p-1.5 rounded-md ${getColorClass(status.color)}`}>
                                    {getIconComponent(status.icon)}
                                </div>
                                <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate max-w-[120px]" title={status.name || status.label}>
                                    {status.name || status.label}
                                </h3>
                            </div>
                            <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs font-medium text-gray-600 dark:text-gray-400">
                                {statusLeads.length}
                            </span>
                        </div>

                        {/* Cards Container */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-b-xl p-2 space-y-2 min-h-[calc(100vh-300px)] overflow-y-auto custom-scrollbar">
                            {statusLeads.map((lead) => (
                                <div
                                    key={lead.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, lead)}
                                    onClick={() => onLeadClick(lead)}
                                    className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-move hover:shadow-md transition-all group relative"
                                >
                                    {/* Lead Name & Company */}
                                    <div className="mb-2">
                                        <h4 className="font-medium text-gray-900 dark:text-white text-sm leading-tight mb-0.5 group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                                            {lead.name}
                                        </h4>
                                        {lead.business_name && (
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                                {lead.business_name}
                                            </p>
                                        )}
                                    </div>

                                    {/* Proposal Badge - Compact */}
                                    {lead.has_proposal && (
                                        <div className="mb-2 flex items-center justify-between">
                                            <div className="inline-flex items-center space-x-1 px-1.5 py-0.5 bg-green-50 dark:bg-green-900/30 border border-green-100 dark:border-green-800 rounded text-[10px]">
                                                <FileText className="w-3 h-3 text-green-600 dark:text-green-400" />
                                                <span className="font-medium text-green-700 dark:text-green-300">
                                                    Propuesta
                                                </span>
                                            </div>
                                            {lead.proposal_views > 0 && (
                                                <div className="flex items-center space-x-1 text-[10px] text-gray-500">
                                                    <Eye className="w-3 h-3" />
                                                    <span>{lead.proposal_views}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Footer Stats */}
                                    <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-gray-700/50">
                                        <div className="flex items-center space-x-2">
                                            {lead.email && (
                                                <div className="text-gray-400" title={lead.email}>
                                                    <Mail className="w-3 h-3" />
                                                </div>
                                            )}
                                            {lead.phone && (
                                                <div className="text-gray-400" title={lead.phone}>
                                                    <Phone className="w-3 h-3" />
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="text-[10px] text-gray-400">
                                                {new Date(lead.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit' })}
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteLead(e, lead.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-all rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                                                title="Eliminar Lead"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {statusLeads.length === 0 && (
                                <div className="text-center py-8 opacity-40">
                                    <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                        {getIconComponent(status.icon)}
                                    </div>
                                    <p className="text-xs text-gray-500">Vacío</p>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            <ConfirmModal
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false, leadToDelete: null })}
                onConfirm={confirmDelete}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type="danger"
            />
        </div>
    );
};

export default LeadsKanbanView;
