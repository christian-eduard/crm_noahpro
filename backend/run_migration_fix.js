
const db = require('./config/database');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
    try {
        console.log("Running migration...");
        const sql = fs.readFileSync(path.join(__dirname, 'migrations', '032_update_training_materials_schema.sql'), 'utf-8');
        await db.query(sql);
        console.log("Migration executed successfully.");
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

runMigration();
