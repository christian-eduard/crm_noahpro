import React, { useMemo } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './LeadsCalendarView.css';

const localizer = momentLocalizer(moment);

const LeadsCalendarView = ({ leads, onLeadClick, statuses = [] }) => {
    // Helper function to get color for a status
    const getStatusColor = (leadStatus) => {
        // Find the matching status configuration
        const status = statuses.find(s => {
            // Direct match (numeric ID)
            if (leadStatus === s.id) return true;
            // Loose equality for string vs number
            if (leadStatus == s.id) return true;
            // Name match (fallback for legacy data)
            if (leadStatus === s.name) return true;

            // Specific legacy mapping (using actual DB IDs)
            if (s.id === 7 && leadStatus === 'new') return true;
            if (s.id === 8 && (leadStatus === 'contacted' || leadStatus === 'qualified' || leadStatus === 'proposal_sent')) return true;
            if (s.id === 9 && leadStatus === 'won') return true;
            if (s.id === 10 && leadStatus === 'lost') return true;

            return false;
        });

        if (!status) {
            return { backgroundColor: '#64748b', borderColor: '#475569' };
        }

        const colorMap = {
            blue: { backgroundColor: '#3b82f6', borderColor: '#2563eb' },
            yellow: { backgroundColor: '#eab308', borderColor: '#ca8a04' },
            purple: { backgroundColor: '#a855f7', borderColor: '#9333ea' },
            orange: { backgroundColor: '#f97316', borderColor: '#ea580c' },
            green: { backgroundColor: '#22c55e', borderColor: '#16a34a' },
            red: { backgroundColor: '#ef4444', borderColor: '#dc2626' },
            gray: { backgroundColor: '#64748b', borderColor: '#475569' }
        };

        return colorMap[status.color] || { backgroundColor: '#64748b', borderColor: '#475569' };
    };

    // Convert leads to calendar events
    const events = useMemo(() => {
        return leads.map(lead => ({
            id: lead.id,
            title: `${lead.name} - ${lead.business_name || 'Sin empresa'}`,
            start: new Date(lead.created_at),
            end: new Date(lead.created_at),
            resource: lead,
            allDay: true
        }));
    }, [leads]);

    const eventStyleGetter = (event) => {
        const lead = event.resource;
        const colorStyle = getStatusColor(lead.status);

        return {
            style: {
                ...colorStyle,
                borderRadius: '4px',
                opacity: 0.9,
                color: 'white',
                border: `2px solid ${colorStyle.borderColor}`,
                display: 'block',
                fontSize: '0.875rem',
                padding: '2px 4px'
            }
        };
    };

    const handleSelectEvent = (event) => {
        onLeadClick(event.resource);
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Vista de Calendario</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Leads organizados por fecha de creación
                </p>
            </div>

            {/* Legend - Dynamic from database */}
            <div className="flex flex-wrap gap-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                {statuses.map(status => {
                    const colorStyle = getStatusColor(status.id || status.value);
                    return (
                        <div key={status.id || status.value} className="flex items-center space-x-2">
                            <div
                                className="w-4 h-4 rounded"
                                style={{ backgroundColor: colorStyle.backgroundColor }}
                            ></div>
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                                {status.name || status.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Calendar */}
            <div className="h-[600px]">
                <Calendar
                    localizer={localizer}
                    events={events}
                    startAccessor="start"
                    endAccessor="end"
                    style={{ height: '100%' }}
                    eventPropGetter={eventStyleGetter}
                    onSelectEvent={handleSelectEvent}
                    views={['month', 'week', 'day']}
                    defaultView="month"
                    popup
                />
            </div>
        </div>
    );
};

export default LeadsCalendarView;
