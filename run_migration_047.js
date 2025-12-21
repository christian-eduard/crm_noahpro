const db = require('./backend/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'backend', 'migrations', '047_recruitment_config.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Ejecutando migración:', sqlPath);
        await db.query(sql);
        console.log('✅ Migración 047 completada exitosamente.');
        console.log('✅ Tablas de Configuración de Reclutamiento creadas:');
        console.log('   - recruitment_templates');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en la migración:', err);
        process.exit(1);
    }
}

runMigration();
