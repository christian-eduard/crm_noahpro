import { API_URL, SOCKET_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import { User, TrendingUp, QrCode, BookOpen, HeadphonesIcon, Video, FileText, Link as LinkIcon, ExternalLink, MessageSquare, Plus, Clock, CheckCircle, AlertCircle, X } from 'lucide-react';
import LeadsListView from '../leads/LeadsListView';
import ClientsListView from '../clients/ClientsListView';
import ClientDetailView from '../clients/ClientDetailView';

const CommercialDashboard = ({ activeSection = 'home' }) => {
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        if (activeSection === 'training') setActiveTab('training');
        else if (activeSection === 'support') setActiveTab('support');
        else if (activeSection === 'leads') setActiveTab('leads');
        else if (activeSection === 'clients') setActiveTab('clients');
        else setActiveTab('dashboard');
    }, [activeSection]);
    const [stats, setStats] = useState({ leads: { total: 0, won: 0 }, commissions: { current_month: 0, total_earned: 0 }, profile: {}, recent_leads: [] });
    const [materials, setMaterials] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
    const [isTicketViewOpen, setIsTicketViewOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketMessages, setTicketMessages] = useState([]);
    const [newTicket, setNewTicket] = useState({ subject: '', message: '', priority: 'normal' });
    const [newReply, setNewReply] = useState('');
    const [user] = useState(JSON.parse(localStorage.getItem('user') || '{}'));
    const toast = useToast();

    // Estados para Leads y Clientes
    const [leads, setLeads] = useState([]);
    const [selectedLead, setSelectedLead] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null);

    useEffect(() => {
        if (activeTab === 'leads') fetchLeads();
    }, [activeTab]);

    const fetchLeads = async () => {
        try {
            const response = await fetch(`${API_URL}/leads`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setLeads(await response.json());
        } catch (error) { console.error('Error fetching leads:', error); }
    };

    const handleLeadStatusChange = (id, newStatus) => {
        setLeads(leads.map(l => l.id === id ? { ...l, status: newStatus } : l));
        fetchStats(); // Actualizar stats globales también
    };

    const handleDeleteLead = (id) => {
        setLeads(leads.filter(l => l.id !== id));
        fetchStats();
    };

    const API_URL = import.meta.env.VITE_API_URL || SOCKET_URL;
    const token = localStorage.getItem('crm_token');

    useEffect(() => {
        fetchStats();
        fetchMaterials();
        fetchTickets();
    }, []);

    const fetchStats = async () => {
        try {
            const response = await fetch(`${API_URL}/commercials/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setStats(await response.json());
        } catch (error) { console.error('Error:', error); }
    };

    const fetchMaterials = async () => {
        try {
            const response = await fetch(`${API_URL}/training/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setMaterials(await response.json());
        } catch (error) { console.error('Error:', error); }
    };

    const fetchTickets = async () => {
        try {
            const response = await fetch(`${API_URL}/support/my`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setTickets(await response.json());
        } catch (error) { console.error('Error:', error); }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_URL}/support`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newTicket)
            });
            if (!response.ok) throw new Error('Error al crear ticket');
            toast.success('Ticket creado. Te responderemos pronto.');
            setIsNewTicketOpen(false);
            setNewTicket({ subject: '', message: '', priority: 'normal' });
            fetchTickets();
        } catch (error) { toast.error(error.message); }
    };

    const handleViewTicket = async (ticket) => {
        try {
            const response = await fetch(`${API_URL}/support/${ticket.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedTicket(data);
                setTicketMessages(data.messages || []);
                setIsTicketViewOpen(true);
            }
        } catch (error) { toast.error('Error'); }
    };

    const handleReplyTicket = async () => {
        if (!newReply.trim()) return;
        try {
            await fetch(`${API_URL}/support/${selectedTicket.id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: newReply })
            });
            setNewReply('');
            handleViewTicket(selectedTicket);
        } catch (error) { toast.error('Error'); }
    };

    const openMaterial = (mat) => {
        if (mat.external_url) window.open(mat.external_url, '_blank');
        else if (mat.video_url) window.open(mat.video_url, '_blank');
        else if (mat.file_url) window.open(`${API_URL}${mat.file_url}`, '_blank');
    };

    const tabs = [
        { id: 'dashboard', label: 'Mi Panel', icon: User },
        { id: 'training', label: 'Formación', icon: BookOpen },
        { id: 'support', label: 'Soporte', icon: HeadphonesIcon }
    ];

    const typeIcons = { video: Video, document: FileText, tutorial: BookOpen, link: LinkIcon };
    const statusColors = {
        open: 'bg-yellow-100 text-yellow-800', in_progress: 'bg-blue-100 text-blue-800',
        resolved: 'bg-green-100 text-green-800', closed: 'bg-gray-100 text-gray-800'
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {activeTab === 'dashboard' ? `Hola, ${user.full_name || 'Comercial'}` :
                            activeTab === 'training' ? 'Formación' :
                                activeTab === 'support' ? 'Soporte' :
                                    activeTab === 'leads' ? 'Mis Leads' :
                                        activeTab === 'clients' ? 'Mis Clientes' : 'Dashboard'}
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Bienvenido a tu panel comercial</p>
                </div>
                {['dashboard', 'training', 'support'].includes(activeTab) && (
                    <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                        {tabs.map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                                    }`}>
                                <tab.icon className="w-4 h-4 mr-2" />
                                {tab.label}
                                {tab.id === 'support' && tickets.filter(t => t.unread_count > 0).length > 0 && (
                                    <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                        {tickets.filter(t => t.unread_count > 0).length}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* ==================== TAB DASHBOARD ==================== */}
            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Leads Asignados</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.leads?.total || 0}</h3>
                                </div>
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600">
                                    <User className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center text-sm">
                                <span className="text-green-600 font-medium flex items-center">
                                    <TrendingUp className="w-4 h-4 mr-1" />{stats.leads?.won || 0} convertidos
                                </span>
                            </div>
                        </div>

                        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Comisiones (Mes)</p>
                                    <h3 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.commissions?.current_month || 0} €</h3>
                                </div>
                                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg text-green-600">
                                    <TrendingUp className="w-6 h-6" />
                                </div>
                            </div>
                            <div className="mt-4 text-sm text-gray-500">
                                Total: <span className="font-medium text-gray-900 dark:text-white">{stats.commissions?.total_earned || 0} €</span>
                            </div>
                        </div>

                        {/* QR Card */}
                        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-xl shadow-lg text-white">
                            <h3 className="text-lg font-bold mb-2">Mi Código QR</h3>
                            <p className="text-indigo-100 text-sm mb-4">Los clientes que escaneen este código quedarán asignados a ti.</p>
                            {stats.profile?.qr_code_url && (
                                <div className="flex items-center gap-4">
                                    <div className="bg-white p-2 rounded-lg">
                                        <img src={stats.profile.qr_code_url} alt="QR" className="w-20 h-20" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-indigo-200">Tu código:</p>
                                        <p className="font-mono font-bold">{stats.profile?.commercial_code || 'N/A'}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Recent Leads */}
                    {stats.recent_leads?.length > 0 && (
                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-gray-900 dark:text-white">Leads Recientes</h3>
                            </div>
                            <div className="divide-y divide-gray-200 dark:divide-gray-700">
                                {stats.recent_leads.map(lead => (
                                    <div key={lead.id} className="px-6 py-4 flex justify-between items-center">
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{lead.name}</p>
                                            <p className="text-sm text-gray-500">{lead.email}</p>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${lead.status === 'won' ? 'bg-green-100 text-green-800' :
                                            lead.status === 'new' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>{lead.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ==================== TAB FORMACIÓN ==================== */}
            {activeTab === 'training' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {materials.map(mat => {
                        const TypeIcon = typeIcons[mat.type] || FileText;
                        return (
                            <div key={mat.id} onClick={() => openMaterial(mat)}
                                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow cursor-pointer">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                            <TypeIcon className="w-5 h-5 text-indigo-600" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="font-medium text-gray-900 dark:text-white">{mat.title}</h3>
                                            <span className="text-xs text-gray-500 capitalize">{mat.type}</span>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-gray-400" />
                                </div>
                                {mat.description && <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{mat.description}</p>}
                            </div>
                        );
                    })}
                    {materials.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay materiales de formación disponibles</p>
                        </div>
                    )}
                </div>
            )}

            {/* ==================== TAB SOPORTE ==================== */}
            {activeTab === 'support' && (
                <div className="space-y-4">
                    <div className="flex justify-end">
                        <Button onClick={() => setIsNewTicketOpen(true)}><Plus className="w-4 h-4 mr-2" />Nuevo Ticket</Button>
                    </div>
                    {tickets.map(ticket => (
                        <div key={ticket.id} onClick={() => handleViewTicket(ticket)}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[ticket.status]}`}>
                                            {ticket.status === 'open' ? 'Abierto' : ticket.status === 'in_progress' ? 'En progreso' : ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                                        </span>
                                        {ticket.unread_count > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{ticket.unread_count} nuevo</span>}
                                    </div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">{ticket.subject}</h3>
                                </div>
                                <span className="text-xs text-gray-400 flex items-center"><Clock className="w-3 h-3 mr-1" />{new Date(ticket.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {tickets.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No tienes tickets de soporte</p>
                            <p className="text-sm mt-1">¿Necesitas ayuda? Crea un nuevo ticket</p>
                        </div>
                    )}
                </div>
            )}

            {/* ==================== TAB LEADS ==================== */}
            {activeTab === 'leads' && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <LeadsListView
                        leads={leads}
                        onLeadClick={(lead) => setSelectedLead(lead)}
                        onStatusChange={handleLeadStatusChange}
                        onDeleteLead={handleDeleteLead}
                    />
                </div>
            )}

            {/* ==================== TAB CLIENTS ==================== */}
            {activeTab === 'clients' && !selectedClient && (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <ClientsListView onClientSelect={(id) => setSelectedClient(id)} />
                </div>
            )}
            {activeTab === 'clients' && selectedClient && (
                <ClientDetailView clientId={selectedClient} onBack={() => setSelectedClient(null)} />
            )}

            {/* Modal Detalle Lead (básico) */}
            {selectedLead && (
                <Modal isOpen={!!selectedLead} onClose={() => setSelectedLead(null)} title="Detalle del Lead">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{selectedLead.name}</h3>
                            <p className="text-sm text-gray-500">{selectedLead.business_name}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                <label className="text-xs text-gray-400 uppercase font-semibold">Email</label>
                                <p className="dark:text-white truncate" title={selectedLead.email}>{selectedLead.email}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                <label className="text-xs text-gray-400 uppercase font-semibold">Teléfono</label>
                                <p className="dark:text-white">{selectedLead.phone || '-'}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                <label className="text-xs text-gray-400 uppercase font-semibold">Estado</label>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs mt-1 ${selectedLead.status === 'won' ? 'bg-green-100 text-green-800' :
                                        selectedLead.status === 'new' ? 'bg-orange-100 text-orange-800' :
                                            'bg-gray-100 text-gray-800'
                                    }`}>
                                    {selectedLead.status}
                                </span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg">
                                <label className="text-xs text-gray-400 uppercase font-semibold">Origen</label>
                                <p className="dark:text-white">{selectedLead.source || '-'}</p>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs text-gray-400 uppercase font-semibold">Notas</label>
                            <p className="text-sm bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg mt-1 dark:text-gray-300 min-h-[60px]">
                                {selectedLead.message || selectedLead.notes || 'Sin notas'}
                            </p>
                        </div>
                    </div>
                </Modal>
            )}

            {/* Modal Nuevo Ticket */}
            <Modal isOpen={isNewTicketOpen} onClose={() => setIsNewTicketOpen(false)} title="Nuevo Ticket de Soporte">
                <form onSubmit={handleCreateTicket} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Asunto</label>
                        <input value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad</label>
                        <select value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                            <option value="low">Baja</option>
                            <option value="normal">Normal</option>
                            <option value="high">Alta</option>
                            <option value="urgent">Urgente</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Mensaje</label>
                        <textarea value={newTicket.message} onChange={(e) => setNewTicket({ ...newTicket, message: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" rows={4} required />
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <Button variant="ghost" onClick={() => setIsNewTicketOpen(false)}>Cancelar</Button>
                        <Button type="submit">Enviar Ticket</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Ver Ticket */}
            <Modal isOpen={isTicketViewOpen} onClose={() => setIsTicketViewOpen(false)} title={selectedTicket?.subject || 'Ticket'}>
                {selectedTicket && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedTicket.status]}`}>
                                {selectedTicket.status === 'open' ? 'Abierto' : selectedTicket.status === 'in_progress' ? 'En progreso' : selectedTicket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                            </span>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 max-h-80 overflow-y-auto space-y-3">
                            {ticketMessages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender_role !== 'commercial' ? 'justify-start' : 'justify-end'}`}>
                                    <div className={`max-w-[80%] rounded-xl px-4 py-2 ${msg.sender_role !== 'commercial'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white border'
                                        }`}>
                                        <p className="text-sm">{msg.message}</p>
                                        <p className={`text-xs mt-1 ${msg.sender_role !== 'commercial' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                            {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedTicket.status !== 'closed' && (
                            <div className="flex gap-2">
                                <input value={newReply} onChange={(e) => setNewReply(e.target.value)} placeholder="Escribe tu mensaje..."
                                    className="flex-1 px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                    onKeyPress={(e) => e.key === 'Enter' && handleReplyTicket()} />
                                <Button onClick={handleReplyTicket}><MessageSquare className="w-4 h-4" /></Button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default CommercialDashboard;
