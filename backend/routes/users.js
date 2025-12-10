const express = require('express');
const router = express.Router();
const { getUsers, createUser, updateUser, deleteUser, getProfile, updateProfile } = require('../controllers/usersController');
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

// Update user
router.put('/:id', updateUser);

// Delete user
router.delete('/:id', deleteUser);

module.exports = router;
