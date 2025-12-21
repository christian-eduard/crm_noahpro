-- Migration: 034_ai_gateway_config.sql
-- Description: Add AI Gateway configuration for Stormsboys integration
-- Date: 2025-12-21

-- Create global settings table if not exists (for centralized config)
CREATE TABLE IF NOT EXISTS system_settings (
    id SERIAL PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type VARCHAR(20) DEFAULT 'string', -- string, json, encrypted, boolean
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert AI Gateway configuration settings
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
('ai_provider_mode', 'direct', 'string', 'AI Provider mode: direct (Gemini) or stormsboys_gateway'),
('gateway_url', 'https://api.stormsboys-gateway.com/v1', 'string', 'Stormsboys AI Gateway URL'),
('gateway_api_key', '', 'encrypted', 'Encrypted API key for Stormsboys Gateway'),
('gateway_enabled', 'false', 'boolean', 'Whether Stormsboys Gateway is enabled'),
('redis_url', 'redis://localhost:6379', 'string', 'Redis connection URL for BullMQ queues')
ON CONFLICT (setting_key) DO NOTHING;

-- Also add to hunter_api_config for backward compatibility
ALTER TABLE hunter_api_config
ADD COLUMN IF NOT EXISTS provider_mode VARCHAR(50) DEFAULT 'direct';

ALTER TABLE hunter_api_config
ADD COLUMN IF NOT EXISTS gateway_url TEXT;

ALTER TABLE hunter_api_config
ADD COLUMN IF NOT EXISTS gateway_api_key TEXT;

-- Update existing Gemini config
UPDATE hunter_api_config 
SET provider_mode = 'direct'
WHERE api_name = 'gemini_vertex' AND provider_mode IS NULL;

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);

-- Add comment
COMMENT ON TABLE system_settings IS 'Centralized system configuration for AI Gateway, Redis, and other services';
