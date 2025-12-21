const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { protect } = require('../middleware/authMiddleware');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de subida de archivos (CVs)
const uploadDir = path.join(__dirname, '../uploads/cvs');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'cv-' + unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limite
    fileFilter: (req, file, cb) => {
        // Aceptar PDF y Docs básicos, y tambien genéricos si mime falla
        cb(null, true);
    }
});

/**
 * RUTAS PÚBLICAS (sin autenticación)
 */

/**
 * POST /api/recruitment/apply
 * Formulario público de postulación
 */
router.post('/apply', upload.single('cv'), async (req, res) => {
    try {
        const { full_name, email, phone, linkedin_url, years_experience, current_company, position } = req.body;

        // Si se subió archivo, guardar path local. Si no, quizas mandaron URL string (fallback)
        const cv_url = req.file ? `/uploads/cvs/${req.file.filename}` : req.body.cv_url;

        if (!full_name || !email) {
            return res.status(400).json({ error: 'Nombre y email son requeridos' });
        }

        // Verificar si ya existe
        const existing = await db.query('SELECT id FROM candidates WHERE email = $1', [email]);
        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'Ya existe una postulación con este email' });
        }

        // Crear candidato (Incluyendo position en metadata o columna si existiera, aqui lo guardare en source info por ahora o asumiendo que el modelo DB lo soporte, si no solo CV y datos basicos)
        // Como no tengo columna 'position' en el INSERT anterior, la añadiré a 'current_company' provisionalmente o mejor:
        // Si la tabla no tiene 'position', usaré 'source' para guardar algo tipo "web_form - [position]" o actualizar schema.
        // Por simplicidad, concatenare position a source.

        const source = `web_form${position ? ': ' + position : ''}`;

        const result = await db.query(
            `INSERT INTO candidates 
                (full_name, email, phone, linkedin_url, years_experience, current_company, cv_url, source, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')
             RETURNING id, full_name, email, status`,
            [full_name, email, phone, linkedin_url, years_experience, current_company, cv_url, source]
        );

        res.json({
            success: true,
            message: '¡Postulación recibida correctamente! Te contactaremos pronto.',
            candidate: result.rows[0]
        });
    } catch (error) {
        console.error('Error en postulación:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/recruitment/interview/:token
 * Acceder a la sala de entrevista (público, validado por token)
 */
router.get('/interview/:token', async (req, res) => {
    try {
        const { token } = req.params;

        const result = await db.query(
            `SELECT ii.*, c.full_name as candidate_name, c.email as candidate_email,
                    t.name as template_name, t.system_prompt, t.questions, t.duration_minutes
             FROM interview_invitations ii
             JOIN candidates c ON ii.candidate_id = c.id
             JOIN interview_templates t ON ii.template_id = t.id
             WHERE ii.token = $1 AND ii.status != 'expired' AND ii.expires_at > NOW()`,
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Invitación no válida o expirada' });
        }

        const invitation = result.rows[0];

        // Marcar como iniciada si está pendiente
        if (invitation.status === 'pending') {
            await db.query(
                `UPDATE interview_invitations SET status = 'started' WHERE id = $1`,
                [invitation.id]
            );
        }

        res.json({
            success: true,
            invitation: {
                id: invitation.id,
                candidate_name: invitation.candidate_name,
                template_name: invitation.template_name,
                duration_minutes: invitation.duration_minutes,
                questions: invitation.questions
            }
        });
    } catch (error) {
        console.error('Error accediendo a entrevista:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/recruitment/interview/:token/complete
 * Completar entrevista y guardar resultados (público)
 */
router.post('/interview/:token/complete', async (req, res) => {
    try {
        const { token } = req.params;
        const { transcription, answers, duration_seconds } = req.body;

        // Verificar invitación
        const invResult = await db.query(
            `SELECT ii.*, c.id as candidate_id, t.id as template_id, t.evaluation_criteria
             FROM interview_invitations ii
             JOIN candidates c ON ii.candidate_id = c.id
             JOIN interview_templates t ON ii.template_id = t.id
             WHERE ii.token = $1 AND ii.status = 'started'`,
            [token]
        );

        if (invResult.rows.length === 0) {
            return res.status(404).json({ error: 'Invitación no válida' });
        }

        const invitation = invResult.rows[0];

        // TODO: Aquí irá la evaluación de IA usando AIServiceFactory
        // Por ahora, scoring dummy
        const ai_evaluation = {
            analysis: 'Evaluación automática pendiente de integración con IA',
            scores_by_question: {}
        };

        const overall_score = 75; // Temporal
        const recommendation = 'hire'; // Temporal

        // Guardar sesión
        const sessionResult = await db.query(
            `INSERT INTO interview_sessions 
                (invitation_id, candidate_id, template_id, transcription, duration_seconds, 
                 answers, ai_evaluation, overall_score, recommendation, completed_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
             RETURNING id`,
            [
                invitation.id, invitation.candidate_id, invitation.template_id,
                transcription, duration_seconds, JSON.stringify(answers),
                JSON.stringify(ai_evaluation), overall_score, recommendation
            ]
        );

        // Actualizar invitación
        await db.query(
            `UPDATE interview_invitations 
             SET status = 'completed', completed_at = NOW() 
             WHERE id = $1`,
            [invitation.id]
        );

        // Actualizar candidato
        await db.query(
            `UPDATE candidates SET status = 'interviewed', updated_at = NOW() WHERE id = $1`,
            [invitation.candidate_id]
        );

        res.json({
            success: true,
            message: '¡Entrevista completada! Revisaremos tus respuestas pronto.',
            session_id: sessionResult.rows[0].id
        });
    } catch (error) {
        console.error('Error completando entrevista:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * RUTAS PROTEGIDAS (con autenticación - admin)
 */
router.use(protect);

/**
 * GET /api/recruitment/templates
 * Obtener plantillas de entrevista
 */
router.get('/templates', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT * FROM interview_templates ORDER BY difficulty_level, name`
        );

        res.json({ templates: result.rows });
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/recruitment/templates
 * Crear plantilla de entrevista
 */
router.post('/templates', async (req, res) => {
    try {
        const { name, description, system_prompt, duration_minutes, questions, evaluation_criteria, difficulty_level } = req.body;

        if (!name || !system_prompt) {
            return res.status(400).json({ error: 'Nombre y prompt son requeridos' });
        }

        const result = await db.query(
            `INSERT INTO interview_templates 
                (name, description, system_prompt, duration_minutes, questions, evaluation_criteria, difficulty_level, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [name, description, system_prompt, duration_minutes || 15,
                JSON.stringify(questions), JSON.stringify(evaluation_criteria),
                difficulty_level || 'mid', req.user.id]
        );

        res.json({
            success: true,
            message: 'Plantilla creada correctamente',
            template: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PUT /api/recruitment/templates/:id
 * Editar plantilla de entrevista
 */
router.put('/templates/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description, system_prompt, duration_minutes, questions, evaluation_criteria, difficulty_level, is_active } = req.body;

        const result = await db.query(
            `UPDATE interview_templates
             SET name = $1, description = $2, system_prompt = $3, duration_minutes = $4,
                 questions = $5, evaluation_criteria = $6, difficulty_level = $7, is_active = $8, updated_at = NOW()
             WHERE id = $9
             RETURNING *`,
            [
                name, description, system_prompt, duration_minutes,
                JSON.stringify(questions), JSON.stringify(evaluation_criteria),
                difficulty_level, is_active !== undefined ? is_active : true, id
            ]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Plantilla no encontrada' });
        }

        res.json({
            success: true,
            message: 'Plantilla actualizada correctamente',
            template: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/recruitment/candidates
 * Listar candidatos
 */
router.get('/candidates', async (req, res) => {
    try {
        const { status, limit = 50, offset = 0 } = req.query;

        let query = `SELECT * FROM candidates`;
        let params = [];

        if (status) {
            query += ` WHERE status = $1`;
            params.push(status);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        res.json({ candidates: result.rows });
    } catch (error) {
        console.error('Error fetching candidates:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * POST /api/recruitment/candidates/:id/invite
 * Enviar invitación de entrevista
 */
router.post('/candidates/:id/invite', async (req, res) => {
    try {
        const { id } = req.params;
        const { template_id, expires_in_days = 7 } = req.body;

        // Generar token único
        const token = jwt.sign(
            { candidate_id: id, template_id, type: 'interview' },
            process.env.JWT_SECRET || 'default_secret',
            { expiresIn: `${expires_in_days}d` }
        );

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + expires_in_days);

        const result = await db.query(
            `INSERT INTO interview_invitations 
                (candidate_id, template_id, token, invited_by, expires_at)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, token`,
            [id, template_id, token, req.user.id, expiresAt]
        );

        // Actualizar estado del candidato
        await db.query(
            `UPDATE candidates SET status = 'invited', updated_at = NOW() WHERE id = $1`,
            [id]
        );

        const interviewUrl = `${req.protocol}://${req.get('host')}/interview?token=${token}`;

        res.json({
            success: true,
            message: 'Invitación generada correctamente',
            invitation_id: result.rows[0].id,
            interview_url: interviewUrl,
            token: result.rows[0].token
        });
    } catch (error) {
        console.error('Error sending invitation:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * GET /api/recruitment/sessions
 * Listar sesiones de entrevistas realizadas
 */
router.get('/sessions', async (req, res) => {
    try {
        const result = await db.query(
            `SELECT s.*, c.full_name, c.email, t.name as template_name
             FROM interview_sessions s
             JOIN candidates c ON s.candidate_id = c.id
             JOIN interview_templates t ON s.template_id = t.id
             ORDER BY s.completed_at DESC
             LIMIT 50`
        );

        res.json({ sessions: result.rows });
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ error: error.message });
    }
});

/**
 * PATCH /api/recruitment/candidates/:id/status
 * Actualizar estado de candidato (aprobar, rechazar, contratar)
 */
router.patch('/candidates/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;

        const allowedStatuses = ['approved', 'rejected', 'hired'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Estado no válido' });
        }

        const updateFields = ['status = $1', 'updated_at = NOW()'];
        const params = [status];

        if (notes) {
            updateFields.push(`notes = $${params.length + 1}`);
            params.push(notes);
        }

        params.push(id);

        const result = await db.query(
            `UPDATE candidates SET ${updateFields.join(', ')} WHERE id = $${params.length} RETURNING *`,
            params
        );

        res.json({
            success: true,
            message: 'Estado actualizado',
            candidate: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating candidate status:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
