import { useState, useEffect } from 'react';
import { getInvoices } from '../../services/invoiceService';
import { useToast } from '../../contexts/ToastContext';
import {
    FiPlus, FiEye, FiDollarSign, FiFileText,
    FiCheckCircle, FiClock, FiAlertCircle
} from 'react-icons/fi';

const LeadInvoices = ({ leadId, leadName }) => {
    const { showToast } = useToast();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState({
        total: 0,
        paid: 0,
        pending: 0
    });

    useEffect(() => {
        if (leadId) {
            fetchInvoices();
        }
    }, [leadId]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const data = await getInvoices({ lead_id: leadId, limit: 100 });
            setInvoices(data.invoices);

            // Calculate summary
            const totals = data.invoices.reduce((acc, inv) => ({
                total: acc.total + parseFloat(inv.total_amount),
                paid: acc.paid + parseFloat(inv.paid_amount),
                pending: acc.pending + parseFloat(inv.remaining_amount)
            }), { total: 0, paid: 0, pending: 0 });

            setSummary(totals);
        } catch (error) {
            showToast('Error al cargar facturas', 'error');
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

    const formatDate = (date) => {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('es-ES');
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: { label: 'Pendiente', color: 'bg-red-100 text-red-800', icon: FiClock },
            partial: { label: 'Parcial', color: 'bg-yellow-100 text-yellow-800', icon: FiAlertCircle },
            paid: { label: 'Pagada', color: 'bg-green-100 text-green-800', icon: FiCheckCircle }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-blue-600 font-medium">Total Facturado</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">
                                {formatCurrency(summary.total)}
                            </p>
                        </div>
                        <FiFileText className="w-8 h-8 text-blue-400" />
                    </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-green-600 font-medium">Total Pagado</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">
                                {formatCurrency(summary.paid)}
                            </p>
                        </div>
                        <FiCheckCircle className="w-8 h-8 text-green-400" />
                    </div>
                </div>

                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-red-600 font-medium">Total Pendiente</p>
                            <p className="text-2xl font-bold text-red-900 mt-1">
                                {formatCurrency(summary.pending)}
                            </p>
                        </div>
                        <FiClock className="w-8 h-8 text-red-400" />
                    </div>
                </div>
            </div>

            {/* Action Button */}
            <div className="flex justify-end">
                <button
                    onClick={() => {
                        window.location.href = `/invoices/new?lead_id=${leadId}`;
                    }}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <FiPlus className="w-4 h-4" />
                    Nueva Factura para {leadName}
                </button>
            </div>

            {/* Invoices List */}
            {invoices.length === 0 ? (
                <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                    <FiFileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No hay facturas</h3>
                    <p className="text-gray-600 mb-4">Este cliente aún no tiene facturas registradas</p>
                    <button
                        onClick={() => window.location.href = `/invoices/new?lead_id=${leadId}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <FiPlus className="w-4 h-4" />
                        Crear Primera Factura
                    </button>
                </div>
            ) : (
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Número
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Fecha
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Total
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pagado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Pendiente
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.map((invoice) => (
                                <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <FiFileText className="w-4 h-4 text-gray-400" />
                                            <span className="text-sm font-medium text-gray-900">
                                                {invoice.invoice_number}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {formatDate(invoice.issue_date)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        {formatCurrency(invoice.total_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600">
                                        {formatCurrency(invoice.paid_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                                        {formatCurrency(invoice.remaining_amount)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {getStatusBadge(invoice.payment_status)}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => window.location.href = `/invoices/${invoice.id}`}
                                                className="text-blue-600 hover:text-blue-900"
                                                title="Ver detalle"
                                            >
                                                <FiEye className="w-4 h-4" />
                                            </button>
                                            {invoice.payment_status !== 'paid' && (
                                                <button
                                                    onClick={() => window.location.href = `/invoices/${invoice.id}?tab=payments`}
                                                    className="text-green-600 hover:text-green-900"
                                                    title="Registrar pago"
                                                >
                                                    <FiDollarSign className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default LeadInvoices;
