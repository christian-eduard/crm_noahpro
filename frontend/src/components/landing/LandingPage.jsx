import { API_URL, SOCKET_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import ContactForm from './ContactForm';
import ChatWidget from './ChatWidget';
import AnalyticsTracker from '../analytics/AnalyticsTracker';
import { CheckCircle, Shield, Zap, Layout, ChevronRight, Star, Menu, X, Smartphone, Clock, TrendingUp, Users, ArrowRight, BarChart3, Lock, ChefHat } from 'lucide-react';

const LandingPage = () => {
    const [showContactForm, setShowContactForm] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-orange-500 selection:text-white overflow-x-hidden">
            <AnalyticsTracker />
            <ChatWidget />

            {/* Navbar */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-white/95 backdrop-blur-md shadow-md py-2' : 'bg-transparent py-4'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        {/* Logo */}
                        <div className="flex items-center space-x-3 cursor-pointer group" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                            <div className="h-10 w-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-orange-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Zap size={20} fill="currentColor" />
                            </div>
                            <div>
                                <h1 className={`text-xl font-bold tracking-tight transition-colors ${scrolled ? 'text-slate-900' : 'text-white'}`}>NoahPro Tpv</h1>
                                <p className="text-[10px] uppercase tracking-widest text-orange-500 font-bold">Verifactu Ready</p>
                            </div>
                        </div>

                        {/* Desktop Menu */}
                        <div className="hidden md:flex items-center space-x-8">
                            {['Beneficios', 'Verifactu', 'Cómo Funciona'].map((item) => (
                                <button
                                    key={item}
                                    onClick={() => scrollToSection(item.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '-'))}
                                    className={`text-sm font-medium transition-colors hover:text-orange-500 ${scrolled ? 'text-slate-600' : 'text-white/90'}`}
                                >
                                    {item}
                                </button>
                            ))}
                            <div className="flex items-center space-x-4 ml-4">
                                <button
                                    onClick={() => window.location.href = demoUrl}
                                    className={`text-sm font-semibold transition-colors hover:text-orange-500 ${scrolled ? 'text-slate-900' : 'text-white'}`}
                                >
                                    Acceso Demo
                                </button>
                                <button
                                    onClick={() => setShowContactForm(true)}
                                    className="px-6 py-2.5 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-full text-sm font-bold hover:shadow-lg hover:shadow-orange-500/30 transition-all transform hover:scale-105"
                                >
                                    Solicitar Información
                                </button>
                            </div>
                        </div>

                        {/* Mobile Menu Button */}
                        <div className="md:hidden flex items-center">
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`p-2 ${scrolled ? 'text-slate-900' : 'text-white'}`}>
                                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 shadow-xl p-4 flex flex-col space-y-4 animate-fade-in-down">
                        <button onClick={() => scrollToSection('beneficios')} className="text-left font-medium text-slate-600 py-2">Beneficios</button>
                        <button onClick={() => scrollToSection('verifactu')} className="text-left font-medium text-slate-600 py-2">Ley Antifraude</button>
                        <button onClick={() => scrollToSection('como-funciona')} className="text-left font-medium text-slate-600 py-2">Cómo Funciona</button>
                        <hr className="border-slate-100" />
                        <button onClick={() => window.location.href = demoUrl} className="text-center font-semibold text-slate-900 py-2">Acceso Demo</button>
                        <button onClick={() => setShowContactForm(true)} className="w-full py-3 bg-orange-600 text-white rounded-xl font-bold">Solicitar Información</button>
                    </div>
                )}
            </nav>

            {/* Hero Section */}
            <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
                {/* Background Image with Overlay - Parallax Effect */}
                <div
                    className="absolute inset-0 z-0 bg-fixed bg-cover bg-center"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?q=80&w=2070&auto=format&fit=crop')" }}
                >
                    <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-20">
                    <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full text-sm font-semibold text-orange-300 mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500"></span>
                        </span>
                        <span>Actualizado Normativa 2025</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-white mb-6 tracking-tight leading-tight drop-shadow-lg">
                        Multiplica tus Ventas, <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-500">Olvida el Papeleo</span>
                    </h1>

                    <p className="text-xl md:text-2xl text-gray-200 mb-10 max-w-3xl mx-auto leading-relaxed font-light">
                        La solución TPV definitiva que automatiza <strong>Verifactu</strong> y te da el control total de tu negocio.
                        Más tiempo para tus clientes, cero preocupaciones legales.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4 mb-16">
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="px-8 py-4 bg-orange-600 text-white rounded-2xl font-bold text-lg shadow-xl shadow-orange-600/30 hover:bg-orange-700 transition-all transform hover:scale-105 flex items-center justify-center"
                        >
                            Solicitar Propuesta Personalizada <ArrowRight className="ml-2" size={20} />
                        </button>
                        <button
                            onClick={() => window.location.href = demoUrl}
                            className="px-8 py-4 bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-2xl font-bold text-lg hover:bg-white/20 transition-all transform hover:scale-105 flex items-center justify-center"
                        >
                            Probar Demo Online
                        </button>
                    </div>


                </div>
            </section>

            {/* Why Choose Us - Visual Section */}
            <section id="beneficios" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <h2 className="text-4xl font-bold text-slate-900 mb-6">No es solo un TPV, es tu socio de crecimiento</h2>
                        <p className="text-xl text-slate-600">
                            Deja de perder tiempo con sistemas obsoletos. NoahPro está diseñado para aumentar tu rentabilidad desde el primer día.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center mb-24">
                        <div className="relative rounded-2xl overflow-hidden shadow-2xl group">
                            <img
                                src="https://images.unsplash.com/photo-1556740738-b6a63e27c4df?q=80&w=2070&auto=format&fit=crop"
                                alt="Gestión eficiente"
                                className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent flex items-end p-8">
                                <h3 className="text-2xl font-bold text-white">Gestión de Sala en Tiempo Real</h3>
                            </div>
                        </div>
                        <div className="space-y-8">
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                                    <Clock size={24} />
                                </div>
                                <div className="ml-6">
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Reduce tiempos de espera</h4>
                                    <p className="text-slate-600">Optimiza la rotación de mesas. Sirve a más clientes en menos tiempo con nuestra interfaz de comanda rápida.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                    <Smartphone size={24} />
                                </div>
                                <div className="ml-6">
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Comanda Móvil Integrada</h4>
                                    <p className="text-slate-600">Tus camareros envían los pedidos directamente a cocina desde la mesa. Cero errores, máxima velocidad.</p>
                                </div>
                            </div>
                            <div className="flex items-start">
                                <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-green-100 text-green-600 flex items-center justify-center">
                                    <BarChart3 size={24} />
                                </div>
                                <div className="ml-6">
                                    <h4 className="text-xl font-bold text-slate-900 mb-2">Control Total de Costes</h4>
                                    <p className="text-slate-600">Conoce el margen de cada plato. Identifica mermas y optimiza tu stock automáticamente.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Verifactu Section - High Impact */}
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
                                        <h3 className="text-xl font-bold text-slate-900">Proceso Automático Verifactu</h3>
                                    </div>

                                    <div className="space-y-0">
                                        <div className="flex relative pb-8">
                                            <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                                                <div className="h-full w-1 bg-slate-100 pointer-events-none"></div>
                                            </div>
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center relative z-10 font-bold">1</div>
                                            <div className="pl-6 pt-2">
                                                <h4 className="font-bold text-slate-900 text-lg">Venta Realizada</h4>
                                                <p className="text-slate-500">El camarero cierra el ticket en el TPV.</p>
                                            </div>
                                        </div>
                                        <div className="flex relative pb-8">
                                            <div className="h-full w-10 absolute inset-0 flex items-center justify-center">
                                                <div className="h-full w-1 bg-slate-100 pointer-events-none"></div>
                                            </div>
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center relative z-10 font-bold">2</div>
                                            <div className="pl-6 pt-2">
                                                <h4 className="font-bold text-slate-900 text-lg">Huella Digital (Hash)</h4>
                                                <p className="text-slate-500">Se genera un código único encadenado al ticket anterior.</p>
                                            </div>
                                        </div>
                                        <div className="flex relative">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-green-600 text-white flex items-center justify-center relative z-10 font-bold">3</div>
                                            <div className="pl-6 pt-2">
                                                <h4 className="font-bold text-slate-900 text-lg">Envío a Hacienda</h4>
                                                <p className="text-slate-500">Registro inmediato en la AEAT y generación de QR.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <div className="inline-block px-4 py-1 bg-red-100 text-red-600 rounded-full font-bold text-sm mb-4">
                                ⚠️ EVITA SANCIONES
                            </div>
                            <h3 className="text-4xl font-bold text-slate-900 mb-6 leading-tight">
                                Cumple la ley sin mover un dedo
                            </h3>
                            <p className="text-lg text-slate-600 mb-8 leading-relaxed">
                                La normativa Antifraude puede suponer multas de hasta <strong>50.000€</strong> por usar software no certificado.
                                Con NoahPro, la tranquilidad viene de serie.
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <div className="flex items-center space-x-2 text-slate-700">
                                    <CheckCircle className="text-green-500" size={20} />
                                    <span>Certificado Verifactu</span>
                                </div>
                                <div className="flex items-center space-x-2 text-slate-700">
                                    <CheckCircle className="text-green-500" size={20} />
                                    <span>Compatible TicketBAI</span>
                                </div>
                                <div className="flex items-center space-x-2 text-slate-700">
                                    <CheckCircle className="text-green-500" size={20} />
                                    <span>Factura Electrónica</span>
                                </div>
                                <div className="flex items-center space-x-2 text-slate-700">
                                    <CheckCircle className="text-green-500" size={20} />
                                    <span>Copias de Seguridad</span>
                                </div>
                            </div>
                            <button onClick={() => setShowContactForm(true)} className="text-orange-600 font-bold hover:text-orange-700 flex items-center group text-lg">
                                Hablar con un experto en normativa <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={20} />
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Parallax Divider - Chef/Kitchen */}
            <section className="py-32 bg-slate-900 text-white relative">
                <div className="absolute inset-0 bg-fixed bg-cover bg-center opacity-40" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/60 to-slate-900"></div>

                <div className="relative z-10 max-w-5xl mx-auto px-4 text-center">
                    <h3 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight">
                        "La tecnología debe servir al restaurante, <br />no al revés."
                    </h3>
                    <div className="w-24 h-1 bg-orange-500 mx-auto rounded-full mb-8"></div>
                    <div className="flex justify-center opacity-20">
                        <ChefHat size={100} className="text-white" />
                    </div>
                </div>
            </section>

            {/* How It Works - Steps */}
            <section id="como-funciona" className="py-24 bg-white">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold text-slate-900 mb-4">Empieza en 3 pasos sencillos</h2>
                        <p className="text-xl text-slate-600">Sin complicaciones técnicas. Nosotros nos encargamos de todo.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 text-center">
                        <div className="p-6">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600 font-bold text-2xl">1</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Solicita Información</h3>
                            <p className="text-slate-600">Déjanos tus datos y analizaremos las necesidades de tu local sin compromiso.</p>
                        </div>
                        <div className="p-6">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600 font-bold text-2xl">2</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Instalación y Migración</h3>
                            <p className="text-slate-600">Configuramos tu carta, importamos tus datos y formamos a tu equipo.</p>
                        </div>
                        <div className="p-6">
                            <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600 font-bold text-2xl">3</div>
                            <h3 className="text-xl font-bold text-slate-900 mb-3">Empieza a Facturar</h3>
                            <p className="text-slate-600">Disfruta de un sistema rápido, seguro y legal desde el primer día.</p>
                        </div>
                    </div>

                    <div className="text-center mt-12">
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="px-10 py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-all shadow-lg hover:shadow-xl"
                        >
                            Quiero Empezar Ahora
                        </button>
                    </div>
                </div>
            </section>

            {/* Image Showcase Section - Kitchen/Service */}
            <section className="py-24 bg-slate-50 overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6">
                                Control total, estés donde estés
                            </h2>
                            <p className="text-lg text-slate-600 mb-6">
                                Accede a las métricas de tu negocio desde tu móvil, tablet o casa. NoahPro está en la nube para que tú tengas libertad.
                            </p>
                            <ul className="space-y-4 mb-8">
                                <li className="flex items-center space-x-3">
                                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                                    <span className="text-slate-700">Ventas en tiempo real</span>
                                </li>
                                <li className="flex items-center space-x-3">
                                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                                    <span className="text-slate-700">Gestión de stock y proveedores</span>
                                </li>
                                <li className="flex items-center space-x-3">
                                    <div className="h-2 w-2 bg-orange-500 rounded-full"></div>
                                    <span className="text-slate-700">Informes de rendimiento de personal</span>
                                </li>
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-blue-100 rounded-full blur-3xl opacity-50"></div>
                            <img
                                src="https://images.unsplash.com/photo-1556742111-a301076d9d18?q=80&w=2070&auto=format&fit=crop"
                                alt="Control de negocio"
                                className="relative rounded-2xl shadow-2xl transform -rotate-2 hover:rotate-0 transition-transform duration-500"
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* Testimonials / Social Proof */}
            <section className="py-24 bg-slate-900 text-white relative">
                <div className="absolute inset-0 bg-fixed bg-cover bg-center opacity-30" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1559339352-11d035aa65de?q=80&w=1974&auto=format&fit=crop')" }}></div>
                <div className="absolute inset-0 bg-gradient-to-b from-slate-900/50 via-slate-900/60 to-slate-900"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-bold mb-4">Confían en NoahPro</h2>
                        <p className="text-xl text-slate-400">Más de 500 restaurantes ya duermen tranquilos.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {[
                            {
                                quote: "Desde que instalamos NoahPro, la rotación de mesas ha subido un 20%. La cocina vuela.",
                                author: "Carlos Ruiz",
                                role: "Dueño, Asador Central",
                                stars: 5
                            },
                            {
                                quote: "Me preocupaba mucho la ley Verifactu. Con esto me he olvidado del tema. Todo automático.",
                                author: "Elena M.",
                                role: "Gerente, Café del Mar",
                                stars: 5
                            },
                            {
                                quote: "El soporte es increíble. Nos configuraron la carta en una tarde y al día siguiente estábamos funcionando.",
                                author: "Javier T.",
                                role: "Chef, GastroBar 21",
                                stars: 5
                            }
                        ].map((testimonial, idx) => (
                            <div key={idx} className="bg-white/5 backdrop-blur-sm p-8 rounded-2xl border border-white/10 hover:bg-white/10 transition-colors">
                                <div className="flex text-orange-500 mb-4">
                                    {[...Array(testimonial.stars)].map((_, i) => (
                                        <Star key={i} size={16} fill="currentColor" />
                                    ))}
                                </div>
                                <p className="text-lg text-slate-300 mb-6 italic">"{testimonial.quote}"</p>
                                <div>
                                    <p className="font-bold text-white">{testimonial.author}</p>
                                    <p className="text-sm text-slate-500">{testimonial.role}</p>
                                </div>
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
                    <h2 className="text-4xl md:text-5xl font-bold mb-6">¿Hablamos de tu negocio?</h2>
                    <p className="text-xl text-orange-100 mb-10 max-w-2xl mx-auto">
                        Nuestros expertos te prepararán una propuesta a medida para digitalizar tu restaurante y cumplir con la ley.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="px-10 py-5 bg-white text-orange-700 rounded-2xl font-bold text-xl shadow-2xl shadow-black/20 hover:bg-orange-50 transition-all transform hover:scale-105"
                        >
                            Solicitar Propuesta Sin Compromiso
                        </button>
                    </div>
                    <p className="mt-8 text-sm text-orange-200 opacity-80">
                        * Respuesta garantizada en menos de 24h laborables.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid md:grid-cols-4 gap-8 mb-8">
                        <div className="col-span-1 md:col-span-2">
                            <div className="flex items-center space-x-2 mb-4">
                                <div className="h-8 w-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center text-white">
                                    <Zap size={16} fill="currentColor" />
                                </div>
                                <span className="text-xl font-bold text-white">NoahPro Tpv</span>
                            </div>
                            <p className="max-w-xs mb-4">
                                Software TPV líder para hostelería. Tecnología avanzada para negocios que quieren crecer seguros.
                            </p>
                            <div className="flex space-x-4">
                                {/* Social Icons Placeholders */}
                                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors cursor-pointer">IG</div>
                                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors cursor-pointer">LI</div>
                                <div className="w-8 h-8 bg-slate-800 rounded-full flex items-center justify-center hover:bg-orange-500 hover:text-white transition-colors cursor-pointer">TW</div>
                            </div>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">Producto</h4>
                            <ul className="space-y-2">
                                <li><button onClick={() => scrollToSection('beneficios')} className="hover:text-orange-500 transition-colors">Beneficios</button></li>
                                <li><button onClick={() => scrollToSection('verifactu')} className="hover:text-orange-500 transition-colors">Verifactu</button></li>
                                <li><button onClick={() => scrollToSection('como-funciona')} className="hover:text-orange-500 transition-colors">Cómo Funciona</button></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-bold text-white mb-4">Legal</h4>
                            <ul className="space-y-2">
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Aviso Legal</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Privacidad</a></li>
                                <li><a href="#" className="hover:text-orange-500 transition-colors">Cookies</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="border-t border-slate-900 pt-8 text-center text-sm">
                        <p>© 2025 NoahPro Tpv. Todos los derechos reservados.</p>
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
