-- Migration: Call Logs for future voice integration
-- Para Tarea 5: Infraestructura de Llamadas (Futuro)

CREATE TABLE IF NOT EXISTS call_logs (
    id SERIAL PRIMARY KEY,
    prospect_id INT REFERENCES maps_prospects(id) ON DELETE SET NULL,
    user_id INT NOT NULL,
    
    -- Call metadata
    call_direction VARCHAR(20) DEFAULT 'outbound', -- 'inbound' or 'outbound'
    call_duration_seconds INT,
    call_outcome VARCHAR(50), -- 'answered', 'no_answer', 'voicemail', 'busy'
    
    -- Audio & Transcription
    audio_url TEXT,
    audio_storage_path TEXT,
    transcription_text TEXT,
    transcription_language VARCHAR(10) DEFAULT 'es',
    
    -- AI Analysis
    sentiment_analysis JSONB, -- { "overall": "positive", "confidence": 0.85, "segments": [...] }
    sales_tips_generated JSONB, -- { "tips": [...], "objections_detected": [...], "next_actions": [...] }
    key_moments JSONB, -- Array of { "timestamp": "1:23", "type": "objection", "text": "..." }
    
    -- Status
    analysis_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_logs_prospect ON call_logs(prospect_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_user ON call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_created ON call_logs(created_at DESC);

-- Tabla para configuración de tips de venta
CREATE TABLE IF NOT EXISTS call_tips_templates (
    id SERIAL PRIMARY KEY,
    situation VARCHAR(100) NOT NULL, -- 'objection_price', 'first_contact', 'closing'
    tip_text TEXT NOT NULL,
    category VARCHAR(50),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tips por defecto
INSERT INTO call_tips_templates (situation, tip_text, category) VALUES
('objection_price', 'Pregunta por el coste de NO tener esta solución: ¿cuántos clientes pierde al mes?', 'objection'),
('first_contact', 'Presenta el valor antes del precio: "Le voy a ahorrar X horas a la semana"', 'opening'),
('closing', 'Ofrece una prueba sin compromiso: "¿Y si lo probamos 2 semanas gratis?"', 'closing'),
('objection_time', 'Empatiza y ofrece flexibilidad: "Lo instalamos en 15 minutos, ¿le viene bien mañana?"', 'objection')
ON CONFLICT DO NOTHING;
