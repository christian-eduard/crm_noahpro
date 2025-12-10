const db = require('../config/database');

const up = async () => {
    // Create clients table
    await db.query(`
        CREATE TABLE IF NOT EXISTS clients (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            email VARCHAR(255),
            phone VARCHAR(50),
            nif VARCHAR(50),
            address TEXT,
            city VARCHAR(100),
            postal_code VARCHAR(20),
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
            lead_id INT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
        )
    `);

    // Create client_installations table
    await db.query(`
        CREATE TABLE IF NOT EXISTS client_installations (
            id SERIAL PRIMARY KEY,
            client_id INT NOT NULL,
            domain VARCHAR(255),
            server_ip VARCHAR(50),
            admin_url VARCHAR(255),
            admin_user VARCHAR(255),
            admin_password VARCHAR(255),
            db_name VARCHAR(255),
            db_user VARCHAR(255),
            db_password VARCHAR(255),
            notes TEXT,
            status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'suspended')),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
        )
    `);

    console.log('Clients tables created successfully');
};

const down = async () => {
    await db.query('DROP TABLE IF EXISTS client_installations');
    await db.query('DROP TABLE IF EXISTS clients');
};

module.exports = { up, down };
