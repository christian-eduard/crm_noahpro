const { GoogleGenerativeAI } = require('@google/generative-ai');
const IAProvider = require('../IAProvider');
const db = require('../../../config/database');

class DirectGeminiProvider extends IAProvider {
    constructor(config = {}) {
        super(config);
        this.name = 'DirectGemini';
        this.model = null;
        this.client = null;
    }

    async initialize() {
        if (this.client) return;

        // Get API Key from DB if not provided in config
        let apiKey = this.config.apiKey;
        if (!apiKey) {
            const result = await db.query(
                "SELECT api_key, config_json FROM hunter_api_config WHERE api_name = 'gemini_vertex'"
            );
            if (result.rows.length === 0 || !result.rows[0].api_key) {
                throw new Error('Gemini API Key not configured');
            }
            apiKey = result.rows[0].api_key;
            this.config.modelName = result.rows[0].config_json?.model || 'gemini-2.0-flash-exp';
            this.config.systemInstruction = result.rows[0].config_json?.systemInstruction;
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const options = {};
        if (this.config.systemInstruction) {
            options.systemInstruction = this.config.systemInstruction;
        }

        this.model = genAI.getGenerativeModel({
            model: this.config.modelName || 'gemini-2.0-flash-exp',
            ...options
        });
        this.client = genAI; // Keep reference
    }

    async analyzeProspect(data, prompt) {
        await this.initialize();
        if (!this.model) throw new Error('Gemini model not initialized');

        try {
            const chat = this.model.startChat({
                history: [
                    {
                        role: "user",
                        parts: [{ text: prompt }],
                    },
                ],
            });

            const result = await chat.sendMessage("Proceder con el análisis JSON.");
            const response = await result.response;
            const text = response.text();

            // Extract JSON from markdown code blocks if present
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```\n([\s\S]*?)\n```/);
            const jsonStr = jsonMatch ? jsonMatch[1] : text;

            return this.parseResponse(jsonStr);
        } catch (error) {
            console.error('DirectGemini analyzeProspect error:', error);
            throw error;
        }
    }

    async generateContent(data, prompt, options = {}) {
        await this.initialize();

        try {
            // For simple generation, we can use generateContent directly
            const result = await this.model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.error('DirectGemini generateContent error:', error);
            throw error;
        }
    }

    async testConnection() {
        try {
            await this.initialize();
            const result = await this.model.generateContent('Say "Connected"');
            const response = await result.response;
            const text = response.text();
            return {
                success: text.toLowerCase().includes('connected'),
                message: 'Conexión exitosa con Gemini AI'
            };
        } catch (error) {
            return { success: false, message: error.message };
        }
    }
}

module.exports = DirectGeminiProvider;
