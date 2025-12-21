import { API_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ContactForm from './ContactForm';
import ChatWidget from './ChatWidget';
import AnalyticsTracker from '../analytics/AnalyticsTracker';
import { CheckCircle, Shield, Zap, Layout, Menu, X, Star, TrendingUp, Users, ArrowRight, BarChart3, ChefHat, Globe, ChevronDown, Check } from 'lucide-react';

const LandingPage = () => {
    const { t, i18n } = useTranslation('landing');
    const [showContactForm, setShowContactForm] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [langMenuOpen, setLangMenuOpen] = useState(false);
    const [demoUrl, setDemoUrl] = useState('http://localhost:5173/demo');

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        fetch(`${API_URL}/settings/public`)
            .then(res => res.json())
            .then(data => {
                setDemoUrl(data.demo_url || 'http://localhost:5173/demo');
            })
            .catch(err => {
                console.error('Error loading settings:', err);
                setDemoUrl('http://localhost:5173/demo');
            });
    }, []);

    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        setMobileMenuOpen(false);
    };

    const changeLanguage = (code) => {
        i18n.changeLanguage(code);
        setLangMenuOpen(false);
    };

    const LangSelector = ({ mobile = false }) => {
        const languages = [
            { code: 'es', label: 'Español', flag: 'es' },
            { code: 'en', label: 'English', flag: 'us' },
            { code: 'fr', label: 'Français', flag: 'fr' },
            { code: 'it', label: 'Italiano', flag: 'it' },
            { code: 'de', label: 'Deutsch', flag: 'de' },
            { code: 'ch', label: 'Schweiz', flag: 'ch' }
        ];

        const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

        return (
            <div className={`relative ${mobile ? 'w-full flex justify-center py-4' : 'ml-4'}`}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setLangMenuOpen(!langMenuOpen);
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${scrolled || mobile
                        ? 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                        : 'text-white/90 bg-white/10 hover:bg-white/20 backdrop-blur-sm'
                        }`}
                >
                    <Globe size={18} />
                    <span className="uppercase text-sm font-bold tracking-wide">{i18n.language}</span>
                    <ChevronDown size={14} className={`transition-transform duration-300 ${langMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {langMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-30" onClick={() => setLangMenuOpen(false)}></div>
                        <div className={`absolute mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-40 overflow-hidden animate-in fade-in zoom-in-95 duration-200 ${mobile ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : 'top-full right-0'}`}>
                            <div className="px-4 py-2 border-b border-slate-50 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                Select Language
                            </div>
                            {languages.map(l => (
                                <button
                                    key={l.code}
                                    onClick={() => changeLanguage(l.code)}
                                    className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-50 transition-colors ${i18n.language === l.code ? 'text-orange-600 font-bold bg-orange-50' : 'text-slate-600 font-medium'
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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
            <AnalyticsTracker />
            <ChatWidget />

            {/* Navbar */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Zap size={20} fill="currentColor" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>NoahPro Tpv</h1>
                                <p className="text-[10px] uppercase tracking-widest text-orange-500 font-bold">Verifactu Ready</p>
                            </div>
                        </div>

                        <div className="hidden md:flex items-center space-x-6">
                            {[
                                { label: t('nav.benefits'), id: 'beneficios' },
                                { label: t('nav.verifactu'), id: 'verifactu' },
                                { label: t('nav.how'), id: 'como-funciona' }
                            ].map((item) => (
                                <button
                                    key={item.label}
                                    onClick={() => scrollToSection(item.id)}
                                    className={`text-sm font-medium transition-colors hover:text-orange-500 ${scrolled ? 'text-slate-600' : 'text-white/90'}`}
                                >
                                    {item.label}
                                </button>
                            ))}

                            <LangSelector />

                            <div className="flex items-center space-x-4 ml-4">
                                <button
                                    onClick={() => window.location.href = demoUrl}
                                    className={`text-sm font-semibold transition-colors hover:text-orange-500 ${scrolled ? 'text-slate-900' : 'text-white'}`}
                                >
                                    {t('nav.demo')}
                                </button>
                                <button
                                    onClick={() => setShowContactForm(true)}
                                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full text-sm font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all transform hover:scale-105"
                                >
                                    {t('nav.cta')}
                                </button>
                            </div>
                        </div>

                        <div className="md:hidden flex items-center">
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`p-2 ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col space-y-4 animate-fade-in-down">
                        <button onClick={() => scrollToSection('beneficios')} className="text-left font-medium text-slate-600 py-2">{t('nav.benefits')}</button>
                        <button onClick={() => scrollToSection('verifactu')} className="text-left font-medium text-slate-600 py-2">{t('nav.verifactu')}</button>
                        <button onClick={() => scrollToSection('como-funciona')} className="text-left font font-medium text-slate-600 py-2">{t('nav.how')}</button>
                        <LangSelector mobile={true} />
                        <hr className="border-slate-100" />
                        <button onClick={() => window.location.href = demoUrl} className="text-center font-semibold text-slate-900 py-2">{t('nav.demo')}</button>
                        <button onClick={() => setShowContactForm(true)} className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold">{t('nav.cta')}</button>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                <div
                    className="absolute inset-0 z-0 bg-fixed bg-cover bg-center"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')" }}
                >
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
                    <div className="inline-flex items-center space-x-2 bg-green-500/20 backdrop-blur-md border border-green-400/30 px-4 py-1.5 rounded-full text-sm font-semibold text-green-300 mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                        <span>{t('hero.badge')}</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
                        {t('hero.title1')} <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">{t('hero.title2')}</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed font-light" dangerouslySetInnerHTML={{ __html: t('hero.desc') }} />

                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-600/30 hover:bg-orange-700 transition-all transform hover:scale-105 flex items-center justify-center"
                        >
                            {t('hero.cta1')} <ArrowRight className="ml-2" size={20} />
                        </button>
                        <button
                            onClick={() => window.location.href = demoUrl}
                            className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all transform hover:scale-105 flex items-center justify-center"
                        >
                            {t('hero.cta2')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="beneficios" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl font-bold text-slate-900 mb-6">{t('benefits.title')}</h2>
                        <p className="text-xl text-slate-600">{t('benefits.subtitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                            <img
                                src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop"
                                alt="Gestión eficiente"
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-8">
                                <h3 className="text-2xl font-bold text-white">{t('benefits.image_title')}</h3>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                    <Zap size={24} />
                                </div>
                                <div className="ml-6">
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">{t('benefits.b1.title')}</h4>
                                    <p className="text-slate-600">{t('benefits.b1.desc')}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Users size={24} />
                                </div>
                                <div className="ml-6">
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">{t('benefits.b2.title')}</h4>
                                    <p className="text-slate-600">{t('benefits.b2.desc')}</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                                    <BarChart3 size={24} />
                                </div>
                                <div className="ml-6">
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">{t('benefits.b3.title')}</h4>
                                    <p className="text-slate-600">{t('benefits.b3.desc')}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Sectors Section */}
            <section className="py-24 bg-gradient-to-br from-slate-900 to-slate-800 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-orange-500 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-500 rounded-full blur-3xl"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">{t('sectors.title')}</h2>
                        <p className="text-xl text-slate-300 max-w-3xl mx-auto">{t('sectors.subtitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {[
                            { icon: ChefHat, color: 'bg-orange-500', key: 's1' },
                            { icon: Layout, color: 'bg-blue-500', key: 's2' },
                            { icon: Star, color: 'bg-pink-500', key: 's3' },
                            { icon: Users, color: 'bg-purple-500', key: 's4' }
                        ].map((s) => (
                            <div key={s.key} className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl border border-white/20 hover:bg-white/15 transition-all">
                                <div className={`h-12 w-12 ${s.color} rounded-xl flex items-center justify-center mb-4`}>
                                    <s.icon size={24} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold mb-3">{t(`sectors.${s.key}.title`)}</h3>
                                <p className="text-slate-300 text-sm mb-4">{t(`sectors.${s.key}.desc`)}</p>
                                <ul className="space-y-2 text-sm text-slate-400">
                                    <li className="flex items-center"><CheckCircle size={16} className="text-green-400 mr-2" />{t(`sectors.${s.key}.f1`)}</li>
                                    <li className="flex items-center"><CheckCircle size={16} className="text-green-400 mr-2" />{t(`sectors.${s.key}.f2`)}</li>
                                </ul>
                            </div>
                        ))}
                    </div>

                    <div className="text-center mt-12">
                        <p className="text-lg text-slate-300 mb-6" dangerouslySetInnerHTML={{ __html: t('sectors.custom') }} />
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="px-8 py-3 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700 transition-all shadow-lg"
                        >
                            {t('sectors.cta')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Verifactu Section */}
            <section id="verifactu" className="py-24 bg-slate-50 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-bl-full -mr-16 -mt-16 z-0"></div>
                                <div className="relative z-10">
                                    <div className="flex items-center space-x-3 mb-8">
                                        <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                            <Shield size={20} />
                                        </div>
                                        <h3 className="text-xl font-bold text-slate-900">{t('verifactu.title')}</h3>
                                    </div>

                                    <div className="space-y-0">
                                        {[1, 2, 3].map((step, i) => {
                                            const stepKey = `s${step}`;
                                            const colors = ['bg-blue-600', 'bg-purple-600', 'bg-green-600'];
                                            return (
                                                <div key={i} className={`flex relative ${i < 2 ? 'pb-8' : ''}`}>
                                                    {i < 2 && (
                                                        <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                                                            <div className="h-full w-1 bg-slate-100 pointer-events-none"></div>
                                                        </div>
                                                    )}
                                                    <div className={`flex-shrink-0 w-10 h-10 rounded-full ${colors[i]} text-white flex items-center justify-center relative z-10 font-bold`}>{step}</div>
                                                    <div className="pl-6 pt-2">
                                                        <h4 className="font-bold text-slate-900 text-lg">{t(`verifactu.steps.${stepKey}.title`)}</h4>
                                                        <p className="text-slate-500">{t(`verifactu.steps.${stepKey}.desc`)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="inline-block px-4 py-1 bg-red-100 text-red-600 rounded-full font-bold text-sm mb-4">
                                {t('verifactu.badge')}
                            </div>
                            <h3 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
                                {t('verifactu.title')}
                            </h3>
                            <p className="text-lg text-slate-600 mb-6 leading-relaxed" dangerouslySetInnerHTML={{ __html: t('verifactu.desc') }} />

                            <div className="bg-green-50 border-l-4 border-green-500 p-4 mb-8 rounded-r-lg">
                                <div className="flex items-start">
                                    <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 mr-3" />
                                    <div>
                                        <p className="text-sm font-semibold text-green-800 mb-1">{t('verifactu.alert_title')}</p>
                                        <p className="text-sm text-green-700">{t('verifactu.alert_desc')}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                {t('verifactu.features', { returnObjects: true }).map((f, i) => (
                                    <div key={i} className="flex items-center space-x-2 text-slate-700">
                                        <CheckCircle className="text-green-500" size={20} />
                                        <span>{f}</span>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowContactForm(true)} className="text-orange-600 font-bold hover:text-orange-700 flex items-center group text-lg">
                                {t('verifactu.cta')} <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Parallax Quote */}
            <section className="py-32 bg-slate-900 text-white relative">
                <div className="absolute inset-0 bg-fixed bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/60 to-slate-900"></div>
                <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
                    <h3 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                        {t('quote.text')}
                    </h3>
                    <div className="w-24 h-1 bg-orange-500 mx-auto rounded-full mb-8"></div>
                    <div className="flex justify-center opacity-20"><TrendingUp size={100} className="text-white" /></div>
                </div>
            </section>

            {/* Steps Section */}
            <section id="como-funciona" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">{t('steps.title')}</h2>
                        <p className="text-xl text-slate-600">{t('steps.subtitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        {[1, 2, 3].map((s) => {
                            const stepKey = `s${s}`;
                            return (
                                <div key={s} className="p-6">
                                    <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600 font-bold text-2xl">{s}</div>
                                    <h3 className="text-xl font-bold text-slate-900 mb-3">{t(`steps.${stepKey}.title`)}</h3>
                                    <p className="text-slate-600">{t(`steps.${stepKey}.desc`)}</p>
                                </div>
                            )
                        })}
                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
                        >
                            {t('steps.cta')}
                        </button>
                    </div>
                </div>
            </section>

            {/* Mobility Section */}
            <section className="py-24 bg-slate-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">{t('mobility.title')}</h2>
                            <p className="text-lg text-slate-600 mb-6">{t('mobility.desc')}</p>
                            <ul className="space-y-4 mb-8">
                                {[t('mobility.l1'), t('mobility.l2'), t('mobility.l3')].map((l, i) => (
                                    <li key={i} className="flex items-center space-x-3">
                                        <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                                        <span className="text-slate-700">{l}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                            <img src="https://images.unsplash.com/photo-1556742111-a301076d9d18?q=80&w=2070&auto=format&fit=crop" alt="Control" className="relative rounded-2xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500" />
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials */}
            <section className="py-24 bg-slate-900 text-white relative">
                <div className="absolute inset-0 bg-fixed bg-cover bg-center opacity-30" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/60 to-slate-900"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">{t('testimonials.title')}</h2>
                        <p className="text-xl text-slate-400">{t('testimonials.subtitle')}</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            { quote: t('testimonials.t1'), author: "Carlos Ruiz", role: "Manager" },
                            { quote: t('testimonials.t2'), author: "Elena M.", role: "Freelance" },
                            { quote: t('testimonials.t3'), author: "Javier T.", role: "CEO" }
                        ].map((item, idx) => (
                            <div key={idx} className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="flex text-orange-500 mb-4">
                                    {[...Array(5)].map((_, i) => <Star key={i} size={16} fill="currentColor" />)}
                                </div>
                                <p className="text-lg text-slate-300 mb-6 italic">"{item.quote}"</p>
                                <div><p className="font-bold text-white">{item.author}</p><p className="text-sm text-slate-500">{item.role}</p></div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Final */}
            <section className="py-24 bg-gradient-to-br from-orange-600 to-red-700 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
                <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">{t('final_cta.title')}</h2>
                    <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">{t('final_cta.desc')}</p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="px-10 py-5 bg-white text-orange-700 rounded-2xl font-bold text-xl shadow-2xl shadow-black/20 hover:bg-orange-50 transition-all transform hover:scale-105"
                        >
                            {t('final_cta.button')}
                        </button>
                    </div>
                    <p className="mt-8 text-sm text-orange-200 opacity-80">{t('final_cta.note')}</p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white"><Zap size={16} fill="currentColor" /></div>
                                <span className="text-xl font-bold text-white">NoahPro Tpv</span>
                            </div>
                            <p className="max-w-xs mb-4">{t('footer.desc')}</p>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">{t('footer.product')}</h4>
                            <ul className="space-y-2">
                                <li><button onClick={() => scrollToSection('beneficios')} className="hover:text-orange-500 transition-colors">{t('nav.benefits')}</button></li>
                                <li><button onClick={() => scrollToSection('verifactu')} className="hover:text-orange-500 transition-colors">{t('nav.verifactu')}</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">{t('footer.company')}</h4>
                            <ul className="space-y-2">
                                <li>
                                    <a href="/careers/apply" className="hover:text-orange-500 transition-colors flex items-center gap-1">
                                        {t('footer.careers')}
                                        <span className="text-green-500">●</span>
                                    </a>
                                </li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">{t('footer.about')}</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">{t('footer.contact')}</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-900 pt-8 text-center text-sm">
                        <p>© 2025 NoahPro Tpv. {t('footer.rights')}</p>
                    </div>
                </div>
            </footer>

            {/* Modal Contact Form */}
            {showContactForm && (
                <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setShowContactForm(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
                        <div className="relative inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full">
                            <div className="absolute top-4 right-4 z-10">
                                <button onClick={() => setShowContactForm(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                    <X size={24} />
                                </button>
                            </div>
                            <div className="p-1">
                                <ContactForm onClose={() => setShowContactForm(false)} />
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LandingPage;
