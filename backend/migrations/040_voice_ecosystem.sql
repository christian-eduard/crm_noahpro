-- Fase 4: Ecosistema de Voz - Configuración SIP
-- Tabla para almacenar credenciales SIP de cada usuario

CREATE TABLE IF NOT EXISTS sip_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    sip_server VARCHAR(255) NOT NULL,
    sip_username VARCHAR(100) NOT NULL,
    sip_password_encrypted TEXT NOT NULL,
    sip_port INTEGER DEFAULT 5060,
    stun_server VARCHAR(255),
    turn_server VARCHAR(255),
    is_active BOOLEAN DEFAULT false,
    last_connection TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_sip_user_id ON sip_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_sip_active ON sip_settings(is_active);

-- Tabla de registro de llamadas
CREATE TABLE IF NOT EXISTS call_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    prospect_id INTEGER REFERENCES maps_prospects(id) ON DELETE SET NULL,
    lead_id INTEGER REFERENCES leads(id) ON DELETE SET NULL,
    call_type VARCHAR(20) CHECK (call_type IN ('outbound', 'inbound', 'missed')),
    duration INTEGER DEFAULT 0, -- en segundos
    recording_url TEXT,
    transcription TEXT,
    ai_summary JSONB,
    sentiment_analysis JSONB,
    call_quality_score INTEGER CHECK (call_quality_score >= 0 AND call_quality_score <= 100),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_user ON call_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_date ON call_logs(started_at);
CREATE INDEX IF NOT EXISTS idx_call_logs_prospect ON call_logs(prospect_id);

-- Tabla para escenarios del Dojo
CREATE TABLE IF NOT EXISTS dojo_scenarios (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20) CHECK (difficulty IN ('easy', 'medium', 'hard', 'expert')),
    ai_persona JSONB NOT NULL, -- Configuración de personalidad del "cliente simulado"
    success_criteria JSONB, -- Criterios para considerar la llamada exitosa
    duration_estimate INTEGER DEFAULT 300, -- segundos estimados
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla para sesiones de entrenamiento en el Dojo
CREATE TABLE IF NOT EXISTS dojo_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    scenario_id INTEGER NOT NULL REFERENCES dojo_scenarios(id) ON DELETE CASCADE,
    duration INTEGER, -- duración real en segundos
    transcription TEXT,
    ai_feedback JSONB, -- Retroalimentación de la IA
    score INTEGER CHECK (score >= 0 AND score <= 100),
    strengths TEXT[], -- Puntos fuertes detectados
    weaknesses TEXT[], -- Áreas de mejora
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dojo_sessions_user ON dojo_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_dojo_sessions_scenario ON dojo_sessions(scenario_id);

-- Comentarios
COMMENT ON TABLE sip_settings IS 'Configuración de credenciales SIP por usuario para softphone integrado';
COMMENT ON TABLE call_logs IS 'Registro histórico de todas las llamadas realizadas desde el CRM';
COMMENT ON TABLE dojo_scenarios IS 'Escenarios de entrenamiento para El Dojo (simulador de ventas)';
COMMENT ON TABLE dojo_sessions IS 'Sesiones de práctica de ventas realizadas en El Dojo';
