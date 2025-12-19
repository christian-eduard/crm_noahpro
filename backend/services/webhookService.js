/**
 * Webhook Service
 * Manages outgoing webhooks for CRM events
 */

const db = require('../config/database');

class WebhookService {
    constructor() {
        this.webhooks = [];
    }

    /**
     * Load all active webhooks from database
     */
    async loadWebhooks() {
        try {
            const result = await db.query(
                'SELECT * FROM webhooks WHERE is_active = true'
            );
            this.webhooks = result.rows;
            console.log(`[WebhookService] Loaded ${this.webhooks.length} active webhooks`);
            return this.webhooks;
        } catch (error) {
            console.error('[WebhookService] Error loading webhooks:', error);
            return [];
        }
    }

    /**
     * Fire webhooks for a specific event
     */
    async fireEvent(eventType, payload) {
        const matchingWebhooks = this.webhooks.filter(w =>
            w.events.includes(eventType) || w.events.includes('*')
        );

        const results = [];
        for (const webhook of matchingWebhooks) {
            try {
                const result = await this.sendWebhook(webhook, eventType, payload);
                results.push({ webhook: webhook.name, success: true, ...result });
            } catch (error) {
                results.push({ webhook: webhook.name, success: false, error: error.message });
                await this.logWebhook(webhook.id, eventType, payload, 'failed', error.message);
            }
        }

        return results;
    }

    /**
     * Send a webhook request
     */
    async sendWebhook(webhook, eventType, payload) {
        const body = {
            event: eventType,
            timestamp: new Date().toISOString(),
            data: payload
        };

        const headers = {
            'Content-Type': 'application/json',
            'X-Webhook-Event': eventType,
            'X-Webhook-Signature': this.generateSignature(body, webhook.secret)
        };

        // Add custom headers if defined
        if (webhook.headers) {
            const customHeaders = typeof webhook.headers === 'string'
                ? JSON.parse(webhook.headers)
                : webhook.headers;
            Object.assign(headers, customHeaders);
        }

        const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });

        const status = response.ok ? 'success' : 'failed';
        await this.logWebhook(webhook.id, eventType, payload, status, response.status.toString());

        return {
            status: response.status,
            statusText: response.statusText
        };
    }

    /**
     * Generate HMAC signature for webhook payload
     */
    generateSignature(payload, secret) {
        if (!secret) return '';
        const crypto = require('crypto');
        return crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
    }

    /**
     * Log webhook execution
     */
    async logWebhook(webhookId, eventType, payload, status, response) {
        try {
            await db.query(
                `INSERT INTO webhook_logs (webhook_id, event_type, payload, status, response, executed_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [webhookId, eventType, JSON.stringify(payload), status, response]
            );
        } catch (error) {
            console.error('[WebhookService] Error logging webhook:', error);
        }
    }

    /**
     * Get webhook logs
     */
    async getLogs(webhookId = null, limit = 50) {
        let query = 'SELECT * FROM webhook_logs';
        const params = [];

        if (webhookId) {
            query += ' WHERE webhook_id = $1';
            params.push(webhookId);
        }

        query += ' ORDER BY executed_at DESC LIMIT $' + (params.length + 1);
        params.push(limit);

        const result = await db.query(query, params);
        return result.rows;
    }

    /**
     * Test a webhook with sample data
     */
    async testWebhook(webhookId) {
        const result = await db.query('SELECT * FROM webhooks WHERE id = $1', [webhookId]);
        if (result.rows.length === 0) {
            throw new Error('Webhook not found');
        }

        const webhook = result.rows[0];
        const testPayload = {
            test: true,
            message: 'This is a test webhook from NoahPro CRM',
            timestamp: new Date().toISOString()
        };

        return await this.sendWebhook(webhook, 'test', testPayload);
    }
}

// Singleton instance
const webhookService = new WebhookService();

module.exports = webhookService;
