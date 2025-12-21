import React, { useState, useEffect } from 'react';
import {
    Activity, Clock, Mail, Phone, MessageSquare,
    Tag, UserPlus, FileText, RefreshCw, AlertCircle,
    CheckCircle, XCircle, Edit3, Trash2, ArrowRight
} from 'lucide-react';
import { API_URL } from '../../config';

/**
 * ActivityTimeline - Muestra el historial de actividades de un lead
 * @param {number} leadId - ID del lead
 * @param {boolean} compact - Modo compacto (menos detalles)
 */
const ActivityTimeline = ({ leadId, compact = false }) => {
    const [activities, setActivities] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const token = localStorage.getItem('crm_token');

    useEffect(() => {
        if (leadId) {
            fetchActivities();
        }
    }, [leadId]);

    const fetchActivities = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_URL}/activities/${leadId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setActivities(data);
            } else if (response.status === 404) {
                setActivities([]);
            } else {
                throw new Error('Error al cargar actividades');
            }
        } catch (err) {
            console.error('Error fetching activities:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const getActivityIcon = (type) => {
        const icons = {
            'status_change': <ArrowRight className="w-4 h-4" />,
            'tag_added': <Tag className="w-4 h-4" />,
            'tag_removed': <Tag className="w-4 h-4" />,
            'assigned': <UserPlus className="w-4 h-4" />,
            'note_added': <Edit3 className="w-4 h-4" />,
            'email_sent': <Mail className="w-4 h-4" />,
            'email_opened': <Mail className="w-4 h-4" />,
            'call_made': <Phone className="w-4 h-4" />,
            'proposal_sent': <FileText className="w-4 h-4" />,
            'proposal_viewed': <FileText className="w-4 h-4" />,
            'proposal_accepted': <CheckCircle className="w-4 h-4" />,
            'proposal_rejected': <XCircle className="w-4 h-4" />,
            'comment_added': <MessageSquare className="w-4 h-4" />,
            'lead_created': <Activity className="w-4 h-4" />,
            'lead_deleted': <Trash2 className="w-4 h-4" />,
            'default': <Activity className="w-4 h-4" />
        };
        return icons[type] || icons.default;
    };

    const getActivityColor = (type) => {
        const colors = {
            'status_change': 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            'tag_added': 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
            'tag_removed': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
            'assigned': 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
            'note_added': 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
            'email_sent': 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            'email_opened': 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            'call_made': 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
            'proposal_sent': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
            'proposal_viewed': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
            'proposal_accepted': 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            'proposal_rejected': 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
            'comment_added': 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
            'lead_created': 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400',
            'default': 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
        };
        return colors[type] || colors.default;
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Ahora mismo';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;

        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8">
                <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-red-500">
                <AlertCircle className="w-5 h-5 mr-2" />
                <span className="text-sm">{error}</span>
            </div>
        );
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-8">
                <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay actividades registradas</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-400" />
                    Historial de Actividad
                </h4>
                <button
                    onClick={fetchActivities}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    title="Actualizar"
                >
                    <RefreshCw className="w-4 h-4 text-gray-400" />
                </button>
            </div>

            <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700" />

                <div className="space-y-4">
                    {activities.map((activity, index) => (
                        <div key={activity.id || index} className="relative flex items-start gap-4 ml-0">
                            {/* Icon */}
                            <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full ${getActivityColor(activity.type)}`}>
                                {getActivityIcon(activity.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-3 border border-gray-100 dark:border-gray-700">
                                <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm text-gray-800 dark:text-gray-200 font-medium">
                                        {activity.description}
                                    </p>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap">
                                        {formatDate(activity.created_at)}
                                    </span>
                                </div>

                                {!compact && activity.metadata && (
                                    <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                                        {activity.metadata.from && activity.metadata.to && (
                                            <span>
                                                {activity.metadata.from} → {activity.metadata.to}
                                            </span>
                                        )}
                                        {activity.metadata.tag_name && (
                                            <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-700 rounded-full">
                                                #{activity.metadata.tag_name}
                                            </span>
                                        )}
                                    </div>
                                )}

                                {activity.user_name && (
                                    <p className="mt-1 text-[10px] text-gray-400">
                                        por {activity.user_name}
                                    </p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ActivityTimeline;
