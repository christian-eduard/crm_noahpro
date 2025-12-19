const db = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const login = async (req, res) => {
    try {
        const { email, username, password } = req.body;
        const loginIdentifier = email || username;

        if (!loginIdentifier || !password) {
            return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
        }

        // Buscar usuario por username O email en tabla users (unificada)
        const result = await db.query(
            'SELECT * FROM users WHERE username = $1 OR email = $1',
            [loginIdentifier]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];

        // Verificar password con password_hash
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.username, role: user.role, type: 'crm_user' },
            process.env.JWT_SECRET || 'crm_secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                name: user.full_name || user.username,
                role: user.role,
                full_name: user.full_name || user.username,
                email: user.email,
                avatar_url: user.avatar_url,
                notifications_enabled: user.notifications_enabled !== false,
                has_lead_hunter_access: user.has_lead_hunter_access
            }
        });
    } catch (error) {
        console.error('Error en login CRM:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { login };

