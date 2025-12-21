/**
 * Calls Routes - Infraestructura de Llamadas (Futuro)
 * Para Tarea 5: Preparación para módulo de voz
 * 
 * Endpoints preparados para integración futura:
 * - Upload de grabaciones de audio
 * - Transcripción de llamadas
 * - Análisis de sentimiento
 * - Tips de venta en tiempo real
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { protect: authenticateToken } = require('../middleware/authMiddleware');

// Middleware de autenticación
router.use(authenticateToken);

/**
 * POST /api/calls/upload
 * Endpoint skeleton para recibir grabaciones de audio (futuro)
 */
router.post('/upload', async (req, res) => {
    // Endpoint preparado para integración futura
    res.status(501).json({
        message: 'Endpoint preparado para integración futura de llamadas',
        status: 'not_implemented',
        documentation: 'Este endpoint aceptará archivos de audio .wav/.mp3 para transcripción y análisis',
        expected_body: {
            prospect_id: 'ID del prospecto relacionado',
            audio_file: 'Archivo de audio (multipart)',
            call_direction: 'inbound|outbound',
            call_duration_seconds: 'Duración en segundos'
        }
    });
});

/**
 * GET /api/calls/prospect/:id
 * Historial de llamadas de un prospecto
 */
router.get('/prospect/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query(
            `SELECT * FROM call_logs WHERE prospect_id = $1 ORDER BY created_at DESC`,
            [id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching call logs:', error);
        res.json([]); // Return empty array if table doesn't exist yet
    }
});

/**
 * GET /api/calls/tips/:situation
 * Obtener tips de venta para una situación
 */
router.get('/tips/:situation', async (req, res) => {
    try {
        const { situation } = req.params;
        const result = await db.query(
            `SELECT * FROM call_tips_templates WHERE situation = $1 AND is_active = TRUE`,
            [situation]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching tips:', error);
        res.json([]);
    }
});

/**
 * GET /api/calls/tips
 * Obtener todos los tips activos
 */
router.get('/tips', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM call_tips_templates WHERE is_active = TRUE ORDER BY category`
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching all tips:', error);
        res.json([]);
    }
});

module.exports = router;
