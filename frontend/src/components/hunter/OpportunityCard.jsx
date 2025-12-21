import React from 'react';
import { Target, DollarSign, Sparkles, Search, MapPin } from 'lucide-react';
import Button from '../shared/Button';

/**
 * OpportunityCard - Tarjeta de Oportunidad Pre-Búsqueda
 * Aparece después de escribir la ubicación, antes de buscar.
 * Muestra: cantidad estimada de prospectos y potencial de ingresos.
 */
const OpportunityCard = ({
    searchEstimate,
    location,
    businessType,
    onSearch,
    isSearching,
    isEstimating
}) => {
    if (isEstimating) {
        return (
            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 dark:from-orange-900/20 dark:to-red-900/20 
                            rounded-2xl p-6 border-2 border-dashed border-orange-300 dark:border-orange-700 
                            backdrop-blur-sm animate-pulse">
                <div className="flex items-center justify-center gap-3 text-orange-600 dark:text-orange-400">
                    <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                    <span className="font-medium">Analizando zona...</span>
                </div>
            </div>
        );
    }

    if (!searchEstimate || !location) return null;

    return (
        <div className="relative overflow-hidden bg-gradient-to-br from-orange-500 to-red-600 
                        rounded-2xl p-6 text-white shadow-xl shadow-orange-500/20 
                        border border-orange-400/30 transform transition-all hover:scale-[1.01]">

            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

            {/* Header */}
            <div className="relative flex items-center gap-2 mb-4">
                <div className="p-2 bg-white/20 rounded-xl">
                    <Target className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold">Oportunidad Detectada</h3>
                <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
            </div>

            {/* Location info */}
            <div className="relative flex items-center gap-2 text-white/80 text-sm mb-4">
                <MapPin className="w-4 h-4" />
                <span>{businessType} en <strong className="text-white">{location}</strong></span>
            </div>

            {/* Stats Grid - Smart Cache Info */}
            <div className="relative grid grid-cols-2 gap-4 mb-4">
                {/* Prospects Count */}
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
                    <p className="text-4xl font-bold mb-1">{searchEstimate.displayCount || '~20'}</p>
                    <p className="text-sm text-white/80">prospectos encontrados</p>
                </div>

                {/* Revenue Potential */}
                <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-1">
                        <DollarSign className="w-6 h-6 text-green-300" />
                        <p className="text-3xl font-bold">{searchEstimate.potentialRevenueText || '0€'}</p>
                    </div>
                    <p className="text-sm text-white/80">potencial estimado</p>
                </div>
            </div>

            {/* Smart Cache Info */}
            {(searchEstimate.existingCount > 0 || searchEstimate.newCount >= 0) && (
                <div className="relative bg-white/10 rounded-lg p-3 mb-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="flex items-center gap-1">
                            📦 En tu DB: <strong className="text-green-300">{searchEstimate.existingCount || 0}</strong>
                            <span className="text-white/60">(gratis)</span>
                        </span>
                        <span className="flex items-center gap-1">
                            🌍 Nuevos: <strong className="text-yellow-300">{searchEstimate.newCount || searchEstimate.count || 0}</strong>
                            <span className="text-white/60">(API)</span>
                        </span>
                    </div>
                </div>
            )}

            {/* Search Button */}
            <button
                onClick={onSearch}
                disabled={isSearching}
                className="relative w-full py-4 bg-white text-orange-600 font-bold rounded-xl 
                           hover:bg-orange-50 transition-all flex items-center justify-center gap-2
                           disabled:opacity-70 disabled:cursor-not-allowed
                           shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30"
            >
                {isSearching ? (
                    <>
                        <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        Buscando Prospectos...
                    </>
                ) : (
                    <>
                        <Search className="w-5 h-5" />
                        Buscar Prospectos en esta Zona
                    </>
                )}
            </button>

            {/* Subtle hint */}
            <p className="relative text-center text-xs text-white/60 mt-3">
                NoahPro IA analizará cada resultado automáticamente
            </p>
        </div>
    );
};

export default OpportunityCard;
