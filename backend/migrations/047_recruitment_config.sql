-- Tabla para plantillas de entrevista (Recruitment)
CREATE TABLE IF NOT EXISTS recruitment_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    welcome_message TEXT, -- Mensaje que dice la IA al inicio
    questions JSONB NOT NULL DEFAULT '[]', -- Array de preguntas: [{ text: "¿...?", duration: 60 }]
    estimated_duration INTEGER, -- Minutos
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar plantilla por defecto
INSERT INTO recruitment_templates (name, description, welcome_message, questions, estimated_duration)
VALUES (
    'Entrevista General Comercial',
    'Plantilla estándar para evaluar habilidades de venta básicas.',
    'Hola, soy la asistente de IA de NoahPro. Gracias por tu tiempo. Te haré unas preguntas breves para conocer mejor tu perfil.',
    '[
        {"text": "Cuéntame sobre tu experiencia en ventas y cuál ha sido tu mayor logro.", "duration": 60},
        {"text": "¿Cómo manejarías a un cliente que dice que tu producto es caro?", "duration": 45},
        {"text": "¿Por qué te gustaría trabajar con nosotros?", "duration": 45}
    ]',
    5
);
