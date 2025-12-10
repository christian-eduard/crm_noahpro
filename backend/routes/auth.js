const express = require('express');
const router = express.Router();
const { login } = require('../controllers/authController');

router.post('/login', login);

router.get('/google', (req, res) => {
    // Mock Google OAuth redirect
    res.redirect('http://localhost:5173/admin/settings?connected=true');
});

module.exports = router;
