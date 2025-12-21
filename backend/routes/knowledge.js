const express = require('express');
const router = express.Router();
const knowledgeService = require('../services/knowledgeService');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');

// Public/Authenticated - Get personality (if needed for UI)
router.get('/settings', authenticateToken, async (req, res) => {
    try {
        const settings = await knowledgeService.getBrainSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin Only - Update personality
router.put('/settings', authenticateToken, isAdmin, async (req, res) => {
    try {
        const settings = await knowledgeService.updateBrainSettings(req.body);
        res.json(settings);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin Only - CRUD Knowledge Units
router.get('/units', authenticateToken, isAdmin, async (req, res) => {
    try {
        const units = await knowledgeService.getKnowledgeUnits(req.query.tags);
        res.json(units);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.post('/units', authenticateToken, isAdmin, async (req, res) => {
    try {
        const unit = await knowledgeService.createKnowledgeUnit(req.body);
        res.json(unit);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/units/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        const unit = await knowledgeService.updateKnowledgeUnit(req.params.id, req.body);
        res.json(unit);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/units/:id', authenticateToken, isAdmin, async (req, res) => {
    try {
        await knowledgeService.deleteKnowledgeUnit(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
