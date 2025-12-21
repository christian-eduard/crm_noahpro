CREATE TABLE IF NOT EXISTS maps_prospects (id SERIAL PRIMARY KEY); -- Fallback just in case

ALTER TABLE maps_prospects 
ADD COLUMN IF NOT EXISTS latitude NUMERIC(10, 8),
ADD COLUMN IF NOT EXISTS longitude NUMERIC(11, 8);

-- Add index for geo searches
CREATE INDEX IF NOT EXISTS idx_maps_prospects_lat_lng ON maps_prospects (latitude, longitude);
