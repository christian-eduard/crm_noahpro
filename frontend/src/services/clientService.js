import { API_URL } from '../config';

const getAuthHeaders = () => {
    const token = localStorage.getItem('crm_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };
};

export const getClients = async () => {
    const response = await fetch(`${API_URL}/clients`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener clientes');
    }

    return response.json();
};

export const getClientById = async (id) => {
    const response = await fetch(`${API_URL}/clients/${id}`, {
        headers: getAuthHeaders()
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al obtener cliente');
    }

    return response.json();
};
