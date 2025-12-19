/**
 * Automation Engine Service
 * Evaluates triggers and executes actions based on automation rules
 */

const db = require('../config/database');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

class AutomationEngine {
    constructor() {
        this.rules = [];
        this.cronJobs = new Map();
    }

    /**
     * Load all active automation rules from database
     */
    async loadRules() {
        try {
            const result = await db.query(
                'SELECT * FROM automation_rules WHERE is_active = true ORDER BY id'
            );
            this.rules = result.rows;
            console.log(`[AutomationEngine] Loaded ${this.rules.length} active rules`);
            return this.rules;
        } catch (error) {
            console.error('[AutomationEngine] Error loading rules:', error);
            return [];
        }
    }

    /**
     * Evaluate a trigger against all rules
     * @param {string} triggerType - Type of trigger (status_change, tag_added, lead_created, time_based)
     * @param {object} context - Context data for the trigger
     */
    async evaluateTrigger(triggerType, context) {
        const matchingRules = this.rules.filter(rule =>
            rule.trigger_type === triggerType &&
            this.matchesTriggerConfig(rule.trigger_config, context)
        );

        for (const rule of matchingRules) {
            try {
                await this.executeAction(rule, context);
                await this.logExecution(rule.id, rule.name, triggerType, rule.action_type, context.leadId, 'success');
            } catch (error) {
                console.error(`[AutomationEngine] Error executing rule ${rule.name}:`, error);
                await this.logExecution(rule.id, rule.name, triggerType, rule.action_type, context.leadId, 'error', error.message);
            }
        }

        return matchingRules.length;
    }

    /**
     * Check if context matches the trigger configuration
     */
    matchesTriggerConfig(config, context) {
        if (!config) return true;

        // Match status change
        if (config.fromStatus && context.fromStatus !== config.fromStatus) return false;
        if (config.toStatus && context.toStatus !== config.toStatus) return false;

        // Match tag
        if (config.tagId && context.tagId !== config.tagId) return false;

        // Match source
        if (config.source && context.source !== config.source) return false;

        return true;
    }

    /**
     * Execute the action defined in a rule
     */
    async executeAction(rule, context) {
        const { action_type, action_config } = rule;

        switch (action_type) {
            case 'send_email':
                await this.actionSendEmail(action_config, context);
                break;
            case 'assign_user':
                await this.actionAssignUser(action_config, context);
                break;
            case 'add_tag':
                await this.actionAddTag(action_config, context);
                break;
            case 'change_status':
                await this.actionChangeStatus(action_config, context);
                break;
            case 'create_task':
                await this.actionCreateTask(action_config, context);
                break;
            case 'send_notification':
                await this.actionSendNotification(action_config, context);
                break;
            case 'webhook':
                await this.actionWebhook(action_config, context);
                break;
            default:
                console.warn(`[AutomationEngine] Unknown action type: ${action_type}`);
        }
    }

    /**
     * Action: Send Email
     */
    async actionSendEmail(config, context) {
        // Get SMTP settings from database
        const smtpResult = await db.query(
            "SELECT value FROM crm_settings WHERE key LIKE 'smtp_%'"
        );

        if (smtpResult.rows.length === 0) {
            throw new Error('SMTP not configured');
        }

        // Build transporter from settings
        const smtpSettings = {};
        smtpResult.rows.forEach(row => {
            const key = row.key.replace('smtp_', '');
            smtpSettings[key] = row.value;
        });

        // Get lead data
        const leadResult = await db.query('SELECT * FROM leads WHERE id = $1', [context.leadId]);
        if (leadResult.rows.length === 0) return;

        const lead = leadResult.rows[0];

        // Replace placeholders in template
        let subject = config.subject || 'Notification';
        let body = config.body || '';

        subject = subject.replace(/\{\{name\}\}/g, lead.name);
        subject = subject.replace(/\{\{email\}\}/g, lead.email);
        body = body.replace(/\{\{name\}\}/g, lead.name);
        body = body.replace(/\{\{email\}\}/g, lead.email);
        body = body.replace(/\{\{business_name\}\}/g, lead.business_name || '');

        console.log(`[AutomationEngine] Would send email to ${config.to || lead.email}: ${subject}`);
        // In production, actually send the email using nodemailer
    }

    /**
     * Action: Assign User
     */
    async actionAssignUser(config, context) {
        const userId = config.userId;
        await db.query(
            'UPDATE leads SET assigned_to = $1 WHERE id = $2',
            [userId, context.leadId]
        );
        console.log(`[AutomationEngine] Assigned lead ${context.leadId} to user ${userId}`);
    }

    /**
     * Action: Add Tag
     */
    async actionAddTag(config, context) {
        const tagId = config.tagId;
        await db.query(
            'INSERT INTO lead_tags (lead_id, tag_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [context.leadId, tagId]
        );
        console.log(`[AutomationEngine] Added tag ${tagId} to lead ${context.leadId}`);
    }

    /**
     * Action: Change Status
     */
    async actionChangeStatus(config, context) {
        const newStatus = config.status;
        await db.query(
            'UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2',
            [newStatus, context.leadId]
        );
        console.log(`[AutomationEngine] Changed lead ${context.leadId} status to ${newStatus}`);
    }

    /**
     * Action: Create Task
     */
    async actionCreateTask(config, context) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + (config.daysFromNow || 1));

        await db.query(
            `INSERT INTO tasks (title, description, due_date, priority, lead_id, user_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                config.title || 'Follow up',
                config.description || '',
                dueDate,
                config.priority || 'medium',
                context.leadId,
                config.assignTo || null
            ]
        );
        console.log(`[AutomationEngine] Created task for lead ${context.leadId}`);
    }

    /**
     * Action: Send Notification
     */
    async actionSendNotification(config, context) {
        await db.query(
            `INSERT INTO notifications (user_id, type, title, message, link)
             VALUES ($1, $2, $3, $4, $5)`,
            [
                config.userId,
                'automation',
                config.title || 'Automation Triggered',
                config.message || '',
                `/leads/${context.leadId}`
            ]
        );
        console.log(`[AutomationEngine] Sent notification to user ${config.userId}`);
    }

    /**
     * Action: Webhook
     */
    async actionWebhook(config, context) {
        const webhookUrl = config.url;
        if (!webhookUrl) return;

        const leadResult = await db.query('SELECT * FROM leads WHERE id = $1', [context.leadId]);
        const lead = leadResult.rows[0] || {};

        const payload = {
            event: context.triggerType,
            lead,
            timestamp: new Date().toISOString(),
            ...context
        };

        console.log(`[AutomationEngine] Would send webhook to ${webhookUrl}`);
        // In production, use fetch or axios to send the webhook
    }

    /**
     * Log automation execution
     */
    async logExecution(ruleId, ruleName, triggerType, actionType, leadId, status, errorMessage = null) {
        try {
            await db.query(
                `INSERT INTO automation_logs (rule_id, rule_name, trigger_type, action_type, lead_id, status, error_message)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [ruleId, ruleName, triggerType, actionType, leadId, status, errorMessage]
            );
        } catch (error) {
            console.error('[AutomationEngine] Error logging execution:', error);
        }
    }

    /**
     * Setup time-based triggers using cron
     */
    setupTimeTriggers() {
        const timeRules = this.rules.filter(r => r.trigger_type === 'time_based');

        for (const rule of timeRules) {
            const cronExpression = rule.trigger_config?.cron || '0 9 * * *'; // Default: 9 AM daily

            if (this.cronJobs.has(rule.id)) {
                this.cronJobs.get(rule.id).stop();
            }

            const job = cron.schedule(cronExpression, async () => {
                console.log(`[AutomationEngine] Time trigger fired for rule: ${rule.name}`);
                await this.executeTimeBasedRule(rule);
            });

            this.cronJobs.set(rule.id, job);
            console.log(`[AutomationEngine] Scheduled cron job for rule ${rule.name}: ${cronExpression}`);
        }
    }

    /**
     * Execute time-based rule (e.g., follow up on stale leads)
     */
    async executeTimeBasedRule(rule) {
        const config = rule.trigger_config || {};

        // Example: Find leads that haven't been updated in X days
        if (config.staleDays) {
            const result = await db.query(
                `SELECT id FROM leads 
                 WHERE updated_at < NOW() - INTERVAL '${config.staleDays} days'
                 AND status NOT IN ('won', 'lost')
                 LIMIT 100`
            );

            for (const lead of result.rows) {
                await this.executeAction(rule, { leadId: lead.id, triggerType: 'time_based' });
                await this.logExecution(rule.id, rule.name, 'time_based', rule.action_type, lead.id, 'success');
            }
        }
    }

    /**
     * Get automation logs
     */
    async getLogs(limit = 50) {
        const result = await db.query(
            `SELECT * FROM automation_logs ORDER BY executed_at DESC LIMIT $1`,
            [limit]
        );
        return result.rows;
    }

    /**
     * Get automation statistics
     */
    async getStats() {
        const result = await db.query(`
            SELECT 
                COUNT(*) as total_executions,
                COUNT(*) FILTER (WHERE status = 'success') as successful,
                COUNT(*) FILTER (WHERE status = 'error') as failed,
                COUNT(DISTINCT rule_id) as unique_rules
            FROM automation_logs
            WHERE executed_at > NOW() - INTERVAL '30 days'
        `);
        return result.rows[0];
    }
}

// Singleton instance
const automationEngine = new AutomationEngine();

module.exports = automationEngine;
