/**
 * Gemini Service
 * Servicio para análisis de prospectos con Gemini 2.5 Pro (Google AI)
 */

const db = require('../config/database');

class GeminiService {
    constructor() {
        this.apiKey = null;
        this.model = 'gemini-2.0-flash-exp';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.customInstruction = null;
        this.unsplashFallback = 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80';
    }

    /**
     * System Instruction optimizada para ventas TPV/Verifactu
     */
    getStrategyInstruction(strategy) {
        // Base context shared across all strategies
        const context = `Eres un experto en ventas de sistemas TPV y normativa Verifactu (Ley Antifraude 2025/2027) en España.
CONTEXTO DEL PRODUCTO - NoahPro TPV:
- Sistema punto de venta con Verifactu integrado automático
- Cumplimiento 100% de la Ley Antifraude y Factura Electrónica
- Gestión integral (mesas, inventario, delivery, reporting)
- Soporte 24/7 y formación incluida`;

        const strategies = {
            'verifactu': `
ENFOQUE: CUMPLIMIENTO LEGAL (VeriFactu / Ley Antifraude).
Tu objetivo es alertar sobre la obligatoriedad de la nueva ley y el riesgo de multas.
PUNTOS CLAVE:
- La ley entra en vigor pronto.
- Multas de hasta 50.000€ por software no certificado.
- NoahPro está 100% certificado.
- Prioridad ALTA si el negocio parece usar tikets manuales o software antiguo.`,

            'digital_kit': `
ENFOQUE: KIT DIGITAL (Subvención a fondo perdido).
Tu objetivo es vender la oportunidad de conseguir el TPV GRATIS.
PUNTOS CLAVE:
- Aprovechar el bono del Kit Digital antes de que se agote.
- Software + Hardware subvencionado.
- NoahPro es Agente Digitalizador Adherido.`,

            'competitor': `
ENFOQUE: MEJORA COMPETITIVA.
Tu objetivo es destacar ventajas sobre TPVs tradicionales.
PUNTOS CLAVE:
- Tecnología nube vs local (acceso desde móvil).
- Integración delivery (ahorro de tablets).
- Reporting en tiempo real.`,

            'general': `
ENFOQUE: VENTA CONSULTIVA GENERAL.
Tu objetivo es detectar dolores del negocio y ofrecer solución.
PUNTOS CLAVE:
- Ahorro de tiempo en gestión.
- Control de stock y mermas.
- Aumento de facturación con herramientas de marketing.`
        };

        const specificInstruction = strategies[strategy] || strategies['general'];

        return `${context}

${specificInstruction}

CRITERIOS DE ANÁLISIS:
1. SIN WEB → ALTA PRIORIDAD
2. HOSTELERÍA → ALTA PRIORIDAD (Verifactu)
3. RATING BAJO → Oportunidad de mejora

INSTRUCCIONES DE SALIDA:
Devuelve SIEMPRE un JSON válido con:
{
  "tags": [array de IDs: 7=Verifactu, 8=Demo, 9=SinWeb, 10=LeadHunter],
  "priority": "urgent|high|medium|low",
  "personalized_message": {
    "subject": "Asunto email persuasivo",
    "body": "Mensaje corto para WhatsApp/Email (usa {{businessName}})",
    "channel": "whatsapp|email"
  },
  "opportunity_map": {
    "strengths": ["punto fuerte 1", "punto fuerte 2"],
    "weaknesses": ["punto débil 1", "punto débil 2"],
    "pain_points": ["dolor detectado 1", "dolor detectado 2"],
    "solutions": ["solución NoahPro 1", "solución NoahPro 2"]
  },
  "reasoning": "Breve justificación del enfoque elegido"
}`;
    }

    /**
     * System Instruction (Getter for backward compatibility or default)
     */
    get systemInstruction() {
        if (this.customInstruction) return this.customInstruction;
        return this.getStrategyInstruction('general');
    }

    /**
     * Obtener configuración de la API
     */
    async getConfig() {
        const result = await db.query(
            "SELECT api_key, config_json FROM hunter_api_config WHERE api_name = 'gemini_vertex'"
        );

        if (result.rows.length === 0) {
            throw new Error('Gemini API no configurada');
        }

        const config = result.rows[0];
        this.apiKey = config.api_key;

        if (config.config_json) {
            if (config.config_json.model) {
                this.model = config.config_json.model;
            }
            if (config.config_json.systemInstruction) {
                this.customInstruction = config.config_json.systemInstruction;
            }
        }

        return {
            apiKey: this.apiKey,
            model: this.model,
            systemInstruction: this.systemInstruction
        };
    }

    /**
     * Analizar un prospecto con Gemini
     * @param {Object} prospect - Datos del prospecto de maps_prospects
     * @returns {Object} Análisis de la IA
     */
    async analyzeProspect(prospect) {
        await this.getConfig();

        if (!this.apiKey) {
            throw new Error('API Key de Gemini no configurada');
        }

        // Fetch Web Content if available
        let webContent = '';
        if (prospect.website) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(prospect.website, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NoahProBot/1.0)' }
                });
                clearTimeout(timeoutId);
                if (res.ok) {
                    const html = await res.text();
                    // Basic extraction: remove scripts/styles and get text
                    webContent = html
                        .replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gm, "")
                        .replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gm, "")
                        .replace(/<[^>]+>/g, " ")
                        .replace(/\s+/g, " ")
                        .trim()
                        .substring(0, 3000);
                }
            } catch (e) {
                console.warn('Web fetch failed:', e.message);
            }
        }

        // Preparar reviews text
        const reviewsText = Array.isArray(prospect.reviews)
            ? prospect.reviews.map(r => `- "${r.text}" (${r.rating}★)`).join('\n')
            : 'No hay reseñas disponibles.';

        // Preparar prompt con datos del prospecto
        const prospectInfo = `
DATOS DEL NEGOCIO A ANALIZAR:
- Nombre: ${prospect.name}
- Tipo: ${prospect.business_type || 'Desconocido'}
- Dirección: ${prospect.address || 'No disponible'}
- Ciudad: ${prospect.city || 'No disponible'}
- Teléfono: ${prospect.phone || 'No disponible'}
- Sitio Web: ${prospect.website || 'NO TIENE WEB'}
- Rating: ${prospect.rating || 'Sin valoración'} (${prospect.reviews_count || 0} reseñas)
- Tipos Google: ${JSON.stringify(prospect.business_types || [])}
- NOTAS INTERNAS (Observaciones del comercial): ${prospect.internal_notes || 'Ninguna'}

RESEÑAS RECIENTES:
${reviewsText}

CONTENIDO SITIO WEB (Extracto):
${webContent || 'No disponible o inaccesible'}

ANALIZA este negocio y devuelve el JSON con tu evaluación:`;

        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

        // Determine System Instruction
        let systemInstructionText = this.systemInstruction; // default

        if (prospect.strategy) {
            // Check if strategy is a DB ID (numeric string)
            if (!isNaN(prospect.strategy)) {
                try {
                    const stratResult = await db.query('SELECT prompt_template FROM hunter_strategies WHERE id = $1', [prospect.strategy]);
                    if (stratResult.rows.length > 0) {
                        const dbTemplate = stratResult.rows[0].prompt_template;
                        // Append standard output format if not present
                        const outputInstructions = `
INSTRUCCIONES DE SALIDA:
Devuelve SIEMPRE un JSON válido (sin markdown) con:
{
  "social_media": {
    "instagram": "url o null",
    "facebook": "url o null",
    "tiktok": "url o null",
    "linkedin": "url o null",
    "twitter": "url o null"
  },
  "review_analysis": {
    "sentiment": "positivo|neutral|negativo",
    "main_topics": ["tema1", "tema2", "tema3"],
    "improvement_suggestions": ["sugerencia1", "sugerencia2"]
  },
  "tags": [array de IDs: 7=Verifactu, 8=Demo, 9=SinWeb, 10=LeadHunter],
  "priority": "urgent|high|medium|low",
  "personalized_message": {
    "subject": "Asunto email persuasivo",
    "body": "Mensaje corto para WhatsApp/Email (usa {{businessName}})",
    "channel": "whatsapp|email"
  },
  "opportunity_map": {
    "strengths": ["punto fuerte 1", "punto fuerte 2"],
    "weaknesses": ["punto débil 1", "punto débil 2"],
    "pain_points": ["dolor detectado 1", "dolor detectado 2"],
    "solutions": ["solución NoahPro 1", "solución NoahPro 2"]
  },
  "reasoning": "Breve justificación del enfoque elegido"
}`;
                        systemInstructionText = `${dbTemplate}\n\n${outputInstructions}`;

                        // Añadir instrucción específica para redes e info de review si no está
                        const extraContext = `
IMPORTANTE:
1. Busca enlaces a redes sociales (Instagram, Facebook, TikTok, LinkedIn) en el contenido web proporcionado.
2. Analiza el texto de las reseñas proporcionadas para detectar sentimiento general, temas recurrentes y sugerencias de mejora.
`;
                        systemInstructionText = `${systemInstructionText}\n${extraContext}`;
                        systemInstructionText = `${dbTemplate}\n\n${outputInstructions}`;
                    }
                } catch (e) {
                    console.warn('Error fetching strategy prompt:', e);
                }
            } else {
                // Fallback to legacy hardcoded logic
                systemInstructionText = this.getStrategyInstruction(prospect.strategy);
            }
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: this.customInstruction || systemInstructionText }]
                },
                contents: [{
                    parts: [{ text: prospectInfo }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 1024,
                    responseMimeType: 'application/json'
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Error de Gemini API: ${response.status} - ${error}`);
        }

        const data = await response.json();

        // Extraer texto de la respuesta
        const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            throw new Error('Respuesta vacía de Gemini');
        }

        // Parsear JSON de la respuesta
        let analysis;
        try {
            // Limpiar posibles marcadores de código
            const cleanJson = textResponse.replace(/```json\n?|\n?```/g, '').trim();
            analysis = JSON.parse(cleanJson);
        } catch (parseError) {
            console.error('Error parseando respuesta:', textResponse);
            throw new Error('La IA no devolvió un JSON válido');
        }

        // Validar estructura
        if (!analysis.tags || !analysis.priority || !analysis.personalized_message) {
            throw new Error('Estructura de respuesta incompleta');
        }

        // Asegurar que existan los nuevos campos para evitar errores en frontend
        if (!analysis.social_media) analysis.social_media = {};
        if (!analysis.review_analysis) analysis.review_analysis = { sentiment: 'neutral', main_topics: [], improvement_suggestions: [] };

        return analysis;
        return analysis;
    }

    /**
     * Mejorar notas internas con IA
     */
    async improveNotes(currentNotes, businessContext) {
        await this.getConfig();
        const prompt = `
ACTÚA COMO: Asistente Comercial Senior.
TAREA: Reescribir y mejorar las siguientes notas internas sobre un prospecto (cliente potencial).
OBJETIVO: Hacerlas más profesionales, claras y orientadas a la venta, pero manteniendo toda la información original.
CONTEXTO DEL NEGOCIO: ${businessContext}
NOTAS ORIGINALES: "${currentNotes}"

SALIDA: Solo el texto mejorado. Sin comillas ni explicaciones extra.
`;
        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: { maxOutputTokens: 500 }
            })
        });

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || currentNotes;
    }

    /**
     * Generar HTML de Landing Page Demo
     */
    async generateLandingPage(prospect, demoType = 'modern', customPrompt = '', passedStyleInstructions = '') {
        await this.getConfig();
        if (!this.apiKey) throw new Error('API Key no configurada');

        // Build image sources
        const businessKeywords = prospect.business_type?.toLowerCase().replace(/[^a-z]/g, '') || 'business';

        // Style instructions based on demo type
        const defaultStyles = {
            modern: 'Diseño ultra moderno, minimalista, con mucho espacio en blanco, colores vibrantes y transiciones suaves.',
            restaurant: 'Estilo gastronómico elegante, tonos cálidos (naranja, dorado, marrón), fotos de comida destacadas, menú visible.',
            store: 'E-commerce look, grid de productos, ofertas destacadas, botones de compra prominentes, colores corporativos.',
            services: 'Profesional y confiable, portfolio de trabajos, testimonios destacados, formulario de contacto prominente.',
            luxury: 'Ultra premium, fondo oscuro con acentos dorados, tipografía elegante serif, imágenes full-bleed.',
            custom: 'Sigue las instrucciones personalizadas del usuario.'
        };

        const styleToUse = passedStyleInstructions || defaultStyles[demoType] || defaultStyles.modern;

        let imageInstruction = `
IMÁGENES (Usa estas fuentes - IMPORTANTE: las imágenes son OBLIGATORIAS):
1. Unsplash (imágenes de alta calidad libres de derechos): 
   - Hero: "https://source.unsplash.com/1920x1080/?${businessKeywords},interior,modern"
   - Galería: "https://source.unsplash.com/800x600/?${businessKeywords},detail,quality" (usa diferentes queries)
   - Testimonios: "https://source.unsplash.com/200x200/?portrait,professional"
2. Placeholder si falla: "${this.unsplashFallback}"`;

        if (prospect.photos && prospect.photos.length > 0) {
            const photoUrls = prospect.photos.slice(0, 6).map((p, i) => `   ${i + 1}. ${p.url || p}`).join('\n');
            imageInstruction = `
IMÁGENES REALES DEL NEGOCIO (PRIORIDAD MÁXIMA - USA ESTAS):
${photoUrls}

IMÁGENES COMPLEMENTARIAS de Unsplash (USA SIEMPRE para completar si faltan reales):
- Fondo hero (Alta Calidad): "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=1920" (Solo si no hay mejor opción real)
- O usa keywords dinámicas: "https://source.unsplash.com/1600x900/?${businessKeywords}" (deprecated, PREFIERE USAR IMAGENES REALES SI EXISTEN)
- DETALLE: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=800"
`;
        } else {
            // FALLBACK ROBUSTO: URLs fijas de alta calidad por industria para evitar errores 404/negro
            const fallbackImages = {
                restaurant: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1920&q=80",
                cafe: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=1920&q=80",
                gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1920&q=80",
                store: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1920&q=80",
                generic: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1920&q=80"
            };

            let heroImage = fallbackImages.generic;
            if (businessKeywords.includes('restauran') || businessKeywords.includes('food')) heroImage = fallbackImages.restaurant;
            if (businessKeywords.includes('cafe') || businessKeywords.includes('coffee')) heroImage = fallbackImages.cafe;
            if (businessKeywords.includes('gym') || businessKeywords.includes('fitness')) heroImage = fallbackImages.gym;
            if (businessKeywords.includes('shop') || businessKeywords.includes('store')) heroImage = fallbackImages.store;

            imageInstruction = `
NO TENEMOS FOTOS REALES. USA ESTAS IMÁGENES DE ALTA CALIDAD OBLIGATORIAMENTE:
1. HERO BACKGROUND: "${heroImage}"
2. SECCIÓN INFO: "https://images.unsplash.com/photo-1556761175-5973dc0f32e7?auto=format&fit=crop&w=800&q=80"
3. AVATAR 1: "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=200"
4. AVATAR 2: "https://images.unsplash.com/photo-1573496359-136d47558363?auto=format&fit=crop&w=200"

IMPORTANTE: NO inventes URLs de imágenes. Usa las proporcionadas o URLs de Unsplash https://images.unsplash.com/photo-... reales que conozcas. NO uses source.unsplash.com ya que falla.
`;
        }

        // Generate demo_token for form submissions
        const demoToken = prospect.id; // We'll use prospect ID to link form submissions

        const prompt = `
ACTÚA COMO: Desarrollador Web Senior + Diseñador UX/UI de Elite + Experto en Conversión.
MISIÓN: Crear la Landing Page más IMPRESIONANTE y PROFESIONAL posible para demostrar a un potencial cliente cómo se vería su negocio digitalizado.

DATOS DEL CLIENTE:
- Nombre: ${prospect.name}
- Tipo de negocio: ${prospect.business_type}
- Ciudad: ${prospect.city}
- Teléfono: ${prospect.phone || 'No disponible'}
- Rating: ${prospect.rating}/5 estrellas (${prospect.reviews_count} reseñas)

OBJETIVO PRINCIPAL: 
Impresionar al cliente con una web que le haga pensar "¡Yo quiero esto para mi negocio!" y motivarle a contactarnos.

${imageInstruction}

REQUISITOS DE DISEÑO PREMIUM:
1. HERO SECTION (**MÁXIMO 80vh - NO 100vh**): 
   - Imagen de fondo a pantalla completa con overlay oscuro semitransparente
   - **IMPORTANTE: max-height: 80vh para que se vean las secciones debajo**
   - Efecto parallax o gradient animado
   - Título grande y llamativo con el nombre del negocio
   - Subtítulo persuasivo
   - CTA prominente con animación de hover
   - **CRITICAL: position: relative (not fixed/absolute que tape contenido)**

2. SECCIONES OBLIGATORIAS (TODAS DEBEN SER VISIBLES AL SCROLLEAR):
   - Hero espectacular (80vh)
   - "Sobre Nosotros" con historia ficticia profesional + IMAGEN
   - Servicios/Productos (3-4 items con iconos SVG + miniatura de imagen cada uno)
   - Galería de imágenes (4-6 imágenes en grid moderno con hover effects)
   - Testimonios (3 reseñas ficticias positivas con avatares de imagen)
   - FORMULARIO DE CONTACTO (¡IMPORTANTE! Con fondo contrastante)
   - Footer con info de contacto y AÑO DINÁMICO (usar <script>document.write(new Date().getFullYear())</script>)

3. FORMULARIO DE CONTACTO (CRÍTICO):
   - Título: "¿Te interesa una web como esta?"
   - Campos: Nombre, Email, Teléfono, Mensaje
   - Botón de envío estilizado
   - Al enviar, hacer POST a "/api/hunter/demos/contact" con JSON: { prospectId: "${demoToken}", name, email, phone, message }
   - Mostrar alert de éxito al enviar
   - Diseño moderno, campos con iconos

4. EFECTOS Y ANIMACIONES:
   - Scroll suave (smooth scroll)
   - Efectos fade-in al hacer scroll (IntersectionObserver simple)
   - Hover effects en botones y cards
   - Transiciones suaves en todo

5.ESTILO VISUAL (TIPO: ${demoType.toUpperCase()}):
   ${styleToUse}

6. COLORES Y TIPOGRAFÍA:
   - Paleta profesional según el estilo
   - Google Fonts (Inter o Montserrat + Playfair Display para títulos)
   - Jerarquía visual clara

7. TÉCNICO:
   - HTML5 único archivo autónomo
   - CSS moderno (variables CSS, flexbox, grid)
   - JavaScript vanilla mínimo para interactividad
   - 100% responsive (Mobile First)
   - Meta tags SEO básicos

8. CSS CRITICO - EVITAR ERRORES COMUNES:
   - [NO] uses height: 100vh o min-height: 100vh en hero (usa max 80vh)
   - [NO] uses position: fixed que oculte contenido
   - [NO] uses overflow: hidden en body
   - [SI] TODAS las secciones deben tener padding visible (min 60px)
   - [SI] TODAS las imagenes deben tener src con URLs de Unsplash reales
   - [SI] Footer debe ser el ultimo elemento visible

${customPrompt ? `
9. INSTRUCCIONES PERSONALIZADAS DEL USUARIO (PRIORIDAD ALTA):
${customPrompt}
` : ''}

SALIDA: SOLO el código HTML completo. Sin explicaciones. Sin markdown. Empieza con <!DOCTYPE html>.`;

        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: 8192,
                    temperature: 0.7
                }
            })
        });
        if (!response.ok) {
            const errorBody = await response.text();
            console.error('Gemini API Error (Landing):', response.status, errorBody);
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const data = await response.json();

        if (data.error) {
            console.error('Gemini API Error Data:', data.error);
            throw new Error(data.error.message || 'Error en Gemini API');
        }

        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            console.error('Gemini Response Empty or Blocked:', JSON.stringify(data));
            throw new Error('La IA no devolvió contenido web. Puede ser por filtros de seguridad.');
        }

        return text.replace(/```html\n?|\n?```/g, '').trim();
    }

    /**
     * Analizar y guardar resultados en DB
     */
    async analyzeAndSave(prospectId) {
        // Obtener prospecto
        const prospectResult = await db.query(
            'SELECT * FROM maps_prospects WHERE id = $1',
            [prospectId]
        );

        if (prospectResult.rows.length === 0) {
            throw new Error('Prospecto no encontrado');
        }

        const prospect = prospectResult.rows[0];

        // Fetch active internal notes
        const notesResult = await db.query(
            `SELECT content FROM prospect_notes WHERE prospect_id = $1 AND use_for_analysis = TRUE ORDER BY created_at ASC`,
            [prospectId]
        );

        if (notesResult.rows.length > 0) {
            const aggregatedNotes = notesResult.rows.map(n => `- ${n.content} `).join('\n');
            // Append to existing internal_notes (legacy) or replace
            prospect.internal_notes = prospect.internal_notes
                ? `${prospect.internal_notes} \n\nNOTAS ADICIONALES: \n${aggregatedNotes} `
                : `NOTAS ADICIONALES: \n${aggregatedNotes} `;
        }

        // Analizar con Gemini
        const analysis = await this.analyzeProspect(prospect);

        // Guardar análisis en DB
        await db.query(
            `UPDATE maps_prospects SET
        ai_analysis = $1,
            ai_priority = $2,
            ai_tags = $3,
            ai_reasoning = $4,
            ai_message_subject = $5,
            ai_message_body = $6,
            ai_channel = $7
             WHERE id = $8`,
            [
                JSON.stringify(analysis),
                analysis.priority,
                analysis.tags,
                analysis.reasoning,
                analysis.personalized_message.subject,
                analysis.personalized_message.body,
                analysis.personalized_message.channel,
                prospectId
            ]
        );

        // Actualizar estadísticas
        const today = new Date().toISOString().split('T')[0];
        await db.query(
            `INSERT INTO hunter_usage_stats(user_id, date, prospects_analyzed)
        VALUES($1, $2, 1)
             ON CONFLICT(user_id, date) 
             DO UPDATE SET prospects_analyzed = hunter_usage_stats.prospects_analyzed + 1`,
            [prospect.searched_by, today]
        );

        return {
            id: prospectId,
            name: prospect.name,
            analysis
        };
    }

    /**
     * Probar conexión con la API
     */
    async testConnection() {
        try {
            await this.getConfig();

            if (!this.apiKey) {
                return { success: false, message: 'API Key no configurada' };
            }

            const url = `${this.baseUrl} /models/${this.model}: generateContent ? key = ${this.apiKey} `;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{
                        parts: [{ text: 'Responde solo con: OK' }]
                    }],
                    generationConfig: { maxOutputTokens: 10 }
                })
            });

            if (response.ok) {
                await db.query(
                    `UPDATE hunter_api_config 
                     SET last_tested_at = NOW(), test_result = 'success', is_active = TRUE
                     WHERE api_name = 'gemini_vertex'`
                );
                return { success: true, message: `Conexión exitosa con ${this.model} ` };
            } else {
                const error = await response.text();
                await db.query(
                    `UPDATE hunter_api_config 
                     SET last_tested_at = NOW(), test_result = 'failed'
                     WHERE api_name = 'gemini_vertex'`
                );
                return { success: false, message: `Error: ${response.status} - ${error} ` };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
    /**
     * Realizar una "Búsqueda Profunda" simulada con IA
     */
    async performDeepSearch(prospect) {
        await this.getConfig();
        const apiKey = this.apiKey;
        const model = this.model;
        const url = `${this.baseUrl}/models/${model}:generateContent?key=${apiKey}`;

        const prompt = `
            Actúa como un analista de marketing digital experto y "investigador de internet".
            Voy a proporcionarte datos de un prospecto obtenido de Google Maps.
            Tu tarea es "simular" los hallazgos de una búsqueda profunda en internet (RRSS, SEO, reputación online) y proporcionar un análisis estratégico avanzado.

            DATOS DEL PROSPECTO:
            - Nombre: ${prospect.name}
            - Teléfono: ${prospect.phone}
            - Web: ${prospect.website || 'No disponible'}
            - Dirección: ${prospect.address}
            - Ciudad: ${prospect.city}
            - Rating: ${prospect.rating} (${prospect.reviews_count} reseñas)

            ESTRUCTURA DE SALIDA (JSON):
            {
              "social_media": {
                "instagram": { "presence": "Alta/Media/Baja/Ninguna", "followers_est": "número", "last_post_est": "fecha aproximada", "score": 0-10 },
                "facebook": { "presence": "Alta/Media/Baja/Ninguna", "score": 0-10 },
                "linkedin": { "presence": "Alta/Media/Baja/Ninguna", "score": 0-10 }
              },
              "seo_analysis": {
                "found_on_first_page": boolean,
                "keywords_detected": ["palabra1", "palabra2"],
                "score": 0-10
              },
              "deep_insights": [
                "Observación detallada 1 (ej: Su web no es responsive)",
                "Observación detallada 2 (ej: No aparecen en Instagram, gran oportunidad)",
                "Observación detallada 3 (ej: Tienen malas reseñas recientes sobre tiempo de espera)"
              ],
              "opportunity_score": 0-100,
              "winning_strategy": "Descripción de la estrategia ganadora para contactar a este negocio basándonos en estos descubrimientos profundos."
            }

            Responde ÚNICAMENTE con el objeto JSON. No incluyas markdown.
        `;

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        maxOutputTokens: 2048,
                        temperature: 0.7
                    }
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Gemini Deep Search Error:', response.status, errorText);
                throw new Error(`Gemini Error: ${response.status}`);
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!text) throw new Error('No se recibió respuesta de IA');

            // Limpiar markdown si existe
            const cleanJson = text.replace(/```json\\n?|\\n?```/g, '').trim();
            return JSON.parse(cleanJson);
        } catch (error) {
            console.error('Error in deep search:', error);
            // Fallback
            return {
                social_media: { instagram: { presence: 'Baja' }, facebook: { presence: 'Baja' } },
                seo_analysis: { found_on_first_page: false, keywords_detected: [], score: 3 },
                deep_insights: ["No se pudo completar la búsqueda profunda, usando análisis base."],
                opportunity_score: 50,
                winning_strategy: "Contactar ofreciendo una auditoría digital completa."
            };
        }
    }

    /**
     * PASO D: Análisis Profundo de Auditoría Digital
     * Genera una auditoría 360º con datos reales de redes sociales
     */
    async analyzeProspectDeep(prospect) {
        await this.getConfig();

        // Preparar datos de social media (puede ser string JSON o objeto)
        let socialData = null;
        try {
            socialData = prospect.social_stats ?
                (typeof prospect.social_stats === 'string' ? JSON.parse(prospect.social_stats) : prospect.social_stats)
                : null;
        } catch (e) {
            console.warn('Error parsing social_stats:', e.message);
            socialData = null;
        }

        const hasSocialMedia = !!prospect.social_handle && !!socialData;
        const followers = socialData?.followers_count || 0;
        const isActive = socialData?.is_active || false;
        const lastPost = socialData?.last_post_date || 'Nunca';
        const engagement = socialData?.engagement_rate || 0;

        // Preparar reviews (puede ser string JSON o array)
        let reviewsText = 'Sin reseñas disponibles para análisis';
        try {
            if (prospect.reviews) {
                reviewsText = this.formatReviewsForAudit(prospect.reviews);
            }
        } catch (e) {
            console.warn('Error formatting reviews:', e.message);
        }

        // Construir prompt de auditoría digital
        const prompt = `
CONTEXTO: Eres un Consultor Senior de Transformación Digital especializado en PYMES.

OBJETIVO: Realizar una Auditoría Digital 360º de este negocio y diseñar la estrategia de venta óptima.

DATOS DEL NEGOCIO:
- Nombre: ${prospect.name}
- Tipo: ${prospect.business_type || 'Negocio'}
- Ubicación: ${prospect.city || 'No especificada'}
- Web: ${prospect.website || 'NO TIENE'}
- Rating Google: ${prospect.rating || 'N/A'}/5 (${prospect.reviews_count || 0} reseñas)
- Quality Score Preliminar: ${prospect.quality_score || 0}/100

PRESENCIA EN REDES SOCIALES:
- Instagram: ${hasSocialMedia ? `@${prospect.social_handle}` : 'NO DETECTADO'}
${hasSocialMedia ? `
- Seguidores: ${followers.toLocaleString()}
- Engagement Rate: ${engagement}%
- Último post: ${lastPost}
- Estado: ${isActive ? '✓ ACTIVO' : '✗ INACTIVO (>30 días sin postear)'}
` : '- Sin presencia detectada en redes sociales'}

RESEÑAS RECIENTES (Análisis de sentimiento):
${reviewsText}

ANÁLISIS REQUERIDO:

1. MADUREZ DIGITAL (Score 0-100):
   Evalúa cada área:
   - Web moderna y funcional: 0-30 pts
   - Presencia en redes activa: 0-30 pts
   - Reputación online gestionada: 0-20 pts
   - E-commerce / Reservas online: 0-20 pts
   
   Calcula el score total sumando los puntos de cada área.

2. DIAGNÓSTICO DE DOLOR (Pain Point Principal):
   Identifica el punto de dolor MÁS crítico y específico:
   Ejemplos:
   - "Instagram con 5k seguidores pero abandonado desde hace 6 meses - pierden engagement"
   - "Web antigua no responsive - pierden clientes mobile (80% del tráfico)"
   - "Reseñas negativas sin respuesta - daña reputación"
   - "Sin sistema de reservas online - llaman 50 veces/día"

3. ESTRATEGIA DE VENTA RECOMENDADA:
   Basándote en el diagnóstico, recomienda UNA de estas:
   - "Venta TPV" → Si es hostelería/retail sin mencionar Verifactu
   - "Venta Web" → Si no tiene web o está muy obsoleta
   - "Marketing Digital" → Si tiene web pero redes inactivas
   - "Pack Completo" → Si todo (web, redes, procesos) está mal

4. MENSAJE DE APERTURA (Sales Hook):
   Crea UNA frase de 1-2 líneas que:
   - Demuestre que investigaste (menciona dato ESPECÍFICO real)
   - Genere curiosidad sin ser vendedor
   - Use el tono: cercano pero profesional
   
   Ejemplos:
   - "He visto que tenéis ${followers} seguidores en IG pero no se puede reservar desde el perfil..."
   - "Vuestra web no carga en móvil y el 80% de las búsquedas son desde el móvil..."
   - "Tenéis ${prospect.reviews_count} reseñas pero 5 quejas sin respuesta en el último mes..."

SALIDA JSON (ESTRICTA - NO AÑADAS NADA MÁS):
{
  "digital_audit": {
    "score": 65,
    "web_status": "outdated",
    "social_health": "inactive",
    "reputation": "good",
    "details": {
      "web_score": 15,
      "social_score": 10,
      "reputation_score": 20,
      "ecommerce_score": 0
    }
  },
  "sales_intelligence": {
    "primary_pain_point": "Descripción MUY específica del dolor principal detectado",
    "suggested_product": "Producto/Servicio exacto a ofrecer",
    "opening_message": "Frase de apertura personalizada con dato real",
    "recommended_strategy": "Venta TPV|Venta Web|Marketing|Pack Completo",
    "estimated_value": 2500,
    "close_probability": 0.7
  },
  "tags": [1, 7, 12],
  "priority": "urgent"
}

VALIDACIONES:
- web_status: solo "modern", "outdated" o "missing"
- social_health: solo "healthy", "inactive", "missing" o "critical"
- reputation: solo "excellent", "good", "fair" o "poor"
- recommended_strategy: EXACTAMENTE uno de los 4 valores especificados
- priority: solo "urgent", "high", "medium" o "low"
- score: número entre 0 y 100
        `;

        // Llamar a Gemini
        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{ text: prompt }]
                }],
                generationConfig: {
                    responseMimeType: 'application/json',
                    maxOutputTokens: 1024,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!rawText) {
            throw new Error('No se recibió respuesta de Gemini');
        }

        // Parse JSON
        let analysis;
        try {
            analysis = JSON.parse(rawText);
        } catch (parseError) {
            console.error('Error parsing Gemini response:', rawText);
            throw new Error('Respuesta de IA no válida');
        }

        // Validar estructura
        if (!analysis.digital_audit || !analysis.sales_intelligence) {
            throw new Error('Estructura de análisis incompleta');
        }

        return analysis;
    }

    /**
     * Formatea reviews para el prompt de auditoría
     */
    formatReviewsForAudit(reviews) {
        if (!reviews || reviews.length === 0) return 'Sin reseñas';

        const reviewsData = typeof reviews === 'string' ? JSON.parse(reviews) : reviews;
        const recentReviews = reviewsData.slice(0, 5);

        return recentReviews.map((r, i) =>
            `${i + 1}. [${r.rating}⭐] ${r.text?.substring(0, 100) || 'Sin texto'}...`
        ).join('\n');
    }

    /**
     * Optimizar un prompt sugerido por el usuario
     */
    async refinePrompt(userPrompt) {
        await this.getConfig();
        const prompt = `
            ACTÚA COMO: Experto en Ingeniería de Prompts para IA de Ventas.
            TAREA: Convertir una idea vaga de búsqueda y análisis en un prompt estructurado y profesional para Gemini.
            IDEA DEL USUARIO: "${userPrompt}"

            REQUISITOS DEL PROMPT GENERADO:
            1. Debe instruir a la IA sobre qué buscar específicamente en el negocio (web, reseñas, redes).
            2. Debe definir el tono de la comunicación (ej: profesional, cercano, directo).
            3. Debe enfocarse en detectar "puntos de dolor" y ofrecer beneficios claros.
            4. Debe ser conciso pero potente.

            SALIDA: Solo el texto del prompt generado. Sin "Aquí tienes tu prompt", sin comillas, sin explicaciones.
        `;

        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7
                }
            })
        });

        if (!response.ok) throw new Error('Error al refinar prompt');
        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || userPrompt;
    }
}

module.exports = new GeminiService();
