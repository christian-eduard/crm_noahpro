const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const leadsController = require('../controllers/leadsController');
const validate = require('../middleware/validate');
const { createLeadSchema } = require('../schemas/leadSchema');

/**
 * @swagger
 * /api/leads:
 *   get:
 *     summary: Obtener todos los leads
 *     tags: [Leads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [new, contacted, qualified, proposal_sent, won, lost]
 *         description: Filtrar por estado
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre, email o empresa
 *     responses:
 *       200:
 *         description: Lista de leads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Lead'
 *       500:
 *         description: Error del servidor
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticateToken, leadsController.getLeads);

/**
 * @swagger
 * /api/leads:
 *   post:
 *     summary: Crear un nuevo lead
 *     tags: [Leads]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 example: Juan Pérez
 *               email:
 *                 type: string
 *                 format: email
 *                 example: juan@ejemplo.com
 *               phone:
 *                 type: string
 *                 example: +34 600 123 456
 *               businessName:
 *                 type: string
 *                 example: Restaurante El Buen Sabor
 *               message:
 *                 type: string
 *                 example: Me interesa el sistema TPV
 *               source:
 *                 type: string
 *                 example: landing_form
 *     responses:
 *       201:
 *         description: Lead creado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       400:
 *         description: Datos inválidos
 *       500:
 *         description: Error del servidor
 */
router.post('/', validate(createLeadSchema), leadsController.createLead);

/**
 * @swagger
 * /api/leads/stats:
 *   get:
 *     summary: Obtener estadísticas de leads
 *     tags: [Leads]
 *     responses:
 *       200:
 *         description: Estadísticas de leads
 *       500:
 *         description: Error del servidor
 */
router.get('/stats', leadsController.getLeadStats);

/**
 * @swagger
 * /api/leads/{id}:
 *   get:
 *     summary: Obtener un lead por ID
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del lead
 *     responses:
 *       200:
 *         description: Datos del lead
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Lead'
 *       404:
 *         description: Lead no encontrado
 *       500:
 *         description: Error del servidor
 */
router.get('/:id', leadsController.getLeadById);

/**
 * @swagger
 * /api/leads/{id}:
 *   put:
 *     summary: Actualizar un lead
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               businessName:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [new, contacted, qualified, proposal_sent, won, lost]
 *     responses:
 *       200:
 *         description: Lead actualizado
 *       404:
 *         description: Lead no encontrado
 *       500:
 *         description: Error del servidor
 */
router.put('/:id', leadsController.updateLead);

/**
 * @swagger
 * /api/leads/{id}:
 *   delete:
 *     summary: Eliminar un lead
 *     tags: [Leads]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lead eliminado
 *       404:
 *         description: Lead no encontrado
 *       500:
 *         description: Error del servidor
 */
router.delete('/:id', leadsController.deleteLead);

module.exports = router;
