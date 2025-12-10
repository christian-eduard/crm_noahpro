import React, { useState, useEffect } from 'react';
import {
    FileText, Eye, Mail, Calendar, Filter, Download, Search,
    CheckCircle, XCircle, Clock, AlertCircle, ArrowUpRight,
    TrendingUp, Send
} from 'lucide-react';

const ProposalsView = () => {
    const [proposals, setProposals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [leadsWithoutProposals, setLeadsWithoutProposals] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [proposalForm, setProposalForm] = useState({ title: '', price: '', description: '' });
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchProposals();
    }, []);

    const fetchProposals = async () => {
        try {
            const response = await fetch('http://localhost:3002/api/proposals', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setProposals(data);
            }
        } catch (error) {
            console.error('Error fetching proposals:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLeadsWithoutProposals = async () => {
        try {
            const [leadsRes, proposalsRes] = await Promise.all([
                fetch('http://localhost:3002/api/leads', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('crm_token')}` }
                }),
                fetch('http://localhost:3002/api/proposals', {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('crm_token')}` }
                })
            ]);

            if (leadsRes.ok && proposalsRes.ok) {
                const leads = await leadsRes.json();
                const proposals = await proposalsRes.json();

                // Get lead IDs that already have proposals
                const leadIdsWithProposals = proposals.map(p => p.lead_id);

                // Filter leads without proposals
                const leadsWithout = leads.filter(lead => !leadIdsWithProposals.includes(lead.id));
                setLeadsWithoutProposals(leadsWithout);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        }
    };

    const handleOpenCreateModal = () => {
        fetchLeadsWithoutProposals();
        setShowCreateModal(true);
    };

    const handleCreateProposal = async (e) => {
        e.preventDefault();
        if (!selectedLead) return;

        setCreating(true);
        try {
            const response = await fetch('http://localhost:3002/api/proposals', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                },
                body: JSON.stringify({
                    leadId: selectedLead.id,
                    title: proposalForm.title,
                    description: proposalForm.description,
                    totalPrice: parseFloat(proposalForm.price)
                })
            });

            if (!response.ok) throw new Error('Error al crear propuesta');

            alert('Propuesta creada y enviada exitosamente');
            setShowCreateModal(false);
            setSelectedLead(null);
            setProposalForm({ title: '', price: '', description: '' });
            fetchProposals(); // Refresh proposals list
        } catch (error) {
            console.error('Error:', error);
            alert('Error al crear propuesta');
        } finally {
            setCreating(false);
        }
    };

    const handleResendEmail = async (proposalId) => {
        try {
            const response = await fetch(`http://localhost:3002/api/proposals/${proposalId}/resend-email`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                }
            });

            if (!response.ok) throw new Error('Error al reenviar email');

            alert('Email reenviado exitosamente');
        } catch (error) {
            console.error('Error:', error);
            alert('Error al reenviar el email');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800',
            accepted: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800',
            rejected: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
            expired: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
        };
        return badges[status] || badges.pending;
    };

    const getStatusLabel = (status) => {
        const labels = {
            pending: 'Pendiente',
            accepted: 'Aceptada',
            rejected: 'Rechazada',
            expired: 'Expirada'
        };
        return labels[status] || status;
    };

    const getStatusIcon = (status) => {
        const icons = {
            pending: <Clock className="w-3 h-3" />,
            accepted: <CheckCircle className="w-3 h-3" />,
            rejected: <XCircle className="w-3 h-3" />,
            expired: <AlertCircle className="w-3 h-3" />
        };
        return icons[status] || <Clock className="w-3 h-3" />;
    };

    const filteredProposals = proposals
        .filter(p => filterStatus === 'all' || p.status === filterStatus)
        .filter(p =>
            searchTerm === '' ||
            p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            p.lead_name?.toLowerCase().includes(searchTerm.toLowerCase())
        );

    const stats = {
        total: proposals.length,
        pending: proposals.filter(p => p.status === 'pending').length,
        accepted: proposals.filter(p => p.status === 'accepted').length,
        rejected: proposals.filter(p => p.status === 'rejected').length,
        totalViews: proposals.reduce((sum, p) => sum + (p.views || 0), 0)
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                            <FileText className="w-5 h-5" />
                        </span>
                        Propuestas
                    </h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-11">
                        Gestiona todas tus propuestas comerciales
                    </p>
                </div>
                <button
                    onClick={handleOpenCreateModal}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2"
                >
                    <FileText className="w-4 h-4" />
                    <span>Nueva Propuesta</span>
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stats.total}</p>
                        </div>
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pendientes</p>
                            <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{stats.pending}</p>
                        </div>
                        <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aceptadas</p>
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.accepted}</p>
                        </div>
                        <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Rechazadas</p>
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.rejected}</p>
                        </div>
                        <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                            <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vistas Totales</p>
                            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">{stats.totalViews}</p>
                        </div>
                        <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                            <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="flex flex-col md:flex-row gap-4">
                    {/* Search */}
                    <div className="flex-1">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por título o lead..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Status Filter */}
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="pl-10 pr-8 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent appearance-none cursor-pointer"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="pending">Pendientes</option>
                            <option value="accepted">Aceptadas</option>
                            <option value="rejected">Rechazadas</option>
                            <option value="expired">Expiradas</option>
                        </select>
                    </div>

                    {/* Export Button */}
                    <button className="px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center space-x-2 font-medium text-sm">
                        <Download className="w-4 h-4" />
                        <span>Exportar</span>
                    </button>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Lead</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Título</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Estado</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Creada</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Enviada</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Engagement</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                            {filteredProposals.map((proposal) => (
                                <tr key={proposal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{proposal.lead_name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{proposal.lead_email}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-2">
                                            <FileText className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm text-gray-900 dark:text-white font-medium">{proposal.title}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadge(proposal.status)}`}>
                                            {getStatusIcon(proposal.status)}
                                            <span>{getStatusLabel(proposal.status)}</span>
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {new Date(proposal.created_at).toLocaleDateString('es-ES')}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                                        {proposal.sent_at ? (
                                            <div className="flex items-center space-x-1.5">
                                                <Send className="w-3 h-3 text-gray-400" />
                                                <span>{new Date(proposal.sent_at).toLocaleDateString('es-ES')}</span>
                                            </div>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-1.5" title="Vistas">
                                                <Eye className={`w-4 h-4 ${proposal.views > 0 ? 'text-purple-500' : 'text-gray-300'}`} />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{proposal.views || 0}</span>
                                            </div>
                                            <div className="flex items-center space-x-1.5" title="Email Abierto">
                                                <Mail className={`w-4 h-4 ${proposal.email_opened ? 'text-green-500' : 'text-gray-300'}`} />
                                                <span className="text-xs text-gray-500">{proposal.last_email_open || '-'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleResendEmail(proposal.id)}
                                                className="p-1.5 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Reenviar Email"
                                            >
                                                <Mail className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 text-gray-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors" title="Ver Detalles">
                                                <ArrowUpRight className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Analytics">
                                                <TrendingUp className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredProposals.length === 0 && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No se encontraron propuestas</h3>
                        <p className="text-gray-500 dark:text-gray-400">Prueba ajustando los filtros o crea una nueva propuesta.</p>
                    </div>
                )}
            </div>

            {/* Create Proposal Modal */}
            {
                showCreateModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Crear Nueva Propuesta</h3>
                                <button
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setSelectedLead(null);
                                        setProposalForm({ title: '', price: '', description: '' });
                                    }}
                                    className="text-gray-400 hover:text-gray-600"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateProposal} className="space-y-6">
                                {/* Lead Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Seleccionar Lead
                                    </label>
                                    {leadsWithoutProposals.length === 0 ? (
                                        <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                                            <p className="text-sm text-orange-800 dark:text-orange-200">
                                                ⚠️ Todos los leads ya tienen propuestas asignadas. Crea un nuevo lead desde el Pipeline de Ventas para poder crear más propuestas.
                                            </p>
                                        </div>
                                    ) : (
                                        <select
                                            value={selectedLead?.id || ''}
                                            onChange={(e) => {
                                                const lead = leadsWithoutProposals.find(l => l.id === parseInt(e.target.value));
                                                setSelectedLead(lead);
                                            }}
                                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                            required
                                        >
                                            <option value="">-- Selecciona un lead --</option>
                                            {leadsWithoutProposals.map(lead => (
                                                <option key={lead.id} value={lead.id}>
                                                    {lead.name} - {lead.business_name || 'Sin empresa'} ({lead.email})
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>

                                {selectedLead && (
                                    <>
                                        {/* Proposal Title */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Título de la Propuesta
                                            </label>
                                            <input
                                                type="text"
                                                value={proposalForm.title}
                                                onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                                placeholder="Ej: Propuesta Instalación Solar"
                                                required
                                            />
                                        </div>

                                        {/* Price */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Precio Total (€)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={proposalForm.price}
                                                onChange={(e) => setProposalForm({ ...proposalForm, price: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                                placeholder="0.00"
                                                required
                                            />
                                        </div>

                                        {/* Description */}
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Descripción
                                            </label>
                                            <textarea
                                                value={proposalForm.description}
                                                onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })}
                                                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                                rows="4"
                                                placeholder="Describe los detalles de la propuesta..."
                                            />
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex gap-3 pt-4">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowCreateModal(false);
                                                    setSelectedLead(null);
                                                    setProposalForm({ title: '', price: '', description: '' });
                                                }}
                                                className="flex-1 px-4 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={creating}
                                                className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-orange-500/50 transition-all disabled:opacity-50"
                                            >
                                                {creating ? 'Creando...' : 'Crear Propuesta'}
                                            </button>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default ProposalsView;
