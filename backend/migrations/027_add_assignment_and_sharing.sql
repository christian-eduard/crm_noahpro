-- Add assigned_to column to maps_prospects to allow admin to assign prospects to commercials
ALTER TABLE maps_prospects ADD COLUMN IF NOT EXISTS assigned_to INTEGER REFERENCES users(id);

-- Add shared_with column to leads to allow sharing leads between commercials
-- We use an integer array to store multiple user IDs
ALTER TABLE leads ADD COLUMN IF NOT EXISTS shared_with INTEGER[];

-- Add indexes for better performance on these new columns
CREATE INDEX IF NOT EXISTS idx_maps_prospects_assigned_to ON maps_prospects(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_shared_with ON leads USING GIN(shared_with);
