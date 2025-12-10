-- Migración: Crear tabla de eventos de calendario
-- Fecha: 2025-12-03

CREATE TABLE IF NOT EXISTS calendar_events (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    type VARCHAR(50) DEFAULT 'meeting',
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    created_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_calendar_events_start ON calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_calendar_events_lead ON calendar_events(lead_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_type ON calendar_events(type);
