-- Agregar soporte para tags y asignación de usuarios
-- Ejecutar con: psql -U cex -d leads_db -f backend/migrations/add_advanced_features.sql

-- Tabla de tags
CREATE TABLE IF NOT EXISTS tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(20) DEFAULT '#3B82F6',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Relación muchos a muchos entre leads y tags
CREATE TABLE IF NOT EXISTS lead_tags (
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (lead_id, tag_id)
);

-- Agregar columna para asignación de usuario a leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES crm_users(id);

-- Agregar columnas para tracking de actividades
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS last_activity_type VARCHAR(50);

-- Tabla de actividades detalladas
CREATE TABLE IF NOT EXISTS activities (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES crm_users(id),
    type VARCHAR(50) NOT NULL, -- 'status_change', 'email_sent', 'note_added', 'call_made', etc.
    description TEXT,
    metadata JSONB, -- Datos adicionales en formato JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_lead_tags_lead ON lead_tags(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_tags_tag ON lead_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_activities_lead ON activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);

-- Insertar algunos tags por defecto
INSERT INTO tags (name, color) VALUES 
    ('Urgente', '#EF4444'),
    ('VIP', '#8B5CF6'),
    ('Seguimiento', '#F59E0B'),
    ('Caliente', '#F97316'),
    ('Frío', '#06B6D4')
ON CONFLICT (name) DO NOTHING;

-- Tabla para reglas de automatización
CREATE TABLE IF NOT EXISTS automation_rules (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    trigger_type VARCHAR(50) NOT NULL, -- 'status_change', 'tag_added', 'time_based', etc.
    trigger_value JSONB, -- Configuración del trigger
    action_type VARCHAR(50) NOT NULL, -- 'send_email', 'assign_user', 'add_tag', etc.
    action_value JSONB, -- Configuración de la acción
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
