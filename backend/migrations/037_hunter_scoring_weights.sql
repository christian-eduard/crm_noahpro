-- Migration: Add Scoring Weights to Hunter User Settings
-- Para Fase 1: Inteligencia de Negocio & Cerebro Configurable

-- Añadir columna JSONB para guardar pesos de scoring personalizados
ALTER TABLE hunter_user_settings 
ADD COLUMN IF NOT EXISTS scoring_weights JSONB DEFAULT '{
    "web_weight": 20,
    "rating_weight": 15,
    "tpv_weight": 30,
    "social_weight": 15,
    "ads_weight": 10
}';

-- Añadir columna para salario estimado del comercial (para calcular ROI real)
ALTER TABLE hunter_user_settings
ADD COLUMN IF NOT EXISTS daily_salary_cost DECIMAL(10,2) DEFAULT 100.00;
