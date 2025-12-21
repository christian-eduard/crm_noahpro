/**
 * Brain Routes - Gestión de Prompts del Sistema
 * Para Tarea 2: Cerebro Abierto (Configurabilidad Total)
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { protect: authenticateToken } = require('../middleware/authMiddleware');

// Middleware de autenticación
router.use(authenticateToken);

/**
 * GET /api/brain/prompts
 * Listar todos los prompts del sistema
 */
router.get('/prompts', async (req, res) => {
    try {
        const { category } = req.query;
        let query = 'SELECT * FROM system_prompts';
        const params = [];

        if (category) {
            query += ' WHERE category = $1';
            params.push(category);
        }

        query += ' ORDER BY is_active DESC, updated_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        console.error('Error listing prompts:', error);
        // Si la tabla no existe, devolver array vacío en lugar de error
        if (error.message?.includes('does not exist') || error.message?.includes('no existe')) {
            return res.json([]);
        }
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/brain/prompts/active
 * Obtener el prompt activo para una categoría
 */
router.get('/prompts/active', async (req, res) => {
    try {
        const { category = 'hunter' } = req.query;
        const result = await db.query(
            'SELECT * FROM system_prompts WHERE is_active = TRUE AND category = $1 LIMIT 1',
            [category]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'No hay prompt activo para esta categoría' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting active prompt:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/brain/prompts
 * Crear nuevo prompt
 */
router.post('/prompts', async (req, res) => {
    try {
        const { name, prompt_text, category = 'hunter', description, is_active = false } = req.body;
        const userId = req.user.userId;

        if (!name || !prompt_text) {
            return res.status(400).json({ error: 'Nombre y texto del prompt son requeridos' });
        }

        // Si se activa este prompt, desactivar los demás de la misma categoría
        if (is_active) {
            await db.query(
                'UPDATE system_prompts SET is_active = FALSE WHERE category = $1',
                [category]
            );
        }

        const result = await db.query(
            `INSERT INTO system_prompts (name, prompt_text, category, description, is_active, created_by)
             VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
            [name, prompt_text, category, description, is_active, userId]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error creating prompt:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/brain/prompts/:id
 * Actualizar prompt existente
 */
router.put('/prompts/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, prompt_text, description, is_active } = req.body;
        const userId = req.user.userId;

        // Guardar versión anterior en historial
        const currentPrompt = await db.query(
            'SELECT * FROM system_prompts WHERE id = $1',
            [id]
        );

        if (currentPrompt.rows.length === 0) {
            return res.status(404).json({ error: 'Prompt no encontrado' });
        }

        const oldPrompt = currentPrompt.rows[0];

        // Guardar en historial si el texto cambió
        if (prompt_text && prompt_text !== oldPrompt.prompt_text) {
            await db.query(
                `INSERT INTO system_prompt_history (prompt_id, prompt_text, version, changed_by)
                 VALUES ($1, $2, $3, $4)`,
                [id, oldPrompt.prompt_text, oldPrompt.version, userId]
            );
        }

        // Si se activa este prompt, desactivar los demás de la misma categoría
        if (is_active) {
            await db.query(
                'UPDATE system_prompts SET is_active = FALSE WHERE category = $1 AND id != $2',
                [oldPrompt.category, id]
            );
        }

        const result = await db.query(
            `UPDATE system_prompts SET
                name = COALESCE($1, name),
                prompt_text = COALESCE($2, prompt_text),
                description = COALESCE($3, description),
                is_active = COALESCE($4, is_active),
                version = version + 1,
                updated_at = NOW()
             WHERE id = $5 RETURNING *`,
            [name, prompt_text, description, is_active, id]
        );

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating prompt:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/brain/prompts/:id/activate
 * Activar un prompt (desactiva los demás de la categoría)
 */
router.put('/prompts/:id/activate', async (req, res) => {
    try {
        const { id } = req.params;

        // Obtener categoría del prompt
        const prompt = await db.query('SELECT category FROM system_prompts WHERE id = $1', [id]);
        if (prompt.rows.length === 0) {
            return res.status(404).json({ error: 'Prompt no encontrado' });
        }

        const category = prompt.rows[0].category;

        // Desactivar todos de la categoría
        await db.query('UPDATE system_prompts SET is_active = FALSE WHERE category = $1', [category]);

        // Activar el seleccionado
        const result = await db.query(
            'UPDATE system_prompts SET is_active = TRUE, updated_at = NOW() WHERE id = $1 RETURNING *',
            [id]
        );

        res.json({ success: true, prompt: result.rows[0] });
    } catch (error) {
        console.error('Error activating prompt:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/brain/prompts/:id
 * Eliminar prompt (excepto el activo)
 */
router.delete('/prompts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // No permitir eliminar prompt activo
        const prompt = await db.query('SELECT is_active FROM system_prompts WHERE id = $1', [id]);
        if (prompt.rows.length === 0) {
            return res.status(404).json({ error: 'Prompt no encontrado' });
        }
        if (prompt.rows[0].is_active) {
            return res.status(400).json({ error: 'No se puede eliminar un prompt activo' });
        }

        await db.query('DELETE FROM system_prompt_history WHERE prompt_id = $1', [id]);
        await db.query('DELETE FROM system_prompts WHERE id = $1', [id]);

        res.json({ success: true, message: 'Prompt eliminado' });
    } catch (error) {
        console.error('Error deleting prompt:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/brain/prompts/:id/history
 * Ver historial de versiones de un prompt
 */
router.get('/prompts/:id/history', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            'SELECT * FROM system_prompt_history WHERE prompt_id = $1 ORDER BY version DESC',
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting prompt history:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
