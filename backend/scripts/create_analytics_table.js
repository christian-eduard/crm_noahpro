const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://cex@localhost:5432/leads_db'
});

const createAnalyticsTable = async () => {
    try {
        console.log('📊 Creando tabla visitor_analytics...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS visitor_analytics (
                id SERIAL PRIMARY KEY,
                session_id VARCHAR(255),
                page VARCHAR(255),
                referrer TEXT,
                user_agent TEXT,
                ip_address VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
            
            CREATE INDEX IF NOT EXISTS idx_visitor_session ON visitor_analytics(session_id);
            CREATE INDEX IF NOT EXISTS idx_visitor_created ON visitor_analytics(created_at);
        `);

        console.log('✅ Tabla visitor_analytics creada correctamente');
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await pool.end();
    }
};

createAnalyticsTable();
