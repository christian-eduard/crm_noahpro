const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, getProfile, updateProfile, generateReferralCode } = require('../controllers/usersController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All routes require authentication
router.use(protect);

// Pre-flight check for profile upload
router.options('/profile', (req, res) => res.sendStatus(200));

// Profile routes
router.get('/profile', getProfile);
router.put('/profile', upload.single('avatar'), updateProfile);

// Get all users
router.get('/', getUsers);

// Create new user
router.post('/', createUser);

// Generate referral code for user
router.post('/:id/generate-referral', generateReferralCode);

// Update user
router.put('/:id', updateUser);

// Update user permissions (admin only)
router.patch('/:id/permissions', async (req, res) => {
    try {
        const { id } = req.params;
        const { can_make_calls, can_access_dojo, can_export_data } = req.body;

        // Verificar que el usuario actual es admin
        if (req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Solo los administradores pueden modificar permisos' });
        }

        // Verificar que no se está intentando modificar a sí mismo
        if (parseInt(id) === req.user.id) {
            return res.status(400).json({ error: 'No puedes modificar tus propios permisos' });
        }

        const db = require('../config/database');

        // Construir la query dinámicamente solo con los campos proporcionados
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (typeof can_make_calls === 'boolean') {
            updates.push(`can_make_calls = $${paramCount}`);
            values.push(can_make_calls);
            paramCount++;
        }
        if (typeof can_access_dojo === 'boolean') {
            updates.push(`can_access_dojo = $${paramCount}`);
            values.push(can_access_dojo);
            paramCount++;
        }
        if (typeof can_export_data === 'boolean') {
            updates.push(`can_export_data = $${paramCount}`);
            values.push(can_export_data);
            paramCount++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No se proporcionaron permisos para actualizar' });
        }

        values.push(id);
        const query = `
            UPDATE users 
            SET ${updates.join(', ')}, updated_at = NOW()
            WHERE id = $${paramCount}
            RETURNING id, username, full_name, role, can_make_calls, can_access_dojo, can_export_data
        `;

        const result = await db.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({
            success: true,
            message: 'Permisos actualizados correctamente',
            user: result.rows[0]
        });
    } catch (error) {
        console.error('Error actualizando permisos:', error);
        res.status(500).json({ error: error.message });
    }
});

// Delete user
router.delete('/:id', deleteUser);

module.exports = router;

