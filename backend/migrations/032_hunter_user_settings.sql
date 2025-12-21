-- Migration: Hunter User Settings con Average Ticket Value
-- Para Tarea 1: Scout con Datos Reales (NO hardcoded)

-- Tabla de configuración personalizada por usuario
CREATE TABLE IF NOT EXISTS hunter_user_settings (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    average_ticket_value DECIMAL(10,2) DEFAULT 500.00,
    default_radius INT DEFAULT 5000,
    max_results_per_search INT DEFAULT 20,
    auto_analyze_new BOOLEAN DEFAULT TRUE,
    ignore_existing_prospects BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_hunter_user_settings_user ON hunter_user_settings(user_id);

-- Insertar configuración por defecto para usuarios existentes
INSERT INTO hunter_user_settings (user_id, average_ticket_value)
SELECT id, 500.00 FROM users
ON CONFLICT (user_id) DO NOTHING;
