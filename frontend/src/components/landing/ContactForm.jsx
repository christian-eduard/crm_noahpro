import { API_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const ContactForm = ({ onClose }) => {
    const { t } = useTranslation('landing');
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
            const response = await fetch(`${API_URL}/leads`, {
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
                throw new Error(t('contact_form.error'));
            }

            setSubmitted(true);

            setTimeout(() => {
                onClose();
            }, 3000);
        } catch (err) {
            setError(t('contact_form.error'));
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
            <div className="bg-white dark:bg-slate-800 p-8 max-w-md w-full text-center animate-fade-in">
                <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <div className="text-4xl">✅</div>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {t('contact_form.success_title')}
                </h3>
                <p className="text-slate-600 dark:text-slate-300 mb-6">
                    {t('contact_form.success_message')}
                </p>
                <div className="bg-slate-50 dark:bg-slate-700/50 text-slate-700 dark:text-slate-200 px-4 py-4 rounded-xl border border-slate-200 dark:border-slate-600">
                    <p className="font-semibold text-sm">{t('contact_form.success_email')}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('contact_form.success_email_sub')}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-800 p-8 w-full animate-fade-in">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
                    {t('contact_form.title')}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                    {t('contact_form.subtitle')}
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                            {t('contact_form.labels.name')} *
                        </label>
                        <input
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder={t('contact_form.placeholders.name')}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                            {t('contact_form.labels.email')} *
                        </label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder={t('contact_form.placeholders.email')}
                            required
                        />
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                            {t('contact_form.labels.phone')} *
                        </label>
                        <input
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder={t('contact_form.placeholders.phone')}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                            {t('contact_form.labels.business')}
                        </label>
                        <input
                            type="text"
                            name="businessName"
                            value={formData.businessName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                            placeholder={t('contact_form.placeholders.business')}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                        {t('contact_form.labels.ref_code')}
                        <span className="text-slate-400 font-normal normal-case ml-1">{t('contact_form.labels.optional')}</span>
                    </label>
                    <input
                        type="text"
                        name="commercialCode"
                        value={formData.commercialCode}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all"
                        placeholder={t('contact_form.placeholders.ref_code')}
                    />
                    <p className="text-xs text-slate-400 mt-1">
                        {t('contact_form.ref_help')}
                    </p>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                        {t('contact_form.labels.message')}
                    </label>
                    <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        rows="3"
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all resize-none"
                        placeholder={t('contact_form.placeholders.message')}
                    ></textarea>
                </div>

                {error && (
                    <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-xl border border-red-100 dark:border-red-800 flex items-center">
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
                            {t('contact_form.submitting')}
                        </span>
                    ) : (
                        t('contact_form.submit')
                    )}
                </button>

                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                    {t('contact_form.gdpr')}
                </p>
            </form>
        </div>
    );
};

export default ContactForm;
