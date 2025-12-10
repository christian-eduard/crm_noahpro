const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const {
    createCommercial,
    getAllCommercials,
    getCommercialById,
    updateCommercial,
    deleteCommercial,
    getDashboardStats,
    resendWelcomeEmail
} = require('../controllers/commercialController');

// Rutas para admin
router.post('/', authenticateToken, isAdmin, createCommercial);
router.get('/', authenticateToken, isAdmin, getAllCommercials);
router.get('/stats', authenticateToken, getDashboardStats); // Para comercial logueado
router.get('/:id', authenticateToken, isAdmin, getCommercialById);
router.put('/:id', authenticateToken, isAdmin, updateCommercial); // <--- NUEVA RUTA
router.delete('/:id', authenticateToken, isAdmin, deleteCommercial);
router.post('/:id/resend-welcome', authenticateToken, isAdmin, resendWelcomeEmail);

module.exports = router;
