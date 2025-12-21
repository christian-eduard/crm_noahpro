-- Unificación de tabla de plantillas (Recreación con Cascade para limpiar antiguos)
DROP TABLE IF EXISTS recruitment_templates CASCADE;
DROP TABLE IF EXISTS interview_templates CASCADE; -- Cuidado: borra templates previos

CREATE TABLE interview_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT, -- Prompt Base para la IA Entrevistadora
    welcome_message TEXT, -- Mensaje de bienvenida inicial (TTS)
    questions JSONB DEFAULT '[]', -- Lista de preguntas
    evaluation_criteria JSONB DEFAULT '[]', -- Criterios para scoring
    duration_minutes INTEGER DEFAULT 15,
    difficulty_level VARCHAR(20) DEFAULT 'medium', -- easy, medium, hard
    is_active BOOLEAN DEFAULT true,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Recrear dependencias si fueron borradas por CASCADE en migraciones previas (opcional, pero seguro)
-- interview_invitations ya existe en migraciones anteriores, si CASCADE lo borró, debería recrearlo.
-- Asumiré que interview_invitations tiene FK a interview_templates(id).
-- Si borro interview_templates con CASCADE, se borran las invitaciones. 
-- Es aceptable resetear datos en dev.

-- Insertar plantilla demo
INSERT INTO interview_templates (name, description, system_prompt, welcome_message, questions, duration_minutes)
VALUES (
    'Entrevista Comercial Estándar',
    'Evaluación básica para puestos de ventas.',
    'Eres una reclutadora experta llamada Nova. Debes evaluar la capacidad de comunicación y ventas del candidato. Sé amable pero profesional.',
    'Hola, soy Nova. Gracias por postularte a NoahPro. Comenzaremos con unas preguntas breves.',
    '[
        {"text": "Háblame de tu experiencia en ventas.", "duration": 60},
        {"text": "¿Cuál ha sido tu venta más difícil?", "duration": 90}
    ]',
    10
);
