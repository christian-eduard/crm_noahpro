const db = require('./backend/config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'backend', 'migrations', '042_ai_talent_hunter.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        console.log('Ejecutando migración:', sqlPath);
        await db.query(sql);
        console.log('✅ Migración 042 completada exitosamente.');
        console.log('✅ Tablas del AI Talent Hunter creadas:');
        console.log('   - interview_templates (plantillas de entrevista)');
        console.log('   - candidates (base de datos de candidatos)');
        console.log('   - interview_invitations (invitaciones únicas)');
        console.log('   - interview_sessions (resultados de entrevistas)');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error en la migración:', err);
        process.exit(1);
    }
}

runMigration();
