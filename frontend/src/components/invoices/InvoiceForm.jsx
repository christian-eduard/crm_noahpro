import { useState, useEffect } from 'react';
import { createInvoice, updateInvoice, getInvoiceById } from '../../services/invoiceService';
import { getClients } from '../../services/clientService';
import { useToast } from '../../contexts/ToastContext';
import InvoiceItems from './InvoiceItems';
import { FiSave, FiX, FiCalendar } from 'react-icons/fi';

const InvoiceForm = ({ invoiceId, onSuccess, onCancel }) => {
    const toast = useToast();
    const isEditing = Boolean(invoiceId);
    const id = invoiceId;

    const [loading, setLoading] = useState(false);
    const [clients, setClients] = useState([]);
    const [formData, setFormData] = useState({
        client_id: '',
        title: '',
        description: '',
        items: [],
        tax_rate: 21,
        issue_date: new Date().toISOString().split('T')[0],
        due_date: '',
        notes: ''
    });

    useEffect(() => {
        fetchClients();
        if (isEditing) {
            fetchInvoice();
        }
    }, [id]);

    const fetchClients = async () => {
        try {
            const data = await getClients();
            setClients(data);
        } catch (error) {
            toast.error('Error al cargar clientes');
        }
    };

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const data = await getInvoiceById(id);
            setFormData({
                client_id: data.client_id,
                title: data.title,
                description: data.description || '',
                items: data.items || [],
                tax_rate: data.tax_rate,
                issue_date: data.issue_date.split('T')[0],
                due_date: data.due_date ? data.due_date.split('T')[0] : '',
                notes: data.notes || ''
            });
        } catch (error) {
            console.error('Error fetching invoice:', error);
            toast.error('Error al cargar la factura');
            if (onCancel) onCancel();
        } finally {
            setLoading(false);
        }
    };

    const calculateTotals = () => {
        const subtotal = formData.items.reduce((sum, item) => sum + (item.total || 0), 0);
        const taxAmount = (subtotal * formData.tax_rate) / 100;
        const total = subtotal + taxAmount;

        return {
            subtotal: subtotal.toFixed(2),
            taxAmount: taxAmount.toFixed(2),
            total: total.toFixed(2)
        };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.client_id) {
            toast.error('Debes seleccionar un cliente');
            return;
        }

        if (formData.items.length === 0) {
            toast.error('Debes añadir al menos un item');
            return;
        }

        try {
            setLoading(true);
            if (isEditing) {
                await updateInvoice(id, formData);
                toast.success('Factura actualizada exitosamente');
            } else {
                await createInvoice(formData);
                toast.success('Factura creada exitosamente');
            }
            if (onSuccess) onSuccess();
        } catch (error) {
            toast.error(error.response?.data?.error || 'Error al guardar factura');
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const totals = calculateTotals();

    if (loading && isEditing) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isEditing ? 'Editar Factura' : 'Nueva Factura'}
                    </h1>
                    <p className="text-gray-600 mt-1">
                        {isEditing ? 'Modifica los datos de la factura' : 'Crea una nueva factura para un cliente'}
                    </p>
                </div>
                <button
                    onClick={onCancel}
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                    <FiX className="w-5 h-5" />
                    Cancelar
                </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Main Info Card */}
                <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Información General</h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Lead Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cliente *
                            </label>
                            <select
                                value={formData.client_id}
                                onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                                disabled={isEditing}
                            >
                                <option value="">Seleccionar cliente</option>
                                {clients.map((client) => (
                                    <option key={client.id} value={client.id}>
                                        {client.name} {client.company && `- ${client.company}`}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Título *
                            </label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Ej: Servicios de consultoría"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            />
                        </div>

                        {/* Issue Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de Emisión *
                            </label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    value={formData.issue_date}
                                    onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    required
                                />
                            </div>
                        </div>

                        {/* Due Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de Vencimiento
                            </label>
                            <div className="relative">
                                <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="date"
                                    value={formData.due_date}
                                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Tax Rate */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                IVA (%)
                            </label>
                            <input
                                type="number"
                                value={formData.tax_rate}
                                onChange={(e) => setFormData({ ...formData, tax_rate: parseFloat(e.target.value) })}
                                min="0"
                                max="100"
                                step="0.01"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Descripción
                        </label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Descripción general de la factura..."
                            rows={3}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Items Card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <InvoiceItems
                        items={formData.items}
                        onChange={(items) => setFormData({ ...formData, items })}
                    />
                </div>

                {/* Totals Card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="max-w-md ml-auto space-y-3">
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Subtotal:</span>
                            <span className="font-medium">{formatCurrency(totals.subtotal)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-600">IVA ({formData.tax_rate}%):</span>
                            <span className="font-medium">{formatCurrency(totals.taxAmount)}</span>
                        </div>
                        <div className="flex justify-between text-lg font-bold border-t pt-3">
                            <span>Total:</span>
                            <span className="text-blue-600">{formatCurrency(totals.total)}</span>
                        </div>
                    </div>
                </div>

                {/* Notes Card */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Notas Internas
                    </label>
                    <textarea
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Notas adicionales (no visibles para el cliente)..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-6 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                    >
                        <FiSave className="w-5 h-5" />
                        {loading ? 'Guardando...' : isEditing ? 'Actualizar Factura' : 'Crear Factura'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default InvoiceForm;
