const { Pool } = require('pg');
require('dotenv').config({ path: './backend/.env' });

const pool = new Pool({
    user: process.env.DB_USER || 'cex',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'leads_db',
    password: process.env.DB_PASSWORD || null,
    port: process.env.DB_PORT || 5432,
});

async function checkCommercials() {
    try {
        const res = await pool.query("SELECT id, username, role, avatar_url FROM users");
        console.log('All Users found:', res.rowCount);
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkCommercials();
