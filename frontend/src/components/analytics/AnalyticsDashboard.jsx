import React, { useState, useEffect } from 'react';
import { BarChart3 } from 'lucide-react';

const AnalyticsDashboard = () => {
    const [analytics, setAnalytics] = useState(null);
    const [funnel, setFunnel] = useState(null);
    const [period, setPeriod] = useState('7');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAnalytics();
        fetchFunnel();
    }, [period]);

    const fetchAnalytics = async () => {
        try {
            const response = await fetch(`http://localhost:3002/api/analytics/stats?period=${period}`);
            const data = await response.json();
            setAnalytics(data);
        } catch (error) {
            console.error('Error fetching analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchFunnel = async () => {
        try {
            const response = await fetch(`http://localhost:3002/api/analytics/funnel?period=30`);
            const data = await response.json();
            setFunnel(data);
        } catch (error) {
            console.error('Error fetching funnel:', error);
        }
    };

    if (loading) {
        return <div className="p-8 text-center">Cargando analytics...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400">
                        <BarChart3 className="w-5 h-5" />
                    </span>
                    Analytics
                </h2>
                <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                    <option value="7">Últimos 7 días</option>
                    <option value="30">Últimos 30 días</option>
                    <option value="90">Últimos 90 días</option>
                </select>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Total Visitas</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {analytics?.summary?.total_visits || 0}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Visitantes Únicos</div>
                    <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {analytics?.summary?.unique_visitors || 0}
                    </div>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tasa de Conversión</div>
                    <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                        {funnel?.conversionRate || 0}%
                    </div>
                </div>
            </div>

            {/* Conversion Funnel */}
            {funnel && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Embudo de Conversión (30 días)</h3>
                    <div className="space-y-3">
                        <FunnelStep label="Visitantes" value={funnel.visitors} percentage={100} />
                        <FunnelStep
                            label="Leads"
                            value={funnel.leads}
                            percentage={funnel.visitors > 0 ? (funnel.leads / funnel.visitors * 100) : 0}
                        />
                        <FunnelStep
                            label="Calificados"
                            value={funnel.qualified}
                            percentage={funnel.visitors > 0 ? (funnel.qualified / funnel.visitors * 100) : 0}
                        />
                        <FunnelStep
                            label="Propuestas"
                            value={funnel.proposals}
                            percentage={funnel.visitors > 0 ? (funnel.proposals / funnel.visitors * 100) : 0}
                        />
                        <FunnelStep
                            label="Conversiones"
                            value={funnel.conversions}
                            percentage={funnel.visitors > 0 ? (funnel.conversions / funnel.visitors * 100) : 0}
                            isLast
                        />
                    </div>
                </div>
            )}

            {/* Page Views */}
            <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Páginas Más Visitadas</h3>
                <div className="space-y-2">
                    {analytics?.pageViews?.map((page, idx) => (
                        <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                            <span className="text-gray-700 dark:text-gray-300">{page.page}</span>
                            <span className="font-semibold text-gray-900 dark:text-white">{page.views} vistas</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Referrers */}
            {analytics?.referrers && analytics.referrers.length > 0 && (
                <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-md border border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Fuentes de Tráfico</h3>
                    <div className="space-y-2">
                        {analytics.referrers.map((ref, idx) => (
                            <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                                <span className="text-gray-700 dark:text-gray-300 truncate">{ref.referrer}</span>
                                <span className="font-semibold text-gray-900 dark:text-white">{ref.count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const FunnelStep = ({ label, value, percentage, isLast }) => (
    <div className="relative">
        <div className="flex justify-between items-center mb-1">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">{value} ({percentage.toFixed(1)}%)</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
                className={`h-3 rounded-full transition-all ${isLast ? 'bg-green-500' : 'bg-purple-600'}`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    </div>
);

export default AnalyticsDashboard;
