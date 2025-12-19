const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, '../migrations/023_create_hunter_strategies.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration 023...');
        await db.query(sql);
        console.log('Migration 023 completed successfully.');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

runMigration();
