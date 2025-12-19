-- Create table for storing generated demos tracking
CREATE TABLE IF NOT EXISTS hunter_demo_history (
    id SERIAL PRIMARY KEY,
    prospect_id INTEGER REFERENCES maps_prospects(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT NOW(),
    demo_url TEXT, -- Optional: if we generate a persistent link
    user_id INTEGER REFERENCES users(id), -- Who generated it
    html_content TEXT -- Optional: store the HTML content if needed for re-viewing without regenerating
);

-- Add demo_generated_at to maps_prospects for quick access to "last generated"
ALTER TABLE maps_prospects ADD COLUMN IF NOT EXISTS demo_generated_at TIMESTAMP;
