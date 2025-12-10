const request = require('supertest');
const app = require('../../server');
const db = require('../../config/database');

describe('Tags API', () => {
    let testTagId;
    let testLeadId;

    beforeAll(async () => {
        // Create a test lead
        const leadResult = await db.pool.query(
            'INSERT INTO leads (name, email) VALUES ($1, $2) RETURNING id',
            ['Tag Test Lead', 'tagtest@example.com']
        );
        testLeadId = leadResult.rows[0].id;
    });

    afterAll(async () => {
        if (testTagId) {
            await db.pool.query('DELETE FROM tags WHERE id = $1', [testTagId]);
        }
        if (testLeadId) {
            await db.pool.query('DELETE FROM leads WHERE id = $1', [testLeadId]);
        }
        await db.pool.end();
    });

    describe('GET /api/tags', () => {
        it('should return all tags', async () => {
            const res = await request(app)
                .get('/api/tags')
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.length).toBeGreaterThan(0);
        });

        it('should return tags with correct structure', async () => {
            const res = await request(app)
                .get('/api/tags')
                .expect(200);

            const tag = res.body[0];
            expect(tag).toHaveProperty('id');
            expect(tag).toHaveProperty('name');
            expect(tag).toHaveProperty('color');
        });
    });

    describe('POST /api/tags', () => {
        it('should create a new tag', async () => {
            const newTag = {
                name: 'Test Tag',
                color: '#FF0000'
            };

            const res = await request(app)
                .post('/api/tags')
                .send(newTag)
                .expect(201);

            expect(res.body).toHaveProperty('id');
            expect(res.body.name).toBe(newTag.name);
            expect(res.body.color).toBe(newTag.color);

            testTagId = res.body.id;
        });

        it('should use default color if not provided', async () => {
            const newTag = { name: 'Default Color Tag' };

            const res = await request(app)
                .post('/api/tags')
                .send(newTag)
                .expect(201);

            expect(res.body.color).toBe('#3B82F6');

            // Cleanup
            await db.pool.query('DELETE FROM tags WHERE id = $1', [res.body.id]);
        });

        it('should return 400 for duplicate tag name', async () => {
            const duplicate = {
                name: 'Test Tag', // Same as created above
                color: '#00FF00'
            };

            const res = await request(app)
                .post('/api/tags')
                .send(duplicate);

            expect([400, 409]).toContain(res.statusCode);
        });
    });

    describe('POST /api/tags/lead/:leadId', () => {
        it('should add tag to lead', async () => {
            const res = await request(app)
                .post(`/api/tags/lead/${testLeadId}`)
                .send({ tagId: testTagId })
                .expect(200);

            expect(res.body.message).toContain('agregado');
        });

        it('should return 404 for non-existent lead', async () => {
            await request(app)
                .post('/api/tags/lead/99999')
                .send({ tagId: testTagId })
                .expect(404);
        });
    });

    describe('GET /api/tags/lead/:leadId', () => {
        it('should return tags for a lead', async () => {
            const res = await request(app)
                .get(`/api/tags/lead/${testLeadId}`)
                .expect(200);

            expect(Array.isArray(res.body)).toBe(true);
            expect(res.body.some(tag => tag.id === testTagId)).toBe(true);
        });
    });

    describe('DELETE /api/tags/lead/:leadId/:tagId', () => {
        it('should remove tag from lead', async () => {
            await request(app)
                .delete(`/api/tags/lead/${testLeadId}/${testTagId}`)
                .expect(200);

            // Verify it was removed
            const res = await request(app)
                .get(`/api/tags/lead/${testLeadId}`);

            expect(res.body.some(tag => tag.id === testTagId)).toBe(false);
        });
    });
});
