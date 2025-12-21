/**
 * DirectGeminiProvider
 * Implementation of IAProvider that connects directly to Google Gemini API
 * This wraps the existing geminiService logic in the new architecture
 */

const IAProvider = require('./IAProvider');
const db = require('../../config/database');
const { prepareForPrompt } = require('../../utils/htmlSanitizer');
const knowledgeService = require('../knowledgeService');

class DirectGeminiProvider extends IAProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'DirectGemini';
        this.apiKey = config.apiKey || null;
        this.model = config.model || 'gemini-2.0-flash-exp';
        this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
        this.customInstruction = null;
    }

    /**
     * Load API configuration from database
     */
    async loadConfig() {
        if (this.apiKey) return; // Already loaded

        const result = await db.query(
            "SELECT api_key, config_json FROM hunter_api_config WHERE api_name = 'gemini_vertex'"
        );

        if (result.rows.length === 0) {
            throw new Error('Gemini API no configurada en hunter_api_config');
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
    }

    /**
     * Get strategy-specific system instruction
     */
    getStrategyInstruction(strategy) {
        const context = `Eres un experto en ventas de sistemas TPV y normativa Verifactu (Ley Antifraude 2025/2027) en España.
CONTEXTO DEL PRODUCTO - NoahPro TPV:
- Sistema punto de venta con Verifactu integrado automático
- Cumplimiento 100% de la Ley Antifraude y Factura Electrónica
- Gestión integral (mesas, inventario, delivery, reporting)
- Soporte 24/7 y formación incluida`;

        const strategies = {
            'verifactu': `ENFOQUE: CUMPLIMIENTO LEGAL (VeriFactu / Ley Antifraude).
Tu objetivo es alertar sobre la obligatoriedad de la nueva ley y el riesgo de multas.`,
            'digital_kit': `ENFOQUE: KIT DIGITAL (Subvención a fondo perdido).
Tu objetivo es vender la oportunidad de conseguir el TPV GRATIS.`,
            'competitor': `ENFOQUE: MEJORA COMPETITIVA.
Tu objetivo es destacar ventajas sobre TPVs tradicionales.`,
            'general': `ENFOQUE: VENTA CONSULTIVA GENERAL.
Tu objetivo es detectar dolores del negocio y ofrecer solución.`
        };

        const specificInstruction = strategies[strategy] || strategies['general'];

        return `${context}

${specificInstruction}

INSTRUCCIONES DE SALIDA:
Devuelve SIEMPRE un JSON válido con:
{
  "tags": [array de IDs],
  "priority": "urgent|high|medium|low",
  "personalized_message": {
    "subject": "Asunto email persuasivo",
    "body": "Mensaje corto para WhatsApp/Email",
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
     * Analyze a prospect with Gemini AI
     * @param {Object} data - Prospect data
     * @param {string} prompt - Optional custom prompt
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeProspect(data, prompt = null) {
        await this.loadConfig();

        if (!this.apiKey) {
            throw new Error('API Key de Gemini no configurada');
        }

        // Fetch and sanitize web content if available
        let webContent = '';
        if (data.website) {
            try {
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 5000);
                const res = await fetch(data.website, {
                    signal: controller.signal,
                    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NoahProBot/1.0)' }
                });
                clearTimeout(timeoutId);

                if (res.ok) {
                    const html = await res.text();
                    // Use our new sanitizer for better token efficiency
                    webContent = prepareForPrompt(html, 3000);
                }
            } catch (e) {
                console.warn('[DirectGemini] Web fetch failed:', e.message);
            }
        }

        // Prepare reviews text
        const reviewsText = Array.isArray(data.reviews)
            ? data.reviews.map(r => `- "${r.text}" (${r.rating}★)`).join('\n')
            : 'No hay reseñas disponibles.';

        // Build prospect info prompt
        const prospectInfo = `
DATOS DEL NEGOCIO A ANALIZAR:
- Nombre: ${data.name}
- Tipo: ${data.business_type || 'Desconocido'}
- Dirección: ${data.address || 'No disponible'}
- Ciudad: ${data.city || 'No disponible'}
- Teléfono: ${data.phone || 'No disponible'}
- Sitio Web: ${data.website || 'NO TIENE WEB'}
- Rating: ${data.rating || 'Sin valoración'} (${data.reviews_count || 0} reseñas)

RESEÑAS RECIENTES:
${reviewsText}

CONTENIDO SITIO WEB (Extracto):
${webContent || 'No disponible o inaccesible'}

NOTAS INTERNAS: ${data.internal_notes || 'Ninguna'}

ANALIZA este negocio y devuelve el JSON con tu evaluación:`;

        // Determine system instruction
        let systemInstructionText = this.customInstruction;

        // NEW: Integrate AI Brain (Cerebro) Settings
        const brainSettings = await knowledgeService.getBrainSettings();
        const brainContext = await knowledgeService.getContextForAnalysis(data.ai_tags || []);

        if (!systemInstructionText) {
            systemInstructionText = this.getStrategyInstruction(data.strategy || 'general');

            // Apply Brain Personality if exists and not specifically using a strategy template
            if (brainSettings) {
                const brainPrefix = brainSettings.system_instruction_prefix || '';
                const brainSuffix = brainSettings.system_instruction_suffix || '';
                systemInstructionText = `${brainPrefix}\n\n${systemInstructionText}\n\n${brainSuffix}`;
            }
        }

        // Add the RAG knowledge context to the prospect info or as part of system instruction
        const finalProspectInfo = `${prospectInfo}\n\n${brainContext}`;

        // If strategy is a DB ID, fetch the template
        if (data.strategy && !isNaN(data.strategy)) {
            try {
                const stratResult = await db.query('SELECT prompt_template FROM hunter_strategies WHERE id = $1', [data.strategy]);
                if (stratResult.rows.length > 0) {
                    systemInstructionText = stratResult.rows[0].prompt_template;
                }
            } catch (e) {
                console.warn('[DirectGemini] Error fetching strategy:', e.message);
            }
        }

        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                system_instruction: {
                    parts: [{ text: systemInstructionText }]
                },
                contents: [{
                    parts: [{ text: finalProspectInfo }]
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
            throw new Error(`Gemini API Error: ${response.status} - ${error}`);
        }

        const responseData = await response.json();
        const textResponse = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!textResponse) {
            throw new Error('Respuesta vacía de Gemini');
        }

        // Parse JSON response
        try {
            const cleanJson = textResponse.replace(/```json\n?|\n?```/g, '').trim();
            const analysis = JSON.parse(cleanJson);

            // Ensure required fields exist
            if (!analysis.social_media) analysis.social_media = {};
            if (!analysis.review_analysis) {
                analysis.review_analysis = { sentiment: 'neutral', main_topics: [], improvement_suggestions: [] };
            }

            return analysis;
        } catch (parseError) {
            console.error('[DirectGemini] JSON parse error:', textResponse);
            throw new Error('La IA no devolvió un JSON válido');
        }
    }

    /**
     * Generate content (demos, proposals)
     */
    async generateContent(data, prompt, options = {}) {
        await this.loadConfig();

        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }],
                generationConfig: {
                    maxOutputTokens: options.maxTokens || 8192,
                    temperature: options.temperature || 0.7
                }
            })
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`Gemini API Error: ${response.status}`);
        }

        const responseData = await response.json();
        const text = responseData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error('No content generated');
        }

        return { content: text.replace(/```html\n?|\n?```/g, '').trim() };
    }

    /**
     * Refine a prompt
     */
    async refinePrompt(prompt) {
        await this.loadConfig();

        const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Mejora y optimiza este prompt para búsqueda de negocios: "${prompt}". Devuelve solo el prompt mejorado.`
                    }]
                }],
                generationConfig: { maxOutputTokens: 200 }
            })
        });

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || prompt;
    }

    /**
     * Test API connection
     */
    async testConnection() {
        try {
            await this.loadConfig();

            if (!this.apiKey) {
                return { success: false, message: 'API Key no configurada' };
            }

            const startTime = Date.now();
            const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;

            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: 'Responde solo con: OK' }] }],
                    generationConfig: { maxOutputTokens: 10 }
                })
            });

            const latency = Date.now() - startTime;

            if (response.ok) {
                return {
                    success: true,
                    message: `Conexión exitosa con ${this.model}`,
                    latency,
                    provider: this.name
                };
            } else {
                const error = await response.text();
                return { success: false, message: `Error: ${response.status}`, latency };
            }
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

module.exports = DirectGeminiProvider;
