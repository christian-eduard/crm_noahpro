const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.LEADS_DATABASE_URL || 'postgresql://cex@localhost:5432/leads_db'
});

const templates = [
    {
        name: "SDR - Cazador de Leads (Lead Hunter User)",
        description: "Evaluación para Sales Development Representatives que usarán nuestra IA para prospectar masivamente. Foco en volumen, calificación y manejo de herramientas tecnológicas.",
        difficulty_level: "mid",
        duration_minutes: 20,
        is_active: true,
        system_prompt: "Eres el Jefe de Prospección de una Startup de rápido crecimiento. Buscas un SDR con hambre, que no tenga miedo al teléfono ni a la tecnología. Tu candidato ideal es alguien que entiende que el éxito es un juego de números + inteligencia. Valora la resiliencia y la capacidad de adoptar nuevas herramientas (como nuestro CRM) rápidamente. Pregunta sobre sus rutinas diarias y cómo manejan el rechazo.",
        questions: [
            { text: "Imagina que tienes nuestro Lead Hunter AI que te da 100 leads cualificados al día. ¿Cómo organizas tu jornada para contactarlos a todos eficazmente?", duration: 60 },
            { text: "Estás llamando a un negocio local para venderles nuestro CRM. Te dicen 'Ya tengo una agenda, no necesito ordenadores'. ¿Cómo manejas esa objeción en 15 segundos?", duration: 60 },
            { text: "¿Qué métricas (KPIs) te importan más en tu día a día: número de llamadas, leads calificados o reuniones agendadas? Justifica tu respuesta.", duration: 60 },
            { text: "Hazme un roleplay rápido: Llámame (soy el dueño de una clínica dental ocupado) y consígueme una reunión para mañana.", duration: 90 },
            { text: "Nuestra herramienta revela datos de contacto ocultos. ¿Cómo usas esa información sin parecer intrusivo o 'creepy' al contactar al cliente?", duration: 60 }
        ],
        evaluation_criteria: {
            tech_savviness: "Facilidad para entender y usar herramientas de prospección.",
            grit: "Persistencia ante el volumen de trabajo y el rechazo.",
            pitch_clarity: "Capacidad de comunicar la propuesta de valor en segundos.",
            organization: "Estructura mental para manejar cientos de leads."
        }
    },
    {
        name: "Account Executive (Closer) - Venta SaaS",
        description: "Perfil Senior encargado de realizar las demos y cerrar los tratos generados por el sistema Lead Hunter.",
        difficulty_level: "senior",
        duration_minutes: 35,
        is_active: true,
        system_prompt: "Eres el Director Comercial. Buscas un Closer, alguien que convierta reuniones en contratos firmados. El candidato debe ser experto en realizar demos impactantes, no 'tours por la interfaz'. Evalúa su capacidad para descubrir el dolor del cliente (Pain) y atar nuestra solución a ese dolor. Deben ser agresivos en el cierre pero elegantes en el trato.",
        questions: [
            { text: "Estás haciendo una demo de nuestro CRM. El cliente parece aburrido. ¿Qué haces para recuperar su atención y control de la reunión?", duration: 60 },
            { text: "El cliente dice: 'Me encanta, pero es demasiado caro para nosotros ahora mismo'. Es una objeción de precio clásica. ¿Cómo la desmontas usando el ROI de nuestra herramienta?", duration: 90 },
            { text: "Descúbreme una necesidad latente. Hazme 3 preguntas para hacerme ver que estoy perdiendo dinero por no usar un CRM con IA.", duration: 90 },
            { text: "¿Cuándo decides 'matar' una oportunidad y dejar de perseguir a un prospecto que te da largas? ¿Dónde pones el límite?", duration: 60 },
            { text: "Simula el cierre: Hemos acabado la demo, me ha gustado. Pídeme el dinero/tarjeta ahora mismo. No me digas 'te mando un email', ciérrame.", duration: 60 }
        ],
        evaluation_criteria: {
            closing_skills: "Habilidad para pedir la venta sin dudas.",
            demo_skills: "Capacidad de presentar beneficios, no características.",
            objection_handling_price: "Defensa del valor frente al precio.",
            needs_discovery: "Profundidad en las preguntas de cualificación."
        }
    },
    {
        name: "Full Cycle Sales (Freelance/Autónomo)",
        description: "Para comerciales 'lobos solitarios' que gestionarán su propio ciclo completo, desde buscar el lead con Lead Hunter hasta cobrar.",
        difficulty_level: "mid",
        duration_minutes: 30,
        is_active: true,
        system_prompt: "Eres un Emprendedor Serial buscando socios comerciales. Necesitas gente autónoma, que no necesite que le lleven de la mano. Evalúa su capacidad de auto-gestión, su ambición económica y su disciplina. Deben saber equilibrar el tiempo de 'caza' (prospección) con el tiempo de 'cosecha' (cierre).",
        questions: [
            { text: "Nuestro sistema te da libertad total. Si no trabajas, no cobras. Si trabajas duro, no tienes techo. ¿Cómo te motivas un martes lluvioso en el que nadie te coge el teléfono?", duration: 60 },
            { text: "Tienes que prospectar (buscar clientes) y cerrar (demos) el mismo día. ¿Cómo estructuras tu bloques de tiempo para no descuidar ninguna fase?", duration: 90 },
            { text: "Un cliente te pide un descuento agresivo que se comería tu comisión. ¿Prefieres cerrar rápido ganando poco o arriesgarte a perder la venta manteniendo el precio?", duration: 60 },
            { text: "¿Qué harías si detectas que nuestra herramienta de Lead Hunter te está dando datos de un sector que no conoces? ¿Te adaptas o buscas otro nicho?", duration: 60 }
        ],
        evaluation_criteria: {
            autonomy: "Capacidad de trabajar sin supervisión constante.",
            ambition: "Deseo de altos ingresos basado en resultados.",
            time_management: "Equilibrio entre tareas de alto y bajo valor.",
            adaptability: "Rapidez para pivotar de estrategia."
        }
    },
    {
        name: "Venta Consultiva de Alto Valor (Enterprise)",
        description: "Para vender licencias corporativas multi-puesto de nuestro CRM a grandes empresas.",
        difficulty_level: "expert",
        duration_minutes: 40,
        is_active: true,
        system_prompt: "Eres un Consultor de Negocio Senior. Estás entrevistando para un puesto de Venta Enterprise. Aquí no vale la venta por impulso. Se trata de navegar organizaciones complejas, hablar con CEOs y Directores de Marketing, y vender una transformación digital. Evalúa la sofisticación del candidato y su paciencia estratégica.",
        questions: [
            { text: "Estás intentando vender 50 licencias a una inmobiliaria grande. El CEO quiere, pero el Director Comercial tiene miedo de que la IA reemplace a su equipo. ¿Cómo gestionas esta política interna?", duration: 120 },
            { text: "Descríbeme un proceso de venta que haya durado más de 3 meses. ¿Cómo mantuviste el interés vivo ('nurturing') sin ser pesado?", duration: 90 },
            { text: "Hazme un diagnóstico. Soy el dueño de una aseguradora. No sé qué problemas tengo, solo sé que no crecemos. Hazme preguntas para posicionar nuestro CRM como la solución.", duration: 120 },
            { text: "En una venta B2B compleja, ¿quién es más importante: el que firma el cheque (Economic Buyer) o el que usará la herramienta (User Buyer)? ¿Por qué?", duration: 60 }
        ],
        evaluation_criteria: {
            political_savvy: "Entendimiento de las dinámicas de poder en empresas.",
            strategic_patience: "Gestión de ciclos de venta largos.",
            consultative_approach: "Venta basada en solución de problemas complejos.",
            stakeholder_management: "Manejo de múltiples interlocutores."
        }
    },
    {
        name: "Sales Team Lead (Jefe de Equipo)",
        description: "Líder para gestionar un grupo de SDRs y Closers que usan nuestra tecnología.",
        difficulty_level: "expert",
        duration_minutes: 40,
        is_active: true,
        system_prompt: "Eres el Fundador de la compañía. Necesitas un lugarteniente. Alguien que no solo sepa vender, sino enseñar a vender. Alguien que mire los dashboards de nuestro CRM y sepa exactamente qué comercial está fallando y por qué. Evalúa capacidad de coaching, análisis de métricas y liderazgo.",
        questions: [
            { text: "Miras el dashboard y ves que Juan tiene muchas llamadas pero cero reuniones, y María tiene pocas llamadas pero muchas reuniones. ¿Qué feedback le das a cada uno?", duration: 90 },
            { text: "El equipo está desmotivado porque el mes pasado no llegaron al objetivo. Es lunes por la mañana. ¿Qué les dices en la reunión de inicio de semana?", duration: 90 },
            { text: "¿Cómo entrenarías a un novato para usar nuestro Lead Hunter AI en su primera semana? Diseña un mini-plan de onboarding.", duration: 90 },
            { text: "Detectas que los comerciales están usando mal el CRM y los datos están sucios. ¿Cómo implementas una cultura de higiene de datos sin ser un policía?", duration: 60 },
            { text: "Véndeme a mí (el fundador) la idea de invertir en un incentivo especial para el equipo este mes.", duration: 60 }
        ],
        evaluation_criteria: {
            coaching: "Habilidad para mejorar el rendimiento de otros.",
            data_analysis: "Capacidad de diagnosticar problemas leyendo KPIs.",
            leadership: "Inspiración y gestión moral del equipo.",
            process_orientation: "Enfoque en sistemas y repetibilidad."
        }
    }
];

const seedTemplates = async () => {
    const client = await pool.connect();
    try {
        console.log('🌱 Reiniciando y sembrando plantillas comerciales...');

        // 1. Borrado total como solicitó el usuario
        await client.query('DELETE FROM interview_templates');
        console.log('🗑️  Todas las plantillas anteriores eliminadas.');

        for (const template of templates) {
            await client.query(
                `INSERT INTO interview_templates 
                (name, description, difficulty_level, duration_minutes, is_active, system_prompt, questions, evaluation_criteria, created_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
                [
                    template.name,
                    template.description,
                    template.difficulty_level,
                    template.duration_minutes,
                    template.is_active,
                    template.system_prompt,
                    JSON.stringify(template.questions),
                    JSON.stringify(template.evaluation_criteria)
                ]
            );
            console.log(`✅ Creada plantilla comercial: ${template.name}`);
        }

        console.log('✨ Seed completado: 5 Plantillas de Venta listas.');
    } catch (err) {
        console.error('❌ Error al sembrar plantillas:', err);
    } finally {
        client.release();
        pool.end();
    }
};

seedTemplates();
