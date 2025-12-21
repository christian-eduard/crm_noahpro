/**
 * Knowledge Service
 * Manages the AI Brain Knowledge Base and Personality settings
 */

const db = require('../config/database');

class KnowledgeService {
    /**
     * Get the AI Brain configuration
     */
    async getBrainSettings() {
        try {
            const result = await db.query('SELECT * FROM ai_brain_settings LIMIT 1');
            return result.rows[0];
        } catch (error) {
            console.error('Error fetching brain settings:', error);
            return null;
        }
    }

    /**
     * Update AI Brain configuration
     */
    async updateBrainSettings(settings) {
        const { personality_tone, system_instruction_prefix, system_instruction_suffix, max_context_units } = settings;

        try {
            const result = await db.query(
                `UPDATE ai_brain_settings SET 
                    personality_tone = $1, 
                    system_instruction_prefix = $2, 
                    system_instruction_suffix = $3, 
                    max_context_units = $4,
                    updated_at = NOW()
                 WHERE id = (SELECT id FROM ai_brain_settings LIMIT 1)
                 RETURNING *`,
                [personality_tone, system_instruction_prefix, system_instruction_suffix, max_context_units]
            );
            return result.rows[0];
        } catch (error) {
            console.error('Error updating brain settings:', error);
            throw error;
        }
    }

    /**
     * Get active knowledge units (filtered by tags if provided)
     */
    async getKnowledgeUnits(tags = []) {
        try {
            let query = 'SELECT * FROM ai_brain_knowledge WHERE is_active = TRUE';
            const params = [];

            if (tags && tags.length > 0) {
                query += ' AND tags && $1';
                params.push(tags);
            }

            query += ' ORDER BY created_at DESC';
            const result = await db.query(query, params);
            return result.rows;
        } catch (error) {
            console.error('Error fetching knowledge units:', error);
            return [];
        }
    }

    /**
     * Get relevant context for a prompt based on tags/keywords
     */
    async getContextForAnalysis(tags = []) {
        const settings = await this.getBrainSettings();
        const units = await this.getKnowledgeUnits(tags);

        // Take top N units based on settings
        const maxUnits = settings ? settings.max_context_units : 5;
        const relevantUnits = units.slice(0, maxUnits);

        if (relevantUnits.length === 0) return '';

        let context = '\n--- CONOCIMIENTO ADICIONAL (EL CEREBRO) ---\n';
        relevantUnits.forEach(unit => {
            context += `[${unit.title}]: ${unit.content}\n`;
        });
        context += '-------------------------------------------\n';

        return context;
    }

    /**
     * CRUD for Knowledge Units
     */
    async createKnowledgeUnit(unit) {
        const { title, content, category, tags } = unit;
        const result = await db.query(
            `INSERT INTO ai_brain_knowledge (title, content, category, tags)
             VALUES ($1, $2, $3, $4) RETURNING *`,
            [title, content, category, tags || []]
        );
        return result.rows[0];
    }

    async updateKnowledgeUnit(id, unit) {
        const { title, content, category, tags, is_active } = unit;
        const result = await db.query(
            `UPDATE ai_brain_knowledge SET 
                title = $1, content = $2, category = $3, tags = $4, is_active = $5, updated_at = NOW()
             WHERE id = $6 RETURNING *`,
            [title, content, category, tags, is_active, id]
        );
        return result.rows[0];
    }

    async deleteKnowledgeUnit(id) {
        await db.query('DELETE FROM ai_brain_knowledge WHERE id = $1', [id]);
        return { success: true };
    }
}

module.exports = new KnowledgeService();
