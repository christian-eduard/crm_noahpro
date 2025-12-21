-- Migration 033: Add Opportunity Scoring Fields
-- Adds fields for AI Sales Brain opportunity detection

-- Add opportunity score (0-100) for sales opportunity ranking
ALTER TABLE maps_prospects 
ADD COLUMN IF NOT EXISTS opportunity_score INTEGER DEFAULT 0;

-- Add digital gaps detected (array of strings)
ALTER TABLE maps_prospects 
ADD COLUMN IF NOT EXISTS digital_gaps JSONB DEFAULT '[]';

-- Add suggested product based on profile
ALTER TABLE maps_prospects 
ADD COLUMN IF NOT EXISTS suggested_product VARCHAR(100);

-- Add estimated deal value in euros
ALTER TABLE maps_prospects 
ADD COLUMN IF NOT EXISTS estimated_value INTEGER;

-- Add opportunity category for sorting
ALTER TABLE maps_prospects 
ADD COLUMN IF NOT EXISTS opportunity_category VARCHAR(20) DEFAULT 'low';

-- Add competitors data for zone comparison
ALTER TABLE maps_prospects 
ADD COLUMN IF NOT EXISTS competitors_data JSONB DEFAULT '{}';

-- Create index for opportunity score sorting
CREATE INDEX IF NOT EXISTS idx_prospects_opportunity_score 
ON maps_prospects(opportunity_score DESC);

-- Create index for opportunity category
CREATE INDEX IF NOT EXISTS idx_prospects_opportunity_category 
ON maps_prospects(opportunity_category);

-- Comment for documentation
COMMENT ON COLUMN maps_prospects.opportunity_score IS 'Sales opportunity score 0-100, higher = better lead';
COMMENT ON COLUMN maps_prospects.digital_gaps IS 'Array of detected gaps: ["no_web", "no_social", "no_delivery"]';
COMMENT ON COLUMN maps_prospects.suggested_product IS 'AI suggested product: tpv, web, marketing, pack_completo';
COMMENT ON COLUMN maps_prospects.estimated_value IS 'Estimated deal value in euros';
COMMENT ON COLUMN maps_prospects.opportunity_category IS 'Category: hot, good, work_needed, low';
COMMENT ON COLUMN maps_prospects.competitors_data IS 'Zone competition data: {count, ranking, unique_gaps}';
