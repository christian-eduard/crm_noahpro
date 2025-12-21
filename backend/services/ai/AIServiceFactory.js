/**
 * AIServiceFactory
 * Factory that returns the appropriate AI provider based on system configuration
 * Implements the Factory Pattern for swappable AI backends
 */

const db = require('../../config/database');
const DirectGeminiProvider = require('./providers/DirectGeminiProvider');
const StormsboysGatewayProvider = require('./providers/StormsboysGatewayProvider');

// Cache the provider instance to avoid repeated DB lookups
let cachedProvider = null;
let cacheExpiry = 0;
const CACHE_TTL = 60000; // 1 minute cache

class AIServiceFactory {
    /**
     * Get the current AI provider mode from configuration
     * @returns {Promise<Object>} { mode: 'direct'|'stormsboys_gateway', config: {...} }
     */
    static async getProviderConfig() {
        try {
            // First try system_settings table
            const settingsResult = await db.query(`
                SELECT setting_key, setting_value 
                FROM system_settings 
                WHERE setting_key IN ('ai_provider_mode', 'gateway_enabled', 'gateway_url', 'gateway_api_key')
            `);

            const settings = {};
            for (const row of settingsResult.rows) {
                settings[row.setting_key] = row.setting_value;
            }

            // Check if gateway is explicitly enabled
            const gatewayEnabled = settings.gateway_enabled === 'true';
            const mode = gatewayEnabled ? 'stormsboys_gateway' : (settings.ai_provider_mode || 'direct');

            return {
                mode,
                gatewayUrl: settings.gateway_url,
                gatewayApiKey: settings.gateway_api_key
            };
        } catch (error) {
            // Fallback: try hunter_api_config
            try {
                const configResult = await db.query(`
                    SELECT provider_mode, gateway_url, gateway_api_key 
                    FROM hunter_api_config 
                    WHERE api_name = 'gemini_vertex'
                `);

                if (configResult.rows.length > 0) {
                    const config = configResult.rows[0];
                    return {
                        mode: config.provider_mode || 'direct',
                        gatewayUrl: config.gateway_url,
                        gatewayApiKey: config.gateway_api_key
                    };
                }
            } catch (e) {
                console.warn('[AIServiceFactory] Config fallback failed:', e.message);
            }

            // Ultimate fallback: direct mode
            return { mode: 'direct' };
        }
    }

    /**
     * Get an AI provider instance based on current configuration
     * @param {boolean} forceRefresh - Force reload from DB (skip cache)
     * @returns {Promise<IAProvider>} An AI provider instance
     */
    static async getProvider(forceRefresh = false) {
        // Check cache
        const now = Date.now();
        if (!forceRefresh && cachedProvider && cacheExpiry > now) {
            return cachedProvider;
        }

        const config = await this.getProviderConfig();
        let provider;

        switch (config.mode) {
            case 'stormsboys_gateway':
                console.log('[AIServiceFactory] Using Stormsboys Gateway Provider');
                provider = new StormsboysGatewayProvider({
                    gatewayUrl: config.gatewayUrl,
                    apiKey: config.gatewayApiKey
                });
                break;

            case 'direct':
            default:
                console.log('[AIServiceFactory] Using Direct Gemini Provider');
                provider = new DirectGeminiProvider();
                break;
        }

        // Update cache
        cachedProvider = provider;
        cacheExpiry = now + CACHE_TTL;

        return provider;
    }

    /**
     * Clear the cached provider (use when config changes)
     */
    static clearCache() {
        cachedProvider = null;
        cacheExpiry = 0;
    }

    /**
     * Get the current provider mode without instantiating
     * @returns {Promise<string>} 'direct' or 'stormsboys_gateway'
     */
    static async getCurrentMode() {
        const config = await this.getProviderConfig();
        return config.mode;
    }

    /**
     * Set the AI provider mode in the database
     * @param {string} mode - 'direct' or 'stormsboys_gateway'
     * @param {Object} gatewayConfig - Optional gateway configuration
     */
    static async setProviderMode(mode, gatewayConfig = null) {
        const validModes = ['direct', 'stormsboys_gateway'];
        if (!validModes.includes(mode)) {
            throw new Error(`Invalid provider mode: ${mode}. Must be one of: ${validModes.join(', ')}`);
        }

        try {
            // Update system_settings
            await db.query(`
                INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
                VALUES ('ai_provider_mode', $1, 'string', NOW())
                ON CONFLICT (setting_key) 
                DO UPDATE SET setting_value = $1, updated_at = NOW()
            `, [mode]);

            await db.query(`
                INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
                VALUES ('gateway_enabled', $1, 'boolean', NOW())
                ON CONFLICT (setting_key) 
                DO UPDATE SET setting_value = $1, updated_at = NOW()
            `, [mode === 'stormsboys_gateway' ? 'true' : 'false']);

            // Update gateway config if provided
            if (gatewayConfig) {
                if (gatewayConfig.url) {
                    await db.query(`
                        INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
                        VALUES ('gateway_url', $1, 'string', NOW())
                        ON CONFLICT (setting_key) 
                        DO UPDATE SET setting_value = $1, updated_at = NOW()
                    `, [gatewayConfig.url]);
                }
                if (gatewayConfig.apiKey) {
                    // Encrypt the API key
                    const { encrypt } = require('../../utils/encryption');
                    const encryptedKey = encrypt(gatewayConfig.apiKey);
                    await db.query(`
                        INSERT INTO system_settings (setting_key, setting_value, setting_type, updated_at)
                        VALUES ('gateway_api_key', $1, 'encrypted', NOW())
                        ON CONFLICT (setting_key) 
                        DO UPDATE SET setting_value = $1, updated_at = NOW()
                    `, [encryptedKey]);
                }
            }

            // Also update hunter_api_config for backward compatibility
            await db.query(`
                UPDATE hunter_api_config 
                SET provider_mode = $1, 
                    gateway_url = COALESCE($2, gateway_url),
                    gateway_api_key = COALESCE($3, gateway_api_key)
                WHERE api_name = 'gemini_vertex'
            `, [mode, gatewayConfig?.url, gatewayConfig?.apiKey]);

            // Clear cache to use new settings
            this.clearCache();

            return { success: true, mode };
        } catch (error) {
            console.error('[AIServiceFactory] setProviderMode error:', error);
            throw error;
        }
    }

    /**
     * Test both providers and return status
     * @returns {Promise<Object>} Status of all providers
     */
    static async testAllProviders() {
        const results = {};

        // Test Direct Gemini
        try {
            const directProvider = new DirectGeminiProvider();
            results.direct = await directProvider.testConnection();
        } catch (error) {
            results.direct = { success: false, message: error.message };
        }

        // Test Gateway (if configured)
        try {
            const config = await this.getProviderConfig();
            if (config.gatewayUrl || config.gatewayApiKey) {
                const gatewayProvider = new StormsboysGatewayProvider({
                    gatewayUrl: config.gatewayUrl,
                    apiKey: config.gatewayApiKey
                });
                results.gateway = await gatewayProvider.testConnection();
            } else {
                results.gateway = { success: false, message: 'Gateway no configurado' };
            }
        } catch (error) {
            results.gateway = { success: false, message: error.message };
        }

        // Current active mode
        results.activeMode = await this.getCurrentMode();

        return results;
    }
}

module.exports = AIServiceFactory;
