const request = require('supertest');
const express = require('express');
const settingsController = require('../../controllers/settingsController');
const db = require('../../config/database');

// Mock database
jest.mock('../../config/database', () => ({
    query: jest.fn(),
    pool: {
        connect: jest.fn()
    }
}));

const app = express();
app.use(express.json());
app.put('/api/settings', settingsController.updateSettings);
app.get('/api/settings', settingsController.getSettings);

describe('Settings Controller - Invoice Settings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('updateSettings', () => {
        it('should update invoice settings', async () => {
            const mockSettings = {
                demo_url: 'http://test.com',
                invoice_prefix: 'TEST-',
                next_invoice_number: 100,
                default_tax_rate: 15,
                invoice_due_days: 15,
                auto_invoice_on_proposal_accept: true
            };

            db.query.mockResolvedValueOnce({ rows: [mockSettings] });

            const res = await request(app)
                .put('/api/settings')
                .send(mockSettings);

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockSettings);

            // Verify query parameters
            const updateQuery = db.query.mock.calls[0];
            expect(updateQuery[0]).toContain('invoice_prefix');
            expect(updateQuery[0]).toContain('next_invoice_number');
            expect(updateQuery[1]).toContain('TEST-');
            expect(updateQuery[1]).toContain(100);
        });
    });

    describe('getSettings', () => {
        it('should return invoice settings', async () => {
            const mockSettings = {
                demo_url: 'http://test.com',
                invoice_prefix: 'INV-',
                next_invoice_number: 1,
                default_tax_rate: 21,
                invoice_due_days: 30,
                auto_invoice_on_proposal_accept: false
            };

            db.query.mockResolvedValueOnce({ rows: [mockSettings] });

            const res = await request(app)
                .get('/api/settings');

            expect(res.status).toBe(200);
            expect(res.body).toEqual(mockSettings);
        });
    });
});
