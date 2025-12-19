-- Tabla de estrategias de IA configurables
CREATE TABLE IF NOT EXISTS hunter_strategies (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    icon VARCHAR(100) DEFAULT 'Target',
    description TEXT,
    prompt_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE, -- Para proteger las estrategias por defecto
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insertar estrategias por defecto
INSERT INTO hunter_strategies (name, icon, description, prompt_template, is_system) VALUES
('Venta General', 'Target', 'Enfoque general de ventas', 'Analiza este negocio para una venta general de servicios CRM...', TRUE),
('VeriFactu / Ley Antifraude', 'Scale', 'Cumplimiento normativo', 'Analiza este negocio enfocado en el cumplimiento de la ley antifraude y VeriFactu...', TRUE),
('Kit Digital', 'Laptop', 'Subvenciones y digitalización', 'Analiza este negocio como candidato para bono Kit Digital...', TRUE),
('Análisis de Competencia', 'Spy', 'Comparativa de mercado', 'Analiza este negocio comparándolo con competidores en la zona...', TRUE);
