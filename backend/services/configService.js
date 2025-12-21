/**
 * Config Service
 * Centralized service for managing system configuration
 * Handles AI Gateway settings, Redis config, and other global settings
 */

const db = require('../config/database');
const { encrypt, decrypt, isEncrypted } = require('../utils/encryption');

// Cache for frequently accessed settings
const settingsCache = new Map();
const CACHE_TTL = 60000; // 1 minute

class ConfigService {
    /**
     * Get a single setting by key
     * @param {string} key - Setting key
     * @param {*} defaultValue - Default value if not found
     * @returns {Promise<*>} Setting value
     */
    static async get(key, defaultValue = null) {
        // Check cache first
        const cached = settingsCache.get(key);
        if (cached && cached.expiry > Date.now()) {
            return cached.value;
        }

        try {
            const result = await db.query(
                'SELECT setting_value, setting_type FROM system_settings WHERE setting_key = $1',
                [key]
            );

            if (result.rows.length === 0) {
                return defaultValue;
            }

            const { setting_value, setting_type } = result.rows[0];
            let value = setting_value;

            // Handle type conversion
            switch (setting_type) {
                case 'encrypted':
                    value = decrypt(setting_value);
                    break;
                case 'boolean':
                    value = setting_value === 'true';
                    break;
                case 'number':
                    value = Number(setting_value);
                    break;
                case 'json':
                    try {
                        value = JSON.parse(setting_value);
                    } catch (e) {
                        value = setting_value;
                    }
                    break;
                default:
                    value = setting_value;
            }

            // Update cache
            settingsCache.set(key, { value, expiry: Date.now() + CACHE_TTL });

            return value;
        } catch (error) {
            console.error(`[ConfigService] Error getting ${key}:`, error.message);
            return defaultValue;
        }
    }

    /**
     * Set a setting value
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     * @param {string} type - Setting type (string, encrypted, boolean, number, json)
     * @param {string} description - Optional description
     */
    static async set(key, value, type = 'string', description = null) {
        try {
            let storedValue = value;

            // Handle type-specific storage
            switch (type) {
                case 'encrypted':
                    storedValue = isEncrypted(value) ? value : encrypt(String(value));
                    break;
                case 'boolean':
                    storedValue = String(value);
                    break;
                case 'number':
                    storedValue = String(value);
                    break;
                case 'json':
                    storedValue = typeof value === 'string' ? value : JSON.stringify(value);
                    break;
                default:
                    storedValue = String(value);
            }

            await db.query(`
                INSERT INTO system_settings (setting_key, setting_value, setting_type, description, updated_at)
                VALUES ($1, $2, $3, COALESCE($4, (SELECT description FROM system_settings WHERE setting_key = $1)), NOW())
                ON CONFLICT (setting_key) 
                DO UPDATE SET setting_value = $2, setting_type = $3, updated_at = NOW()
            `, [key, storedValue, type, description]);

            // Clear cache for this key
            settingsCache.delete(key);

            return true;
        } catch (error) {
            console.error(`[ConfigService] Error setting ${key}:`, error.message);
            throw error;
        }
    }

    /**
     * Get multiple settings at once
     * @param {string[]} keys - Array of setting keys
     * @returns {Promise<Object>} Object with key-value pairs
     */
    static async getMany(keys) {
        const result = {};
        for (const key of keys) {
            result[key] = await this.get(key);
        }
        return result;
    }

    /**
     * Get all AI Gateway related settings
     * @returns {Promise<Object>} Gateway configuration
     */
    static async getGatewayConfig() {
        return {
            mode: await this.get('ai_provider_mode', 'direct'),
            enabled: await this.get('gateway_enabled', false),
            url: await this.get('gateway_url', 'https://api.stormsboys-gateway.com/v1'),
            apiKey: await this.get('gateway_api_key', ''),
            redisUrl: await this.get('redis_url', 'redis://localhost:6379')
        };
    }

    /**
     * Update AI Gateway configuration
     * @param {Object} config - Gateway configuration
     */
    static async setGatewayConfig(config) {
        if (config.enabled !== undefined) {
            await this.set('gateway_enabled', config.enabled, 'boolean');
        }
        if (config.mode !== undefined) {
            await this.set('ai_provider_mode', config.mode, 'string');
        }
        if (config.url !== undefined) {
            await this.set('gateway_url', config.url, 'string');
        }
        if (config.apiKey !== undefined && config.apiKey !== '') {
            await this.set('gateway_api_key', config.apiKey, 'encrypted');
        }

        // Clear the AI Factory cache
        const AIServiceFactory = require('./ai/AIServiceFactory');
        AIServiceFactory.clearCache();

        return this.getGatewayConfig();
    }

    /**
     * Test Redis connection
     * @returns {Promise<Object>} Connection status
     */
    static async testRedisConnection() {
        try {
            const { getRedisConnection } = require('../config/queue');
            const redis = getRedisConnection();

            const startTime = Date.now();
            await redis.ping();
            const latency = Date.now() - startTime;

            return {
                success: true,
                message: 'Redis connected',
                latency,
                version: await redis.info('server').then(info => {
                    const match = info.match(/redis_version:(\S+)/);
                    return match ? match[1] : 'unknown';
                })
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * Get system status including all services
     * @returns {Promise<Object>} System status
     */
    static async getSystemStatus() {
        const AIServiceFactory = require('./ai/AIServiceFactory');

        const [gatewayConfig, aiProviders, redisStatus] = await Promise.all([
            this.getGatewayConfig(),
            AIServiceFactory.testAllProviders(),
            this.testRedisConnection()
        ]);

        return {
            gateway: gatewayConfig,
            ai: aiProviders,
            redis: redisStatus,
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Clear the settings cache
     */
    static clearCache() {
        settingsCache.clear();
    }

    /**
     * Get all settings (for admin panel)
     * @returns {Promise<Array>} All settings
     */
    static async getAllSettings() {
        try {
            const result = await db.query(`
                SELECT setting_key, 
                       CASE WHEN setting_type = 'encrypted' THEN '********' ELSE setting_value END as setting_value,
                       setting_type,
                       description,
                       updated_at
                FROM system_settings
                ORDER BY setting_key
            `);
            return result.rows;
        } catch (error) {
            console.error('[ConfigService] Error getting all settings:', error.message);
            return [];
        }
    }
}

module.exports = ConfigService;
