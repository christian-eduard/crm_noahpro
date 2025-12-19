const db = require('../config/database');

async function runMigration() {
    console.log('--- Iniciando Migración: Añadir columna reviews a maps_prospects ---');
    try {
        // Añadir columna reviews (jsonb)
        await db.query(`
            ALTER TABLE maps_prospects 
            ADD COLUMN IF NOT EXISTS reviews jsonb DEFAULT '[]'::jsonb;
        `);
        console.log('✅ Columna reviews añadida con éxito.');

        console.log('--- Migración Completada ---');
    } catch (error) {
        console.error('❌ Error en la migración:', error);
        process.exit(1);
    } finally {
        process.exit(0);
    }
}

runMigration();
