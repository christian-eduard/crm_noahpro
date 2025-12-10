const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @swagger
 * /api/leads/bulk/update-status:
 *   post:
 *     summary: Actualizar estado de múltiples leads
 *     tags: [Bulk Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leads actualizados exitosamente
 */
router.post('/update-status', async (req, res) => {
    try {
        const { leadIds, status } = req.body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'leadIds debe ser un array no vacío' });
        }

        if (!status) {
            return res.status(400).json({ error: 'status es requerido' });
        }

        const placeholders = leadIds.map((_, i) => `$${i + 1}`).join(',');
        const query = `UPDATE leads SET status = $${leadIds.length + 1} WHERE id IN (${placeholders}) RETURNING *`;

        const result = await db.query(query, [...leadIds, status]);

        // Registrar actividades
        for (const id of leadIds) {
            await db.query(
                `INSERT INTO activities (lead_id, type, description, metadata)
                 VALUES ($1, $2, $3, $4)`,
                [id, 'status_change', `Estado cambiado a ${status} (acción masiva)`, JSON.stringify({ newStatus: status, bulk: true })]
            );
        }

        res.json({
            message: `${result.rowCount} leads actualizados`,
            leads: result.rows
        });
    } catch (error) {
        console.error('Error bulk updating status:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/**
 * @swagger
 * /api/leads/bulk/assign:
 *   post:
 *     summary: Asignar múltiples leads a un usuario
 *     tags: [Bulk Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               userId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Leads asignados exitosamente
 */
router.post('/assign', async (req, res) => {
    try {
        const { leadIds, userId } = req.body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'leadIds debe ser un array no vacío' });
        }

        const placeholders = leadIds.map((_, i) => `$${i + 1}`).join(',');
        const query = `UPDATE leads SET assigned_to = $${leadIds.length + 1} WHERE id IN (${placeholders}) RETURNING *`;

        const result = await db.query(query, [...leadIds, userId]);

        // Registrar actividades
        for (const id of leadIds) {
            await db.query(
                `INSERT INTO activities (lead_id, user_id, type, description, metadata)
                 VALUES ($1, $2, $3, $4, $5)`,
                [id, userId, 'assigned', `Lead asignado al usuario (acción masiva)`, JSON.stringify({ userId, bulk: true })]
            );
        }

        res.json({
            message: `${result.rowCount} leads asignados`,
            leads: result.rows
        });
    } catch (error) {
        console.error('Error bulk assigning leads:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/**
 * @swagger
 * /api/leads/bulk/add-tag:
 *   post:
 *     summary: Agregar tag a múltiples leads
 *     tags: [Bulk Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *               tagId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Tag agregado a los leads
 */
router.post('/add-tag', async (req, res) => {
    try {
        const { leadIds, tagId } = req.body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'leadIds debe ser un array no vacío' });
        }

        // Insertar tags para todos los leads
        const values = leadIds.map(leadId => `(${leadId}, ${tagId})`).join(',');
        await db.query(
            `INSERT INTO lead_tags (lead_id, tag_id) VALUES ${values} ON CONFLICT DO NOTHING`
        );

        // Registrar actividades
        for (const id of leadIds) {
            await db.query(
                `INSERT INTO activities (lead_id, type, description, metadata)
                 VALUES ($1, $2, $3, $4)`,
                [id, 'tag_added', `Tag agregado (acción masiva)`, JSON.stringify({ tagId, bulk: true })]
            );
        }

        res.json({
            message: `Tag agregado a ${leadIds.length} leads`
        });
    } catch (error) {
        console.error('Error bulk adding tag:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/**
 * @swagger
 * /api/leads/bulk/delete:
 *   post:
 *     summary: Eliminar múltiples leads
 *     tags: [Bulk Operations]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               leadIds:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Leads eliminados exitosamente
 */
router.post('/delete', async (req, res) => {
    try {
        const { leadIds } = req.body;

        if (!Array.isArray(leadIds) || leadIds.length === 0) {
            return res.status(400).json({ error: 'leadIds debe ser un array no vacío' });
        }

        const placeholders = leadIds.map((_, i) => `$${i + 1}`).join(',');
        const query = `DELETE FROM leads WHERE id IN (${placeholders})`;

        const result = await db.query(query, leadIds);

        res.json({
            message: `${result.rowCount} leads eliminados`
        });
    } catch (error) {
        console.error('Error bulk deleting leads:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;
