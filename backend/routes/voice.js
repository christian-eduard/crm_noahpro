const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { protect } = require('../middleware/authMiddleware');
const crypto = require('crypto');

// Todas las rutas requieren autenticación
router.use(protect);

/**
 * GET /api/voice/sip-settings
 * Obtener configuración SIP del usuario actual
 */
router.get('/sip-settings', async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await db.query(
            `SELECT id, sip_server, sip_username, sip_port, stun_server, turn_server, 
                    is_active, last_connection, created_at, updated_at
             FROM sip_settings WHERE user_id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            return res.json({ configured: false });
        }

        res.json({
            configured: true,
            settings: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching SIP settings:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/voice/sip-settings
 * Configurar credenciales SIP del usuario
 */
router.put('/sip-settings', async (req, res) => {
    try {
        const userId = req.user.id;
        const { sip_server, sip_username, sip_password, sip_port, stun_server, turn_server } = req.body;

        if (!sip_server || !sip_username || !sip_password) {
            return res.status(400).json({ error: 'Servidor, usuario y contraseña SIP son requeridos' });
        }

        // Cifrar la contraseña SIP (simple para esta versión, usar crypto más robusto en producción)
        const algorithm = 'aes-256-cbc';
        const key = crypto.createHash('sha256').update(process.env.JWT_SECRET || 'default_key').digest();
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, key, iv);
        let encrypted = cipher.update(sip_password, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        const encryptedPassword = iv.toString('hex') + ':' + encrypted;

        // Upsert configuración
        const result = await db.query(
            `INSERT INTO sip_settings 
                (user_id, sip_server, sip_username, sip_password_encrypted, sip_port, stun_server, turn_server, is_active, updated_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, false, NOW())
             ON CONFLICT (user_id) 
             DO UPDATE SET 
                sip_server = $2,
                sip_username = $3,
                sip_password_encrypted = $4,
                sip_port = $5,
                stun_server = $6,
                turn_server = $7,
                updated_at = NOW()
             RETURNING id, sip_server, sip_username, sip_port, stun_server, turn_server, is_active`,
            [userId, sip_server, sip_username, encryptedPassword, sip_port || 5060, stun_server, turn_server]
        );

        res.json({
            success: true,
            message: 'Configuración SIP guardada correctamente',
            settings: result.rows[0]
        });
    } catch (error) {
        console.error('Error saving SIP settings:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/voice/call-logs
 * Obtener historial de llamadas del usuario
 */
router.get('/call-logs', async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 50, offset = 0 } = req.query;

        const result = await db.query(
            `SELECT cl.*, 
                    mp.name as prospect_name,
                    l.name as lead_name
             FROM call_logs cl
             LEFT JOIN maps_prospects mp ON cl.prospect_id = mp.id
             LEFT JOIN leads l ON cl.lead_id = l.id
             WHERE cl.user_id = $1
             ORDER BY cl.started_at DESC
             LIMIT $2 OFFSET $3`,
            [userId, limit, offset]
        );

        res.json({ calls: result.rows });
    } catch (error) {
        console.error('Error fetching call logs:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/voice/call-logs
 * Registrar una nueva llamada
 */
router.post('/call-logs', async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            prospect_id, lead_id, call_type, duration,
            recording_url, transcription, ai_summary,
            sentiment_analysis, call_quality_score
        } = req.body;

        const result = await db.query(
            `INSERT INTO call_logs 
                (user_id, prospect_id, lead_id, call_type, duration, recording_url, 
                 transcription, ai_summary, sentiment_analysis, call_quality_score, ended_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
             RETURNING *`,
            [
                userId, prospect_id, lead_id, call_type, duration, recording_url,
                transcription, ai_summary ? JSON.stringify(ai_summary) : null,
                sentiment_analysis ? JSON.stringify(sentiment_analysis) : null,
                call_quality_score
            ]
        );

        res.json({
            success: true,
            message: 'Llamada registrada correctamente',
            call: result.rows[0]
        });
    } catch (error) {
        console.error('Error logging call:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/voice/dojo/scenarios
 * Obtener escenarios de entrenamiento disponibles
 */
router.get('/dojo/scenarios', async (req, res) => {
    try {
        // Verificar que el usuario tiene permiso para acceder al Dojo
        if (!req.user.can_access_dojo) {
            return res.status(403).json({ error: 'No tienes acceso al Dojo. Contacta con tu administrador.' });
        }

        const result = await db.query(
            `SELECT id, name, description, difficulty, duration_estimate, created_at
             FROM dojo_scenarios
             WHERE is_active = true
             ORDER BY difficulty, name`
        );

        res.json({ scenarios: result.rows });
    } catch (error) {
        console.error('Error fetching dojo scenarios:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/voice/dojo/sessions
 * Obtener historial de sesiones del Dojo
 */
router.get('/dojo/sessions', async (req, res) => {
    try {
        if (!req.user.can_access_dojo) {
            return res.status(403).json({ error: 'No tienes acceso al Dojo' });
        }

        const userId = req.user.id;
        const result = await db.query(
            `SELECT ds.*, sc.name as scenario_name, sc.difficulty
             FROM dojo_sessions ds
             JOIN dojo_scenarios sc ON ds.scenario_id = sc.id
             WHERE ds.user_id = $1
             ORDER BY ds.created_at DESC
             LIMIT 20`,
            [userId]
        );

        res.json({ sessions: result.rows });
    } catch (error) {
        console.error('Error fetching dojo sessions:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/voice/dojo/sessions
 * Crear una nueva sesión de entrenamiento
 */
router.post('/dojo/sessions', async (req, res) => {
    try {
        if (!req.user.can_access_dojo) {
            return res.status(403).json({ error: 'No tienes acceso al Dojo' });
        }

        const userId = req.user.id;
        const { scenario_id, duration, transcription, ai_feedback, score, strengths, weaknesses } = req.body;

        const result = await db.query(
            `INSERT INTO dojo_sessions 
                (user_id, scenario_id, duration, transcription, ai_feedback, score, 
                 strengths, weaknesses, completed_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
             RETURNING *`,
            [
                userId, scenario_id, duration, transcription,
                ai_feedback ? JSON.stringify(ai_feedback) : null,
                score, strengths, weaknesses
            ]
        );

        res.json({
            success: true,
            message: 'Sesión del Dojo completada',
            session: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating dojo session:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
