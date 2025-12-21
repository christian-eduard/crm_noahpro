import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../contexts/ThemeContext';
import { API_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import {
    Upload, ArrowRight, CheckCircle, FileText, Target, Trophy, DollarSign, Rocket, Globe, ChevronDown, Check, Sun, Moon
} from 'lucide-react';

const CareersApply = () => {
    const { t, i18n } = useTranslation('recruitment');
    const { theme, toggleTheme, autoMode, enableAutoMode } = useTheme();
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        linkedin_url: '',
        position: 'sdr_hunter'
    });
    const [cvFile, setCvFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const toast = useToast();

    // Forzar modo oscuro por defecto en esta landing
    useEffect(() => {
        if (theme !== 'dark') {
            toggleTheme();
        }
    }, []); // Solo al montar

    const handleFileChange = (e) => {
        if (e.target.files[0]) {
            setCvFile(e.target.files[0]);
        }
    };

    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
        setLangMenuOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!cvFile) {
            toast.error(i18n.language === 'es' ? "Falta CV" : "CV missing");
            return;
        }

        setLoading(true);
        const data = new FormData();
        data.append('full_name', formData.full_name);
        data.append('email', formData.email);
        data.append('linkedin_url', formData.linkedin_url);
        data.append('position', formData.position);
        data.append('cv', cvFile);
        data.append('lang', i18n.language);

        try {
            const response = await fetch(`${API_URL}/recruitment/apply`, {
                method: 'POST',
                body: data
            });

            if (response.ok) {
                setSubmitted(true);
                toast.success('OK');
            } else {
                toast.error('Error');
            }
        } catch (error) {
            toast.error('Connection Error');
        } finally {
            setLoading(false);
        }
    };

    const LangSelector = () => {
        const languages = [
            { code: 'es', label: 'Español', flag: 'es' },
            { code: 'en', label: 'English', flag: 'us' },
            { code: 'fr', label: 'Français', flag: 'fr' },
            { code: 'it', label: 'Italiano', flag: 'it' },
            { code: 'de', label: 'Deutsch', flag: 'de' },
            { code: 'ch', label: 'Schweiz', flag: 'ch' }
        ];

        return (
            <div className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setLangMenuOpen(!langMenuOpen);
                    }}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-2 border-white/30 hover:border-white/50 shadow-lg"
                >
                    <Globe size={18} className="drop-shadow" />
                    <span className="uppercase text-sm font-bold tracking-wide drop-shadow">{i18n.language}</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 drop-shadow ${langMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {langMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setLangMenuOpen(false)}></div>
                        <div className="absolute top-full right-0 mt-2 w-56 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-40 overflow-hidden">
                            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                Select Language
                            </div>
                            {languages.map(l => (
                                <button
                                    key={l.code}
                                    onClick={() => changeLanguage(l.code)}
                                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${i18n.language === l.code ? 'text-orange-600 font-bold bg-orange-50 dark:bg-orange-900/20' : 'text-slate-600 dark:text-slate-300 font-medium'
                                        }`}
                                >
                                    <span className="flex items-center gap-3">
                                        <img
                                            src={`https://flagcdn.com/w40/${l.flag}.png`}
                                            alt={l.label}
                                            className="w-6 h-4 object-cover rounded shadow-sm"
                                        />
                                        {l.label}
                                    </span>
                                    {i18n.language === l.code && <Check size={16} />}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    const ThemeToggle = () => (
        <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border-2 border-white/30 hover:border-white/50 transition-all shadow-lg"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
            {theme === 'dark' ? <Sun size={18} className="drop-shadow" /> : <Moon size={18} className="drop-shadow" />}
        </button>
    );

    if (submitted) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 flex flex-col items-center justify-center p-4 animate-in fade-in duration-700">
                <div className="bg-white dark:bg-slate-800 rounded-3xl p-8 max-w-lg w-full text-center shadow-2xl border border-slate-100 dark:border-slate-700">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        {t('success_title')}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg"
                        dangerouslySetInnerHTML={{ __html: t('success_msg').replace('{name}', formData.full_name) }}>
                    </p>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-xl text-left mb-6 border border-orange-100 dark:border-orange-800">
                        <h4 className="font-semibold text-orange-900 dark:text-orange-300 flex items-center gap-2 mb-2">
                            <Rocket className="w-4 h-4" /> {t('success_speed_title')}
                        </h4>
                        <p className="text-sm text-orange-800 dark:text-orange-200">
                            {t('success_speed_desc')}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    const benefits = t('benefits', { returnObjects: true });

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900 text-gray-900 dark:text-white font-sans transition-colors duration-300">
            {/* Header / Nav */}
            <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
                <div className="flex items-center gap-3 font-bold text-2xl tracking-tight">
                    <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:rotate-6 transition-transform">
                        <Trophy className="w-7 h-7 text-white" />
                    </div>
                    <div className="hidden sm:block">
                        <div className="flex items-center gap-2">
                            <span className="text-slate-900 dark:text-white">NoahPro</span>
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">Talent</span>
                        </div>
                        <div className="text-[10px] uppercase tracking-widest text-orange-600 dark:text-orange-400 font-bold -mt-1">
                            {t('tagline')}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <LangSelector />
                </div>
            </nav>

            <div className="flex flex-col lg:flex-row min-h-screen">

                {/* Left Side */}
                <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative overflow-hidden">
                    {/* Decorative background */}
                    <div className="absolute inset-0 opacity-10 dark:opacity-5">
                        <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
                        <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-500 rounded-full blur-3xl"></div>
                    </div>

                    <div className="max-w-xl relative z-10 pt-20 lg:pt-0">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-sm font-bold mb-8 uppercase tracking-wide border border-red-200 dark:border-red-800 shadow-lg">
                            <Target className="w-4 h-4" /> {t('hero_badge')}
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-black tracking-tight mb-6 leading-none text-slate-900 dark:text-white">
                            {t('hero_title_1')} <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 via-red-500 to-pink-600 animate-gradient">
                                {t('hero_title_2')}
                            </span>
                        </h1>
                        <p className="text-xl text-gray-700 dark:text-gray-300 mb-10 leading-relaxed font-medium"
                            dangerouslySetInnerHTML={{ __html: t('hero_desc') }}>
                        </p>

                        <div className="space-y-6">
                            {benefits.map((item, i) => {
                                const icons = [DollarSign, Rocket, Trophy];
                                const colors = ['from-green-500 to-emerald-600', 'from-blue-500 to-cyan-600', 'from-purple-500 to-pink-600'];
                                const Icon = icons[i];
                                return (
                                    <div key={i} className="flex items-start gap-4 group hover:translate-x-2 transition-all duration-300 cursor-default">
                                        <div className={`p-4 bg-gradient-to-br ${colors[i]} rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow`}>
                                            <Icon className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-1">{item.title}</h3>
                                            <p className="text-gray-600 dark:text-gray-400 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="lg:w-1/2 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl flex items-center justify-center p-8 lg:p-16 relative border-l border-slate-200/50 dark:border-slate-700/50">
                    <div className="w-full max-w-md">
                        <div className="mb-8">
                            <h2 className="text-4xl font-bold mb-2 text-slate-900 dark:text-white">{t('form_title')}</h2>
                            <p className="text-gray-600 dark:text-gray-400 text-lg">{t('form_subtitle')}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('labels.name')}</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder={t('placeholders.name')}
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('labels.email')}</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder={t('placeholders.email')}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('labels.position')}</label>
                                <select
                                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all outline-none font-medium appearance-none cursor-pointer text-gray-900 dark:text-white"
                                    value={formData.position}
                                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                                >
                                    <option value="sdr_hunter">{t('positions.sdr')}</option>
                                    <option value="account_executive">{t('positions.ae')}</option>
                                    <option value="sales_manager">{t('positions.manager')}</option>
                                    <option value="enterprise_sales">{t('positions.enterprise')}</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('labels.linkedin')}</label>
                                <input
                                    type="url"
                                    className="w-full px-4 py-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500 dark:focus:border-orange-400 transition-all outline-none font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                                    placeholder={t('placeholders.linkedin')}
                                    value={formData.linkedin_url}
                                    onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold mb-2 text-gray-700 dark:text-gray-300">{t('labels.cv')}</label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-8 text-center hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:border-orange-400 dark:hover:border-orange-500 transition-all cursor-pointer relative group">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx,.txt"
                                        onChange={handleFileChange}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                    />
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="p-4 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl group-hover:scale-110 transition-transform shadow-lg">
                                            {cvFile ? <FileText className="w-8 h-8 text-white" /> : <Upload className="w-8 h-8 text-white" />}
                                        </div>
                                        {cvFile ? (
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm break-all line-clamp-1">{cvFile.name}</p>
                                                <p className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">{t('upload_ready')}</p>
                                            </div>
                                        ) : (
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm mb-1">{t('upload_cta')}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{t('upload_hint')}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-orange-600 via-red-600 to-pink-600 text-white font-bold py-5 rounded-2xl shadow-xl shadow-orange-500/30 hover:shadow-2xl hover:shadow-orange-500/50 hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2 text-lg relative overflow-hidden group"
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                <span className="relative z-10 flex items-center gap-2">
                                    {loading ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                    ) : (
                                        <>
                                            {t('cta_button')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </span>
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CareersApply;
