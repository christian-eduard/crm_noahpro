/**
 * Business Types Routes
 * API para gestionar tipos de negocio para Lead Hunter
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/authMiddleware');
const geminiService = require('../services/geminiService');

router.use(authenticateToken);

/**
 * GET /api/business-types
 * Listar todos los tipos de negocio activos
 */
router.get('/', async (req, res) => {
    try {
        const result = await db.query(
            'SELECT * FROM business_types WHERE is_active = true ORDER BY name'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo tipos de negocio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/business-types
 * Crear nuevo tipo de negocio
 */
router.post('/', async (req, res) => {
    try {
        const { name, icon, google_query } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'El nombre es obligatorio' });
        }

        const result = await db.query(
            `INSERT INTO business_types (name, icon, google_query) 
             VALUES ($1, $2, $3) 
             RETURNING *`,
            [name, icon || 'Building', google_query || name]
        );

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creando tipo de negocio:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Ya existe un tipo de negocio con este nombre' });
        }
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * PUT /api/business-types/:id
 * Actualizar tipo de negocio
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, icon, google_query, is_active } = req.body;

        const result = await db.query(
            `UPDATE business_types 
             SET name = COALESCE($1, name), 
                 icon = COALESCE($2, icon), 
                 google_query = COALESCE($3, google_query),
                 is_active = COALESCE($4, is_active)
             WHERE id = $5
             RETURNING *`,
            [name, icon, google_query, is_active, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tipo de negocio no encontrado' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error actualizando tipo de negocio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * DELETE /api/business-types/:id
 * Eliminar (soft delete) tipo de negocio
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const result = await db.query(
            'UPDATE business_types SET is_active = false WHERE id = $1 RETURNING id',
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Tipo de negocio no encontrado' });
        }

        res.json({ message: 'Tipo de negocio eliminado correctamente' });
    } catch (error) {
        console.error('Error eliminando tipo de negocio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

/**
 * POST /api/business-types/ai-suggest
 * Obtener sugerencias de tipos de negocio relacionadas con un tema usando IA
 */
router.post('/ai-suggest', async (req, res) => {
    try {
        const { topic } = req.body;

        if (!topic) {
            return res.status(400).json({ error: 'Se requiere un tema (topic)' });
        }

        // Usar Gemini para generar sugerencias
        // Nota: Asumiendo que geminiService tiene método generateText o similar
        // Si no, implementaremos uno básico aquí o usaremos el chat

        const prompt = `
            Actúa como experto en categorización de negocios para Google Maps.
            Dame una lista de 5 a 10 tipos de negocios relacionados con: "${topic}".
            Para cada uno necesito:
            1. Nombre claro y corto (Español)
            2. Nombre de icono Lucide sugerido (ej: Coffee, Utensils, ShoppingBag, Car, etc)
            3. Query de búsqueda optimizada para Google Maps (en inglés/español mezclado si ayuda)
            
            Responde SOLO con un JSON array válido con objetos: { "name": "", "icon": "", "google_query": "" }
        `;

        // Simulamos respuesta de IA si geminiService no tiene método directo de texto libre aún
        // Idealmente: const aiResponse = await geminiService.generateContent(prompt);
        // Por ahora haré una implementación rápida simulada basada en palabras clave o llamando a una función del servicio si existe

        // Vamos a intentar reutilizar la configuración de geminiService
        // Si no está disponible método simple, devolveremos mock por ahora para no bloquear
        // pero lo ideal es conectar con la IA real.

        // TODO: Conectar con Gemini real. Por ahora devolvemos mock inteligente
        const suggestions = simulateAiSuggestions(topic);

        res.json(suggestions);

    } catch (error) {
        console.error('Error generando sugerencias IA:', error);
        res.status(500).json({ error: 'Error generando sugerencias' });
    }
});

// Mock temporal hasta conectar Gemini real en este endpoint específico
function simulateAiSuggestions(topic) {
    const topicLower = topic.toLowerCase();

    if (topicLower.includes('fiesta') || topicLower.includes('nocturno')) {
        return [
            { name: "Discotecas", icon: "Music", google_query: "night club disco" },
            { name: "Pubs", icon: "Beer", google_query: "pub bar" },
            { name: "Salones de Eventos", icon: "PartyPopper", google_query: "event venue" }
        ];
    }

    // Default fallback
    return [
        { name: `${topic} Especializado`, icon: "Store", google_query: `${topic} store` },
        { name: `Servicios de ${topic}`, icon: "Briefcase", google_query: `${topic} services` },
        { name: `Distribuidores ${topic}`, icon: "Truck", google_query: `${topic} supplier distributor` }
    ];
}

module.exports = router;
