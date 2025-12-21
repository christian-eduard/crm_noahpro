-- Migration: System Prompts para Cerebro Abierto
-- Para Tarea 2: Configurabilidad Total de IA

-- Tabla de prompts del sistema editables
CREATE TABLE IF NOT EXISTS system_prompts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    prompt_text TEXT NOT NULL,
    is_active BOOLEAN DEFAULT FALSE,
    category VARCHAR(50) DEFAULT 'hunter',
    version INT DEFAULT 1,
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Índice para búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_system_prompts_active ON system_prompts(is_active, category);

-- Prompt por defecto para Hunter con detección multi-servicio
INSERT INTO system_prompts (name, prompt_text, is_active, category, description) VALUES
('Hunter Default - Multi-Servicio', 
'Analiza este negocio para identificar oportunidades de venta de nuestros servicios:

**SERVICIOS QUE OFRECEMOS:**
1. TPV/Datáfonos - Para negocios que solo aceptan efectivo
2. Diseño Web - Para negocios sin website o con web anticuada
3. Marketing Digital - Para negocios con pocas reseñas o sin presencia online
4. Branding/Diseño - Para negocios con fotos de baja calidad o sin logo profesional
5. Desarrollo de Apps - Para negocios complejos que necesitan app personalizada
6. Gestión de Redes Sociales - Para negocios sin Instagram/Facebook/TikTok

**INSTRUCCIONES DE ANÁLISIS:**
- Revisa las reseñas buscando: "solo efectivo", "no acepta tarjeta", "pago cash"
- Detecta si tienen website y su calidad (WordPress viejo, responsive, etc.)
- Identifica presencia en redes sociales (Instagram, Facebook, TikTok, LinkedIn)
- Evalúa la calidad de las fotos del negocio
- Considera el tipo de negocio para app personalizada

**OUTPUT REQUERIDO (JSON):**
{
  "priority": "Urgente|Alta|Media|Baja",
  "tags": ["Sin Web", "Verifactu", "Kit Digital", "Sin Redes", "TPV Antiguo"],
  "reasoning": "Breve explicación de por qué es buen cliente",
  "suggested_pitch": "Frase de apertura para el comercial",
  "opportunities": {
    "needs_tpv": boolean,
    "needs_web": boolean,
    "needs_marketing": boolean,
    "needs_design": boolean,
    "needs_app": boolean,
    "needs_social": boolean
  },
  "score": 0-100
}', 
TRUE, 
'hunter',
'Prompt principal para análisis de prospectos con detección de todos nuestros servicios');

-- Historial de versiones de prompts
CREATE TABLE IF NOT EXISTS system_prompt_history (
    id SERIAL PRIMARY KEY,
    prompt_id INT REFERENCES system_prompts(id),
    prompt_text TEXT NOT NULL,
    version INT NOT NULL,
    changed_by INT,
    changed_at TIMESTAMP DEFAULT NOW()
);
