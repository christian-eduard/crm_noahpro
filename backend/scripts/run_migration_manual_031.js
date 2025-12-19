const { pool } = require('../config/database');

async function runMigration() {
    const client = await pool.connect();
    try {
        console.log('Iniciando migración: Añadiendo prospect_id a proposals...');

        await client.query('BEGIN');

        // Añadir columna prospect_id
        await client.query(`
            ALTER TABLE proposals 
            ADD COLUMN IF NOT EXISTS prospect_id INTEGER REFERENCES maps_prospects(id) ON DELETE SET NULL
        `);

        // Añadir índice para búsquedas rápidas
        await client.query(`
            CREATE INDEX IF NOT EXISTS idx_proposals_prospect_id ON proposals(prospect_id)
        `);

        await client.query('COMMIT');
        console.log('Migración completada con éxito.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error en la migración:', err);
    } finally {
        client.release();
        process.exit();
    }
}

runMigration();
