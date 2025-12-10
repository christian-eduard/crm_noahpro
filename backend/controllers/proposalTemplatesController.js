const db = require('../config/database');

// Get all templates
const getTemplates = async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM proposal_templates ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting templates:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Get template by ID
const getTemplateById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('SELECT * FROM proposal_templates WHERE id = $1', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting template:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Create template
const createTemplate = async (req, res) => {
    try {
        const { name, description, content_json, is_default } = req.body;

        if (!name || !content_json) {
            return res.status(400).json({ error: 'Nombre y contenido son requeridos' });
        }

        // If this is default, unset others
        if (is_default) {
            await db.query('UPDATE proposal_templates SET is_default = FALSE');
        }

        const result = await db.query(
            'INSERT INTO proposal_templates (name, description, content_json, is_default) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, description, content_json, is_default || false]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Update template
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, content_json, is_default } = req.body;

        // If setting as default, unset others
        if (is_default) {
            await db.query('UPDATE proposal_templates SET is_default = FALSE WHERE id != $1', [id]);
        }

        const result = await db.query(
            `UPDATE proposal_templates 
             SET name = COALESCE($1, name),
                 description = COALESCE($2, description),
                 content_json = COALESCE($3, content_json),
                 is_default = COALESCE($4, is_default),
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $5
             RETURNING *`,
            [name, description, content_json, is_default, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Delete template
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await db.query('DELETE FROM proposal_templates WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada' });
        }

        res.json({ message: 'Plantilla eliminada' });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = {
    getTemplates,
    getTemplateById,
    createTemplate,
    updateTemplate,
    deleteTemplate
};
