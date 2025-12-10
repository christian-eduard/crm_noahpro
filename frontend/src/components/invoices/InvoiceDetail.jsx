import { useState, useEffect } from 'react';
import { getInvoiceById, resendInvoiceEmail } from '../../services/invoiceService';
import { useToast } from '../../contexts/ToastContext';
import PaymentForm from './PaymentForm';
import PaymentHistory from './PaymentHistory';
import {
    FiArrowLeft, FiEdit2, FiMail, FiExternalLink, FiFileText,
    FiDollarSign, FiActivity, FiCheckCircle, FiClock, FiAlertCircle
} from 'react-icons/fi';

const InvoiceDetail = ({ invoiceId, onBack, initialTab = 'info' }) => {
    const id = invoiceId;
    const toast = useToast();

    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [showPaymentForm, setShowPaymentForm] = useState(false);

    useEffect(() => {
        fetchInvoice();
    }, [id]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const data = await getInvoiceById(id);
            setInvoice(data);
        } catch (error) {
            toast.error('Error al cargar factura');
            if (onBack) onBack();
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async () => {
        try {
            await resendInvoiceEmail(id);
            toast.success('Email enviado exitosamente');
            fetchInvoice();
        } catch (error) {
            toast.error('Error al enviar email');
        }
    };

    const handlePaymentSuccess = () => {
        setShowPaymentForm(false);
        fetchInvoice();
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
            partial: { label: 'Pago Parcial', color: 'bg-yellow-100 text-yellow-800', icon: FiAlertCircle },
            paid: { label: 'Pagada', color: 'bg-green-100 text-green-800', icon: FiCheckCircle }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                <Icon className="w-4 h-4" />
                {config.label}
            </span>
        );
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!invoice) return null;

    const publicUrl = `${window.location.origin}/invoice/${invoice.token}`;

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div className="flex items-start gap-4">
                    <button
                        onClick={() => window.location.href = '/invoices'}
                        className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <FiArrowLeft className="w-6 h-6" />
                    </button>
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">
                                {invoice.invoice_number}
                            </h1>
                            {getStatusBadge(invoice.payment_status)}
                        </div>
                        <p className="text-gray-600">{invoice.title}</p>
                        <p className="text-sm text-gray-500 mt-1">
                            Cliente: {invoice.client_name || invoice.lead_name}
                            {invoice.business_name && ` - ${invoice.business_name}`}
                        </p>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => window.location.href = `/invoices/${id}/edit`}
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <FiEdit2 className="w-4 h-4" />
                        Editar
                    </button>
                    <button
                        onClick={handleResendEmail}
                        className="flex items-center gap-2 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <FiMail className="w-4 h-4" />
                        Enviar Email
                    </button>
                    <a
                        href={publicUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <FiExternalLink className="w-4 h-4" />
                        Ver Pública
                    </a>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="text-sm text-gray-600 mb-1">Total</div>
                    <div className="text-2xl font-bold text-gray-900">
                        {formatCurrency(invoice.total_amount)}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="text-sm text-gray-600 mb-1">Pagado</div>
                    <div className="text-2xl font-bold text-green-600">
                        {formatCurrency(invoice.paid_amount)}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="text-sm text-gray-600 mb-1">Pendiente</div>
                    <div className="text-2xl font-bold text-red-600">
                        {formatCurrency(invoice.remaining_amount)}
                    </div>
                </div>
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="text-sm text-gray-600 mb-1">Vencimiento</div>
                    <div className="text-lg font-semibold text-gray-900">
                        {formatDate(invoice.due_date)}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button
                            onClick={() => setActiveTab('info')}
                            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'info'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <FiFileText className="w-4 h-4" />
                            Información
                        </button>
                        <button
                            onClick={() => setActiveTab('payments')}
                            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'payments'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <FiDollarSign className="w-4 h-4" />
                            Pagos ({invoice.payments?.length || 0})
                        </button>
                        <button
                            onClick={() => setActiveTab('activity')}
                            className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm transition-colors ${activeTab === 'activity'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            <FiActivity className="w-4 h-4" />
                            Actividad
                        </button>
                    </nav>
                </div>

                <div className="p-6">
                    {/* Info Tab */}
                    {activeTab === 'info' && (
                        <div className="space-y-6">
                            {/* Company Details (Emitter) */}
                            {invoice.company && invoice.company.company_name && (
                                <div className="bg-gray-50 p-4 rounded-lg mb-6 border border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Emisor</h3>
                                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                        <div>
                                            {invoice.company.company_logo && (
                                                <img src={invoice.company.company_logo} alt="Logo" className="h-10 w-auto mb-2 object-contain" />
                                            )}
                                            <div className="font-medium text-gray-900">{invoice.company.company_name}</div>
                                            {invoice.company.company_nif && <div className="text-sm text-gray-600">NIF: {invoice.company.company_nif}</div>}
                                        </div>
                                        <div className="text-sm text-gray-600 space-y-1 text-right">
                                            {invoice.company.company_address && <div>{invoice.company.company_address}</div>}
                                            {invoice.company.company_phone && <div>{invoice.company.company_phone}</div>}
                                            {invoice.company.company_email && <div>{invoice.company.company_email}</div>}
                                            {invoice.company.company_website && (
                                                <a href={invoice.company.company_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    {invoice.company.company_website}
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Client Details (Receiver) */}
                            <div className="bg-white border border-gray-200 p-4 rounded-lg mb-6 shadow-sm">
                                <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Cliente</h3>
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                    <div>
                                        <div className="font-medium text-gray-900 text-lg">{invoice.client_name || invoice.lead_name}</div>
                                        {invoice.business_name && <div className="text-sm text-gray-600">NIF/CIF: {invoice.business_name}</div>}
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1 text-right">
                                        {invoice.client_address && <div>{invoice.client_address}</div>}
                                        {(invoice.client_city || invoice.client_postal_code) && (
                                            <div>
                                                {invoice.client_postal_code && <span>{invoice.client_postal_code} </span>}
                                                {invoice.client_city && <span>{invoice.client_city}</span>}
                                            </div>
                                        )}
                                        {(invoice.client_province || invoice.client_country) && (
                                            <div>
                                                {invoice.client_province && <span>{invoice.client_province}</span>}
                                                {invoice.client_province && invoice.client_country && <span>, </span>}
                                                {invoice.client_country && <span>{invoice.client_country}</span>}
                                            </div>
                                        )}
                                        {invoice.client_email && <div>{invoice.client_email}</div>}
                                        {invoice.phone && <div>{invoice.phone}</div>}
                                    </div>
                                </div>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha de Emisión
                                    </label>
                                    <div className="text-gray-900">{formatDate(invoice.issue_date)}</div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha de Vencimiento
                                    </label>
                                    <div className="text-gray-900">{formatDate(invoice.due_date)}</div>
                                </div>
                                {invoice.paid_date && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Fecha de Pago
                                        </label>
                                        <div className="text-gray-900">{formatDate(invoice.paid_date)}</div>
                                    </div>
                                )}
                            </div>

                            {/* Description */}
                            {invoice.description && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Descripción
                                    </label>
                                    <p className="text-gray-900">{invoice.description}</p>
                                </div>
                            )}

                            {/* Items */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Items
                                </label>
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                                    Descripción
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Cantidad
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Precio
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                                    Total
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {invoice.items.map((item, index) => (
                                                <tr key={index}>
                                                    <td className="px-4 py-3 text-sm text-gray-900">
                                                        {item.description}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                        {item.quantity}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                                        {formatCurrency(item.price)}
                                                    </td>
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                                        {formatCurrency(item.total)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="border-t pt-4">
                                <div className="max-w-md ml-auto space-y-2">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal:</span>
                                        <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">IVA ({invoice.tax_rate}%):</span>
                                        <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
                                    </div>
                                    <div className="flex justify-between text-lg font-bold border-t pt-2">
                                        <span>Total:</span>
                                        <span className="text-blue-600">{formatCurrency(invoice.total_amount)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Notes */}
                            {invoice.notes && (
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Notas Internas
                                    </label>
                                    <p className="text-gray-900 text-sm">{invoice.notes}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Payments Tab */}
                    {activeTab === 'payments' && (
                        <div className="space-y-4">
                            {invoice.payment_status !== 'paid' && (
                                <div className="flex justify-end">
                                    <button
                                        onClick={() => setShowPaymentForm(true)}
                                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                                    >
                                        <FiDollarSign className="w-4 h-4" />
                                        Registrar Pago
                                    </button>
                                </div>
                            )}

                            {showPaymentForm && (
                                <PaymentForm
                                    invoiceId={id}
                                    remainingAmount={invoice.remaining_amount}
                                    onSuccess={handlePaymentSuccess}
                                    onCancel={() => setShowPaymentForm(false)}
                                />
                            )}

                            <PaymentHistory
                                invoiceId={id}
                                payments={invoice.payments || []}
                                onUpdate={fetchInvoice}
                            />
                        </div>
                    )}

                    {/* Activity Tab */}
                    {activeTab === 'activity' && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Email Enviado</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {invoice.email_sent ? 'Sí' : 'No'}
                                    </div>
                                    {invoice.email_sent_at && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {formatDate(invoice.email_sent_at)}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Email Abierto</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {invoice.email_opened ? 'Sí' : 'No'}
                                    </div>
                                    {invoice.email_opened_at && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {formatDate(invoice.email_opened_at)}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Factura Visualizada</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {invoice.viewed ? 'Sí' : 'No'}
                                    </div>
                                    {invoice.viewed_at && (
                                        <div className="text-xs text-gray-500 mt-1">
                                            {formatDate(invoice.viewed_at)}
                                        </div>
                                    )}
                                </div>

                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="text-sm text-gray-600 mb-1">Número de Vistas</div>
                                    <div className="text-lg font-semibold text-gray-900">
                                        {invoice.view_count}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <div className="text-sm font-medium text-blue-900 mb-2">
                                    Enlace Público
                                </div>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={publicUrl}
                                        readOnly
                                        className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded text-sm"
                                    />
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(publicUrl);
                                            showToast('Enlace copiado', 'success');
                                        }}
                                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                    >
                                        Copiar
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default InvoiceDetail;
