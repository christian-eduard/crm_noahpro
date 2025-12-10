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

        // Try to find user by email or username
        const result = await db.query(
            'SELECT * FROM users WHERE email = $1 OR name = $1',
            [loginIdentifier]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const user = result.rows[0];
        const validPassword = await bcrypt.compare(password, user.password);

        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const token = jwt.sign(
            { userId: user.id, username: user.name, email: user.email, role: user.role, type: 'crm_user' },
            process.env.JWT_SECRET || 'crm_secret_key',
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.name,
                name: user.name,
                role: user.role,
                full_name: user.name,
                email: user.email,
                avatar_url: user.avatar,
                notifications_enabled: true
            }
        });
    } catch (error) {
        console.error('Error en login CRM:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { login };
