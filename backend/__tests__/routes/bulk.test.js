const request = require('supertest');
const app = require('../../server');
const db = require('../../config/database');

describe('Bulk Operations API', () => {
    let testLeadIds = [];

    beforeAll(async () => {
        // Create multiple test leads
        for (let i = 1; i <= 3; i++) {
            const result = await db.pool.query(
                'INSERT INTO leads (name, email, status) VALUES ($1, $2, $3) RETURNING id',
                [`Bulk Test Lead ${i}`, `bulk${i}@example.com`, 'new']
            );
            testLeadIds.push(result.rows[0].id);
        }
    });

    afterAll(async () => {
        for (const id of testLeadIds) {
            await db.pool.query('DELETE FROM leads WHERE id = $1', [id]);
        }
        await db.pool.end();
    });

    describe('POST /api/leads/bulk/update-status', () => {
        it('should update status of multiple leads', async () => {
            const res = await request(app)
                .post('/api/leads/bulk/update-status')
                .send({
                    leadIds: testLeadIds,
                    status: 'qualified'
                })
                .expect(200);

            expect(res.body.message).toContain('actualizados');

            // Verify in database
            const result = await db.pool.query(
                'SELECT status FROM leads WHERE id = ANY($1)',
                [testLeadIds]
            );

            result.rows.forEach(row => {
                expect(row.status).toBe('qualified');
            });
        });

        it('should return 400 if leadIds missing', async () => {
            await request(app)
                .post('/api/leads/bulk/update-status')
                .send({ status: 'qualified' })
                .expect(400);
        });

        it('should return 400 if status missing', async () => {
            await request(app)
                .post('/api/leads/bulk/update-status')
                .send({ leadIds: testLeadIds })
                .expect(400);
        });
    });

    describe('POST /api/leads/bulk/add-tag', () => {
        let testTagId;

        beforeAll(async () => {
            const result = await db.pool.query(
                'INSERT INTO tags (name, color) VALUES ($1, $2) RETURNING id',
                ['Bulk Tag', '#FF0000']
            );
            testTagId = result.rows[0].id;
        });

        afterAll(async () => {
            await db.pool.query('DELETE FROM tags WHERE id = $1', [testTagId]);
        });

        it('should add tag to multiple leads', async () => {
            const res = await request(app)
                .post('/api/leads/bulk/add-tag')
                .send({
                    leadIds: testLeadIds.slice(0, 2),
                    tagId: testTagId
                })
                .expect(200);

            expect(res.body.message).toContain('agregado');

            // Verify in database
            const result = await db.pool.query(
                'SELECT COUNT(*) FROM lead_tags WHERE tag_id = $1 AND lead_id = ANY($2)',
                [testTagId, testLeadIds.slice(0, 2)]
            );

            expect(parseInt(result.rows[0].count)).toBe(2);
        });
    });

    describe('POST /api/leads/bulk/delete', () => {
        let deleteLeadIds = [];

        beforeAll(async () => {
            // Create leads specifically for deletion
            for (let i = 1; i <= 2; i++) {
                const result = await db.pool.query(
                    'INSERT INTO leads (name, email) VALUES ($1, $2) RETURNING id',
                    [`Delete Test ${i}`, `delete${i}@example.com`]
                );
                deleteLeadIds.push(result.rows[0].id);
            }
        });

        it('should delete multiple leads', async () => {
            const res = await request(app)
                .post('/api/leads/bulk/delete')
                .send({ leadIds: deleteLeadIds })
                .expect(200);

            expect(res.body.message).toContain('eliminados');

            // Verify they were deleted
            const result = await db.pool.query(
                'SELECT COUNT(*) FROM leads WHERE id = ANY($1)',
                [deleteLeadIds]
            );

            expect(parseInt(result.rows[0].count)).toBe(0);
        });
    });
});
