const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

router.use(authenticateToken);

// GET /api/hunter-strategies
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM hunter_strategies WHERE is_active = true ORDER BY id ASC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching strategies:', error);
        res.status(500).json({ error: 'Error al obtener estrategias' });
    }
});

// POST /api/hunter-strategies (Admin only)
router.post('/', isAdmin, async (req, res) => {
    try {
        const { name, icon, description, prompt_template } = req.body;

        const result = await db.query(
            `INSERT INTO hunter_strategies (name, icon, description, prompt_template) 
             VALUES ($1, $2, $3, $4) 
             RETURNING *`,
            [name, icon || 'Target', description, prompt_template]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating strategy:', error);
        res.status(500).json({ error: 'Error al crear estrategia' });
    }
});

// PUT /api/hunter-strategies/:id (Admin only)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, description, prompt_template, is_active } = req.body;

        // Prevent modifying system strategies (optional, but good practice)
        // const check = await db.query('SELECT is_system FROM hunter_strategies WHERE id = $1', [id]);
        // if (check.rows[0]?.is_system) return res.status(403).json({ error: 'No se pueden modificar estrategias del sistema' });

        const result = await db.query(
            `UPDATE hunter_strategies 
             SET name = COALESCE($1, name),
                 icon = COALESCE($2, icon),
                 description = COALESCE($3, description),
                 prompt_template = COALESCE($4, prompt_template),
                 is_active = COALESCE($5, is_active),
                 updated_at = NOW()
             WHERE id = $6
             RETURNING *`,
            [name, icon, description, prompt_template, is_active, id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Estrategia no encontrada' });

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating strategy:', error);
        res.status(500).json({ error: 'Error al actualizar estrategia' });
    }
});

// DELETE /api/hunter-strategies/:id (Admin only - Soft Delete)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const { id } = req.params;

        const check = await db.query('SELECT is_system FROM hunter_strategies WHERE id = $1', [id]);
        if (check.rows[0]?.is_system) {
            return res.status(403).json({ error: 'No se pueden eliminar estrategias del sistema' });
        }

        const result = await db.query(
            'UPDATE hunter_strategies SET is_active = false WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Estrategia no encontrada' });

        res.json({ message: 'Estrategia eliminada' });
    } catch (error) {
        console.error('Error deleting strategy:', error);
        res.status(500).json({ error: 'Error al eliminar estrategia' });
    }
});

module.exports = router;
