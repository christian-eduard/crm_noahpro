const db = require('../config/database');
const path = require('path');
const fs = require('fs');

// Obtener todos los materiales (para admin)
const getAllMaterials = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT tm.*, u.full_name as creator_name, c.full_name as commercial_name
            FROM training_materials tm
            LEFT JOIN users u ON tm.created_by = u.id
            LEFT JOIN users c ON tm.commercial_id = c.id
            ORDER BY tm.sort_order, tm.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting materials:', error);
        res.status(500).json({ error: 'Error al obtener materiales' });
    }
};

// Obtener materiales para un comercial (públicos + asignados a él)
const getMaterialsForCommercial = async (req, res) => {
    const userId = req.user.userId || req.user.id;
    try {
        const result = await db.query(`
            SELECT * FROM training_materials
            WHERE is_public = true OR commercial_id = $1
            ORDER BY sort_order, created_at DESC
        `, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting materials:', error);
        res.status(500).json({ error: 'Error al obtener materiales' });
    }
};

// Obtener material por ID
const getMaterialById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM training_materials WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Material no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error getting material:', error);
        res.status(500).json({ error: 'Error al obtener material' });
    }
};

// Crear material
const createMaterial = async (req, res) => {
    const { title, description, type, video_url, content, external_url, is_public, commercial_id, category, sort_order } = req.body;
    const createdBy = req.user.userId || req.user.id;

    // Manejar archivo subido si existe
    let file_url = null, file_name = null, file_size = null;
    if (req.file) {
        file_url = `/uploads/training/${req.file.filename}`;
        file_name = req.file.originalname;
        file_size = req.file.size;
    }

    try {
        const result = await db.query(`
            INSERT INTO training_materials 
            (title, description, type, file_url, file_name, file_size, video_url, content, external_url, is_public, commercial_id, category, sort_order, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *
        `, [title, description, type, file_url, file_name, file_size, video_url, content, external_url,
            is_public !== false, commercial_id || null, category, sort_order || 0, createdBy]);

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating material:', error);
        res.status(500).json({ error: 'Error al crear material' });
    }
};

// Actualizar material
const updateMaterial = async (req, res) => {
    const { id } = req.params;
    const { title, description, type, video_url, content, external_url, is_public, commercial_id, category, sort_order } = req.body;

    try {
        const result = await db.query(`
            UPDATE training_materials SET
                title = COALESCE($1, title),
                description = COALESCE($2, description),
                type = COALESCE($3, type),
                video_url = $4,
                content = $5,
                external_url = $6,
                is_public = COALESCE($7, is_public),
                commercial_id = $8,
                category = $9,
                sort_order = COALESCE($10, sort_order),
                updated_at = NOW()
            WHERE id = $11
            RETURNING *
        `, [title, description, type, video_url, content, external_url, is_public, commercial_id, category, sort_order, id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Material no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({ error: 'Error al actualizar material' });
    }
};

// Eliminar material
const deleteMaterial = async (req, res) => {
    const { id } = req.params;
    try {
        // Obtener info del archivo para eliminarlo
        const material = await db.query('SELECT file_url FROM training_materials WHERE id = $1', [id]);

        const result = await db.query('DELETE FROM training_materials WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Material no encontrado' });
        }

        // Eliminar archivo si existe
        if (material.rows[0]?.file_url) {
            const filePath = path.join(__dirname, '..', 'public', material.rows[0].file_url);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }

        res.json({ message: 'Material eliminado' });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ error: 'Error al eliminar material' });
    }
};

module.exports = {
    getAllMaterials,
    getMaterialsForCommercial,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial
};
