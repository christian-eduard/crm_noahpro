-- Add photos column to maps_prospects
ALTER TABLE maps_prospects 
ADD COLUMN IF NOT EXISTS photos JSONB DEFAULT '[]'::jsonb;

-- Comment
COMMENT ON COLUMN maps_prospects.photos IS 'Array de URLs de fotos de Google Places';
