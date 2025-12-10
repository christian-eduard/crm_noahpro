import { API_URL, SOCKET_URL } from '../../config';
import React, { useState, useEffect } from 'react';
import { FiFileText, FiDownload, FiEye, FiSearch, FiFilter, FiArrowLeft } from 'react-icons/fi';
import { useToast } from '../../contexts/ToastContext';
import InvoiceDetail from '../invoices/InvoiceDetail';

const ClientInvoices = ({ clientId }) => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, paid, pending, overdue
    const [selectedInvoiceId, setSelectedInvoiceId] = useState(null);
    const toast = useToast();

    useEffect(() => {
        fetchInvoices();
    }, [clientId]);

    const fetchInvoices = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('crm_token');
            const response = await fetch(`${API_URL}/invoices?client_id=${clientId}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) throw new Error('Error al cargar facturas');

            const data = await response.json();
            // The API returns { invoices: [], pagination: {} }
            setInvoices(data.invoices || []);
        } catch (error) {
            console.error('Error fetching invoices:', error);
            // toast.error('Error al cargar el historial de facturas');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status, dueDate) => {
        const isOverdue = dueDate && new Date(dueDate) < new Date() && status !== 'paid';

        if (status === 'paid') {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">Pagada</span>;
        }
        if (isOverdue) {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 border border-red-200">Vencida</span>;
        }
        if (status === 'partial') {
            return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">Parcial</span>;
        }
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 border border-blue-200">Pendiente</span>;
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-ES', {
            style: 'currency',
            currency: 'EUR'
        }).format(amount);
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('es-ES');
    };

    const filteredInvoices = invoices.filter(invoice => {
        if (filter === 'all') return true;
        const isOverdue = invoice.due_date && new Date(invoice.due_date) < new Date() && invoice.payment_status !== 'paid';
        if (filter === 'overdue') return isOverdue;
        return invoice.payment_status === filter;
    });

    if (selectedInvoiceId) {
        return (
            <div className="animate-fade-in">
                {/* Nota: InvoiceDetail ya tiene un botón de volver, pero podemos envolverlo si queremos control extra o si el botón interno no se comporta como esperamos en este contexto.
                    Sin embargo, InvoiceDetail usa onBack, así que eso es suficiente. 
                    El botón de "Volver" interno de InvoiceDetail llamará a onBack.
                */}
                <InvoiceDetail
                    invoiceId={selectedInvoiceId}
                    onBack={() => {
                        setSelectedInvoiceId(null);
                        fetchInvoices(); // Refrescar al volver por si hubo cambios (pagos, etc)
                    }}
                />
            </div>
        );
    }

    if (loading) return <div className="text-center p-8 text-gray-500">Cargando facturas...</div>;

    if (invoices.length === 0) {
        return (
            <div className="text-center p-8 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                <FiFileText className="mx-auto h-12 w-12 text-gray-400 mb-2" />
                <h3 className="text-lg font-medium text-gray-900">No hay facturas</h3>
                <p className="text-gray-500">Este cliente aún no tiene facturas registradas.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">Historial de Facturación</h3>
                <div className="flex gap-2">
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                    >
                        <option value="all">Todas</option>
                        <option value="paid">Pagadas</option>
                        <option value="pending">Pendientes</option>
                        <option value="overdue">Vencidas</option>
                    </select>
                </div>
            </div>

            <div className="overflow-x-auto border border-gray-200 rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Número</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vencimiento</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Importe</th>
                            <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredInvoices.map((invoice) => (
                            <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                    {invoice.invoice_number}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(invoice.issue_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {formatDate(invoice.due_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                                    {formatCurrency(invoice.total_amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    {getStatusBadge(invoice.payment_status, invoice.due_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex justify-end gap-3">
                                        <button
                                            onClick={() => setSelectedInvoiceId(invoice.id)}
                                            className="text-gray-400 hover:text-blue-600 transition-colors"
                                            title="Ver detalles"
                                        >
                                            <FiEye className="w-5 h-5" />
                                        </button>
                                        <a
                                            href={`/invoice/${invoice.token}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-gray-400 hover:text-green-600 transition-colors"
                                            title="Ver pública / Imprimir"
                                        >
                                            <FiDownload className="w-5 h-5" />
                                        </a>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default ClientInvoices;
