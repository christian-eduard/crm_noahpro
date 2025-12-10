const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.LEADS_DATABASE_URL || 'postgresql://cex@localhost:5432/leads_db'
});

async function migrateCrmUsersToUsers() {
    try {
        console.log('Starting migration from crm_users to users...');

        // Get all users from crm_users
        const result = await pool.query('SELECT * FROM crm_users');
        const crmUsers = result.rows;

        console.log(`Found ${crmUsers.length} users in crm_users table`);

        if (crmUsers.length === 0) {
            console.log('No users to migrate');
            await pool.end();
            return;
        }

        // Insert each user into the users table
        for (const user of crmUsers) {
            try {
                // Check if user already exists in users table
                const existingUser = await pool.query(
                    'SELECT id FROM users WHERE username = $1 OR email = $2',
                    [user.username, user.email]
                );

                if (existingUser.rows.length > 0) {
                    console.log(`User ${user.username} already exists in users table, skipping...`);
                    continue;
                }

                // Insert user into users table
                await pool.query(
                    `INSERT INTO users (username, password, email, full_name, role, created_at, updated_at)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        user.username,
                        user.password_hash, // password_hash from crm_users becomes password in users
                        user.email || `${user.username}@example.com`,
                        user.full_name || user.username,
                        user.role || 'admin',
                        user.created_at || new Date(),
                        user.updated_at || new Date()
                    ]
                );

                console.log(`✓ Migrated user: ${user.username}`);
            } catch (error) {
                console.error(`Error migrating user ${user.username}:`, error.message);
            }
        }

        console.log('Migration completed successfully!');
        await pool.end();
    } catch (error) {
        console.error('Migration error:', error);
        await pool.end();
        process.exit(1);
    }
}

migrateCrmUsersToUsers();
