import { API_URL, SOCKET_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon } from 'lucide-react';
import EventModal from '../modals/EventModal';

const DashboardCalendar = ({ compact = false }) => {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [events, setEvents] = useState([]);
    const [selectedDate, setSelectedDate] = useState(null);
    const [showEventModal, setShowEventModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [leads, setLeads] = useState([]);

    useEffect(() => {
        fetchEvents();
        fetchLeads();
    }, [currentDate]);

    const fetchEvents = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/calendar/events`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                if (data.length === 0) {
                    setEvents([]);
                } else {
                    setEvents(data.map(event => ({
                        ...event,
                        date: new Date(event.start_time)
                    })));
                }
            }
        } catch (error) {
            console.error('Error fetching events:', error);
            setEvents([]);
        }
    };

    const fetchLeads = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/leads`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                const data = await response.json();
                setLeads(data);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        }
    };

    const handleSaveEvent = async (eventData) => {
        try {
            const url = editingEvent
                ? `${API_URL}/calendar/events/${editingEvent.id}`
                : `${API_URL}/calendar/events`;

            const method = editingEvent ? 'PUT' : 'POST';
            const token = localStorage.getItem('crm_token');

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(eventData)
            });

            if (response.ok) {
                fetchEvents();
                setEditingEvent(null);
            }
        } catch (error) {
            console.error('Error saving event:', error);
        }
    };

    const handleDeleteEvent = async (eventId) => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/calendar/events/${eventId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                fetchEvents();
            }
        } catch (error) {
            console.error('Error deleting event:', error);
        }
    };

    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();

        return { daysInMonth, startingDayOfWeek };
    };

    const getEventsForDate = (date) => {
        return events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate.getDate() === date.getDate() &&
                eventDate.getMonth() === date.getMonth() &&
                eventDate.getFullYear() === date.getFullYear();
        });
    };

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);
    const monthName = currentDate.toLocaleString('es-ES', { month: 'long', year: 'numeric' });

    const renderCalendarDays = () => {
        const days = [];
        const today = new Date();

        // Empty cells for days before month starts
        for (let i = 0; i < startingDayOfWeek; i++) {
            days.push(
                <div key={`empty-${i}`} className="min-h-[120px] bg-gray-50/30 dark:bg-gray-800/30 border-b border-r border-gray-200 dark:border-gray-700"></div>
            );
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            const dayEvents = getEventsForDate(date);
            const isToday = date.toDateString() === today.toDateString();
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

            days.push(
                <div
                    key={day}
                    onClick={() => setSelectedDate(date)}
                    className={`min-h-[120px] p-2 border-b border-r border-gray-200 dark:border-gray-700 transition-colors relative group
                        ${isToday ? 'bg-orange-50/50 dark:bg-orange-900/10' : 'bg-white dark:bg-gray-800'}
                        ${isSelected ? 'ring-2 ring-inset ring-orange-500 z-10' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}
                    `}
                >
                    <div className="flex justify-between items-start mb-1">
                        <span className={`
                            text-sm font-semibold w-7 h-7 flex items-center justify-center rounded-full
                            ${isToday ? 'bg-orange-600 text-white' : 'text-gray-700 dark:text-gray-300'}
                        `}>
                            {day}
                        </span>
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setEditingEvent(null);
                                // Pre-fill date in modal if needed, or just open empty
                                setShowEventModal(true);
                            }}
                            className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-opacity"
                        >
                            <Plus className="w-3 h-3 text-gray-500" />
                        </button>
                    </div>

                    <div className="space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                        {dayEvents.map(event => (
                            <div
                                key={event.id}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditingEvent(event);
                                    setShowEventModal(true);
                                }}
                                className={`
                                    text-xs px-2 py-1 rounded cursor-pointer truncate border-l-2 shadow-sm transition-all hover:brightness-95
                                    ${event.type === 'meeting' ? 'bg-blue-100 text-blue-700 border-blue-500 dark:bg-blue-900/40 dark:text-blue-200' :
                                        event.type === 'call' ? 'bg-green-100 text-green-700 border-green-500 dark:bg-green-900/40 dark:text-green-200' :
                                            event.type === 'demo' ? 'bg-purple-100 text-purple-700 border-purple-500 dark:bg-purple-900/40 dark:text-purple-200' :
                                                'bg-gray-100 text-gray-700 border-gray-500 dark:bg-gray-700 dark:text-gray-300'}
                                `}
                                title={`${event.title} (${new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`}
                            >
                                <span className="font-medium mr-1">
                                    {new Date(event.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {event.title}
                            </div>
                        ))}
                    </div>
                </div>
            );
        }

        return days;
    };

    if (compact) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <CalendarIcon className="w-5 h-5" />
                        <span>Calendario</span>
                    </h3>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={previousMonth}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">
                            {monthName}
                        </span>
                        <button
                            onClick={nextMonth}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                        >
                            <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 text-xs">
                    {['D', 'L', 'M', 'X', 'J', 'V', 'S'].map(day => (
                        <div key={day} className="text-center font-medium text-gray-500 dark:text-gray-400 p-1">
                            {day}
                        </div>
                    ))}
                    {renderCalendarDays()}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Calendario</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        Gestiona tus reuniones y eventos
                    </p>
                </div>
                <button
                    onClick={() => {
                        setEditingEvent(null);
                        setShowEventModal(true);
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2"
                >
                    <Plus className="w-4 h-4" />
                    <span>Nuevo Evento</span>
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                            {monthName}
                        </h2>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={previousMonth}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                            <button
                                onClick={nextMonth}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                            >
                                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 border-l border-t border-gray-200 dark:border-gray-700">
                        {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(day => (
                            <div key={day} className="text-center font-semibold text-sm text-gray-600 dark:text-gray-400 p-3 border-b border-r border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                                {day}
                            </div>
                        ))}
                        {renderCalendarDays()}
                    </div>
                </div>

                {/* Events List Side Panel */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 flex flex-col">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-between">
                        <span>Próximos Eventos</span>
                        <span className="text-xs font-normal text-gray-500 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full">
                            {events.length} total
                        </span>
                    </h3>
                    <div className="space-y-3 overflow-y-auto flex-1 pr-2 custom-scrollbar" style={{ maxHeight: '500px' }}>
                        {events.slice(0, 5).map(event => (
                            <div
                                key={event.id}
                                className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                                onClick={() => {
                                    setEditingEvent(event);
                                    setShowEventModal(true);
                                }}
                            >
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    {event.title}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {new Date(event.date).toLocaleString('es-ES', {
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Event Modal - Rendered via Portal */}
            {ReactDOM.createPortal(
                <EventModal
                    isOpen={showEventModal}
                    onClose={() => {
                        setShowEventModal(false);
                        setEditingEvent(null);
                    }}
                    onSave={handleSaveEvent}
                    event={editingEvent}
                    leads={leads}
                />,
                document.body
            )}
        </div>
    );
};

export default DashboardCalendar;
