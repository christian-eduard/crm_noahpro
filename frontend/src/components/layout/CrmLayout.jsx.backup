import React, { useState, useEffect } from 'react';
import { Home, Users, MessageSquare, BarChart3, Settings } from 'lucide-react';
import NotificationBell from '../notifications/NotificationBell';

const CrmLayout = ({ children, onLogout, activeSection = 'leads', onSectionChange, onQuickAction }) => {
    const [theme, setTheme] = useState('light');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [showQuickActions, setShowQuickActions] = useState(false);

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
            label: 'Inicio',
            icon: <Home className="w-5 h-5" />,
            description: 'Dashboard principal'
        },
        {
            id: 'leads',
            label: 'Leads',
            icon: <Users className="w-5 h-5" />,
            description: 'Gestión de leads'
        },
        {
            id: 'chat',
            label: 'Chat',
            icon: <MessageSquare className="w-5 h-5" />,
            description: 'Conversaciones',
            badge: null
        },
        {
            id: 'analytics',
            label: 'Analytics',
            icon: <BarChart3 className="w-5 h-5" />,
            description: 'Métricas y reportes'
        },
        {
            id: 'settings',
            label: 'Configuración',
            icon: <Settings className="w-5 h-5" />,
            description: 'Ajustes del sistema'
        }
    ];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
            {/* Sidebar */}
            <aside className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 z-40 ${sidebarCollapsed ? 'w-20' : 'w-64'
                }`}>
                {/* Logo Section */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    {!sidebarCollapsed && (
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                <span className="text-white font-bold text-lg">S</span>
                            </div>
                            <div>
                                <h1 className="text-sm font-bold text-gray-900 dark:text-white">Stormsboys</h1>
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
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onSectionChange && onSectionChange(item.id)}
                            className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group ${activeSection === item.id
                                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                }`}
                        >
                            <span className="text-2xl">{item.icon}</span>
                            {!sidebarCollapsed && (
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                                        <span className="text-white font-bold text-lg">S</span>
                                    </div>
                                    <div>
                                        <h1 className="text-sm font-bold text-gray-900 dark:text-white">Stormsboys</h1>
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

                        {/* Navigation Menu */ }
                        < nav className = "p-3 space-y-1" >
                        {
                            menuItems.map(item => (
                                <button
                                    key={item.id}
                                    onClick={() => onSectionChange && onSectionChange(item.id)}
                                    className={`w-full flex items-center space-x-3 px-3 py-3 rounded-xl transition-all group ${activeSection === item.id
                                        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-blue-500/50'
                                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                >
                                    <span className="text-2xl">{item.icon}</span>
                                    {!sidebarCollapsed && (
                                        <div className="flex-1 text-left">
                                            <p className="font-medium text-sm">{item.label}</p>
                                            <p className={`text-xs ${activeSection === item.id
                                                ? 'text-blue-100'
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
                            ))
                        }
                        </nav>

                {/* Bottom Section */}
                <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center space-x-3 px-3 py-3 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors mb-2"
                    >
                        <span className="text-xl">
                            {theme === 'light' ? '🌙' : '☀️'}
                        </span>
                        {!sidebarCollapsed && (
                            <span className="text-sm font-medium">
                                {theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
                            </span>
                        )}
                    </button>

                    {/* User Profile */}
                    <div className={`flex items-center space-x-3 px-3 py-3 rounded-xl bg-gray-50 dark:bg-gray-700/50 ${sidebarCollapsed ? 'justify-center' : ''
                        }`}>
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg">
                            A
                        </div>
                        {!sidebarCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">Admin</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">admin@stormsboys.com</p>
                            </div>
                        )}
                        {!sidebarCollapsed && (
                            <button
                                onClick={onLogout}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors group"
                                title="Cerrar sesión"
                            >
                                <svg className="w-4 h-4 text-gray-400 group-hover:text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className={`flex-1 transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-64'}`}>
                {/* Top Bar */}
                <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-30 shadow-sm">
                    <div className="h-full px-6 flex items-center justify-between">
                        {/* Search Bar */}
                        <div className="flex-1 max-w-2xl">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar leads, propuestas, contactos..."
                                    className="w-full pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border-0 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 dark:text-white placeholder-gray-500 transition-all"
                                />
                                <svg className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </div>

                        {/* Right Actions */}
                        <div className="flex items-center space-x-4 ml-6">
                            {/* Quick Actions */}
                            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors" title="Ayuda">
                                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>

                            <NotificationBell />

                            {/* Quick Actions */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowQuickActions(!showQuickActions)}
                                    className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all font-medium text-sm flex items-center space-x-1"
                                >
                                    <span>+ Nuevo</span>
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {showQuickActions && (
                                    <>
                                        {/* Backdrop to close */}
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowQuickActions(false)}
                                        />

                                        {/* Dropdown Menu */}
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
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-6">
                    <div className="max-w-[1600px] mx-auto">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default CrmLayout;
