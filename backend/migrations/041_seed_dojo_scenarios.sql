-- Insertar escenarios de entrenamiento predefinidos para El Dojo
INSERT INTO dojo_scenarios (name, description, difficulty, ai_persona, success_criteria, duration_estimate) VALUES
(
    'Cliente Interesado - Primera Llamada',
    'Primer contacto con un cliente potencial que ha mostrado interés. El objetivo es captar información y agendar una demo.',
    'easy',
    '{
        "personality": "amigable",
        "objections": ["tiempo", "ya_tengo_proveedor"],
        "buying_signals": ["pregunta_precios", "consulta_funcionalidades"],
        "temperament": "receptivo"
    }',
    '{
        "must_ask_pain_points": true,
        "must_schedule_demo": true,
        "min_duration": 180,
        "avoid_aggressive_selling": true
    }',
    300
),
(
    'Secretaria Barrera',
    'Escenario donde debes superar el filtro de una secretaria protectora para llegar al decision maker.',
    'medium',
    '{
        "personality": "protectora",
        "role": "asistente_ejecutiva",
        "objections": ["nombre_desconocido", "sin_cita_previa", "jefe_ocupado"],
        "temperament": "escéptico"
    }',
    '{
        "must_get_decision_maker_name": true,
        "must_schedule_callback": true,
        "avoid_hostility": true
    }',
    240
),
(
    'Cliente Furioso - Reclamación',
    'Gestión de una reclamación de un cliente insatisfecho con el servicio. Requiere empatía y resolución.',
    'hard',
    '{
        "personality": "enfadado",
        "issue": "servicio_no_funciona",
        "objections": ["no_responden", "perdida_dinero", "quiere_cancelar"],
        "temperament": "confrontacional"
    }',
    '{
        "must_show_empathy": true,
        "must_offer_solution": true,
        "must_deescalate": true,
        "avoid_defensive_tone": true
    }',
    360
),
(
    'Negociación de Precio Dura',
    'Cliente interesado pero con presupuesto ajustado. Debes defender el valor sin regalar el producto.',
    'hard',
    '{
        "personality": "negociador",
        "objections": ["precio_alto", "competencia_mas_barata", "descuento_exigido"],
        "temperament": "calculador"
    }',
    '{
        "must_defend_value": true,
        "can_offer_discount_max": 15,
        "must_highlight_roi": true,
        "avoid_desperate_tone": true
    }',
    420
),
(
    'Decision Maker CFO - Pitch Ejecutivo',
    'Presentación de alto nivel a un CFO. Debes hablar en términos de ROI, reducción de costes y eficiencia.',
    'expert',
    '{
        "personality": "analítico",
        "role": "CFO",
        "objections": ["roi_no_claro", "implementacion_costosa", "riesgo_cambio"],
        "temperament": "crítico"
    }',
    '{
        "must_present_roi": true,
        "must_show_case_study": true,
        "must_address_implementation": true,
        "avoid_technical_jargon": true
    }',
    480
);
