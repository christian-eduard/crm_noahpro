import React, { useState, useEffect } from 'react';
import { User, ChevronDown, Check } from 'lucide-react';
import { API_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';

/**
 * UserSelect - Componente para asignar usuarios
 * @param {string|number} currentUserId - ID del usuario actualmente asignado
 * @param {Function} onAssign - Callback cuando se selecciona un usuario (userId)
 * @param {boolean} compact - Si es true, muestra solo el avatar/iniciales hasta hacer hover
 */
const UserSelect = ({ currentUserId, onAssign, compact = false }) => {
    const [users, setUsers] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const token = localStorage.getItem('crm_token');

    // Fetch users on mount or open
    useEffect(() => {
        if (isOpen && users.length === 0) {
            fetchUsers();
        }
    }, [isOpen]);

    // También cargar si ya hay un usuario asignado para mostrar su nombre
    useEffect(() => {
        if (currentUserId && users.length === 0) {
            fetchUsers();
        }
    }, [currentUserId]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${API_URL}/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                // Filtrar solo usuarios activos si es necesario
                setUsers(data.filter(u => u.status !== 'inactive'));
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssign = async (userId) => {
        // Optimistic update handled by parent, but we close dropdown
        setIsOpen(false);
        if (onAssign) {
            await onAssign(userId);
        }
    };

    const currentUser = users.find(u => u.id === currentUserId) || null;

    const getInitials = (name) => {
        return name
            ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
            : 'Un';
    };

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (isOpen && !event.target.closest('.user-select-container')) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    return (
        <div className="relative user-select-container">
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className={`flex items-center gap-2 rounded-full transition-all ${compact
                        ? 'p-1 hover:bg-gray-100 dark:hover:bg-gray-700'
                        : 'px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100'
                    }`}
                title={currentUser ? `Asignado a: ${currentUser.name}` : 'Sin asignar'}
            >
                {/* Avatar / Icon */}
                <div className={`flex items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-bold ${compact ? 'w-6 h-6 text-xs' : 'w-5 h-5 text-[10px]'}`}>
                    {currentUser ? getInitials(currentUser.name) : <User className="w-3 h-3" />}
                </div>

                {/* Name & Chevron (Hidden in compact mode) */}
                {!compact && (
                    <>
                        <span className="text-sm text-gray-700 dark:text-gray-300 truncate max-w-[100px]">
                            {currentUser ? currentUser.name : 'Asignar'}
                        </span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                    </>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-50 animate-fadeIn">
                    <div className="p-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="text-xs font-semibold text-gray-500 uppercase px-2">Asignar Lead</p>
                    </div>

                    <div className="max-h-60 overflow-y-auto py-1">
                        {loading && users.length === 0 ? (
                            <div className="px-4 py-2 text-sm text-gray-500">Cargando usuarios...</div>
                        ) : (
                            <>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleAssign(null);
                                    }}
                                    className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between group"
                                >
                                    <span className="text-gray-500 italic">Sin asignar</span>
                                    {!currentUserId && <Check className="w-4 h-4 text-green-500" />}
                                </button>

                                {users.map(user => (
                                    <button
                                        key={user.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleAssign(user.id);
                                        }}
                                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between text-gray-700 dark:text-gray-200"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                                                {getInitials(user.name)}
                                            </div>
                                            <span>{user.name}</span>
                                        </div>
                                        {currentUserId === user.id && <Check className="w-4 h-4 text-green-500" />}
                                    </button>
                                ))}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserSelect;
