import { API_URL, SOCKET_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { Users, Target, Zap, CheckCircle, Mail, Phone, Building2, X, Plus, RefreshCw, MessageSquare, Trash2, LayoutGrid, List, Calendar, Download, BarChart3 } from 'lucide-react';
import Button from '../shared/Button';
import ConfirmModal from '../shared/ConfirmModal';
import AnalyticsDashboard from '../analytics/AnalyticsDashboard';
import SettingsPanel from '../settings/SettingsPanel';
import ChatAdmin from './chat/ChatAdmin';
import DashboardHome from '../dashboard/DashboardHome';
import DashboardCalendar from '../calendar/DashboardCalendar';
import ProposalsView from '../proposals/ProposalsView';
import EmailTemplatesView from '../email/EmailTemplatesView';
import LeadsListView from '../leads/LeadsListView';
import LeadsKanbanView from '../leads/LeadsKanbanView';
import LeadsCalendarView from '../leads/LeadsCalendarView';
import LeadInvoices from '../leads/LeadInvoices';
import ClientsListView from '../clients/ClientsListView';
import ClientDetailView from '../clients/ClientDetailView';
import InvoicesView from '../invoices/InvoicesView';
import CommercialsManager from './CommercialsManager';
import BulkActionsBar from '../shared/BulkActionsBar';
import LeadHunterDashboard from '../hunter/LeadHunterDashboard';

const LeadsDashboard = ({ activeSection }) => {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('kanban'); // 'list' or 'kanban'
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedClientId, setSelectedClientId] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTags, setFilterTags] = useState([]);
    const [error, setError] = useState('');
    const [draggedLead, setDraggedLead] = useState(null);
    const [leadStats, setLeadStats] = useState(null);

    // Modals
    const [showProposalModal, setShowProposalModal] = useState(false);
    const [showProposalConfirmation, setShowProposalConfirmation] = useState(false);
    const [pendingProposal, setPendingProposal] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [showLeadModal, setShowLeadModal] = useState(false);
    const [showCalendarView, setShowCalendarView] = useState(false);

    // Bulk selection state
    const [selectedLeads, setSelectedLeads] = useState([]);

    const [templates, setTemplates] = useState([]);
    const [statuses, setStatuses] = useState([]);

    const toast = useToast();

    useEffect(() => {
        fetchStatuses();
    }, []);

    const fetchStatuses = async () => {
        try {
            // In a real app, this would be an API call
            // For now, we simulate the default statuses if API fails or returns empty
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
        }
    };

    useEffect(() => {
        if (showProposalModal) {
            fetch(`${API_URL}/proposal-templates`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('crm_token')}` }
            })
                .then(res => res.json())
                .then(data => setTemplates(data))
                .catch(err => console.error('Error loading templates:', err));
        }
    }, [showProposalModal]);

    // Forms
    const [proposalForm, setProposalForm] = useState({ title: '', price: '', description: '' });
    const [leadForm, setLeadForm] = useState({ name: '', email: '', phone: '', businessName: '', message: '' });

    // Details
    const [activeProposal, setActiveProposal] = useState(null);
    const [comments, setComments] = useState([]);
    const [newAdminComment, setNewAdminComment] = useState('');
    const [activities, setActivities] = useState([]);

    // Keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (e) => {
            // Ctrl/Cmd + K para búsqueda rápida
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                document.querySelector('input[placeholder*="Buscar"]')?.focus();
            }
            // Ctrl/Cmd + N para nuevo lead
            if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
                e.preventDefault();
                setShowLeadModal(true);
            }
            // ESC para cerrar modales
            if (e.key === 'Escape') {
                setSelectedLead(null);
                setShowLeadModal(false);
                setShowProposalModal(false);
            }
        };

        window.addEventListener('keydown', handleKeyPress);

        // Listener para acciones rápidas desde el layout
        const handleQuickAction = (e) => {
            const { action } = e.detail;
            if (action === 'new_lead') {
                setShowLeadModal(true);
            } else if (action === 'new_meeting') {
                // TODO: Implementar modal de meeting
                toast.info('Próximamente: Crear reunión');
            }
        };
        window.addEventListener('crm_quick_action', handleQuickAction);

        return () => {
            window.removeEventListener('keydown', handleKeyPress);
            window.removeEventListener('crm_quick_action', handleQuickAction);
        };
    }, []);

    useEffect(() => {
        if (activeSection === 'leads') {
            fetchLeads();
            fetchLeadStats();
        }
    }, [activeSection]);

    const fetchLeadStats = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/leads/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setLeadStats(data);
            }
        } catch (error) {
            console.error('Error fetching lead stats:', error);
        }
    };

    const fetchLeads = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/leads`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Error al cargar leads');
            const data = await response.json();
            setLeads(data);
        } catch (err) {
            setError('No se pudo conectar con el servidor de leads');
            console.error(err);
            toast.error('No se pudo conectar con el servidor de leads');
        } finally {
            setLoading(false);
        }
    };

    const fetchProposalAndComments = async (leadId) => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/proposals/lead/${leadId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const proposals = await response.json();
                if (proposals.length > 0) {
                    const latestProposal = proposals[0];
                    setActiveProposal(latestProposal);

                    const commentsResponse = await fetch(`${API_URL}/proposals/${latestProposal.id}/comments`, {
                        headers: { 'Authorization': `Bearer ${localStorage.getItem('crm_token')}` }
                    });
                    if (commentsResponse.ok) {
                        setComments(await commentsResponse.json());
                    }
                } else {
                    setActiveProposal(null);
                    setComments([]);
                }
            }
        } catch (err) {
            console.error('Error fetching proposal details:', err);
            toast.error('Error al cargar detalles de la propuesta');
        }
    };

    useEffect(() => {
        if (selectedLead) {
            fetchProposalAndComments(selectedLead.id);
            // Simular actividades (en producción, esto vendría del backend)
            setActivities([
                { id: 1, type: 'created', description: 'Lead creado', date: selectedLead.created_at, icon: 'plus' },
                { id: 2, type: 'status', description: `Estado cambiado a ${getStatusLabel(selectedLead.status)}`, date: selectedLead.created_at, icon: 'refresh' }
            ]);
        } else {
            setActiveProposal(null);
            setComments([]);
            setActivities([]);
        }
    }, [selectedLead]);

    const sendAdminComment = async (e) => {
        e.preventDefault();
        if (!newAdminComment.trim() || !activeProposal) return;

        try {
            const response = await fetch(`${API_URL}/proposals/${activeProposal.id}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                },
                body: JSON.stringify({
                    author: 'Equipo NoahPro',
                    authorType: 'internal',
                    comment: newAdminComment
                })
            });

            if (response.ok) {
                setNewAdminComment('');
                const commentsResponse = await fetch(`${API_URL}/proposals/${activeProposal.id}/comments`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('crm_token')}` }
                });
                if (commentsResponse.ok) {
                    setComments(await commentsResponse.json());
                }
                toast.success('Comentario enviado correctamente');
            } else {
                throw new Error('Error al enviar comentario');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
            toast.error('Error al enviar comentario');
        }
    };

    const updateLeadStatus = async (id, newStatus) => {
        try {
            const response = await fetch(`${API_URL}/leads/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                },
                body: JSON.stringify({ status: newStatus })
            });

            if (!response.ok) throw new Error('Error al actualizar estado');

            setLeads(leads.map(lead =>
                lead.id === id ? { ...lead, status: newStatus } : lead
            ));

            if (selectedLead && selectedLead.id === id) {
                setSelectedLead({ ...selectedLead, status: newStatus });
            }
            toast.success('Estado del lead actualizado correctamente');
        } catch (error) {
            console.error('Error updating status:', error);
            toast.error('Error al actualizar el estado');
        }
    };

    // Drag and Drop handlers
    const handleDragStart = (e, lead) => {
        setDraggedLead(lead);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e, newStatus) => {
        e.preventDefault();
        if (draggedLead && draggedLead.status !== newStatus) {
            updateLeadStatus(draggedLead.id, newStatus);
        }
        setDraggedLead(null);
    };

    const createLead = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                },
                body: JSON.stringify({
                    ...leadForm,
                    source: 'manual'
                })
            });

            if (response.ok) {
                toast.success('Lead creado correctamente');
                setShowLeadModal(false);
                setLeadForm({ name: '', email: '', phone: '', businessName: '', message: '' });
                fetchLeads();
            } else {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Error al crear lead');
            }
        } catch (err) {
            toast.error(err.message);
            console.error(err);
        }
    };

    const createProposal = async (e) => {
        e.preventDefault();
        if (!selectedLead) return;

        // Guardar datos para confirmación
        setPendingProposal({
            leadId: selectedLead.id,
            title: proposalForm.title,
            description: proposalForm.description,
            totalPrice: parseFloat(proposalForm.price)
        });
        setShowProposalModal(false);
        setShowProposalConfirmation(true);
    };

    const confirmAndSendProposal = async () => {
        if (!pendingProposal) return;

        try {
            const response = await fetch(`${API_URL}/proposals`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                },
                body: JSON.stringify(pendingProposal)
            });

            if (!response.ok) throw new Error('Error al crear propuesta');

            toast.success('Propuesta creada y enviada al lead');
            setShowProposalConfirmation(false);
            setPendingProposal(null);
            setProposalForm({ title: '', price: '', description: '' });
            updateLeadStatus(selectedLead.id, 'proposal_sent');
            fetchProposalAndComments(selectedLead.id);

        } catch (err) {
            toast.error('Error al crear la propuesta');
            console.error(err);
        }
    };

    const deleteProposal = async () => {
        if (!activeProposal) return;

        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Propuesta',
            message: '¿Estás seguro de eliminar esta propuesta? Esta acción no se puede deshacer.',
            onConfirm: async () => {
                try {
                    const response = await fetch(`${API_URL}/proposals/${activeProposal.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                        }
                    });

                    if (!response.ok) throw new Error('Error al eliminar propuesta');

                    toast.success('Propuesta eliminada correctamente');
                    setActiveProposal(null);
                    setComments([]);
                    fetchProposalAndComments(selectedLead.id);

                } catch (err) {
                    toast.error('Error al eliminar la propuesta');
                    console.error(err);
                }
            }
        });
    };

    const handleDeleteLead = (leadId) => {
        // Remove the lead from the local state
        setLeads(prevLeads => prevLeads.filter(lead => lead.id !== leadId));
        // Also remove from selection if selected
        setSelectedLeads(prev => prev.filter(id => id !== leadId));
        // Refresh leads from server to ensure consistency
        fetchLeads();
    };

    // Toggle lead selection for bulk actions
    const toggleSelectLead = (leadId) => {
        setSelectedLeads(prev =>
            prev.includes(leadId)
                ? prev.filter(id => id !== leadId)
                : [...prev, leadId]
        );
    };

    // Clear all selections
    const clearSelection = () => {
        setSelectedLeads([]);
    };

    // Handle bulk actions
    const handleBulkAction = async (actionType, value) => {
        const token = localStorage.getItem('crm_token');
        try {
            const response = await fetch(`${API_URL}/leads/bulk/${actionType}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ leadIds: selectedLeads, value })
            });

            if (response.ok) {
                toast.success(`Acción aplicada a ${selectedLeads.length} leads`);
                clearSelection();
                fetchLeads();
            } else {
                throw new Error('Error en acción masiva');
            }
        } catch (error) {
            console.error('Bulk action error:', error);
            toast.error('Error al realizar la acción');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            new: 'bg-blue-500',
            contacted: 'bg-yellow-500',
            qualified: 'bg-purple-500',
            proposal_sent: 'bg-orange-500',
            won: 'bg-green-500',
            lost: 'bg-red-500'
        };
        return colors[status] || 'bg-gray-500';
    };

    const getStatusLabel = (status) => {
        const labels = {
            new: 'Nuevo',
            contacted: 'Contactado',
            qualified: 'Cualificado',
            proposal_sent: 'Propuesta Enviada',
            won: 'Ganado',
            lost: 'Perdido'
        };
        return labels[status] || status;
    };

    // Advanced filtering
    const filteredLeads = leads.filter(lead => {
        // Filter by status
        if (filterStatus !== 'all' && lead.status !== filterStatus) return false;

        // Filter by search term
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                lead.name.toLowerCase().includes(searchLower) ||
                (lead.email && lead.email.toLowerCase().includes(searchLower)) ||
                (lead.business_name && lead.business_name.toLowerCase().includes(searchLower));
            if (!matchesSearch) return false;
        }

        // Filter by tags
        if (filterTags.length > 0) {
            // En producción, esto se basaría en tags reales del lead
            return true;
        }

        return true;
    });

    // Group leads by status for Kanban view
    const leadsByStatus = {
        new: filteredLeads.filter(l => l.status === 'new'),
        contacted: filteredLeads.filter(l => l.status === 'contacted'),
        qualified: filteredLeads.filter(l => l.status === 'qualified'),
        proposal_sent: filteredLeads.filter(l => l.status === 'proposal_sent'),
        won: filteredLeads.filter(l => l.status === 'won'),
        lost: filteredLeads.filter(l => l.status === 'lost')
    };

    // Stats cards with progress bars
    const totalLeads = leads.length;
    const stats = [
        {
            label: 'Total Leads',
            value: totalLeads,
            icon: <Users className="w-6 h-6" />,
            progress: 100,
            subtitle: leadStats ? `${leadStats.last_30_days} últimos 30 días` : ''
        },
        {
            label: 'Nuevos',
            value: leadsByStatus.new.length,
            icon: <Target className="w-6 h-6" />,
            progress: totalLeads ? (leadsByStatus.new.length / totalLeads) * 100 : 0,
            subtitle: leadStats ? `${leadStats.new || 0} en total` : ''
        },
        {
            label: 'En Proceso',
            value: leadsByStatus.contacted.length + leadsByStatus.qualified.length,
            icon: <Zap className="w-6 h-6" />,
            progress: totalLeads ? ((leadsByStatus.contacted.length + leadsByStatus.qualified.length) / totalLeads) * 100 : 0,
            subtitle: leadStats ? `${(leadStats.contacted || 0) + (leadStats.qualified || 0)} en total` : ''
        },
        {
            label: 'Ganados',
            value: leadsByStatus.won.length,
            icon: <CheckCircle className="w-6 h-6" />,
            progress: totalLeads ? (leadsByStatus.won.length / totalLeads) * 100 : 0,
            subtitle: leadStats ? `${leadStats.won || 0} en total` : ''
        }
    ];

    if (activeSection === 'home') {
        return <DashboardHome />;
    }

    if (activeSection === 'chat') {
        return <ChatAdmin />;
    }

    if (activeSection === 'analytics') {
        return <AnalyticsDashboard />;
    }

    if (activeSection === 'proposals') {
        return <ProposalsView />;
    }

    if (activeSection === 'invoices') {
        return <InvoicesView />;
    }

    if (activeSection === 'email_templates') {
        return <EmailTemplatesView />;
    }

    if (activeSection === 'settings') {
        return <SettingsPanel />;
    }

    if (activeSection === 'commercials') {
        return <CommercialsManager />;
    }

    if (activeSection === 'clients') {
        if (selectedClientId) {
            return <ClientDetailView clientId={selectedClientId} onBack={() => setSelectedClientId(null)} />;
        }
        return <ClientsListView onClientSelect={setSelectedClientId} />;
    }

    if (activeSection === 'hunter') {
        return <LeadHunterDashboard />;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                            <BarChart3 className="w-5 h-5" />
                        </span>
                        Pipeline de Ventas
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
                        Gestiona tus leads y oportunidades
                    </p>
                </div>
            </div>

            {/* Stats Cards with Progress Bars */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                    <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{stat.label}</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                            </div>
                            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-orange-600 dark:text-orange-400 text-xl">
                                {stat.icon}
                            </div>
                        </div>
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 mt-4">
                            <div
                                className="h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-500"
                                style={{ width: `${stat.progress}%` }}
                            />
                        </div>
                        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                            {stat.subtitle}
                        </div>
                    </div>
                ))}
            </div>

            {/* Advanced Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="🔍 Buscar por nombre, email o empresa... (⌘K)"
                                className="w-full pl-4 pr-10 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-orange-500 dark:text-white"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    ✕
                                </button>
                            )}
                        </div>
                    </div>

                    {/* View Mode */}
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={() => {
                                setViewMode('kanban');
                                setShowCalendarView(false);
                            }}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'kanban' && !showCalendarView
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4 inline mr-1.5" />
                            Kanban
                        </button>
                        <button
                            onClick={() => {
                                setViewMode('list');
                                setShowCalendarView(false);
                            }}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${viewMode === 'list' && !showCalendarView
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <List className="w-4 h-4 inline mr-1.5" />
                            Lista
                        </button>
                        <button
                            onClick={() => setShowCalendarView(true)}
                            className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${showCalendarView
                                ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <Calendar className="w-4 h-4 inline mr-1.5" />
                            Calendar
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="secondary"
                            onClick={() => {
                                const url = `${API_URL}/export/leads/excel?status=${filterStatus}&search=${searchTerm}`;
                                window.open(url, '_blank');
                            }}
                            size="sm"
                        >
                            <Download className="w-4 h-4 inline mr-1.5" />
                            Exportar
                        </Button>
                        <Button variant="primary" onClick={() => setShowLeadModal(true)} size="sm">
                            + Nuevo Lead
                        </Button>
                    </div>
                </div>

                {/* Filter Tags */}
                {searchTerm && (
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center space-x-2 px-3 py-1.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full text-sm">
                            <span>Búsqueda: "{searchTerm}"</span>
                            <button onClick={() => setSearchTerm('')} className="hover:text-blue-900">✕</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Kanban View with Drag & Drop */}
            {viewMode === 'kanban' && !showCalendarView && (
                <LeadsKanbanView
                    leads={filteredLeads}
                    onLeadClick={setSelectedLead}
                    onStatusChange={updateLeadStatus}
                    statuses={statuses}
                    onDeleteLead={handleDeleteLead}
                    selectedLeads={selectedLeads}
                    onToggleSelect={toggleSelectLead}
                />
            )}

            {/* List View */}
            {viewMode === 'list' && !showCalendarView && (
                <LeadsListView
                    leads={filteredLeads}
                    onLeadClick={setSelectedLead}
                    onStatusChange={updateLeadStatus}
                    onDeleteLead={handleDeleteLead}
                    selectedLeads={selectedLeads}
                    onToggleSelect={toggleSelectLead}
                />
            )}

            {/* Calendar View */}
            {showCalendarView && (
                <LeadsCalendarView
                    leads={filteredLeads}
                    onLeadClick={setSelectedLead}
                    statuses={statuses}
                />
            )}

            {/* Lead Detail Modal with Timeline */}
            {selectedLead && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-orange-500 to-red-600 p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-white mb-3">{selectedLead.name}</h2>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
                                            <Mail className="w-4 h-4 text-white" />
                                            <span className="text-white text-sm">{selectedLead.email}</span>
                                        </div>
                                        {selectedLead.phone && (
                                            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
                                                <Phone className="w-4 h-4 text-white" />
                                                <span className="text-white text-sm">{selectedLead.phone}</span>
                                            </div>
                                        )}
                                        {selectedLead.business_name && (
                                            <div className="bg-white/10 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2">
                                                <Building2 className="w-4 h-4 text-white" />
                                                <span className="text-white text-sm">{selectedLead.business_name}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setSelectedLead(null)}
                                    className="p-2 hover:bg-white/20 rounded-lg transition-colors ml-4"
                                >
                                    <X className="w-6 h-6 text-white" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            <div className="grid grid-cols-3 gap-6">
                                {/* Main Content - 2 columns */}
                                <div className="col-span-2 space-y-6">
                                    {/* Description Card */}
                                    {selectedLead.message && (
                                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                                            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Descripción</h4>
                                            <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed whitespace-pre-wrap">
                                                {selectedLead.message}
                                            </p>
                                        </div>
                                    )}

                                    {/* Proposal Card */}
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                                        <div className="flex justify-between items-center mb-4">
                                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">Propuesta Comercial</h3>
                                            {!activeProposal && (
                                                <Button size="sm" onClick={() => setShowProposalModal(true)}>
                                                    + Nueva Propuesta
                                                </Button>
                                            )}
                                        </div>

                                        {activeProposal ? (
                                            <div>
                                                <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white text-lg">{activeProposal.title}</h4>
                                                        <p className="text-3xl font-bold text-orange-600 mt-2">
                                                            {parseFloat(activeProposal.total_price).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <a
                                                            href={`/proposal/${activeProposal.token}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors text-sm font-medium"
                                                        >
                                                            Ver Pública ↗
                                                        </a>
                                                        <button
                                                            onClick={deleteProposal}
                                                            className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                                            title="Eliminar propuesta"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-gray-50 dark:bg-gray-900/50 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
                                                <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                                                    <svg className="w-8 h-8 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400 mb-4 font-medium">No hay propuesta para este lead</p>
                                                <Button size="sm" onClick={() => setShowProposalModal(true)}>
                                                    + Crear Propuesta
                                                </Button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Invoices Card */}
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Facturas</h3>
                                        <LeadInvoices leadId={selectedLead.id} leadName={selectedLead.name} />
                                    </div>
                                </div>

                                {/* Sidebar - Estado + Activity + Comments */}
                                <div className="col-span-1 space-y-6">
                                    {/* Status Card */}
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Estado del Lead</label>
                                        <select
                                            value={selectedLead.status}
                                            onChange={(e) => updateLeadStatus(selectedLead.id, e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                        >
                                            <option value="new">Nuevo</option>
                                            <option value="contacted">Contactado</option>
                                            <option value="qualified">Cualificado</option>
                                            <option value="proposal_sent">Propuesta Enviada</option>
                                            <option value="won">Ganado</option>
                                            <option value="lost">Perdido</option>
                                        </select>
                                    </div>

                                    {/* Activity Timeline Card */}
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Actividad Reciente</h3>
                                        <div className="space-y-4">
                                            {activities.map((activity, index) => (
                                                <div key={activity.id} className="relative">
                                                    {index !== activities.length - 1 && (
                                                        <div className="absolute left-4 top-10 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
                                                    )}
                                                    <div className="flex items-start gap-3">
                                                        <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0 relative z-10">
                                                            {activity.icon === 'plus' && <Plus className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
                                                            {activity.icon === 'refresh' && <RefreshCw className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
                                                            {activity.icon === 'message' && <MessageSquare className="w-4 h-4 text-orange-600 dark:text-orange-400" />}
                                                        </div>
                                                        <div className="flex-1 pt-1">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">
                                                                {activity.description}
                                                            </p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {new Date(activity.date).toLocaleDateString('es-ES', {
                                                                    day: 'numeric',
                                                                    month: 'short',
                                                                    hour: '2-digit',
                                                                    minute: '2-digit'
                                                                })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Comments Card */}
                                    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 shadow-sm">
                                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Comentarios</h3>
                                        <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
                                            {comments.length === 0 ? (
                                                <p className="text-sm text-gray-500 dark:text-gray-400 italic text-center py-4">No hay comentarios</p>
                                            ) : (
                                                comments.map(comment => (
                                                    <div key={comment.id} className={`flex ${comment.author_type === 'internal' ? 'justify-end' : 'justify-start'}`}>
                                                        <div className={`max-w-[90%] rounded-lg p-3 ${comment.author_type === 'internal'
                                                            ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-900 dark:text-orange-100'
                                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                                                            }`}>
                                                            <div className="text-xs font-medium opacity-75 mb-1">{comment.author}</div>
                                                            <div className="text-sm">{comment.comment}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                        <form onSubmit={sendAdminComment} className="flex gap-2">
                                            <input
                                                type="text"
                                                value={newAdminComment}
                                                onChange={(e) => setNewAdminComment(e.target.value)}
                                                placeholder="Escribir comentario..."
                                                className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                                            />
                                            <Button type="submit" size="sm" disabled={!newAdminComment.trim()}>
                                                Enviar
                                            </Button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de Nuevo Lead */}
            {showLeadModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nuevo Lead Manual</h3>
                        <form onSubmit={createLead} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    value={leadForm.name}
                                    onChange={e => setLeadForm({ ...leadForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    value={leadForm.email}
                                    onChange={e => setLeadForm({ ...leadForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teléfono</label>
                                <input
                                    type="tel"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    value={leadForm.phone}
                                    onChange={e => setLeadForm({ ...leadForm, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Negocio</label>
                                <input
                                    type="text"
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    value={leadForm.businessName}
                                    onChange={e => setLeadForm({ ...leadForm, businessName: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas Iniciales</label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    rows="3"
                                    value={leadForm.message}
                                    onChange={e => setLeadForm({ ...leadForm, message: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <Button type="button" variant="secondary" onClick={() => setShowLeadModal(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    Crear Lead
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal de Propuesta */}
            {showProposalModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Nueva Propuesta</h3>

                        {/* Template Selector */}
                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cargar Plantilla</label>
                            <select
                                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                onChange={(e) => {
                                    const tId = e.target.value;
                                    if (!tId) return;
                                    const template = templates.find(t => t.id === parseInt(tId));
                                    if (template) {
                                        setProposalForm({
                                            title: template.content_json.title,
                                            price: template.content_json.totalPrice,
                                            description: template.content_json.description || template.description
                                        });
                                    }
                                }}
                            >
                                <option value="">-- Seleccionar Plantilla --</option>
                                {templates.map(t => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <form onSubmit={createProposal} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    value={proposalForm.title}
                                    onChange={e => setProposalForm({ ...proposalForm, title: e.target.value })}
                                    placeholder="Ej: Propuesta TPV Completo"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio Total (€)</label>
                                <input
                                    type="number"
                                    required
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    value={proposalForm.price}
                                    onChange={e => setProposalForm({ ...proposalForm, price: e.target.value })}
                                    placeholder="0.00"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                                <textarea
                                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                    rows="3"
                                    value={proposalForm.description}
                                    onChange={e => setProposalForm({ ...proposalForm, description: e.target.value })}
                                    placeholder="Detalles de la propuesta..."
                                ></textarea>
                            </div>
                            <div className="flex justify-end space-x-3 mt-6">
                                <Button type="button" variant="secondary" onClick={() => setShowProposalModal(false)}>
                                    Cancelar
                                </Button>
                                <Button type="submit">
                                    Crear Propuesta
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Proposal Confirmation Modal */}
            {showProposalConfirmation && pendingProposal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Confirmar y Enviar Propuesta</h3>

                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 mb-6 border border-orange-200 dark:border-orange-800">
                            <p className="text-sm text-orange-800 dark:text-orange-200 mb-2">
                                Esta propuesta se enviará al lead: <strong>{selectedLead?.name}</strong>
                            </p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Título</label>
                                <p className="text-gray-900 dark:text-white font-semibold mt-1">{pendingProposal.title}</p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Precio Total</label>
                                <p className="text-2xl font-bold text-orange-600 mt-1">
                                    {pendingProposal.totalPrice.toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })}
                                </p>
                            </div>

                            <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Descripción</label>
                                <p className="text-gray-900 dark:text-white mt-1 whitespace-pre-wrap text-sm">
                                    {pendingProposal.description || 'Sin descripción'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    setShowProposalConfirmation(false);
                                    setPendingProposal(null);
                                    setShowProposalModal(true);
                                }}
                                className="flex-1"
                            >
                                Editar
                            </Button>
                            <Button
                                onClick={confirmAndSendProposal}
                                className="flex-1"
                            >
                                Confirmar y Enviar
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Actions Bar */}
            <BulkActionsBar
                selectedCount={selectedLeads.length}
                onUpdateStatus={(status) => handleBulkAction('update-status', status)}
                onAddTag={() => toast.info('Función de tags masivos próximamente')}
                onDelete={() => handleBulkAction('delete')}
                onCancel={clearSelection}
            />

            {/* Confirm Dialog Modal */}
            <ConfirmModal
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
                type="danger"
            />
        </div>
    );
};

export default LeadsDashboard;
