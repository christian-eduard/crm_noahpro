/**
 * Webhooks Routes
 * API endpoints for managing webhooks
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { protect, requireAdmin } = require('../middleware/authMiddleware');
const webhookService = require('../services/webhookService');

// Get all webhooks
router.get('/', protect, async (req, res) => {
    try {
        const result = await db.query(
            'SELECT id, name, url, events, is_active, created_at FROM webhooks ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting webhooks:', error);
        res.status(500).json({ error: 'Error al obtener webhooks' });
    }
});

// Create webhook
router.post('/', protect, async (req, res) => {
    try {
        const { name, url, events, secret, headers, is_active } = req.body;

        const result = await db.query(
            `INSERT INTO webhooks (name, url, events, secret, headers, is_active, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, name, url, events, is_active, created_at`,
            [name, url, events, secret, JSON.stringify(headers), is_active !== false, req.user.userId]
        );

        // Reload webhooks
        await webhookService.loadWebhooks();

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating webhook:', error);
        res.status(500).json({ error: 'Error al crear webhook' });
    }
});

// Update webhook
router.put('/:id', protect, async (req, res) => {
    try {
        const { name, url, events, secret, headers, is_active } = req.body;

        const result = await db.query(
            `UPDATE webhooks 
             SET name = $1, url = $2, events = $3, secret = $4, headers = $5, is_active = $6, updated_at = NOW()
             WHERE id = $7
             RETURNING id, name, url, events, is_active`,
            [name, url, events, secret, JSON.stringify(headers), is_active, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Webhook no encontrado' });
        }

        await webhookService.loadWebhooks();
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating webhook:', error);
        res.status(500).json({ error: 'Error al actualizar webhook' });
    }
});

// Delete webhook
router.delete('/:id', protect, async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM webhooks WHERE id = $1 RETURNING id',
            [req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Webhook no encontrado' });
        }

        await webhookService.loadWebhooks();
        res.json({ message: 'Webhook eliminado', id: result.rows[0].id });
    } catch (error) {
        console.error('Error deleting webhook:', error);
        res.status(500).json({ error: 'Error al eliminar webhook' });
    }
});

// Test webhook
router.post('/:id/test', protect, async (req, res) => {
    try {
        const result = await webhookService.testWebhook(req.params.id);
        res.json({ message: 'Webhook probado', result });
    } catch (error) {
        console.error('Error testing webhook:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get webhook logs
router.get('/:id/logs', protect, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 50;
        const logs = await webhookService.getLogs(req.params.id, limit);
        res.json(logs);
    } catch (error) {
        console.error('Error getting webhook logs:', error);
        res.status(500).json({ error: 'Error al obtener logs' });
    }
});

module.exports = router;
