const request = require('supertest');

// Mock email service to prevent actual emails from being sent
jest.mock('../../services/emailService', () => ({
    sendNotificationEmail: jest.fn().mockResolvedValue(true),
    sendWelcomeEmail: jest.fn().mockResolvedValue(true),
    sendProposalEmail: jest.fn().mockResolvedValue(true)
}));

const app = require('../../server');
const db = require('../../config/database');

describe('Leads API', () => {
    let testLeadId;
    let createdLeadEmail;

    // Cleanup after tests
    afterAll(async () => {
        if (testLeadId) {
            await db.pool.query('DELETE FROM leads WHERE id = $1', [testLeadId]);
        }
        await db.pool.end();
    });

    describe('GET /api/leads', () => {
        it('should return all leads', async () => {
            const res = await request(app)
                .get('/api/leads')
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
        });

        it('should filter leads by status', async () => {
            // Create a test lead with specific status
            const result = await db.pool.query(
                `INSERT INTO leads (name, email, status)
                 VALUES ($1, $2, $3) RETURNING id`,
                ['Status Test Lead', 'statustest@example.com', 'qualified']
            );
            const leadId = result.rows[0].id;

            const res = await request(app)
                .get('/api/leads')
                .query({ status: 'qualified' })
                .expect(200);

            expect(res.body.some(lead => lead.id === leadId)).toBe(true);
            res.body.forEach(lead => {
                expect(lead.status).toBe('qualified');
            });

            // Cleanup
            await db.pool.query('DELETE FROM leads WHERE id = $1', [leadId]);
        });

        it('should search leads by name', async () => {
            const res = await request(app)
                .get('/api/leads')
                .query({ search: 'Test' })
                .expect(200);

            if (res.body.length > 0) {
                expect(res.body.some(lead =>
                    lead.name.toLowerCase().includes('test')
                )).toBe(true);
            }
        });
    });

    describe('POST /api/leads', () => {
        it('should create a new lead', async () => {
            const uniqueSuffix = Date.now();
            const newLead = {
                name: 'Jest Test Lead',
                email: `jesttest_${uniqueSuffix}@example.com`,
                phone: '987654321',
                businessName: 'Jest Test Corp'
            };

            const res = await request(app)
                .post('/api/leads')
                .send(newLead)
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe(newLead.name);
            expect(res.body.email).toBe(newLead.email);
            expect(res.body.status).toBe('new'); // Default status

            testLeadId = res.body.id; // Save for cleanup
            createdLeadEmail = newLead.email;
        });

        it('should return 400 if required fields missing', async () => {
            const res = await request(app)
                .post('/api/leads')
                .send({ email: 'incomplete@example.com' }) // Missing name
                .expect(400);

            expect(res.body).toHaveProperty('error');
        });

        it('should handle duplicate email gracefully', async () => {
            const duplicate = {
                name: 'Duplicate Test',
                email: createdLeadEmail, // Same as above
                phone: '111111111'
            };

            const res = await request(app)
                .post('/api/leads')
                .send(duplicate);

            // Depending on your implementation, this might be 400 or 409
            expect([400, 409]).toContain(res.statusCode);
        });
    });

    describe('GET /api/leads/:id', () => {
        beforeAll(async () => {
            if (!testLeadId) {
                const result = await db.pool.query(
                    `INSERT INTO leads (name, email, phone)
                     VALUES ($1, $2, $3) RETURNING id`,
                    ['Get Test Lead', 'gettest@example.com', '555555555']
                );
                testLeadId = result.rows[0].id;
            }
        });

        it('should return a specific lead by ID', async () => {
            const res = await request(app)
                .get(`/api/leads/${testLeadId}`)
                .expect(200);

            expect(res.body).toHaveProperty('id', testLeadId);
            expect(res.body).toHaveProperty('name');
        });

        it('should return 404 for non-existent lead', async () => {
            await request(app)
                .get('/api/leads/99999')
                .expect(404);
        });
    });

    describe('PUT /api/leads/:id', () => {
        it('should update a lead', async () => {
            const updatedData = {
                name: 'Updated Jest Lead',
                status: 'qualified'
            };

            const res = await request(app)
                .put(`/api/leads/${testLeadId}`)
                .send(updatedData)
                .expect(200);

            expect(res.body.name).toBe(updatedData.name);
            expect(res.body.status).toBe(updatedData.status);
        });
    });
});
