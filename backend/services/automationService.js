const cron = require('node-cron');
const db = require('../config/database');
const logger = require('../config/logger');

class AutomationService {
    constructor() {
        this.cronJob = null;
        this.isRunning = false;
    }

    // Initialize automation service
    async initialize() {
        try {
            const settings = await this.getSettings();

            if (settings && settings.enabled) {
                this.startCronJob();
                logger.info('Automation service initialized and started');
            } else {
                logger.info('Automation service initialized but disabled');
            }
        } catch (error) {
            logger.error('Error initializing automation service:', error);
        }
    }

    // Get automation settings
    async getSettings() {
        try {
            const result = await db.query('SELECT * FROM automation_settings LIMIT 1');
            return result.rows[0] || null;
        } catch (error) {
            logger.error('Error getting automation settings:', error);
            return null;
        }
    }

    // Start cron job (runs every hour)
    startCronJob() {
        if (this.cronJob) {
            this.cronJob.stop();
        }

        // Run every hour
        this.cronJob = cron.schedule('0 * * * *', async () => {
            await this.processLeads();
        });

        this.isRunning = true;
        logger.info('Automation cron job started');
    }

    // Stop cron job
    stopCronJob() {
        if (this.cronJob) {
            this.cronJob.stop();
            this.isRunning = false;
            logger.info('Automation cron job stopped');
        }
    }

    // Process leads for automation
    async processLeads() {
        try {
            const settings = await this.getSettings();

            if (!settings || !settings.enabled) {
                logger.info('Automation is disabled, skipping');
                return;
            }

            logger.info('Processing leads for automation...');

            // Get leads that need processing
            const leads = await this.getLeadsForProcessing();

            for (const lead of leads) {
                await this.processLead(lead, settings);
            }

            logger.info(`Processed ${leads.length} leads`);
        } catch (error) {
            logger.error('Error processing leads:', error);
        }
    }

    // Get leads that need processing
    async getLeadsForProcessing() {
        try {
            const query = `
                SELECT l.*, 
                       p.id as proposal_id,
                       p.created_at as proposal_created_at,
                       pv.last_viewed_at
                FROM leads l
                LEFT JOIN proposals p ON l.id = p.lead_id
                LEFT JOIN (
                    SELECT proposal_id, MAX(viewed_at) as last_viewed_at
                    FROM proposal_views
                    GROUP BY proposal_id
                ) pv ON p.id = pv.proposal_id
                WHERE l.status NOT IN ('won', 'lost')
                ORDER BY l.created_at DESC
            `;

            const result = await db.query(query);
            return result.rows;
        } catch (error) {
            logger.error('Error getting leads for processing:', error);
            return [];
        }
    }

    // Process individual lead
    async processLead(lead, settings) {
        try {
            // Check if initial proposal should be sent
            if (settings.send_initial_proposal && !lead.proposal_id) {
                await this.sendInitialProposal(lead);
                return;
            }

            // Check for reminder 1
            if (settings.reminder_1_enabled && lead.proposal_id && !lead.last_viewed_at) {
                const daysSinceCreated = this.getDaysSince(lead.proposal_created_at);

                if (daysSinceCreated >= settings.reminder_1_days) {
                    const alreadySent = await this.checkIfActionSent(lead.id, 'reminder_1');

                    if (!alreadySent) {
                        await this.sendReminder(lead, 'reminder_1');
                    }
                }
            }

            // Check for reminder 2
            if (settings.reminder_2_enabled && lead.proposal_id && !lead.last_viewed_at) {
                const daysSinceCreated = this.getDaysSince(lead.proposal_created_at);

                if (daysSinceCreated >= settings.reminder_2_days) {
                    const alreadySent = await this.checkIfActionSent(lead.id, 'reminder_2');

                    if (!alreadySent) {
                        await this.sendReminder(lead, 'reminder_2');
                    }
                }
            }
        } catch (error) {
            logger.error(`Error processing lead ${lead.id}:`, error);
        }
    }

    // Send initial proposal
    async sendInitialProposal(lead) {
        try {
            logger.info(`Sending initial proposal to lead ${lead.id}`);

            // TODO: Implement actual proposal creation and email sending
            // For now, just log the action

            await this.logAction(lead.id, 'initial_proposal', 'sent', {
                lead_name: lead.name,
                lead_email: lead.email
            });

            logger.info(`Initial proposal sent to ${lead.email}`);
        } catch (error) {
            logger.error(`Error sending initial proposal to lead ${lead.id}:`, error);
            await this.logAction(lead.id, 'initial_proposal', 'failed', { error: error.message });
        }
    }

    // Send reminder
    async sendReminder(lead, reminderType) {
        try {
            logger.info(`Sending ${reminderType} to lead ${lead.id}`);

            // TODO: Implement actual email sending
            // For now, just log the action

            await this.logAction(lead.id, reminderType, 'sent', {
                lead_name: lead.name,
                lead_email: lead.email
            });

            logger.info(`${reminderType} sent to ${lead.email}`);
        } catch (error) {
            logger.error(`Error sending ${reminderType} to lead ${lead.id}:`, error);
            await this.logAction(lead.id, reminderType, 'failed', { error: error.message });
        }
    }

    // Check if action was already sent
    async checkIfActionSent(leadId, actionType) {
        try {
            const result = await db.query(
                'SELECT id FROM automation_log WHERE lead_id = $1 AND action_type = $2 AND status = $3',
                [leadId, actionType, 'sent']
            );

            return result.rows.length > 0;
        } catch (error) {
            logger.error('Error checking if action was sent:', error);
            return false;
        }
    }

    // Log automation action
    async logAction(leadId, actionType, status, metadata = {}) {
        try {
            await db.query(
                'INSERT INTO automation_log (lead_id, action_type, status, metadata) VALUES ($1, $2, $3, $4)',
                [leadId, actionType, status, JSON.stringify(metadata)]
            );
        } catch (error) {
            logger.error('Error logging automation action:', error);
        }
    }

    // Get days since a date
    getDaysSince(date) {
        const now = new Date();
        const then = new Date(date);
        const diffTime = Math.abs(now - then);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    // Get automation logs
    async getLogs(limit = 50) {
        try {
            const result = await db.query(`
                SELECT al.*, l.name as lead_name
                FROM automation_log al
                JOIN leads l ON al.lead_id = l.id
                ORDER BY al.executed_at DESC
                LIMIT $1
            `, [limit]);

            return result.rows;
        } catch (error) {
            logger.error('Error getting automation logs:', error);
            return [];
        }
    }
}

// Export singleton instance
module.exports = new AutomationService();
