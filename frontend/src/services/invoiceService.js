import { API_URL } from '../config';

const getAuthHeaders = () => {
    const token = localStorage.getItem('crm_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

// Invoices
export const getInvoices = async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = `${API_URL}/invoices${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener facturas');
    }

    return response.json();
};

export const getInvoiceById = async (id) => {
    const response = await fetch(`${API_URL}/invoices/${id}`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener factura');
    }

    return response.json();
};

export const createInvoice = async (data) => {
    const response = await fetch(`${API_URL}/invoices`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        let errorData;
        try {
            errorData = await response.json();
        } catch (e) {
            console.error('Non-JSON response:', await response.text());
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        throw new Error(errorData.error || 'Error al crear factura');
    }

    return response.json();
};

export const updateInvoice = async (id, data) => {
    const response = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(data)
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al actualizar factura');
    }

    return response.json();
};

export const deleteInvoice = async (id) => {
    const response = await fetch(`${API_URL}/invoices/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al eliminar factura');
    }

    return response.json();
};

export const resendInvoiceEmail = async (id) => {
    const response = await fetch(`${API_URL}/invoices/${id}/resend-email`, {
        method: 'POST',
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al enviar email');
    }

    return response.json();
};

// Payments
export const registerPayment = async (invoiceId, data) => {
    const response = await fetch(`${API_URL}/invoices/${invoiceId}/payments`, {
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
