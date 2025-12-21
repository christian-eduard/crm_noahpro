/**
 * StormsboysGatewayProvider
 * Implementation of IAProvider that routes requests through Stormsboys AI Gateway
 * Future-ready: Currently a placeholder that will connect to the enterprise gateway
 */

const IAProvider = require('./IAProvider');
const db = require('../../config/database');
const { decrypt } = require('../../utils/encryption');
const { prepareForPrompt } = require('../../utils/htmlSanitizer');

class StormsboysGatewayProvider extends IAProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'StormsboysGateway';
        this.gatewayUrl = config.gatewayUrl || 'https://api.stormsboys-gateway.com/v1';
        this.apiKey = config.apiKey || null;
        this.timeout = config.timeout || 30000;
    }

    /**
     * Load gateway configuration from database
     */
    async loadConfig() {
        if (this.apiKey) return; // Already loaded

        try {
            // Try system_settings first
            const settingsResult = await db.query(`
                SELECT setting_key, setting_value, setting_type 
                FROM system_settings 
                WHERE setting_key IN ('gateway_url', 'gateway_api_key')
            `);

            if (settingsResult.rows.length > 0) {
                for (const row of settingsResult.rows) {
                    if (row.setting_key === 'gateway_url') {
                        this.gatewayUrl = row.setting_value || this.gatewayUrl;
                    }
                    if (row.setting_key === 'gateway_api_key') {
                        // Decrypt the API key if encrypted
                        this.apiKey = row.setting_type === 'encrypted'
                            ? decrypt(row.setting_value)
                            : row.setting_value;
                    }
                }
            }

            // Fallback to hunter_api_config
            if (!this.apiKey) {
                const configResult = await db.query(`
                    SELECT gateway_url, gateway_api_key 
                    FROM hunter_api_config 
                    WHERE api_name = 'gemini_vertex'
                `);

                if (configResult.rows.length > 0) {
                    const config = configResult.rows[0];
                    this.gatewayUrl = config.gateway_url || this.gatewayUrl;
                    this.apiKey = config.gateway_api_key || '';
                }
            }
        } catch (error) {
            console.warn('[StormsboysGateway] Config load error:', error.message);
        }
    }

    /**
     * Make a request to the Stormsboys Gateway
     * @param {string} endpoint - Gateway endpoint
     * @param {Object} payload - Request payload
     * @returns {Promise<Object>} Response data
     */
    async gatewayRequest(endpoint, payload) {
        await this.loadConfig();

        const url = `${this.gatewayUrl}${endpoint}`;

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`,
                    'X-Client-Id': 'noahpro-crm',
                    'X-Request-Id': `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                },
                body: JSON.stringify(payload),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Gateway Error ${response.status}: ${errorText}`);
            }

            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);

            if (error.name === 'AbortError') {
                throw new Error('Gateway request timeout');
            }
            throw error;
        }
    }

    /**
     * Analyze a prospect via the AI Gateway
     * Uses standardized prompt format for gateway routing
     * @param {Object} data - Prospect data
     * @param {string} prompt - Custom prompt (optional)
     * @returns {Promise<Object>} Analysis result
     */
    async analyzeProspect(data, prompt = null) {
        // Prepare sanitized web content
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
                    webContent = prepareForPrompt(html, 3000);
                }
            } catch (e) {
                console.warn('[StormsboysGateway] Web fetch failed:', e.message);
            }
        }

        // Prepare standardized payload for gateway
        const payload = {
            task: 'prospect_analysis',
            model_preference: 'fast', // Let gateway choose optimal model
            input: {
                business: {
                    name: data.name,
                    type: data.business_type,
                    address: data.address,
                    city: data.city,
                    phone: data.phone,
                    website: data.website,
                    rating: data.rating,
                    reviews_count: data.reviews_count
                },
                reviews: Array.isArray(data.reviews) ? data.reviews.slice(0, 5) : [],
                web_content: webContent,
                internal_notes: data.internal_notes || '',
                strategy: data.strategy || 'general'
            },
            output_schema: {
                tags: 'array',
                priority: 'enum:urgent|high|medium|low',
                personalized_message: {
                    subject: 'string',
                    body: 'string',
                    channel: 'enum:whatsapp|email'
                },
                opportunity_map: {
                    strengths: 'array',
                    weaknesses: 'array',
                    pain_points: 'array',
                    solutions: 'array'
                },
                reasoning: 'string'
            },
            custom_prompt: prompt
        };

        try {
            const response = await this.gatewayRequest('/analyze', payload);

            // Gateway returns standardized response
            return response.result || response;
        } catch (error) {
            console.error('[StormsboysGateway] Analysis error:', error.message);
            throw new Error(`Gateway analysis failed: ${error.message}`);
        }
    }

    /**
     * Generate content via gateway
     */
    async generateContent(data, prompt, options = {}) {
        const payload = {
            task: 'content_generation',
            model_preference: options.quality || 'balanced',
            input: {
                context: data,
                instructions: prompt
            },
            output_format: options.format || 'html',
            max_tokens: options.maxTokens || 8192
        };

        try {
            const response = await this.gatewayRequest('/generate', payload);
            return { content: response.result || response.content };
        } catch (error) {
            throw new Error(`Gateway generation failed: ${error.message}`);
        }
    }

    /**
     * Refine a prompt via gateway
     */
    async refinePrompt(prompt) {
        const payload = {
            task: 'prompt_refinement',
            input: { original_prompt: prompt },
            domain: 'business_search'
        };

        try {
            const response = await this.gatewayRequest('/refine', payload);
            return response.refined_prompt || prompt;
        } catch (error) {
            console.warn('[StormsboysGateway] Refine failed, using original:', error.message);
            return prompt;
        }
    }

    /**
     * Test gateway connection
     */
    async testConnection() {
        await this.loadConfig();

        if (!this.apiKey) {
            return {
                success: false,
                message: 'Gateway API Key no configurada',
                provider: this.name
            };
        }

        try {
            const startTime = Date.now();

            const response = await this.gatewayRequest('/health', {
                client: 'noahpro-crm',
                timestamp: new Date().toISOString()
            });

            const latency = Date.now() - startTime;

            return {
                success: true,
                message: `Gateway conectado: ${response.status || 'OK'}`,
                latency,
                provider: this.name,
                gatewayVersion: response.version || 'unknown'
            };
        } catch (error) {
            return {
                success: false,
                message: `Error de conexión: ${error.message}`,
                provider: this.name
            };
        }
    }

    /**
     * Get usage statistics from gateway
     */
    async getUsageStats() {
        await this.loadConfig();

        try {
            const response = await this.gatewayRequest('/usage', {
                client: 'noahpro-crm',
                period: 'current_month'
            });

            return {
                provider: this.name,
                stats: response
            };
        } catch (error) {
            return {
                provider: this.name,
                stats: 'Not available',
                error: error.message
            };
        }
    }
}

module.exports = StormsboysGatewayProvider;
