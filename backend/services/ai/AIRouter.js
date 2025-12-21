/**
 * AI Router Service
 * Selecciona dinámicamente entre proveedores de IA según configuración
 * - DirectGeminiProvider: Conexión directa a Gemini API
 * - StormsboysGatewayProvider: Conexión a través del Gateway empresarial
 */

const db = require('../../config/database');
const geminiService = require('../geminiService'); // Instancia ya creada
const StormsboysGatewayProvider = require('./StormsboysGatewayProvider');

class AIRouter {
    constructor() {
        this.geminiService = geminiService; // Usar instancia existente
        this.gatewayProvider = new StormsboysGatewayProvider();
        this.mode = null; // 'direct' | 'stormsboys_gateway'
        this.lastConfigCheck = null;
        this.configCacheDuration = 60000; // 1 minuto
    }

    /**
     * Cargar configuración del modo activo desde la base de datos
     */
    async loadConfig(forceRefresh = false) {
        const now = Date.now();

        // Usar caché si es reciente
        if (!forceRefresh && this.lastConfigCheck && (now - this.lastConfigCheck) < this.configCacheDuration) {
            return this.mode;
        }

        try {
            const result = await db.query(`
                SELECT setting_value 
                FROM system_settings 
                WHERE setting_key = 'ai_provider_mode'
            `);

            if (result.rows.length > 0) {
                this.mode = result.rows[0].setting_value || 'direct';
            } else {
                this.mode = 'direct'; // Default
            }

            this.lastConfigCheck = now;
            console.log(`[AIRouter] Modo activo: ${this.mode}`);
            return this.mode;
        } catch (error) {
            console.warn('[AIRouter] Error cargando config, usando modo direct:', error.message);
            this.mode = 'direct';
            return this.mode;
        }
    }

    /**
     * Obtener el provider activo según configuración
     */
    async getActiveProvider() {
        await this.loadConfig();

        if (this.mode === 'stormsboys_gateway') {
            return this.gatewayProvider;
        }

        return this.geminiService;
    }

    /**
     * Analizar prospecto usando el provider activo
     * @param {Object} prospect - Datos del prospecto
     * @param {string} customPrompt - Prompt personalizado (opcional)
     */
    async analyzeProspect(prospect, customPrompt = null) {
        await this.loadConfig();

        console.log(`[AIRouter] Analizando prospecto ${prospect.id || prospect.name} con modo: ${this.mode}`);

        if (this.mode === 'stormsboys_gateway') {
            try {
                return await this.gatewayProvider.analyzeProspect(prospect, customPrompt);
            } catch (error) {
                console.error('[AIRouter] Gateway error, fallback a Gemini Direct:', error.message);
                // Fallback a Gemini si el gateway falla
                return await this.geminiService.analyzeProspect(prospect);
            }
        }

        // Modo direct: usar Gemini directamente
        return await this.geminiService.analyzeProspect(prospect);
    }

    /**
     * Generar contenido usando el provider activo
     */
    async generateContent(data, prompt, options = {}) {
        await this.loadConfig();

        if (this.mode === 'stormsboys_gateway') {
            try {
                return await this.gatewayProvider.generateContent(data, prompt, options);
            } catch (error) {
                console.error('[AIRouter] Gateway generation error:', error.message);
                // Fallback
                return await this.geminiService.generateWithAI(prompt, data);
            }
        }

        return await this.geminiService.generateWithAI(prompt, data);
    }

    /**
     * Refinar prompt usando el provider activo
     */
    async refinePrompt(prompt) {
        await this.loadConfig();

        if (this.mode === 'stormsboys_gateway') {
            try {
                return await this.gatewayProvider.refinePrompt(prompt);
            } catch (error) {
                console.warn('[AIRouter] Gateway refine error, using Gemini:', error.message);
                return await this.geminiService.refinePrompt(prompt);
            }
        }

        return await this.geminiService.refinePrompt(prompt);
    }

    /**
     * Probar conexión de todos los proveedores
     */
    async testAllProviders() {
        const results = {
            activeMode: this.mode || 'direct',
            direct: null,
            gateway: null
        };

        // Test Gemini Direct
        try {
            results.direct = await this.geminiService.testConnection();
        } catch (error) {
            results.direct = {
                success: false,
                message: error.message,
                provider: 'GeminiDirect'
            };
        }

        // Test Gateway
        try {
            results.gateway = await this.gatewayProvider.testConnection();
        } catch (error) {
            results.gateway = {
                success: false,
                message: error.message,
                provider: 'StormsboysGateway'
            };
        }

        return results;
    }

    /**
     * Cambiar modo de provider
     */
    async setMode(newMode) {
        if (!['direct', 'stormsboys_gateway'].includes(newMode)) {
            throw new Error('Modo no válido. Usar: direct o stormsboys_gateway');
        }

        await db.query(`
            INSERT INTO system_settings (setting_key, setting_value, setting_type, created_at, updated_at)
            VALUES ('ai_provider_mode', $1, 'string', NOW(), NOW())
            ON CONFLICT (setting_key) 
            DO UPDATE SET setting_value = $1, updated_at = NOW()
        `, [newMode]);

        this.mode = newMode;
        this.lastConfigCheck = Date.now();

        console.log(`[AIRouter] Modo cambiado a: ${newMode}`);
        return { success: true, mode: newMode };
    }
}

// Exportar instancia singleton
module.exports = new AIRouter();
