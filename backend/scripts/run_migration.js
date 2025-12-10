const db = require('../config/database');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '../.env' });

const runMigration = async () => {
    try {
        const sqlPath = path.join(__dirname, '../migrations/create_commercial_tables.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Ejecutando migración:', sqlPath);
        await db.query(sql);
        console.log('✅ Migración ejecutada exitosamente');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error al ejecutar migración:', error);
        process.exit(1);
    }
};

runMigration();
