-- Migration: Link prospects to search history and add AI strategy
-- Fecha: 2025-12-18

-- 1. Add search_id to maps_prospects to link to hunter_search_history
ALTER TABLE maps_prospects 
ADD COLUMN IF NOT EXISTS search_id INTEGER REFERENCES hunter_search_history(id) ON DELETE SET NULL;

-- 2. Add strategy column for AI Analysis
ALTER TABLE maps_prospects 
ADD COLUMN IF NOT EXISTS strategy VARCHAR(50);

-- 3. Create index for faster filtering by search session
CREATE INDEX IF NOT EXISTS idx_maps_prospects_search_id ON maps_prospects(search_id);

-- 4. Comment on columns
COMMENT ON COLUMN maps_prospects.search_id IS 'ID de la sesión de búsqueda (hunter_search_history) donde se encontró este prospecto';
COMMENT ON COLUMN maps_prospects.strategy IS 'Estrategia de análisis IA utilizada (ej. verifactu, general, aggressive)';
