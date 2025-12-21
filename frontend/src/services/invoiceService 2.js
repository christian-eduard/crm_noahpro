import { API_URL } from '../config';

const getHeaders = () => {
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

        const response = await fetch(`${API_URL}/invoices?${queryParams.toString()}`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Error fetching invoices');
        }

        return await response.json();
    } catch (error) {
        console.error('getInvoices error:', error);
        throw error;
    }
};

export const getInvoiceById = async (id) => {
    try {
        const response = await fetch(`${API_URL}/invoices/${id}`, {
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Error fetching invoice');
        }

        return await response.json();
    } catch (error) {
        console.error('getInvoiceById error:', error);
        throw error;
    }
};

export const createInvoice = async (data) => {
    try {
        const response = await fetch(`${API_URL}/invoices`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(data)
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
            method: 'PUT',
            headers: getHeaders(),
            body: JSON.stringify(data)
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
        const response = await fetch(`${API_URL}/invoices/${id}`, {
            method: 'DELETE',
            headers: getHeaders()
        });

        if (!response.ok) {
            throw new Error('Error deleting invoice');
        }

        return await response.json();
    } catch (error) {
        console.error('deleteInvoice error:', error);
        throw error;
    }
};
e = await fetch(`${API_URL}/invoices/${invoiceId}/payments`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al registrar pago');
    }

    return response.json();
};

export const getPayments = async (invoiceId) => {
    const response = await fetch(`${API_URL}/invoices/${invoiceId}/payments`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener pagos');
    }

    return response.json();
};

export const deletePayment = async (paymentId) => {
    const response = await fetch(`${API_URL}/invoices/payments/${paymentId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar pago');
    }

    return response.json();
};

export const resendReceipt = async (paymentId) => {
    const response = await fetch(`${API_URL}/invoices/payments/${paymentId}/resend-receipt`, {
        method: 'POST',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar recibo');
    }

    return response.json();
};

// Public
export const getPublicInvoice = async (token) => {
    const response = await fetch(`${API_URL}/invoices/public/${token}`);

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener factura pública');
    }

    return response.json();
};
