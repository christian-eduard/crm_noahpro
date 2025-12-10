require('dotenv').config({ path: '../.env' });
const { createCommercial } = require('../controllers/commercialController');
const db = require('../config/database');
const fs = require('fs');
const path = require('path');

// Mock request and response
const req = {
    body: {
        username: `test_comm_${Date.now()}`,
        password: 'password123',
        email: `test_comm_${Date.now()}@example.com`,
        full_name: 'Test Comercial',
        phone: '123456789'
    },
    user: { id: 1 } // Mock admin user
};

const res = {
    status: function (code) {
        this.statusCode = code;
        return this;
    },
    json: function (data) {
        console.log('Response Status:', this.statusCode);
        console.log('Response Data:', data);

        if (this.statusCode === 201) {
            console.log('✅ Comercial creado exitosamente');
            verifyCreation(data.commercial);
        } else {
            console.error('❌ Error al crear comercial');
        }
    }
};

async function verifyCreation(commercial) {
    try {
        // 1. Verificar DB
        const userRes = await db.query('SELECT * FROM users WHERE id = $1', [commercial.id]);
        if (userRes.rows.length > 0) console.log('✅ Usuario encontrado en DB');
        else console.error('❌ Usuario NO encontrado en DB');

        const profileRes = await db.query('SELECT * FROM commercial_profiles WHERE user_id = $1', [commercial.id]);
        if (profileRes.rows.length > 0) {
            console.log('✅ Perfil comercial encontrado en DB');
            console.log('   Código:', profileRes.rows[0].commercial_code);
            console.log('   QR URL:', profileRes.rows[0].qr_code_url ? 'Generado' : 'Falta');
        } else {
            console.error('❌ Perfil comercial NO encontrado en DB');
        }

        // 2. Verificar PDF
        const tempDir = path.join(__dirname, '../temp');
        const files = fs.readdirSync(tempDir);
        const pdfFile = files.find(f => f.startsWith(`tarjeta_${commercial.commercialCode}`) && f.endsWith('.pdf'));

        if (pdfFile) {
            console.log('✅ PDF de tarjeta generado:', pdfFile);
        } else {
            console.error('❌ PDF de tarjeta NO encontrado en', tempDir);
        }

    } catch (error) {
        console.error('Error en verificación:', error);
    } finally {
        process.exit();
    }
}

// Ejecutar prueba
console.log('Iniciando prueba de creación de comercial...');
createCommercial(req, res);
