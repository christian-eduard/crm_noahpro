const db = require('../config/database');
const bcrypt = require('bcryptjs');
const QRCode = require('qrcode');
const { sendCommercialWelcomeEmail } = require('../services/emailService');

// Crear un nuevo comercial
const createCommercial = async (req, res) => {
    const { username, password, email, full_name, phone } = req.body;

    if (!username || !password || !email || !full_name) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Crear usuario
        const hashedPassword = await bcrypt.hash(password, 10);
        const userResult = await client.query(
            'INSERT INTO users (username, password, email, full_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id',
            [username, hashedPassword, email, full_name, 'commercial']
        );
        const userId = userResult.rows[0].id;

        // 2. Generar código único y QR
        const commercialCode = `COM-${userId}-${Date.now().toString().slice(-4)}`;
        // QR apunta a la landing con referencia del comercial
        const qrData = `${process.env.FRONTEND_URL || 'http://localhost:5174'}/?ref=${commercialCode}`;

        // Generar QR como Data URL para guardar en DB
        const qrCodeUrl = await QRCode.toDataURL(qrData);

        // 3. Crear perfil comercial
        await client.query(
            'INSERT INTO commercial_profiles (user_id, commercial_code, phone, qr_code_url) VALUES ($1, $2, $3, $4)',
            [userId, commercialCode, phone, qrCodeUrl]
        );

        await client.query('COMMIT');

        // 4. Enviar email de bienvenida (fuera de la transacción para que no bloquee la creación)
        try {
            await sendCommercialWelcomeEmail(
                { email, full_name, username, password }
            );
        } catch (emailError) {
            console.error('Error sending welcome email (comercial creado correctamente):', emailError);
        }

        res.status(201).json({
            message: 'Comercial creado exitosamente',
            commercial: {
                id: userId,
                username,
                email,
                full_name,
                commercialCode,
                qrCodeUrl
            }
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating commercial:', error);
        res.status(500).json({ error: 'Error al crear comercial: ' + error.message });
    } finally {
        client.release();
    }
};

// Obtener todos los comerciales
const getAllCommercials = async (req, res) => {
    try {
        const result = await db.query(`
            SELECT u.id, u.email, u.name, u.created_at,
                   cp.commercial_code, cp.phone, cp.qr_code_url
            FROM users u
            LEFT JOIN commercial_profiles cp ON u.id = cp.user_id
            WHERE u.role = 'commercial'
            ORDER BY u.created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error getting commercials:', error);
        res.status(500).json({ error: 'Error al obtener comerciales' });
    }
};

// Obtener comercial por ID
const getCommercialById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query(`
            SELECT u.id, u.email, u.name, u.created_at,
                   cp.commercial_code, cp.phone, cp.qr_code_url
            FROM users u
            LEFT JOIN commercial_profiles cp ON u.id = cp.user_id
            WHERE u.id = $1 AND u.role = 'commercial'
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Comercial no encontrado' });
        }

        // Obtener estadísticas de leads
        const leadsResult = await db.query(`
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won,
                   SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new_leads
            FROM leads 
            WHERE assigned_commercial_id = $1
        `, [id]);

        res.json({
            ...result.rows[0],
            stats: {
                total_leads: parseInt(leadsResult.rows[0].total) || 0,
                won_leads: parseInt(leadsResult.rows[0].won) || 0,
                new_leads: parseInt(leadsResult.rows[0].new_leads) || 0
            }
        });
    } catch (error) {
        console.error('Error getting commercial:', error);
        res.status(500).json({ error: 'Error al obtener comercial' });
    }
};

// Eliminar comercial
const deleteCommercial = async (req, res) => {
    const { id } = req.params;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // Verificar que existe
        const checkResult = await client.query(
            'SELECT id FROM users WHERE id = $1 AND role = $2',
            [id, 'commercial']
        );

        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Comercial no encontrado' });
        }

        // Eliminar perfil comercial
        await client.query('DELETE FROM commercial_profiles WHERE user_id = $1', [id]);

        // Eliminar usuario
        await client.query('DELETE FROM users WHERE id = $1', [id]);

        await client.query('COMMIT');

        res.json({ message: 'Comercial eliminado correctamente' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error deleting commercial:', error);
        res.status(500).json({ error: 'Error al eliminar comercial' });
    } finally {
        client.release();
    }
};

// Obtener estadísticas del dashboard (para el comercial logueado)
const getDashboardStats = async (req, res) => {
    const userId = req.user.userId || req.user.id;

    try {
        // Obtener perfil comercial
        const profileResult = await db.query(
            'SELECT commercial_code, qr_code_url FROM commercial_profiles WHERE user_id = $1',
            [userId]
        );

        // Obtener leads asignados
        const leadsResult = await db.query(`
            SELECT COUNT(*) as total,
                   SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won
            FROM leads WHERE assigned_commercial_id = $1
        `, [userId]);

        // Obtener leads recientes
        const recentLeadsResult = await db.query(`
            SELECT id, name, email, status, created_at
            FROM leads 
            WHERE assigned_commercial_id = $1
            ORDER BY created_at DESC
            LIMIT 5
        `, [userId]);

        res.json({
            profile: profileResult.rows[0] || {},
            leads: {
                total: parseInt(leadsResult.rows[0].total) || 0,
                won: parseInt(leadsResult.rows[0].won) || 0
            },
            recent_leads: recentLeadsResult.rows,
            commissions: {
                current_month: 0,
                total_earned: 0
            }
        });
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
};

// Reenviar email de bienvenida
const resendWelcomeEmail = async (req, res) => {
    const { id } = req.params;

    try {
        // Obtener datos del comercial
        const result = await db.query(`
            SELECT u.email, u.name, cp.commercial_code
            FROM users u
            JOIN commercial_profiles cp ON u.id = cp.user_id
            WHERE u.id = $1 AND u.role = 'commercial'
        `, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Comercial no encontrado' });
        }

        const commercial = result.rows[0];

        // Nota: No podemos recuperar la contraseña original (está hasheada)
        // El email se enviará sin contraseña, solo con el recordatorio de acceso
        await sendCommercialWelcomeEmail({
            email: commercial.email,
            full_name: commercial.full_name,
            username: commercial.username,
            password: '(contacta con el administrador si olvidaste tu contraseña)'
        });

        res.json({ message: 'Email de bienvenida reenviado correctamente' });
    } catch (error) {
        console.error('Error resending welcome email:', error);
        res.status(500).json({ error: 'Error al reenviar email' });
    }
};

// Actualizar comercial
const updateCommercial = async (req, res) => {
    const { id } = req.params;
    const { full_name, email, phone, username, password } = req.body;
    const client = await db.pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Verificar si el comercial existe
        const userCheck = await client.query('SELECT id FROM users WHERE id = $1 AND role = $2', [id, 'commercial']);
        if (userCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Comercial no encontrado' });
        }

        // 2. Verificar si el nuevo username o email ya existen (excluyendo al propio usuario)
        const duplicateCheck = await client.query(
            'SELECT id FROM users WHERE (username = $1 OR email = $2) AND id != $3',
            [username, email, id]
        );
        if (duplicateCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'El usuario o email ya está en uso' });
        }

        // 3. Actualizar tabla users
        let userUpdateQuery = 'UPDATE users SET full_name = $1, email = $2, username = $3';
        let userUpdateParams = [full_name, email, username];
        let paramIndex = 4;

        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            userUpdateQuery += `, password = $${paramIndex}`;
            userUpdateParams.push(hashedPassword);
            paramIndex++;
        }

        userUpdateQuery += ` WHERE id = $${paramIndex}`;
        userUpdateParams.push(id);

        await client.query(userUpdateQuery, userUpdateParams);

        // 4. Actualizar tabla commercial_profiles (phone)
        await client.query(
            'UPDATE commercial_profiles SET phone = $1 WHERE user_id = $2',
            [phone, id]
        );

        await client.query('COMMIT');

        res.json({ message: 'Comercial actualizado correctamente' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error updating commercial:', error);
        res.status(500).json({ error: 'Error al actualizar comercial' });
    } finally {
        client.release();
    }
};

module.exports = {
    createCommercial,
    getAllCommercials,
    getCommercialById,
    updateCommercial,
    deleteCommercial,
    getDashboardStats,
    resendWelcomeEmail
};
