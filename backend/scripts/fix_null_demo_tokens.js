const db = require('../config/database');
const crypto = require('crypto');

async function fixNullTokens() {
    try {
        console.log('🔍 Buscando demos con tokens nulos o "null"...');

        // Find demos with null or string "null" public_token
        const result = await db.query(`
            SELECT id FROM hunter_demo_history 
            WHERE public_token IS NULL OR public_token = 'null'
        `);

        if (result.rows.length === 0) {
            console.log('✅ No hay demos rotas. Todo correcto.');
            process.exit(0);
        }

        console.log(`⚠️ Encontradas ${result.rows.length} demos rotas. Reparando...`);

        for (const row of result.rows) {
            const newToken = crypto.randomBytes(16).toString('hex');
            await db.query(`
                UPDATE hunter_demo_history 
                SET public_token = $1 
                WHERE id = $2
            `, [newToken, row.id]);
            process.stdout.write('.');
        }

        console.log('\n✅ Reparación completada con éxito.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error fatal:', error);
        process.exit(1);
    }
}

fixNullTokens();
