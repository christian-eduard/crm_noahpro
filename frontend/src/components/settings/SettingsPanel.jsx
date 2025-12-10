import { API_URL, SOCKET_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { Settings, BarChart3, Bot, Plug, Mail, Bell, Save, MessageSquare, Radio, Key, Server, Globe, FileText, User, Building2, Phone, MapPin, CreditCard } from 'lucide-react';
import Button from '../shared/Button';
import Input from '../shared/Input';
import TemplatesManager from '../admin/settings/TemplatesManager';
import LeadStatusSettings from './LeadStatusSettings';
import AutomationSettings from './AutomationSettings';
import GoogleCalendarSettings from './GoogleCalendarSettings';
import UsersSettings from './UsersSettings';
import HTMLEmailTemplatesEditor from './HTMLEmailTemplatesEditor';
import InvoiceSettings from './InvoiceSettings';

const SettingsPanel = () => {
    const [activeTab, setActiveTab] = useState('general');

    const tabs = [
        { id: 'general', label: 'General', icon: <Settings className="w-5 h-5" /> },
        { id: 'company', label: 'Datos Empresa', icon: <Building2 className="w-5 h-5" /> },
        { id: 'users', label: 'Usuarios', icon: <User className="w-5 h-5" /> },
        { id: 'statuses', label: 'Estados', icon: <BarChart3 className="w-5 h-5" /> },
        { id: 'automation', label: 'Automatización', icon: <Bot className="w-5 h-5" /> },
        { id: 'invoices', label: 'Facturación', icon: <FileText className="w-5 h-5" /> },
        { id: 'integrations', label: 'Integraciones', icon: <Plug className="w-5 h-5" /> },
        { id: 'email_templates', label: 'Plantillas Email', icon: <Mail className="w-5 h-5" /> },
        { id: 'proposal_templates', label: 'Plantillas Propuestas', icon: <FileText className="w-5 h-5" /> },
        { id: 'smtp', label: 'Email (SMTP)', icon: <Mail className="w-5 h-5" /> },
        { id: 'notifications', label: 'Notificaciones', icon: <Bell className="w-5 h-5" /> }
    ];

    const [settings, setSettings] = useState({
        demo_url: '',
        chat_title: 'Soporte NoahPro',
        chat_welcome_message: '¡Hola! ¿En qué podemos ayudarte hoy?',
        chat_primary_color: '#f97316',
        chat_enabled: true,
        pusher_app_id: '',
        pusher_key: '',
        pusher_secret: '',
        pusher_cluster: 'eu',
        // Company Details (General)
        company_name: '',
        company_address: '',
        company_city: '',
        company_postal_code: '',
        company_nif: '',
        company_phone: '',
        company_email: '',
        company_website: '',
        company_logo: '',
        // SMTP Settings
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
        smtp_secure: true,
        smtp_from_name: 'NoahPro CRM',
        smtp_from_email: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Error al cargar configuración');
            const data = await response.json();
            setSettings({
                demo_url: data.demo_url || '',
                chat_title: data.chat_title || 'Soporte NoahPro',
                chat_welcome_message: data.chat_welcome_message || '¡Hola! ¿En qué podemos ayudarte hoy?',
                chat_primary_color: data.chat_primary_color || '#f97316',
                chat_enabled: data.chat_enabled !== undefined ? data.chat_enabled : true,
                pusher_app_id: data.pusher_app_id || '',
                pusher_key: data.pusher_key || '',
                pusher_secret: data.pusher_secret || '',
                pusher_cluster: data.pusher_cluster || 'eu',
                company_name: data.company_name || '',
                company_address: data.company_address || '',
                company_city: data.company_city || '',
                company_postal_code: data.company_postal_code || '',
                company_nif: data.company_nif || '',
                company_phone: data.company_phone || '',
                company_email: data.company_email || '',
                company_website: data.company_website || '',
                company_logo: data.company_logo || '',
                smtp_host: data.smtp_host || '',
                smtp_port: data.smtp_port || 587,
                smtp_user: data.smtp_user || '',
                smtp_password: data.smtp_password || '',
                smtp_secure: data.smtp_secure !== undefined ? data.smtp_secure : true,
                smtp_from_name: data.smtp_from_name || 'NoahPro CRM',
                smtp_from_email: data.smtp_from_email || ''
            });
        } catch (error) {
            console.error('Error fetching settings:', error);
            setMessage({ type: 'error', text: 'Error al cargar la configuración' });
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: '', text: '' });

        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) throw new Error('Error al guardar');

            setMessage({ type: 'success', text: 'Configuración guardada correctamente' });
            setTimeout(() => setMessage({ type: '', text: '' }), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMessage({ type: 'error', text: 'Error al guardar la configuración' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );

    return (
        <div className="flex flex-col md:flex-row gap-6 min-h-[600px]">
            {/* Sidebar Navigation */}
            <div className="w-full md:w-64 flex-shrink-0">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden sticky top-6">
                    <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                        <h3 className="font-semibold text-gray-900 dark:text-white">Configuración</h3>
                    </div>
                    <nav className="p-2 space-y-1">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === tab.id
                                    ? 'bg-orange-50 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                                    }`}
                            >
                                {tab.icon}
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 min-h-full">
                    {/* Header for Mobile only */}
                    <div className="md:hidden p-4 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-2">
                        {tabs.find(t => t.id === activeTab)?.icon}
                        <h2 className="font-bold text-gray-900 dark:text-white">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h2>
                    </div>

                    <div className="p-6">
                        {activeTab === 'users' && <UsersSettings />}
                        {activeTab === 'statuses' && <LeadStatusSettings />}
                        {activeTab === 'automation' && <AutomationSettings />}
                        {activeTab === 'invoices' && <InvoiceSettings />}
                        {activeTab === 'integrations' && <GoogleCalendarSettings />}
                        {activeTab === 'email_templates' && <HTMLEmailTemplatesEditor />}
                        {activeTab === 'proposal_templates' && <TemplatesManager />}
                        {activeTab === 'smtp' && (
                            <div className="space-y-8">
                                <form onSubmit={handleSave}>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2 mb-4">
                                                <Mail className="w-5 h-5 text-gray-500" />
                                                <span>Configuración SMTP (Envío de Emails)</span>
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Configura el servidor de correo para enviar facturas y comprobantes.</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Servidor SMTP (Host)
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            name="smtp_host"
                                                            value={settings.smtp_host}
                                                            onChange={handleChange}
                                                            placeholder="smtp.gmail.com"
                                                        />
                                                        <Server className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Puerto
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            type="number"
                                                            name="smtp_port"
                                                            value={settings.smtp_port}
                                                            onChange={handleChange}
                                                            placeholder="587"
                                                        />
                                                        <Plug className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Seguridad (SSL/TLS)
                                                    </label>
                                                    <div className="flex items-center space-x-2 mt-2">
                                                        <label className="inline-flex items-center cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                name="smtp_secure"
                                                                checked={settings.smtp_secure}
                                                                onChange={(e) => setSettings(prev => ({ ...prev, smtp_secure: e.target.checked }))}
                                                                className="form-checkbox h-5 w-5 text-orange-500 rounded border-gray-300 focus:ring-orange-500"
                                                            />
                                                            <span className="ml-2 text-gray-700 dark:text-gray-300">Usar conexión segura</span>
                                                        </label>
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Usuario SMTP
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            name="smtp_user"
                                                            value={settings.smtp_user}
                                                            onChange={handleChange}
                                                            placeholder="usuario@dominio.com"
                                                        />
                                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Contraseña SMTP
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            type="password"
                                                            name="smtp_password"
                                                            value={settings.smtp_password}
                                                            onChange={handleChange}
                                                            placeholder="********"
                                                        />
                                                        <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Nombre del Remitente
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            name="smtp_from_name"
                                                            value={settings.smtp_from_name}
                                                            onChange={handleChange}
                                                            placeholder="Mi Empresa"
                                                        />
                                                        <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Email del Remitente
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            type="email"
                                                            name="smtp_from_email"
                                                            value={settings.smtp_from_email}
                                                            onChange={handleChange}
                                                            placeholder="no-reply@dominio.com"
                                                        />
                                                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex justify-end pt-4 sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-100 dark:border-gray-700 -mx-6 -mb-6 rounded-b-xl">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2 disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'notifications' && (
                            <div className="space-y-8">
                                <form onSubmit={handleSave}>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2 mb-4">
                                                <Radio className="w-5 h-5 text-gray-500" />
                                                <span>Pusher (Tiempo Real)</span>
                                            </h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        App ID
                                                    </label>
                                                    <Input
                                                        name="pusher_app_id"
                                                        value={settings.pusher_app_id || ''}
                                                        onChange={handleChange}
                                                        placeholder="Ej: 1234567"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Key
                                                    </label>
                                                    <Input
                                                        name="pusher_key"
                                                        value={settings.pusher_key || ''}
                                                        onChange={handleChange}
                                                        placeholder="Ej: a1b2c3d4e5..."
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Secret
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            name="pusher_secret"
                                                            type="password"
                                                            value={settings.pusher_secret || ''}
                                                            onChange={handleChange}
                                                            placeholder="Ej: f9e8d7c6b5..."
                                                        />
                                                        <Key className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Cluster
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            name="pusher_cluster"
                                                            value={settings.pusher_cluster || ''}
                                                            onChange={handleChange}
                                                            placeholder="Ej: eu"
                                                        />
                                                        <Server className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {message.text && (
                                            <div className={`p-4 rounded-lg flex items-center space-x-2 ${message.type === 'success'
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                                }`}>
                                                {message.type === 'success' ? <div className="w-2 h-2 bg-green-500 rounded-full" /> : <div className="w-2 h-2 bg-red-500 rounded-full" />}
                                                <span>{message.text}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-4 sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-100 dark:border-gray-700 -mx-6 -mb-6 rounded-b-xl">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2 disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'company' && (
                            <div className="space-y-8">
                                <form onSubmit={handleSave}>
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2 mb-4">
                                                <Building2 className="w-5 h-5 text-gray-500" />
                                                <span>Datos Fiscales y de Contacto</span>
                                            </h3>
                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Esta información aparecerá en tus facturas y documentos.</p>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Nombre Fiscal / Razón Social
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            name="company_name"
                                                            value={settings.company_name}
                                                            onChange={handleChange}
                                                            placeholder="Ej: Mi Empresa S.L."
                                                        />
                                                        <Building2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        NIF / CIF
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            name="company_nif"
                                                            value={settings.company_nif}
                                                            onChange={handleChange}
                                                            placeholder="Ej: B12345678"
                                                        />
                                                        <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Teléfono
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            name="company_phone"
                                                            value={settings.company_phone}
                                                            onChange={handleChange}
                                                            placeholder="Ej: +34 900 000 000"
                                                        />
                                                        <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Dirección
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            name="company_address"
                                                            value={settings.company_address}
                                                            onChange={handleChange}
                                                            placeholder="Calle Principal 123"
                                                        />
                                                        <MapPin className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Código Postal
                                                    </label>
                                                    <Input
                                                        name="company_postal_code"
                                                        value={settings.company_postal_code}
                                                        onChange={handleChange}
                                                        placeholder="28000"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Ciudad
                                                    </label>
                                                    <Input
                                                        name="company_city"
                                                        value={settings.company_city}
                                                        onChange={handleChange}
                                                        placeholder="Madrid"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Email de Contacto
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            type="email"
                                                            name="company_email"
                                                            value={settings.company_email}
                                                            onChange={handleChange}
                                                            placeholder="facturacion@miempresa.com"
                                                        />
                                                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        Sitio Web
                                                    </label>
                                                    <div className="relative">
                                                        <Input
                                                            type="url"
                                                            name="company_website"
                                                            value={settings.company_website}
                                                            onChange={handleChange}
                                                            placeholder="https://miempresa.com"
                                                        />
                                                        <Globe className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                                    </div>
                                                </div>

                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        URL del Logo
                                                    </label>
                                                    <Input
                                                        type="url"
                                                        name="company_logo"
                                                        value={settings.company_logo}
                                                        onChange={handleChange}
                                                        placeholder="https://miempresa.com/logo.png"
                                                    />
                                                    <p className="mt-1 text-xs text-gray-500">URL pública de la imagen de tu logo.</p>
                                                </div>
                                            </div>
                                        </div>

                                        {message.text && (
                                            <div className={`p-4 rounded-lg flex items-center space-x-2 ${message.type === 'success'
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                                }`}>
                                                {message.type === 'success' ? <div className="w-2 h-2 bg-green-500 rounded-full" /> : <div className="w-2 h-2 bg-red-500 rounded-full" />}
                                                <span>{message.text}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-4 sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-100 dark:border-gray-700 -mx-6 -mb-6 rounded-b-xl">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2 disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}

                        {activeTab === 'general' && (
                            <div className="space-y-8">
                                <form onSubmit={handleSave}>
                                    {/* General Section */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2 mb-4">
                                                <Globe className="w-5 h-5 text-gray-500" />
                                                <span>Configuración Web</span>
                                            </h3>
                                            <div className="grid gap-6">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                        URL del Botón "Ver Demo"
                                                    </label>
                                                    <Input
                                                        name="demo_url"
                                                        type="url"
                                                        value={settings.demo_url}
                                                        onChange={handleChange}
                                                        placeholder="https://tu-dominio.com/demo"
                                                        required
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2 mb-4">
                                                <MessageSquare className="w-5 h-5 text-gray-500" />
                                                <span>Chat en Vivo</span>
                                            </h3>

                                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                                <div className="space-y-4">
                                                    <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            id="chat_enabled"
                                                            name="chat_enabled"
                                                            checked={settings.chat_enabled}
                                                            onChange={handleChange}
                                                            className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                                                        />
                                                        <label htmlFor="chat_enabled" className="ml-3 block text-sm font-medium text-gray-900 dark:text-white">
                                                            Habilitar Chat en Landing Page
                                                        </label>
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Título del Chat
                                                        </label>
                                                        <Input
                                                            name="chat_title"
                                                            value={settings.chat_title}
                                                            onChange={handleChange}
                                                            placeholder="Soporte"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Mensaje de Bienvenida
                                                        </label>
                                                        <textarea
                                                            name="chat_welcome_message"
                                                            value={settings.chat_welcome_message}
                                                            onChange={handleChange}
                                                            rows="3"
                                                            className="w-full rounded-lg border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                                                        />
                                                    </div>

                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                            Color Principal
                                                        </label>
                                                        <div className="flex items-center space-x-3">
                                                            <input
                                                                type="color"
                                                                name="chat_primary_color"
                                                                value={settings.chat_primary_color}
                                                                onChange={handleChange}
                                                                className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                                                            />
                                                            <span className="text-sm font-mono text-gray-500">{settings.chat_primary_color}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Chat Preview */}
                                                <div className="bg-gray-100 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-6 flex items-center justify-center relative overflow-hidden">
                                                    <div className="absolute top-2 left-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Vista Previa</div>
                                                    {settings.chat_enabled ? (
                                                        <div className="w-72 bg-white dark:bg-gray-800 rounded-t-xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden mt-8">
                                                            <div
                                                                className="p-3 flex justify-between items-center text-white"
                                                                style={{ backgroundColor: settings.chat_primary_color }}
                                                            >
                                                                <span className="font-bold text-sm">{settings.chat_title}</span>
                                                                <span className="text-xs opacity-80">✕</span>
                                                            </div>
                                                            <div className="h-48 bg-gray-50 dark:bg-gray-900 p-3 flex flex-col">
                                                                <div className="bg-white dark:bg-gray-800 p-2 rounded-lg rounded-tl-none shadow-sm max-w-[85%] self-start mb-3">
                                                                    <p className="text-xs text-gray-800 dark:text-gray-200">{settings.chat_welcome_message}</p>
                                                                </div>
                                                                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg rounded-tr-none shadow-sm max-w-[85%] self-end mb-3">
                                                                    <p className="text-xs text-gray-800 dark:text-gray-200">Hola, me gustaría saber más...</p>
                                                                </div>
                                                            </div>
                                                            <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                                                                <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded-full w-full"></div>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="text-gray-400 text-sm italic">Chat deshabilitado</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {message.text && (
                                            <div className={`p-4 rounded-lg flex items-center space-x-2 ${message.type === 'success'
                                                ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                                                : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                                                }`}>
                                                {message.type === 'success' ? <div className="w-2 h-2 bg-green-500 rounded-full" /> : <div className="w-2 h-2 bg-red-500 rounded-full" />}
                                                <span>{message.text}</span>
                                            </div>
                                        )}

                                        <div className="flex justify-end pt-4 sticky bottom-0 bg-white dark:bg-gray-800 p-4 border-t border-gray-100 dark:border-gray-700 -mx-6 -mb-6 rounded-b-xl">
                                            <button
                                                type="submit"
                                                disabled={saving}
                                                className="px-6 py-2 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all flex items-center space-x-2 disabled:opacity-50"
                                            >
                                                <Save className="w-4 h-4" />
                                                <span>{saving ? 'Guardando...' : 'Guardar Cambios'}</span>
                                            </button>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SettingsPanel;
