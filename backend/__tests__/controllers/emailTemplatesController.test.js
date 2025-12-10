const request = require('supertest');
const express = require('express');
const fs = require('fs');
const path = require('path');
const emailTemplatesRouter = require('../../routes/emailTemplates');

jest.mock('fs');
jest.mock('../../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { id: 1, username: 'admin', role: 'admin' };
        next();
    }
}));

describe('Email Templates Controller', () => {
    let app;
    let mockToken;

    beforeEach(() => {
        app = express();
        app.use(express.json());

        // Mock authentication
        app.use((req, res, next) => {
            req.user = { id: 1, username: 'admin' };
            next();
        });

        app.use('/api/email-templates', emailTemplatesRouter);

        mockToken = 'Bearer test-token';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/email-templates', () => {
        it('should return all email templates', async () => {
            const mockFiles = ['proposal.html', 'welcome.html', 'notification.html'];
            const mockContent = '<html><body>Test Template</body></html>';
            const mockStats = { mtime: new Date() };

            fs.readdirSync.mockReturnValue(mockFiles);
            fs.readFileSync.mockReturnValue(mockContent);
            fs.statSync.mockReturnValue(mockStats);

            const response = await request(app)
                .get('/api/email-templates')
                .set('Authorization', mockToken);

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(3);
            expect(response.body[0]).toHaveProperty('id', 'proposal');
            expect(response.body[0]).toHaveProperty('content');
            expect(response.body[0]).toHaveProperty('updated_at');
        });

        it('should handle file system errors', async () => {
            fs.readdirSync.mockImplementation(() => {
                throw new Error('Permission denied');
            });

            const response = await request(app)
                .get('/api/email-templates')
                .set('Authorization', mockToken);

            expect(response.status).toBe(500);
            expect(response.body).toHaveProperty('error');
        });

        it('should filter only HTML files', async () => {
            const mockFiles = ['proposal.html', 'readme.txt', 'welcome.html', 'config.json'];

            fs.readdirSync.mockReturnValue(mockFiles);
            fs.readFileSync.mockReturnValue('<html></html>');
            fs.statSync.mockReturnValue({ mtime: new Date() });

            const response = await request(app)
                .get('/api/email-templates')
                .set('Authorization', mockToken);

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2); // Only HTML files
        });
    });

    describe('PUT /api/email-templates/:id', () => {
        it('should update template content successfully', async () => {
            const templateId = 'proposal';
            const newContent = '<html><body>Updated Template</body></html>';

            fs.existsSync.mockReturnValue(true);
            fs.writeFileSync.mockImplementation(() => { });

            const response = await request(app)
                .put(`/api/email-templates/${templateId}`)
                .set('Authorization', mockToken)
                .send({ content: newContent });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
            expect(response.body).toHaveProperty('id', templateId);
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining(`${templateId}.html`),
                newContent,
                'utf8'
            );
        });

        it('should return 400 if content is missing', async () => {
            const response = await request(app)
                .put('/api/email-templates/proposal')
                .set('Authorization', mockToken)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('Content is required');
        });

        it('should return 404 for non-existent template', async () => {
            fs.existsSync.mockReturnValue(false);

            const response = await request(app)
                .put('/api/email-templates/nonexistent')
                .set('Authorization', mockToken)
                .send({ content: '<html></html>' });

            expect(response.status).toBe(404);
            expect(response.body.error).toContain('not found');
        });

        it('should handle file write errors', async () => {
            fs.existsSync.mockReturnValue(true);
            fs.writeFileSync.mockImplementation(() => {
                throw new Error('Disk full');
            });

            const response = await request(app)
                .put('/api/email-templates/proposal')
                .set('Authorization', mockToken)
                .send({ content: '<html></html>' });

            expect(response.status).toBe(500);
        });

        it('should validate HTML content structure', async () => {
            const validHTML = '<!DOCTYPE html><html><head></head><body></body></html>';

            fs.existsSync.mockReturnValue(true);
            fs.writeFileSync.mockImplementation(() => { });

            const response = await request(app)
                .put('/api/email-templates/proposal')
                .set('Authorization', mockToken)
                .send({ content: validHTML });

            expect(response.status).toBe(200);
        });
    });

    describe('Security', () => {
        it('should prevent path traversal attacks', async () => {
            const maliciousId = '../../../etc/passwd';

            const response = await request(app)
                .put(`/ api / email - templates / ${maliciousId} `)
                .set('Authorization', mockToken)
                .send({ content: 'malicious' });

            expect(response.status).toBe(404);
        });

        it('should only allow .html extension', async () => {
            fs.existsSync.mockReturnValue(false);

            const response = await request(app)
                .put('/api/email-templates/template.php')
                .set('Authorization', mockToken)
                .send({ content: '<?php echo "hack"; ?>' });

            expect(response.status).toBe(404);
        });
    });
});
