const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

/**
 * GET /api/config/voice
 * Obtener configuración SIP del usuario
 */
router.get('/voice', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM sip_settings WHERE user_id = $1',
            [req.user.id]
        );
        res.json(result.rows[0] || {});
    } catch (error) {
        console.error('Error fetching voice config:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/config/voice
 * Guardar configuración SIP
 */
router.post('/voice', async (req, res) => {
    try {
        const { sip_server, sip_username, sip_password, sip_port } = req.body;

        // Upsert
        const result = await db.query(
            `INSERT INTO sip_settings (user_id, sip_server, sip_username, sip_password_encrypted, sip_port, is_active)
             VALUES ($1, $2, $3, $4, $5, true)
             ON CONFLICT (user_id) 
             DO UPDATE SET 
                sip_server = EXCLUDED.sip_server,
                sip_username = EXCLUDED.sip_username,
                sip_password_encrypted = EXCLUDED.sip_password_encrypted,
                sip_port = EXCLUDED.sip_port,
                updated_at = NOW()
             RETURNING *`,
            [req.user.id, sip_server, sip_username, sip_password, sip_port || 5060] // Password debería encriptarse real, aquí demo
        );

        res.json({ success: true, config: result.rows[0] });
    } catch (error) {
        console.error('Error saving voice config:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
