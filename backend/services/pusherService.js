const Pusher = require('pusher');
const db = require('../config/database');
const logger = require('../config/logger');

let pusherInstance = null;
let lastConfigFetch = 0;
const CONFIG_CACHE_TTL = 60000; // 1 minute cache

const getPusherInstance = async () => {
    const now = Date.now();

    // Return cached instance if valid
    if (pusherInstance && (now - lastConfigFetch < CONFIG_CACHE_TTL)) {
        return pusherInstance;
    }

    try {
        // Fetch settings from DB
        const result = await db.query('SELECT pusher_app_id, pusher_key, pusher_secret, pusher_cluster FROM crm_settings ORDER BY id DESC LIMIT 1');

        if (result.rows.length > 0) {
            const settings = result.rows[0];

            if (settings.pusher_app_id && settings.pusher_key && settings.pusher_secret) {
                pusherInstance = new Pusher({
                    appId: settings.pusher_app_id,
                    key: settings.pusher_key,
                    secret: settings.pusher_secret,
                    cluster: settings.pusher_cluster || 'eu',
                    useTLS: true
                });
                lastConfigFetch = now;
                return pusherInstance;
            }
        }

        // Fallback to env vars if DB settings are missing
        if (process.env.PUSHER_APP_ID) {
            pusherInstance = new Pusher({
                appId: process.env.PUSHER_APP_ID,
                key: process.env.PUSHER_KEY,
                secret: process.env.PUSHER_SECRET,
                cluster: process.env.PUSHER_CLUSTER,
                useTLS: true
            });
            return pusherInstance;
        }

        return null;
    } catch (error) {
        logger.error('Error initializing Pusher:', error);
        return null;
    }
};

const trigger = async (channel, event, data) => {
    try {
        const pusher = await getPusherInstance();

        if (!pusher) {
            logger.warn('Pusher not configured, skipping event trigger');
            return;
        }

        await pusher.trigger(channel, event, data);
        logger.info(`Pusher event triggered: ${channel} -> ${event}`);
    } catch (error) {
        logger.error('Error triggering Pusher event:', error);
    }
};

module.exports = {
    trigger
};
