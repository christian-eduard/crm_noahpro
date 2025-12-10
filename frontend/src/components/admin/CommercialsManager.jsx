import { API_URL, SOCKET_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import Input from '../shared/Input';
import ConfirmModal from '../shared/ConfirmModal';
import { User, Mail, Phone, Lock, Plus, Eye, Trash2, Copy, Users, BookOpen, HeadphonesIcon, Video, FileText, Link, Upload, MessageSquare, Edit } from 'lucide-react';

const CommercialsManager = () => {
    const [activeTab, setActiveTab] = useState('commercials');
    const [commercials, setCommercials] = useState([]);
    const [materials, setMaterials] = useState([]);
    const [tickets, setTickets] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isMaterialModalOpen, setIsMaterialModalOpen] = useState(false);
    const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    const [selectedCommercial, setSelectedCommercial] = useState(null);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [ticketMessages, setTicketMessages] = useState([]);
    const [newReply, setNewReply] = useState('');
    const toast = useToast();

    const [formData, setFormData] = useState({
        username: '', password: '', email: '', full_name: '', phone: ''
    });
    const [materialFormData, setMaterialFormData] = useState({
        title: '', description: '', type: 'document', video_url: '', content: '', external_url: '', is_public: true, commercial_id: '', category: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [isDeleting, setIsDeleting] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);

    const API_URL = import.meta.env.VITE_API_URL || SOCKET_URL;
    const token = localStorage.getItem('crm_token');

    useEffect(() => {
        if (activeTab === 'commercials') fetchCommercials();
        if (activeTab === 'training') fetchMaterials();
        if (activeTab === 'support') fetchTickets();
    }, [activeTab]);

    // ==================== COMERCIALES ====================
    const fetchCommercials = async () => {
        try {
            console.log('Fetching commercials with token:', token);
            const response = await fetch(`${API_URL}/api/commercials`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            console.log('Fetch response status:', response.status);
            if (response.ok) {
                const data = await response.json();
                console.log('Commercials data:', data);
                setCommercials(data);
            } else {
                console.error('Fetch failed:', await response.text());
                if (response.status === 401) {
                    toast.error('Sesión expirada. Por favor, recarga la página.');
                }
            }
        } catch (error) { console.error('Error:', error); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const url = isEditing
                ? `${API_URL}/api/commercials/${editId}`
                : `${API_URL}/api/commercials`;

            const method = isEditing ? 'PUT' : 'POST';

            // Si estamos editando y no se puso password, lo quitamos del body
            const bodyData = { ...formData };
            if (isEditing && !bodyData.password) {
                delete bodyData.password;
            }

            const response = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(bodyData),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || (isEditing ? 'Error al actualizar' : 'Error al crear'));
            }

            toast.success(isEditing ? 'Comercial actualizado' : 'Comercial creado correctamente');
            setIsModalOpen(false);
            setFormData({ username: '', password: '', email: '', full_name: '', phone: '' });
            setIsEditing(false);
            setEditId(null);
            fetchCommercials();
        } catch (error) {
            if (error.name === 'AbortError') {
                toast.error('Tiempo de espera agotado.');
            } else {
                toast.error(error.message);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleEdit = (comm) => {
        setFormData({
            username: comm.username,
            password: '', // Password vacía por defecto al editar
            email: comm.email,
            full_name: comm.full_name,
            phone: comm.phone || ''
        });
        setIsEditing(true);
        setEditId(comm.id);
        setIsModalOpen(true);
    };

    const handleViewDetails = async (comm) => {
        // ... (existing code)
        try {
            const response = await fetch(`${API_URL}/api/commercials/${comm.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setSelectedCommercial(await response.json());
                setIsDetailModalOpen(true);
            }
        } catch (error) { toast.error('Error al cargar detalles'); }
    };

    const handleDelete = (id) => {
        setConfirmModal({
            isOpen: true,
            title: '¿Eliminar comercial?',
            message: '¿Estás seguro de eliminar este comercial y todos sus datos asociados?',
            confirmText: 'Eliminar',
            type: 'danger',
            onConfirm: async () => {
                setIsDeleting(id);
                try {
                    const response = await fetch(`${API_URL}/api/commercials/${id}`, {
                        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (!response.ok) throw new Error('Error al eliminar');
                    toast.success('Comercial eliminado');
                    fetchCommercials();
                } catch (error) { toast.error(error.message); }
                finally { setIsDeleting(null); }
            }
        });
    };

    const handleResendWelcomeEmail = async (commercialId) => {
        try {
            const response = await fetch(`${API_URL}/api/commercials/${commercialId}/resend-welcome`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error('Error al reenviar email');
            toast.success('Email de bienvenida reenviado correctamente');
        } catch (error) {
            toast.error(error.message);
        }
    };

    // ==================== MATERIALES ====================
    const fetchMaterials = async () => {
        try {
            const response = await fetch(`${API_URL}/api/training`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setMaterials(await response.json());
        } catch (error) { console.error('Error:', error); }
    };

    const handleMaterialSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const formDataToSend = new FormData();
            Object.entries(materialFormData).forEach(([k, v]) => formDataToSend.append(k, v));
            if (selectedFile) formDataToSend.append('file', selectedFile);

            const response = await fetch(`${API_URL}/api/training`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formDataToSend
            });
            if (!response.ok) throw new Error('Error al crear material');
            toast.success('Material creado');
            setIsMaterialModalOpen(false);
            setMaterialFormData({ title: '', description: '', type: 'document', video_url: '', content: '', external_url: '', is_public: true, commercial_id: '', category: '' });
            setSelectedFile(null);
            fetchMaterials();
        } catch (error) { toast.error(error.message); }
        finally { setIsLoading(false); }
    };

    const handleDeleteMaterial = (id) => {
        setConfirmModal({
            isOpen: true,
            title: '¿Eliminar material?',
            message: '¿Estás seguro de eliminar este material de formación?',
            confirmText: 'Eliminar',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await fetch(`${API_URL}/api/training/${id}`, {
                        method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` }
                    });
                    toast.success('Material eliminado');
                    fetchMaterials();
                } catch (error) { toast.error('Error al eliminar'); }
            }
        });
    };

    // ==================== SOPORTE ====================
    const fetchTickets = async () => {
        try {
            const response = await fetch(`${API_URL}/api/support`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) setTickets(await response.json());
        } catch (error) { console.error('Error:', error); }
    };

    const handleViewTicket = async (ticket) => {
        try {
            const response = await fetch(`${API_URL}/api/support/${ticket.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSelectedTicket(data);
                setTicketMessages(data.messages || []);
                setIsTicketModalOpen(true);
            }
        } catch (error) { toast.error('Error al cargar ticket'); }
    };

    const handleReplyTicket = async () => {
        if (!newReply.trim()) return;
        try {
            const response = await fetch(`${API_URL}/api/support/${selectedTicket.id}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ message: newReply })
            });
            if (response.ok) {
                setNewReply('');
                handleViewTicket(selectedTicket);
            }
        } catch (error) { toast.error('Error al enviar'); }
    };

    const updateTicketStatus = async (status) => {
        try {
            await fetch(`${API_URL}/api/support/${selectedTicket.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ status })
            });
            toast.success('Estado actualizado');
            handleViewTicket({ ...selectedTicket, status });
            fetchTickets();
        } catch (error) { toast.error('Error'); }
    };

    const copyToClipboard = (text) => { navigator.clipboard.writeText(text); toast.success('Copiado'); };

    const tabs = [
        { id: 'commercials', label: 'Comerciales', icon: Users },
        { id: 'training', label: 'Formación', icon: BookOpen },
        { id: 'support', label: 'Soporte', icon: HeadphonesIcon }
    ];

    const statusColors = {
        open: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
        in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
        resolved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
        closed: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };

    const typeIcons = { video: Video, document: FileText, tutorial: BookOpen, link: Link };

    return (
        <div className="p-6">
            {/* Header con Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gestión de Comerciales</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Equipo comercial, formación y soporte</p>
                </div>
                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white dark:bg-gray-600 text-indigo-600 dark:text-white shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900'
                                }`}>
                            <tab.icon className="w-4 h-4 mr-2" />
                            {tab.label}
                            {tab.id === 'support' && tickets.filter(t => t.status === 'open').length > 0 && (
                                <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                                    {tickets.filter(t => t.status === 'open').length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* ==================== TAB COMERCIALES ==================== */}
            {activeTab === 'commercials' && (
                <>
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => setIsModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Nuevo Comercial</Button>
                    </div>
                    <div className="bg-white dark:bg-gray-800 shadow-md rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-700/50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Comercial</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Código</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                {commercials.map(comm => (
                                    <tr key={comm.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                                                    {comm.full_name?.charAt(0) || 'C'}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="font-medium text-gray-900 dark:text-white">{comm.full_name}</div>
                                                    <div className="text-xs text-gray-500">@{comm.username}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 text-xs font-mono rounded bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400">
                                                {comm.commercial_code || 'N/A'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{comm.email}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-3">
                                                <button onClick={() => handleViewDetails(comm)} className="text-indigo-600 hover:text-indigo-900 flex items-center text-sm">
                                                    <Eye className="w-4 h-4 mr-1" /> Ver Ficha
                                                </button>
                                                <button onClick={() => handleEdit(comm)} className="text-blue-600 hover:text-blue-900 flex items-center text-sm">
                                                    <Edit className="w-4 h-4 mr-1" /> Editar
                                                </button>
                                                <button onClick={() => handleDelete(comm.id)} disabled={isDeleting === comm.id}
                                                    className="text-red-600 hover:text-red-900 flex items-center text-sm disabled:opacity-50">
                                                    <Trash2 className="w-4 h-4 mr-1" /> {isDeleting === comm.id ? '...' : 'Eliminar'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {commercials.length === 0 && (
                                    <tr><td colSpan={4} className="px-6 py-8 text-center text-gray-500">No hay comerciales</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </>
            )}

            {/* ==================== TAB FORMACIÓN ==================== */}
            {activeTab === 'training' && (
                <>
                    <div className="flex justify-end mb-4">
                        <Button onClick={() => setIsMaterialModalOpen(true)}><Plus className="w-4 h-4 mr-2" />Nuevo Material</Button>
                    </div>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {materials.map(mat => {
                            const TypeIcon = typeIcons[mat.type] || FileText;
                            return (
                                <div key={mat.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center">
                                            <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                                                <TypeIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="font-medium text-gray-900 dark:text-white">{mat.title}</h3>
                                                <span className="text-xs text-gray-500 capitalize">{mat.type}</span>
                                            </div>
                                        </div>
                                        <span className={`text-xs px-2 py-1 rounded-full ${mat.is_public ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'}`}>
                                            {mat.is_public ? 'Público' : 'Privado'}
                                        </span>
                                    </div>
                                    {mat.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{mat.description}</p>}
                                    <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <span className="text-xs text-gray-400">{mat.category || 'Sin categoría'}</span>
                                        <button onClick={() => handleDeleteMaterial(mat.id)} className="text-red-500 hover:text-red-700 text-sm">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {materials.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-500">
                                <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p>No hay materiales de formación</p>
                            </div>
                        )}
                    </div>
                </>
            )}

            {/* ==================== TAB SOPORTE ==================== */}
            {activeTab === 'support' && (
                <div className="space-y-4">
                    {tickets.map(ticket => (
                        <div key={ticket.id} onClick={() => handleViewTicket(ticket)}
                            className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 hover:shadow-lg transition-shadow cursor-pointer">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-xs px-2 py-1 rounded-full ${statusColors[ticket.status]}`}>
                                            {ticket.status === 'open' ? 'Abierto' : ticket.status === 'in_progress' ? 'En progreso' : ticket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                                        </span>
                                        {ticket.unread_count > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{ticket.unread_count}</span>}
                                    </div>
                                    <h3 className="font-medium text-gray-900 dark:text-white">{ticket.subject}</h3>
                                    <p className="text-sm text-gray-500">De: {ticket.commercial_name} ({ticket.commercial_email})</p>
                                </div>
                                <span className="text-xs text-gray-400">{new Date(ticket.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    ))}
                    {tickets.length === 0 && (
                        <div className="text-center py-12 text-gray-500">
                            <HeadphonesIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>No hay tickets de soporte</p>
                        </div>
                    )}
                </div>
            )}

            {/* ==================== MODALES ==================== */}
            {/* Modal Nuevo/Editar Comercial */}
            <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setIsEditing(false); }} title={isEditing ? 'Editar Comercial' : 'Nuevo Comercial'}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input label="Nombre Completo" name="full_name" value={formData.full_name} onChange={(e) => setFormData({ ...formData, full_name: e.target.value })} required icon={<User className="w-4 h-4" />} />
                    <Input label="Email" name="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required icon={<Mail className="w-4 h-4" />} />
                    <Input label="Teléfono" name="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} icon={<Phone className="w-4 h-4" />} />
                    <Input label="Usuario" name="username" value={formData.username} onChange={(e) => setFormData({ ...formData, username: e.target.value })} required icon={<User className="w-4 h-4" />} />
                    <Input
                        label={isEditing ? "Nueva Contraseña (dejar en blanco para no cambiar)" : "Contraseña"}
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required={!isEditing}
                        icon={<Lock className="w-4 h-4" />}
                    />
                    <div className="pt-4 flex justify-end space-x-3">
                        <Button variant="ghost" onClick={() => { setIsModalOpen(false); setIsEditing(false); }}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : (isEditing ? 'Actualizar Comercial' : 'Crear Comercial')}</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Ficha Comercial */}
            <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Ficha del Comercial">
                {selectedCommercial && (
                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl">
                                {selectedCommercial.full_name?.charAt(0)}
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{selectedCommercial.full_name}</h3>
                                <p className="text-sm text-gray-500">@{selectedCommercial.username}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Código Comercial</span>
                                <button onClick={() => copyToClipboard(selectedCommercial.commercial_code)} className="text-indigo-600 hover:text-indigo-800 flex items-center text-sm">
                                    <Copy className="w-4 h-4 mr-1" /> Copiar
                                </button>
                            </div>
                            <div className="font-mono text-lg font-bold text-indigo-600 dark:text-indigo-400">{selectedCommercial.commercial_code}</div>
                            {selectedCommercial.qr_code_url && (
                                <div className="mt-4 flex flex-col items-center gap-3">
                                    <div className="bg-white p-3 rounded-xl shadow-sm">
                                        <img src={selectedCommercial.qr_code_url} alt="QR" className="w-40 h-40 object-contain" />
                                    </div>
                                    <button
                                        onClick={() => handleResendWelcomeEmail(selectedCommercial.id)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors"
                                    >
                                        <Mail className="w-4 h-4" />
                                        Reenviar Email de Bienvenida
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><span className="text-xs text-gray-500">Email</span><p className="font-medium text-gray-900 dark:text-white">{selectedCommercial.email}</p></div>
                            <div><span className="text-xs text-gray-500">Teléfono</span><p className="font-medium text-gray-900 dark:text-white">{selectedCommercial.phone || 'N/A'}</p></div>
                        </div>
                        {selectedCommercial.stats && (
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{selectedCommercial.stats.total_leads}</div>
                                    <div className="text-xs text-gray-500">Total Leads</div>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{selectedCommercial.stats.won_leads}</div>
                                    <div className="text-xs text-gray-500">Ganados</div>
                                </div>
                                <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-amber-600">{selectedCommercial.stats.new_leads}</div>
                                    <div className="text-xs text-gray-500">Nuevos</div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>

            {/* Modal Nuevo Material */}
            <Modal isOpen={isMaterialModalOpen} onClose={() => setIsMaterialModalOpen(false)} title="Nuevo Material de Formación">
                <form onSubmit={handleMaterialSubmit} className="space-y-4">
                    <Input label="Título" value={materialFormData.title} onChange={(e) => setMaterialFormData({ ...materialFormData, title: e.target.value })} required />
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
                        <select value={materialFormData.type} onChange={(e) => setMaterialFormData({ ...materialFormData, type: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                            <option value="document">Documento</option>
                            <option value="video">Video</option>
                            <option value="tutorial">Tutorial</option>
                            <option value="link">Enlace</option>
                        </select>
                    </div>
                    <textarea placeholder="Descripción" value={materialFormData.description} onChange={(e) => setMaterialFormData({ ...materialFormData, description: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" rows={2} />

                    {materialFormData.type === 'video' && (
                        <Input label="URL del Video (YouTube, Vimeo...)" value={materialFormData.video_url} onChange={(e) => setMaterialFormData({ ...materialFormData, video_url: e.target.value })} />
                    )}
                    {materialFormData.type === 'link' && (
                        <Input label="URL del Enlace" value={materialFormData.external_url} onChange={(e) => setMaterialFormData({ ...materialFormData, external_url: e.target.value })} />
                    )}
                    {materialFormData.type === 'tutorial' && (
                        <textarea placeholder="Contenido del tutorial (HTML permitido)" value={materialFormData.content} onChange={(e) => setMaterialFormData({ ...materialFormData, content: e.target.value })}
                            className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" rows={6} />
                    )}
                    {materialFormData.type === 'document' && (
                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                            <input type="file" onChange={(e) => setSelectedFile(e.target.files[0])} className="hidden" id="fileInput" />
                            <label htmlFor="fileInput" className="cursor-pointer">
                                <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                                <p className="text-sm text-gray-500">{selectedFile ? selectedFile.name : 'Click para subir archivo'}</p>
                            </label>
                        </div>
                    )}
                    <Input label="Categoría" value={materialFormData.category} onChange={(e) => setMaterialFormData({ ...materialFormData, category: e.target.value })} placeholder="Ej: Ventas, Producto..." />
                    <div className="flex items-center gap-4">
                        <label className="flex items-center">
                            <input type="checkbox" checked={materialFormData.is_public} onChange={(e) => setMaterialFormData({ ...materialFormData, is_public: e.target.checked })} className="mr-2" />
                            <span className="text-sm">Visible para todos</span>
                        </label>
                        {!materialFormData.is_public && (
                            <select value={materialFormData.commercial_id} onChange={(e) => setMaterialFormData({ ...materialFormData, commercial_id: e.target.value })}
                                className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600 text-sm">
                                <option value="">Seleccionar comercial...</option>
                                {commercials.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
                            </select>
                        )}
                    </div>
                    <div className="pt-4 flex justify-end space-x-3">
                        <Button variant="ghost" onClick={() => setIsMaterialModalOpen(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isLoading}>{isLoading ? 'Guardando...' : 'Guardar Material'}</Button>
                    </div>
                </form>
            </Modal>

            {/* Modal Ticket Chat */}
            <Modal isOpen={isTicketModalOpen} onClose={() => setIsTicketModalOpen(false)} title={selectedTicket?.subject || 'Ticket'}>
                {selectedTicket && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                                <span className={`text-xs px-2 py-1 rounded-full ${statusColors[selectedTicket.status]}`}>
                                    {selectedTicket.status === 'open' ? 'Abierto' : selectedTicket.status === 'in_progress' ? 'En progreso' : selectedTicket.status === 'resolved' ? 'Resuelto' : 'Cerrado'}
                                </span>
                                <span className="text-sm text-gray-500">De: {selectedTicket.commercial_name}</span>
                            </div>
                            <select value={selectedTicket.status} onChange={(e) => updateTicketStatus(e.target.value)}
                                className="text-sm px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600">
                                <option value="open">Abierto</option>
                                <option value="in_progress">En progreso</option>
                                <option value="resolved">Resuelto</option>
                                <option value="closed">Cerrado</option>
                            </select>
                        </div>

                        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 max-h-80 overflow-y-auto space-y-3">
                            {ticketMessages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] rounded-xl px-4 py-2 ${msg.sender_role === 'admin'
                                        ? 'bg-indigo-600 text-white'
                                        : 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white border dark:border-gray-500'
                                        }`}>
                                        <p className="text-sm">{msg.message}</p>
                                        <p className={`text-xs mt-1 ${msg.sender_role === 'admin' ? 'text-indigo-200' : 'text-gray-400'}`}>
                                            {msg.sender_name} • {new Date(msg.created_at).toLocaleTimeString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {selectedTicket.status !== 'closed' && (
                            <div className="flex gap-2">
                                <input value={newReply} onChange={(e) => setNewReply(e.target.value)} placeholder="Escribe una respuesta..."
                                    className="flex-1 px-4 py-2 border rounded-xl dark:bg-gray-700 dark:border-gray-600"
                                    onKeyPress={(e) => e.key === 'Enter' && handleReplyTicket()} />
                                <Button onClick={handleReplyTicket}><MessageSquare className="w-4 h-4" /></Button>
                            </div>
                        )}
                    </div>
                )}

            </Modal>

            <ConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmText={confirmModal.confirmText}
                type={confirmModal.type}
            />
        </div>
    );
};

export default CommercialsManager;
