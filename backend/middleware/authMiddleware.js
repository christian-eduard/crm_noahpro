const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'crm_secret_key');

            // Add user to request
            req.user = decoded;

            return next();
        } catch (error) {
            console.error('Error de autenticación:', error);
            return res.status(401).json({ error: 'No autorizado, token fallido' });
        }
    }

    if (!token) {
        return res.status(401).json({ error: 'No autorizado, no hay token' });
    }
};

// Alias for protect
const authenticateToken = protect;

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        return next();
    }
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
};

// Check if user is commercial
const isCommercial = (req, res, next) => {
    if (req.user && (req.user.role === 'commercial' || req.user.role === 'admin')) {
        return next();
    }
    return res.status(403).json({ error: 'Acceso denegado.' });
};

module.exports = { protect, authenticateToken, isAdmin, isCommercial };
