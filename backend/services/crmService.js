/**
 * CRM Service
 * Puente entre el procesamiento de IA y la base de datos para el Lead Hunter
 */

const db = require('../config/database');

class CRMService {
    /**
     * Actualizar los resultados del análisis de un prospecto
     */
    async updateProspectAnalysis(prospectId, analysis) {
        try {
            await db.query(
                `UPDATE maps_prospects SET 
                    ai_analysis = $1,
                    ai_priority = $2,
                    ai_tags = $3,
                    ai_reasoning = $4,
                    ai_message_subject = $5,
                    ai_message_body = $6,
                    ai_channel = $7,
                    processed = TRUE,
                    updated_at = NOW()
                 WHERE id = $8`,
                [
                    JSON.stringify(analysis),
                    analysis.priority || 'medium',
                    analysis.tags || [],
                    analysis.reasoning || '',
                    analysis.personalized_message?.subject || '',
                    analysis.personalized_message?.body || '',
                    analysis.personalized_message?.channel || 'whatsapp',
                    prospectId
                ]
            );

            // Actualizar estadísticas de uso
            const prospectResult = await db.query('SELECT searched_by FROM maps_prospects WHERE id = $1', [prospectId]);
            if (prospectResult.rows.length > 0) {
                const userId = prospectResult.rows[0].searched_by;
                const today = new Date().toISOString().split('T')[0];
                await db.query(
                    `INSERT INTO hunter_usage_stats (user_id, date, prospects_analyzed)
                     VALUES ($1, $2, 1)
                     ON CONFLICT (user_id, date) 
                     DO UPDATE SET prospects_analyzed = hunter_usage_stats.prospects_analyzed + 1`,
                    [userId, today]
                );
            }

            return { success: true };
        } catch (error) {
            console.error('[CRMService] Error updating prospect analysis:', error);
            throw error;
        }
    }

    /**
     * Guardar una demo web generada para un prospecto
     */
    async saveProspectDemo(prospectId, demoType, htmlContent) {
        try {
            const prospectResult = await db.query('SELECT searched_by FROM maps_prospects WHERE id = $1', [prospectId]);
            if (prospectResult.rows.length === 0) {
                throw new Error('Prospecto no encontrado');
            }
            const userId = prospectResult.rows[0].searched_by;

            // Generar token público para la demo
            const publicToken = require('crypto').randomBytes(16).toString('hex');

            const result = await db.query(
                `INSERT INTO hunter_demo_history (prospect_id, user_id, html_content, demo_type, public_token)
                 VALUES ($1, $2, $3, $4, $5) RETURNING id`,
                [prospectId, userId, htmlContent, demoType, publicToken]
            );

            return { success: true, demoId: result.rows[0].id, publicToken };
        } catch (error) {
            console.error('[CRMService] Error saving prospect demo:', error);
            throw error;
        }
    }
}

module.exports = new CRMService();
