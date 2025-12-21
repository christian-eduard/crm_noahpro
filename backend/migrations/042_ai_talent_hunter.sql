-- Fase 5: AI Talent Hunter - Sistema de Reclutamiento Asíncrono
-- Tablas para gestión de candidatos y entrevistas con IA

-- Tabla de plantillas de entrevista
CREATE TABLE IF NOT EXISTS interview_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT NOT NULL, -- Prompt maestro para la IA entrevistadora
    duration_minutes INTEGER DEFAULT 15,
    questions JSONB, -- Array de preguntas predefinidas
    evaluation_criteria JSONB, -- Criterios de evaluación automática
    difficulty_level VARCHAR(20) CHECK (difficulty_level IN ('junior', 'mid', 'senior')),
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de candidatos
CREATE TABLE IF NOT EXISTS candidates (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(50),
    cv_url TEXT,
    linkedin_url VARCHAR(500),
    years_experience INTEGER,
    current_company VARCHAR(255),
    source VARCHAR(100), -- linkedin, web_form, referral, etc.
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'interviewed', 'approved', 'rejected', 'hired')),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de invitaciones de entrevistas
CREATE TABLE IF NOT EXISTS interview_invitations (
    id SERIAL PRIMARY KEY,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES interview_templates(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL UNIQUE, -- JWT o UUID para acceso único
    invited_by INTEGER REFERENCES users(id),
    expires_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'started', 'completed', 'expired')),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_invitations_token ON interview_invitations(token);
CREATE INDEX IF NOT EXISTS idx_invitations_candidate ON interview_invitations(candidate_id);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON interview_invitations(status);

-- Tabla de sesiones de entrevista (resultados)
CREATE TABLE IF NOT EXISTS interview_sessions (
    id SERIAL PRIMARY KEY,
    invitation_id INTEGER NOT NULL UNIQUE REFERENCES interview_invitations(id) ON DELETE CASCADE,
    candidate_id INTEGER NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES interview_templates(id),
    transcription TEXT,
    duration_seconds INTEGER,
    answers JSONB, -- Respuestas estructuradas por pregunta
    ai_evaluation JSONB, -- Evaluación completa de la IA
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    strengths TEXT[],
    weaknesses TEXT[],
    recommendation VARCHAR(50) CHECK (recommendation IN ('strong_hire', 'hire', 'maybe', 'no_hire', 'strong_no_hire')),
    technical_score INTEGER CHECK (technical_score >= 0 AND technical_score <= 100),
    communication_score INTEGER CHECK (communication_score >= 0 AND communication_score <= 100),
    attitude_score INTEGER CHECK (attitude_score >= 0 AND attitude_score <= 100),
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_candidate ON interview_sessions(candidate_id);
CREATE INDEX IF NOT EXISTS idx_sessions_score ON interview_sessions(overall_score DESC);

-- Comentarios
COMMENT ON TABLE interview_templates IS 'Plantillas de entrevistas con prompts y criterios de evaluación para IA';
COMMENT ON TABLE candidates IS 'Base de datos de candidatos para posiciones comerciales';
COMMENT ON TABLE interview_invitations IS 'Invitaciones únicas para acceder a la sala de entrevistas IA';
COMMENT ON TABLE interview_sessions IS 'Resultados y análisis completo de entrevistas realizadas';
