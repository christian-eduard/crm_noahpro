import React, { useState, useEffect } from 'react';
import ContactForm from './ContactForm';
import ChatWidget from './ChatWidget';
import AnalyticsTracker from '../analytics/AnalyticsTracker';

const LandingPage = () => {
    const [showContactForm, setShowContactForm] = useState(false);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const scrollToSection = (id) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-slate-900 text-white font-sans selection:bg-purple-500 selection:text-white overflow-x-hidden">
            <AnalyticsTracker />

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-slate-900/90 backdrop-blur-xl border-b border-white/10 shadow-lg' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-20">
                        <div className="flex items-center space-x-3">
                            <div className="h-10 w-10 bg-gradient-to-br from-purple-500 to-blue-600 rounded-xl flex items-center justify-center text-2xl shadow-lg shadow-purple-500/20">
                                ⚡
                            </div>
                            <div>
                                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">TPV Stormsboys</h1>
                                <p className="text-[10px] uppercase tracking-widest text-purple-400 font-semibold">Verifactu Ready</p>
                            </div>
                        </div>
                        <div className="hidden md:flex items-center space-x-8">
                            <button onClick={() => scrollToSection('features')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Características</button>
                            <button onClick={() => scrollToSection('verifactu')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Ley Antifraude</button>
                            <button onClick={() => scrollToSection('preview')} className="text-sm font-medium text-gray-300 hover:text-white transition-colors">Interfaz</button>
                            <button
                                onClick={() => window.location.href = '/demo'}
                                className="px-6 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-semibold transition-all hover:scale-105"
                            >
                                Acceder Demo
                            </button>
                            <button
                                onClick={() => setShowContactForm(true)}
                                className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-full text-sm font-bold shadow-lg shadow-purple-500/25 transition-all hover:scale-105 hover:shadow-purple-500/40"
                            >
                                Solicitar Información
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-40 pb-20 px-4 z-10">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="inline-flex items-center space-x-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-sm font-medium text-purple-300 mb-8 animate-fade-in-up">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                        <span>Actualizado para la Nueva Ley Antifraude 2025</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight tracking-tight">
                        El Futuro de la Hostelería <br />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 animate-gradient-x">Es Legal y Digital</span>
                    </h1>

                    <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        La solución definitiva para bares y restaurantes que buscan <strong>tranquilidad legal</strong> y <strong>control total</strong>.
                        Cumple con Verifactu sin complicaciones técnicas.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="px-8 py-4 bg-white text-slate-900 rounded-2xl font-bold text-lg shadow-xl shadow-white/10 transition-all hover:scale-105 hover:bg-gray-100"
                        >
                            Hablar con un Experto
                        </button>
                        <button
                            onClick={() => window.location.href = '/demo'}
                            className="px-8 py-4 bg-white/5 border border-white/10 text-white rounded-2xl font-bold text-lg backdrop-blur-sm transition-all hover:bg-white/10 hover:scale-105 group"
                        >
                            Explorar Demo Online <span className="inline-block transition-transform group-hover:translate-x-1">→</span>
                        </button>
                    </div>

                    {/* Hero Image / Screenshot */}
                    <div className="mt-20 relative max-w-5xl mx-auto">
                        <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl blur opacity-30"></div>
                        <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-slate-800">
                            <img
                                src="/assets/tpv_main.png"
                                alt="Interfaz TPV Stormsboys"
                                className="w-full h-auto object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 to-transparent pointer-events-none"></div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Verifactu Section */}
            <section id="verifactu" className="py-24 bg-slate-800/50 relative z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-3xl md:text-4xl font-bold mb-6">
                                <span className="text-red-400">Evita Multas</span> de hasta 50.000€
                            </h2>
                            <p className="text-gray-300 text-lg mb-6 leading-relaxed">
                                La nueva ley antifraude exige que tu software de facturación garantice la integridad, conservación, accesibilidad, legibilidad, trazabilidad e inalterabilidad de los registros.
                            </p>
                            <p className="text-gray-300 text-lg mb-8 leading-relaxed">
                                TPV Stormsboys no es solo un TPV, es tu <strong>seguro de cumplimiento</strong>. Generamos automáticamente el hash encadenado y el código QR requeridos por Hacienda.
                            </p>

                            <ul className="space-y-4">
                                {[
                                    'Generación automática de huella digital (Hash)',
                                    'Código QR verificable en cada ticket',
                                    'Envío automático de registros a la AEAT (opcional)',
                                    'Imposibilidad de manipular ventas pasadas'
                                ].map((item, i) => (
                                    <li key={i} className="flex items-center space-x-3 text-gray-300">
                                        <span className="flex-shrink-0 h-6 w-6 rounded-full bg-green-500/20 text-green-400 flex items-center justify-center text-xs">✓</span>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                        <div className="relative">
                            <div className="absolute -inset-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl blur-xl"></div>
                            <div className="relative bg-slate-900 border border-white/10 rounded-2xl p-8">
                                <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                                    <span className="text-sm text-gray-400">Estado del Sistema</span>
                                    <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-bold uppercase tracking-wider">Verificado</span>
                                </div>
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl">🧾</div>
                                            <div>
                                                <div className="text-sm font-medium text-white">Ticket T-2025-001</div>
                                                <div className="text-xs text-gray-500">Hace 2 minutos</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-mono text-purple-400">Hash: a7f3...9b2c</div>
                                            <div className="text-xs text-green-400">Encadenado Correctamente</div>
                                        </div>
                                    </div>
                                    {/* More fake items */}
                                    <div className="flex items-center justify-between opacity-50">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center text-xl">🧾</div>
                                            <div>
                                                <div className="text-sm font-medium text-white">Ticket T-2025-000</div>
                                                <div className="text-xs text-gray-500">Hace 5 minutos</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-mono text-purple-400">Hash: c4d1...8a1f</div>
                                            <div className="text-xs text-green-400">Encadenado Correctamente</div>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                                    <p className="text-xs text-gray-500">Sistema auditado y conforme al Reglamento Veri*factu</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features / Screenshots Grid */}
            <section id="preview" className="py-24 relative z-10">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Diseñado para la Velocidad</h2>
                        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                            Una interfaz intuitiva que tus camareros aprenderán en minutos. Menos clicks, más ventas.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-800 hover:border-purple-500/50 transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 z-10"></div>
                            <img src="/assets/tpv_main.png" alt="Vista Principal" className="w-full h-64 object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                                <h3 className="text-2xl font-bold mb-2">Vista de Comanda Rápida</h3>
                                <p className="text-gray-300">Organización visual de mesas y productos para máxima eficiencia en horas punta.</p>
                            </div>
                        </div>

                        <div className="group relative rounded-2xl overflow-hidden border border-white/10 bg-slate-800 hover:border-blue-500/50 transition-all duration-500">
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent opacity-60 z-10"></div>
                            <img src="/assets/tpv_tapas.png" alt="Categorías" className="w-full h-64 object-cover object-top transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                                <h3 className="text-2xl font-bold mb-2">Gestión de Categorías</h3>
                                <p className="text-gray-300">Navegación fluida entre familias de productos con imágenes de alta calidad.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 relative z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 to-blue-900/50"></div>
                <div className="max-w-4xl mx-auto px-4 relative text-center">
                    <h2 className="text-4xl md:text-5xl font-bold mb-8">¿Listo para modernizar tu negocio?</h2>
                    <p className="text-xl text-gray-300 mb-12">
                        Únete a los hosteleros que ya duermen tranquilos sabiendo que cumplen con la ley y controlan cada euro de su caja.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-6">
                        <button
                            onClick={() => setShowContactForm(true)}
                            className="px-10 py-5 bg-white text-purple-900 rounded-2xl font-bold text-xl shadow-2xl shadow-white/20 transition-all hover:scale-105 hover:bg-gray-100"
                        >
                            Solicitar Presupuesto
                        </button>
                    </div>
                    <p className="mt-8 text-sm text-gray-400">
                        Sin compromiso. Te explicamos cómo funciona y tú decides.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 py-12 border-t border-white/5 relative z-10">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-gray-500">© 2025 TPV Stormsboys. Todos los derechos reservados.</p>
                    <p className="text-gray-600 text-sm mt-2">Cumplimiento Normativa Verifactu & TicketBAI</p>
                </div>
            </footer>

            {/* Chat Widget */}
            <ChatWidget />

            {/* Modal Contact Form - High Z-Index Fix */}
            {showContactForm && (
                <div className="fixed inset-0 z-[100] overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setShowContactForm(false)}></div>
                        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                        <div className="relative inline-block align-bottom bg-slate-800 rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full border border-white/10">
                            <div className="absolute top-4 right-4 z-10">
                                <button
                                    onClick={() => setShowContactForm(false)}
                                    className="text-gray-400 hover:text-white transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
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
