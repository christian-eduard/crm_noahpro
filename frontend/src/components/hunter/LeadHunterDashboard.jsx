/**
 * Lead Hunter Dashboard
 * Interfaz principal de prospección inteligente con NoahPro IA
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { API_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import Button from '../shared/Button';
import Modal from '../shared/Modal';
import ConfirmModal from '../shared/ConfirmModal';
import LeadHunterMap from './LeadHunterMap';
import BusinessTypesSettings from '../settings/BusinessTypesSettings';
import LeadHunterSettings from '../settings/LeadHunterSettings';
import HunterStrategiesSettings from '../settings/HunterStrategiesSettings';
import TeamDashboard from './TeamDashboard';
import { SearchGroupList } from './SearchGroupList'; // Custom Helper
import {
    Search, MapPin, Building2, Phone, Globe, Star, ExternalLink,
    Zap, UserPlus, MessageSquare, TrendingUp, Clock, AlertCircle,
    CheckCircle, X, RefreshCw, Filter, ChevronDown, Sparkles, Plus,
    Store, Briefcase, Truck, Music, Beer, PartyPopper, Utensils, Coffee, Hotel, ShoppingBag,
    Dumbbell, Pill, Home, Wrench, Scissors, Stethoscope, ShoppingCart,
    List, Grid, Map, Mail, Eye, History, Maximize2, Minimize2, Save, Send, LayoutTemplate,
    Trash2, AlertTriangle, ArrowRight, Check, MessageCircle, Instagram, Facebook, Linkedin, Video, Twitter, Users,
    MoreVertical, ChevronLeft, ChevronRight, Loader2, Target, Calendar, DollarSign, Building,
    Brain, BrainCircuit, ImageIcon, Copy, User, HelpCircle, Lightbulb, Share2, FileText, Network, BarChart, Monitor,
    PenTool, Wand2, MoreHorizontal, Edit, Edit3, Camera, PhoneCall, Settings
} from 'lucide-react';


const LeadHunterDashboard = ({ onNavigateSettings }) => {
    // --- State ---
    const [access, setAccess] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('search'); // 'search', 'prospects', 'analyzed', 'converted', 'history', 'team'

    // Search State
    const [searchQuery, setSearchQuery] = useState('');
    const [isCustomType, setIsCustomType] = useState(false);
    const [customTypeQuery, setCustomTypeQuery] = useState('');
    const [isCustomStrategy, setIsCustomStrategy] = useState(false);
    const [customStrategyPrompt, setCustomStrategyPrompt] = useState('');
    const [strategyManagerOpen, setStrategyManagerOpen] = useState(false);
    const [searchLocation, setSearchLocation] = useState('');

    const [isMapOpen, setIsMapOpen] = useState(true);
    const [searching, setSearching] = useState(false);
    const [searchResults, setSearchResults] = useState([]); // Resultados de la búsqueda actual (no guardados aun si no se quiere, pero el backend los guarda auto)

    // Data State
    const [stats, setStats] = useState(null);
    const [businessTypes, setBusinessTypes] = useState([]);
    const [savedProspects, setSavedProspects] = useState([]);
    // const [searchHistory, setSearchHistory] = useState([]); // Removed duplicate state
    const [searches, setSearches] = useState([]); // List of search sessions
    const [selectedSearchId, setSelectedSearchId] = useState(null); // Drill-down state
    const [radius, setRadius] = useState(1000); // Default 1km
    const [strategies, setStrategies] = useState([]); // Loaded from API
    const [strategy, setStrategy] = useState(''); // Selected ID
    const [searchLimit, setSearchLimit] = useState(20); // 20, 40, 60

    // Filters & UI State
    const [filterPriority, setFilterPriority] = useState('all');
    const [filterProcessed, setFilterProcessed] = useState('all');
    const [filterRating, setFilterRating] = useState('all');
    const [filterBusinessType, setFilterBusinessType] = useState('all');
    const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'

    // Modals & Selection
    const [selectedProspect, setSelectedProspect] = useState(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [isManageTypesModalOpen, setIsManageTypesModalOpen] = useState(false);
    const [isAiSettingsModalOpen, setIsAiSettingsModalOpen] = useState(false);
    const [isStrategyModalOpen, setIsStrategyModalOpen] = useState(false);
    const [mapCenter, setMapCenter] = useState(null);
    const [modalActiveTab, setModalActiveTab] = useState('summary'); // summary, notes, gallery, reviews, contact, demo

    // Custom Confirm Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null,
        variant: 'danger' // 'danger' | 'info'
    });

    // Actions State
    const [analyzingId, setAnalyzingId] = useState(null);
    const [processingId, setProcessingId] = useState(null);
    const [generatingDemoId, setGeneratingDemoId] = useState(null);

    // Demo Generator Config Modal
    const [isDemoConfigOpen, setIsDemoConfigOpen] = useState(false);
    const [demoType, setDemoType] = useState('modern'); // modern, restaurant, store, services, custom
    const [demoCustomPrompt, setDemoCustomPrompt] = useState('');
    const [demoGenerationStage, setDemoGenerationStage] = useState(''); // stages: '', 'analyzing', 'images', 'generating', 'done'
    const [generatingProposalId, setGeneratingProposalId] = useState(null);
    const [demoContactRequests, setDemoContactRequests] = useState([]);
    const [deepAnalyzingId, setDeepAnalyzingId] = useState(null);
    const [demoPreviewImages, setDemoPreviewImages] = useState([]);
    const [isAddDemoTypeOpen, setIsAddDemoTypeOpen] = useState(false);
    const [newDemoType, setNewDemoType] = useState({ id: '', label: '', desc: '', icon: 'Zap' });

    // Default demo types + custom ones from localStorage
    const defaultDemoTypes = [
        { id: 'modern', label: 'Moderno', icon: 'Zap', desc: 'Diseño actual y minimalista' },
        { id: 'restaurant', label: 'Restaurante', icon: 'Utensils', desc: 'Menús, reservas, ambiente' },
        { id: 'store', label: 'Tienda', icon: 'Store', desc: 'Productos, catálogo, ofertas' },
        { id: 'services', label: 'Servicios', icon: 'Briefcase', desc: 'Profesional, contacto, portfolio' },
        { id: 'luxury', label: 'Premium', icon: 'Sparkles', desc: 'Elegante y exclusivo' },
        { id: 'custom', label: 'Personalizado', icon: 'MessageSquare', desc: 'Escribe tu propio prompt' }
    ];
    const [customDemoTypes, setCustomDemoTypes] = useState(() => {
        const saved = localStorage.getItem('hunter_custom_demo_types');
        return saved ? JSON.parse(saved) : [];
    });
    const demoTypes = [...defaultDemoTypes, ...customDemoTypes];

    // Additional States
    const [notesList, setNotesList] = useState([]);
    const [newNoteContent, setNewNoteContent] = useState('');
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [improvingNotes, setImprovingNotes] = useState(false);
    const [demoHistory, setDemoHistory] = useState([]);
    const [loadingDemos, setLoadingDemos] = useState(false);
    const [isDemoHistoryModalOpen, setIsDemoHistoryModalOpen] = useState(false);
    const [refreshingData, setRefreshingData] = useState(false);
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [teamMembers, setTeamMembers] = useState([]);
    const [selectedProspectId, setSelectedProspectId] = useState(null);

    // Estimation States
    const [estimating, setEstimating] = useState(false);
    const [searchEstimate, setSearchEstimate] = useState(null);



    // Helper to render icon
    const renderDemoIcon = (iconName, className = "w-4 h-4") => {
        const Icon = iconMap[iconName] || Zap;
        return <Icon className={className} />;
    };

    // Save custom demo types
    const handleAddDemoType = () => {
        if (!newDemoType.id || !newDemoType.label) {
            toast.error('Introduce un nombre para el tipo');
            return;
        }
        const newType = {
            id: newDemoType.id.toLowerCase().replace(/\s+/g, '_'),
            label: newDemoType.label,
            icon: newDemoType.icon,
            desc: newDemoType.desc || 'Tipo personalizado',
            isCustom: true
        };
        const updated = [...customDemoTypes, newType];
        setCustomDemoTypes(updated);
        localStorage.setItem('hunter_custom_demo_types', JSON.stringify(updated));
        setNewDemoType({ id: '', label: '', desc: '', icon: 'Zap' });
        setIsAddDemoTypeOpen(false);
        toast.success('Tipo de demo añadido');
    };

    const handleDeleteDemoType = (typeId) => {
        showConfirm(
            '¿Eliminar tipo de demo?',
            'Este tipo de demo personalizado se eliminará de tu lista permanentemente.',
            () => {
                const updated = customDemoTypes.filter(t => t.id !== typeId);
                setCustomDemoTypes(updated);
                localStorage.setItem('hunter_custom_demo_types', JSON.stringify(updated));
                toast.success('Tipo eliminado');
            }
        );
    };

    const toast = useToast();
    const token = localStorage.getItem('crm_token');

    // --- Helpers ---
    const iconMap = {
        Store, Briefcase, Truck, Music, Beer, PartyPopper, Utensils, Coffee, Hotel, ShoppingBag,
        Dumbbell, Pill, Home, Wrench, Scissors, Stethoscope, ShoppingCart, Building: Building2,
        Zap, Sparkles, MessageSquare
    };

    const getIconComponent = (iconName) => {
        const Icon = iconMap[iconName] || Store;
        return Icon;
    };

    const getPriorityColor = (priority) => {
        const colors = {
            urgent: 'bg-red-500',
            high: 'bg-orange-500',
            medium: 'bg-yellow-500',
            low: 'bg-green-500'
        };
        return colors[priority] || 'bg-gray-500';
    };

    const getPriorityLabel = (priority) => {
        const labels = {
            urgent: 'Urgente',
            high: 'Alta',
            medium: 'Media',
            low: 'Baja'
        };
        return labels[priority] || priority;
    };

    // Save custom demo types


    const getSocialUrl = (urlOrObj) => {
        if (!urlOrObj) return null;
        if (typeof urlOrObj === 'string') return urlOrObj;
        if (typeof urlOrObj === 'object' && urlOrObj.url) return urlOrObj.url;
        return null; // Caso desconocido o vacío
    };

    // Detect if a URL is a social media link
    const isSocialMediaUrl = (url) => {
        if (!url) return false;
        const lower = url.toLowerCase();
        return lower.includes('instagram.com') ||
            lower.includes('facebook.com') ||
            lower.includes('fb.com') ||
            lower.includes('twitter.com') ||
            lower.includes('x.com') ||
            lower.includes('linkedin.com') ||
            lower.includes('tiktok.com');
    };

    // Get detected social media from website field or social_media object
    const getDetectedSocialMedia = (prospect) => {
        const result = { instagram: null, facebook: null, hasRealWeb: false };

        // Check social_media object first
        if (prospect.social_media?.instagram) {
            result.instagram = getSocialUrl(prospect.social_media.instagram);
        }
        if (prospect.social_media?.facebook) {
            result.facebook = getSocialUrl(prospect.social_media.facebook);
        }

        // Check website field for social media URLs
        if (prospect.website) {
            const webLower = prospect.website.toLowerCase();
            if (webLower.includes('instagram.com') && !result.instagram) {
                result.instagram = prospect.website;
            } else if ((webLower.includes('facebook.com') || webLower.includes('fb.com')) && !result.facebook) {
                result.facebook = prospect.website;
            } else if (!isSocialMediaUrl(prospect.website)) {
                result.hasRealWeb = true;
            }
        }

        return result;
    };

    // --- Utility Callbacks ---
    const showConfirm = (title, message, onConfirm, variant = 'danger') => {
        setConfirmModal({
            isOpen: true,
            title,
            message,
            onConfirm,
            variant
        });
    };

    const handleConfirmAction = async () => {
        if (confirmModal.onConfirm) {
            await confirmModal.onConfirm();
        }
        setConfirmModal({ ...confirmModal, isOpen: false });
    };

    // --- API Calls ---
    const checkAccess = useCallback(async () => {

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

        try {
            const response = await fetch(`${API_URL}/hunter/access`, {
                headers: { 'Authorization': `Bearer ${token}` },
                signal: controller.signal
            });
            clearTimeout(timeoutId);

            if (response.ok) {
                const data = await response.json();
                setAccess(data);
            } else {
                if (response.status === 401) {

                    // No redirigir inmediatamente para evitar bucles, pero marcar el error
                }
                const error = await response.json();

                setAccess({ hasAccess: false, error: error.error || 'Error de acceso' });
            }
        } catch (error) {

            if (error.name === 'AbortError') {
                setAccess({ hasAccess: false, error: 'Tiempo de espera agotado (Timeout)' });
            } else {
                setAccess({ hasAccess: false, error: 'Error de conexión: ' + error.message });
            }
        } finally {

            setLoading(false);
        }
    }, [API_URL, token]);

    const fetchStats = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/hunter/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setStats(await response.json());
            }
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, [API_URL, token]);

    const fetchNotes = useCallback(async (prospectId) => {
        setLoadingNotes(true);
        try {
            const res = await fetch(`${API_URL}/hunter/prospects/${prospectId}/notes_list`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setNotesList(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingNotes(false);
        }
    }, [API_URL, token]);

    const fetchDemoHistory = useCallback(async (prospectId) => {
        setLoadingDemos(true);
        try {
            const res = await fetch(`${API_URL}/hunter/prospects/${prospectId}/demos`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setDemoHistory(await res.json());
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoadingDemos(false);
        }
    }, [API_URL, token]);

    const fetchDemoContactRequests = useCallback(async (prospectId) => {
        try {
            const res = await fetch(`${API_URL}/hunter/prospects/${prospectId}/contact-requests`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setDemoContactRequests(data);
            }
        } catch (e) {
            console.error('Error fetching contact requests:', e);
        }
    }, [API_URL, token]);

    const handleRefreshPlacesData = useCallback(async () => {
        if (!selectedProspect) return;
        setRefreshingData(true);
        try {
            const res = await fetch(`${API_URL}/hunter/prospects/${selectedProspect.id}/refresh`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const updated = await res.json();
                setSelectedProspect(prev => ({ ...prev, ...updated }));
                setSavedProspects(prev => prev.map(p => p.id === updated.id ? { ...p, ...updated } : p));
                toast.success('Datos actualizados desde Google Places');
            } else {
                toast.error('Error al actualizar');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error de conexión');
        } finally {
            setRefreshingData(false);
        }
    }, [API_URL, token, selectedProspect, toast]);

    const handleDeleteDemo = useCallback((demoId) => {
        showConfirm(
            '¿Eliminar demo?',
            'Esta demo se eliminará permanentemente y el enlace público dejará de funcionar.',
            async () => {
                try {
                    const res = await fetch(`${API_URL}/hunter/demos/${demoId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (res.ok) {
                        setDemoHistory(prev => prev.filter(d => d.id !== demoId));
                        toast.success('Demo eliminada');
                    } else {
                        toast.error('Error al eliminar');
                    }
                } catch (e) {
                    console.error(e);
                    toast.error('Error de conexión');
                }
            }
        );
    }, [API_URL, token, toast]);


    const handleSyncMapCoords = useCallback(async (location) => {
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location)}&limit=1`, {
                headers: { 'User-Agent': 'NoahProCRM/1.0' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lon = parseFloat(data[0].lon);
                    setMapCenter([lat, lon]);
                }
            }
        } catch (error) {
            console.warn("Auto-map sync failed", error);
        }
    }, []);


    const fetchBusinessTypes = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/business-types`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setBusinessTypes(data);
                if (data.length > 0 && !searchQuery) {
                    setSearchQuery(data[0].google_query);
                }
            }
        } catch (error) {
            console.error('Error fetching business types:', error);
        }
    }, [API_URL, token, searchQuery]);




    const fetchUserProspects = useCallback(async () => {
        // Don't modify loading state here to avoid full screen spinner if we can simply update list
        // But for tab switch, a small loading indicator is good.
        setLoading(true);
        try {
            const params = new URLSearchParams();

            // Tab logic
            if (activeTab === 'converted') {
                params.append('processed', 'true');
            }

            // Apply current filters if they are set (optional, or rely on frontend filtering)
            // Ideally backend filtering is better for performance
            if (filterProcessed !== 'all' && activeTab !== 'converted') {
                // Map frontend filter values to backend expected values
                if (filterProcessed === 'processed') params.append('processed', 'true');
                if (filterProcessed === 'pending') params.append('processed', 'false');
            }

            const response = await fetch(`${API_URL}/hunter/prospects?${params.toString()}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
                const data = await response.json();
                setSavedProspects(data);
            }
        } catch (error) {
            console.error('Error fetching prospects:', error);
            toast.error('Error al cargar prospectos');
        } finally {
            setLoading(false);
        }
    }, [API_URL, token, activeTab, filterProcessed, toast]);



    const fetchSearches = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/hunter/searches`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setSearches(await response.json());
            }
        } catch (error) {
            console.error('Error fetching searches:', error);
        }
    }, [API_URL, token]);

    const fetchStrategies = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/hunter-strategies`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setStrategies(data);
                if (data.length > 0 && !strategy) {
                    setStrategy(data[0].id);
                }
            }
        } catch (error) {
            console.error('Error fetching strategies:', error);
        }
    }, [API_URL, token, strategy]);

    const fetchSearchProspects = useCallback(async (searchId) => {
        if (!searchId) return;
        try {
            const response = await fetch(`${API_URL}/hunter/searches/${searchId}/prospects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setSavedProspects(await response.json());
            }
        } catch (error) {
            console.error('Error fetching prospects:', error);
        }
    }, [API_URL, token]);

    const fetchAllProspects = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/hunter/prospects`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                setSavedProspects(await response.json());
            }
        } catch (error) {
            console.error('Error fetching all prospects:', error);
        }
    }, [API_URL, token]);

    // --- Handlers ---
    const handleSearchSelect = (searchId) => {
        setSelectedSearchId(searchId);
        fetchSearchProspects(searchId);
    };

    const handleSearch = useCallback(async () => {
        const effectiveQuery = isCustomType ? customTypeQuery : searchQuery;

        if (!effectiveQuery || !searchLocation) {
            toast.warning('Completa el tipo de negocio y la ubicación');
            return;
        }

        setSearching(true);
        try {
            const response = await fetch(`${API_URL}/hunter/search`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    query: effectiveQuery,
                    location: searchLocation,
                    radius,
                    strategy: isCustomStrategy ? 'custom' : strategy,
                    customPrompt: isCustomStrategy ? customStrategyPrompt : null,
                    maxResults: searchLimit
                })
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Encontrados ${data.saved?.length || 0} nuevos prospectos`);
                fetchSearches(); // Update groups
                checkAccess(); // Refresh daily limits counter

                // Switch to prospects tab and go to main list (or we could select the new search)
                setActiveTab('prospects');
                setSelectedSearchId(null);
            } else {
                toast.error(data.error || 'Error en la búsqueda');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setSearching(false);
        }
    }, [API_URL, token, searchQuery, isCustomType, customTypeQuery, searchLocation, radius, strategy, searchLimit, toast, fetchSearches, checkAccess]);

    const handleAnalyze = useCallback(async (prospectId) => {
        setAnalyzingId(prospectId);
        try {
            const response = await fetch(`${API_URL}/hunter/analyze/${prospectId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                toast.success('Análisis completado');

                // Actualizar el prospecto seleccionado si es el mismo
                if (selectedProspect && selectedProspect.id === prospectId) {
                    const updatedProspect = { ...selectedProspect, ...result };
                    setSelectedProspect(updatedProspect);
                }

                // Actualizar la lista global
                setSavedProspects(prev => prev.map(p => p.id === prospectId ? { ...p, ...result } : p));
            } else {
                const err = await response.json();
                toast.error(`Error: ${err.error}`);
            }
        } catch (error) {
            console.error('Error analyzing prospect:', error);
            toast.error('Error al realizar el análisis');
        } finally {
            setAnalyzingId(null);
        }
    }, [API_URL, token, selectedProspect, toast]);

    // Dependencias para handleAnalyze y handleSaveAndReanalyze
    // fetchNotes no parece estar definido aún, revisaré más adelante si existe o si hay que añadirlo

    const handleSaveAndReanalyze = useCallback(async () => {
        if (!newNoteContent.trim()) {
            // Si no hay nueva nota, simplemente re-analizamos
            handleAnalyze(selectedProspect.id);
            return;
        }

        // 1. Guardar la nota marcándola para análisis
        try {
            const response = await fetch(`${API_URL}/hunter/prospects/${selectedProspect.id}/notes`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    content: newNoteContent,
                    use_for_analysis: true
                })
            });

            if (response.ok) {
                setNewNoteContent('');
                if (typeof fetchNotes === 'function') fetchNotes(selectedProspect.id);
                // 2. Ejecutar análisis
                handleAnalyze(selectedProspect.id);
            }
        } catch (error) {
            console.error('Error in save and analyze:', error);
            toast.error('Error al guardar y analizar');
        }
    }, [API_URL, token, selectedProspect, newNoteContent, handleAnalyze, toast, fetchNotes]);

    const handleDeepAnalyze = useCallback(async (prospectId) => {
        setDeepAnalyzingId(prospectId);
        toast.info('Iniciando búsqueda profunda en internet...');
        try {
            const response = await fetch(`${API_URL}/hunter/prospects/${prospectId}/deep-analyze`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const result = await response.json();
                toast.success('Búsqueda profunda completada e integrada');
                if (selectedProspect && selectedProspect.id === prospectId) {
                    setSelectedProspect({ ...selectedProspect, ...result });
                }
                setSavedProspects(prev => prev.map(p => p.id === prospectId ? { ...p, ...result } : p));
            } else {
                toast.error('Error en búsqueda profunda');
            }
        } catch (error) {
            console.error('Error deep analyzing:', error);
            toast.error('Error de conexión');
        } finally {
            setDeepAnalyzingId(null);
        }
    }, [API_URL, token, selectedProspect, toast]);

    const handleGenerateProposal = useCallback(async (prospectId) => {
        setGeneratingProposalId(prospectId);
        try {
            const response = await fetch(`${API_URL}/hunter/prospects/${prospectId}/proposal`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();

            if (response.ok) {
                toast.success('Propuesta generada con éxito');
                // Actualizar el prospecto seleccionado con la información de la propuesta
                setSelectedProspect(prev => ({ ...prev, current_proposal: data }));
            } else {
                toast.error(data.error || 'Error al generar propuesta');
            }
        } catch (error) {
            toast.error('Error de conexión');
        } finally {
            setGeneratingProposalId(null);
        }
    }, [API_URL, token, toast]);

    const handleProcess = useCallback(async (prospectId) => {
        setProcessingId(prospectId);
        try {
            const response = await fetch(`${API_URL}/hunter/process/${prospectId}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({})
            });

            const data = await response.json();

            if (response.ok) {
                toast.success(`Lead creado exitosamente (ID: ${data.leadId})`);
                if (selectedSearchId) fetchSearchProspects(selectedSearchId); // Refresh current list
                fetchStats();
                checkAccess(); // Refresh daily usage limits
                setIsDetailModalOpen(false);
            } else {
                toast.error(data.error || 'Error al crear lead');
            }
        } catch (error) {
            console.error('Error procesando lead:', error);
            toast.error(error.message || 'Error al procesar el prospecto');
        } finally {
            setProcessingId(null);
        }
    }, [API_URL, token, selectedSearchId, fetchSearchProspects, fetchStats, checkAccess, toast]);

    // Quick convert to lead from card
    const handleConvertToLead = (prospect) => {
        showConfirm(
            '¿Convertir a Lead?',
            `Se creará un nuevo lead con los datos de "${prospect.name}". Esta acción agregará el prospecto a tu cartera de leads.`,
            () => handleProcess(prospect.id),
            'info'
        );
    };

    // Open Demo Config Modal
    const openDemoConfig = (prospectId) => {
        setDemoType('modern');
        setDemoCustomPrompt('');
        setDemoPreviewImages([]);
        setDemoGenerationStage('');
        setIsDemoConfigOpen(true);
    };

    // Preview images for demo
    const handlePreviewDemoImages = async () => {
        if (!selectedProspect) return;
        setDemoGenerationStage('images');

        const images = [];

        // Add prospect's own photos first (most important)
        if (selectedProspect.photos && selectedProspect.photos.length > 0) {
            selectedProspect.photos.slice(0, 6).forEach((p, idx) => {
                images.push({
                    url: p.url || p,
                    source: 'Google Places',
                    label: idx === 0 ? 'Portada' : `Foto ${idx + 1}`
                });
            });
        }

        // Add placeholder images for demonstration (using picsum.photos which is more reliable)
        const randomSeed = Date.now();
        images.push({ url: `https://picsum.photos/seed/${randomSeed}1/1920/1080`, source: 'Stock', label: 'Hero Background' });
        images.push({ url: `https://picsum.photos/seed/${randomSeed}2/800/600`, source: 'Stock', label: 'Galería Extra 1' });
        images.push({ url: `https://picsum.photos/seed/${randomSeed}3/800/600`, source: 'Stock', label: 'Galería Extra 2' });
        images.push({ url: `https://picsum.photos/seed/${randomSeed}4/200/200`, source: 'Stock', label: 'Avatar Testimonio' });

        setDemoPreviewImages(images);
        setDemoGenerationStage('');

        toast.success(`${images.length} imágenes listas para la demo`);
    };

    // Generate demo with config
    const handleGenerateDemo = useCallback(async (prospectId) => {
        try {
            setGeneratingDemoId(prospectId);
            setDemoGenerationStage('analyzing');

            // Stage 1: Analyzing prospect
            await new Promise(r => setTimeout(r, 500));
            setDemoGenerationStage('images');

            // Stage 2: Preparing images
            await new Promise(r => setTimeout(r, 500));
            setDemoGenerationStage('generating');

            // Get custom style instructions if it's a custom type
            const selectedType = demoTypes.find(t => t.id === demoType);
            const styleInstructions = selectedType?.styleInstructions || '';

            // Stage 3: Generating HTML
            const res = await fetch(`${API_URL}/hunter/prospects/${prospectId}/demo`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    demoType: demoType,
                    customPrompt: demoCustomPrompt,
                    styleInstructions: styleInstructions
                })
            });

            if (!res.ok) throw new Error('Error al generar demo');

            const data = await res.json();
            setDemoGenerationStage('done');

            if (data.html && data.publicToken) {
                // Abrir demo usando el token público
                const demoUrl = `/demo/${data.publicToken}`;
                const newWindow = window.open(demoUrl, '_blank');

                if (newWindow) {
                    toast.success('¡Demo generada exitosamente!');
                } else {
                    toast.error('Ventana emergente bloqueada. Permite popups para ver la demo.');
                }

                // Refresh demo history
                if (selectedProspect && selectedProspect.id === prospectId) {
                    fetchDemoHistory(prospectId);
                }

                setIsDemoConfigOpen(false);
            } else if (data.html) {
                // Fallback para demos antiguas sin token
                const newWindow = window.open();
                if (newWindow) {
                    newWindow.document.write(data.html);
                    newWindow.document.close();
                    toast.success('¡Demo generada exitosamente!');
                } else {
                    toast.error('Ventana emergente bloqueada. Permite popups para ver la demo.');
                }

                // Refresh demo history
                if (selectedProspect && selectedProspect.id === prospectId) {
                    fetchDemoHistory(prospectId);
                }

                setIsDemoConfigOpen(false);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('No se pudo generar la demo');
        } finally {
            setGeneratingDemoId(null);
            setDemoGenerationStage('');
        }
    }, [API_URL, token, demoTypes, demoType, demoCustomPrompt, selectedProspect, fetchDemoHistory, toast]);

    // Custom Alert Handler


    const handleDeleteSearch = (searchId) => {
        showConfirm(
            '¿Eliminar búsqueda?',
            'Estás a punto de eliminar esta sesión. Los prospectos ya analizados o convertidos en leads se conservarán, pero los no procesados se borrarán permanentemente.',
            async () => {
                try {
                    const response = await fetch(`${API_URL}/hunter/searches/${searchId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (response.ok) {
                        toast.success('Búsqueda eliminada');
                        fetchSearches(); // Refresh list
                        if (selectedSearchId === searchId) {
                            setSelectedSearchId(null);
                        }
                    } else {
                        const data = await response.json();
                        toast.error(data.error || 'Error al eliminar búsqueda');
                    }
                } catch (error) {
                    toast.error('Error de conexión');
                }
            }
        );
    };





    const handleAddNote = useCallback(async () => {
        if (!newNoteContent.trim() || !selectedProspect) return;
        try {
            const res = await fetch(`${API_URL}/hunter/prospects/${selectedProspect.id}/notes_entry`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ content: newNoteContent, useForAnalysis: true })
            });

            if (res.ok) {
                const newNote = await res.json();
                setNotesList(prev => [newNote, ...prev]);
                setNewNoteContent('');
                toast.success('Nota añadida');
            }
        } catch (e) {
            toast.error('Error al añadir nota');
        }
    }, [API_URL, token, selectedProspect, newNoteContent, toast]);

    const handleUpdateNote = useCallback(async (noteId, updates) => {
        try {
            const res = await fetch(`${API_URL}/hunter/notes/${noteId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updates)
            });

            if (res.ok) {
                const updated = await res.json();
                setNotesList(prev => prev.map(n => n.id === noteId ? updated : n));
                toast.success('Nota actualizada');
            }
        } catch (e) {
            toast.error('Error al actualizar nota');
        }
    }, [API_URL, token, toast]);

    const handleDeleteNote = useCallback((noteId) => {
        showConfirm(
            '¿Eliminar nota?',
            'Esta acción eliminará permanentemente la nota seleccionada.',
            async () => {
                try {
                    const res = await fetch(`${API_URL}/hunter/notes/${noteId}`, {
                        method: 'DELETE',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });

                    if (res.ok) {
                        setNotesList(prev => prev.filter(n => n.id !== noteId));
                        toast.success('Nota eliminada');
                    }
                } catch (e) {
                    toast.error('Error al eliminar nota');
                }
            }
        );
    }, [API_URL, token, toast, showConfirm]);

    // Helper to add note without clearing input (used by improve)
    const handleAddNoteDirectly = useCallback(async (content) => {
        const res = await fetch(`${API_URL}/hunter/prospects/${selectedProspect.id}/notes_entry`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ content, useForAnalysis: true })
        });
        if (res.ok) {
            const newNote = await res.json();
            setNotesList(prev => [newNote, ...prev]);
        }
    }, [API_URL, token, selectedProspect]);

    const handleImproveNotes = useCallback(async () => {
        // Collect all notes marked for analysis
        const contentToImprove = notesList
            .filter(n => n.use_for_analysis)
            .map(n => n.content)
            .join('\n\n');

        if (!contentToImprove.trim()) {
            toast.error('No hay notas marcadas para analizar');
            return;
        }

        setImprovingNotes(true);
        try {
            const res = await fetch(`${API_URL}/hunter/prospects/${selectedProspect.id}/notes/improve`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ notes: contentToImprove })
            });

            if (res.ok) {
                const data = await res.json();
                // Add improved note to list
                await handleAddNoteDirectly(data.improved);
                toast.success('Nota mejorada añadida');
            } else {
                toast.error('Error al mejorar notas');
            }
        } catch (e) {
            toast.error('Error de conexión');
        } finally {
            setImprovingNotes(false);
        }
    }, [API_URL, token, selectedProspect, notesList, handleAddNoteDirectly, toast]);

    const handleAssignProspect = useCallback(async (userId) => {
        try {
            const res = await fetch(`${API_URL}/hunter/prospects/${selectedProspect.id}/assign`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ assignedTo: userId })
            });

            if (res.ok) {
                const updated = await res.json();
                setSelectedProspect({ ...selectedProspect, ...updated });
                toast.success('Prospecto asignado correctamente');
                setIsAssignModalOpen(false);
                if (selectedSearchId) fetchSearchProspects(selectedSearchId);
            } else {
                toast.error('Error al asignar prospecto');
            }
        } catch (e) {
            toast.error('Error de conexión');
        }
    }, [API_URL, token, selectedProspect, selectedSearchId, fetchSearchProspects, toast]);

    const fetchTeamMembers = useCallback(async () => {
        try {
            // Re-use the team endpoint or a simpler one if available. 
            // Using admin/team is fine for admins.
            const res = await fetch(`${API_URL}/hunter/admin/team`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                setTeamMembers(await res.json());
            }
        } catch (e) {
            console.error(e);
        }
    }, [API_URL, token]);



    const handleResetStats = useCallback(async () => {
        try {
            const response = await fetch(`${API_URL}/hunter/stats/reset`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                toast.success('Estadísticas reseteadas correctamente');
                checkAccess();
                fetchStats();
                fetchStats();
            }
        } catch (error) {
            toast.error('Error al resetear estadísticas');
        }
    }, [API_URL, token, checkAccess, fetchStats, toast]);

    const handleSyncMap = async () => {
        if (!searchLocation || searchLocation.length < 3) return;

        try {
            // Using Nominatim for client-side geocoding logic (free, no key needed for simple queries)
            // Ideally backend should handle this to hide logic/keys if using Google
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchLocation)}&limit=1`, {
                headers: { 'User-Agent': 'NoahProCRM/1.0' }
            });
            if (res.ok) {
                const data = await res.json();
                if (data && data.length > 0) {
                    // We don't have a direct method exposed on map ref to flyTo, 
                    // but updating a key or passing new props to LeadHunterMap can trigger it.
                    // The LeadHunterMap component takes 'initialLocation'. 
                    // If we want it to react to updates, we might need to modify LeadHunterMap or force remount.
                    // For now, let's just toast
                    toast.info(`Mapa centrado en: ${data[0].display_name.split(',')[0]}`);
                    // Force map update by momentarily toggling or using a key (not optimal but quick)
                    // Better: LeadHunterMap should listen to location changes if we pass it as a specific prop 'centerOn'
                }
            }
        } catch (e) {
            console.warn("Map sync failed", e);
        }
    };

    // --- Filtering Logic ---
    const getFilteredProspects = () => {
        let filtered = [...savedProspects];

        // Especial para pestaña convertidos: solo procesados
        if (activeTab === 'converted') {
            filtered = filtered.filter(p => p.processed === true);
        } else if (filterProcessed !== 'all') {
            const isProcessed = filterProcessed === 'processed';
            filtered = filtered.filter(p => p.processed === isProcessed);
        }

        if (filterPriority !== 'all') {
            filtered = filtered.filter(p => p.ai_priority === filterPriority);
        }

        if (filterRating !== 'all') {
            const rating = parseFloat(filterRating);
            filtered = filtered.filter(p => (p.rating || 0) >= rating);
        }

        if (filterBusinessType !== 'all') {
            filtered = filtered.filter(p => p.business_type === filterBusinessType);
        }

        return filtered;
    };

    // --- Effects ---
    useEffect(() => {
        checkAccess();
        fetchStats();
        fetchBusinessTypes();
        fetchSearches();
        fetchStrategies();
    }, [checkAccess, fetchStats, fetchBusinessTypes, fetchSearches, fetchStrategies]);


    useEffect(() => {
        if (isDetailModalOpen && selectedProspect && modalActiveTab === 'inbox') {
            fetchDemoContactRequests(selectedProspect.id);
        }
    }, [isDetailModalOpen, selectedProspect, modalActiveTab, fetchDemoContactRequests]);

    // Update notes input when prospect changes
    useEffect(() => {
        if (selectedProspect) {
            fetchNotes(selectedProspect.id);
            fetchDemoHistory(selectedProspect.id);
            // Solo resetear la pestaña si el ID del prospecto ha cambiado
            // Si solo se han actualizado los datos (misma id), mantenemos la pestaña actual
            setSelectedProspectId(prev => {
                if (prev !== selectedProspect.id) {
                    setModalActiveTab('summary');
                    return selectedProspect.id;
                }
                return prev;
            });
        }
    }, [selectedProspect, fetchNotes, fetchDemoHistory]);

    // Sync Map on typing (Debounced)
    useEffect(() => {
        if (!searchLocation || searchLocation.length < 3) return;

        const timeoutId = setTimeout(async () => {
            try {
                // Don't sync if it looks like coordinates to avoid jumping while typing coords
                if (searchLocation.includes(',') && /\d/.test(searchLocation)) return;
                handleSyncMapCoords(searchLocation);
            } catch (e) {
                console.warn("Map sync failed", e);
            }
        }, 1200);

        return () => clearTimeout(timeoutId);
    }, [searchLocation, handleSyncMapCoords]);

    // Effect to reload data when Tab changes (if not in Search mode)
    useEffect(() => {
        if (activeTab === 'search') return;

        // If we have a specific search selected, we rely on fetchSearchProspects (usually called by selection)
        // But if we are in broader tabs (Converting, All Prospects), we need to fetch all.
        if (!selectedSearchId && ['prospects', 'analyzed', 'converted', 'history'].includes(activeTab)) {
            if (activeTab === 'history') {
                // History uses its own fetch in its own component usually, or if here:
                // We rely on fetchSearches() which is already called on mount.
            } else {
                fetchUserProspects();
            }
        }
    }, [activeTab, selectedSearchId, fetchUserProspects]);

    // Search Estimation Effect
    useEffect(() => {
        if (!searchQuery || !searchLocation || searchLocation.length < 3) {
            setSearchEstimate(null);
            return;
        }

        const fetchEstimate = async () => {
            setEstimating(true);
            try {
                const res = await fetch(`${API_URL}/hunter/estimate`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: searchQuery,
                        location: searchLocation,
                        radius
                    })
                });
                if (res.ok) {
                    const data = await res.json();
                    setSearchEstimate(data);
                }
            } catch (error) {
                console.warn("Estimation failed", error);
            } finally {
                setEstimating(false);
            }
        };

        const timeoutId = setTimeout(fetchEstimate, 1000);
        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchLocation, radius, API_URL, token]);

    // Load team members when opening assign modal
    useEffect(() => {
        if (isAssignModalOpen && access?.role === 'admin') {
            fetchTeamMembers();
        }
    }, [isAssignModalOpen, access, fetchTeamMembers]);

    // --- Render Components ---


    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
            </div>
        );
    }

    if (!access?.hasAccess) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-8 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                <h3 className="text-xl font-bold text-red-700 dark:text-red-300 mb-2">Acceso Restringido</h3>
                <p className="text-red-600 dark:text-red-400">
                    {access?.error || 'No tienes acceso al módulo Lead Hunter. Contacta con el administrador.'}
                </p>
                {access?.error === 'Usuario no encontrado' && (
                    <p className="text-sm mt-4 text-gray-500">Intenta cerrar sesión y volver a entrar.</p>
                )}
            </div>
        );
    }



    return (
        <div className="space-y-6">
            {/* Header / Stats */}
            <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl p-6 text-white shadow-xl shadow-orange-500/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-white/20 dark:bg-black/20 rounded-xl backdrop-blur-sm">
                            <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Lead Hunter AI</h2>
                            <p className="text-orange-100">Prospección inteligente con NoahPro IA</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-3xl font-bold">{access?.remaining || 0}</div>
                            <div className="text-sm text-orange-100 flex items-center gap-1 justify-end">
                                búsquedas restantes hoy
                                <span className="relative group cursor-help">
                                    <HelpCircle className="w-3.5 h-3.5" />
                                    <span className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                        Cada búsqueda que realices descuenta 1 de tu límite diario. El contador se reinicia a las 00:00.
                                    </span>
                                </span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="bg-white/10 hover:bg-white/20 text-white border-0"
                            onClick={() => showConfirm(
                                '¿Resetear contadores?',
                                'Esto reiniciará el contador de búsquedas diarias. Normalmente se resetea automáticamente a las 00:00.',
                                handleResetStats,
                                'warning'
                            )}
                            title="Resetear contadores diarios"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </Button>
                    </div>
                </div>

                {stats && (
                    <div className="grid grid-cols-5 gap-3 mt-4 pt-4 border-t border-white/20">
                        <div className="text-center">
                            <div className="text-2xl font-bold">{stats.totals?.total_searched || 0}</div>
                            <div className="text-xs text-orange-100">Buscados</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{stats.totals?.total_analyzed || 0}</div>
                            <div className="text-xs text-orange-100">Analizados</div>
                        </div>
                        <div className="text-center border-l border-r border-white/20">
                            <div className="text-2xl font-bold text-green-300">{stats.totals?.total_leads || 0}</div>
                            <div className="text-xs text-orange-100">Convertidos</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{stats.totals?.pending_leads || ((stats.totals?.total_analyzed || 0) - (stats.totals?.total_leads || 0))}</div>
                            <div className="text-xs text-orange-100">Pendientes</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold">{stats.today?.leads_created || 0}</div>
                            <div className="text-xs text-orange-100">Leads hoy</div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => setActiveTab('search')}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'search'
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <Search className="w-4 h-4" /> Buscador
                </button>
                <button
                    onClick={() => { setActiveTab('prospects'); setSelectedSearchId(null); }}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'prospects'
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <List className="w-4 h-4" /> Mis Prospectos
                </button>
                <button
                    onClick={() => { setActiveTab('analyzed'); setSelectedSearchId(null); }}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'analyzed'
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <Zap className="w-4 h-4" /> Leads Analizados
                </button>
                <button
                    onClick={() => { setActiveTab('converted'); setSelectedSearchId(null); }}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'converted'
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <CheckCircle className="w-4 h-4" /> Convertidos
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'history'
                        ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                        : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                        }`}
                >
                    <History className="w-4 h-4" /> Historial
                </button>
                {access?.role === 'admin' && (
                    <button
                        onClick={() => { setActiveTab('team'); setSelectedSearchId(null); }}
                        className={`px-6 py-3 font-medium text-sm flex items-center gap-2 border-b-2 transition-colors ${activeTab === 'team'
                            ? 'border-orange-500 text-orange-600 dark:text-orange-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                            }`}
                    >
                        <Users className="w-4 h-4" /> Equipo
                    </button>
                )}
            </div>

            {/* Content Area */}
            <div className="min-h-[400px]">

                {/* --- TAB: BUSCADOR --- */}
                {activeTab === 'search' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-orange-500" />
                                    Nueva Búsqueda
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsMapOpen(!isMapOpen)}
                                        className={`text-sm px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition-colors ${isMapOpen
                                            ? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-900/20 dark:border-orange-800 dark:text-orange-300'
                                            : 'border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'
                                            }`}
                                    >
                                        <Map className="w-4 h-4" />
                                        {isMapOpen ? 'Ocultar Mapa' : 'Usar Mapa'}
                                    </button>
                                    <button
                                        onClick={() => setIsManageTypesModalOpen(true)}
                                        className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1.5"
                                    >
                                        <Building2 className="w-4 h-4" />
                                        Tipos de Negocio
                                    </button>
                                    <button
                                        onClick={() => setIsStrategyModalOpen(true)}
                                        className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1.5"
                                    >
                                        <Zap className="w-4 h-4 text-purple-500" />
                                        Estrategia IA
                                    </button>
                                    <button
                                        onClick={() => setIsAiSettingsModalOpen(true)}
                                        className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 flex items-center gap-1.5"
                                    >
                                        <Sparkles className="w-4 h-4 text-orange-500" />
                                        Config. Avanzada
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                                <div className="space-y-4">
                                    <div className="flex-1">
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                                            Tipo de Negocio
                                            <span className="relative group cursor-help">
                                                <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-tight">
                                                    Selecciona una categoría predefinida o elige "Personalizado" para escribir exactamente lo que buscas (ej: "Empresas de placas solares").
                                                </span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <select
                                                value={isCustomType ? 'custom' : searchQuery}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'custom') {
                                                        setIsCustomType(true);
                                                        setSearchQuery('');
                                                    } else {
                                                        setIsCustomType(false);
                                                        setSearchQuery(val);
                                                    }
                                                }}
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                            >
                                                <option value="">Selecciona un tipo...</option>
                                                {businessTypes.map(type => (
                                                    <option key={type.id} value={type.google_query}>
                                                        {type.name}
                                                    </option>
                                                ))}
                                                <option value="custom">✍️ Personalizado...</option>
                                            </select>
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                                                {(() => {
                                                    if (isCustomType) return <Edit3 className="w-5 h-5 text-orange-500" />;
                                                    const selectedType = businessTypes.find(t => t.google_query === searchQuery);
                                                    const Icon = selectedType ? getIconComponent(selectedType.icon) : Store;
                                                    return <Icon className="w-5 h-5 text-gray-400" />;
                                                })()}
                                            </div>
                                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                        </div>

                                        {isCustomType && (
                                            <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <label className="block text-xs text-orange-500 font-medium mb-1 ml-1">
                                                    Escribe el tipo de negocio exacto:
                                                </label>
                                                <div className="relative">
                                                    <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-orange-500" />
                                                    <input
                                                        type="text"
                                                        value={customTypeQuery}
                                                        onChange={(e) => setCustomTypeQuery(e.target.value)}
                                                        placeholder="Ej: Talleres mecánicos, Peluquerías..."
                                                        className="w-full pl-9 pr-4 py-2 border-2 border-orange-100 dark:border-orange-900/30 rounded-xl bg-orange-50/30 dark:bg-orange-900/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                                        autoFocus
                                                    />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                                            Ciudad, Zona o Coordenadas
                                            <span className="relative group cursor-help">
                                                <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-tight">
                                                    Indica el lugar donde quieres buscar. Puedes escribir una ciudad, una dirección específica o incluso coordenadas (lat,lng).
                                                </span>
                                            </span>
                                        </label>
                                        <div className="relative">
                                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                            <input
                                                type="text"
                                                value={searchLocation}
                                                onChange={(e) => setSearchLocation(e.target.value)}
                                                onBlur={handleSyncMap} // Auto sync map on blur
                                                placeholder="Ej: Madrid, Calle Mayor, o click en mapa"
                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                                        <div className="flex-1">
                                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 flex justify-between items-center">
                                                <span className="flex items-center gap-1">
                                                    Radio
                                                    <span className="relative group cursor-help">
                                                        <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                                                        <span className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-tight">
                                                            Define el área de búsqueda alrededor del punto central. A mayor radio, más negocios potenciales pero la búsqueda será más dispersa.
                                                        </span>
                                                    </span>
                                                </span>
                                                <span className="text-orange-500 font-bold">{(radius / 1000).toFixed(1)} km</span>
                                            </label>
                                            <input
                                                type="range"
                                                min="500"
                                                max="10000"
                                                step="500"
                                                value={radius}
                                                onChange={(e) => setRadius(parseInt(e.target.value))}
                                                className="w-full accent-orange-500"
                                            />
                                        </div>

                                        <div className="flex-1">
                                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                                                Estrategia IA
                                                <span className="relative group cursor-help">
                                                    <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-tight">
                                                        Determina cómo analizará la IA los prospectos encontrados. "Smart General" es ideal para cualquier negocio, pero puedes definir una propia.
                                                    </span>
                                                </span>
                                            </label>
                                            <select
                                                value={isCustomStrategy ? 'custom' : strategy}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    if (val === 'custom') {
                                                        setIsCustomStrategy(true);
                                                        setStrategy('');
                                                    } else {
                                                        setIsCustomStrategy(false);
                                                        setStrategy(val);
                                                    }
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                            >
                                                {strategies.map(s => (
                                                    <option key={s.id} value={s.id}>
                                                        {s.name}
                                                    </option>
                                                ))}
                                                {strategies.length === 0 && <option value="general">Cargando estrategias...</option>}
                                                <option value="custom">🧠 Custom Prompt...</option>
                                            </select>
                                            <button
                                                type="button"
                                                onClick={() => setStrategyManagerOpen(true)}
                                                className="absolute right-8 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-orange-500 transition-colors"
                                                title="Gestionar estrategias"
                                            >
                                                <Settings className="w-4 h-4" />
                                            </button>

                                        </div>

                                        <div className="flex-1">

                                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                                                Límite
                                                <span className="relative group cursor-help">
                                                    <HelpCircle className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-gray-900 text-white text-[10px] rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-tight">
                                                        Controla cuántos negocios descargar de Google. Una búsqueda "Profunda" barrerá un área mayor dentro del radio definido.
                                                    </span>
                                                </span>
                                            </label>
                                            <select
                                                value={searchLimit}
                                                onChange={(e) => setSearchLimit(parseInt(e.target.value))}
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none text-sm"
                                            >
                                                <option value={20}>20 Rápida</option>
                                                <option value={40}>40 Normal</option>
                                                <option value={60}>60 Profunda</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Custom Strategy Prompt - Full Width */}
                                    {isCustomStrategy && (
                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300 -mt-2">
                                            <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-2">
                                                <Brain className="w-4 h-4 text-purple-500" />
                                                Tu Prompt Personalizado
                                            </label>
                                            <div className="relative">
                                                <textarea
                                                    value={customStrategyPrompt}
                                                    onChange={(e) => setCustomStrategyPrompt(e.target.value)}
                                                    placeholder="Escribe instrucciones detalladas para la IA. Ej: 'Analiza si el negocio tiene redes sociales activas, detecta si usan TPV antiguo, enfócate en oportunidades de digitalización...'"
                                                    className="w-full p-3 pr-12 border-2 border-purple-200 dark:border-purple-800/50 rounded-xl bg-purple-50/30 dark:bg-purple-900/10 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none h-24 resize-none"
                                                    autoFocus
                                                />
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        if (!customStrategyPrompt.trim()) return;
                                                        try {
                                                            const res = await fetch(`${API_URL}/hunter/refine-prompt`, {
                                                                method: 'POST',
                                                                headers: {
                                                                    'Authorization': `Bearer ${token}`,
                                                                    'Content-Type': 'application/json'
                                                                },
                                                                body: JSON.stringify({ prompt: customStrategyPrompt })
                                                            });
                                                            const data = await res.json();
                                                            if (data.refinedPrompt) {
                                                                setCustomStrategyPrompt(data.refinedPrompt);
                                                                toast.success('¡Prompt optimizado!');
                                                            }
                                                        } catch (err) {
                                                            toast.error('Error al optimizar');
                                                        }
                                                    }}
                                                    className="absolute right-3 top-3 p-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:scale-110 transition-transform shadow-lg"
                                                    title="Optimizar con IA"
                                                >
                                                    <Sparkles className="w-5 h-5" />
                                                </button>
                                            </div>
                                            <p className="text-xs text-purple-500 mt-1.5 ml-1 flex items-center gap-1">
                                                <Sparkles className="w-3 h-3" />
                                                Pulsa el botón ✨ para que la IA mejore tu prompt automáticamente
                                            </p>
                                        </div>
                                    )}

                                    <Button

                                        onClick={handleSearch}
                                        disabled={searching || !searchLocation || !searchQuery}
                                        className="w-full py-3 text-base shadow-lg shadow-orange-500/20"
                                    >
                                        {searching ? (
                                            <>
                                                <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                                Escaneando Zona...
                                            </>
                                        ) : (
                                            <>
                                                <Search className="w-5 h-5 mr-2" />
                                                Buscar Prospectos
                                            </>
                                        )}
                                    </Button>

                                    <div className="text-center min-h-[20px]">
                                        {estimating ? (
                                            <p className="text-xs text-orange-500 animate-pulse flex items-center justify-center gap-1">
                                                <RefreshCw className="w-3 h-3 animate-spin" /> Calculando prospectos potenciales...
                                            </p>
                                        ) : searchEstimate ? (
                                            <p className="text-sm font-medium text-green-600 dark:text-green-400 flex items-center justify-center gap-1 animate-fadeIn">
                                                <CheckCircle className="w-4 h-4" />
                                                Hay aprox. <span className="font-bold">{searchEstimate.displayCount}</span> prospectos disponibles en esta zona.
                                            </p>
                                        ) : (
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                La búsqueda puede tomar unos segundos. NoahPro IA analizará los resultados.
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {isMapOpen && (
                                    <div className="h-[300px] md:h-full min-h-[300px]">
                                        <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">
                                            Selección por Mapa <span className="text-xs font-normal text-orange-500 ml-2">(Escribe una ciudad para centrar o haz clic en el mapa)</span>
                                        </label>
                                        <LeadHunterMap
                                            initialLocation={searchLocation}
                                            forcedCenter={mapCenter}
                                            onLocationSelect={(coords) => setSearchLocation(coords)}
                                            radius={radius}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-xl border border-blue-100 dark:border-blue-800">
                                <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-2 flex items-center gap-2">
                                    <Zap className="w-5 h-5 text-blue-500" />
                                    Análisis Automático
                                </h4>
                                <p className="text-sm text-blue-700 dark:text-blue-300">
                                    Cada prospecto es evaluado por IA para determinar su calidad y potencial de conversión.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-6 rounded-xl border border-green-100 dark:border-green-800">
                                <h4 className="font-semibold text-green-900 dark:text-green-100 mb-2 flex items-center gap-2">
                                    <Globe className="w-5 h-5 text-green-500" />
                                    Datos Enriquecidos
                                </h4>
                                <p className="text-sm text-green-700 dark:text-green-300">
                                    Obtenemos teléfonos, webs, reseñas y horarios para darte una visión completa.
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20 p-6 rounded-xl border border-purple-100 dark:border-purple-800">
                                <h4 className="font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                                    <MessageSquare className="w-5 h-5 text-purple-500" />
                                    Pitch Personalizado
                                </h4>
                                <p className="text-sm text-purple-700 dark:text-purple-300">
                                    La IA genera un mensaje de entrada específico para cada negocio encontrado.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- TAB: HISTORIAL --- */}
                {activeTab === 'history' && (
                    <div className="animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                <History className="w-6 h-6 text-orange-500" />
                                Historial de Búsquedas
                            </h3>
                            <button
                                onClick={fetchSearches}
                                className="p-2 text-gray-400 hover:text-orange-500 transition-colors"
                                title="Refrescar historial"
                            >
                                <RefreshCw className="w-5 h-5" />
                            </button>
                        </div>

                        <SearchGroupList
                            searches={searches}
                            onSelect={handleSearchSelect}
                            onDelete={handleDeleteSearch}
                            activeTab="history"
                        />
                    </div>
                )}

                {/* --- TAB: TEAM (ADMIN) --- */}
                {activeTab === 'team' && (
                    <div className="animate-fadeIn">
                        <TeamDashboard
                            API_URL={API_URL}
                            token={token}
                            onSelectCommercial={(member) => {
                                // For now, maybe trigger a toast or drill-down?
                                // User request: "si clico vere el comercia y si entro vere los que ha buscado"
                                // Let's implement basic drill-down later or just show their stats here.
                                toast.info(`Viendo actividad de ${member.full_name}`);
                            }}
                        />
                    </div>
                )}

                {/* --- TAB: PROSPECTOS, ANALYZED & CONVERTED --- */}
                {(activeTab === 'prospects' || activeTab === 'analyzed' || activeTab === 'converted') && (
                    <div className="space-y-6 animate-fadeIn">

                        {/* VIEW: SEARCH LIST (GROUPS) */}
                        {(!selectedSearchId && activeTab !== 'converted') ? (
                            <SearchGroupList
                                searches={searches}
                                onSelect={handleSearchSelect}
                                onDelete={handleDeleteSearch}
                                activeTab={activeTab}
                            />
                        ) : (
                            /* VIEW: PROSPECT LIST (DRILL-DOWN or CONVERTED FLAT VIEW) */
                            <div className="space-y-6">
                                {/* Category Tags Bar (Only for Converted Tab or broad views) */}
                                {activeTab === 'converted' && (
                                    <div className="flex flex-wrap gap-2 mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm animate-fadeIn">
                                        <div className="w-full text-xs font-bold text-gray-400 uppercase mb-2 flex items-center gap-2">
                                            <Filter className="w-3 h-3" /> Filtrar por Tipo de Negocio
                                        </div>
                                        <button
                                            onClick={() => setFilterBusinessType('all')}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterBusinessType === 'all'
                                                ? 'bg-orange-500 text-white shadow-md'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                                }`}
                                        >
                                            Todos
                                        </button>
                                        {[...new Set(savedProspects.filter(p => p.processed).map(p => p.business_type))].filter(Boolean).map((type) => (
                                            <button
                                                key={type}
                                                onClick={() => setFilterBusinessType(prev => prev === type ? 'all' : type)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filterBusinessType === type
                                                    ? 'bg-orange-500 text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Back Button & Title (Only if in drill-down) */}
                                {selectedSearchId && (
                                    <div className="flex items-center gap-3 mb-2">
                                        <button
                                            onClick={() => setSelectedSearchId(null)}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-500 transition-colors"
                                        >
                                            <ChevronDown className="w-5 h-5 rotate-90" />
                                        </button>
                                        <div>
                                            <h3 className="text-lg font-bold flex items-center gap-2">
                                                {searches.find(s => s.id === selectedSearchId)?.query || 'Búsqueda'}
                                                <span className="text-sm font-normal text-gray-500">
                                                    ({new Date(searches.find(s => s.id === selectedSearchId)?.created_at).toLocaleDateString()})
                                                </span>
                                            </h3>
                                        </div>
                                    </div>
                                )}

                                {!selectedSearchId && activeTab === 'converted' && (
                                    <div className="flex items-center gap-2 mb-2">
                                        <CheckCircle className="w-6 h-6 text-green-500" />
                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Mis Leads Convertidos</h3>
                                    </div>
                                )}

                                {/* Filtros Bar */}
                                <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                                        {activeTab !== 'converted' && (
                                            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                                <Filter className="w-4 h-4 text-gray-500" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado:</span>
                                                <select
                                                    value={filterProcessed}
                                                    onChange={(e) => setFilterProcessed(e.target.value)}
                                                    className="bg-transparent border-none text-sm focus:ring-0 text-gray-900 dark:text-white p-0"
                                                >
                                                    <option value="all">Todos</option>
                                                    <option value="pending">Pendientes</option>
                                                    <option value="processed">Procesados</option>
                                                </select>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <AlertCircle className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Prioridad:</span>
                                            <select
                                                value={filterPriority}
                                                onChange={(e) => setFilterPriority(e.target.value)}
                                                className="bg-transparent border-none text-sm focus:ring-0 text-gray-900 dark:text-white p-0"
                                            >
                                                <option value="all">Todas</option>
                                                <option value="urgent">🔴 Urgente</option>
                                                <option value="high">🟠 Alta</option>
                                                <option value="medium">🟡 Media</option>
                                                <option value="low">🟢 Baja</option>
                                            </select>
                                        </div>

                                        <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                                            <Star className="w-4 h-4 text-gray-500" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Rating:</span>
                                            <select
                                                value={filterRating}
                                                onChange={(e) => setFilterRating(e.target.value)}
                                                className="bg-transparent border-none text-sm focus:ring-0 text-gray-900 dark:text-white p-0"
                                            >
                                                <option value="all">Cualquiera</option>
                                                <option value="4.5">4.5+</option>
                                                <option value="4.0">4.0+</option>
                                                <option value="3.5">3.5+</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                            <Grid className="w-5 h-5" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                                            <List className="w-5 h-5" />
                                        </button>
                                        <Button size="sm" variant="outline" onClick={() => fetchSearchProspects(selectedSearchId)}>
                                            <RefreshCw className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>

                                {/* Listado */}
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {getFilteredProspects()
                                        .filter(p => activeTab !== 'analyzed' || p.ai_analysis) // Filter logic for Analyzed Tab
                                        .map((prospect) => (
                                            <div
                                                key={prospect.id}
                                                className={`bg-white dark:bg-gray-800 rounded-xl shadow-sm border transition-all hover:shadow-lg hover:-translate-y-1 relative group cursor-pointer overflow-hidden ${prospect.processed
                                                    ? 'border-green-200 dark:border-green-800/50'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-orange-300'
                                                    }`}
                                                onClick={() => { setSelectedProspect(prospect); setIsDetailModalOpen(true); }}
                                            >
                                                {/* Photo Banner */}
                                                {prospect.photos && prospect.photos.length > 0 ? (
                                                    <div className="h-32 w-full overflow-hidden">
                                                        <img
                                                            src={typeof prospect.photos[0] === 'string' ? prospect.photos[0] : prospect.photos[0]?.url}
                                                            alt={prospect.name}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            onError={(e) => { e.target.style.display = 'none'; }}
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

                                                {/* Rating Badge - Floating */}
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

                                                {/* Quick Actions - Hover Icons */}
                                                <div className="absolute bottom-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    {!prospect.processed && (
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleConvertToLead(prospect); }}
                                                            className="p-2 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-lg transition-all hover:scale-110"
                                                            title="Convertir a Lead"
                                                        >
                                                            <UserPlus className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    {prospect.phone && (
                                                        <a
                                                            href={`tel:${prospect.phone}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg shadow-lg transition-all hover:scale-110"
                                                            title="Llamar"
                                                        >
                                                            <Phone className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                    {prospect.website && (
                                                        <a
                                                            href={prospect.website}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg shadow-lg transition-all hover:scale-110"
                                                            title="Abrir Web"
                                                        >
                                                            <Globe className="w-4 h-4" />
                                                        </a>
                                                    )}
                                                </div>

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
                                                        {getDetectedSocialMedia(prospect).instagram && (
                                                            <span className="px-2 py-1 rounded-md bg-pink-50 dark:bg-pink-900/20 text-xs text-pink-600 dark:text-pink-400 border border-pink-200 dark:border-pink-800 flex items-center gap-1">
                                                                <Instagram className="w-3 h-3" />
                                                            </span>
                                                        )}
                                                        {getDetectedSocialMedia(prospect).facebook && (
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
                                                </div>

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
                                                            handleAnalyze(prospect.id);
                                                        }}
                                                    >
                                                        {prospect.ai_analysis ? 'Ver Análisis' : 'Analizar IA'}
                                                        <ArrowRight className="w-4 h-4 ml-1" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title={selectedProspect?.name || 'Detalle del Prospecto'} size="6xl">
                    {selectedProspect && (
                        <div className="flex flex-col h-[80vh]">
                            {/* Modal Header - Rich Version */}
                            <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-4 -mx-6 -mt-6 mb-4">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                                            <h2 className="text-xl font-bold truncate max-w-[300px]">{selectedProspect.name}</h2>
                                            {selectedProspect.processed && (
                                                <span className="px-3 py-1 rounded-lg text-sm font-bold bg-green-500 text-white flex items-center gap-1 shadow-sm shrink-0">
                                                    <Check className="w-4 h-4" /> LEAD ID: #{selectedProspect.lead_id || selectedProspect.id.toString().slice(-4)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-gray-100 flex-wrap">
                                            <span className="flex items-center gap-1">
                                                <Store className="w-4 h-4" /> {selectedProspect.business_type || 'Negocio'}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-4 h-4" /> {selectedProspect.city || selectedProspect.address?.split(',').slice(-3, -2)[0]?.trim() || 'Ubicación'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-4 mt-2 text-sm">
                                            <span className={`flex items-center gap-1 ${selectedProspect.phone ? 'text-green-300' : 'text-gray-300 opacity-60'}`}>
                                                <Phone className="w-4 h-4" /> {selectedProspect.phone || 'Sin teléfono'}
                                            </span>
                                            <span className={`flex items-center gap-1 ${selectedProspect.website ? 'text-green-300' : 'text-gray-300 opacity-60'}`}>
                                                <Globe className="w-4 h-4" /> {selectedProspect.website ? 'Web' : 'Sin web'}
                                            </span>
                                            {/* Social Media Link Previews */}
                                            {getDetectedSocialMedia(selectedProspect).facebook && (
                                                <a href={getSocialUrl(selectedProspect.social_media?.facebook)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-blue-300 hover:text-blue-100 transition-colors">
                                                    <Facebook className="w-4 h-4" />
                                                </a>
                                            )}
                                            {getDetectedSocialMedia(selectedProspect).instagram && (
                                                <a href={getSocialUrl(selectedProspect.social_media?.instagram)} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-pink-300 hover:text-pink-100 transition-colors">
                                                    <Instagram className="w-4 h-4" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 ml-4">
                                        <div className="text-right border-l border-white/20 pl-4">
                                            <div className="flex items-center gap-1 text-2xl font-black">
                                                {selectedProspect.rating || 'N/A'}
                                                <Star className="w-5 h-5 text-yellow-300 fill-yellow-300" />
                                            </div>
                                            <span className="text-xs text-orange-100">{selectedProspect.reviews_count || 0} reseñas</span>
                                        </div>
                                        <Button
                                            size="sm"
                                            className="bg-white text-orange-600 hover:bg-orange-50 font-bold px-4 rounded-xl shadow-lg transition-transform hover:scale-105"
                                            onClick={() => handleAnalyze(selectedProspect.id)}
                                            disabled={analyzingId === selectedProspect.id}
                                        >
                                            <Sparkles className={`w-4 h-4 mr-2 ${analyzingId === selectedProspect.id ? 'animate-spin' : ''}`} />
                                            IA
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Tabs Navigation */}
                            <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 overflow-x-auto no-scrollbar">
                                {[
                                    { id: 'summary', label: 'Resumen', icon: FileText },
                                    { id: 'analysis', label: 'Análisis IA', icon: BrainCircuit },
                                    { id: 'audit', label: 'Auditoría Digital', icon: BarChart },
                                    { id: 'notes', label: 'Notas + CRM', icon: MessageSquare },
                                    { id: 'inbox', label: 'Inbox Demo', icon: Mail, badge: demoContactRequests.length > 0 ? demoContactRequests.length : null },
                                    { id: 'activity', label: 'Actividad', icon: Clock },
                                    { id: 'gallery', label: 'Galería', icon: ImageIcon },
                                    { id: 'reviews', label: 'Reseñas', icon: Star },
                                    { id: 'contact', label: 'Contacto', icon: Phone },
                                    { id: 'demos', label: 'Web Demo', icon: Monitor },
                                ].map(tab => (
                                    <button
                                        key={tab.id}
                                        onClick={() => setModalActiveTab(tab.id)}
                                        className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold transition-all border-b-2 whitespace-nowrap ${modalActiveTab === tab.id
                                            ? 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50/50 dark:bg-orange-900/10'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                            }`}
                                    >
                                        <tab.icon className="w-4 h-4" />
                                        {tab.label}
                                        {tab.badge && (
                                            <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-pulse">
                                                {tab.badge}
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>

                            {/* Modal Content - Dynamic Layout */}
                            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar p-6">
                                <div className={`grid ${(modalActiveTab === 'summary' || modalActiveTab === 'analysis') ? 'lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
                                    {/* Column: Main Content (Left or Center) */}
                                    <div className={(modalActiveTab === 'summary' || modalActiveTab === 'analysis') ? 'lg:col-span-2' : 'col-span-1'}>

                                        {/* TAB: RESUMEN */}
                                        {modalActiveTab === 'summary' && (
                                            <div className="space-y-4 animate-fadeIn">
                                                {/* Dirección */}
                                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                                        <MapPin className="w-4 h-4 text-orange-500" />
                                                        <span className="text-sm font-bold uppercase tracking-wider text-[10px]">Dirección Principal</span>
                                                    </div>
                                                    <p className="text-gray-900 dark:text-white font-medium">{selectedProspect.address || 'No disponible'}</p>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Teléfono */}
                                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                                            <Phone className="w-4 h-4 text-green-500" />
                                                            <span className="text-sm font-bold uppercase tracking-wider text-[10px]">Teléfono de Contacto</span>
                                                        </div>
                                                        <p className="text-gray-900 dark:text-white font-mono font-bold">{selectedProspect.phone || 'No disponible'}</p>
                                                    </div>

                                                    {/* Rating */}
                                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-2">
                                                            <Star className="w-4 h-4 text-yellow-500" />
                                                            <span className="text-sm font-bold uppercase tracking-wider text-[10px]">Reputación en Google</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <span className="text-xl font-black text-gray-900 dark:text-white">{selectedProspect.rating || 'N/A'}</span>
                                                            <div className="flex">
                                                                {[1, 2, 3, 4, 5].map(s => (
                                                                    <Star key={s} className={`w-3 h-3 ${s <= Math.round(selectedProspect.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                                ))}
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-bold ml-1">({selectedProspect.reviews_count || 0} reviews)</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Ecosystem Digital */}
                                                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                            <Globe className="w-5 h-5 text-indigo-500" /> Ecosistema Digital Detectado
                                                        </h4>
                                                    </div>

                                                    {(() => {
                                                        const socialData = getDetectedSocialMedia(selectedProspect);
                                                        const hasAny = socialData.hasRealWeb || socialData.instagram || socialData.facebook;

                                                        return hasAny ? (
                                                            <div className="flex flex-wrap gap-3">
                                                                {socialData.hasRealWeb && (
                                                                    <a
                                                                        href={selectedProspect.website}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
                                                                    >
                                                                        <Globe className="w-4 h-4" /> SITIO WEB
                                                                    </a>
                                                                )}
                                                                {socialData.instagram && (
                                                                    <a
                                                                        href={getSocialUrl(selectedProspect.social_media?.instagram)}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="px-4 py-2 bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-400 rounded-xl border border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-900/30 transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
                                                                    >
                                                                        <Instagram className="w-4 h-4" /> INSTAGRAM
                                                                    </a>
                                                                )}
                                                                {socialData.facebook && (
                                                                    <a
                                                                        href={getSocialUrl(selectedProspect.social_media?.facebook)}
                                                                        target="_blank"
                                                                        rel="noreferrer"
                                                                        className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-xl border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all flex items-center gap-2 text-xs font-bold shadow-sm"
                                                                    >
                                                                        <Facebook className="w-4 h-4" /> FACEBOOK
                                                                    </a>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 text-center">
                                                                <AlertTriangle className="w-6 h-6 text-orange-300 mx-auto mb-2" />
                                                                <p className="text-xs text-gray-500 italic font-medium">No se detectó presencia online. ¡Oportunidad alta de venta Web!</p>
                                                            </div>
                                                        );
                                                    })()}
                                                </div>

                                                {/* Lead Conversion Status */}
                                                {selectedProspect.processed && (
                                                    <div className="bg-green-50 dark:bg-green-900/20 p-5 rounded-2xl border border-green-200 dark:border-green-800 flex items-center justify-between shadow-sm animate-pulse">
                                                        <div className="flex items-center gap-3">
                                                            <div className="bg-green-500 rounded-full p-1">
                                                                <Check className="w-4 h-4 text-white" />
                                                            </div>
                                                            <div>
                                                                <span className="text-green-700 dark:text-green-400 font-bold text-sm">Convertido en Lead</span>
                                                                <p className="text-[10px] text-green-600/70">Este prospecto ya está en tu cartera de CRM</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-[10px] uppercase font-bold text-green-600 block">Lead ID</span>
                                                            <span className="text-xs font-black text-green-700 dark:text-green-400">#{selectedProspect.lead_id || selectedProspect.id}</span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* TAB: ANÁLISIS IA */}
                                        {modalActiveTab === 'analysis' && (
                                            <div className="space-y-6 animate-fadeIn">
                                                <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-6 rounded-2xl text-white shadow-lg overflow-hidden relative">
                                                    <div className="absolute -right-6 -bottom-6 opacity-10">
                                                        <Brain className="w-32 h-32 text-white" />
                                                    </div>
                                                    <div className="relative z-10">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h3 className="text-lg font-bold">Central de Inteligencia Estratégica</h3>
                                                                <p className="text-indigo-100 text-sm opacity-90">Análisis metódico para la aproximación comercial de éxito</p>
                                                            </div>
                                                            <Button
                                                                size="sm"
                                                                onClick={() => handleAnalyze(selectedProspect.id)}
                                                                disabled={analyzingId === selectedProspect.id}
                                                                className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-md font-bold px-4"
                                                            >
                                                                {analyzingId === selectedProspect.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                                                                {selectedProspect.ai_analysis ? 'Regenerar' : 'Generar'}
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>

                                                {selectedProspect.ai_analysis ? (
                                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                                                        {/* Left Column: Strategic Insights */}
                                                        <div className="space-y-6">
                                                            {/* Core Strategy Node */}
                                                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                                                                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                                                                    <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600">
                                                                        <Target className="w-5 h-5" />
                                                                    </div>
                                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Mapa de Oportunidad</h4>
                                                                </div>

                                                                <div className="space-y-4">
                                                                    <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                                                        <p className="text-xs font-black text-indigo-700 dark:text-indigo-400 uppercase mb-2">Diagnóstico IA:</p>
                                                                        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed italic">
                                                                            "{selectedProspect.ai_analysis.opportunity_map?.pain_points?.[0] || selectedProspect.ai_reasoning || 'El negocio presenta una falta de infraestructura digital moderna, lo que impacta en su visibilidad local.'}"
                                                                        </p>
                                                                    </div>

                                                                    <div className="grid grid-cols-2 gap-3">
                                                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/10 rounded-xl border border-emerald-100 dark:border-emerald-800">
                                                                            <span className="text-[10px] font-black text-emerald-600 uppercase mb-1 block">Fortalezas</span>
                                                                            <ul className="text-[10px] text-emerald-800 dark:text-emerald-300 list-disc list-inside">
                                                                                <li>Ubicación Prime</li>
                                                                                <li>Buen Tráfico</li>
                                                                            </ul>
                                                                        </div>
                                                                        <div className="p-3 bg-rose-50 dark:bg-rose-900/10 rounded-xl border border-rose-100 dark:border-rose-800">
                                                                            <span className="text-[10px] font-black text-rose-600 uppercase mb-1 block">Debilidades</span>
                                                                            <ul className="text-[10px] text-rose-800 dark:text-rose-300 list-disc list-inside">
                                                                                <li>Sin Web TPV</li>
                                                                                <li>Bajo SEO</li>
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* AI Solution Map */}
                                                            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm relative overflow-hidden transition-all hover:shadow-md">
                                                                <div className="flex items-center gap-2 mb-4 border-b border-gray-100 dark:border-gray-700 pb-3">
                                                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600">
                                                                        <Lightbulb className="w-5 h-5" />
                                                                    </div>
                                                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Solución Táctica NoahPro</h4>
                                                                </div>

                                                                <div className="space-y-3">
                                                                    {(selectedProspect.ai_analysis.recommended_actions || ['Implementar TPV Cloud', 'Landing Page Móvil', 'Estrategia de Reseñas']).map((action, idx) => (
                                                                        <div key={idx} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                                                                            <div className="mt-1 bg-orange-500 rounded-full p-0.5">
                                                                                <Check className="w-2 h-2 text-white" />
                                                                            </div>
                                                                            <span>{action}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Right Column: Execution Tools */}
                                                        <div className="space-y-6">
                                                            {/* Demo Generator Card */}
                                                            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/10 dark:to-purple-900/10 p-5 rounded-2xl border border-indigo-100 dark:border-indigo-800 shadow-sm relative overflow-hidden">
                                                                <div className="flex items-center justify-between mb-4">
                                                                    <h4 className="text-sm font-black text-indigo-900 dark:text-indigo-300 uppercase flex items-center gap-2">
                                                                        <Monitor className="w-4 h-4" /> Generador de Landing Demo
                                                                    </h4>
                                                                    <div className="bg-white/50 dark:bg-black/20 p-1 rounded-lg">
                                                                        <Sparkles className="w-4 h-4 text-indigo-500" />
                                                                    </div>
                                                                </div>

                                                                <div className="flex-1">
                                                                    {demoHistory.length > 0 ? (
                                                                        <div className="space-y-4">
                                                                            <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-purple-200/50 shadow-inner">
                                                                                <div className="flex items-center justify-between mb-3 text-xs font-bold text-gray-500 uppercase">
                                                                                    <span>Última Demo Activa</span>
                                                                                    <span className="text-green-600 flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded-full">
                                                                                        <Eye className="w-3 h-3" /> {demoHistory[0]?.clicks || 0} CLICKS
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex gap-2">
                                                                                    <Button
                                                                                        size="sm"
                                                                                        className="flex-1 bg-indigo-600 text-white"
                                                                                        onClick={() => window.open(`${window.location.origin}/demo/${demoHistory[0]?.token}`, '_blank')}
                                                                                    >
                                                                                        <ExternalLink className="w-4 h-4 mr-2" /> VER
                                                                                    </Button>
                                                                                    <Button
                                                                                        size="sm"
                                                                                        variant="outline"
                                                                                        className="flex-1 text-indigo-600"
                                                                                        onClick={() => {
                                                                                            navigator.clipboard.writeText(`${window.location.origin}/demo/${demoHistory[0]?.token}`);
                                                                                            toast.success('Enlace copiado');
                                                                                        }}
                                                                                    >
                                                                                        <Copy className="w-4 h-4 mr-2" /> COPIAR
                                                                                    </Button>
                                                                                </div>
                                                                            </div>
                                                                            {demoContactRequests.length > 0 && (
                                                                                <div className="bg-orange-500 p-3 rounded-xl text-white flex justify-between items-center shadow-md animate-bounce">
                                                                                    <div className="flex items-center gap-2">
                                                                                        <Mail className="w-4 h-4" />
                                                                                        <span className="text-xs font-bold uppercase tracking-wider">{demoContactRequests.length} Leads Nuevos</span>
                                                                                    </div>
                                                                                    <Button size="xs" className="bg-white text-orange-600 font-bold" onClick={() => setModalActiveTab('inbox')}>VER HOY</Button>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    ) : (
                                                                        <div className="text-center py-10 bg-white/50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-purple-200 dark:border-purple-800/50">
                                                                            <Monitor className="w-12 h-12 text-purple-200 mx-auto mb-3" />
                                                                            <p className="text-sm text-gray-500 font-medium px-6 mb-4">
                                                                                - [x] Búsqueda Personalizada: añadida opción para escribir manualmente el tipo de negocio.<br />
                                                                                - [ ] Ayuda Visual: añadir iconos de interrogación con instrucciones en el formulario.<br />
                                                                                - [ ] Estrategias Personalizadas: permitir definir un prompt manual para la IA.
                                                                            </p>
                                                                            <Button
                                                                                size="sm"
                                                                                className="bg-purple-600 text-white shadow-lg"
                                                                                onClick={() => setIsDemoConfigOpen(true)}
                                                                            >
                                                                                CREAR LANDING IA
                                                                            </Button>
                                                                        </div>
                                                                    )}
                                                                </div>

                                                                <div className="mt-6">
                                                                    <Button
                                                                        className="w-full h-12 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95"
                                                                        onClick={() => handleGenerateProposal(selectedProspect.id)}
                                                                        disabled={generatingProposalId === selectedProspect.id}
                                                                    >
                                                                        {generatingProposalId === selectedProspect.id ? (
                                                                            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                                                                        ) : (
                                                                            <FileText className="w-5 h-5 mr-2" />
                                                                        )}
                                                                        GENERAR PROPUESTA COMERCIAL
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-20 bg-gray-50/50 dark:bg-gray-800/50 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                                        <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                                            <Brain className="w-10 h-10 text-gray-300 dark:text-gray-600" />
                                                        </div>
                                                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Sin Análisis Estratégico</h3>
                                                        <p className="text-gray-500 max-w-sm text-center mb-8 px-4 text-sm leading-relaxed">
                                                            Activa el potencial de venta de este prospecto permitiendo que nuestra IA genere estrategias personalizadas.
                                                        </p>
                                                        <Button
                                                            size="lg"
                                                            onClick={() => handleAnalyze(selectedProspect.id)}
                                                            className="bg-purple-600 hover:bg-purple-700 text-white px-8 rounded-2xl shadow-xl shadow-purple-500/20 active:scale-95 transition-all"
                                                            disabled={analyzingId === selectedProspect.id}
                                                        >
                                                            {analyzingId === selectedProspect.id ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Sparkles className="w-5 h-5 mr-2" />}
                                                            EJECUTAR ANÁLISIS DE LA IA
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* TAB: NOTAS + CRM */}
                                        {modalActiveTab === 'notes' && (
                                            <div className="space-y-4 animate-fadeIn">
                                                <div className="flex justify-between items-center">
                                                    <h4 className="font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                                        <PenTool className="w-4 h-4" /> Notas Internas
                                                    </h4>
                                                    <Button size="sm" variant="ghost" onClick={handleImproveNotes} disabled={improvingNotes}>
                                                        {improvingNotes ? <RefreshCw className="w-3 h-3 animate-spin mr-1" /> : <Wand2 className="w-3 h-3 mr-1" />}
                                                        Mejorar con IA
                                                    </Button>
                                                </div>
                                                <div className="space-y-3 max-h-[300px] overflow-y-auto">
                                                    {notesList.length > 0 ? notesList.map(note => (
                                                        <div key={note.id} className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm group relative">
                                                            <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{note.content}</p>
                                                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100 dark:border-gray-700/50 text-xs text-gray-400">
                                                                <span>{new Date(note.created_at).toLocaleString()}</span>
                                                                <button onClick={() => handleDeleteNote(note.id)} className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 p-1">
                                                                    <Trash2 className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )) : (
                                                        <div className="text-center py-8 text-gray-400 italic">No hay notas registradas</div>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={newNoteContent}
                                                        onChange={(e) => setNewNoteContent(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddNote()}
                                                        placeholder="Añadir nota rápida..."
                                                        className="flex-1 text-sm rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                    />
                                                    <Button size="sm" onClick={handleAddNote} disabled={!newNoteContent.trim()}>
                                                        <Send className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                        {/* TAB: INBOX DEMO */}
                                        {modalActiveTab === 'inbox' && (
                                            <div className="space-y-4 animate-fadeIn">
                                                <div className="flex justify-between items-center bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 p-4 rounded-xl border border-orange-100 dark:border-orange-800">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-orange-100 dark:bg-orange-800/50 rounded-lg">
                                                            <Mail className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                                                        </div>
                                                        <div>
                                                            <h4 className="font-bold text-gray-900 dark:text-white">Solicitudes de Contacto</h4>
                                                            <p className="text-xs text-gray-500">Mensajes recibidos desde las landing pages de demo</p>
                                                        </div>
                                                    </div>
                                                    <span className="text-2xl font-bold text-orange-600">{demoContactRequests.length}</span>
                                                </div>
                                                {demoContactRequests.length > 0 ? (
                                                    <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                                        {demoContactRequests.map((request, idx) => (
                                                            <div key={request.id || idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
                                                                <div className="flex justify-between items-start mb-3">
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                                                            {(request.name || 'A').charAt(0).toUpperCase()}
                                                                        </div>
                                                                        <div>
                                                                            <h5 className="font-semibold text-gray-900 dark:text-white">{request.name || 'Sin nombre'}</h5>
                                                                            <p className="text-xs text-gray-500">{request.email || 'Sin email'}</p>
                                                                        </div>
                                                                    </div>
                                                                    <span className="text-xs text-gray-400">
                                                                        {request.created_at ? new Date(request.created_at).toLocaleDateString() : 'Fecha desconocida'}
                                                                    </span>
                                                                </div>
                                                                {request.phone && (
                                                                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                                        <Phone className="w-3 h-3" />
                                                                        <span>{request.phone}</span>
                                                                    </div>
                                                                )}
                                                                {request.message && (
                                                                    <div className="bg-gray-50 dark:bg-gray-700/50 p-3 rounded-lg text-sm text-gray-700 dark:text-gray-300 italic">
                                                                        "{request.message}"
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                                        <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                                        <p className="text-gray-500 mb-2">Sin mensajes aún</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* TAB: ACTIVIDAD */}
                                        {modalActiveTab === 'activity' && (
                                            <div className="space-y-4 animate-fadeIn">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <Clock className="w-5 h-5 text-indigo-500" /> Historial de Actividad
                                                    </h3>
                                                </div>
                                                {notesList && notesList.length > 0 ? (
                                                    <div className="relative border-l-2 border-gray-200 dark:border-gray-700 pl-6 space-y-6 ml-2">
                                                        {notesList.map((note, idx) => (
                                                            <div key={note.id || idx} className="relative">
                                                                <div className="absolute -left-[31px] w-4 h-4 bg-indigo-500 rounded-full border-4 border-white dark:border-gray-900" />
                                                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                                                    <p className="text-sm text-gray-700 dark:text-gray-300">{note.content}</p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
                                                        <p className="text-gray-500">Sin actividad registrada</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {/* TAB: GALERÍA */}
                                        {modalActiveTab === 'gallery' && (
                                            <div className="space-y-4 animate-fadeIn">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <ImageIcon className="w-5 h-5 text-purple-500" /> Galería de Fotos
                                                    </h3>
                                                    <Button size="sm" variant="outline" onClick={() => handleAnalyze(selectedProspect.id)}>
                                                        <RefreshCw className="w-4 h-4 mr-1" /> Buscar más fotos
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {selectedProspect.photos && selectedProspect.photos.length > 0 ? (
                                                        selectedProspect.photos.map((photo, idx) => (
                                                            <div key={idx} className="aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                                                                <img
                                                                    src={typeof photo === 'string' ? photo : photo?.url}
                                                                    alt={`Foto ${idx + 1}`}
                                                                    className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                                                />
                                                            </div>
                                                        ))
                                                    ) : (
                                                        <div className="col-span-full text-center py-12 text-gray-400">
                                                            <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                            <p>Sin imágenes disponibles</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: RESEÑAS */}
                                        {modalActiveTab === 'reviews' && (
                                            <div className="space-y-4 animate-fadeIn">
                                                <div className="flex justify-between items-center">
                                                    <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                                        <Star className="w-5 h-5 text-yellow-500" /> Reseñas de Google
                                                    </h3>
                                                    <Button size="sm" variant="outline" onClick={() => handleAnalyze(selectedProspect.id)}>
                                                        <RefreshCw className="w-4 h-4 mr-1" /> Actualizar
                                                    </Button>
                                                </div>
                                                {selectedProspect.reviews && selectedProspect.reviews.length > 0 ? (
                                                    selectedProspect.reviews.map((review, idx) => (
                                                        <div key={idx} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <div className="flex">
                                                                    {[1, 2, 3, 4, 5].map(star => (
                                                                        <Star key={star} className={`w-4 h-4 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                                                                    ))}
                                                                </div>
                                                                <span className="text-xs text-gray-500">{review.author}</span>
                                                            </div>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">{review.text}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="text-center py-12 text-gray-400">
                                                        <Star className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                                        <p>Sin reseñas disponibles</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* TAB: CONTACTO */}
                                        {modalActiveTab === 'contact' && (
                                            <div className="space-y-4 animate-fadeIn">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <Button size="lg" variant="outline" className="h-20" onClick={() => selectedProspect.phone && window.open(`tel:${selectedProspect.phone}`)} disabled={!selectedProspect.phone}>
                                                        <div className="flex flex-col items-center">
                                                            <Phone className="w-6 h-6 mb-1 text-green-500" />
                                                            <span>Llamar</span>
                                                        </div>
                                                    </Button>
                                                    <Button size="lg" variant="outline" className="h-20">
                                                        <div className="flex flex-col items-center">
                                                            <Mail className="w-6 h-6 mb-1 text-indigo-500" />
                                                            <span>Email Pitch</span>
                                                        </div>
                                                    </Button>
                                                    <Button size="lg" variant="outline" className="h-20" onClick={() => selectedProspect.social_media?.instagram && window.open(getSocialUrl(selectedProspect.social_media.instagram), '_blank')} disabled={!selectedProspect.social_media?.instagram}>
                                                        <div className="flex flex-col items-center">
                                                            <Instagram className="w-6 h-6 mb-1 text-pink-500" />
                                                            <span>DM Instagram</span>
                                                        </div>
                                                    </Button>
                                                    <Button size="lg" variant="outline" className="h-20">
                                                        <div className="flex flex-col items-center">
                                                            <Calendar className="w-6 h-6 mb-1 text-orange-500" />
                                                            <span>Agendar</span>
                                                        </div>
                                                    </Button>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: AUDITORÍA DIGITAL */}
                                        {modalActiveTab === 'audit' && (
                                            <div className="space-y-6 animate-fadeIn">
                                                {/* Header with Regenerate Button */}
                                                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                                            <BarChart className="w-5 h-5 text-indigo-600" />
                                                            Auditoría Digital 360º
                                                        </h4>
                                                        <p className="text-xs text-gray-500">Análisis completo de presencia digital</p>
                                                    </div>
                                                    {selectedProspect.digital_audit && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleDeepAnalyze(selectedProspect.id)}
                                                            disabled={analyzingId === selectedProspect.id}
                                                            className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        >
                                                            {analyzingId === selectedProspect.id ? (
                                                                <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Regenerando...</>
                                                            ) : (
                                                                <><RefreshCw className="w-4 h-4 mr-2" /> Regenerar</>
                                                            )}
                                                        </Button>
                                                    )}
                                                </div>

                                                {/* Quality Score */}
                                                {selectedProspect.quality_score !== undefined && (
                                                    <div className="bg-gradient-to-r from-emerald-500 to-cyan-600 p-6 rounded-2xl text-white shadow-xl">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-white/20 p-3 rounded-xl">
                                                                    <BarChart className="w-6 h-6" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-lg">Quality Score</h4>
                                                                    <p className="text-emerald-100 text-xs">Puntuación de calidad del prospecto</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-4xl font-black">{selectedProspect.quality_score}</div>
                                                                <div className="text-xs text-emerald-100">/ 100</div>
                                                            </div>
                                                        </div>
                                                        <div className="bg-white/10 rounded-full h-3 overflow-hidden">
                                                            <div
                                                                className="bg-white h-full transition-all duration-1000 ease-out rounded-full"
                                                                style={{ width: `${selectedProspect.quality_score}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Social Media Stats */}
                                                {selectedProspect.social_handle && (
                                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-gray-200 dark:border-gray-700 shadow-lg">
                                                        <div className="flex items-center justify-between mb-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-xl">
                                                                    <Instagram className="w-5 h-5 text-white" />
                                                                </div>
                                                                <div>
                                                                    <h4 className="font-bold text-gray-900 dark:text-white">@{selectedProspect.social_handle}</h4>
                                                                    <p className="text-xs text-gray-500 capitalize">{selectedProspect.social_platform || 'instagram'}</p>
                                                                </div>
                                                            </div>
                                                            {selectedProspect.social_stats?.is_active !== undefined && (
                                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${selectedProspect.social_stats.is_active
                                                                    ? 'bg-green-100 text-green-700'
                                                                    : 'bg-red-100 text-red-700'
                                                                    }`}>
                                                                    {selectedProspect.social_stats.is_active ? '✓ Activa' : '✗ Inactiva'}
                                                                </span>
                                                            )}
                                                        </div>

                                                        {selectedProspect.social_stats && (
                                                            <div className="grid grid-cols-2 gap-4 mt-4">
                                                                {selectedProspect.social_stats.followers_count !== undefined && (
                                                                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                                            {selectedProspect.social_stats.followers_count.toLocaleString()}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">Seguidores</div>
                                                                    </div>
                                                                )}
                                                                {selectedProspect.social_stats.media_count !== undefined && (
                                                                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                                            {selectedProspect.social_stats.media_count}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">Publicaciones</div>
                                                                    </div>
                                                                )}
                                                                {selectedProspect.social_stats.engagement_rate !== undefined && (
                                                                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                                                        <div className="text-2xl font-bold text-gray-900 dark:text-white">
                                                                            {selectedProspect.social_stats.engagement_rate}%
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">Engagement</div>
                                                                    </div>
                                                                )}
                                                                {selectedProspect.social_stats.last_post_date && (
                                                                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl">
                                                                        <div className="text-sm font-bold text-gray-900 dark:text-white">
                                                                            {selectedProspect.social_stats.last_post_date}
                                                                        </div>
                                                                        <div className="text-xs text-gray-500">Último post</div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}

                                                        {selectedProspect.social_stats?.fetch_method && (
                                                            <div className="mt-3 text-xs text-gray-400 flex items-center gap-2">
                                                                <span>Método: {selectedProspect.social_stats.fetch_method === 'api' ? 'Instagram Graph API' : 'Web Scraping'}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Digital Audit */}
                                                {selectedProspect.digital_audit && (
                                                    <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border-2 border-indigo-200 dark:border-indigo-800 shadow-lg">
                                                        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                            <Target className="w-5 h-5 text-indigo-600" />
                                                            Madurez Digital
                                                        </h4>

                                                        <div className="space-y-3">
                                                            <div className="flex justify-between items-center">
                                                                <span className="text-sm text-gray-600 dark:text-gray-300">Score Total</span>
                                                                <span className="text-2xl font-black text-indigo-600">{selectedProspect.digital_audit.score}/100</span>
                                                            </div>

                                                            <div className="grid grid-cols-2 gap-3 mt-4">
                                                                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                                                    <div className="text-xs text-gray-500 mb-1">Web</div>
                                                                    <div className={`font-bold text-sm ${selectedProspect.digital_audit.web_status === 'modern' ? 'text-green-600' :
                                                                        selectedProspect.digital_audit.web_status === 'outdated' ? 'text-orange-600' :
                                                                            'text-red-600'
                                                                        }`}>
                                                                        {selectedProspect.digital_audit.web_status === 'modern' && '✓ Moderna'}
                                                                        {selectedProspect.digital_audit.web_status === 'outdated' && '⚠ Obsoleta'}
                                                                        {selectedProspect.digital_audit.web_status === 'missing' && '✗ Sin web'}
                                                                    </div>
                                                                </div>

                                                                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                                                                    <div className="text-xs text-gray-500 mb-1">Redes Sociales</div>
                                                                    <div className={`font-bold text-sm ${selectedProspect.digital_audit.social_health === 'healthy' ? 'text-green-600' :
                                                                        selectedProspect.digital_audit.social_health === 'inactive' ? 'text-orange-600' :
                                                                            selectedProspect.digital_audit.social_health === 'critical' ? 'text-red-600' :
                                                                                'text-gray-500'
                                                                        }`}>
                                                                        {selectedProspect.digital_audit.social_health === 'healthy' && '✓ Activas'}
                                                                        {selectedProspect.digital_audit.social_health === 'inactive' && '⚠ Inactivas'}
                                                                        {selectedProspect.digital_audit.social_health === 'critical' && '✗ Crítico'}
                                                                        {selectedProspect.digital_audit.social_health === 'missing' && '✗ Ausente'}
                                                                    </div>
                                                                </div>

                                                                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                                                                    <div className="text-xs text-gray-500 mb-1">Reputación</div>
                                                                    <div className={`font-bold text-sm ${selectedProspect.digital_audit.reputation === 'excellent' ? 'text-green-600' :
                                                                        selectedProspect.digital_audit.reputation === 'good' ? 'text-blue-600' :
                                                                            selectedProspect.digital_audit.reputation === 'fair' ? 'text-yellow-600' :
                                                                                'text-red-600'
                                                                        }`}>
                                                                        {selectedProspect.digital_audit.reputation === 'excellent' && '⭐ Excelente'}
                                                                        {selectedProspect.digital_audit.reputation === 'good' && '✓ Buena'}
                                                                        {selectedProspect.digital_audit.reputation === 'fair' && '→ Regular'}
                                                                        {selectedProspect.digital_audit.reputation === 'poor' && '✗ Pobre'}
                                                                    </div>
                                                                </div>

                                                                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                                                                    <div className="text-xs text-gray-500 mb-1">E-commerce</div>
                                                                    <div className="font-bold text-sm text-gray-700 dark:text-gray-300">
                                                                        {selectedProspect.digital_audit.details?.ecommerce_score || 0} pts
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Sales Intelligence */}
                                                {selectedProspect.sales_intelligence && (
                                                    <div className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 p-6 rounded-2xl border-2 border-orange-200 dark:border-orange-800">
                                                        <h4 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                                                            <Zap className="w-5 h-5 text-orange-600" />
                                                            Sales Intelligence
                                                        </h4>

                                                        {/* Pain Point */}
                                                        <div className="mb-4 p-4 bg-white dark:bg-gray-800 rounded-xl border border-orange-200 dark:border-orange-700">
                                                            <div className="text-xs text-gray-500 mb-2 flex items-center gap-2">
                                                                <AlertCircle className="w-3 h-3" />
                                                                Punto de Dolor Principal
                                                            </div>
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {selectedProspect.sales_intelligence.primary_pain_point}
                                                            </p>
                                                        </div>

                                                        {/* Opening Message */}
                                                        <div className="mb-4 p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl shadow-lg">
                                                            <div className="text-xs text-orange-100 mb-2 flex items-center gap-2">
                                                                <MessageCircle className="w-3 h-3" />
                                                                Mensaje de Apertura
                                                            </div>
                                                            <p className="text-sm font-medium italic mb-3">
                                                                "{selectedProspect.sales_intelligence.opening_message}"
                                                            </p>
                                                            <Button
                                                                size="xs"
                                                                className="bg-white text-orange-600 hover:bg-orange-50 font-bold"
                                                                onClick={() => {
                                                                    navigator.clipboard.writeText(selectedProspect.sales_intelligence.opening_message);
                                                                    toast.success('Mensaje copiado al portapapeles');
                                                                }}
                                                            >
                                                                <Copy className="w-3 h-3 mr-1" />
                                                                Copiar
                                                            </Button>
                                                        </div>

                                                        {/* Strategy & Product */}
                                                        <div className="grid grid-cols-2 gap-3">
                                                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                                <div className="text-xs text-gray-500 mb-1">Estrategia</div>
                                                                <div className="font-bold text-sm text-orange-600">
                                                                    {selectedProspect.sales_intelligence.recommended_strategy}
                                                                </div>
                                                            </div>
                                                            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                                <div className="text-xs text-gray-500 mb-1">Producto</div>
                                                                <div className="font-bold text-sm text-gray-900 dark:text-white">
                                                                    {selectedProspect.sales_intelligence.suggested_product}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Value & Probability */}
                                                        {(selectedProspect.sales_intelligence.estimated_value || selectedProspect.sales_intelligence.close_probability) && (
                                                            <div className="grid grid-cols-2 gap-3 mt-3">
                                                                {selectedProspect.sales_intelligence.estimated_value && (
                                                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                                        <div className="text-xs text-gray-500 mb-1">Valor Estimado</div>
                                                                        <div className="font-bold text-lg text-green-600">
                                                                            €{selectedProspect.sales_intelligence.estimated_value.toLocaleString()}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                                {selectedProspect.sales_intelligence.close_probability && (
                                                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg">
                                                                        <div className="text-xs text-gray-500 mb-1">Prob. Cierre</div>
                                                                        <div className="font-bold text-lg text-blue-600">
                                                                            {(selectedProspect.sales_intelligence.close_probability * 100).toFixed(0)}%
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* Empty State */}
                                                {!selectedProspect.digital_audit && !selectedProspect.sales_intelligence && (
                                                    <div className="text-center py-12 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                                        <BrainCircuit className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                                        <p className="text-gray-500 mb-4">Auditoría digital no disponible</p>
                                                        <p className="text-xs text-gray-400 mb-4">Ejecuta un "Análisis Profundo" para generar la auditoría</p>
                                                        <Button onClick={() => handleDeepAnalyze(selectedProspect.id)}>
                                                            <Sparkles className="w-4 h-4 mr-2" />
                                                            Análisis Profundo
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* TAB: WEB DEMO */}
                                        {modalActiveTab === 'demos' && (
                                            <div className="space-y-4 animate-fadeIn">
                                                <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl">
                                                    <div>
                                                        <h4 className="font-bold text-gray-900 dark:text-white">Demos Generadas</h4>
                                                        <p className="text-xs text-gray-500">Landing pages creadas para este prospecto</p>
                                                    </div>
                                                    <Button size="sm" onClick={() => setIsDemoConfigOpen(true)}>
                                                        <Plus className="w-4 h-4 mr-2" /> Nueva Demo
                                                    </Button>
                                                </div>

                                                {loadingDemos ? (
                                                    <div className="flex justify-center py-8"><RefreshCw className="animate-spin text-gray-400" /></div>
                                                ) : demoHistory.length > 0 ? (
                                                    <div className="grid gap-3">
                                                        {demoHistory.map(demo => (
                                                            <div key={demo.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded-lg">
                                                                        <Monitor className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                                                    </div>
                                                                    <div>
                                                                        <h5 className="font-medium text-gray-900 dark:text-white text-sm">Demo: {demo.type || 'Web Corporativa'}</h5>
                                                                        <div className="flex items-center gap-2 text-xs text-gray-500">
                                                                            <span>{new Date(demo.created_at).toLocaleDateString()}</span>
                                                                            <span>•</span>
                                                                            <span className="flex items-center gap-1 text-green-600">
                                                                                <Eye className="w-3 h-3" /> {demo.clicks || 0} visitas
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <Button size="sm" variant="outline" onClick={() => window.open(demo.public_url || `/demo/${demo.token}`, '_blank')}>
                                                                        <ExternalLink className="w-4 h-4 mr-2" /> Ver
                                                                    </Button>
                                                                    <button onClick={() => handleDeleteDemo(demo.id)} className="p-2 text-gray-400 hover:text-red-500">
                                                                        <Trash2 className="w-4 h-4" />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div className="text-center py-10 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                                                        <Sparkles className="w-8 h-8 text-gray-400 mx-auto mb-3" />
                                                        <p className="text-gray-500 mb-4">Sin demos generadas</p>
                                                        <Button onClick={() => setIsDemoConfigOpen(true)}>Generar Primera Demo</Button>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* TAB: INSTAGRAM */}
                                        {modalActiveTab === 'instagram' && getSocialUrl(selectedProspect.social_media?.instagram) && (
                                            <div className="space-y-4 animate-fadeIn">
                                                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white p-5 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <Instagram className="w-8 h-8" />
                                                        <div>
                                                            <h3 className="text-lg font-bold">Instagram Detectado</h3>
                                                            <p className="text-pink-100 text-xs text-opacity-80">Perfil de negocio</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                                    <span className="text-sm text-gray-500">Enlace oficial</span>
                                                    <a href={getSocialUrl(selectedProspect.social_media.instagram)} target="_blank" rel="noreferrer" className="text-pink-600 font-bold flex items-center gap-1 hover:underline">
                                                        Ver Perfil <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        )}

                                        {/* TAB: FACEBOOK */}
                                        {modalActiveTab === 'facebook' && getSocialUrl(selectedProspect.social_media?.facebook) && (
                                            <div className="space-y-4 animate-fadeIn">
                                                <div className="bg-blue-600 text-white p-5 rounded-xl">
                                                    <div className="flex items-center gap-3">
                                                        <Facebook className="w-8 h-8" />
                                                        <div>
                                                            <h3 className="text-lg font-bold">Facebook Detectado</h3>
                                                            <p className="text-blue-100 text-xs text-opacity-80">Página de empresa</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 flex justify-between items-center">
                                                    <span className="text-sm text-gray-500">Enlace oficial</span>
                                                    <a href={getSocialUrl(selectedProspect.social_media.facebook)} target="_blank" rel="noreferrer" className="text-blue-600 font-bold flex items-center gap-1 hover:underline">
                                                        Ver Página <ExternalLink className="w-3 h-3" />
                                                    </a>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Column: Right Sidebar (Inteligencia de Cierre) */}
                                    <div className={(modalActiveTab === 'summary' || modalActiveTab === 'analysis' || modalActiveTab === 'audit') ? 'lg:col-span-1' : 'hidden'}>
                                        <div className="space-y-6 animate-fadeIn sticky top-0">
                                            <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-5 rounded-2xl text-white shadow-lg relative overflow-hidden">
                                                <div className="absolute -right-4 -bottom-4 opacity-10">
                                                    <Brain className="w-24 h-24" />
                                                </div>
                                                <div className="relative z-10">
                                                    <h4 className="font-bold flex items-center gap-2 mb-1">
                                                        <Sparkles className="w-4 h-4" /> Inteligencia de Venta
                                                    </h4>
                                                    <p className="text-indigo-100 text-xs">Análisis personalizado con IA</p>
                                                </div>
                                            </div>

                                            {selectedProspect.sales_intelligence ? (
                                                <div className="space-y-4">
                                                    {/* Pain Point */}
                                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-orange-200 dark:border-orange-700 shadow-sm">
                                                        <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">Punto de Dolor</span>
                                                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 font-medium">
                                                            {selectedProspect.sales_intelligence.primary_pain_point}
                                                        </p>
                                                    </div>

                                                    {/* Estrategia */}
                                                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Estrategia Recomendada</span>
                                                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-2">
                                                            {selectedProspect.sales_intelligence.recommended_strategy}
                                                        </p>
                                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                            {selectedProspect.sales_intelligence.suggested_product}
                                                        </p>
                                                    </div>

                                                    {/* Mensaje de Apertura */}
                                                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 p-4 rounded-xl border border-green-200 dark:border-green-800">
                                                        <span className="text-[10px] font-bold text-green-600 dark:text-green-400 uppercase tracking-widest">Primer Contacto</span>
                                                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 italic leading-relaxed">
                                                            "{selectedProspect.sales_intelligence.opening_message}"
                                                        </p>
                                                        <Button
                                                            size="xs"
                                                            className="mt-3 bg-green-600 hover:bg-green-700 text-white w-full font-bold"
                                                            onClick={() => {
                                                                navigator.clipboard.writeText(selectedProspect.sales_intelligence.opening_message);
                                                                toast.success('Mensaje copiado');
                                                            }}
                                                        >
                                                            <Copy className="w-3 h-3 mr-1" />
                                                            Copiar Mensaje
                                                        </Button>
                                                    </div>

                                                    {/* Métricas */}
                                                    {(selectedProspect.sales_intelligence.estimated_value || selectedProspect.sales_intelligence.close_probability) && (
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {selectedProspect.sales_intelligence.estimated_value && (
                                                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                                                                    <div className="text-[10px] text-gray-500 mb-1">Valor</div>
                                                                    <div className="font-bold text-sm text-green-600">
                                                                        €{selectedProspect.sales_intelligence.estimated_value.toLocaleString()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {selectedProspect.sales_intelligence.close_probability && (
                                                                <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
                                                                    <div className="text-[10px] text-gray-500 mb-1">Prob. Cierre</div>
                                                                    <div className="font-bold text-sm text-blue-600">
                                                                        {(selectedProspect.sales_intelligence.close_probability * 100).toFixed(0)}%
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : selectedProspect.ai_analysis ? (
                                                // Fallback a ai_analysis antiguo si existe
                                                <div className="space-y-4">
                                                    <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Oportunidad</span>
                                                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 font-medium italic">
                                                            "{selectedProspect.ai_analysis.opportunity_map?.pain_points?.[0]?.substring(0, 150)}..."
                                                        </p>
                                                    </div>
                                                    <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                                        <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Estrategia</span>
                                                        <p className="text-xs text-gray-700 dark:text-gray-300 mt-2 leading-relaxed">
                                                            {selectedProspect.ai_analysis.approach_strategy?.substring(0, 200)}...
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
                                                    <BrainCircuit className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                                                    <p className="text-xs text-gray-400 px-4 leading-relaxed mb-4">Ejecuta un análisis profundo para obtener insights de venta</p>
                                                    <Button
                                                        size="sm"
                                                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                                                        onClick={() => handleDeepAnalyze(selectedProspect.id)}
                                                        disabled={analyzingId === selectedProspect.id}
                                                    >
                                                        {analyzingId === selectedProspect.id ? (
                                                            <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Analizando...</>
                                                        ) : (
                                                            <><Sparkles className="w-4 h-4 mr-2" /> Análisis Profundo</>
                                                        )}
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Modal Footer - Simple sticky */}
                                <div className="mt-8 pt-4 border-t border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <Button variant="ghost" onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(selectedProspect.address)}`, '_blank')} className="text-gray-500 hover:text-orange-600">
                                        <MapPin className="w-4 h-4 mr-2" /> Google Maps
                                    </Button>
                                    <Button onClick={() => setIsDetailModalOpen(false)} className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-8 rounded-xl font-bold">
                                        Cerrar Detalle
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </Modal>

                {/* Demo Configuration Modal */}
                < Modal isOpen={isDemoConfigOpen} onClose={() => setIsDemoConfigOpen(false)} title="Configurar Demo Web" size="lg" >
                    {selectedProspect && (
                        <div className="space-y-6">
                            {/* Demo Type Selection */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-medium text-gray-700">Tipo de Demo</label>
                                    <Button size="sm" variant="ghost" onClick={() => setIsAddDemoTypeOpen(true)} className="text-indigo-600 hover:text-indigo-700">
                                        <Plus className="w-4 h-4 mr-1" /> Nuevo Tipo
                                    </Button>
                                </div>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-[220px] overflow-y-auto p-1">
                                    {demoTypes.map(type => (
                                        <div key={type.id} className="relative group">
                                            <button
                                                onClick={() => setDemoType(type.id)}
                                                className={`w-full p-3 rounded-lg border-2 text-left transition-all h-full dark:bg-gray-800 ${demoType === type.id
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 shadow-sm'
                                                    : 'border-gray-200 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2 mb-1">
                                                    <div className={`${demoType === type.id ? 'text-indigo-600' : 'text-gray-400'}`}>
                                                        {renderDemoIcon(type.icon, "w-5 h-5")}
                                                    </div>
                                                    <span className="font-bold text-sm text-gray-900 dark:text-white">{type.label}</span>
                                                </div>
                                                <p className="text-[10px] text-gray-500 dark:text-gray-400 line-clamp-2 leading-tight">{type.desc}</p>
                                            </button>
                                            {type.isCustom && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDeleteDemoType(type.id); }}
                                                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Prompt Area */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    {demoType === 'custom' ? 'Escribe tu prompt' : 'Instrucciones adicionales (opcional)'}
                                </label>
                                <textarea
                                    value={demoCustomPrompt}
                                    onChange={(e) => setDemoCustomPrompt(e.target.value)}
                                    placeholder={demoType === 'custom'
                                        ? 'Describe exactamente cómo quieres la landing page...'
                                        : 'Añade instrucciones específicas para mejorar la demo...'}
                                    className="w-full px-3 py-2 border rounded-lg text-sm h-24 resize-none bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white dark:placeholder-gray-500"
                                />
                            </div>

                            {/* Image Preview Section */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Imágenes para la Demo</label>
                                    <Button size="sm" variant="outline" onClick={handlePreviewDemoImages} disabled={demoGenerationStage === 'images'}>
                                        {demoGenerationStage === 'images' ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <ImageIcon className="w-4 h-4 mr-1" />}
                                        {demoPreviewImages.length > 0 ? 'Recargar' : 'Ver Imágenes'}
                                    </Button>
                                </div>
                                {demoPreviewImages.length > 0 ? (
                                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 max-h-[180px] overflow-y-auto p-1 border rounded-lg dark:border-gray-700">
                                        {demoPreviewImages.map((img, idx) => (
                                            <div key={idx} className="relative group aspect-square">
                                                <img
                                                    src={img.url}
                                                    alt={img.label}
                                                    className="w-full h-full object-cover rounded-md border"
                                                    loading="lazy"
                                                    onError={(e) => {
                                                        console.log("Error loading image:", img.url);
                                                        e.target.src = `https://via.placeholder.com/200x200?text=Error+Loading&bg=f3f4f6&fg=9ca3af`;
                                                    }}
                                                />
                                                <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[8px] p-0.5 rounded-b-md opacity-0 group-hover:opacity-100 transition-opacity truncate text-center">
                                                    {img.label}
                                                </div>
                                                <span className={`absolute top-0.5 right-0.5 text-[8px] px-1 rounded shadow-sm ${img.source === 'Google Places' ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                                                    {img.source === 'Google Places' ? '📍' : '📷'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-6 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-dashed dark:border-gray-700">
                                        <ImageIcon className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                                        <p className="text-sm text-gray-400 dark:text-gray-500">Haz clic en "Ver Imágenes" para previsualizar</p>
                                    </div>
                                )}
                            </div>

                            {/* Generation Progress */}
                            {demoGenerationStage && (
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                    <div className="flex items-center gap-3">
                                        <RefreshCw className="w-5 h-5 text-indigo-600 dark:text-indigo-400 animate-spin" />
                                        <div>
                                            <p className="font-medium text-indigo-900 dark:text-indigo-200">
                                                {demoGenerationStage === 'analyzing' && '🔍 Analizando datos del prospecto...'}
                                                {demoGenerationStage === 'images' && '🖼️ Preparando imágenes de alta calidad...'}
                                                {demoGenerationStage === 'generating' && '⚡ Generando landing page espectacular...'}
                                                {demoGenerationStage === 'done' && '✅ ¡Demo lista!'}
                                            </p>
                                            <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1">Esto puede tardar unos segundos</p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsDemoConfigOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700"
                                    onClick={() => handleGenerateDemo(selectedProspect.id)}
                                    disabled={generatingDemoId === selectedProspect.id}
                                >
                                    {generatingDemoId === selectedProspect.id ? (
                                        <><RefreshCw className="w-4 h-4 animate-spin mr-2" /> Generando...</>
                                    ) : (
                                        <><Sparkles className="w-4 h-4 mr-2" /> Generar Demo</>
                                    )}
                                </Button>
                            </div>
                        </div>
                    )}
                </Modal >
                {/* Modal: Add Custom Demo Type */}
                < Modal isOpen={isAddDemoTypeOpen} onClose={() => setIsAddDemoTypeOpen(false)} title="Nuevo Tipo de Demo" size="sm" >
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre del Tipo</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                placeholder="Ej: Odontología, Gimnasio..."
                                value={newDemoType.label}
                                onChange={(e) => setNewDemoType({ ...newDemoType, label: e.target.value, id: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Icono Visual</label>
                            <div className="grid grid-cols-6 gap-2">
                                {[
                                    { n: 'Zap', i: Zap }, { n: 'Utensils', i: Utensils }, { n: 'Store', i: Store },
                                    { n: 'Briefcase', i: Briefcase }, { n: 'Sparkles', i: Sparkles }, { n: 'MessageSquare', i: MessageSquare },
                                    { n: 'ShoppingBag', i: ShoppingBag }, { n: 'Coffee', i: Coffee }, { n: 'Hotel', i: Hotel },
                                    { n: 'Dumbbell', i: Dumbbell }, { n: 'Scissors', i: Scissors }, { n: 'Stethoscope', i: Stethoscope }
                                ].map(item => (
                                    <button
                                        key={item.n}
                                        onClick={() => setNewDemoType({ ...newDemoType, icon: item.n })}
                                        className={`p-2 flex items-center justify-center rounded-lg border-2 transition-all ${newDemoType.icon === item.n ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30' : 'border-gray-100 dark:border-gray-700 hover:border-indigo-200 dark:hover:border-indigo-700'}`}
                                        title={item.n}
                                    >
                                        <item.i className={`w-5 h-5 ${newDemoType.icon === item.n ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-400'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción corta</label>
                            <input
                                type="text"
                                className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                                placeholder="Breve descripción del estilo..."
                                value={newDemoType.desc}
                                onChange={(e) => setNewDemoType({ ...newDemoType, desc: e.target.value })}
                            />
                        </div>
                        <div className="flex gap-2 pt-2">
                            <Button className="flex-1" onClick={handleAddDemoType}>Añadir tipo</Button>
                            <Button variant="outline" onClick={() => setIsAddDemoTypeOpen(false)}>Cancelar</Button>
                        </div>
                    </div>
                </Modal >

                {/* Modal: AI Strategy Settings */}
                < Modal isOpen={isStrategyModalOpen} onClose={() => setIsStrategyModalOpen(false)} title="Estrategias de Venta IA" size="xl" >
                    <HunterStrategiesSettings
                        API_URL={API_URL}
                        token={token}
                        onClose={() => setIsStrategyModalOpen(false)}
                    />
                </Modal >

                {/* Modal: Strategy Manager from Search Form */}
                <Modal isOpen={strategyManagerOpen} onClose={() => { setStrategyManagerOpen(false); fetchStrategies(); }} title="Gestionar Estrategias IA" size="xl">
                    <HunterStrategiesSettings
                        API_URL={API_URL}
                        token={token}
                        onClose={() => { setStrategyManagerOpen(false); fetchStrategies(); }}
                    />
                </Modal>


                {/* Modal: Advanced AI Settings */}
                < Modal isOpen={isAiSettingsModalOpen} onClose={() => setIsAiSettingsModalOpen(false)} title="Configuración Avanzada" size="xl" >
                    <LeadHunterSettings
                        API_URL={API_URL}
                        token={token}
                        onClose={() => setIsAiSettingsModalOpen(false)}
                    />
                </Modal >

                {/* Modal: Manage Business Types */}
                < Modal isOpen={isManageTypesModalOpen} onClose={() => setIsManageTypesModalOpen(false)} title="Gestionar Tipos de Negocio" size="xl" >
                    <BusinessTypesSettings
                        API_URL={API_URL}
                        token={token}
                        onClose={() => setIsManageTypesModalOpen(false)}
                    />
                </Modal >


                {/* Custom Confirmation Modal */}
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                    onConfirm={confirmModal.onConfirm}
                    title={confirmModal.title}
                    message={confirmModal.message}
                    type={confirmModal.variant || 'danger'}
                />
            </div >
        </div >
    );
};

export default LeadHunterDashboard;
