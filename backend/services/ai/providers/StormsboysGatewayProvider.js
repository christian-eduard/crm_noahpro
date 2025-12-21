const IAProvider = require('../IAProvider');
const axios = require('axios');

class StormsboysGatewayProvider extends IAProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'StormsboysGateway';
        this.gatewayUrl = config.gatewayUrl || 'https://gateway.stormsboys.com/api/ai'; // Default or from config
        this.apiKey = config.apiKey;
    }

    async analyzeProspect(data, prompt) {
        try {
            const response = await axios.post(`${this.gatewayUrl}/analyze`, {
                data,
                prompt,
                provider: 'gemini' // Can customize
            }, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            return response.data;
        } catch (error) {
            console.error('Gateway analyzeProspect error:', error);
            throw error;
        }
    }

    async generateContent(data, prompt, options = {}) {
        try {
            const response = await axios.post(`${this.gatewayUrl}/generate`, {
                data,
                prompt,
                options
            }, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` }
            });
            return response.data;
        } catch (error) {
            console.error('Gateway generateContent error:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            const response = await axios.get(`${this.gatewayUrl}/health`, {
                headers: { 'Authorization': `Bearer ${this.apiKey}` },
                timeout: 5000
            });
            return { success: true, message: 'Conectado a Stormsboys Gateway' };
        } catch (error) {
            return { success: false, message: error.message || 'Error conectando al Gateway' };
        }
    }
}

module.exports = StormsboysGatewayProvider;
