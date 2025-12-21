-- Fase 7: Preparación Storm boys Gateway
-- Añadir configuración para el futuro Gateway de IA

ALTER TABLE hunter_user_settings
ADD COLUMN stormsboys_api_key VARCHAR(255),
ADD COLUMN use_stormsboys_gateway BOOLEAN DEFAULT false,
ADD COLUMN gateway_endpoint VARCHAR(255) DEFAULT 'https://api.stormsboys.com/v1';

COMMENT ON COLUMN hunter_user_settings.stormsboys_api_key IS 'API Key para conectar con Stormsboys Gateway (futuro)';
COMMENT ON COLUMN hunter_user_settings.use_stormsboys_gateway IS 'Toggle para activar el uso del Gateway en lugar de la IA directa';
