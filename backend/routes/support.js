const express = require('express');
const router = express.Router();
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const {
    getAllTickets,
    getMyTickets,
    getTicketById,
    createTicket,
    replyToTicket,
    updateTicketStatus
} = require('../controllers/supportController');

// Rutas comerciales
router.get('/my', authenticateToken, getMyTickets);
router.post('/', authenticateToken, createTicket);
router.get('/:id', authenticateToken, getTicketById);
router.post('/:id/reply', authenticateToken, replyToTicket);

// Rutas admin
router.get('/', authenticateToken, isAdmin, getAllTickets);
router.patch('/:id/status', authenticateToken, isAdmin, updateTicketStatus);

module.exports = router;
