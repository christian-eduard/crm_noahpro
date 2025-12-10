const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * @swagger
 * /api/tags:
 *   get:
 *     summary: Obtener todos los tags
 *     tags: [Tags]
 *     responses:
 *       200:
 *         description: Lista de tags
 */
router.get('/', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM tags ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching tags:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/**
 * @swagger
 * /api/tags:
 *   post:
 *     summary: Crear un nuevo tag
 *     tags: [Tags]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               color:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tag creado exitosamente
 */
router.post('/', async (req, res) => {
    try {
        const { name, color } = req.body;

        const existing = await db.query('SELECT id FROM tags WHERE name = $1', [name]);
        if (existing.rows.length > 0) {
            return res.status(409).json({ error: 'El tag ya existe' });
        }

        const result = await db.query(
            'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING *',
            [name, color || '#3B82F6']
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating tag:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/**
 * @swagger
 * /api/tags/{leadId}:
 *   get:
 *     summary: Obtener tags de un lead específico
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tags del lead
 */
router.get('/lead/:leadId', async (req, res) => {
    try {
        const { leadId } = req.params;
        const result = await db.query(
            `SELECT t.* FROM tags t
             INNER JOIN lead_tags lt ON t.id = lt.tag_id
             WHERE lt.lead_id = $1`,
            [leadId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching lead tags:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/**
 * @swagger
 * /api/tags/lead/{leadId}:
 *   post:
 *     summary: Agregar tag a un lead
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               tagId:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Tag agregado al lead
 */
router.post('/lead/:leadId', async (req, res) => {
    try {
        const { leadId } = req.params;
        const { tagId } = req.body;

        const leadExists = await db.query('SELECT id FROM leads WHERE id = $1', [leadId]);
        if (leadExists.rows.length === 0) {
            return res.status(404).json({ error: 'Lead no encontrado' });
        }

        await db.query(
            'INSERT INTO lead_tags (lead_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [leadId, tagId]
        );

        // Registrar actividad
        await db.query(
            `INSERT INTO activities (lead_id, type, description, metadata)
             VALUES ($1, $2, $3, $4)`,
            [leadId, 'tag_added', 'Tag agregado al lead', JSON.stringify({ tagId })]
        );

        res.json({ message: 'Tag agregado exitosamente' });
    } catch (error) {
        console.error('Error adding tag to lead:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

/**
 * @swagger
 * /api/tags/lead/{leadId}/{tagId}:
 *   delete:
 *     summary: Remover tag de un lead
 *     tags: [Tags]
 *     parameters:
 *       - in: path
 *         name: leadId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: tagId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tag removido del lead
 */
router.delete('/lead/:leadId/:tagId', async (req, res) => {
    try {
        const { leadId, tagId } = req.params;
        await db.query(
            'DELETE FROM lead_tags WHERE lead_id = $1 AND tag_id = $2',
            [leadId, tagId]
        );
        res.json({ message: 'Tag removido exitosamente' });
    } catch (error) {
        console.error('Error removing tag from lead:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;
