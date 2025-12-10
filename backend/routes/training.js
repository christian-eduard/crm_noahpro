const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticateToken, isAdmin } = require('../middleware/authMiddleware');
const {
    getAllMaterials,
    getMaterialsForCommercial,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial
} = require('../controllers/trainingController');

// Configurar multer para subida de archivos
const uploadDir = path.join(__dirname, '../public/uploads/training');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = /pdf|doc|docx|xls|xlsx|ppt|pptx|mp4|webm|jpg|jpeg|png|gif/;
        const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        if (ext) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no permitido'));
        }
    }
});

// Rutas admin
router.get('/', authenticateToken, isAdmin, getAllMaterials);
router.post('/', authenticateToken, isAdmin, upload.single('file'), createMaterial);
router.put('/:id', authenticateToken, isAdmin, updateMaterial);
router.delete('/:id', authenticateToken, isAdmin, deleteMaterial);

// Rutas comercial
router.get('/my', authenticateToken, getMaterialsForCommercial);
router.get('/:id', authenticateToken, getMaterialById);

module.exports = router;
