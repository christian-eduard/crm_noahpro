const db = require('../config/database');

const up = async () => {
    await db.query(`
        CREATE TABLE IF NOT EXISTS lead_statuses (
            id SERIAL PRIMARY KEY,
            name VARCHAR(50) NOT NULL,
            color VARCHAR(20) NOT NULL DEFAULT 'gray',
            icon VARCHAR(50) NOT NULL DEFAULT 'Star',
            position INT NOT NULL DEFAULT 0,
            is_system BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    // Insert default system statuses
    await db.query(`
        INSERT INTO lead_statuses (name, color, icon, position, is_system) VALUES
        ('Nuevo', 'blue', 'Star', 1, true),
        ('Contactado', 'yellow', 'Phone', 2, false),
        ('Calificado', 'purple', 'Target', 3, false),
        ('Propuesta Enviada', 'orange', 'FileText', 4, false),
        ('Ganado', 'green', 'Award', 5, true),
        ('Perdido', 'red', 'Ban', 6, true)
        ON CONFLICT DO NOTHING
    `);

    console.log('Lead statuses table created and seeded');
};

const down = async () => {
    await db.query('DROP TABLE IF EXISTS lead_statuses');
};

module.exports = { up, down };
