const fetch = require('node-fetch');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: './backend/.env' });

const API_URL = 'http://localhost:3002/api';
const SECRET = process.env.JWT_SECRET || 'development_secret_key_123';

async function test() {
    // 1. Generate Admin Token (simulating login)
    // User ID 4 is admin based on check_db.js
    const token = jwt.sign({ userId: 4, role: 'admin' }, SECRET, { expiresIn: '1h' });
    console.log('Generated Token:', token);

    // 2. Fetch Commercials
    try {
        const response = await fetch(`${API_URL}/commercials`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        console.log('Status:', response.status);
        if (response.ok) {
            const data = await response.json();
            console.log('Commercials:', JSON.stringify(data, null, 2));
        } else {
            console.log('Error:', await response.text());
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

test();
