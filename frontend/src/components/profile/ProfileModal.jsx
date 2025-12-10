import React, { useState, useEffect, useRef } from 'react';
import Modal from '../shared/Modal';
import { useToast } from '../../contexts/ToastContext';
import { User, Mail, Bell, Camera, Loader2, Trash2 } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, onUpdate }) => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState({
        username: '',
        role: '',
        full_name: '',
        email: '',
        password: '',
        notifications_enabled: true,
        avatar_url: null
    });
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const [deleteAvatar, setDeleteAvatar] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchProfile();
        }
    }, [isOpen]);

    const fetchProfile = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/users/profile`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setProfile({
                    username: data.username || '',
                    role: data.role || '',
                    full_name: data.full_name || '',
                    email: data.email || '',
                    password: '',
                    notifications_enabled: data.notifications_enabled,
                    avatar_url: data.avatar_url,
                });
                setPreview(data.avatar_url);
            }
        } catch (error) {
            console.error('Error cargando perfil:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                toast.error('La imagen no debe superar los 5MB');
                return;
            }
            setProfile(prev => ({ ...prev, avatarFile: file }));
            setPreview(URL.createObjectURL(file));
            setDeleteAvatar(false);
        }
    };

    const handleDeleteAvatar = (e) => {
        e.stopPropagation(); // Evitar abrir selector de archivos
        setPreview(null);
        setProfile(prev => ({ ...prev, avatarFile: null }));
        setDeleteAvatar(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('full_name', profile.full_name);
            formData.append('email', profile.email);
            if (profile.password) {
                formData.append('password', profile.password);
            }
            formData.append('notifications_enabled', profile.notifications_enabled);

            if (deleteAvatar) {
                formData.append('delete_avatar', 'true');
            } else if (profile.avatarFile) {
                formData.append('avatar', profile.avatarFile);
            }

            const token = localStorage.getItem('crm_token');
            // ... (resto del submit)
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/users/profile`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });

            if (response.ok) {
                const data = await response.json();
                // Update local storage user data partially
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const updatedUser = { ...user, ...data.user };
                localStorage.setItem('user', JSON.stringify(updatedUser));

                if (onUpdate) onUpdate(updatedUser);
                toast.success('Perfil actualizado correctamente');
                onClose();
            } else {
                toast.error('Error al actualizar perfil');
            }
        } catch (error) {
            console.error('Error saving profile:', error);
            toast.error('Error al guardar los cambios');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Mi Perfil">
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Avatar Section */}
                <div className="flex flex-col items-center">
                    <div className="relative">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100">
                                {preview ? (
                                    <img src={preview} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-400">
                                        <User className="w-12 h-12" />
                                    </div>
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="w-8 h-8 text-white" />
                            </div>
                        </div>
                        {preview && (
                            <button
                                type="button"
                                onClick={handleDeleteAvatar}
                                className="absolute -right-2 -bottom-2 p-2 bg-white rounded-full shadow-md text-red-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                                title="Eliminar foto"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                    <p className="text-sm text-gray-500 mt-2">Click para cambiar foto</p>
                </div>

                {loading ? (
                    <div className="flex justify-center p-4">
                        <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Usuario
                                </label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                    <input
                                        type="text"
                                        value={profile.username}
                                        readOnly
                                        className="w-full pl-10 pr-4 py-2 border rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-not-allowed"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Rol
                                </label>
                                <input
                                    type="text"
                                    value={profile.role === 'admin' ? 'Administrador' : 'Comercial'}
                                    readOnly
                                    className="w-full px-4 py-2 border rounded-xl bg-gray-100 text-gray-500 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 cursor-not-allowed uppercase text-xs font-bold"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nombre Completo
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={profile.full_name}
                                    onChange={e => setProfile({ ...profile, full_name: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={profile.email}
                                    onChange={e => setProfile({ ...profile, email: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Nueva Contraseña (Opcional)
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 w-5 h-5 text-gray-400">🔒</span>
                                <input
                                    type="password"
                                    value={profile.password}
                                    onChange={e => setProfile({ ...profile, password: e.target.value })}
                                    placeholder="Dejar en blanco para no cambiar"
                                    className="w-full pl-10 pr-4 py-2 border rounded-xl focus:ring-2 focus:ring-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                                    <Bell className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-white">Notificaciones</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">Recibir alertas en tiempo real</p>
                                </div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={profile.notifications_enabled}
                                    onChange={e => setProfile({ ...profile, notifications_enabled: e.target.checked })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-300 dark:peer-focus:ring-orange-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-orange-500"></div>
                            </label>
                        </div>
                    </div>
                )}

                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </form>
        </Modal>
    );
};

export default ProfileModal;
