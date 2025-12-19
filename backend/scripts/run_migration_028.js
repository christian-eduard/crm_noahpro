const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbConfig = {
    user: process.env.DB_USER || 'cex',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'leads_db',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
};

async function runMigration() {
    const client = new Client(dbConfig);
    try {
        await client.connect();
        console.log('Connected to database...');

        const sqlPath = path.join(__dirname, '../migrations/028_add_internal_notes.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration 028_add_internal_notes.sql...');
        await client.query(sql);

        console.log('Migration completed successfully.');
    } catch (err) {
        console.error('Error running migration:', err);
    } finally {
        await client.end();
    }
}

runMigration();
