// Configuración centralizada de la API
// Este archivo define la URL base de la API que se usa en toda la aplicación.
// En desarrollo usa localhost, en producción usa la variable de entorno VITE_API_URL.

export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3002/api';
export const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3002';

// Socket.io URL (sin /api)
export const SOCKET_URL = API_BASE;

export default {
    API_URL,
    API_BASE,
    SOCKET_URL
};
