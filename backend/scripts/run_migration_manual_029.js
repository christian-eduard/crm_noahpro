const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    user: process.env.DB_USER || 'cex',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'leads_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
});

async function runMigration() {
    try {
        const sql = fs.readFileSync(path.join(__dirname, '../migrations/029_create_prospect_notes_and_demos.sql'), 'utf8');
        await pool.query(sql);
        console.log('Migration 029 ran successfully');
    } catch (err) {
        console.error('Error running migration 029:', err);
    } finally {
        await pool.end();
    }
}

runMigration();
