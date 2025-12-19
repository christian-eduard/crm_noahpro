import React, { useState, useEffect } from 'react';
import { Users, Search, Target, CheckCircle, ChevronRight, User } from 'lucide-react';

const TeamDashboard = ({ API_URL, token, onSelectCommercial }) => {
    const [team, setTeam] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTeam();
    }, []);

    const fetchTeam = async () => {
        try {
            const res = await fetch(`${API_URL}/hunter/admin/team`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setTeam(await res.json());
            }
        } catch (error) {
            console.error('Error loading team:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Cargando equipo...</div>;

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-orange-500" />
                Actividad del Equipo Comercial
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {team.map(member => (
                    <div
                        key={member.id}
                        onClick={() => onSelectCommercial(member)}
                        className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full text-orange-600 dark:text-orange-400">
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white">{member.full_name}</h4>
                                    <p className="text-xs text-gray-500">{member.email}</p>
                                </div>
                            </div>
                            <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-orange-500 transition-colors" />
                        </div>

                        <div className="grid grid-cols-3 gap-2 text-center divide-x divide-gray-100 dark:divide-gray-700">
                            <div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">{member.total_searches}</div>
                                <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                    <Search className="w-3 h-3" /> Búsquedas
                                </div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-gray-900 dark:text-white">{member.total_prospects}</div>
                                <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                    <Target className="w-3 h-3" /> Prospectos
                                </div>
                            </div>
                            <div>
                                <div className="text-lg font-bold text-green-600 dark:text-green-400">{member.leads_generated}</div>
                                <div className="text-xs text-gray-500 flex items-center justify-center gap-1">
                                    <CheckCircle className="w-3 h-3" /> Leads
                                </div>
                            </div>
                        </div>
                    </div>
                ))}

                {team.length === 0 && (
                    <div className="col-span-full p-8 text-center bg-gray-50 dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-700 text-gray-500">
                        No hay comerciales activos en Lead Hunter.
                    </div>
                )}
            </div>
        </div>
    );
};

export default TeamDashboard;
