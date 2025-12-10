const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const seedCrmUser = async () => {
    const client = await pool.connect();
    try {
        console.log('🔧 Creando usuario CRM...');
        const hashedPassword = await bcrypt.hash('crm2025', 10);

        await client.query(
            "INSERT INTO crm_users (username, password_hash, role) VALUES ($1, $2, $3) ON CONFLICT (username) DO UPDATE SET password_hash = $2",
            ['admin', hashedPassword, 'admin']
        );

        console.log('✅ Usuario CRM creado: admin / crm2025');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        client.release();
        pool.end();
    }
};

seedCrmUser();
