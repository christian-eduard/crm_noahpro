-- Migración: Añadir assigned_commercial_id a leads
-- Fecha: 2025-12-10

-- Añadir columna para vincular leads con comerciales
ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_commercial_id INTEGER REFERENCES users(id) ON DELETE SET NULL;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_leads_assigned_commercial ON leads(assigned_commercial_id);

-- Añadir columna commercial_code para referencia manual
ALTER TABLE leads ADD COLUMN IF NOT EXISTS commercial_code VARCHAR(50);
