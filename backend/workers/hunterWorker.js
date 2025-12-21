const { Queue, Worker } = require('bullmq');
const { getRedisConnection, QUEUE_NAMES } = require('../config/queue');
const AIServiceFactory = require('../services/ai/AIServiceFactory');
const CRMService = require('../services/crmService');
const prompts = require('../services/ai/prompts');

// Process analysis job
const processAnalysisJob = async (job) => {
    const { prospectId, userId, businessData } = job.data;
    console.log(`[HunterWorker] Analyzing prospect ${prospectId}...`);

    try {
        const aiService = await AIServiceFactory.createService(userId);
        const prompt = prompts.ANALYZE_PROSPECT(businessData);
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
        const aiService = await AIServiceFactory.createService(userId);
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
