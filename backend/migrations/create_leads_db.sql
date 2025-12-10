-- Migración: Sistema de Leads y Propuestas Comerciales
-- Base de datos: leads_db
-- Fecha: 2025-12-02

-- 1. Crear base de datos (ejecutar como superuser)
-- CREATE DATABASE leads_db;

-- 2. Tabla de leads
CREATE TABLE IF NOT EXISTS leads (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    business_name VARCHAR(255),
    message TEXT,
    source VARCHAR(50) DEFAULT 'landing_form', -- landing_form, chat, manual
    status VARCHAR(50) DEFAULT 'new', -- new, contacted, qualified, proposal_sent, won, lost
    assigned_to VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabla de conversaciones de chat
CREATE TABLE IF NOT EXISTS chat_conversations (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'active', -- active, closed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabla de mensajes de chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    conversation_id INTEGER REFERENCES chat_conversations(id) ON DELETE CASCADE,
    sender_type VARCHAR(20) NOT NULL, -- user, bot, agent
    sender_name VARCHAR(255),
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabla de propuestas
CREATE TABLE IF NOT EXISTS proposals (
    id SERIAL PRIMARY KEY,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    content_json JSONB, -- Estructura flexible para secciones
    total_price DECIMAL(10,2),
    currency VARCHAR(3) DEFAULT 'EUR',
    status VARCHAR(50) DEFAULT 'draft', -- draft, sent, viewed, commented, accepted, rejected
    token VARCHAR(255) UNIQUE NOT NULL, -- Para enlace público
    sent_at TIMESTAMP,
    viewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(255)
);

-- 6. Tabla de comentarios en propuestas
CREATE TABLE IF NOT EXISTS proposal_comments (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER REFERENCES proposals(id) ON DELETE CASCADE,
    author VARCHAR(255) NOT NULL,
    author_type VARCHAR(20) NOT NULL, -- client, internal
    comment TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Tabla de reuniones agendadas
CREATE TABLE IF NOT EXISTS meetings (
    id SERIAL PRIMARY KEY,
    proposal_id INTEGER REFERENCES proposals(id) ON DELETE SET NULL,
    lead_id INTEGER REFERENCES leads(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    scheduled_date TIMESTAMP NOT NULL,
    duration_minutes INTEGER DEFAULT 60,
    meeting_link TEXT, -- Google Meet, Zoom, etc.
    status VARCHAR(50) DEFAULT 'scheduled', -- scheduled, confirmed, completed, cancelled
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Tabla de plantillas de propuestas
CREATE TABLE IF NOT EXISTS proposal_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content_json JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Tabla de analytics de visitantes
CREATE TABLE IF NOT EXISTS visitor_analytics (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255),
    page_url VARCHAR(500),
    referrer VARCHAR(500),
    user_agent TEXT,
    ip_address VARCHAR(50),
    country VARCHAR(100),
    city VARCHAR(100),
    visited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 10. Índices para mejorar rendimiento
CREATE INDEX IF NOT EXISTS idx_leads_email ON leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_proposals_token ON proposals(token);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON proposals(status);
CREATE INDEX IF NOT EXISTS idx_chat_conversations_session_id ON chat_conversations(session_id);
CREATE INDEX IF NOT EXISTS idx_meetings_lead_id ON meetings(lead_id);
CREATE INDEX IF NOT EXISTS idx_meetings_scheduled_date ON meetings(scheduled_date);

-- 11. Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 12. Triggers para actualizar updated_at
DROP TRIGGER IF EXISTS leads_updated_at_trigger ON leads;
CREATE TRIGGER leads_updated_at_trigger
    BEFORE UPDATE ON leads
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS proposals_updated_at_trigger ON proposals;
CREATE TRIGGER proposals_updated_at_trigger
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS chat_conversations_updated_at_trigger ON chat_conversations;
CREATE TRIGGER chat_conversations_updated_at_trigger
    BEFORE UPDATE ON chat_conversations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS proposal_templates_updated_at_trigger ON proposal_templates;
CREATE TRIGGER proposal_templates_updated_at_trigger
    BEFORE UPDATE ON proposal_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 13. Insertar plantilla de propuesta por defecto
INSERT INTO proposal_templates (name, description, content_json) VALUES
(
    'Propuesta Estándar TPV',
    'Plantilla estándar para propuestas de TPV con Verifactu',
    '{
        "header": {
            "title": "Propuesta Comercial - Sistema TPV Verifactu",
            "subtitle": "Solución completa para tu negocio"
        },
        "sections": [
            {
                "type": "introduction",
                "title": "Sobre Nosotros",
                "content": "NoahPro es líder en soluciones TPV con Verifactu integrado..."
            },
            {
                "type": "solution",
                "title": "Nuestra Solución",
                "items": [
                    "TPV completo con Verifactu integrado",
                    "Instalación en 5 minutos",
                    "Soporte 24/7 incluido",
                    "30 días de prueba gratis"
                ]
            },
            {
                "type": "pricing",
                "title": "Inversión",
                "plans": [
                    {
                        "name": "Plan Básico",
                        "price": 49,
                        "period": "mes",
                        "features": ["1 local", "TPV básico", "Verifactu"],
                        "highlighted": false
                    },
                    {
                        "name": "Plan Profesional",
                        "price": 99,
                        "period": "mes",
                        "features": ["Hasta 3 locales", "TPV completo", "Verifactu", "Soporte prioritario"],
                        "highlighted": true
                    }
                ]
            }
        ]
    }'
)
ON CONFLICT DO NOTHING;

-- Verificación
SELECT 'Tablas creadas correctamente' as mensaje;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('leads', 'proposals', 'chat_conversations', 'meetings')
ORDER BY table_name;
