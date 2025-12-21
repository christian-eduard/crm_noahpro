import React, { useState } from 'react';
import {
    MapPin, Phone, Globe, Star, Store,
    BrainCircuit, UserPlus, Check, AlertTriangle, Clock,
    Zap, Tag, Lightbulb, ChevronRight, MessageCircle,
    AlertCircle, Shield, FileText, ThumbsDown
} from 'lucide-react';

/**
 * ProspectCard Premium - Tarjeta de Prospecto con Análisis IA
 * 
 * Campos de Inteligencia mostrados:
 * - priority: Urgente, Alta, Media, Baja
 * - tags: Sin Web, Verifactu, Kit Digital, Reseñas Negativas
 * - reasoning: Por qué es un buen cliente
 * - suggested_pitch: Frase de apertura para el comercial
 */
const ProspectCard = ({
    prospect,
    onClick,
    onAnalyze,
    onConvertToLead,
    isFirstResult = false,
    isLoading = false
}) => {
    const [isHovered, setIsHovered] = useState(false);

    // Skeleton loading
    if (isLoading) {
        return (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                <div className="h-32 bg-gray-200 dark:bg-gray-700" />
                <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="flex gap-2">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-16" />
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-20" />
                    </div>
                </div>
            </div>
        );
    }

    // Priority config - exactamente como lo especificó el usuario
    const priorityConfig = {
        'urgent': { label: 'Urgente', bg: 'bg-red-500', text: 'text-white', icon: AlertTriangle },
        'urgente': { label: 'Urgente', bg: 'bg-red-500', text: 'text-white', icon: AlertTriangle },
        'high': { label: 'Alta', bg: 'bg-orange-500', text: 'text-white', icon: Zap },
        'alta': { label: 'Alta', bg: 'bg-orange-500', text: 'text-white', icon: Zap },
        'medium': { label: 'Media', bg: 'bg-yellow-400', text: 'text-gray-900', icon: Clock },
        'media': { label: 'Media', bg: 'bg-yellow-400', text: 'text-gray-900', icon: Clock },
        'low': { label: 'Baja', bg: 'bg-gray-400', text: 'text-white', icon: null },
        'baja': { label: 'Baja', bg: 'bg-gray-400', text: 'text-white', icon: null }
    };

    // Extraer priority del análisis IA
    const aiAnalysis = prospect.ai_analysis || {};
    const rawPriority = (aiAnalysis.priority || prospect.ai_priority || 'medium').toLowerCase();
    const priorityInfo = priorityConfig[rawPriority] || priorityConfig.medium;
    const PriorityIcon = priorityInfo.icon;

    // Construir tags según especificación del usuario
    const buildTags = () => {
        const tags = [];

        // Tag: Sin Web
        if (!prospect.website) {
            tags.push({
                id: 'sin_web',
                label: 'Sin Web',
                icon: Globe,
                color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
                description: 'Oportunidad de diseño'
            });
        }

        // Tag: Verifactu (detectado por IA o por business_type)
        const businessType = (prospect.business_type || '').toLowerCase();
        const needsVerifactu = aiAnalysis.tags?.includes('Verifactu') ||
            ['bar', 'restaurante', 'cafetería', 'tienda', 'comercio'].some(t => businessType.includes(t));
        if (needsVerifactu) {
            tags.push({
                id: 'verifactu',
                label: 'Verifactu',
                icon: Shield,
                color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                description: 'Necesidad legal inminente'
            });
        }

        // Tag: Kit Digital (si aplica)
        if (aiAnalysis.tags?.includes('Kit Digital') || (!prospect.website && prospect.rating >= 4.0)) {
            tags.push({
                id: 'kit_digital',
                label: 'Kit Digital',
                icon: FileText,
                color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
                description: 'Posible subvención'
            });
        }

        // Tag: Reseñas Negativas
        const hasNegativeReviews = (prospect.rating && prospect.rating < 3.5) ||
            aiAnalysis.tags?.includes('Reseñas Negativas');
        if (hasNegativeReviews) {
            tags.push({
                id: 'resenas_negativas',
                label: 'Reseñas Negativas',
                icon: ThumbsDown,
                color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
                description: 'Oportunidad de gestión de reputación'
            });
        }

        // Tag: TPV Antiguo / Solo Efectivo (detectado por IA opportunities)
        const needsTpv = aiAnalysis.opportunities?.needs_tpv || aiAnalysis.tags?.includes('TPV Antiguo');
        if (needsTpv) {
            tags.push({
                id: 'tpv_antiguo',
                label: 'Necesita TPV',
                icon: Store,
                color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
                description: 'Solo acepta efectivo'
            });
        }

        // Tag: Sin Redes Sociales (detectado por IA opportunities)
        const needsSocial = aiAnalysis.opportunities?.needs_social || aiAnalysis.tags?.includes('Sin Redes');
        if (needsSocial) {
            tags.push({
                id: 'sin_redes',
                label: 'Sin Redes',
                icon: MessageCircle,
                color: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
                description: 'Necesita gestión de redes'
            });
        }

        // Tags adicionales de IA
        if (aiAnalysis.tags && Array.isArray(aiAnalysis.tags)) {
            aiAnalysis.tags.forEach(tag => {
                if (!tags.find(t => t.label === tag)) {
                    tags.push({
                        id: tag.toLowerCase().replace(/\s/g, '_'),
                        label: tag,
                        icon: Tag,
                        color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    });
                }
            });
        }

        return tags.slice(0, 4);
    };

    const tags = buildTags();

    // Reasoning - Por qué es un buen cliente
    const reasoning = aiAnalysis.reasoning || aiAnalysis.opportunity || null;

    // Suggested Pitch - Frase de apertura
    const suggestedPitch = aiAnalysis.suggested_pitch || aiAnalysis.pitch || null;

    return (
        <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onClick={onClick}
            className={`
                relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border overflow-hidden
                cursor-pointer transition-all duration-300
                ${isFirstResult
                    ? 'border-orange-400 ring-2 ring-orange-200 dark:ring-orange-800 shadow-lg'
                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'}
                ${isHovered ? 'shadow-lg -translate-y-1' : ''}
                ${prospect.processed ? 'border-green-300 dark:border-green-700' : ''}
            `}
        >
            {/* First Result Badge */}
            {isFirstResult && (
                <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold py-1 text-center z-10">
                    ✨ Primer Resultado - Vista Preliminar
                </div>
            )}

            {/* Photo */}
            <div className={`relative ${isFirstResult ? 'h-36 mt-6' : 'h-28'} w-full overflow-hidden`}>
                {prospect.photos && prospect.photos.length > 0 ? (
                    <img
                        src={typeof prospect.photos[0] === 'string' ? prospect.photos[0] : prospect.photos[0]?.url}
                        alt={prospect.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                ) : (
                    <div className="h-full w-full bg-gradient-to-br from-orange-100 to-red-50 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
                        <Store className="w-10 h-10 text-orange-300 dark:text-gray-600" />
                    </div>
                )}

                {/* Rating Badge */}
                <div className="absolute top-2 right-2 flex items-center bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
                    <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500 mr-1" />
                    <span className="font-bold text-xs text-gray-900 dark:text-white">{prospect.rating || 'N/A'}</span>
                    <span className="text-[10px] text-gray-400 ml-1">({prospect.reviews_count || 0})</span>
                </div>

                {/* Lead Badge */}
                {prospect.processed && (
                    <div className="absolute top-2 left-2 px-2 py-1 rounded-lg bg-green-500 text-white text-[10px] font-bold shadow-sm flex items-center gap-1">
                        <Check className="w-3 h-3" /> LEAD
                    </div>
                )}

                {/* Priority Banner (si tiene análisis) */}
                {aiAnalysis.priority && (
                    <div className={`absolute bottom-0 left-0 right-0 ${priorityInfo.bg} ${priorityInfo.text} text-xs font-bold py-1 px-3 flex items-center justify-center gap-1`}>
                        {PriorityIcon && <PriorityIcon className="w-3 h-3" />}
                        PRIORIDAD: {priorityInfo.label.toUpperCase()}
                    </div>
                )}
            </div>

            <div className="p-4">
                {/* Header */}
                <h4 className="font-bold text-gray-900 dark:text-white truncate text-base mb-1" title={prospect.name}>
                    {prospect.name}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate flex items-center gap-1 mb-3">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    {prospect.address}
                </p>

                {/* Tags Row - Sin Web, Verifactu, Kit Digital, Reseñas Negativas */}
                {tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-3">
                        {tags.map((tag) => {
                            const TagIcon = tag.icon;
                            return (
                                <span
                                    key={tag.id}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium flex items-center gap-1 ${tag.color}`}
                                    title={tag.description}
                                >
                                    <TagIcon className="w-2.5 h-2.5" />
                                    {tag.label}
                                </span>
                            );
                        })}
                    </div>
                )}

                {/* Reasoning - Por qué es un buen cliente */}
                {reasoning && (
                    <div className="mb-3 p-2.5 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800/50">
                        <div className="flex items-start gap-2">
                            <Lightbulb className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
                            <p className="text-xs text-indigo-700 dark:text-indigo-300 line-clamp-2">
                                {reasoning}
                            </p>
                        </div>
                    </div>
                )}

                {/* Suggested Pitch - Frase de apertura */}
                {suggestedPitch && (
                    <div className="mb-3 p-2.5 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-100 dark:border-green-800/50">
                        <div className="flex items-start gap-2">
                            <MessageCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                            <p className="text-xs text-green-700 dark:text-green-300 line-clamp-2 italic">
                                "{suggestedPitch}"
                            </p>
                        </div>
                    </div>
                )}

                {/* Contact Info */}
                <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mb-3">
                    {prospect.phone && (
                        <a
                            href={`tel:${prospect.phone}`}
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 hover:text-orange-500 transition-colors"
                        >
                            <Phone className="w-3 h-3" />
                            {prospect.phone}
                        </a>
                    )}
                    {prospect.website && (
                        <a
                            href={prospect.website}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="flex items-center gap-1 text-blue-500 hover:text-blue-600"
                        >
                            <Globe className="w-3 h-3" />
                            Web
                        </a>
                    )}
                </div>

                {/* Action Footer */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700/50">
                    <span className="text-xs text-gray-400">
                        {prospect.business_type || 'Negocio Local'}
                    </span>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            aiAnalysis.priority ? onClick?.() : onAnalyze?.(prospect.id);
                        }}
                        className={`
                            px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1 transition-all
                            ${aiAnalysis.priority
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                                : 'bg-orange-100 hover:bg-orange-200 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'}
                        `}
                    >
                        {aiAnalysis.priority ? (
                            <>Ver Análisis <ChevronRight className="w-3 h-3" /></>
                        ) : (
                            <><BrainCircuit className="w-3 h-3" /> Analizar IA</>
                        )}
                    </button>
                </div>
            </div>

            {/* Hover: Convert to Lead */}
            {isHovered && !prospect.processed && (
                <div className="absolute bottom-20 right-3">
                    <button
                        onClick={(e) => { e.stopPropagation(); onConvertToLead?.(prospect); }}
                        className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-lg transition-transform hover:scale-110"
                        title="Convertir a Lead"
                    >
                        <UserPlus className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
};

export default ProspectCard;
