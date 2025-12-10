const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const pool = new Pool({
    connectionString: process.env.LEADS_DATABASE_URL || process.env.DATABASE_URL || 'postgresql://cex@localhost:5432/leads_db'
});

const resetDb = async () => {
    try {
        console.log('Connecting to database...');

        // Truncate tables
        console.log('Clearing tables...');
        await pool.query('TRUNCATE TABLE leads CASCADE');
        await pool.query('TRUNCATE TABLE tasks CASCADE');
        await pool.query('TRUNCATE TABLE notifications CASCADE');
        await pool.query('TRUNCATE TABLE calendar_events CASCADE');
        await pool.query('TRUNCATE TABLE proposal_templates CASCADE');
        await pool.query('TRUNCATE TABLE crm_users CASCADE');

        // Create admin user
        console.log('Creating admin user...');
        const username = 'admin';
        const password = 'Zeta10zeta@';
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        await pool.query(
            'INSERT INTO crm_users (username, password_hash, role) VALUES ($1, $2, $3)',
            [username, passwordHash, 'admin']
        );

        console.log('Database reset successfully!');
        console.log(`Admin user created: ${username}`);
        process.exit(0);
    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
};

resetDb();
