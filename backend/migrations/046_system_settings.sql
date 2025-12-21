-- Tabla para configuraciones globales del sistema (Key-Value)
CREATE TABLE IF NOT EXISTS system_settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT,
    setting_type VARCHAR(50) DEFAULT 'string', -- string, boolean, json, number
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar configuraciones por defecto para Gateway
INSERT INTO system_settings (setting_key, setting_value, setting_type, description)
VALUES 
    ('ai_provider_mode', 'direct', 'string', 'Modo de operación de IA: direct (local/gemini) o stormsboys_gateway'),
    ('gateway_url', 'https://api.stormsboys-gateway.com/v1', 'string', 'URL del endpoint del Gateway'),
    ('gateway_api_key', '', 'string', 'API Key para autenticación en el Gateway')
ON CONFLICT (setting_key) DO NOTHING;
