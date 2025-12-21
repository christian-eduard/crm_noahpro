/**
 * IAProvider - Abstract Base Class for AI Providers
 * All AI providers (Gemini Direct, Stormsboys Gateway, etc.) must implement this interface
 */

class IAProvider {
    constructor(config = {}) {
        if (new.target === IAProvider) {
            throw new Error('IAProvider is an abstract class and cannot be instantiated directly');
        }
        this.config = config;
        this.name = 'BaseProvider';
    }

    /**
     * Get the provider name/identifier
     * @returns {string}
     */
    getName() {
        return this.name;
    }

    /**
     * Analyze a prospect with AI
     * @param {Object} data - Prospect data to analyze
     * @param {string} prompt - Analysis prompt/instructions
     * @returns {Promise<Object>} - Analysis result
     */
    async analyzeProspect(data, prompt) {
        throw new Error('analyzeProspect() must be implemented by subclass');
    }

    /**
     * Generate content (demos, proposals, etc.)
     * @param {Object} data - Data for generation
     * @param {string} prompt - Generation prompt
     * @param {Object} options - Additional options (type, style, etc.)
     * @returns {Promise<Object>} - Generated content
     */
    async generateContent(data, prompt, options = {}) {
        throw new Error('generateContent() must be implemented by subclass');
    }

    /**
     * Refine/improve a prompt for better AI responses
     * @param {string} prompt - Original prompt
     * @returns {Promise<string>} - Refined prompt
     */
    async refinePrompt(prompt) {
        throw new Error('refinePrompt() must be implemented by subclass');
    }

    /**
     * Test the connection to the AI provider
     * @returns {Promise<Object>} - { success: boolean, message: string, latency?: number }
     */
    async testConnection() {
        throw new Error('testConnection() must be implemented by subclass');
    }

    /**
     * Get usage statistics (if available)
     * @returns {Promise<Object>} - Usage data
     */
    async getUsageStats() {
        return { provider: this.name, stats: 'Not available' };
    }

    /**
     * Prepare data for the AI request (sanitization, formatting)
     * @param {Object} data - Raw data
     * @returns {Object} - Prepared data
     */
    prepareData(data) {
        // Default implementation - subclasses can override
        return data;
    }

    /**
     * Parse the AI response into a structured format
     * @param {string|Object} response - Raw AI response
     * @returns {Object} - Parsed response
     */
    parseResponse(response) {
        // Default implementation - try JSON parse
        if (typeof response === 'string') {
            try {
                return JSON.parse(response);
            } catch {
                return { raw: response };
            }
        }
        return response;
    }
}

module.exports = IAProvider;
