-- Create prospect_notes table
CREATE TABLE IF NOT EXISTS prospect_notes (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER REFERENCES maps_prospects(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    use_for_analysis BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add public_token to hunter_demo_history for sharing
ALTER TABLE hunter_demo_history 
ADD COLUMN IF NOT EXISTS public_token VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_prospect_notes_prospect_id ON prospect_notes(prospect_id);
CREATE INDEX IF NOT EXISTS idx_hunter_demo_public_token ON hunter_demo_history(public_token);
