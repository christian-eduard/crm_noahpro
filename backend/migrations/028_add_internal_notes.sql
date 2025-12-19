-- Add internal_notes column to maps_prospects
ALTER TABLE maps_prospects ADD COLUMN IF NOT EXISTS internal_notes TEXT;
