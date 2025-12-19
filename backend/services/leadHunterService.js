/**
 * Lead Hunter Service
 * Orquestador principal que coordina la búsqueda, análisis y conversión de prospectos
 */

const db = require('../config/database');
const googlePlacesService = require('./googlePlacesService');
const geminiService = require('./geminiService');
const crypto = require('crypto');

class LeadHunterService {
    /**
     * Verificar si el usuario tiene acceso al Lead Hunter
     */
    async checkUserAccess(userId) {
        const result = await db.query(
            `SELECT has_lead_hunter_access, hunter_daily_limit, hunter_prospects_today, hunter_last_reset
             FROM users WHERE id = $1`,
            [userId]
        );

        if (result.rows.length === 0) {
            throw new Error('Usuario no encontrado');
        }

        const user = result.rows[0];

        if (!user.has_lead_hunter_access) {
            throw new Error('No tienes acceso al módulo Lead Hunter. Contacta al administrador.');
        }

        // Resetear contador diario si es nuevo día
        const today = new Date().toISOString().split('T')[0];
        if (user.hunter_last_reset !== today) {
            await db.query(
                `UPDATE users SET hunter_prospects_today = 0, hunter_last_reset = $1 WHERE id = $2`,
                [today, userId]
            );
            user.hunter_prospects_today = 0;
        }

        // Verificar límite diario
        if (user.hunter_prospects_today >= user.hunter_daily_limit) {
            throw new Error(`Has alcanzado tu límite diario de ${user.hunter_daily_limit} prospectos.`);
        }

        return {
            hasAccess: true,
            dailyLimit: user.hunter_daily_limit,
            usedToday: user.hunter_prospects_today,
            remaining: user.hunter_daily_limit - user.hunter_prospects_today
        };
    }

    /**
     * Buscar prospectos en una zona
     */
    async searchProspects(query, location, userId, radius, strategy, promptTemplate = null, maxResults = 20) {
        // Verificar acceso
        await this.checkUserAccess(userId);

        // 1. Crear entrada en historial de búsqueda
        const historyResult = await db.query(
            `INSERT INTO hunter_search_history (user_id, query, location, business_type, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING id`,
            [userId, query, location, query] // Usamos query como business_type por ahora
        );
        const searchId = historyResult.rows[0].id;

        // 2. Buscar y guardar con vinculación al historial
        const results = await googlePlacesService.searchAndSave(query, location, userId, searchId, radius, strategy, maxResults);

        // 3. Actualizar contador de resultados en historial
        await db.query(
            `UPDATE hunter_search_history SET results_count = $1 WHERE id = $2`,
            [results.saved.length, searchId]
        );

        // 4. Descontar una búsqueda diaria del límite del usuario
        // Nota: Se descuenta 1 búsqueda por cada ejecución del buscador
        await db.query(
            `UPDATE users SET hunter_prospects_today = hunter_prospects_today + 1 WHERE id = $1`,
            [userId]
        );

        return results;
    }

    /**
     * Analizar un prospecto con IA
     */
    async analyzeProspect(prospectId, userId) {
        // Verificar que el prospecto pertenece al usuario
        const prospect = await db.query(
            'SELECT * FROM maps_prospects WHERE id = $1 AND searched_by = $2',
            [prospectId, userId]
        );

        if (prospect.rows.length === 0) {
            throw new Error('Prospecto no encontrado o no tienes permisos');
        }

        return await geminiService.analyzeAndSave(prospectId);
    }

    /**
     * Realizar búsqueda profunda de un prospecto (Simulación con IA)
     */
    async deepAnalyzeProspect(prospectId, userId) {
        // 1. Obtener prospecto con todos los datos
        const prospectResult = await db.query(
            'SELECT * FROM maps_prospects WHERE id = $1 AND searched_by = $2',
            [prospectId, userId]
        );

        if (prospectResult.rows.length === 0) {
            throw new Error('Prospecto no encontrado');
        }

        const prospect = prospectResult.rows[0];

        // 2. Ejecutar Auditoría Digital 360º (PASO D)
        const digitalAudit = await geminiService.analyzeProspectDeep(prospect);

        // 3. Guardar resultados en columnas específicas
        const result = await db.query(
            `UPDATE maps_prospects 
             SET digital_audit = $1,
                 sales_intelligence = $2,
                 ai_tags = $3,
                 ai_priority = $4,
                 updated_at = NOW()
             WHERE id = $5
             RETURNING *`,
            [
                JSON.stringify(digitalAudit.digital_audit),
                JSON.stringify(digitalAudit.sales_intelligence),
                digitalAudit.tags,
                digitalAudit.priority,
                prospectId
            ]
        );

        // 4. Actualizar estadísticas
        await this.updateStats(userId, { prospects_analyzed: 1 });

        return result.rows[0];
    }

    /**
     * Convertir prospecto a lead
     */
    async processProspectToLead(prospectId, userId, customData = {}) {
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // Obtener prospecto con análisis
            const prospectResult = await client.query(
                `SELECT * FROM maps_prospects WHERE id = $1 AND searched_by = $2`,
                [prospectId, userId]
            );

            if (prospectResult.rows.length === 0) {
                throw new Error('Prospecto no encontrado');
            }

            const prospect = prospectResult.rows[0];

            if (prospect.processed && prospect.lead_id) {
                throw new Error('Este prospecto ya fue convertido a lead');
            }

            // Obtener comercial_code del usuario
            const commercialResult = await client.query(
                'SELECT commercial_code FROM commercial_profiles WHERE user_id = $1',
                [userId]
            );
            const commercialCode = commercialResult.rows[0]?.commercial_code;

            // Crear lead
            // Crear lead
            // Si el prospecto está asignado a alguien, el lead debe ser para esa persona
            // Si el user que ejecuta es admin y el prospecto está asignado, respetamos la asignación
            // Si no está asignado, se asigna al que lo procesa (userId)

            const assigneeId = prospect.assigned_to || userId;

            // Si el asignado no es el que ejecuta (ej admin procesando para otro), obtener el code del asignado
            let finalCommercialCode = commercialCode;
            if (assigneeId !== userId) {
                const assignedUserResult = await client.query(
                    'SELECT commercial_code FROM commercial_profiles WHERE user_id = $1',
                    [assigneeId]
                );
                if (assignedUserResult.rows.length > 0) {
                    finalCommercialCode = assignedUserResult.rows[0].commercial_code;
                }
            }

            const leadResult = await client.query(
                `INSERT INTO leads (name, email, phone, business_name, message, source, status, 
                                   assigned_commercial_id, commercial_code)
                 VALUES ($1, $2, $3, $4, $5, 'google_maps_hunter', 'new', $6, $7)
                 RETURNING id`,
                [
                    prospect.name,
                    customData.email || prospect.email || `${prospect.place_id}@pendiente.crm`,
                    prospect.phone,
                    prospect.name,
                    prospect.ai_reasoning || `Prospecto encontrado via Lead Hunter en ${prospect.city}`,
                    assigneeId,
                    finalCommercialCode
                ]
            );

            const leadId = leadResult.rows[0].id;

            // Asignar tags de la IA
            let tags = prospect.ai_tags || [];

            // Asegurar que existe el tag "Lead Hunter"
            const lhTagResult = await client.query("SELECT id FROM tags WHERE name = 'Lead Hunter'");
            let lhTagId;

            if (lhTagResult.rows.length === 0) {
                // Crear tag si no existe
                const newTag = await client.query(
                    "INSERT INTO tags (name, color) VALUES ('Lead Hunter', '#f97316') RETURNING id"
                );
                lhTagId = newTag.rows[0].id;
            } else {
                lhTagId = lhTagResult.rows[0].id;
            }

            // Añadir ID de Lead Hunter a la lista
            if (!tags.includes(lhTagId)) tags.push(lhTagId);

            for (const tagId of tags) {
                // Verificar que el tag existe antes de insertar
                const tagExists = await client.query("SELECT 1 FROM tags WHERE id = $1", [tagId]);
                if (tagExists.rows.length > 0) {
                    await client.query(
                        `INSERT INTO lead_tags (lead_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
                        [leadId, tagId]
                    );
                }
            }

            // Marcar prospecto como procesado
            await client.query(
                `UPDATE maps_prospects SET processed = TRUE, lead_id = $1, processed_at = NOW() 
                 WHERE id = $2`,
                [leadId, prospectId]
            );

            // Actualizar estadísticas
            const today = new Date().toISOString().split('T')[0];
            await client.query(
                `INSERT INTO hunter_usage_stats (user_id, date, leads_created)
                 VALUES ($1, $2, 1)
                 ON CONFLICT (user_id, date) 
                 DO UPDATE SET leads_created = hunter_usage_stats.leads_created + 1`,
                [userId, today]
            );

            await client.query('COMMIT');

            return {
                success: true,
                leadId,
                prospect: {
                    id: prospect.id,
                    name: prospect.name
                },
                tagsAssigned: tags
            };

        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    /**
     * Generar Demo Web para un prospecto
     */
    async generateDemo(prospectId, userId, demoType = 'modern', customPrompt = '', styleInstructions = '') {
        const prospectResult = await db.query(
            'SELECT * FROM maps_prospects WHERE id = $1 AND searched_by = $2',
            [prospectId, userId]
        );

        if (prospectResult.rows.length === 0) {
            throw new Error('Prospecto no encontrado');
        }

        const prospect = prospectResult.rows[0];
        const html = await geminiService.generateLandingPage(prospect, demoType, customPrompt, styleInstructions);

        // Generate public token
        const publicToken = crypto.randomBytes(16).toString('hex');

        // Guardamos en el historial con tipo de demo y token
        const demoResult = await db.query(
            'INSERT INTO hunter_demo_history (prospect_id, user_id, html_content, template_name, public_token) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [prospectId, userId, html, demoType, publicToken]
        );

        const demoId = demoResult.rows[0].id;

        // Actualizamos last generated timestamp
        await db.query(
            'UPDATE maps_prospects SET demo_generated_at = NOW() WHERE id = $1',
            [prospectId]
        );

        // Actualizar estadísticas de demos
        const today = new Date().toISOString().split('T')[0];
        await db.query(
            `INSERT INTO hunter_usage_stats (user_id, date, demos_generated)
             VALUES ($1, $2, 1)
             ON CONFLICT (user_id, date) 
             DO UPDATE SET demos_generated = hunter_usage_stats.demos_generated + 1`,
            [userId, today]
        );

        return {
            html,
            publicToken,
            demoId,
            publicUrl: `/demo/${publicToken}`
        };
    }

    /**
     * Obtener prospectos del usuario
     */
    async getUserProspects(userId, filters = {}) {
        let query = `
            SELECT mp.*, l.status as lead_status,
                   u_assigned.full_name as assigned_to_name
            FROM maps_prospects mp
            LEFT JOIN leads l ON mp.lead_id = l.id
            LEFT JOIN users u_assigned ON mp.assigned_to = u_assigned.id
            WHERE (mp.searched_by = $1 OR mp.assigned_to = $1)
        `;
        const params = [userId];
        let paramIdx = 2;

        if (filters.processed !== undefined) {
            query += ` AND mp.processed = $${paramIdx++}`;
            params.push(filters.processed);
        }

        if (filters.priority) {
            query += ` AND mp.ai_priority = $${paramIdx++}`;
            params.push(filters.priority);
        }

        if (filters.city) {
            query += ` AND mp.city ILIKE $${paramIdx++}`;
            params.push(`%${filters.city}%`);
        }

        query += ' ORDER BY mp.created_at DESC';

        if (filters.limit) {
            query += ` LIMIT $${paramIdx++}`;
            params.push(filters.limit);
        }

        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Asignar prospecto a un comercial
     */
    async assignProspect(prospectId, assignToUserId, assignedByUserId) {
        const result = await db.query(
            `UPDATE maps_prospects 
             SET assigned_to = $1, updated_at = NOW() 
             WHERE id = $2 AND (searched_by = $3 OR $3 IN (SELECT id FROM users WHERE role = 'admin') OR searched_by IS NOT NULL)
             RETURNING *`,
            [assignToUserId, prospectId, assignedByUserId]
        );
        // Note: 'searched_by IS NOT NULL' is a safeguard, improved query:
        // WHERE id = $2 AND (searched_by = $3 OR EXISTS(SELECT 1 FROM users WHERE id=$3 AND role='admin'))

        if (result.rows.length === 0) {
            throw new Error('Prospecto no encontrado o sin permisos');
        }

        return result.rows[0];
    }

    /**
     * Get Prospect Notes
     */
    async getProspectNotes(prospectId) {
        const result = await db.query(
            `SELECT * FROM prospect_notes WHERE prospect_id = $1 ORDER BY created_at DESC`,
            [prospectId]
        );
        return result.rows;
    }

    /**
     * Add Prospect Note
     */
    async addProspectNote(prospectId, content, useForAnalysis = true) {
        const result = await db.query(
            `INSERT INTO prospect_notes (prospect_id, content, use_for_analysis) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [prospectId, content, useForAnalysis]
        );
        return result.rows[0];
    }

    /**
     * Update Prospect Note
     */
    async updateProspectNote(noteId, { content, use_for_analysis }) {
        const fields = [];
        const values = [];
        let idx = 1;

        if (content !== undefined) {
            fields.push(`content = $${idx++}`);
            values.push(content);
        }
        if (use_for_analysis !== undefined) {
            fields.push(`use_for_analysis = $${idx++}`);
            values.push(use_for_analysis);
        }

        if (fields.length === 0) return null;

        values.push(noteId);
        const result = await db.query(
            `UPDATE prospect_notes SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${idx} RETURNING *`,
            values
        );
        return result.rows[0];
    }

    /**
     * Delete Prospect Note
     */
    async deleteProspectNote(noteId) {
        await db.query(`DELETE FROM prospect_notes WHERE id = $1`, [noteId]);
        return { success: true };
    }

    /**
     * Get a public demo by token
     */
    async getPublicDemo(token) {
        const result = await db.query(
            `UPDATE hunter_demo_history SET views = views + 1 WHERE public_token = $1 RETURNING *`,
            [token]
        );
        return result.rows[0];
    }

    /**
     * Generate Web Demo (Landing Page)
     */
    async generateWebDemo(prospectId, userId) {
        // Fetch full prospect data including photos
        const p = await db.query('SELECT * FROM maps_prospects WHERE id=$1', [prospectId]);
        if (p.rows.length === 0) throw new Error('Prospecto no encontrado');
        const prospect = p.rows[0];

        // Generate content via Gemini
        const htmlContent = await geminiService.generateWebDemo(prospect);

        // Generate generic public token immediately
        const publicToken = crypto.randomBytes(16).toString('hex');

        // Save to History
        const result = await db.query(
            `INSERT INTO hunter_demo_history (user_id, prospect_id, html_content, public_token, created_at)
             VALUES ($1, $2, $3, $4, NOW())
             RETURNING *`,
            [userId, prospectId, htmlContent, publicToken]
        );

        // Update stats
        await db.query(
            `UPDATE hunter_usage_stats SET demos_generated = demos_generated + 1 
             WHERE user_id = $1 AND date = CURRENT_DATE`,
            [userId]
        );

        return result.rows[0];
    }

    /**
     * Create a shareable proposal from a prospect
     */
    async createProposalFromProspect(prospectId, userId) {
        // 1. Fetch prospect
        const p = await db.query('SELECT * FROM maps_prospects WHERE id=$1', [prospectId]);
        if (p.rows.length === 0) throw new Error('Prospecto no encontrado');
        const prospect = p.rows[0];

        // 2. Fetch last demo if exists
        const d = await db.query('SELECT * FROM hunter_demo_history WHERE prospect_id=$1 ORDER BY created_at DESC LIMIT 1', [prospectId]);
        const lastDemo = d.rows[0];

        // 3. Prepare content_json
        const contentJson = {
            prospect_name: prospect.name,
            prospect_address: prospect.address,
            ai_analysis: prospect.ai_analysis,
            ai_reasoning: prospect.ai_reasoning,
            strategy: prospect.strategy,
            demo_url: lastDemo ? `/demo/p/${lastDemo.public_token}` : null,
            business_data: {
                rating: prospect.rating,
                reviews: prospect.reviews_count,
                website: prospect.website
            }
        };

        // 4. Create proposal
        const token = crypto.randomBytes(16).toString('hex');
        const result = await db.query(
            `INSERT INTO proposals (
                prospect_id, 
                title, 
                description, 
                content_json, 
                token, 
                status, 
                created_by,
                created_at,
                updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING *`,
            [
                prospectId,
                `Propuesta Estratégica: ${prospect.name}`,
                `Análisis IA y propuesta de digitalización para ${prospect.name}`,
                JSON.stringify(contentJson),
                token,
                'sent',
                userId.toString()
            ]
        );

        return result.rows[0];
    }

    /**
     * Generate Public Link for Demo
     */
    async generatePublicDemoLink(demoId) {
        const token = crypto.randomBytes(16).toString('hex');
        const result = await db.query(
            `UPDATE hunter_demo_history SET public_token = $1 WHERE id = $2 RETURNING *`,
            [token, demoId]
        );
        return result.rows[0];
    }

    /**
     * Deprecated: simple save (migrating to notes table)
     * Keeping for backward compatibility or migrating data
     */
    async saveInternalNotes(prospectId, notes, userId) {
        // Compatibility: Add as a new note if not exists or update. 
        // For now, let's keep the old column sync endpoint for legacy, but UI will use new one.
        const result = await db.query(
            `UPDATE maps_prospects 
             SET internal_notes = $1, updated_at = NOW() 
             WHERE id = $2 
             RETURNING *`,
            [notes, prospectId]
        );
        return result.rows[0];
    }

    /**
     * Mejorar notas con IA
     */
    async improveInternalNotes(prospectId, notes) {
        // Fetch prospect basic info for context
        const p = await db.query('SELECT name, city, business_type FROM maps_prospects WHERE id=$1', [prospectId]);
        const context = p.rows.length > 0 ? `${p.rows[0].name} (${p.rows[0].business_type}) en ${p.rows[0].city}` : '';

        return await geminiService.improveNotes(notes, context);
    }

    /**
     * Obtener estadísticas del usuario
     */
    async getUserStats(userId) {
        // Get stats from usage_stats table
        const usageResult = await db.query(
            `SELECT 
                COALESCE(SUM(prospects_searched), 0) as total_searched,
                COALESCE(SUM(prospects_analyzed), 0) as total_analyzed,
                COALESCE(SUM(leads_created), 0) as total_leads,
                COALESCE(SUM(messages_sent_email), 0) as emails_sent,
                COALESCE(SUM(messages_sent_whatsapp), 0) as whatsapp_sent
             FROM hunter_usage_stats
             WHERE user_id = $1`,
            [userId]
        );

        // Get real counts from prospects table as fallback/override
        const realCounts = await db.query(
            `SELECT 
                COUNT(*) as total_searched,
                COUNT(*) FILTER (WHERE ai_analysis IS NOT NULL) as total_analyzed,
                COUNT(*) FILTER (WHERE processed = TRUE OR lead_id IS NOT NULL) as total_leads
             FROM maps_prospects
             WHERE searched_by = $1`,
            [userId]
        );

        const todayResult = await db.query(
            `SELECT * FROM hunter_usage_stats WHERE user_id = $1 AND date = CURRENT_DATE`,
            [userId]
        );

        const accessResult = await db.query(
            `SELECT hunter_daily_limit, hunter_prospects_today FROM users WHERE id = $1`,
            [userId]
        );

        // Use real counts as they are more accurate
        const realData = realCounts.rows[0] || {};
        const usageData = usageResult.rows[0] || {};

        return {
            totals: {
                total_searched: parseInt(realData.total_searched) || parseInt(usageData.total_searched) || 0,
                total_analyzed: parseInt(realData.total_analyzed) || parseInt(usageData.total_analyzed) || 0,
                total_leads: parseInt(realData.total_leads) || parseInt(usageData.total_leads) || 0,
                emails_sent: parseInt(usageData.emails_sent) || 0,
                whatsapp_sent: parseInt(usageData.whatsapp_sent) || 0
            },
            today: todayResult.rows[0] || { prospects_searched: 0, leads_created: 0 },
            limits: accessResult.rows[0] || { hunter_daily_limit: 50, hunter_prospects_today: 0 }
        };
    }

    /**
     * Obtener historial de búsquedas
     */
    async getSearchHistory(userId, limit = 20) {
        const result = await db.query(
            `SELECT * FROM hunter_search_history 
             WHERE user_id = $1 
             ORDER BY created_at DESC 
             LIMIT $2`,
            [userId, limit]
        );
        return result.rows;
    }

    /**
     * Eliminar sesión de búsqueda
     * Mantiene prospects analizados o con lead creado (desvinculándolos)
     * Borra el resto
     */
    async deleteSearchSession(searchId, userId) {
        const client = await db.pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Desvincular leads analizados o procesados (set id = null)
            await client.query(
                `UPDATE maps_prospects 
                 SET search_id = NULL 
                 WHERE search_id = $1 AND searched_by = $2 
                 AND (ai_analysis IS NOT NULL OR lead_id IS NOT NULL OR processed = TRUE)`,
                [searchId, userId]
            );

            // 2. Borrar prospects no analizados
            await client.query(
                `DELETE FROM maps_prospects 
                 WHERE search_id = $1 AND searched_by = $2`,
                [searchId, userId]
            );

            // 3. Borrar historial
            const result = await client.query(
                `DELETE FROM hunter_search_history 
                 WHERE id = $1 AND user_id = $2`,
                [searchId, userId]
            );

            if (result.rowCount === 0) {
                throw new Error('Búsqueda no encontrada o no tienes permiso');
            }

            await client.query('COMMIT');
            return { success: true };
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }
}

module.exports = new LeadHunterService();
