-- Migration: Add embeddings for RAG (Retrieval Augmented Generation)
-- Para Tarea 4: Base de Conocimiento RAG + Competencia

-- Verificar si pgvector está disponible (sin error si no existe)
-- CREATE EXTENSION IF NOT EXISTS vector;

-- Añadir columna de embedding a maps_prospects (si no existe)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'maps_prospects' AND column_name = 'embedding') THEN
        ALTER TABLE maps_prospects ADD COLUMN embedding TEXT; -- Usar TEXT si pgvector no está disponible
    END IF;
END $$;

-- Columna para análisis de competencia
ALTER TABLE maps_prospects ADD COLUMN IF NOT EXISTS competitor_analysis JSONB;

-- Columna para servicios detectados (needs_tpv, needs_web, etc.)
ALTER TABLE maps_prospects ADD COLUMN IF NOT EXISTS detected_opportunities JSONB;

-- Índice para búsqueda de competidores por zona
CREATE INDEX IF NOT EXISTS idx_prospects_location_zone 
ON maps_prospects(city, business_type);

-- Tabla para almacenar resúmenes vectorizados (fallback si no hay pgvector)
CREATE TABLE IF NOT EXISTS prospect_knowledge_base (
    id SERIAL PRIMARY KEY,
    prospect_id INT REFERENCES maps_prospects(id) ON DELETE CASCADE,
    summary_text TEXT NOT NULL,
    embedding_data TEXT, -- JSON array de floats como fallback
    business_category VARCHAR(100),
    location VARCHAR(255),
    quality_score INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_knowledge_prospect ON prospect_knowledge_base(prospect_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_location ON prospect_knowledge_base(location);
