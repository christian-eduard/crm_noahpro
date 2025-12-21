
const db = require('./config/database');
const path = require('path');
require('dotenv').config();

async function checkAndFixUsers() {
    try {
        console.log("Checking users...");
        const res = await db.query('SELECT id, username, email, role, has_lead_hunter_access FROM users');
        console.table(res.rows);

        if (res.rows.length > 0) {
            console.log("Granting access to all users...");
            await db.query('UPDATE users SET has_lead_hunter_access = true, hunter_daily_limit = 100');
            console.log("Access granted.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        // Force exit because db pool keeps alive
        process.exit(0);
    }
}

checkAndFixUsers();
