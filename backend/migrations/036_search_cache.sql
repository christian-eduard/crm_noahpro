-- Migration: Search Cache for Google Places API cost reduction
-- Para Tarea 6: Smart Cache & Deduplicación Geográfica

CREATE TABLE IF NOT EXISTS search_cache_logs (
    id SERIAL PRIMARY KEY,
    query_hash VARCHAR(64) UNIQUE NOT NULL, -- MD5 de keyword+location
    keyword VARCHAR(255) NOT NULL,
    location VARCHAR(255) NOT NULL,
    radius INT DEFAULT 5000,
    
    -- Cached response
    google_response_json JSONB, -- Cached Google Places response
    place_ids_found TEXT[], -- Array of place_ids for quick dedup check
    results_count INT DEFAULT 0,
    
    -- TTL & Expiry
    expires_at TIMESTAMP NOT NULL,
    ttl_days INT DEFAULT 30,
    
    -- Stats
    hit_count INT DEFAULT 0,
    last_hit_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_search_cache_hash ON search_cache_logs(query_hash);
CREATE INDEX IF NOT EXISTS idx_search_cache_expires ON search_cache_logs(expires_at);
CREATE INDEX IF NOT EXISTS idx_search_cache_keyword ON search_cache_logs(keyword, location);

-- Function to clean expired cache entries (run periodically)
CREATE OR REPLACE FUNCTION clean_expired_search_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM search_cache_logs WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Table for tracking API costs
CREATE TABLE IF NOT EXISTS api_cost_tracking (
    id SERIAL PRIMARY KEY,
    api_name VARCHAR(50) NOT NULL, -- 'google_places', 'gemini', 'openai'
    operation VARCHAR(50) NOT NULL, -- 'search', 'analyze', 'embed'
    
    -- Cost info
    request_count INT DEFAULT 1,
    estimated_cost DECIMAL(10,4) DEFAULT 0,
    
    -- Cache info
    was_cached BOOLEAN DEFAULT FALSE,
    cache_hit_rate DECIMAL(5,2),
    
    -- Timestamp
    date DATE DEFAULT CURRENT_DATE,
    hour INT DEFAULT EXTRACT(HOUR FROM NOW()),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_cost_date ON api_cost_tracking(date, api_name);
