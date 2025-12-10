import { API_URL, SOCKET_URL } from '../../config';
import React, { useState, useEffect } from 'react';

const ContactForm = ({ onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        businessName: '',
        message: '',
        commercialCode: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    // Leer código de comercial desde URL al cargar
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const refCode = params.get('ref');
        if (refCode) {
            setFormData(prev => ({ ...prev, commercialCode: refCode }));
        }
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL || SOCKET_URL}/api/leads`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    phone: formData.phone,
                    businessName: formData.businessName,
                    message: formData.message,
                    commercialCode: formData.commercialCode || undefined,
                    source: 'landing_form'
                })
            });

            if (!response.ok) {
                throw new Error('Error al enviar el formulario');
            }

            setSubmitted(true);

            // Auto-cerrar después de 3 segundos
            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err) {
            setError('Error al enviar el formulario. Por favor, inténtalo de nuevo.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    if (submitted) {
        return (
            <div className="bg-white p-8 max-w-md w-full text-center animate-fade-in">
                <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-4xl">✅</div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">
                    ¡Solicitud Recibida!
                </h3>
                <p className="text-slate-600 mb-6">
                    Un asesor especializado te contactará en breve para activar tu demo.
                </p>
                <div className="bg-slate-50 text-slate-700 px-4 py-4 rounded-xl border border-slate-200">
                    <p className="font-semibold text-sm">📧 Revisa tu bandeja de entrada</p>
                    <p className="text-xs text-slate-500 mt-1">Te hemos enviado los detalles de acceso</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white p-8 w-full animate-fade-in">
            {/* Header */}
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">
                    Solicita tu Demo
                </h2>
                <p className="text-slate-500 text-sm">
                    Completa el formulario y empieza a usar NoahPro hoy mismo.
                </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                            Nombre Completo *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder="Tu nombre"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                            Email Corporativo *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder="tu@email.com"
                            required
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                            Teléfono *
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder="+34 600 000 000"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                            Nombre del Negocio
                        </label>
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder="Ej. Restaurante La Plaza"
                        />
                    </div>
                </div>

                {/* Campo Referencia Comercial */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                        Referencia Comercial
                        <span className="text-slate-400 font-normal normal-case ml-1">(opcional)</span>
                    </label>
                    <input
                        type="text"
                        name="commercialCode"
                        value={formData.commercialCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder="Ej. COM-1-1234"
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        Si vienes de parte de un comercial, introduce su código aquí
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
                        ¿En qué podemos ayudarte?
                    </label>
                    <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                        placeholder="Cuéntanos un poco sobre tu local..."
                    ></textarea>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-center">
                        <span className="mr-2">⚠️</span> {error}
                    </div>
                )}

                <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`w-full py-4 px-6 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform hover:scale-[1.02] ${isSubmitting
                        ? 'bg-slate-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-orange-500 to-red-600 hover:shadow-orange-500/30'
                        }`}
                >
                    {isSubmitting ? (
                        <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Enviando...
                        </span>
                    ) : (
                        'Solicitar Información →'
                    )}
                </button>

                <p className="text-xs text-center text-gray-500">
                    Tus datos están seguros. Cumplimos con el RGPD.
                </p>
            </form>
        </div>
    );
};

export default ContactForm;
