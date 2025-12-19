/**
 * Lead Hunter Routes
 * Rutas API para el módulo de prospección inteligente
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/authMiddleware');
const leadHunterService = require('../services/leadHunterService');
const googlePlacesService = require('../services/googlePlacesService');
const geminiService = require('../services/geminiService');
const db = require('../config/database');

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * Middleware simplificado: JWT ya contiene userId de tabla users unificada
 * Solo establece realUserId para compatibilidad hacia atrás
 */
const setUserId = (req, res, next) => {
    req.realUserId = req.user.userId || req.user.id;
    next();
};

// Aplicar middleware a todas las rutas Hunter
router.use(setUserId);

// =====================================================
// RUTAS PARA COMERCIALES
// =====================================================

/**
 * GET /api/hunter/access
 * Verificar acceso y límites del usuario
 */
router.get('/access', async (req, res) => {
    try {
        const userId = req.realUserId;
        const access = await leadHunterService.checkUserAccess(userId);
        res.json(access);
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
});

/**
 * POST /api/hunter/search
 * Buscar prospectos en una zona
 */
router.post('/search', async (req, res) => {
    try {
        const userId = req.realUserId;
        const { query, location, radius, strategy } = req.body;

        if (!query || !location) {
            return res.status(400).json({ error: 'Se requiere query y location' });
        }

        // Fetch strategy logic from DB instead of hardcoded
        const strategyData = await db.query('SELECT prompt_template FROM hunter_strategies WHERE id = $1', [strategy]);
        let promptTemplate = null;
        if (strategyData.rows.length > 0) {
            promptTemplate = strategyData.rows[0].prompt_template;
        }

        const results = await leadHunterService.searchProspects(query, location, userId, radius, strategy, promptTemplate, false);
        res.json(results);
    } catch (error) {
        console.error('Error en búsqueda:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/hunter/estimate
 * Estimar cantidad de resultados (búsqueda rápida de 1 página)
 */
router.post('/estimate', async (req, res) => {
    try {
        const userId = req.realUserId;
        const { query, location, radius } = req.body;

        if (!query || !location) {
            return res.status(400).json({ error: 'Se requiere query y location' });
        }

        // Use limitOnePage=true to minimize cost and latency
        // We use the service directly OR via leadHunterService if we want to add any other logic
        // But for estimation, directly calling googlePlacesService is strictly for "how many results"
        // However, leadHunterService.searchProspects calls googlePlacesService.searchAndSave.
        // We don't want to SAVE, we just want to COUNT.
        const places = await googlePlacesService.searchPlaces(query, location, radius, true);

        // Google Places returns up to 20 results per page.
        // If we get 20, it's likely "20+"
        const count = places.length;
        const displayCount = count >= 20 ? "20+" : count.toString();

        res.json({ count, displayCount, results: places.map(p => p.name).slice(0, 3) });
    } catch (error) {
        console.error('Error en estimación:', error);
        // Don't fail the UI hard, just return 0
        res.json({ count: 0, displayCount: "0" });
    }
});

/**
 * GET /api/hunter/prospects
 * Listar prospectos del usuario
 */
router.get('/prospects', async (req, res) => {
    try {
        const userId = req.realUserId;
        const { processed, priority, city, limit } = req.query;

        const filters = {};
        if (processed !== undefined) filters.processed = processed === 'true';
        if (priority) filters.priority = priority;
        if (city) filters.city = city;
        if (limit) filters.limit = parseInt(limit);

        const prospects = await leadHunterService.getUserProspects(userId, filters);
        res.json(prospects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/hunter/prospects/:id/assign
 * Asignar un prospecto a un comercial (Solo Admin)
 */
router.post('/prospects/:id/assign', authenticateToken, async (req, res) => {
    try {
        const userId = req.realUserId;
        const { assignedTo } = req.body;

        // Verificar permisos (idealmente middleware requireAdmin, pero lo hacemos aquí por flexibilidad)
        // O permitir si es el dueño? El req dice "busquedas de administrador... quiero traspasar"
        // Asumimos que el creador puede reasignar.

        const result = await leadHunterService.assignProspect(req.params.id, assignedTo, userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/hunter/prospects/:id/deep-analyze
 * Realizar búsqueda profunda de un prospecto
 */
router.post('/prospects/:id/deep-analyze', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const analysis = await leadHunterService.deepAnalyzeProspect(id, req.realUserId || req.user.id);
        res.json(analysis);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/hunter/prospects/:id
 * Obtener detalle de un prospecto
 */
router.get('/prospects/:id', async (req, res) => {
    try {
        const userId = req.realUserId;
        const result = await db.query(
            'SELECT * FROM maps_prospects WHERE id = $1 AND searched_by = $2',
            [req.params.id, userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prospecto no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/hunter/analyze/:id
 * Analizar un prospecto con IA
 */
router.post('/analyze/:id', async (req, res) => {
    try {
        const userId = req.realUserId;
        const result = await leadHunterService.analyzeProspect(req.params.id, userId);
        res.json(result);
    } catch (error) {
        console.error('Error en análisis:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/hunter/prospects/:id/demos
 * Obtener historial de demos para un prospecto
 */
router.get('/prospects/:id/demos', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM hunter_demo_history WHERE prospect_id = $1 ORDER BY created_at DESC',
            [req.params.id]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching demo history:', error);
        res.status(500).json({ error: 'Error al obtener historial de demos' });
    }
});

/**
 * DELETE /api/hunter/demos/:demoId
 * Eliminar una demo del historial
 */
router.delete('/demos/:demoId', async (req, res) => {
    try {
        const result = await db.query(
            'DELETE FROM hunter_demo_history WHERE id = $1 RETURNING id',
            [req.params.demoId]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Demo no encontrada' });
        }
        res.json({ success: true, message: 'Demo eliminada' });
    } catch (error) {
        console.error('Error deleting demo:', error);
        res.status(500).json({ error: 'Error al eliminar demo' });
    }
});

/**
 * POST /api/hunter/prospects/:id/refresh
 * Actualizar datos de Google Places (fotos/reseñas)
 */

/**
 * PATCH /api/hunter/prospects/:id/priority
 * Actualizar prioridad del prospecto
 */
router.patch('/prospects/:id/priority', async (req, res) => {
    try {
        const { priority } = req.body;
        const validPriorities = ['low', 'medium', 'high', 'urgent'];

        if (!validPriorities.includes(priority)) {
            return res.status(400).json({ error: 'Prioridad inválida' });
        }

        const result = await db.query(
            'UPDATE maps_prospects SET ai_priority = $1 WHERE id = $2 RETURNING id, ai_priority',
            [priority, req.params.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Prospecto no encontrado' });
        }

        res.json({ success: true, priority: result.rows[0].ai_priority });
    } catch (error) {
        console.error('Error updating priority:', error);
        res.status(500).json({ error: 'Error al actualizar prioridad' });
    }
});

router.post('/prospects/:id/refresh', async (req, res) => {
    try {
        const prospectId = req.params.id;

        // Get prospect to get place_id
        const prospectResult = await db.query(
            'SELECT * FROM maps_prospects WHERE id = $1',
            [prospectId]
        );

        if (prospectResult.rows.length === 0) {
            return res.status(404).json({ error: 'Prospecto no encontrado' });
        }

        const prospect = prospectResult.rows[0];

        if (!prospect.place_id) {
            return res.status(400).json({ error: 'El prospecto no tiene place_id de Google' });
        }

        // Fetch updated data from Google Places
        const placeDetails = await googlePlacesService.getPlaceDetails(prospect.place_id);

        if (!placeDetails) {
            return res.status(500).json({ error: 'No se pudo obtener datos de Google Places' });
        }

        // Update prospect with new data (only existing columns)
        const updateResult = await db.query(`
            UPDATE maps_prospects SET
                photos = $1,
                rating = COALESCE($2, rating),
                reviews_count = COALESCE($3, reviews_count),
                reviews = $4,
                updated_at = NOW()
            WHERE id = $5
            RETURNING *
        `, [
            JSON.stringify(placeDetails.photos || []),
            placeDetails.rating,
            placeDetails.user_ratings_total,
            JSON.stringify(placeDetails.reviews || []),
            prospectId
        ]);

        // Return with reviews attached (from Place Details API)
        const updatedProspect = updateResult.rows[0];
        updatedProspect.reviews = placeDetails.reviews || [];

        res.json(updatedProspect);
    } catch (error) {
        console.error('Error refreshing prospect data:', error);
        res.status(500).json({ error: 'Error al actualizar datos' });
    }
});

/**
 * PUT /api/hunter/prospects/:id/notes
 * Guardar notas internas
 */
router.put('/prospects/:id/notes', async (req, res) => {
    try {
        const userId = req.realUserId;
        const { notes } = req.body;
        const result = await leadHunterService.saveInternalNotes(req.params.id, notes, userId);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/hunter/prospects/:id/notes/improve
 * Mejorar notas con IA
 */
router.post('/prospects/:id/notes/improve', async (req, res) => {
    try {
        const { notes } = req.body;
        const improved = await leadHunterService.improveInternalNotes(req.params.id, notes);
        res.json({ improved });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/hunter/prospects/:id/demo
 * Generar Demo Web para un prospecto
 */
router.post('/prospects/:id/demo', async (req, res) => {
    try {
        const userId = req.realUserId;
        const { demoType, customPrompt, styleInstructions } = req.body;
        const result = await leadHunterService.generateDemo(req.params.id, userId, demoType, customPrompt, styleInstructions);
        res.json(result);
    } catch (error) {
        console.error('Error generando demo:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/hunter/analyze-batch
 * Analizar múltiples prospectos
 */
router.post('/analyze-batch', async (req, res) => {
    try {
        const userId = req.realUserId;
        const { prospectIds } = req.body;

        if (!Array.isArray(prospectIds) || prospectIds.length === 0) {
            return res.status(400).json({ error: 'Se requiere array de prospectIds' });
        }

        const results = [];
        const errors = [];

        for (const id of prospectIds.slice(0, 10)) { // Máximo 10 a la vez
            try {
                const result = await leadHunterService.analyzeProspect(id, userId);
                results.push(result);
            } catch (error) {
                errors.push({ id, error: error.message });
            }
        }

        res.json({ analyzed: results, errors });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/hunter/process/:id
 * Convertir prospecto a lead
 */
/**
 * POST /api/hunter/prospects/:id/proposal
 * Generar una propuesta shareable para el prospecto
 */
router.post('/prospects/:id/proposal', async (req, res) => {
    try {
        const userId = req.realUserId;
        const result = await leadHunterService.createProposalFromProspect(req.params.id, userId);
        res.json(result);
    } catch (error) {
        console.error('Error creando propuesta:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/process/:id', async (req, res) => {
    try {
        const userId = req.realUserId;
        const customData = req.body;

        const result = await leadHunterService.processProspectToLead(
            req.params.id,
            userId,
            customData
        );

        res.json(result);
    } catch (error) {
        console.error('Error procesando prospecto:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/hunter/stats
 * Estadísticas del usuario
 */
router.get('/stats', async (req, res) => {
    try {
        const userId = req.realUserId;
        const stats = await leadHunterService.getUserStats(userId);
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/hunter/stats/reset
 * Resetear estadísticas diarias (Dev/Test)
 */
router.post('/stats/reset', async (req, res) => {
    try {
        const userId = req.realUserId;
        // 1. Resetear contadores diarios en users
        await db.query(
            'UPDATE users SET hunter_prospects_today = 0 WHERE id = $1',
            [userId]
        );

        // 2. Eliminar o resetear estadísticas históricas en hunter_usage_stats
        // Si el usuario quiere "resetear todo", borramos sus entradas en esta tabla
        await db.query(
            'DELETE FROM hunter_usage_stats WHERE user_id = $1',
            [userId]
        );

        // Opcional: Si queremos mantener el registro de "hoy" pero a 0, lo insertamos de nuevo vacío
        // pero DELETE es más limpio para un "Hard Reset" de contadores visuales.
        res.json({ message: 'Estadísticas reseteadas' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/hunter/history
 * Historial de búsquedas
 */
router.get('/history', async (req, res) => {
    try {
        const userId = req.realUserId;
        const limit = parseInt(req.query.limit) || 20;
        const history = await leadHunterService.getSearchHistory(userId, limit);
        res.json(history);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/hunter/searches
 * Listar sesiones de búsqueda (Agrupación)
 */
router.get('/searches', async (req, res) => {
    try {
        const userId = req.realUserId;
        const result = await db.query(
            `SELECT * FROM hunter_search_history 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * DELETE /api/hunter/searches/:id
 * Eliminar sesión de búsqueda
 */
router.delete('/searches/:id', async (req, res) => {
    try {
        const userId = req.realUserId;
        await leadHunterService.deleteSearchSession(req.params.id, userId);
        res.json({ message: 'Búsqueda eliminada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/hunter/searches
 * Listar sesiones de búsqueda (Agrupación)
 */

/**
 * GET /api/hunter/searches/:id/prospects
 * Obtener prospectos de una búsqueda específica
 */
router.get('/searches/:id/prospects', async (req, res) => {
    try {
        const userId = req.realUserId;
        const searchId = req.params.id;
        const { processed, priority, city } = req.query;

        let query = `
            SELECT mp.*, l.status as lead_status
            FROM maps_prospects mp
            LEFT JOIN leads l ON mp.lead_id = l.id
            WHERE mp.searched_by = $1 AND mp.search_id = $2
        `;
        const params = [userId, searchId];
        let paramIdx = 3;

        if (processed !== undefined) {
            query += ` AND mp.processed = $${paramIdx++}`;
            params.push(processed === 'true');
        }
        if (priority) {
            query += ` AND mp.ai_priority = $${paramIdx++}`;
            params.push(priority);
        }
        if (city) {
            query += ` AND mp.city ILIKE $${paramIdx++}`;
            params.push(`%${city}%`);
        }

        query += ' ORDER BY mp.created_at DESC';

        const result = await db.query(query, params);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// =====================================================
// RUTAS ADMIN
// =====================================================

/**
 * Middleware para verificar admin
 */
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador.' });
    }
    next();
};

/**
 * GET /api/hunter/admin/config
 * Obtener configuración de APIs
 */
router.get('/admin/config', requireAdmin, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT api_name, 
                    CASE WHEN api_key IS NOT NULL THEN '********' ELSE NULL END as api_key,
                    config_json, is_active, last_tested_at, test_result
             FROM hunter_api_config
             ORDER BY api_name`
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/hunter/admin/config/:apiName
 * Actualizar configuración de una API
 */
router.put('/admin/config/:apiName', requireAdmin, async (req, res) => {
    try {
        const { apiName } = req.params;
        const { api_key, config_json, is_active } = req.body;
        const userId = req.realUserId;

        const updates = [];
        const values = [];
        let paramIdx = 1;

        if (api_key !== undefined && api_key !== '********') {
            updates.push(`api_key = $${paramIdx++}`);
            values.push(api_key);
        }
        if (config_json !== undefined) {
            updates.push(`config_json = $${paramIdx++}`);
            values.push(JSON.stringify(config_json));
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramIdx++}`);
            values.push(is_active);
        }

        updates.push(`updated_at = NOW()`);
        updates.push(`updated_by = $${paramIdx++}`);
        values.push(userId);

        values.push(apiName);

        await db.query(
            `UPDATE hunter_api_config SET ${updates.join(', ')} WHERE api_name = $${paramIdx}`,
            values
        );

        res.json({ message: 'Configuración actualizada' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/hunter/admin/test/:apiName
 * Probar conexión de una API
 */
router.post('/admin/test/:apiName', requireAdmin, async (req, res) => {
    try {
        const { apiName } = req.params;
        let result;

        switch (apiName) {
            case 'google_places':
                result = await googlePlacesService.testConnection();
                break;
            case 'gemini_vertex':
                result = await geminiService.testConnection();
                break;
            default:
                result = { success: false, message: 'API no soportada para test' };
        }

        res.json(result);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

/**
 * GET /api/hunter/admin/users
 * Listar usuarios con info de acceso a Lead Hunter
 */
router.get('/admin/users', requireAdmin, async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.username, u.full_name, u.email, u.role,
                   u.has_lead_hunter_access, u.hunter_daily_limit,
                   COALESCE(hs.total_searched, 0) as total_searched,
                   COALESCE(hs.total_leads, 0) as total_leads
            FROM users u
            LEFT JOIN (
                SELECT user_id, 
                       SUM(prospects_searched) as total_searched,
                       SUM(leads_created) as total_leads
                FROM hunter_usage_stats
                GROUP BY user_id
            ) hs ON u.id = hs.user_id
            ORDER BY u.role, u.username
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/hunter/admin/users/:id
 * Actualizar acceso de un usuario
 */
router.put('/admin/users/:id', requireAdmin, async (req, res) => {
    try {
        const { id } = req.params;
        const { has_lead_hunter_access, hunter_daily_limit } = req.body;

        await db.query(
            `UPDATE users SET 
                has_lead_hunter_access = COALESCE($1, has_lead_hunter_access),
                hunter_daily_limit = COALESCE($2, hunter_daily_limit)
             WHERE id = $3`,
            [has_lead_hunter_access, hunter_daily_limit, id]
        );

        res.json({ message: 'Usuario actualizado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/hunter/admin/stats
 * Estadísticas globales
 */
router.get('/admin/stats', requireAdmin, async (req, res) => {
    try {
        const globalStats = await db.query(`
            SELECT 
                COUNT(DISTINCT user_id) as active_users,
                SUM(searches_performed) as total_searches,
                SUM(prospects_analyzed) as total_analyzed,
                SUM(leads_created) as total_leads,
                SUM(demos_generated) as total_demos
            FROM hunter_usage_stats
        `);

        const todayStats = await db.query(`
            SELECT 
                COUNT(DISTINCT user_id) as active_users,
                SUM(prospects_searched) as searched,
                SUM(leads_created) as leads
            FROM hunter_usage_stats
            WHERE date = CURRENT_DATE
        `);

        const topUsers = await db.query(`
            SELECT u.username, u.full_name,
                   SUM(hs.leads_created) as leads_created
            FROM users u
            JOIN hunter_usage_stats hs ON u.id = hs.user_id
            GROUP BY u.id, u.username, u.full_name
            ORDER BY leads_created DESC
            LIMIT 5
        `);

        res.json({
            global: globalStats.rows[0],
            today: todayStats.rows[0],
            topUsers: topUsers.rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/hunter/admin/team
 * Listar equipo comercial y sus búsquedas (para Admin)
 */
router.get('/admin/team', requireAdmin, async (req, res) => {
    try {
        // Obtener comerciales y un resumen de su actividad 
        const result = await db.query(`
            SELECT u.id, u.full_name, u.email,
                   COUNT(DISTINCT hs.id) as total_searches,
                   COUNT(DISTINCT mp.id) as total_prospects,
                   SUM(CASE WHEN mp.processed THEN 1 ELSE 0 END) as leads_generated
            FROM users u
            LEFT JOIN hunter_search_history hs ON u.id = hs.user_id
            LEFT JOIN maps_prospects mp ON u.id = mp.searched_by
            WHERE u.role = 'commercial'
            GROUP BY u.id
            ORDER BY total_prospects DESC
        `);
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/hunter/admin/team/:id/searches
 * Obtener búsquedas de un comercial específico
 */
router.get('/admin/team/:id/searches', requireAdmin, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM hunter_search_history 
             WHERE user_id = $1 
             ORDER BY created_at DESC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- New Notes System Routes ---

// Get all notes for a prospect
router.get('/prospects/:id/notes_list', async (req, res) => {
    try {
        const notes = await leadHunterService.getProspectNotes(req.params.id);
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add a new note
router.post('/prospects/:id/notes_entry', async (req, res) => {
    try {
        const { content, useForAnalysis } = req.body;
        const note = await leadHunterService.addProspectNote(req.params.id, content, useForAnalysis);
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update a note
router.put('/notes/:id', async (req, res) => {
    try {
        const { content, use_for_analysis } = req.body;
        const note = await leadHunterService.updateProspectNote(req.params.id, { content, use_for_analysis });
        res.json(note);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete a note
router.delete('/notes/:id', async (req, res) => {
    try {
        await leadHunterService.deleteProspectNote(req.params.id);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Public Demo Routes ---

// Generate Public Link
router.post('/demos/:id/share', async (req, res) => {
    try {
        const result = await leadHunterService.generatePublicDemoLink(req.params.id);
        res.json(result);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// --- Demo History Routes ---

router.get('/prospects/:id/demos', async (req, res) => {
    try {
        const demos = await leadHunterService.getProspectDemoHistory(req.params.id);
        res.json(demos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// View Public Demo (NO AUTH)
router.get('/public/demo/:token', async (req, res) => {
    try {
        const demo = await leadHunterService.getPublicDemo(req.params.token);
        if (!demo) return res.status(404).send('Demo no encontrada o enlace expirado');

        // Return HTML directly
        res.send(demo.html_content);
    } catch (error) {
        res.status(500).send('Error al cargar la demo');
    }
});

/**
 * POST /api/hunter/demos/contact (PUBLIC - NO AUTH)
 * Recibir solicitudes de contacto desde el formulario de la landing demo
 */
router.post('/demos/contact', async (req, res) => {
    try {
        const { prospectId, name, email, phone, message } = req.body;

        if (!prospectId || !name || !email) {
            return res.status(400).json({ error: 'Nombre, email y prospecto son requeridos' });
        }

        // Insert contact request into database
        const result = await db.query(`
            INSERT INTO demo_contact_requests 
            (prospect_id, name, email, phone, message, created_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id
        `, [prospectId, name, email, phone, message]);

        // Update prospect to mark it has contact requests
        await db.query(`
            UPDATE maps_prospects 
            SET has_contact_requests = TRUE, 
                contact_requests_count = COALESCE(contact_requests_count, 0) + 1
            WHERE id = $1
        `, [prospectId]);

        res.json({ success: true, message: 'Solicitud enviada correctamente', id: result.rows[0].id });
    } catch (error) {
        console.error('Error saving demo contact request:', error);
        // If table doesn't exist, create it and retry
        if (error.code === '42P01') {
            try {
                await db.query(`
                    CREATE TABLE IF NOT EXISTS demo_contact_requests (
                        id SERIAL PRIMARY KEY,
                        prospect_id INTEGER REFERENCES maps_prospects(id),
                        name VARCHAR(255) NOT NULL,
                        email VARCHAR(255) NOT NULL,
                        phone VARCHAR(50),
                        message TEXT,
                        is_read BOOLEAN DEFAULT FALSE,
                        created_at TIMESTAMP DEFAULT NOW()
                    )
                `);
                // Retry insert
                const { prospectId, name, email, phone, message } = req.body;
                await db.query(`
                    INSERT INTO demo_contact_requests (prospect_id, name, email, phone, message)
                    VALUES ($1, $2, $3, $4, $5)
                `, [prospectId, name, email, phone, message]);
                return res.json({ success: true, message: 'Solicitud enviada correctamente' });
            } catch (retryError) {
                console.error('Retry error:', retryError);
            }
        }
        res.status(500).json({ error: 'Error al procesar la solicitud' });
    }
});

/**
 * GET /api/hunter/prospects/:id/contact-requests
 * Obtener solicitudes de contacto de una demo
 */
router.get('/prospects/:id/contact-requests', authenticateToken, async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM demo_contact_requests 
             WHERE prospect_id = $1 
             ORDER BY created_at DESC`,
            [req.params.id]
        );
        res.json(result.rows);
    } catch (error) {
        // If table doesn't exist, return empty array
        if (error.code === '42P01') {
            return res.json([]);
        }
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
