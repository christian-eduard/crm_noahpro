const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'cex',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'leads_db',
    password: process.env.DB_PASSWORD || null,
    port: process.env.DB_PORT || 5432,
});

async function runMigration() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', '010_add_company_settings.sql'), 'utf8');
        console.log('Running migration 010_add_company_settings.sql...');
        await pool.query(sql);
        console.log('Migration applied successfully.');
    } catch (err) {
        console.error('Error applying migration:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
