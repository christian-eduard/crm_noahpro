-- Migración: Crear tabla de plantillas de propuestas
-- Fecha: 2025-12-03

CREATE TABLE IF NOT EXISTS proposal_templates (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    content_json JSONB NOT NULL, -- Estructura de la propuesta (título, precio, items, etc.)
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar una plantilla por defecto
INSERT INTO proposal_templates (name, description, content_json, is_default)
VALUES (
    'Plantilla Estándar TPV',
    'Propuesta básica para digitalización de hostelería',
    '{
        "title": "Digitalización Completa TPV + Verifactu",
        "description": "Implementación de sistema TPV NoahPro con cumplimiento normativo.",
        "items": [
            {"name": "Licencia Software TPV", "price": 499},
            {"name": "Configuración e Instalación", "price": 150},
            {"name": "Formación Personal (2h)", "price": 100}
        ],
        "totalPrice": 749
    }',
    TRUE
);
