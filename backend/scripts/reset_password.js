const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://cex@localhost:5432/leads_db'
});

async function resetPassword() {
    try {
        const password = 'admin';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        await pool.query(
            'UPDATE crm_users SET password_hash = $1 WHERE username = $2',
            [hash, 'admin']
        );

        console.log('Password reset successfully for user admin');
        process.exit(0);
    } catch (error) {
        console.error('Error resetting password:', error);
        process.exit(1);
    }
}

resetPassword();
