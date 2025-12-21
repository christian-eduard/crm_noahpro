/**
 * RecruitmentDashboard
 * Panel de administración para AI Talent Hunter
 */
import React, { useState, useEffect } from 'react';
import { API_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import {
    Users, Briefcase, UserPlus, Clock, CheckCircle, XCircle,
    MessageSquare, Play, Calendar, Search, Filter, Mail, Trash2, ExternalLink
} from 'lucide-react';
import Button from '../shared/Button';

const RecruitmentDashboard = () => {
    const [candidates, setCandidates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState([]);

    // Filtros
    const [filterStatus, setFilterStatus] = useState('all');

    // Modales
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [inviteForm, setInviteForm] = useState({ name: '', email: '', templateId: '' });

    const toast = useToast();

    useEffect(() => {
        fetchCandidates();
        fetchTemplates();
    }, []);

    const fetchCandidates = async () => {
        try {
            const res = await fetch(`${API_URL}/recruitment/candidates`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('crm_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setCandidates(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching candidates:', error);
            setCandidates([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchTemplates = async () => {
        try {
            const res = await fetch(`${API_URL}/recruitment/templates`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('crm_token')}` }
            });
            if (res.ok) {
                const data = await res.json();
                setTemplates(Array.isArray(data) ? data : []);
            }
        } catch (error) {
            console.error('Error fetching templates:', error);
        }
    };

    const handleInvite = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/recruitment/invite`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                },
                body: JSON.stringify({
                    candidateId: selectedCandidate?.id, // Opcional si es nuevo
                    email: inviteForm.email,
                    name: inviteForm.name,
                    templateId: inviteForm.templateId,
                    expiresDays: 3
                })
            });

            if (res.ok) {
                toast.success('Invitación enviada correctamente');
                setIsInviteModalOpen(false);
                setInviteForm({ name: '', email: '', templateId: '' });
                fetchCandidates();
            } else {
                toast.error('Error al enviar invitación');
            }
        } catch (error) {
            toast.error('Error de conexión');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('¿Eliminar candidato?')) return;
        try {
            await fetch(`${API_URL}/recruitment/candidates/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('crm_token')}` }
            });
            toast.success('Candidato eliminado');
            fetchCandidates();
        } catch (error) {
            toast.error('Error al eliminar');
        }
    };

    // Asegurar que candidates es array antes de filtrar
    const safeCandidates = Array.isArray(candidates) ? candidates : [];

    // Filtrar candidatos
    const filteredCandidates = safeCandidates.filter(c => {
        if (filterStatus === 'all') return true;
        return c.status === filterStatus;
    });

    // Stats
    const stats = {
        total: safeCandidates.length,
        pending: safeCandidates.filter(c => c.status === 'pending').length,
        invited: safeCandidates.filter(c => c.status === 'invited').length,
        interviewed: safeCandidates.filter(c => c.status === 'interviewed').length
    };

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Users className="w-6 h-6 text-orange-500" />
                        AI Talent Hunter
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">Gestión de reclutamiento automatizado</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="secondary"
                        onClick={() => window.open('/careers/apply', '_blank')}
                    >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Ver Landing
                    </Button>
                    <Button onClick={() => setIsInviteModalOpen(true)}>
                        <UserPlus className="w-4 h-4 mr-2" />
                        Invitar Candidato
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Total Candidatos', value: stats.total, icon: Users, color: 'text-blue-500' },
                    { label: 'Pendientes', value: stats.pending, icon: Clock, color: 'text-yellow-500' },
                    { label: 'Invitados', value: stats.invited, icon: Mail, color: 'text-orange-500' },
                    { label: 'Entrevistados (IA)', value: stats.interviewed, icon: MessageSquare, color: 'text-green-500' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm text-gray-500">{stat.label}</p>
                                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                            </div>
                            <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters & Search */}
            <div className="flex gap-4 items-center bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                <Search className="w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar candidato..."
                    className="bg-transparent border-none focus:ring-0 w-full"
                />
                <select
                    className="bg-gray-50 dark:bg-gray-700 border-none rounded-lg px-3 py-1"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                >
                    <option value="all">Todos los estados</option>
                    <option value="pending">Pendiente</option>
                    <option value="invited">Invitado</option>
                    <option value="interviewed">Entrevistado</option>
                    <option value="rejected">Rechazado</option>
                    <option value="hired">Contratado</option>
                </select>
            </div>

            {/* Candidates List */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 text-sm">
                        <tr>
                            <th className="p-4 font-medium">Candidato</th>
                            <th className="p-4 font-medium">Posición</th>
                            <th className="p-4 font-medium">Estado</th>
                            <th className="p-4 font-medium">Puntuación IA</th>
                            <th className="p-4 font-medium">Fecha</th>
                            <th className="p-4 font-medium text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {filteredCandidates.length === 0 ? (
                            <tr>
                                <td colSpan="6" className="p-8 text-center text-gray-500">
                                    No hay candidatos encontrados.
                                </td>
                            </tr>
                        ) : (
                            filteredCandidates.map(candidate => (
                                <tr key={candidate.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                    <td className="p-4">
                                        <div className="font-semibold text-gray-900 dark:text-gray-100">{candidate.full_name}</div>
                                        <div className="text-sm text-gray-500">{candidate.email}</div>
                                    </td>
                                    <td className="p-4 text-sm">{candidate.position || 'General'}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium uppercase
                                            ${candidate.status === 'interviewed' ? 'bg-green-100 text-green-700' :
                                                candidate.status === 'invited' ? 'bg-orange-100 text-orange-700' :
                                                    'bg-gray-100 text-gray-700'}`}>
                                            {candidate.status}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        {candidate.ai_score ? (
                                            <span className="font-bold text-green-600">{candidate.ai_score}/100</span>
                                        ) : (
                                            <span className="text-gray-400 text-sm">-</span>
                                        )}
                                    </td>
                                    <td className="p-4 text-sm text-gray-500">
                                        {new Date(candidate.created_at).toLocaleDateString()}
                                    </td>
                                    <td className="p-4 text-right space-x-2">
                                        {candidate.cv_url && (
                                            <a
                                                href={candidate.cv_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-700 text-sm font-medium mr-2"
                                            >
                                                Ver CV
                                            </a>
                                        )}
                                        <button
                                            onClick={() => handleDelete(candidate.id)}
                                            className="text-red-400 hover:text-red-600"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Invite Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6 shadow-2xl">
                        <h2 className="text-xl font-bold mb-4">Invitar Candidato</h2>
                        <form onSubmit={handleInvite} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Nombre</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                    value={inviteForm.name}
                                    onChange={e => setInviteForm({ ...inviteForm, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Email</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                    value={inviteForm.email}
                                    onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-1">Plantilla de Entrevista</label>
                                <select
                                    required
                                    className="w-full p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                    value={inviteForm.templateId}
                                    onChange={e => setInviteForm({ ...inviteForm, templateId: e.target.value })}
                                >
                                    <option value="">Seleccionar plantilla...</option>
                                    {templates.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.duration} min)</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex justify-end gap-2 mt-6">
                                <Button variant="secondary" onClick={() => setIsInviteModalOpen(false)}>Cancelar</Button>
                                <Button variant="primary" type="submit">Enviar Invitación</Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruitmentDashboard;
