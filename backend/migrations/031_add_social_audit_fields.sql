-- =====================================================
-- Migración 031: Auditoría Digital y Social Media Intelligence
-- Fecha: 2025-12-19
-- Descripción: Añade campos para scoring de calidad, datos de redes sociales
--              y análisis de auditoría digital profunda
-- =====================================================

-- 1. NUEVAS COLUMNAS EN maps_prospects
-- =====================================================

-- Social Media Intelligence
ALTER TABLE maps_prospects ADD COLUMN IF NOT EXISTS social_handle VARCHAR(100);
ALTER TABLE maps_prospects ADD COLUMN IF NOT EXISTS social_platform VARCHAR(20) DEFAULT 'instagram';
ALTER TABLE maps_prospects ADD COLUMN IF NOT EXISTS social_stats JSONB DEFAULT '{}';

COMMENT ON COLUMN maps_prospects.social_handle IS 'Usuario de Instagram/Facebook detectado (ej: @restaurantepepe)';
COMMENT ON COLUMN maps_prospects.social_platform IS 'Plataforma principal: instagram, facebook, tiktok';
COMMENT ON COLUMN maps_prospects.social_stats IS 'Estadísticas de redes: followers, engagement, last_post_date';

-- Quality Scoring (calculado al ingresar el prospecto)
ALTER TABLE maps_prospects ADD COLUMN IF NOT EXISTS quality_score INTEGER DEFAULT 0;

COMMENT ON COLUMN maps_prospects.quality_score IS 'Puntuación 0-100 basada en: web, fotos, teléfono, rating';

-- Digital Audit (resultado del análisis profundo de IA)
ALTER TABLE maps_prospects ADD COLUMN IF NOT EXISTS digital_audit JSONB;
ALTER TABLE maps_prospects ADD COLUMN IF NOT EXISTS sales_intelligence JSONB;

COMMENT ON COLUMN maps_prospects.digital_audit IS 'Auditoría digital: score, web_status, social_health, reputation';
COMMENT ON COLUMN maps_prospects.sales_intelligence IS 'Inteligencia de venta: pain_point, producto sugerido, mensaje apertura';

-- =====================================================
-- 2. ÍNDICES PARA OPTIMIZAR BÚSQUEDAS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_quality_score ON maps_prospects(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_social_handle ON maps_prospects(social_handle) WHERE social_handle IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_digital_audit_score ON maps_prospects((digital_audit->>'score')) WHERE digital_audit IS NOT NULL;

-- =====================================================
-- 3. CONFIGURACIÓN DE APIs DE REDES SOCIALES
-- =====================================================

-- Insertar configuraciones para Instagram y Facebook APIs
INSERT INTO hunter_api_config (api_name, config_json, is_active) VALUES
    ('instagram_graph', '{"businessAccountId": "", "accessToken": "", "method": "api"}', FALSE),
    ('facebook_graph', '{"appId": "", "appSecret": "", "accessToken": ""}', FALSE)
ON CONFLICT (api_name) DO NOTHING;

-- =====================================================
-- 4. VALIDACIONES Y CONSTRAINTS
-- =====================================================

-- Validar que quality_score esté entre 0 y 100
ALTER TABLE maps_prospects ADD CONSTRAINT check_quality_score 
    CHECK (quality_score >= 0 AND quality_score <= 100);

-- Validar plataforma social
ALTER TABLE maps_prospects ADD CONSTRAINT check_social_platform
    CHECK (social_platform IN ('instagram', 'facebook', 'tiktok', 'linkedin', 'twitter'));

-- =====================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE hunter_api_config IS 'Configuración centralizada de APIs externas (Google, Gemini, Instagram, Facebook)';

-- =====================================================
-- EJEMPLO DE DATOS (Estructura esperada en JSONB)
-- =====================================================

/*
social_stats:
{
  "platform": "instagram",
  "followers_count": 5420,
  "following_count": 380,
  "media_count": 245,
  "last_post_date": "2025-12-15",
  "last_post_caption": "Nueva carta de invierno...",
  "engagement_rate": 3.4,
  "avg_likes": 184,
  "avg_comments": 12,
  "is_verified": false,
  "is_business": true,
  "is_active": true,
  "bio": "Restaurante tradicional en Madrid",
  "external_url": "https://reservas.example.com",
  "last_updated": "2025-12-19T12:00:00Z",
  "fetch_method": "api" // "api" o "scraping"
}

digital_audit:
{
  "score": 65,
  "web_status": "outdated", // "modern", "outdated", "missing"
  "social_health": "inactive", // "healthy", "inactive", "missing", "critical"
  "reputation": "good", // "excellent", "good", "fair", "poor"
  "last_audit_date": "2025-12-19",
  "details": {
    "web_score": 15,
    "social_score": 25,
    "reputation_score": 15,
    "ecommerce_score": 10
  }
}

sales_intelligence:
{
  "primary_pain_point": "Alta visibilidad en redes pero nula conversión (sin reservas online)",
  "suggested_product": "Módulo de Reservas + Web Responsive",
  "opening_message": "He visto que sois referentes en la zona con 5k seguidores, pero me costó encontrar vuestra carta actualizada...",
  "recommended_strategy": "Pack Completo", // "Venta TPV", "Venta Web", "Marketing", "Pack Completo"
  "estimated_value": 2500,
  "close_probability": 0.7
}
*/
