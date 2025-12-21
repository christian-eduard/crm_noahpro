-- AI Brain / Knowledge Base Migration
-- Este sistema permite que la IA tenga un "Cerebro" con conocimiento específico y personalidad

-- 1. Tabla de Configuración de Personalidad
CREATE TABLE IF NOT EXISTS ai_brain_settings (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) DEFAULT 'Cerebro NoahPro',
    personality_tone VARCHAR(50) DEFAULT 'professional', -- 'professional', 'aggressive', 'friendly', 'analytical'
    system_instruction_prefix TEXT, -- Instrucciones que van ANTES de todo
    system_instruction_suffix TEXT, -- Instrucciones que van DESPUÉS de todo
    max_context_units INTEGER DEFAULT 5, -- Cuántas unidades de conocimiento rescatar
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabla de Unidades de Conocimiento (RAG simplificado)
CREATE TABLE IF NOT EXISTS ai_brain_knowledge (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    category VARCHAR(50), -- 'success_story', 'product_info', 'objection_handling', 'legal_info'
    is_active BOOLEAN DEFAULT TRUE,
    tags TEXT[],
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Insertar configuración por defecto
INSERT INTO ai_brain_settings (personality_tone, system_instruction_prefix)
VALUES ('professional', 'Eres el cerebro estratégico de NoahPro CRM. Tu objetivo es ayudar a los comerciales a cerrar ventas de TPV y Verifactu con argumentos sólidos y basados en datos.')
ON CONFLICT DO NOTHING;

-- 4. Insertar algunas unidades de conocimiento base
INSERT INTO ai_brain_knowledge (title, content, category, tags)
VALUES 
('Beneficios Verifactu', 'La Ley Antifraude 2025 obliga a todos los negocios a usar software certificado. Las multas pueden llegar a 50.000€. NoahPro automatiza todo el proceso sin que el cliente tenga que hacer nada.', 'legal_info', '{verifactu,legal,legal_risk}'),
('Caso de Éxito: Restaurante El Prado', 'El Restaurante El Prado aumentó su facturación un 15% tras digitalizarse con NoahPro y optimizar la gestión de mesas y comandas.', 'success_story', '{restaurante,success,growth}');
