/**
 * Rate Limiter Middleware
 * Protege la API de abusos y ataques DDoS
 */

const rateLimit = require('express-rate-limit');

// Limiter general para todas las rutas
const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 500, // 500 requests por ventana
    message: {
        error: 'Demasiadas solicitudes. Por favor, espera unos minutos.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
        // Skip para health checks y rutas públicas básicas
        return req.path === '/health' || req.path === '/api/health';
    }
});

// Limiter estricto para auth (login, registro)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Solo 10 intentos de login cada 15 min
    message: {
        error: 'Demasiados intentos de login. Cuenta temporalmente bloqueada.',
        retryAfter: '15 minutos'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiter para operaciones de IA (costosas)
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto
    max: 20, // 20 operaciones IA por minuto
    message: {
        error: 'Límite de operaciones IA alcanzado. Espera un momento.',
        retryAfter: '1 minuto'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiter para webhooks externos
const webhookLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minuto  
    max: 100, // 100 webhooks por minuto
    message: {
        error: 'Demasiados webhooks. Limite excedido.',
        retryAfter: '1 minuto'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiter para exportaciones (operaciones pesadas)
const exportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 10, // 10 exportaciones por hora
    message: {
        error: 'Has alcanzado el límite de exportaciones. Intenta más tarde.',
        retryAfter: '1 hora'
    },
    standardHeaders: true,
    legacyHeaders: false
});

// Limiter para uploads
const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hora
    max: 50, // 50 uploads por hora
    message: {
        error: 'Has alcanzado el límite de subidas. Intenta más tarde.',
        retryAfter: '1 hora'
    },
    standardHeaders: true,
    legacyHeaders: false
});

module.exports = {
    generalLimiter,
    authLimiter,
    aiLimiter,
    webhookLimiter,
    exportLimiter,
    uploadLimiter
};
