/**
 * Queue Configuration
 * Configures BullMQ queues for async processing of AI analysis jobs
 */

const { Queue, Worker, QueueEvents } = require('bullmq');
const Redis = require('ioredis');

// Redis connection options
const REDIS_CONFIG = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null, // Required by BullMQ
    enableReadyCheck: false
};

// Create Redis connection
let redisConnection = null;

const getRedisConnection = () => {
    if (!redisConnection) {
        redisConnection = new Redis(REDIS_CONFIG);

        redisConnection.on('error', (err) => {
            console.error('[Redis] Connection error:', err.message);
        });

        redisConnection.on('connect', () => {
            console.log('[Redis] Connected successfully');
        });
    }
    return redisConnection;
};

// Queue names
const QUEUE_NAMES = {
    HUNTER_ANALYSIS: 'hunter-analysis',
    HUNTER_DEMO: 'hunter-demo',
    HUNTER_BATCH: 'hunter-batch'
};

// Queue instances (lazy loaded)
const queues = {};

/**
 * Get or create a queue by name
 * @param {string} queueName - Name of the queue
 * @returns {Queue} BullMQ Queue instance
 */
const getQueue = (queueName) => {
    if (!queues[queueName]) {
        queues[queueName] = new Queue(queueName, {
            connection: getRedisConnection(),
            defaultJobOptions: {
                removeOnComplete: {
                    count: 100, // Keep last 100 completed jobs
                    age: 3600   // Or jobs older than 1 hour
                },
                removeOnFail: {
                    count: 50   // Keep last 50 failed jobs for debugging
                },
                attempts: 3,
                backoff: {
                    type: 'exponential',
                    delay: 1000
                }
            }
        });
    }
    return queues[queueName];
};

/**
 * Get queue events for monitoring
 * @param {string} queueName - Name of the queue
 * @returns {QueueEvents} BullMQ QueueEvents instance
 */
const getQueueEvents = (queueName) => {
    return new QueueEvents(queueName, {
        connection: getRedisConnection()
    });
};

/**
 * Add a job to the hunter analysis queue
 * @param {Object} jobData - Job data
 * @param {Object} options - Job options
 * @returns {Promise<Job>} Added job
 */
const addAnalysisJob = async (jobData, options = {}) => {
    const queue = getQueue(QUEUE_NAMES.HUNTER_ANALYSIS);
    return await queue.add('analyze-prospect', jobData, {
        priority: options.priority || 5,
        ...options
    });
};

/**
 * Add a batch analysis job
 * @param {Object} jobData - Batch job data
 * @returns {Promise<Job>} Added job
 */
const addBatchJob = async (jobData) => {
    const queue = getQueue(QUEUE_NAMES.HUNTER_BATCH);
    return await queue.add('batch-analyze', jobData, {
        priority: 10 // Lower priority for batch jobs
    });
};

/**
 * Add a demo generation job
 * @param {Object} jobData - Demo job data
 * @returns {Promise<Job>} Added job
 */
const addDemoJob = async (jobData) => {
    const queue = getQueue(QUEUE_NAMES.HUNTER_DEMO);
    return await queue.add('generate-demo', jobData, {
        priority: 3 // Higher priority for demo generation
    });
};

/**
 * Get queue statistics
 * @param {string} queueName - Queue name
 * @returns {Promise<Object>} Queue stats
 */
const getQueueStats = async (queueName) => {
    const queue = getQueue(queueName);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount()
    ]);

    return {
        queue: queueName,
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + delayed
    };
};

/**
 * Get all queues statistics
 * @returns {Promise<Object>} All queues stats
 */
const getAllQueuesStats = async () => {
    const stats = {};
    for (const name of Object.values(QUEUE_NAMES)) {
        stats[name] = await getQueueStats(name);
    }
    return stats;
};

/**
 * Graceful shutdown - close all connections
 */
const closeQueues = async () => {
    console.log('[Queues] Closing connections...');

    for (const [name, queue] of Object.entries(queues)) {
        try {
            await queue.close();
            console.log(`[Queues] Closed queue: ${name}`);
        } catch (error) {
            console.error(`[Queues] Error closing ${name}:`, error.message);
        }
    }

    if (redisConnection) {
        await redisConnection.quit();
        console.log('[Redis] Connection closed');
    }
};

// Export
module.exports = {
    getRedisConnection,
    getQueue,
    getQueueEvents,
    addAnalysisJob,
    addBatchJob,
    addDemoJob,
    getQueueStats,
    getAllQueuesStats,
    closeQueues,
    QUEUE_NAMES,
    REDIS_CONFIG
};
