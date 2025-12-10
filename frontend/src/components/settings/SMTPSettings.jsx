import React, { useState, useEffect } from 'react';
import { useToast } from '../../contexts/ToastContext';

const SMTPSettings = () => {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testEmail, setTestEmail] = useState('');
    const [settings, setSettings] = useState({
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_password: '',
        smtp_secure: true,
        smtp_from_name: 'NoahPro CRM',
        smtp_from_email: ''
    });

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const response = await fetch('http://localhost:3002/api/settings/smtp');
            if (response.ok) {
                const data = await response.json();
                setSettings({
                    smtp_host: data.smtp_host || '',
                    smtp_port: data.smtp_port || 587,
                    smtp_user: data.smtp_user || '',
                    smtp_password: '', // Always clear password on load
                    smtp_secure: data.smtp_secure !== undefined ? data.smtp_secure : true,
                    smtp_from_name: data.smtp_from_name || 'NoahPro CRM',
                    smtp_from_email: data.smtp_from_email || ''
                });
            }
        } catch (error) {
            console.error('Error fetching SMTP settings:', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch('http://localhost:3002/api/settings/smtp', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (response.ok) {
                toast.success('Configuración SMTP guardada correctamente');
            } else {
                toast.error('Error al guardar configuración');
            }
        } catch (error) {
            console.error('Error saving SMTP settings:', error);
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    const handleTest = async () => {
        if (!testEmail) {
            toast.error('Por favor, ingresa un email de prueba');
            return;
        }

        setTesting(true);

        try {
            const response = await fetch('http://localhost:3002/api/settings/smtp/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...settings, testEmail })
            });

            const data = await response.json();

            if (data.success) {
                toast.success('✅ Email de prueba enviado correctamente');
            } else {
                toast.error(`❌ Error: ${data.message}`);
            }
        } catch (error) {
            console.error('Error testing SMTP:', error);
            toast.error('Error al probar conexión');
        } finally {
            setTesting(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Configuración SMTP</h2>
                <p className="text-sm text-gray-500 mt-1">
                    Configura el servidor de correo para enviar propuestas y notificaciones
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Server Settings */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Servidor SMTP</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Host SMTP
                            </label>
                            <input
                                type="text"
                                value={settings.smtp_host}
                                onChange={(e) => setSettings({ ...settings, smtp_host: e.target.value })}
                                className="input"
                                placeholder="smtp.gmail.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Puerto
                            </label>
                            <input
                                type="number"
                                value={settings.smtp_port}
                                onChange={(e) => setSettings({ ...settings, smtp_port: parseInt(e.target.value) })}
                                className="input"
                                placeholder="587"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Usuario
                            </label>
                            <input
                                type="text"
                                value={settings.smtp_user}
                                onChange={(e) => setSettings({ ...settings, smtp_user: e.target.value })}
                                className="input"
                                placeholder="tu@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={settings.smtp_password}
                                onChange={(e) => setSettings({ ...settings, smtp_password: e.target.value })}
                                className="input"
                                placeholder="••••••••"
                            />
                            <p className="text-xs text-gray-500 mt-1">
                                Deja en blanco para mantener la contraseña actual
                            </p>
                        </div>
                    </div>

                    <div className="mt-4">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                checked={settings.smtp_secure}
                                onChange={(e) => setSettings({ ...settings, smtp_secure: e.target.checked })}
                                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
                            />
                            <span className="text-sm text-gray-700">Usar conexión segura (TLS/SSL)</span>
                        </label>
                    </div>
                </div>

                {/* From Settings */}
                <div className="bg-white rounded-lg p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Remitente</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nombre del remitente
                            </label>
                            <input
                                type="text"
                                value={settings.smtp_from_name}
                                onChange={(e) => setSettings({ ...settings, smtp_from_name: e.target.value })}
                                className="input"
                                placeholder="Stormsboys CRM"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Email del remitente
                            </label>
                            <input
                                type="email"
                                value={settings.smtp_from_email}
                                onChange={(e) => setSettings({ ...settings, smtp_from_email: e.target.value })}
                                className="input"
                                placeholder="noreply@stormsboys.com"
                                required
                            />
                        </div>
                    </div>
                </div>

                {/* Common Providers Help */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-orange-900 mb-2">📧 Proveedores comunes</h4>
                    <div className="text-xs text-orange-800 space-y-1">
                        <p><strong>Gmail:</strong> smtp.gmail.com:587 (requiere contraseña de aplicación)</p>
                        <p><strong>Outlook:</strong> smtp-mail.outlook.com:587</p>
                        <p><strong>SendGrid:</strong> smtp.sendgrid.net:587</p>
                    </div>
                </div>

                {/* Test Email Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Probar Configuración</h3>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email de Prueba
                        </label>
                        <input
                            type="email"
                            value={testEmail}
                            onChange={(e) => setTestEmail(e.target.value)}
                            className="input"
                            placeholder="destinatario@ejemplo.com"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Enviaremos un correo de prueba a esta dirección
                        </p>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={handleTest}
                        disabled={testing || !settings.smtp_host}
                        className="btn-secondary"
                    >
                        {testing ? 'Probando...' : '🔍 Probar Conexión'}
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary"
                    >
                        {loading ? 'Guardando...' : '💾 Guardar Configuración'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SMTPSettings;
