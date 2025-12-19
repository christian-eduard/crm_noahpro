/**
 * Automation Routes
 * API endpoints for managing automation rules and viewing logs
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const automationEngine = require('../services/automationEngine');

// Get all automation rules
router.get('/rules', protect, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM automation_rules ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting automation rules:', error);
        res.status(500).json({ error: 'Error al obtener reglas' });
    }
});

// Get single rule
router.get('/rules/:id', protect, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM automation_rules WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Regla no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting rule:', error);
        res.status(500).json({ error: 'Error al obtener regla' });
    }
});

// Create new rule
router.post('/rules', protect, async (req, res) => {
    try {
        const { name, description, trigger_type, trigger_config, action_type, action_config, is_active } = req.body;

        const result = await db.query(
            `INSERT INTO automation_rules (name, description, trigger_type, trigger_config, action_type, action_config, is_active, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [name, description, trigger_type, JSON.stringify(trigger_config), action_type, JSON.stringify(action_config), is_active !== false, req.user.userId]
        );

        // Reload rules in engine
        await automationEngine.loadRules();

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating rule:', error);
        res.status(500).json({ error: 'Error al crear regla' });
    }
});

// Update rule
router.put('/rules/:id', protect, async (req, res) => {
    try {
        const { name, description, trigger_type, trigger_config, action_type, action_config, is_active } = req.body;

        const result = await db.query(
            `UPDATE automation_rules 
             SET name = $1, description = $2, trigger_type = $3, trigger_config = $4, 
                 action_type = $5, action_config = $6, is_active = $7, updated_at = NOW()
             WHERE id = $8
             RETURNING *`,
            [name, description, trigger_type, JSON.stringify(trigger_config), action_type, JSON.stringify(action_config), is_active, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Regla no encontrada' });
        }

        // Reload rules in engine
        await automationEngine.loadRules();

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating rule:', error);
        res.status(500).json({ error: 'Error al actualizar regla' });
    }
});

// Toggle rule active status
router.patch('/rules/:id/toggle', protect, async (req, res) => {
    try {
        const result = await db.query(
            `UPDATE automation_rules 
             SET is_active = NOT is_active, updated_at = NOW()
             WHERE id = $1
             RETURNING *`,
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Regla no encontrada' });
        }

        // Reload rules in engine
        await automationEngine.loadRules();

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error toggling rule:', error);
        res.status(500).json({ error: 'Error al cambiar estado' });
    }
});

// Delete rule
router.delete('/rules/:id', protect, async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM automation_rules WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Regla no encontrada' });
        }

        // Reload rules in engine
        await automationEngine.loadRules();

        res.json({ message: 'Regla eliminada', id: result.rows[0].id });
    } catch (error) {
        console.error('Error deleting rule:', error);
        res.status(500).json({ error: 'Error al eliminar regla' });
    }
});

// Get automation logs
router.get('/logs', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const logs = await automationEngine.getLogs(limit);
        res.json(logs);
    } catch (error) {
        console.error('Error getting logs:', error);
        res.status(500).json({ error: 'Error al obtener logs' });
    }
});

// Get automation stats
router.get('/stats', protect, async (req, res) => {
    try {
        const stats = await automationEngine.getStats();
        res.json(stats);
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

// Manually trigger rule for testing
router.post('/test/:ruleId', protect, async (req, res) => {
    try {
        const { leadId } = req.body;

        const ruleResult = await db.query('SELECT * FROM automation_rules WHERE id = $1', [req.params.ruleId]);
        if (ruleResult.rows.length === 0) {
            return res.status(404).json({ error: 'Regla no encontrada' });
        }

        const rule = ruleResult.rows[0];
        const context = { leadId, triggerType: 'manual_test' };

        await automationEngine.executeAction(rule, context);
        await automationEngine.logExecution(rule.id, rule.name, 'manual_test', rule.action_type, leadId, 'success');

        res.json({ message: 'Regla ejecutada correctamente', rule: rule.name });
    } catch (error) {
        console.error('Error testing rule:', error);
        res.status(500).json({ error: 'Error al probar regla' });
    }
});

module.exports = router;
