/**
 * Email Automation Service
 * Handles email sequences, scheduled sends, and tracking
 */

const db = require('../config/database');
const nodemailer = require('nodemailer');
const cron = require('node-cron');

class EmailAutomationService {
    constructor() {
        this.transporter = null;
        this.sequences = new Map();
    }

    /**
     * Initialize SMTP transporter from database settings
     */
    async initTransporter() {
        try {
            const result = await db.query(
                "SELECT key, value FROM crm_settings WHERE key LIKE 'smtp_%'"
            );

            if (result.rows.length === 0) {
                console.log('[EmailAutomation] SMTP not configured');
                return false;
            }

            const settings = {};
            result.rows.forEach(row => {
                settings[row.key.replace('smtp_', '')] = row.value;
            });

            this.transporter = nodemailer.createTransport({
                host: settings.host || 'smtp.gmail.com',
                port: parseInt(settings.port) || 587,
                secure: settings.port === '465',
                auth: {
                    user: settings.user,
                    pass: settings.password
                }
            });

            console.log('[EmailAutomation] SMTP transporter initialized');
            return true;
        } catch (error) {
            console.error('[EmailAutomation] Error initializing transporter:', error);
            return false;
        }
    }

    /**
     * Send a single email
     */
    async sendEmail(to, subject, html, from = null) {
        if (!this.transporter) {
            await this.initTransporter();
        }

        if (!this.transporter) {
            throw new Error('SMTP not configured');
        }

        const result = await db.query(
            "SELECT value FROM crm_settings WHERE key = 'smtp_user'"
        );
        const defaultFrom = result.rows[0]?.value || 'noreply@noahpro.es';

        const mailOptions = {
            from: from || defaultFrom,
            to,
            subject,
            html
        };

        try {
            const info = await this.transporter.sendMail(mailOptions);
            await this.logEmail(to, subject, 'sent', info.messageId);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            await this.logEmail(to, subject, 'failed', null, error.message);
            throw error;
        }
    }

    /**
     * Log email send attempt
     */
    async logEmail(to, subject, status, messageId = null, error = null) {
        try {
            await db.query(
                `INSERT INTO email_logs (recipient, subject, status, message_id, error_message, sent_at)
                 VALUES ($1, $2, $3, $4, $5, NOW())`,
                [to, subject, status, messageId, error]
            );
        } catch (err) {
            console.error('[EmailAutomation] Error logging email:', err);
        }
    }

    /**
     * Create an email sequence
     */
    async createSequence(name, emails, triggerType, triggerConfig) {
        try {
            const result = await db.query(
                `INSERT INTO email_sequences (name, emails, trigger_type, trigger_config, is_active)
                 VALUES ($1, $2, $3, $4, true)
                 RETURNING *`,
                [name, JSON.stringify(emails), triggerType, JSON.stringify(triggerConfig)]
            );
            return result.rows[0];
        } catch (error) {
            console.error('[EmailAutomation] Error creating sequence:', error);
            throw error;
        }
    }

    /**
     * Start a sequence for a lead
     */
    async startSequence(sequenceId, leadId) {
        try {
            const sequence = await db.query(
                'SELECT * FROM email_sequences WHERE id = $1 AND is_active = true',
                [sequenceId]
            );

            if (sequence.rows.length === 0) {
                throw new Error('Sequence not found or inactive');
            }

            await db.query(
                `INSERT INTO sequence_enrollments (sequence_id, lead_id, current_step, status, enrolled_at)
                 VALUES ($1, $2, 0, 'active', NOW())
                 ON CONFLICT (sequence_id, lead_id) DO NOTHING`,
                [sequenceId, leadId]
            );

            console.log(`[EmailAutomation] Lead ${leadId} enrolled in sequence ${sequenceId}`);
            return true;
        } catch (error) {
            console.error('[EmailAutomation] Error starting sequence:', error);
            throw error;
        }
    }

    /**
     * Process pending sequence emails (called by cron)
     */
    async processSequences() {
        try {
            // Get all active enrollments that need processing
            const enrollments = await db.query(`
                SELECT se.*, es.emails, l.email, l.name as lead_name
                FROM sequence_enrollments se
                JOIN email_sequences es ON se.sequence_id = es.id
                JOIN leads l ON se.lead_id = l.id
                WHERE se.status = 'active'
                AND se.next_send_at <= NOW()
            `);

            for (const enrollment of enrollments.rows) {
                await this.processEnrollment(enrollment);
            }

            return enrollments.rows.length;
        } catch (error) {
            console.error('[EmailAutomation] Error processing sequences:', error);
            return 0;
        }
    }

    /**
     * Process a single enrollment
     */
    async processEnrollment(enrollment) {
        const emails = typeof enrollment.emails === 'string'
            ? JSON.parse(enrollment.emails)
            : enrollment.emails;

        const currentEmail = emails[enrollment.current_step];
        if (!currentEmail) {
            // Sequence complete
            await db.query(
                "UPDATE sequence_enrollments SET status = 'completed' WHERE id = $1",
                [enrollment.id]
            );
            return;
        }

        // Replace placeholders
        let subject = currentEmail.subject.replace(/\{\{name\}\}/g, enrollment.lead_name);
        let body = currentEmail.body.replace(/\{\{name\}\}/g, enrollment.lead_name);

        try {
            await this.sendEmail(enrollment.email, subject, body);

            // Calculate next send time
            const nextStep = enrollment.current_step + 1;
            const nextEmail = emails[nextStep];
            let nextSendAt = null;

            if (nextEmail) {
                const delayMinutes = nextEmail.delay_minutes || 1440; // Default 24h
                nextSendAt = new Date(Date.now() + delayMinutes * 60 * 1000);
            }

            await db.query(
                `UPDATE sequence_enrollments 
                 SET current_step = $1, last_sent_at = NOW(), next_send_at = $2
                 WHERE id = $3`,
                [nextStep, nextSendAt, enrollment.id]
            );
        } catch (error) {
            console.error(`[EmailAutomation] Failed to send sequence email:`, error);
        }
    }

    /**
     * Track email open (via pixel)
     */
    async trackOpen(trackingId) {
        try {
            await db.query(
                `UPDATE email_logs SET opened_at = NOW(), opens = opens + 1 WHERE tracking_id = $1`,
                [trackingId]
            );
        } catch (error) {
            console.error('[EmailAutomation] Error tracking open:', error);
        }
    }

    /**
     * Setup cron job for sequence processing
     */
    setupCron() {
        // Process sequences every 5 minutes
        cron.schedule('*/5 * * * *', async () => {
            const processed = await this.processSequences();
            if (processed > 0) {
                console.log(`[EmailAutomation] Processed ${processed} sequence emails`);
            }
        });

        console.log('[EmailAutomation] Cron job scheduled (every 5 minutes)');
    }
}

// Singleton instance
const emailAutomation = new EmailAutomationService();

module.exports = emailAutomation;
