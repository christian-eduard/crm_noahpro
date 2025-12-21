const db = require('./backend/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'backend', 'migrations', '040_voice_ecosystem.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Ejecutando migración:', sqlPath);
        await db.query(sql);
        console.log('✅ Migración 040 completada exitosamente.');
        console.log('✅ Tablas del Ecosistema de Voz creadas:');
        console.log('   - sip_settings (configuración SIP)');
        console.log('   - call_logs (registro de llamadas)');
        console.log('   - dojo_scenarios (escenarios de entrenamiento)');
        console.log('   - dojo_sessions (sesiones del Dojo)');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en la migración:', err);
        process.exit(1);
    }
}

runMigration();
