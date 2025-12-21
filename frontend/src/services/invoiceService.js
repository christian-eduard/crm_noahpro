import { API_URL } from '../config';

const getAuthHeaders = () => {
    const token = localStorage.getItem('crm_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getInvoices = async (params = {}) => {
    try {
        const queryParams = new URLSearchParams();
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                queryParams.append(key, params[key]);
            }
        });
        const response = await fetch(`${API_URL}/invoices?${queryParams.toString()}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Error fetching invoices');
        return await response.json();
    } catch (error) {
        console.error('getInvoices error:', error);
        throw error;
    }
};

export const getInvoiceById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/invoices/${id}`, { headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Error fetching invoice');
        return await response.json();
    } catch (error) {
        console.error('getInvoiceById error:', error);
        throw error;
    }
};

export const createInvoice = async (data) => {
    try {
        const response = await fetch(`${API_URL}/invoices`, {
            method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error creating invoice');
        }
        return await response.json();
    } catch (error) {
        console.error('createInvoice error:', error);
        throw error;
    }
};

export const updateInvoice = async (id, data) => {
    try {
        const response = await fetch(`${API_URL}/invoices/${id}`, {
            method: 'PUT', headers: getAuthHeaders(), body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error updating invoice');
        }
        return await response.json();
    } catch (error) {
        console.error('updateInvoice error:', error);
        throw error;
    }
};

export const deleteInvoice = async (id) => {
    try {
        const response = await fetch(`${API_URL}/invoices/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
        if (!response.ok) throw new Error('Error deleting invoice');
        return await response.json();
    } catch (error) {
        console.error('deleteInvoice error:', error);
        throw error;
    }
};

// Alias registerPayment
export const registerPayment = async (invoiceId, data) => {
    try {
        const response = await fetch(`${API_URL}/invoices/${invoiceId}/payments`, {
            method: 'POST', headers: getAuthHeaders(), body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al registrar pago');
        }
        return response.json();
    } catch (error) {
        console.error('registerPayment error:', error);
        throw error;
    }
};
export const addPayment = registerPayment;

export const getPayments = async (invoiceId) => {
    try {
        const response = await fetch(`${API_URL}/invoices/${invoiceId}/payments`, { headers: getAuthHeaders() });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener pagos');
        }
        return response.json();
    } catch (error) {
        console.error('getPayments error:', error);
        throw error;
    }
};

export const deletePayment = async (paymentId) => {
    try {
        const response = await fetch(`${API_URL}/invoices/payments/${paymentId}`, { method: 'DELETE', headers: getAuthHeaders() });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al eliminar pago');
        }
        return response.json();
    } catch (error) {
        console.error('deletePayment error:', error);
        throw error;
    }
};

export const resendReceipt = async (paymentId) => {
    try {
        const response = await fetch(`${API_URL}/invoices/payments/${paymentId}/resend-receipt`, {
            method: 'POST', headers: getAuthHeaders()
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al enviar recibo');
        }
        return response.json();
    } catch (error) {
        console.error('resendReceipt error:', error);
        throw error;
    }
};

export const resendInvoiceEmail = async (id) => {
    try {
        const response = await fetch(`${API_URL}/invoices/${id}/send`, { method: 'POST', headers: getAuthHeaders() });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error al enviar la factura por email');
        }
        return await response.json();
    } catch (error) {
        console.error('resendInvoiceEmail error:', error);
        throw error;
    }
};

export const getPublicInvoice = async (token) => {
    try {
        const response = await fetch(`${API_URL}/invoices/public/${token}`);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Error al obtener factura pública');
        }
        return response.json();
    } catch (error) {
        console.error('getPublicInvoice error:', error);
        throw error;
    }
};
