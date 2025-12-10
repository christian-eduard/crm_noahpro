import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Users, Sparkles, FileText, Trophy, Plus } from 'lucide-react';
import DashboardCalendar from '../calendar/DashboardCalendar';
import TaskModal from '../modals/TaskModal';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const DashboardHome = () => {
    const [stats, setStats] = useState({
        totalLeads: 0,
        newLeads: 0,
        activeProposals: 0,
        wonDeals: 0,
        conversionRate: 0,
        revenue: 0
    });

    const [recentActivity, setRecentActivity] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [editMode, setEditMode] = useState(false);

    // Default layout configuration - Flexible 12-column grid
    const defaultLayout = {
        lg: [
            { i: 'stats', x: 0, y: 0, w: 12, h: 2, minW: 12, maxW: 12, minH: 2, maxH: 2 },
            { i: 'conversion', x: 0, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
            { i: 'revenue', x: 4, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
            { i: 'activity', x: 8, y: 2, w: 4, h: 4, minW: 3, minH: 3 },
            { i: 'tasks', x: 0, y: 6, w: 6, h: 5, minW: 4, minH: 4 },
            { i: 'calendar', x: 6, y: 6, w: 6, h: 6, minW: 6, minH: 5 }
        ],
        md: [
            { i: 'stats', x: 0, y: 0, w: 12, h: 2, minW: 12, maxW: 12, minH: 2, maxH: 2 },
            { i: 'conversion', x: 0, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
            { i: 'revenue', x: 6, y: 2, w: 6, h: 4, minW: 4, minH: 3 },
            { i: 'activity', x: 0, y: 6, w: 12, h: 4, minW: 6, minH: 3 },
            { i: 'tasks', x: 0, y: 10, w: 6, h: 5, minW: 4, minH: 4 },
            { i: 'calendar', x: 6, y: 10, w: 6, h: 6, minW: 6, minH: 5 }
        ],
        sm: [
            { i: 'stats', x: 0, y: 0, w: 12, h: 2, minW: 12, maxW: 12, minH: 2, maxH: 2 },
            { i: 'conversion', x: 0, y: 2, w: 12, h: 3, minW: 12, minH: 3 },
            { i: 'revenue', x: 0, y: 5, w: 12, h: 3, minW: 12, minH: 3 },
            { i: 'activity', x: 0, y: 8, w: 12, h: 4, minW: 12, minH: 3 },
            { i: 'tasks', x: 0, y: 12, w: 12, h: 4, minW: 12, minH: 4 },
            { i: 'calendar', x: 0, y: 16, w: 12, h: 6, minW: 12, minH: 5 }
        ]
    };

    const [layouts, setLayouts] = useState(() => {
        const savedLayouts = localStorage.getItem('dashboardLayouts');
        return savedLayouts ? JSON.parse(savedLayouts) : defaultLayout;
    });

    useEffect(() => {
        fetchDashboardData();
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch('http://localhost:3002/api/tasks?completed=false', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setTasks(data);
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
        }
    };

    const handleSaveTask = async (taskData) => {
        try {
            const url = editingTask
                ? `http://localhost:3002/api/tasks/${editingTask.id}`
                : 'http://localhost:3002/api/tasks';

            const method = editingTask ? 'PUT' : 'POST';
            const token = localStorage.getItem('crm_token');

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(taskData)
            });

            if (response.ok) {
                fetchTasks();
                setEditingTask(null);
            }
        } catch (error) {
            console.error('Error saving task:', error);
        }
    };

    const handleToggleTask = async (taskId) => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`http://localhost:3002/api/tasks/${taskId}/toggle`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchTasks();
            }
        } catch (error) {
            console.error('Error toggling task:', error);
        }
    };

    const handleDeleteTask = async (taskId) => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`http://localhost:3002/api/tasks/${taskId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchTasks();
            }
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    const fetchDashboardData = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch('http://localhost:3002/api/leads', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const leads = await response.json();

                const newLeads = leads.filter(l => l.status === 'new').length;
                const wonDeals = leads.filter(l => l.status === 'won').length;
                const conversionRate = leads.length > 0 ? ((wonDeals / leads.length) * 100).toFixed(1) : 0;

                setStats({
                    totalLeads: leads.length,
                    newLeads,
                    activeProposals: leads.filter(l => l.status === 'proposal_sent').length,
                    wonDeals,
                    conversionRate,
                    revenue: wonDeals * 2500
                });

                setRecentActivity([
                    { id: 1, type: 'lead', description: 'Nuevo lead: Ana García', time: 'Hace 5 min', icon: '👤' },
                    { id: 2, type: 'proposal', description: 'Propuesta enviada a Hotel Playa Azul', time: 'Hace 1 hora', icon: '📄' },
                    { id: 3, type: 'won', description: 'Deal ganado: Burger Express', time: 'Hace 2 horas', icon: '🎉' },
                    { id: 4, type: 'meeting', description: 'Reunión agendada con Pizzería Napoli', time: 'Hace 3 horas', icon: '📅' }
                ]);
            }
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
        }
    };

    const handleLayoutChange = (layout, layouts) => {
        setLayouts(layouts);
        localStorage.setItem('dashboardLayouts', JSON.stringify(layouts));
    };

    const statCards = [
        {
            label: 'Total Leads',
            value: stats.totalLeads,
            icon: <Users className="w-6 h-6" />,
            color: 'blue',
            change: '+12%',
            progress: 75
        },
        {
            label: 'Nuevos',
            value: stats.newLeads,
            icon: <Sparkles className="w-6 h-6" />,
            color: 'green',
            change: '+5%',
            progress: 60
        },
        {
            label: 'Propuestas Activas',
            value: stats.activeProposals,
            icon: <FileText className="w-6 h-6" />,
            color: 'yellow',
            change: '+8%',
            progress: 45
        },
        {
            label: 'Deals Ganados',
            value: stats.wonDeals,
            icon: <Trophy className="w-6 h-6" />,
            color: 'purple',
            change: '+3%',
            progress: 30
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-700',
            green: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700',
            yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700',
            purple: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700'
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Vista general de tu CRM
                    </p>
                </div>
                <div className="flex items-center space-x-3">
                    {editMode ? (
                        <>
                            <button
                                onClick={() => setEditMode(false)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                <span>Guardar Layout</span>
                            </button>
                            <button
                                onClick={() => {
                                    localStorage.removeItem('dashboardLayouts');
                                    setLayouts(defaultLayout);
                                }}
                                className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                            >
                                🔄 Restaurar
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={() => setEditMode(true)}
                            className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Editar Layout</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Draggable Grid Layout */}
            <ResponsiveGridLayout
                className="layout"
                layouts={layouts}
                breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
                cols={{ lg: 12, md: 12, sm: 12, xs: 12, xxs: 12 }}
                rowHeight={80}
                onLayoutChange={handleLayoutChange}
                draggableHandle=".drag-handle"
                margin={[16, 16]}
                containerPadding={[0, 0]}
                style={{ width: '100%' }}
                isDraggable={editMode}
                isResizable={editMode}
                resizeHandles={['se', 'sw', 'ne', 'nw']}
            >
                {/* Stats Cards - Fixed Position */}
                <div key="stats" className="bg-transparent">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 h-full">
                        {statCards.map((stat, index) => (
                            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                                <div className="flex items-center justify-between mb-3">
                                    <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${getColorClasses(stat.color)}`}>
                                        {stat.icon}
                                    </div>
                                    <span className="text-xs font-medium text-green-600 dark:text-green-400">{stat.change}</span>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.label}</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{stat.value}</p>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-3">
                                    <div
                                        className="h-1.5 rounded-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-500"
                                        style={{ width: `${stat.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Conversion Rate Widget */}
                <div key="conversion" className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="drag-handle p-4 border-b border-gray-200 dark:border-gray-700 cursor-move bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tasa de Conversión</h3>
                    </div>
                    <div className="p-6">
                        <div className="text-center">
                            <div className="text-5xl font-bold text-orange-600 dark:text-orange-400 mb-2">
                                {stats.conversionRate}%
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                Leads convertidos a clientes
                            </p>
                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                <div
                                    className="h-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 transition-all duration-500"
                                    style={{ width: `${stats.conversionRate}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Revenue Widget */}
                <div key="revenue" className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="drag-handle p-4 border-b border-gray-200 dark:border-gray-700 cursor-move bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Ingresos Estimados</h3>
                    </div>
                    <div className="p-6">
                        <div className="text-center">
                            <div className="text-4xl font-bold text-green-600 dark:text-green-400 mb-2">
                                €{stats.revenue.toLocaleString()}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                                De {stats.wonDeals} deals ganados
                            </p>
                            <div className="flex items-center justify-center space-x-2 text-sm">
                                <span className="text-green-600 dark:text-green-400">↗</span>
                                <span className="text-gray-600 dark:text-gray-400">+15% vs mes anterior</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Widget */}
                <div key="activity" className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="drag-handle p-4 border-b border-gray-200 dark:border-gray-700 cursor-move bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Actividad Reciente</h3>
                    </div>
                    <div className="p-4 space-y-3 overflow-y-auto" style={{ maxHeight: 'calc(100% - 60px)' }}>
                        {recentActivity.map((activity) => (
                            <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                <span className="text-2xl flex-shrink-0">{activity.icon}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                        {activity.description}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Tasks Widget */}
                <div key="tasks" className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="drag-handle p-4 border-b border-gray-200 dark:border-gray-700 cursor-move bg-gray-50 dark:bg-gray-900/50 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tareas Pendientes</h3>
                        <button
                            onClick={() => {
                                setEditingTask(null);
                                setShowTaskModal(true);
                            }}
                            className="p-1.5 hover:bg-orange-100 dark:hover:bg-orange-900/30 rounded-lg transition-colors"
                        >
                            <Plus className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                        </button>
                    </div>
                    <div className="p-4 space-y-2 overflow-y-auto" style={{ maxHeight: 'calc(100% - 60px)' }}>
                        {tasks.length === 0 ? (
                            <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                                No hay tareas pendientes
                            </p>
                        ) : (
                            tasks.map((task) => (
                                <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg group hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={task.completed}
                                        onChange={() => handleToggleTask(task.id)}
                                        className="w-4 h-4 text-orange-600 rounded cursor-pointer focus:ring-orange-500"
                                    />
                                    <span className={`text-sm flex-1 ${task.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                                        {task.title}
                                    </span>
                                    <button
                                        onClick={() => handleDeleteTask(task.id)}
                                        className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs transition-opacity"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Calendar Widget */}
                <div key="calendar" className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                    <div className="drag-handle p-4 border-b border-gray-200 dark:border-gray-700 cursor-move bg-gray-50 dark:bg-gray-900/50">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Calendario</h3>
                    </div>
                    <div className="p-4" style={{ height: 'calc(100% - 60px)' }}>
                        <DashboardCalendar />
                    </div>
                </div>
            </ResponsiveGridLayout>

            {/* Task Modal - Rendered via Portal */}
            {ReactDOM.createPortal(
                <TaskModal
                    isOpen={showTaskModal}
                    onClose={() => {
                        setShowTaskModal(false);
                        setEditingTask(null);
                    }}
                    onSave={handleSaveTask}
                    task={editingTask}
                />,
                document.body
            )}
        </div>
    );
};

export default DashboardHome;
