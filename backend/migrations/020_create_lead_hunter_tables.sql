-- Migración: Sistema Lead Hunter AI
-- Fecha: 2025-12-18
-- Descripción: Tablas y campos para prospección inteligente con IA

-- =====================================================
-- 1. EXTENSIONES A LA TABLA USERS
-- =====================================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS has_lead_hunter_access BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hunter_daily_limit INTEGER DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hunter_prospects_today INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS hunter_last_reset DATE;

-- Dar acceso al admin por defecto
UPDATE users SET has_lead_hunter_access = TRUE WHERE role = 'admin';

-- =====================================================
-- 2. TABLA MAPS_PROSPECTS - Prospectos de Google Maps
-- =====================================================
CREATE TABLE IF NOT EXISTS maps_prospects (
    id SERIAL PRIMARY KEY,
    place_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    website VARCHAR(500),
    email VARCHAR(255),
    rating DECIMAL(2,1),
    reviews_count INTEGER DEFAULT 0,
    address TEXT,
    city VARCHAR(100),
    postal_code VARCHAR(20),
    business_type VARCHAR(100),
    business_types JSONB,  -- Array de tipos de Google
    has_website BOOLEAN DEFAULT FALSE,
    
    -- Análisis de IA
    ai_analysis JSONB,
    ai_priority VARCHAR(20) DEFAULT 'medium',  -- urgent, high, medium, low
    ai_tags INTEGER[],  -- Array de IDs de tags sugeridos
    ai_reasoning TEXT,
    ai_message_subject VARCHAR(255),
    ai_message_body TEXT,
    ai_channel VARCHAR(20) DEFAULT 'email',  -- email, whatsapp
    
    -- Estado de procesamiento
    processed BOOLEAN DEFAULT FALSE,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    outreach_sent BOOLEAN DEFAULT FALSE,
    outreach_sent_at TIMESTAMP,
    
    -- Tracking
    searched_by INTEGER REFERENCES users(id),
    search_query VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    processed_at TIMESTAMP,
    
    -- Índices implícitos por UNIQUE
    CONSTRAINT valid_priority CHECK (ai_priority IN ('urgent', 'high', 'medium', 'low'))
);

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_maps_prospects_searched_by ON maps_prospects(searched_by);
CREATE INDEX IF NOT EXISTS idx_maps_prospects_processed ON maps_prospects(processed);
CREATE INDEX IF NOT EXISTS idx_maps_prospects_priority ON maps_prospects(ai_priority);
CREATE INDEX IF NOT EXISTS idx_maps_prospects_city ON maps_prospects(city);

-- =====================================================
-- 3. TABLA HUNTER_API_CONFIG - Configuración de APIs
-- =====================================================
CREATE TABLE IF NOT EXISTS hunter_api_config (
    id SERIAL PRIMARY KEY,
    api_name VARCHAR(50) UNIQUE NOT NULL,
    api_key TEXT,
    api_secret TEXT,
    config_json JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT FALSE,
    last_tested_at TIMESTAMP,
    test_result VARCHAR(50),  -- success, failed, pending
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by INTEGER REFERENCES users(id)
);

-- Insertar configuraciones iniciales
INSERT INTO hunter_api_config (api_name, config_json, is_active) VALUES
    ('google_places', '{"dailyLimit": 1000, "radius": 5000}', FALSE),
    ('gemini_vertex', '{"model": "gemini-2.0-flash", "temperature": 0.7}', FALSE),
    ('whatsapp_business', '{"phoneNumberId": "", "businessAccountId": ""}', FALSE)
ON CONFLICT (api_name) DO NOTHING;

-- =====================================================
-- 4. TABLA HUNTER_USAGE_STATS - Estadísticas de uso
-- =====================================================
CREATE TABLE IF NOT EXISTS hunter_usage_stats (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    prospects_searched INTEGER DEFAULT 0,
    prospects_analyzed INTEGER DEFAULT 0,
    leads_created INTEGER DEFAULT 0,
    messages_sent_email INTEGER DEFAULT 0,
    messages_sent_whatsapp INTEGER DEFAULT 0,
    UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_hunter_usage_user_date ON hunter_usage_stats(user_id, date);

-- =====================================================
-- 5. TABLA HUNTER_SEARCH_HISTORY - Historial de búsquedas
-- =====================================================
CREATE TABLE IF NOT EXISTS hunter_search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    query VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    business_type VARCHAR(100),
    results_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hunter_search_user ON hunter_search_history(user_id);

-- =====================================================
-- 6. VERIFICAR QUE EXISTAN LOS TAGS NECESARIOS
-- =====================================================
INSERT INTO tags (name, color) VALUES
    ('Restaurante', '#4CAF50'),
    ('Hotel', '#2196F3'),
    ('Retail', '#9C27B0'),
    ('Franquicia', '#FF9800'),
    ('Interesado Verifactu', '#00BCD4'),
    ('Requiere Demo', '#E91E63'),
    ('Sin Web', '#607D8B'),
    ('Lead Hunter', '#FF5722')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================
COMMENT ON TABLE maps_prospects IS 'Prospectos extraídos de Google Maps para análisis con IA';
COMMENT ON TABLE hunter_api_config IS 'Configuración de APIs externas para Lead Hunter';
COMMENT ON TABLE hunter_usage_stats IS 'Estadísticas diarias de uso del Lead Hunter por usuario';
COMMENT ON TABLE hunter_search_history IS 'Historial de búsquedas realizadas en Google Maps';

COMMENT ON COLUMN users.has_lead_hunter_access IS 'Indica si el usuario tiene acceso al módulo Lead Hunter';
COMMENT ON COLUMN users.hunter_daily_limit IS 'Límite diario de prospectos que puede analizar';
COMMENT ON COLUMN maps_prospects.ai_analysis IS 'Respuesta completa de Gemini en formato JSON';
COMMENT ON COLUMN maps_prospects.ai_priority IS 'Prioridad asignada por la IA: urgent, high, medium, low';
