import React from 'react';
import {
    MapPin, Phone, Globe, Star, CheckCircle, ExternalLink,
    Instagram, Facebook, Sparkles, BrainCircuit, ImageIcon,
    FileText, Monitor, Clock, RefreshCw
} from 'lucide-react';
import Button from '../shared/Button';

const ProspectDetailModal = ({ prospect, getSocialUrl, getDetectedSocialMedia, onClose, onAnalyze }) => {
    const [activeTab, setActiveTab] = React.useState('summary');
    const socialData = getDetectedSocialMedia(prospect);

    const tabs = [
        { id: 'summary', label: 'Resumen', icon: FileText },
        { id: 'analysis', label: 'Análisis IA', icon: BrainCircuit },
        { id: 'notes', label: 'Notas + CRM', icon: FileText },
        { id: 'activity', label: 'Actividad', icon: Clock },
        { id: 'gallery', label: 'Galería', icon: ImageIcon },
        { id: 'reviews', label: 'Reseñas', icon: Star },
        { id: 'contact', label: 'Contacto', icon: Phone },
        { id: 'demos', label: 'Web Demo', icon: Monitor },
        ...(socialData.instagram ? [{
            id: 'instagram',
            label: 'Instagram',
            icon: Instagram,
            detected: true,
            color: 'text-pink-500'
        }] : []),
        ...(socialData.facebook ? [{
            id: 'facebook',
            label: 'Facebook',
            icon: Facebook,
            detected: true,
            color: 'text-blue-600'
        }] : []),
    ];

    return (
        <>
            {/* Header */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-4 -mx-6 -mt-6 mb-4">
                <div className="flex justify-between items-start">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h2 className="text-xl font-bold">{prospect.name}</h2>
                            {prospect.processed && (
                                <span className="px-3 py-1 rounded-lg text-sm font-bold bg-green-500 text-white flex items-center gap-1">
                                    <CheckCircle className="w-4 h-4" /> Lead ID: {prospect.lead_id || prospect.id}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-300">
                            <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" /> {prospect.city || 'Ubicación'}
                            </span>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                            <span className={`flex items-center gap-1 ${prospect.phone ? 'text-green-400' : 'text-gray-500'}`}>
                                <Phone className="w-4 h-4" /> {prospect.phone ? 'Teléfono' : 'Sin teléfono'}
                            </span>
                            <span className={`flex items-center gap-1 ${socialData.hasRealWeb ? 'text-green-400' : 'text-gray-500'}`}>
                                <Globe className="w-4 h-4" /> {socialData.hasRealWeb ? 'Web' : 'Sin web'}
                            </span>
                            {socialData.facebook && (
                                <a href={socialData.facebook} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-400 hover:text-blue-300">
                                    <Facebook className="w-4 h-4" />
                                </a>
                            )}
                            {socialData.instagram && (
                                <a href={socialData.instagram} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-pink-400 hover:text-pink-300">
                                    <Instagram className="w-4 h-4" />
                                </a>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="text-right">
                            <div className="flex items-center gap-1 text-2xl font-bold">
                                {prospect.rating || 'N/A'}
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            </div>
                            <span className="text-xs text-gray-400">{prospect.reviews_count || 0} reseñas</span>
                        </div>
                        <Button
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600 text-black"
                            onClick={() => onAnalyze(prospect.id)}
                        >
                            <Sparkles className="w-4 h-4 mr-2" />
                            Analizar con IA
                        </Button>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex overflow-x-auto border-b border-gray-200 dark:border-gray-700 mb-4 -mx-6 px-6">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab.id
                                ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 ${tab.color || ''}`} />
                        {tab.label}
                        {tab.detected && (
                            <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                                Detectado
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {/* TAB: RESUMEN */}
                {activeTab === 'summary' && (
                    <div className="space-y-4 animate-fadeIn">
                        {/* Dirección */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <MapPin className="w-4 h-4" />
                                <span className="text-sm font-medium">Dirección</span>
                            </div>
                            <p className="text-gray-900 dark:text-white">{prospect.address || 'No disponible'}</p>
                        </div>

                        {/* Teléfono */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Phone className="w-4 h-4" />
                                <span className="text-sm font-medium">Teléfono</span>
                            </div>
                            <p className="text-gray-900 dark:text-white font-mono">{prospect.phone || 'No disponible'}</p>
                        </div>

                        {/* Web y Redes Sociales */}
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                <Globe className="w-4 h-4" />
                                <span className="text-sm font-medium">Web y Redes Sociales</span>
                            </div>
                            {(socialData.hasRealWeb || socialData.instagram || socialData.facebook) ? (
                                <div className="flex flex-wrap gap-2">
                                    {socialData.hasRealWeb && prospect.website && (
                                        <a
                                            href={prospect.website}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-1.5 text-sm font-medium"
                                        >
                                            <Globe className="w-4 h-4" /> Web
                                        </a>
                                    )}
                                    {socialData.instagram && (
                                        <a
                                            href={socialData.instagram}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-lg border border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-colors flex items-center gap-1.5 text-sm font-medium"
                                        >
                                            <Instagram className="w-4 h-4" /> Instagram
                                        </a>
                                    )}
                                    {socialData.facebook && (
                                        <a
                                            href={socialData.facebook}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-1.5 text-sm font-medium"
                                        >
                                            <Facebook className="w-4 h-4" /> Facebook
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <p className="text-gray-500 italic">Sin presencia online detectada</p>
                            )}
                        </div>

                        {/* Lead Conversion Status */}
                        {prospect.processed && prospect.lead_id && (
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                    <span className="text-green-700 dark:text-green-400 font-medium">Convertido a Lead</span>
                                </div>
                                <span className="text-sm text-green-600 dark:text-green-400">Lead ID: {prospect.lead_id}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: ANÁLISIS IA */}
                {activeTab === 'analysis' && (
                    <div className="space-y-4 animate-fadeIn">
                        {prospect.ai_analysis ? (
                            <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700">
                                <h3 className="font-semibold text-lg mb-4">Análisis de IA</h3>
                                <div className="space-y-3">
                                    {prospect.ai_analysis.priority && (
                                        <div>
                                            <span className="text-sm text-gray-500">Prioridad:</span>
                                            <p className="font-medium">{prospect.ai_analysis.priority}</p>
                                        </div>
                                    )}
                                    {prospect.ai_analysis.opportunity && (
                                        <div>
                                            <span className="text-sm text-gray-500">Oportunidad:</span>
                                            <p>{prospect.ai_analysis.opportunity}</p>
                                        </div>
                                    )}
                                    {prospect.ai_analysis.approach_strategy && (
                                        <div>
                                            <span className="text-sm text-gray-500">Estrategia Recomendada:</span>
                                            <p className="italic">"{prospect.ai_analysis.approach_strategy}"</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <BrainCircuit className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                                <p className="text-gray-500">Este prospecto aún no ha sido analizado</p>
                                <Button className="mt-4" onClick={() => onAnalyze(prospect.id)}>
                                    <Sparkles className="w-4 h-4 mr-2" />
                                    Analizar Ahora
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: GALERÍA */}
                {activeTab === 'gallery' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <ImageIcon className="w-5 h-5" /> Galería de Fotos
                            </h3>
                            <Button size="sm" variant="outline">
                                <RefreshCw className="w-4 h-4 mr-2" /> Buscar más fotos
                            </Button>
                        </div>
                        {prospect.photos && prospect.photos.length > 0 ? (
                            <div className="grid grid-cols-3 gap-4">
                                {prospect.photos.map((photo, idx) => (
                                    <img
                                        key={idx}
                                        src={typeof photo === 'string' ? photo : photo.url}
                                        alt={`${prospect.name} ${idx + 1}`}
                                        className="rounded-lg w-full h-32 object-cover"
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Sin imágenes disponibles</p>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: RESEÑAS */}
                {activeTab === 'reviews' && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-semibold flex items-center gap-2">
                                <Star className="w-5 h-5" /> Reseñas
                            </h3>
                            <Button size="sm" variant="outline">
                                <RefreshCw className="w-4 h-4 mr-2" /> Actualizar
                            </Button>
                        </div>
                        {prospect.reviews && prospect.reviews.length > 0 ? (
                            <div className="space-y-4">
                                {prospect.reviews.map((review, idx) => (
                                    <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                                            <span className="font-medium">{review.rating}/5</span>
                                        </div>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{review.text}</p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-gray-400">
                                <Star className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p>Sin reseñas disponibles</p>
                            </div>
                        )}
                    </div>
                )}

                {/* TAB: INSTAGRAM */}
                {activeTab === 'instagram' && socialData.instagram && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-xl border border-pink-200 dark:border-pink-800">
                            <div className="flex items-center gap-3 mb-4">
                                <Instagram className="w-8 h-8 text-pink-600" />
                                <div>
                                    <h3 className="font-bold text-lg">Instagram Detectado</h3>
                                    <p className="text-sm text-gray-600">Información de la página de negocio</p>
                                </div>
                            </div>
                            <a
                                href={socialData.instagram}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition"
                            >
                                <Instagram className="w-4 h-4" /> Ver en Instagram
                            </a>
                        </div>
                    </div>
                )}

                {/* TAB: FACEBOOK */}
                {activeTab === 'facebook' && socialData.facebook && (
                    <div className="space-y-4 animate-fadeIn">
                        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-3 mb-4">
                                <Facebook className="w-8 h-8 text-blue-600" />
                                <div>
                                    <h3 className="font-bold text-lg">Facebook Detectado</h3>
                                    <p className="text-sm text-gray-600">Información de la página de negocio</p>
                                </div>
                            </div>
                            <a
                                href={socialData.facebook}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                <Facebook className="w-4 h-4" /> Ver en Facebook
                            </a>
                        </div>
                    </div>
                )}

                {/* Other tabs placeholder */}
                {!['summary', 'analysis', 'gallery', 'reviews', 'instagram', 'facebook'].includes(activeTab) && (
                    <div className="text-center py-12 text-gray-400">
                        <p>Contenido de {tabs.find(t => t.id === activeTab)?.label} próximamente</p>
                    </div>
                )}
            </div>
        </>
    );
};

export default ProspectDetailModal;
