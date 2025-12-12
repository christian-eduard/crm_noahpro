
import React, { useState, useEffect, useRef } from 'react';
import { Home, Users, MessageSquare, BarChart3, Settings, FileText, Mail, LogOut, User, Moon, Sun, ChevronDown, BookOpen, HeadphonesIcon, Menu, X } from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';
import AdminChatWidget from '../admin/chat/AdminChatWidget';
import ProfileModal from '../profile/ProfileModal';

import { usePusher } from '../../contexts/PusherContext';
import { useToast } from '../../contexts/ToastContext';

const CrmLayout = ({ children, onLogout, activeSection = 'leads', onSectionChange, onQuickAction }) => {
    const [theme, setTheme] = useState('light');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const userMenuRef = useRef(null);
    const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

    // Close user menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
                setShowUserMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const pusher = usePusher();
    const toast = useToast();

    useEffect(() => {
        if (pusher && user.notifications_enabled !== false) {
            const userId = user.id || user.userId;
            if (!userId) return;

            // Subscribe to user's private channel
            const channel = pusher.subscribe(`user_${userId}`);

            channel.bind('new_notification', (data) => {
                toast.info(data.message || 'Nueva notificación');
                // Dispatch event to update NotificationBell
                window.dispatchEvent(new Event('crm_notification_update'));
            });

            // Subscribe to admin notifications channel only if admin
            let adminChannel;
            if (user.role === 'admin') {
                adminChannel = pusher.subscribe('admin_notifications');
                adminChannel.bind('new_chat_message', (data) => {
                    toast.info(`Nuevo mensaje de chat: ${data.message}`);
                });
            }

            return () => {
                channel.unbind_all();
                channel.unsubscribe();
                if (adminChannel) {
                    adminChannel.unbind_all();
                    adminChannel.unsubscribe();
                }
            };
        }
    }, [pusher, toast, user.notifications_enabled, user.id, user.userId, user.role]);

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme') || 'light';
        setTheme(savedTheme);
        document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
    };

    const menuItems = [
        {
            id: 'home',
            label: 'Dashboard',
            icon: <Home className="w-5 h-5" />,
            description: 'Panel principal'
        },
        {
            id: 'leads',
            label: 'Leads',
            icon: <Users className="w-5 h-5" />,
            description: 'Gestión de leads'
        },
        {
            id: 'clients',
            label: 'Clientes',
            icon: <Users className="w-5 h-5" />,
            description: 'Cartera de clientes'
        },
        {
            id: 'training',
            label: 'Formación',
            icon: <BookOpen className="w-5 h-5" />,
            description: 'Material educativo',
            roles: ['commercial']
        },
        {
            id: 'support',
            label: 'Soporte',
            icon: <HeadphonesIcon className="w-5 h-5" />,
            description: 'Ayuda y tickets',
            roles: ['commercial']
        },
        {
            id: 'proposals',
            label: 'Propuestas',
            icon: <FileText className="w-5 h-5" />,
            description: 'Gestión de propuestas',
            roles: ['admin']
        },
        {
            id: 'invoices',
            label: 'Facturas',
            icon: <FileText className="w-5 h-5" />,
            description: 'Facturación y pagos',
            roles: ['admin']
        },
        {
            id: 'chat',
            label: 'Chat',
            icon: <MessageSquare className="w-5 h-5" />,
            description: 'Conversaciones',
            roles: ['admin']
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: <BarChart3 className="w-5 h-5" />,
            description: 'Métricas y reportes',
            roles: ['admin']
        },
        {
            id: 'commercials',
            label: 'Comerciales',
            icon: <Users className="w-5 h-5" />,
            description: 'Gestión de equipo',
            roles: ['admin']
        },
        {
            id: 'settings',
            label: 'Configuración',
            icon: <Settings className="w-5 h-5" />,
            description: 'Ajustes del sistema',
            roles: ['admin']
        }
    ];


    const filteredMenuItems = menuItems.filter(item => !item.roles || item.roles.includes(user.role || 'admin'));

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar - Hidden on mobile, shown on md+ */}
            <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-50 ${sidebarCollapsed ? 'w-20' : 'w-64'} hidden md:block`}>
                {/* Logo Section */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    {!sidebarCollapsed && (
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                                <span className="text-white font-bold text-lg">N</span>
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-gray-900 dark:text-white">NoahPro</h1>
                                <p className="text-xs text-gray-500 dark:text-gray-400">CRM Pro</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <svg className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                        </svg>
                    </button>
                </div>

                {/* Navigation Menu */}
                <nav className="p-3 space-y-1">
                    {filteredMenuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => item.onClick ? item.onClick() : onSectionChange && onSectionChange(item.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group ${activeSection === item.id
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <span className="text-2xl">{item.icon}</span>
                            {!sidebarCollapsed && (
                                <div className="flex-1 text-left">
                                    <p className="font-medium text-sm">{item.label}</p>
                                    <p className={`text-xs ${activeSection === item.id
                                        ? 'text-orange-100'
                                        : 'text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {item.description}
                                    </p>
                                </div>
                            )}
                            {item.badge && !sidebarCollapsed && (
                                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {item.badge}
                                </span>
                            )}
                        </button>
                    ))}
                </nav>


            </aside>

            {/* Mobile Sidebar */}
            <aside className={`fixed left-0 top-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 z-50 transform transition-transform duration-300 md:hidden ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                {/* Logo Section */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <span className="text-white font-bold text-lg">N</span>
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-gray-900 dark:text-white">NoahPro</h1>
                            <p className="text-xs text-gray-500 dark:text-gray-400">CRM Pro</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                    </button>
                </div>

                {/* Mobile Navigation Menu */}
                <nav className="p-3 space-y-1">
                    {filteredMenuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => {
                                item.onClick ? item.onClick() : onSectionChange && onSectionChange(item.id);
                                setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group ${activeSection === item.id
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/30'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <span className="text-2xl">{item.icon}</span>
                            <div className="flex-1 text-left">
                                <p className="font-medium text-sm">{item.label}</p>
                                <p className={`text-xs ${activeSection === item.id ? 'text-orange-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {item.description}
                                </p>
                            </div>
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content Area */}
            <div className={`flex-1 min-w-0 transition-all duration-300 ml-0 ${sidebarCollapsed ? 'md:ml-20' : 'md:ml-64'}`}>
                {/* Top Bar */}
                <header className={`h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 fixed top-0 right-0 z-30 shadow-sm transition-all duration-300 left-0 ${sidebarCollapsed ? 'md:left-20' : 'md:left-64'}`}>
                    <div className="h-full px-3 md:px-6 flex items-center justify-between">
                        {/* Mobile Menu Button */}
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors md:hidden"
                        >
                            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                        </button>

                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl hidden md:block">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar leads, propuestas, contactos..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-sm focus:ring-2 focus:ring-orange-500 dark:text-white placeholder-gray-500 transition-all"
                                />
                                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center space-x-4 ml-6">
                            {/* Help Button */}
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Ayuda">
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>

                            <NotificationBell />

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-600 dark:text-gray-300"
                                title={theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
                            >
                                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                            </button>

                            {/* Quick Actions - Only for Admin */}
                            {user.role !== 'commercial' && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowQuickActions(!showQuickActions)}
                                        className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-xl hover:shadow-lg hover:shadow-orange-500/30 transition-all font-medium text-sm flex items-center space-x-1"
                                    >
                                        <span>+ Nuevo</span>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {showQuickActions && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-40"
                                                onClick={() => setShowQuickActions(false)}
                                            />
                                            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                                                <div className="py-2">
                                                    <button
                                                        onClick={() => {
                                                            setShowQuickActions(false);
                                                            onQuickAction?.('lead');
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                                                    >
                                                        <span className="text-2xl">📝</span>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">Nuevo Lead</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Crear contacto manual</p>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowQuickActions(false);
                                                            onQuickAction?.('proposal');
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                                                    >
                                                        <span className="text-2xl">📄</span>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">Nueva Propuesta</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Crear oferta comercial</p>
                                                        </div>
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setShowQuickActions(false);
                                                            onQuickAction?.('meeting');
                                                        }}
                                                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-3"
                                                    >
                                                        <span className="text-2xl">📅</span>
                                                        <div>
                                                            <p className="font-medium text-gray-900 dark:text-white">Nueva Reunión</p>
                                                            <p className="text-xs text-gray-500 dark:text-gray-400">Agendar videollamada</p>
                                                        </div>
                                                    </button>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}

                            {/* User Profile Dropdown */}
                            <div className="relative" ref={userMenuRef}>
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center space-x-2 pl-4 border-l border-gray-200 dark:border-gray-700"
                                >
                                    {user.avatar_url ? (
                                        <img src={user.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover shadow-md" />
                                    ) : (
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-semibold shadow-md">
                                            {user.username ? user.username.charAt(0).toUpperCase() : 'U'}
                                        </div>
                                    )}
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">{user.full_name || user.username || 'Usuario'}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email || 'Sin email'}</p>
                                    </div>
                                    <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                </button>

                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
                                        <div className="py-1">
                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    setShowProfileModal(true);
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center space-x-2 text-gray-700 dark:text-gray-300"
                                            >
                                                <User className="w-4 h-4" />
                                                <span>Ver Perfil</span>
                                            </button>
                                            <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
                                            <button
                                                onClick={() => {
                                                    setShowUserMenu(false);
                                                    onLogout();
                                                }}
                                                className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center space-x-2 text-red-600 dark:text-red-400"
                                            >
                                                <LogOut className="w-4 h-4" />
                                                <span>Cerrar Sesión</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className={`transition-all duration-300 pt-20 p-3 md:p-6`}>
                    {children}
                </main>
            </div>
            {/* Floating Chat Widget */}
            {user.role === 'admin' && <AdminChatWidget />}

            {/* Profile Modal */}
            <ProfileModal
                isOpen={showProfileModal}
                onClose={() => setShowProfileModal(false)}
                onUpdate={(updatedUser) => {
                    setUser(updatedUser);
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                }}
            />
        </div>
    );
};

export default CrmLayout;
