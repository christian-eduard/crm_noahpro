-- Migración: Agregar configuración de chat
-- Fecha: 2025-12-03

ALTER TABLE crm_settings 
ADD COLUMN IF NOT EXISTS chat_title VARCHAR(255) DEFAULT 'Soporte NoahPro',
ADD COLUMN IF NOT EXISTS chat_welcome_message TEXT DEFAULT '¡Hola! ¿En qué podemos ayudarte hoy?',
ADD COLUMN IF NOT EXISTS chat_primary_color VARCHAR(50) DEFAULT '#0ea5e9',
ADD COLUMN IF NOT EXISTS chat_enabled BOOLEAN DEFAULT TRUE;

-- Actualizar configuración existente si es necesario
UPDATE crm_settings 
SET chat_title = 'Soporte NoahPro',
    chat_welcome_message = '¡Hola! ¿En qué podemos ayudarte hoy?',
    chat_primary_color = '#0ea5e9',
    chat_enabled = TRUE
WHERE chat_title IS NULL;
