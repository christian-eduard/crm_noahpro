/**
 * CareersApply
 * Landing pública para captación de candidatos con entrevista IA
 */
import React, { useState } from 'react';
import { API_URL } from '../../config';
import { useToast } from '../../contexts/ToastContext';
import {
    Briefcase, Upload, ArrowRight, Zap, Clock, ShieldCheck,
    Sparkles, CheckCircle, BrainCircuit, Rocket
} from 'lucide-react';

const CareersApply = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        cv_url: '', // Por ahora URL simple, idealmente upload
        linkedin_url: '',
        position: 'sales_representative'
    });
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const toast = useToast();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/recruitment/apply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (response.ok) {
                setSubmitted(true);
                toast.success('Solicitud enviada correctamente');
            } else {
                const error = await response.json();
                toast.error(error.error || 'Error al enviar solicitud');
            }
        } catch (error) {
            console.error('Error applying:', error);
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4">
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 max-w-lg w-full text-center shadow-xl border border-gray-100 dark:border-gray-700">
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
                        ¡Solicitud Recibida!
                    </h2>
                    <p className="text-gray-600 dark:text-gray-300 mb-8 text-lg">
                        Gracias por tu interés, <strong>{formData.full_name}</strong>.
                        <br /><br />
                        Nuestro sistema de AI Talent Hunter procesará tu perfil.
                        Si encajas con la posición, recibirás una invitación por email para realizar una entrevista inmediata con nuestra IA.
                    </p>
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl text-left mb-6">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-300 flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4" /> Próximos pasos
                        </h4>
                        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-2">
                            <li>1. Revisión automática de perfil (24-48h).</li>
                            <li>2. Email con enlace mágico de entrevista IA.</li>
                            <li>3. Entrevista de voz asíncrona (10-15 min).</li>
                        </ul>
                    </div>
                    <a href="/" className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Volver al inicio
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white dark:bg-slate-900 text-gray-900 dark:text-white">
            {/* Header / Nav */}
            <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-10">
                <div className="flex items-center gap-2 font-bold text-2xl tracking-tighter">
                    <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center">
                        <Zap className="w-5 h-5 text-white" />
                    </div>
                    <span>Noah<span className="text-orange-600">Pro</span> Careers</span>
                </div>
            </nav>

            <div className="flex flex-col lg:flex-row min-h-screen">

                {/* Left Side - Presentation */}
                <div className="lg:w-1/2 flex items-center justify-center p-8 lg:p-16 relative overflow-hidden bg-gray-50 dark:bg-slate-800/50">
                    <div className="max-w-xl relative z-10 pt-20 lg:pt-0">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 text-sm font-semibold mb-6">
                            <Sparkles className="w-4 h-4" /> Hiring 2.0 Revolution
                        </div>
                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
                            Vendes el futuro. <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600">
                                Únete a él.
                            </span>
                        </h1>
                        <p className="text-xl text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                            Olvídate de procesos lentos y subjetivos. En NoahPro buscamos talento puro usando nuestra propia tecnología. Demuestra lo que vales en una entrevista con nuestra IA, cuando quieras y desde donde quieras.
                        </p>

                        <div className="space-y-6">
                            {[
                                { icon: Clock, title: "Sin Esperas", desc: "Aplica y recibe invitación inmediata si calificas." },
                                { icon: BrainCircuit, title: "Evaluación Objetiva", desc: "Nuestra IA analiza tus habilidades, no tu foto." },
                                { icon: Rocket, title: "Crecimiento Exponencial", desc: "Únete a un equipo de élite equipado con superpoderes." }
                            ].map((item, i) => (
                                <div key={i} className="flex items-start gap-4">
                                    <div className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
                                        <item.icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg">{item.title}</h3>
                                        <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Background blob */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-orange-300 to-rose-300 rounded-full mix-blend-multiply filter blur-[128px] opacity-20 dark:opacity-10 animate-blob"></div>
                </div>

                {/* Right Side - Application Form */}
                <div className="lg:w-1/2 bg-white dark:bg-slate-900 flex items-center justify-center p-8 lg:p-16 relative">
                    <div className="w-full max-w-md">
                        <div className="mb-10">
                            <h2 className="text-3xl font-bold mb-2">Aplica Ahora</h2>
                            <p className="text-gray-500">Completa tus datos para iniciar el proceso de selección.</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Nombre Completo</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                                    placeholder="Ej: Juan Pérez"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Email Profesional</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                                    placeholder="juan@ejemplo.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Posición de Interés</label>
                                <select
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none appearance-none"
                                    value={formData.position}
                                    onChange={e => setFormData({ ...formData, position: e.target.value })}
                                >
                                    <option value="sales_representative">Sales Representative (SDR)</option>
                                    <option value="account_executive">Account Executive (AE)</option>
                                    <option value="sales_manager">Sales Manager</option>
                                    <option value="customer_success">Customer Success</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">LinkedIn URL</label>
                                <input
                                    type="url"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                                    placeholder="https://linkedin.com/in/tu-perfil"
                                    value={formData.linkedin_url}
                                    onChange={e => setFormData({ ...formData, linkedin_url: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Enlace a CV / Portfolio</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Briefcase className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="url"
                                        required
                                        className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all outline-none"
                                        placeholder="https://drive.google.com/..."
                                        value={formData.cv_url}
                                        onChange={e => setFormData({ ...formData, cv_url: e.target.value })}
                                    />
                                </div>
                                <p className="text-xs text-gray-500 mt-2">Pega un enlace público a tu CV (Google Drive, Dropbox, etc).</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all disabled:opacity-50 disabled:translate-y-0 flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <span className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                                ) : (
                                    <>
                                        Enviar Solicitud <ArrowRight className="w-5 h-5" />
                                    </>
                                )}
                            </button>

                            <p className="text-center text-xs text-gray-400 mt-4">
                                Al enviar aceptas nuestras políticas de privacidad y uso de IA para evaluación.
                            </p>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CareersApply;
