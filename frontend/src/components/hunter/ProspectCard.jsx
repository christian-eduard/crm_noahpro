import React from 'react';
import {
    MapPin, Phone, Globe, Star, Building2, Store,
    BrainCircuit, Instagram, Facebook, UserPlus
} from 'lucide-react';
import Button from '../shared/Button';

const ProspectCard = ({
    prospect,
    onClick,
    onAnalyze,
    onConvertToLead,
    getPriorityColor,
    getDetectedSocialMedia
}) => {
    const socialData = getDetectedSocialMedia(prospect);

    return (
        <div
            className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all hover:shadow-lg hover:-translate-y-1 relative group cursor-pointer overflow-hidden ${prospect.processed
                    ? 'border-green-200 dark:border-green-800/50'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                }`}
            onClick={onClick}
        >
            {/* Photo Banner */}
            {prospect.photos && prospect.photos.length > 0 ? (
                <div className="h-32 w-full overflow-hidden">
                    <img
                        src={typeof prospect.photos[0] === 'string' ? prospect.photos[0] : prospect.photos[0]?.url}
                        alt={prospect.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                </div>
            ) : (
                <div className="h-24 w-full bg-gradient-to-br from-orange-100 to-red-50 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                    <Store className="w-10 h-10 text-orange-300 dark:text-gray-600" />
                </div>
            )}

            {/* Priority Banner */}
            {prospect.ai_priority && (
                <div className={`absolute top-0 left-0 right-0 h-1 ${getPriorityColor(prospect.ai_priority)}`} />
            )}

            {/* Rating Badge */}
            <div className="absolute top-2 right-2 flex items-center bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                <span className="font-bold text-xs text-gray-900 dark:text-white">{prospect.rating || 'N/A'}</span>
                <span className="text-[10px] text-gray-400 ml-1">({prospect.reviews_count || 0})</span>
            </div>

            {/* Processed Badge */}
            {prospect.processed && (
                <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-green-500 text-white text-[10px] font-bold shadow-sm">
                    ✓ LEAD
                </div>
            )}

            <div className="p-4">
                {/* Header */}
                <div className="mb-3">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate text-base" title={prospect.name}>
                        {prospect.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 shrink-0" />
                        {prospect.address}
                    </p>
                </div>

                {/* Tags Row */}
                <div className="flex flex-wrap gap-2 mb-3">
                    <span className="px-2 py-1 rounded-md bg-orange-50 dark:bg-orange-900/20 text-xs text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-800">
                        {prospect.business_type || 'Negocio Local'}
                    </span>

                    {/* Priority Badge */}
                    {prospect.ai_analysis?.priority && (
                        <span className={`px-2 py-1 rounded-md text-xs font-bold border ${prospect.ai_analysis.priority === 'HIGH'
                                ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800'
                                : prospect.ai_analysis.priority === 'MEDIUM'
                                    ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400 border-yellow-200 dark:border-yellow-800'
                                    : 'bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600'
                            }`}>
                            PRIORIDAD: {prospect.ai_analysis.priority}
                        </span>
                    )}

                    {prospect.ai_analysis && (
                        <span className="px-2 py-1 rounded-md bg-indigo-50 dark:bg-indigo-900/20 text-xs text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-800 flex items-center gap-1">
                            <BrainCircuit className="w-3 h-3" /> Analizado
                        </span>
                    )}

                    {/* Social Media Icons */}
                    {socialData.instagram && (
                        <span className="px-2 py-1 rounded-md bg-pink-50 dark:bg-pink-900/20 text-xs text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 flex items-center gap-1">
                            <Instagram className="w-3 h-3" />
                        </span>
                    )}
                    {socialData.facebook && (
                        <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-900/20 text-xs text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 flex items-center gap-1">
                            <Facebook className="w-3 h-3" />
                        </span>
                    )}
                </div>

                {/* AI Analysis Preview */}
                {prospect.ai_analysis?.opportunity && (
                    <div className="mb-3 p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                        <p className="text-xs text-purple-700 dark:text-purple-400 font-medium truncate">
                            💡 {prospect.ai_analysis.opportunity}
                        </p>
                    </div>
                )}

                {/* Contact Info */}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-4">
                    {prospect.phone && (
                        <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            {prospect.phone}
                        </span>
                    )}
                    {prospect.website && (
                        <span className="flex items-center gap-1 text-blue-500 hover:text-blue-600">
                            <Globe className="w-3 h-3" />
                            Web
                        </span>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700/50 flex justify-between items-center">
                    <span className="text-xs text-gray-400">
                        {prospect.distance ? `${prospect.distance} km` : 'Zona cercana'}
                    </span>
                    <Button
                        size="sm"
                        variant={prospect.ai_analysis ? "default" : "outline"}
                        className={prospect.ai_analysis ? "bg-indigo-600 hover:bg-indigo-700 text-white" : ""}
                        onClick={(e) => {
                            e.stopPropagation();
                            onAnalyze(prospect.id);
                        }}
                    >
                        {prospect.ai_analysis ? 'Ver Análisis' : 'Analizar IA'}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ProspectCard;
