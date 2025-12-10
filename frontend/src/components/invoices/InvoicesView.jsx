import { useState, useEffect } from 'react';
import InvoiceForm from './InvoiceForm';
import InvoiceDetail from './InvoiceDetail';
import { getInvoices, deleteInvoice } from '../../services/invoiceService';
import { useToast } from '../../contexts/ToastContext';
import {
    FiPlus, FiSearch, FiFilter, FiEye, FiEdit2, FiTrash2,
    FiMail, FiDollarSign, FiFileText, FiClock, FiCheckCircle, FiAlertCircle
} from 'react-icons/fi';

const InvoicesView = () => {
    const { showToast } = useToast();
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({
        status: '',
        search: '',
        page: 1,
        limit: 20
    });
    const [pagination, setPagination] = useState({});
    const [view, setView] = useState('list'); // 'list', 'create', 'edit'
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const data = await getInvoices(filters);
            setInvoices(data.invoices || []);
            setPagination(data.pagination || {});
        } catch (error) {
            console.error('Error fetching invoices:', error);
            setInvoices([]);
            setPagination({});
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
    }, [filters.status, filters.search, filters.page]);

    const handleDelete = async (id, invoiceNumber) => {
        if (!window.confirm(`¿Eliminar factura ${invoiceNumber}?`)) return;

        try {
            await deleteInvoice(id);
            showToast('Factura eliminada exitosamente', 'success');
            fetchInvoices();
        } catch (error) {
            showToast('Error al eliminar factura', 'error');
        }
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
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
                <Icon className="w-3 h-3" />
                {config.label}
            </span>
        );
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

    return (
        <div className="p-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Facturas</h1>
                    <p className="text-gray-600 mt-1">Gestiona las facturas de tus clientes</p>
                </div>
                {view === 'list' && (
                    <button
                        onClick={() => {
                            setSelectedInvoiceId(null);
                            setView('create');
                        }}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <FiPlus className="w-5 h-5" />
                        Nueva Factura
                    </button>
                )}
            </div>

            {/* Content */}
            {(view === 'create' || view === 'edit') ? (
                <InvoiceForm
                    invoiceId={selectedInvoiceId}
                    onSuccess={() => {
                        setView('list');
                        fetchInvoices();
                    }}
                    onCancel={() => setView('list')}
                />
            ) : view === 'detail' ? (
                <InvoiceDetail
                    invoiceId={selectedInvoiceId}
                    onBack={() => setView('list')}
                />
            ) : (
                <>
                    {/* Filters */}
                    <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar por número, título o cliente..."
                                    value={filters.search}
                                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            {/* Status Filter */}
                            <div className="relative">
                                <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <select
                                    value={filters.status}
                                    onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="pending">Pendiente</option>
                                    <option value="partial">Pago Parcial</option>
                                    <option value="paid">Pagada</option>
                                </select>
                            </div>

                            {/* Clear Filters */}
                            {(filters.search || filters.status) && (
                                <button
                                    onClick={() => setFilters({ status: '', search: '', page: 1, limit: 20 })}
                                    className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
                                >
                                    Limpiar filtros
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                            </div>
                        ) : invoices.length === 0 ? (
                            <div className="text-center py-12">
                                <FiFileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay facturas</h3>
                                <p className="text-gray-600 mb-4">Crea tu primera factura para comenzar</p>
                                <button
                                    onClick={() => {
                                        setSelectedInvoiceId(null);
                                        setView('create');
                                    }}
                                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    <FiPlus className="w-5 h-5" />
                                    Nueva Factura
                                </button>
                            </div>
                        ) : (
                            <>
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Número
                                            </th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                Cliente
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
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{invoice.client_name}</div>
                                                    {invoice.business_name && (
                                                        <div className="text-sm text-gray-500">{invoice.business_name}</div>
                                                    )}
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
                                                            onClick={() => {
                                                                setSelectedInvoiceId(invoice.id);
                                                                setView('detail');
                                                            }}
                                                            className="text-blue-600 hover:text-blue-900"
                                                            title="Ver detalle"
                                                        >
                                                            <FiEye className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setSelectedInvoiceId(invoice.id);
                                                                setView('edit');
                                                            }}
                                                            className="text-gray-600 hover:text-gray-900"
                                                            title="Editar"
                                                        >
                                                            <FiEdit2 className="w-5 h-5" />
                                                        </button>
                                                        {invoice.payment_status !== 'paid' && (
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedInvoiceId(invoice.id);
                                                                    setView('detail');
                                                                    // Note: InvoiceDetail needs to handle initialTab via prop if we want to switch tabs directly
                                                                    // For now just opening detail is fine, or we can add initialTab prop to InvoiceDetail
                                                                }}
                                                                className="text-green-600 hover:text-green-900"
                                                                title="Registrar pago"
                                                            >
                                                                <FiDollarSign className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                        <button
                                                            onClick={() => handleDelete(invoice.id, invoice.invoice_number)}
                                                            className="text-red-600 hover:text-red-900"
                                                            title="Eliminar"
                                                        >
                                                            <FiTrash2 className="w-5 h-5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Pagination */}
                                {pagination.pages > 1 && (
                                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                                        <div className="flex-1 flex justify-between sm:hidden">
                                            <button
                                                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                                disabled={filters.page === 1}
                                                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Anterior
                                            </button>
                                            <button
                                                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                                disabled={filters.page === pagination.pages}
                                                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                            >
                                                Siguiente
                                            </button>
                                        </div>
                                        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                                            <div>
                                                <p className="text-sm text-gray-700">
                                                    Mostrando <span className="font-medium">{(filters.page - 1) * filters.limit + 1}</span> a{' '}
                                                    <span className="font-medium">
                                                        {Math.min(filters.page * filters.limit, pagination.total)}
                                                    </span>{' '}
                                                    de <span className="font-medium">{pagination.total}</span> resultados
                                                </p>
                                            </div>
                                            <div>
                                                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                                                    <button
                                                        onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                                        disabled={filters.page === 1}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        Anterior
                                                    </button>
                                                    {[...Array(pagination.pages)].map((_, i) => (
                                                        <button
                                                            key={i + 1}
                                                            onClick={() => setFilters({ ...filters, page: i + 1 })}
                                                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${filters.page === i + 1
                                                                ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                                                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                                                }`}
                                                        >
                                                            {i + 1}
                                                        </button>
                                                    ))}
                                                    <button
                                                        onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                                        disabled={filters.page === pagination.pages}
                                                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                                                    >
                                                        Siguiente
                                                    </button>
                                                </nav>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default InvoicesView;
