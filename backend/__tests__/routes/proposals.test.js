const request = require('supertest');

// Mock email services
jest.mock('../../services/emailService', () => ({
    sendNotificationEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendProposalEmail: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../services/proposalEmailService', () => ({
    sendProposalAcceptedEmail: jest.fn().mockResolvedValue(true),
    notifyAdminProposalAccepted: jest.fn().mockResolvedValue(true)
}));

const app = require('../../server');
const db = require('../../config/database');

describe('Proposals API - Critical Endpoints', () => {
    let testLeadId;
    let testProposalId;
    let testProposalToken;

    // Setup: Create a test lead and proposal before all tests
    beforeAll(async () => {
        // Create test lead
        const leadResult = await db.pool.query(
            `INSERT INTO leads (name, email, phone, status)
             VALUES ($1, $2, $3, $4) RETURNING id`,
            ['Test Client', 'test@example.com', '123456789', 'new']
        );
        testLeadId = leadResult.rows[0].id;

        // Create test proposal
        const proposalResult = await db.pool.query(
            `INSERT INTO proposals (lead_id, title, description, total_price, token, status, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
            [testLeadId, 'Test Proposal', 'Test Description', 5000, 'test-token-123', 'sent', 'system']
        );
        testProposalId = proposalResult.rows[0].id;
        testProposalToken = proposalResult.rows[0].token;
    });

    // Cleanup: Delete test data after all tests
    afterAll(async () => {
        await db.pool.query('DELETE FROM proposals WHERE id = $1', [testProposalId]);
        await db.pool.query('DELETE FROM leads WHERE id = $1', [testLeadId]);
        await db.pool.end();
    });

    describe('POST /api/proposals/:id/accept', () => {
        it('should accept a proposal successfully', async () => {
            const res = await request(app)
                .post(`/api/proposals/${testProposalId}/accept`)
                .expect(200);

            expect(res.body).toHaveProperty('message');
            expect(res.body.message).toContain('aceptada');
        });

        it('should update proposal status to accepted', async () => {
            // Verify in database
            const result = await db.pool.query(
                'SELECT status, accepted_at FROM proposals WHERE id = $1',
                [testProposalId]
            );

            expect(result.rows[0].status).toBe('accepted');
            expect(result.rows[0].accepted_at).not.toBeNull();
        });

        it('should update lead status to won', async () => {
            const result = await db.pool.query(
                'SELECT status FROM leads WHERE id = $1',
                [testLeadId]
            );

            expect(result.rows[0].status).toBe('won');
        });

        it('should return 404 for non-existent proposal', async () => {
            const res = await request(app)
                .post('/api/proposals/99999/accept')
                .expect(404);

            expect(res.body).toHaveProperty('error');
        });

        it('should create an activity record', async () => {
            const result = await db.pool.query(
                'SELECT * FROM activities WHERE lead_id = $1 AND type = $2',
                [testLeadId, 'proposal_accepted']
            );

            expect(result.rows.length).toBeGreaterThan(0);
            expect(result.rows[0].description).toContain('Test Proposal');
        });
    });

    describe('GET /api/proposals/public/:token', () => {
        it('should return proposal data for valid token', async () => {
            const res = await request(app)
                .get(`/api/proposals/public/${testProposalToken}`)
                .expect(200);

            expect(res.body).toHaveProperty('id', testProposalId);
            expect(res.body).toHaveProperty('title', 'Test Proposal');
            expect(res.body).toHaveProperty('lead_name');
        });

        it('should update viewed_at on first view', async () => {
            // Create a new unviewed proposal
            const result = await db.pool.query(
                `INSERT INTO proposals (lead_id, title, description, total_price, token, status, created_by)
                 VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
                [testLeadId, 'Unviewed Proposal', 'Test', 1000, 'unviewed-token', 'sent', 'system']
            );

            await request(app)
                .get(`/api/proposals/public/unviewed-token`)
                .expect(200);

            const updated = await db.pool.query(
                'SELECT viewed_at, status FROM proposals WHERE token = $1',
                ['unviewed-token']
            );

            expect(updated.rows[0].viewed_at).not.toBeNull();
            expect(updated.rows[0].status).toBe('viewed');

            // Cleanup
            await db.pool.query('DELETE FROM proposals WHERE token = $1', ['unviewed-token']);
        });

        it('should return 404 for invalid token', async () => {
            await request(app)
                .get('/api/proposals/public/invalid-token')
                .expect(404);
        });
    });
});
