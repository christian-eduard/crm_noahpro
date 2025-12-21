const { Queue, Worker } = require('bullmq');
const { getRedisConnection, QUEUE_NAMES } = require('../config/queue');
const AIServiceFactory = require('../services/ai/AIServiceFactory');
const CRMService = require('../services/crmService');
const prompts = require('../services/ai/prompts');
const db = require('../config/database');

/**
 * Get active prompt from database, fallback to default prompts.js
 * Para Cerebro Abierto: permite editar prompts desde UI
 */
const getActivePrompt = async (category = 'hunter') => {
    try {
        const result = await db.query(
            'SELECT prompt_text FROM system_prompts WHERE is_active = TRUE AND category = $1 LIMIT 1',
            [category]
        );
        if (result.rows.length > 0 && result.rows[0].prompt_text) {
            console.log('[HunterWorker] Using custom prompt from DB');
            return result.rows[0].prompt_text;
        }
    } catch (error) {
        console.warn('[HunterWorker] Could not load prompt from DB, using default:', error.message);
    }
    return null; // Use default
};

/**
 * Build final prompt: DB custom prompt + business data, or default
 */
const buildAnalysisPrompt = async (businessData) => {
    const customPrompt = await getActivePrompt('hunter');

    if (customPrompt) {
        // Custom prompt from DB - inject business data
        return `${customPrompt}

DATOS DEL NEGOCIO:
- Nombre: ${businessData.name}
- Tipo: ${businessData.business_type || 'Desconocido'}
- Dirección: ${businessData.address || 'No disponible'}
- Web: ${businessData.website || 'NO TIENE'}
- Rating: ${businessData.rating || 'Sin valoración'} (${businessData.reviews_count || 0} reseñas)
- Teléfono: ${businessData.phone || 'No disponible'}

RESEÑAS:
${Array.isArray(businessData.reviews) ? businessData.reviews.map(r => `- "${r.text}" (${r.rating}★)`).join('\n') : 'No hay reseñas'}

CONTENIDO WEB:
${businessData.webContent || 'No disponible'}`;
    }

    // Default: use prompts.js
    return prompts.ANALYZE_PROSPECT(businessData);
};

// Process analysis job
const processAnalysisJob = async (job) => {
    const { prospectId, userId, businessData } = job.data;
    console.log(`[HunterWorker] Analyzing prospect ${prospectId}...`);

    try {
        const aiService = await AIServiceFactory.getProvider();
        const prompt = await buildAnalysisPrompt(businessData); // Now async, reads from DB
        const analysis = await aiService.generateJSON(prompt);
        await CRMService.updateProspectAnalysis(prospectId, analysis);

        return { success: true, analysis };
    } catch (error) {
        console.error(`[HunterWorker] Job ${job.id} failed:`, error);
        throw error;
    }
};

// Process batch job
const processBatchJob = async (job) => {
    console.log(`[BatchWorker] Processing batch for user ${job.data.userId}`);
    return { success: true, total: 0 };
};

// Process demo job
const processDemoJob = async (job) => {
    const { prospectId, userId, demoType, businessData } = job.data;
    console.log(`[HunterWorker] Generating demo for ${prospectId}...`);

    try {
        const aiService = await AIServiceFactory.getProvider();
        const prompt = prompts.GENERATE_LANDING(businessData, demoType);
        const htmlContent = await aiService.generateText(prompt);
        await CRMService.saveProspectDemo(prospectId, demoType, htmlContent);
        return { success: true };
    } catch (error) {
        console.error(`[HunterWorker] Demo job ${job.id} failed:`, error);
        throw error;
    }
};

let analysisWorker = null;
let batchWorker = null;
let demoWorker = null;

const startWorkers = () => {
    const connection = getRedisConnection();

    analysisWorker = new Worker(QUEUE_NAMES.HUNTER_ANALYSIS, processAnalysisJob, {
        connection, concurrency: 3, limiter: { max: 10, duration: 60000 }
    });

    batchWorker = new Worker(QUEUE_NAMES.HUNTER_BATCH, processBatchJob, {
        connection, concurrency: 1
    });

    demoWorker = new Worker(QUEUE_NAMES.HUNTER_DEMO, processDemoJob, {
        connection, concurrency: 2, limiter: { max: 5, duration: 60000 }
    });

    console.log('[HunterWorker] All workers started');
};

const stopWorkers = async () => {
    console.log('[HunterWorker] Stopping workers...');
    if (analysisWorker) await analysisWorker.close();
    if (batchWorker) await batchWorker.close();
    if (demoWorker) await demoWorker.close();
    console.log('[HunterWorker] All workers stopped');
};

module.exports = {
    startWorkers,
    stopWorkers,
    processAnalysisJob,
    processBatchJob,
    processDemoJob
};
