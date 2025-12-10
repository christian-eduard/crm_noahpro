import { deletePayment, resendReceipt } from '../../services/invoiceService';
import { useToast } from '../../contexts/ToastContext';
import { FiTrash2, FiMail, FiDollarSign } from 'react-icons/fi';

const PaymentHistory = ({ invoiceId, payments, onUpdate }) => {
    const { showToast } = useToast();

    const handleDelete = async (paymentId, amount) => {
        if (!window.confirm(`¿Eliminar pago de ${formatCurrency(amount)}?`)) return;

        try {
            await deletePayment(paymentId);
            showToast('Pago eliminado exitosamente', 'success');
            onUpdate();
        } catch (error) {
            showToast('Error al eliminar pago', 'error');
        }
    };

    const handleResendReceipt = async (paymentId) => {
        try {
            await resendReceipt(paymentId);
            showToast('Recibo enviado exitosamente', 'success');
            onUpdate();
        } catch (error) {
            showToast('Error al enviar recibo', 'error');
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

    if (payments.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                <FiDollarSign className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pagos registrados</h3>
                <p className="text-gray-600">Los pagos aparecerán aquí una vez registrados</p>
            </div>
        );
    }

    const totalPaid = payments.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);

    return (
        <div className="space-y-4">
            {/* Summary */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex justify-between items-center">
                    <div className="text-sm text-green-900">Total Pagado</div>
                    <div className="text-2xl font-bold text-green-700">
                        {formatCurrency(totalPaid)}
                    </div>
                </div>
            </div>

            {/* Payments List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Fecha
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Recibo
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Método
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Referencia
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Monto
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Acciones
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {payments.map((payment) => (
                            <tr key={payment.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(payment.payment_date)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    {payment.receipt_number}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {getPaymentMethodLabel(payment.payment_method)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {payment.reference || '-'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600 text-right">
                                    {formatCurrency(payment.amount)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleResendReceipt(payment.id)}
                                            className="text-blue-600 hover:text-blue-900"
                                            title="Reenviar recibo"
                                        >
                                            <FiMail className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(payment.id, payment.amount)}
                                            className="text-red-600 hover:text-red-900"
                                            title="Eliminar pago"
                                        >
                                            <FiTrash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Notes */}
            {payments.some(p => p.notes) && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">Notas de Pagos:</h4>
                    {payments.filter(p => p.notes).map((payment) => (
                        <div key={payment.id} className="bg-gray-50 rounded-lg p-3">
                            <div className="text-xs text-gray-500 mb-1">
                                {payment.receipt_number} - {formatDate(payment.payment_date)}
                            </div>
                            <div className="text-sm text-gray-900">{payment.notes}</div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default PaymentHistory;
