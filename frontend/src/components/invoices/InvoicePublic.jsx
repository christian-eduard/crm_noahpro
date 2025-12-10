import { useState, useEffect } from 'react';
import { getPublicInvoice } from '../../services/invoiceService';
import { FiFileText, FiCheckCircle, FiClock, FiAlertCircle, FiDownload } from 'react-icons/fi';

const InvoicePublic = () => {
    const pathParts = window.location.pathname.split('/');
    const token = pathParts[pathParts.length - 1];
    const [invoice, setInvoice] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchInvoice();
    }, [token]);

    const fetchInvoice = async () => {
        try {
            setLoading(true);
            const data = await getPublicInvoice(token);
            setInvoice(data);
        } catch (error) {
            setError(error.response?.status === 404 ? 'Factura no encontrada' : 'Error al cargar factura');
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
        return new Date(date).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            pending: {
                label: 'Pendiente de Pago',
                color: 'bg-red-100 text-red-800 border-red-200',
                icon: FiClock
            },
            partial: {
                label: 'Pago Parcial',
                color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                icon: FiAlertCircle
            },
            paid: {
                label: 'Pagada',
                color: 'bg-green-100 text-green-800 border-green-200',
                icon: FiCheckCircle
            }
        };

        const config = statusConfig[status] || statusConfig.pending;
        const Icon = config.icon;

        return (
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${config.color} font-semibold`}>
                <Icon className="w-5 h-5" />
                {config.label}
            </div>
        );
    };

    const getPaymentMethodLabel = (method) => {
        const methods = {
            transfer: 'Transferencia',
            cash: 'Efectivo',
            card: 'Tarjeta',
            check: 'Cheque',
            other: 'Otro'
        };
        return methods[method] || method;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 text-lg">Cargando factura...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FiAlertCircle className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
                    <p className="text-gray-600">{error}</p>
                </div>
            </div>
        );
    }

    if (!invoice) return null;

    const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.payment_status !== 'paid';

    return (
        <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                {/* Header Card */}
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden mb-6">
                    {/* Company Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-600 text-white p-8">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-3 mb-4">
                                    {invoice.company?.company_logo ? (
                                        <img src={invoice.company.company_logo} alt="Logo" className="h-12 w-auto bg-white rounded-lg p-1" />
                                    ) : (
                                        <div className="p-2 bg-white/10 rounded-lg">
                                            <FiFileText className="w-8 h-8" />
                                        </div>
                                    )}
                                    <div>
                                        <h1 className="text-3xl font-bold">Factura</h1>
                                        {invoice.company?.company_name && <p className="text-orange-100 text-sm font-medium">{invoice.company.company_name}</p>}
                                    </div>
                                </div>
                                <p className="text-orange-100 text-lg opacity-90">{invoice.invoice_number}</p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                                {getStatusBadge(invoice.payment_status)}
                            </div>
                        </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="p-8">
                        {/* Client and Dates */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                            <div>
                                <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Facturado a</h2>
                                <p className="text-xl font-bold text-gray-900">{invoice.client_name || invoice.lead_name}</p>
                                {invoice.business_name && (
                                    <p className="text-gray-600 font-medium mb-1">NIF/CIF: {invoice.business_name}</p>
                                )}
                                <div className="text-gray-600 text-sm mt-2 space-y-0.5">
                                    {invoice.client_address && <p>{invoice.client_address}</p>}
                                    {(invoice.client_city || invoice.client_postal_code) && (
                                        <p>
                                            {invoice.client_postal_code} {invoice.client_city}
                                        </p>
                                    )}
                                    {(invoice.client_province || invoice.client_country) && (
                                        <p>
                                            {invoice.client_province} {invoice.client_country && `(${invoice.client_country})`}
                                        </p>
                                    )}
                                    {invoice.client_phone && <p className="pt-1">Telf: {invoice.client_phone}</p>}
                                    {invoice.client_email && <p>Email: {invoice.client_email}</p>}
                                </div>
                            </div>
                            <div className="text-left md:text-right space-y-6">
                                {/* Datos Emisor (Empresa) */}
                                {invoice.company && (
                                    <div>
                                        <h2 className="text-sm font-semibold text-gray-500 uppercase mb-2">Emisor</h2>
                                        <p className="text-xl font-bold text-gray-900">{invoice.company.company_name}</p>
                                        <div className="text-gray-600 text-sm mt-1 space-y-0.5">
                                            {invoice.company.company_nif && <p>NIF: {invoice.company.company_nif}</p>}
                                            {invoice.company.company_address && <p>{invoice.company.company_address}</p>}
                                            {(invoice.company.company_postal_code || invoice.company.company_city) && (
                                                <p>{invoice.company.company_postal_code} {invoice.company.company_city}</p>
                                            )}
                                            {invoice.company.company_phone && <p>Telf: {invoice.company.company_phone}</p>}
                                            {invoice.company.company_email && <p>{invoice.company.company_email}</p>}
                                        </div>
                                    </div>
                                )}

                                {/* Fechas */}
                                <div className="space-y-3 pt-2">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider">Fecha Emisión</p>
                                        <p className="text-sm font-medium text-gray-900">{formatDate(invoice.issue_date)}</p>
                                    </div>
                                    {invoice.due_date && (
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase tracking-wider">Vencimiento</p>
                                            <p className={`text-sm font-medium ${isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                                                {formatDate(invoice.due_date)}
                                                {isOverdue && <span className="font-normal ml-1">(Vencida)</span>}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Title and Description */}
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">{invoice.title}</h2>
                            {invoice.description && (
                                <p className="text-gray-600">{invoice.description}</p>
                            )}
                        </div>

                        {/* Items Table */}
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Detalle</h3>
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Descripción
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cantidad
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Precio
                                            </th>
                                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Total
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {invoice.items.map((item, index) => (
                                            <tr key={index}>
                                                <td className="px-6 py-4 text-sm text-gray-900">
                                                    {item.description}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-900 text-right">
                                                    {formatCurrency(item.price)}
                                                </td>
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900 text-right">
                                                    {formatCurrency(item.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Totals */}
                        <div className="flex justify-end mb-8">
                            <div className="w-full md:w-1/2 space-y-3">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal:</span>
                                    <span className="font-semibold">{formatCurrency(invoice.subtotal)}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>IVA ({invoice.tax_rate}%):</span>
                                    <span className="font-semibold">{formatCurrency(invoice.tax_amount)}</span>
                                </div>
                                <div className="border-t-2 border-gray-300 pt-3 flex justify-between text-xl font-bold text-gray-900">
                                    <span>Total:</span>
                                    <span className="text-blue-600">{formatCurrency(invoice.total_amount)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Status */}
                        {invoice.payment_status !== 'pending' && (
                            <div className={`rounded-lg p-6 mb-8 ${invoice.payment_status === 'paid'
                                ? 'bg-green-50 border-2 border-green-200'
                                : 'bg-yellow-50 border-2 border-yellow-200'
                                }`}>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    {invoice.payment_status === 'paid' ? (
                                        <>
                                            <FiCheckCircle className="w-5 h-5 text-green-600" />
                                            <span className="text-green-900">Estado de Pago</span>
                                        </>
                                    ) : (
                                        <>
                                            <FiAlertCircle className="w-5 h-5 text-yellow-600" />
                                            <span className="text-yellow-900">Estado de Pago</span>
                                        </>
                                    )}
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Total Factura</p>
                                        <p className="text-xl font-bold text-gray-900">
                                            {formatCurrency(invoice.total_amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Pagado</p>
                                        <p className="text-xl font-bold text-green-600">
                                            {formatCurrency(invoice.paid_amount)}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 mb-1">Pendiente</p>
                                        <p className="text-xl font-bold text-red-600">
                                            {formatCurrency(invoice.remaining_amount)}
                                        </p>
                                    </div>
                                </div>

                                {/* Payment History */}
                                {invoice.payments && invoice.payments.length > 0 && (
                                    <div className="mt-6">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Historial de Pagos</h4>
                                        <div className="space-y-2">
                                            {invoice.payments.map((payment, index) => (
                                                <div key={index} className="flex justify-between items-center bg-white rounded-lg p-3 text-sm">
                                                    <div>
                                                        <span className="font-medium text-gray-900">
                                                            {formatDate(payment.payment_date)}
                                                        </span>
                                                        <span className="text-gray-500 ml-2">
                                                            ({getPaymentMethodLabel(payment.payment_method)})
                                                        </span>
                                                    </div>
                                                    <span className="font-semibold text-green-600">
                                                        {formatCurrency(payment.amount)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Notes */}
                        {invoice.notes && (
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h3 className="text-sm font-semibold text-gray-700 mb-2">Notas</h3>
                                <p className="text-gray-600 text-sm">{invoice.notes}</p>
                            </div>
                        )}

                        {/* Actions */}
                        <div className="flex justify-center gap-4">
                            <button
                                onClick={() => window.print()}
                                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:shadow-orange-500/30 transition-all font-semibold no-print"
                            >
                                <FiDownload className="w-5 h-5" />
                                Descargar / Imprimir
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center text-gray-500 text-sm">
                    <p>Esta es una factura generada electrónicamente.</p>
                    <p className="mt-1">Para cualquier consulta, por favor contacte con nosotros.</p>
                </div>
            </div>

            {/* Print Styles */}
            <style>{`
                @media print {
                    * {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    
                    html, body {
                        background: white !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        font-size: 12px !important;
                    }
                    
                    .min-h-screen {
                        min-height: auto !important;
                        background: white !important;
                        padding: 0 !important;
                    }
                    
                    .max-w-4xl {
                        max-width: 100% !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    
                    .bg-white {
                        box-shadow: none !important;
                    }
                    
                    .rounded-2xl, .rounded-xl, .rounded-lg {
                        border-radius: 0 !important;
                    }
                    
                    .shadow-2xl, .shadow-xl, .shadow-lg, .shadow-sm {
                        box-shadow: none !important;
                    }
                    
                    /* Header color print */
                    .bg-gradient-to-r {
                        background: #f97316 !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    
                    /* Grid layout for print */
                    .grid-cols-1 {
                        display: flex !important;
                        flex-direction: row !important;
                        justify-content: space-between !important;
                    }
                    
                    .md\\:grid-cols-2 > div {
                        width: 48% !important;
                    }
                    
                    .md\\:text-right {
                        text-align: right !important;
                    }
                    
                    /* Table styles */
                    table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        page-break-inside: avoid !important;
                    }
                    
                    th, td {
                        padding: 8px !important;
                        border: 1px solid #e5e7eb !important;
                    }
                    
                    thead {
                        background: #f9fafb !important;
                        -webkit-print-color-adjust: exact !important;
                    }
                    
                    /* Hide non-print elements */
                    .no-print,
                    button,
                    .flex.justify-center.gap-4 {
                        display: none !important;
                    }
                    
                    /* Footer in print */
                    .text-center.text-gray-500 {
                        margin-top: 20px !important;
                        padding-top: 10px !important;
                        border-top: 1px solid #e5e7eb !important;
                    }
                    
                    /* Page break control */
                    .mb-8 {
                        page-break-inside: avoid !important;
                    }
                    
                    /* Ensure text colors are visible */
                    .text-gray-900, .text-gray-800, .text-gray-700 {
                        color: #111827 !important;
                    }
                    
                    .text-gray-600, .text-gray-500 {
                        color: #4b5563 !important;
                    }
                    
                    /* Status badge colors */
                    .bg-green-100 {
                        background-color: #d1fae5 !important;
                    }
                    .bg-red-100 {
                        background-color: #fee2e2 !important;
                    }
                    .bg-yellow-100 {
                        background-color: #fef3c7 !important;
                    }
                    
                    /* Header text in white */
                    .text-white {
                        color: white !important;
                    }
                    
                    .text-orange-100 {
                        color: #ffedd5 !important;
                    }
                }
                
                @page {
                    size: A4;
                    margin: 15mm;
                }
            `}</style>
        </div>
    );
};

export default InvoicePublic;
