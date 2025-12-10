-- Migración: Crear tabla de configuración CRM
-- Fecha: 2025-12-03

CREATE TABLE IF NOT EXISTS crm_settings (
    id SERIAL PRIMARY KEY,
    demo_url VARCHAR(500) DEFAULT 'http://localhost:5173/demo',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar configuración por defecto
INSERT INTO crm_settings (demo_url) 
VALUES ('http://localhost:5173/demo')
ON CONFLICT DO NOTHING;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_crm_settings_updated ON crm_settings(updated_at DESC);
