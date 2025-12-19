const db = require('../config/database');

async function testConnection() {
    try {
        console.log('Testing DB connection...');
        const res = await db.query('SELECT NOW()');
        console.log('DB Connection Successful:', res.rows[0]);
        process.exit(0);
    } catch (err) {
        console.error('DB Connection Failed:', err);
        process.exit(1);
    }
}

testConnection();
