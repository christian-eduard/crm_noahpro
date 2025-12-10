import React, { useState, useEffect } from 'react';
import { Save, FileText, Hash, Percent, Calendar, CheckCircle, Building2, Phone, Mail, Globe, MapPin, CreditCard } from 'lucide-react';
import Input from '../shared/Input';
import { useToast } from '../../contexts/ToastContext';

const InvoiceSettings = () => {
    const [settings, setSettings] = useState({
        invoice_prefix: 'INV-',
        next_invoice_number: 1,
        default_tax_rate: 21,
        invoice_due_days: 30,
        auto_invoice_on_proposal_accept: false
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const toast = useToast();

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/settings`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) throw new Error('Error al cargar configuración');
            const data = await response.json();
            setSettings({
                invoice_prefix: data.invoice_prefix || 'INV-',
                next_invoice_number: data.next_invoice_number || 1,
                default_tax_rate: data.default_tax_rate || 21,
                invoice_due_days: data.invoice_due_days || 30,
                auto_invoice_on_proposal_accept: data.auto_invoice_on_proposal_accept || false
            });
        } catch (error) {
            console.error('Error fetching invoice settings:', error);
            toast.error('Error al cargar la configuración');
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

        try {
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3002'}/api/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(settings)
            });

            if (!response.ok) throw new Error('Error al guardar');

            toast.success('Configuración guardada correctamente');
        } catch (error) {
            console.error('Error saving invoice settings:', error);
            toast.error('Error al guardar la configuración');
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
        <div className="space-y-8">
            <form onSubmit={handleSave}>
                {/* Invoice Configuration Section */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2 mb-4">
                            <FileText className="w-5 h-5 text-gray-500" />
                            <span>Configuración de Facturación</span>
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Prefijo de Factura
                                </label>
                                <div className="relative">
                                    <Input
                                        name="invoice_prefix"
                                        value={settings.invoice_prefix}
                                        onChange={handleChange}
                                        placeholder="Ej: INV-2024-"
                                    />
                                    <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Prefijo para los números de factura (ej: INV-2024-001)</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Próximo Número
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        name="next_invoice_number"
                                        value={settings.next_invoice_number}
                                        onChange={handleChange}
                                        min="1"
                                    />
                                    <Hash className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">El número que se asignará a la siguiente factura</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Impuesto por Defecto (%)
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        name="default_tax_rate"
                                        value={settings.default_tax_rate}
                                        onChange={handleChange}
                                        min="0"
                                        max="100"
                                        step="0.1"
                                    />
                                    <Percent className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Días de Vencimiento
                                </label>
                                <div className="relative">
                                    <Input
                                        type="number"
                                        name="invoice_due_days"
                                        value={settings.invoice_due_days}
                                        onChange={handleChange}
                                        min="0"
                                    />
                                    <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                </div>
                                <p className="mt-1 text-xs text-gray-500">Días para el vencimiento de la factura por defecto</p>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center space-x-2 mb-4">
                            <CheckCircle className="w-5 h-5 text-gray-500" />
                            <span>Automatización</span>
                        </h3>

                        <div className="bg-gray-50 dark:bg-gray-700/30 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <div className="flex items-start">
                                <div className="flex items-center h-5">
                                    <input
                                        id="auto_invoice_on_proposal_accept"
                                        name="auto_invoice_on_proposal_accept"
                                        type="checkbox"
                                        checked={settings.auto_invoice_on_proposal_accept}
                                        onChange={handleChange}
                                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                                    />
                                </div>
                                <div className="ml-3 text-sm">
                                    <label htmlFor="auto_invoice_on_proposal_accept" className="font-medium text-gray-700 dark:text-gray-300">
                                        Generar factura automáticamente al aceptar propuesta
                                    </label>
                                    <p className="text-gray-500 dark:text-gray-400">
                                        Cuando un cliente acepte una propuesta, se creará automáticamente una factura en borrador y se enviará por email si está configurado.
                                    </p>
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
    );
};

export default InvoiceSettings;
