const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { generateLeadsExcel } = require('../services/excelService');
const path = require('path');

/**
 * @swagger
 * /api/export/leads/excel:
 *   get:
 *     summary: Exportar leads a Excel
 *     tags: [Export]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [all, new, contacted, qualified, proposal_sent, won, lost]
 *         description: Filtrar por estado
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre, email o empresa
 *     responses:
 *       200:
 *         description: Archivo Excel descargado
 *         content:
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema:
 *               type: string
 *               format: binary
 *       500:
 *         description: Error al exportar
 */
// Export leads to Excel
router.get('/leads/excel', async (req, res) => {
    try {
        const { status, search } = req.query;
        let query = 'SELECT * FROM leads WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (status && status !== 'all') {
            query += ` AND status = $${paramIndex}`;
            params.push(status);
            paramIndex++;
        }

        if (search) {
            query += ` AND (name ILIKE $${paramIndex} OR email ILIKE $${paramIndex} OR business_name ILIKE $${paramIndex})`;
            params.push(`%${search}%`);
        }

        query += ' ORDER BY created_at DESC';

        const result = await db.query(query, params);
        const leads = result.rows;

        const { filePath, fileName } = await generateLeadsExcel(leads);

        res.download(filePath, fileName, (err) => {
            if (err) {
                console.error('Error downloading file:', err);
            }
            // Clean up temp file after download
            const fs = require('fs');
            setTimeout(() => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }, 5000);
        });
    } catch (error) {
        console.error('Error exporting leads:', error);
        res.status(500).json({ error: 'Error al exportar leads' });
    }
});

module.exports = router;
