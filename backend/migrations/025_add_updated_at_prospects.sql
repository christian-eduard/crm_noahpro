-- Add updated_at column to maps_prospects
ALTER TABLE maps_prospects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
