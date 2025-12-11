import { API_URL, SOCKET_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { User, Mail, Shield, Plus, Edit2, Trash2, X, Check, Search, Lock, Copy, QrCode } from 'lucide-react';
import Button from '../shared/Button';
import Input from '../shared/Input';
import ConfirmModal from '../shared/ConfirmModal';
import { useToast } from '../../contexts/ToastContext';

const UsersSettings = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const toast = useToast();

    // Form state
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        full_name: '',
        password: '',
        role: 'admin'
    });

    // Confirmation modal state
    const [confirmDialog, setConfirmDialog] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await fetch(`${API_URL}/users`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')} `
                }
            });
            if (response.ok) {
                const data = await response.json();
                console.log('Fetched users:', data);
                setUsers(data);
            } else {
                console.error('Failed to fetch users:', response.status);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
            toast.error('Error al cargar usuarios');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const resetForm = () => {
        setFormData({
            username: '',
            email: '',
            full_name: '',
            password: '',
            role: 'admin'
        });
        setEditingUser(null);
        setShowCreateModal(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const url = editingUser
                ? `${API_URL}/users/${editingUser.id}`
                : `${API_URL}/users`;

            const method = editingUser ? 'PUT' : 'POST';

            // Remove empty password if editing and not changing it
            const dataToSend = { ...formData };
            if (editingUser && !dataToSend.password) {
                delete dataToSend.password;
            }

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                },
                body: JSON.stringify(dataToSend)
            });

            let data;
            try {
                data = await response.json();
            } catch (e) {
                data = {};
            }

            if (!response.ok) {
                throw new Error(data.error || 'Error al guardar usuario');
            }

            toast.success(editingUser ? 'Usuario actualizado' : 'Usuario creado exitosamente');
            fetchUsers();
            resetForm();
        } catch (error) {
            console.error('Error saving user:', error);
            toast.error(error.message || 'Error al guardar usuario');
        }
    };

    const handleEdit = (user) => {
        setEditingUser(user);
        setFormData({
            username: user.username,
            email: user.email,
            full_name: user.full_name || '',
            password: '', // Password empty by default on edit
            role: user.role
        });
        setShowCreateModal(true);
    };

    const handleDelete = (user) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Eliminar Usuario',
            message: `¿Estás seguro de que deseas eliminar al usuario "${user.username}"? Esta acción no se puede deshacer.`,
            onConfirm: async () => {
                try {
                    const response = await fetch(`${API_URL}/users/${user.id}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('crm_token')}`
                        }
                    });

                    let data;
                    try {
                        data = await response.json();
                    } catch (e) {
                        data = {};
                    }

                    if (!response.ok) {
                        throw new Error(data.error || 'Error al eliminar usuario');
                    }

                    toast.success('Usuario eliminado correctamente');
                    fetchUsers();
                } catch (error) {
                    console.error('Error deleting user:', error);
                    toast.error(error.message || 'Error al eliminar usuario');
                }
                setConfirmDialog({ ...confirmDialog, isOpen: false });
            }
        });
    };

    const filteredUsers = users.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                        <User className="w-5 h-5 text-gray-500" />
                        Gestión de Usuarios
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Administra los accesos al panel CRM
                    </p>
                </div>
                <Button
                    onClick={() => {
                        resetForm();
                        setShowCreateModal(true);
                    }}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Search and Filter */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar usuarios..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                />
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Usuario</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rol</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Código Referido</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Fecha Creación</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                        {filteredUsers.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-600 dark:text-orange-400 font-bold">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {user.full_name || user.username}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                @{user.username}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {user.email}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {user.referral_code ? (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                {user.qr_code_url && (
                                                    <img src={user.qr_code_url} alt="QR" className="w-10 h-10 rounded" />
                                                )}
                                                <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                                                    {user.referral_code}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <input
                                                    type="text"
                                                    readOnly
                                                    value={`${window.location.origin}/demo?ref=${user.referral_code}`}
                                                    className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded px-2 py-1 w-40 truncate"
                                                />
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        navigator.clipboard.writeText(`${window.location.origin}/demo?ref=${user.referral_code}`);
                                                        toast.success('Enlace copiado');
                                                    }}
                                                    className="p-1 text-gray-500 hover:text-orange-600 transition-colors"
                                                    title="Copiar enlace"
                                                >
                                                    <Copy className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <button
                                            onClick={async (e) => {
                                                e.stopPropagation();
                                                try {
                                                    const response = await fetch(`${API_URL}/users/${user.id}/generate-referral`, {
                                                        method: 'POST',
                                                        headers: { 'Authorization': `Bearer ${localStorage.getItem('crm_token')}` }
                                                    });
                                                    if (response.ok) {
                                                        toast.success('Código generado');
                                                        fetchUsers();
                                                    } else {
                                                        const data = await response.json();
                                                        toast.error(data.error || 'Error al generar código');
                                                    }
                                                } catch (error) {
                                                    toast.error('Error de conexión');
                                                }
                                            }}
                                            className="flex items-center gap-1 px-3 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg text-xs font-medium hover:bg-orange-200 dark:hover:bg-orange-900/50 transition-colors"
                                        >
                                            <QrCode className="w-3 h-3" />
                                            Generar Código
                                        </button>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                    {new Date(user.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => handleEdit(user)}
                                            className="p-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(user)}
                                            className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                            title="Eliminar"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12">
                        <User className="mx-auto h-12 w-12 text-gray-400" />
                        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No se encontraron usuarios</h3>
                        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Intenta con otra búsqueda o crea un nuevo usuario.</p>
                    </div>
                )}
            </div>

            {/* Create/Edit Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h3>
                            <button onClick={() => setShowCreateModal(false)} className="text-gray-400 hover:text-gray-600">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <Input
                                label="Nombre Completo"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleInputChange}
                                placeholder="Ej: Juan Pérez"
                                icon={<User className="w-4 h-4" />}
                            />

                            <Input
                                label="Usuario"
                                name="username"
                                value={formData.username}
                                onChange={handleInputChange}
                                placeholder="Ej: jperez"
                                required
                                icon={<User className="w-4 h-4" />}
                            />

                            <Input
                                label="Email"
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleInputChange}
                                placeholder="ejemplo@correo.com"
                                required
                                icon={<Mail className="w-4 h-4" />}
                            />

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Contraseña {editingUser && <span className="text-xs text-gray-500 font-normal">(Dejar en blanco para mantener actual)</span>}
                                </label>
                                <div className="relative">
                                    <Input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                        placeholder="••••••••"
                                        required={!editingUser}
                                        icon={<Lock className="w-4 h-4" />}
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 text-white"
                                >
                                    {editingUser ? 'Actualizar' : 'Crear Usuario'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={confirmDialog.isOpen}
                onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
                onConfirm={confirmDialog.onConfirm}
                title={confirmDialog.title}
                message={confirmDialog.message}
            />
        </div>
    );
};

export default UsersSettings;
