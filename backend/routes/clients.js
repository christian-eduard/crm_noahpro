const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clientsController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, clientsController.getClients);
router.get('/:id', protect, clientsController.getClientById);
router.post('/', protect, clientsController.createClient);
router.post('/convert-lead', protect, clientsController.convertLead);
router.put('/:id', protect, clientsController.updateClient);
router.delete('/:id', protect, clientsController.deleteClient);

module.exports = router;
