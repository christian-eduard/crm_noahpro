const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @swagger
 * /api/activities/{leadId}:
 *   get:
 *     summary: Obtener todas las actividades de un lead
 *     tags: [Activities]
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de actividades del lead
 */
router.get('/:leadId', async (req, res) => {
    try {
        const { leadId } = req.params;
        const result = await db.query(
            `SELECT a.*, u.name as user_name
             FROM activities a
             LEFT JOIN users u ON a.user_id = u.id
             WHERE a.lead_id = $1
             ORDER BY a.created_at DESC`,
            [leadId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching activities:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/**
 * @swagger
 * /api/activities:
 *   post:
 *     summary: Registrar una nueva actividad
 *     tags: [Activities]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadId:
 *                 type: integer
 *               type:
 *                 type: string
 *               description:
 *                 type: string
 *               metadata:
 *                 type: object
 *     responses:
 *       201:
 *         description: Actividad registrada exitosamente
 */
router.post('/', async (req, res) => {
    try {
        const { leadId, type, description, metadata, userId } = req.body;
        const result = await db.query(
            `INSERT INTO activities (lead_id, user_id, type, description, metadata)
             VALUES ($1, $2, $3, $4, $5) RETURNING *`,
            [leadId, userId || null, type, description, JSON.stringify(metadata || {})]
        );

        // Actualizar última actividad del lead
        await db.query(
            `UPDATE leads 
             SET last_activity_at = CURRENT_TIMESTAMP, last_activity_type = $1
             WHERE id = $2`,
            [type, leadId]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating activity:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/**
 * @swagger
 * /api/activities/stats:
 *   get:
 *     summary: Obtener estadísticas de actividades
 *     tags: [Activities]
 *     responses:
 *       200:
 *         description: Estadísticas de actividades
 */
router.get('/stats/summary', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                type,
                COUNT(*) as count,
                DATE(created_at) as date
            FROM activities
            WHERE created_at >= NOW() - INTERVAL '30 days'
            GROUP BY type, DATE(created_at)
            ORDER BY date DESC, count DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching activity stats:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;
