
const db = require('./config/database');
const path = require('path');
require('dotenv').config();

async function checkTable() {
    try {
        console.log("Checking tables...");
        const res = await db.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='training_materials'");
        if (res.rows.length > 0) {
            console.log("Table training_materials EXISTS.");
            // Check columns
            const cols = await db.query("SELECT column_name FROM information_schema.columns WHERE table_name='training_materials'");
            console.log("Columns:", cols.rows.map(r => r.column_name).join(', '));
        } else {
            console.log("Table training_materials DOES NOT EXIST.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

checkTable();
