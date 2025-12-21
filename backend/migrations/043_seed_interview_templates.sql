-- Insertar plantillas de entrevista predefinidas para AI Talent Hunter
INSERT INTO interview_templates (name, description, system_prompt, duration_minutes, questions, evaluation_criteria, difficulty_level) VALUES
(
    'Comercial Junior - Screening Inicial',
    'Entrevista básica para filtrar candidatos junior con potencial comercial.',
    'Eres un reclutador experto especializado en identificar talento comercial. Tu objetivo es evaluar la motivación, actitud y potencial de crecimiento del candidato. Sé amigable pero profesional. Haz preguntas de seguimiento cuando detectes respuestas superficiales.',
    10,
    '[
        {"id": 1, "text": "¿Por qué quieres trabajar en ventas?", "type": "motivation"},
        {"id": 2, "text": "Cuéntame sobre una vez que convenciste a alguien de algo", "type": "experience"},
        {"id": 3, "text": "¿Cómo manejas el rechazo?", "type": "resilience"},
        {"id": 4, "text": "¿Qué sabes sobre nuestra empresa y productos?", "type": "preparation"},
        {"id": 5, "text": "¿Dónde te ves en 2 años?", "type": "ambition"}
    ]',
    '{
        "motivation_weight": 30,
        "communication_weight": 25,
        "energy_weight": 20,
        "preparation_weight": 15,
        "consistency_weight": 10
    }',
    'junior'
),
(
    'Comercial Mid-Level - Evaluación Técnica',
    'Entrevista para evaluar conocimiento técnico y experiencia práctica en ventas.',
    'Eres un gerente de ventas senior evaluando a un candidato con experiencia. Profundiza en metodologías de venta, manejo de objeciones y cierre de deals. Sé directo y busca ejemplos concretos con números. No aceptes respuestas genéricas.',
    20,
    '[
        {"id": 1, "text": "Describe tu proceso de venta ideal, de principio a fin", "type": "methodology"},
        {"id": 2, "text": "¿Cuál fue tu mejor cierre? Dame números concretos", "type": "achievements"},
        {"id": 3, "text": "Simula: un cliente dice que es muy caro. ¿Qué respondes?", "type": "objection_handling"},
        {"id": 4, "text": "¿Cómo gestionas un pipeline de 50+ leads?", "type": "organization"},
        {"id": 5, "text": "¿Qué CRM usas y qué métricas trackeas diariamente?", "type": "tools"},
        {"id": 6, "text": "¿Cuál es tu ratio de conversión actual?", "type": "metrics"}
    ]',
    '{
        "technical_knowledge": 35,
        "results_orientation": 25,
        "objection_handling": 20,
        "data_driven_mindset": 15,
        "professionalism": 5
    }',
    'mid'
),
(
    'Comercial Senior - Entrevista Estratégica',
    'Entrevista avanzada para roles de liderazgo o hunter con autonomía total.',
    'Eres el CEO o VP de Ventas. Estás buscando un líder comercial que pueda abrir mercados, gestionar equipos o llevar cuentas enterprise. Evalúa pensamiento estratégico, liderazgo y capacidad de execution. Exige visión de negocio, no solo "vender mucho".',
    30,
    '[
        {"id": 1, "text": "Si entras mañana, ¿cuál sería tu plan de 90 días?", "type": "strategy"},
        {"id": 2, "text": "Describe una situación donde cambiaste la estrategia de venta de un producto", "type": "leadership"},
        {"id": 3, "text": "¿Cómo construyes y escalas un equipo comercial desde cero?", "type": "team_building"},
        {"id": 4, "text": "Dame un ejemplo de un deal complejo que cerraste. Cómo lo estructuraste?", "type": "complexity"},
        {"id": 5, "text": "¿Qué KPIs usarías para medir tu éxito en los primeros 6 meses?", "type": "metrics"},
        {"id": 6, "text": "¿Cómo manejas un equipo desmotivado con malos números?", "type": "crisis_management"}
    ]',
    '{
        "strategic_thinking": 30,
        "leadership": 25,
        "execution_capability": 20,
        "business_acumen": 15,
        "data_orientation": 10
    }',
    'senior'
);
