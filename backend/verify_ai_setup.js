require('dotenv').config();
const AIServiceFactory = require('./services/ai/AIServiceFactory');

async function testAIServiceFactory() {
    console.log('Testing AIServiceFactory...');
    try {
        const provider = await AIServiceFactory.getProvider();
        console.log('Provider obtained successfully:', provider.constructor.name);

        if (provider.constructor.name === 'DirectGeminiProvider' || provider.constructor.name === 'StormsboysGatewayProvider') {
            console.log('Provider type is valid.');
        } else {
            console.error('Unknown provider type:', provider.constructor.name);
            process.exit(1);
        }

        console.log('AIServiceFactory verification passed.');
    } catch (error) {
        console.error('AIServiceFactory verification failed:', error);
        process.exit(1);
    }
}

testAIServiceFactory();
