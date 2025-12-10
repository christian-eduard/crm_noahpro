const request = require('supertest');
const express = require('express');
const usersRouter = require('../../routes/users');
const { Pool } = require('pg');

jest.mock('pg');
jest.mock('../../middleware/authMiddleware', () => ({
    protect: (req, res, next) => {
        req.user = { id: 1, username: 'admin', role: 'admin' };
        next();
    }
}));

// Mock database module
jest.mock('../../config/database', () => {
    const mockQuery = jest.fn();
    return {
        query: mockQuery,
        pool: { query: mockQuery }
    };
});

const db = require('../../config/database');

describe('Users Controller', () => {
    let app;
    let mockToken;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/users', usersRouter);

        db.query.mockClear();
        mockToken = 'Bearer test-token';
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('GET /api/users', () => {
        it('should return all users', async () => {
            const mockUsers = [
                { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin', created_at: new Date() },
                { id: 2, username: 'user1', email: 'user1@test.com', role: 'user', created_at: new Date() }
            ];

            db.query.mockResolvedValue({ rows: mockUsers });

            const response = await request(app)
                .get('/api/users')
                .set('Authorization', mockToken);

            expect(response.status).toBe(200);
            expect(response.body).toHaveLength(2);
            expect(response.body[0]).toHaveProperty('username', 'admin');
        });

        it('should handle database errors', async () => {
            db.query.mockRejectedValue(new Error('Database error'));

            const response = await request(app)
                .get('/api/users')
                .set('Authorization', mockToken);

            expect(response.status).toBe(500);
        });
    });

    describe('POST /api/users', () => {
        it('should create a new user with hashed password', async () => {
            const newUser = {
                username: 'newuser',
                email: 'newuser@test.com',
                password: 'password123',
                full_name: 'New User'
            };

            // Mock check for existing user (returns empty)
            db.query.mockResolvedValueOnce({ rows: [] });

            // Mock insert (returns new id)
            db.query.mockResolvedValueOnce({
                rows: [{ id: 3 }]
            });

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', mockToken)
                .send(newUser);

            expect(response.status).toBe(201);
            expect(response.body.user).toHaveProperty('username', newUser.username);
        });

        it('should prevent duplicate usernames', async () => {
            const duplicateUser = {
                username: 'admin',
                email: 'admin2@test.com',
                password: 'password123'
            };

            // Mock check for existing user (returns one found)
            db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', mockToken)
                .send(duplicateUser);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('existe');
        });

        it('should reject missing required fields', async () => {
            const invalidUser = {
                email: 'test@test.com'
            };

            const response = await request(app)
                .post('/api/users')
                .set('Authorization', mockToken)
                .send(invalidUser);

            expect(response.status).toBe(400);
        });
    });

    describe('PUT /api/users/:id', () => {
        it('should update user information', async () => {
            const userId = 2;
            const updates = {
                username: 'updateduser',
                email: 'updated@test.com'
            };

            // Mock check for existing user
            db.query.mockResolvedValueOnce({ rows: [{ id: userId }] });
            // Mock update
            db.query.mockResolvedValueOnce({ rowCount: 1 });

            const response = await request(app)
                .put(`/api/users/${userId}`)
                .set('Authorization', mockToken)
                .send(updates);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message', 'Usuario actualizado exitosamente');
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('should delete a user', async () => {
            const userId = 2;

            // Mock check for existing user
            db.query.mockResolvedValueOnce({ rows: [{ id: userId, role: 'user' }] });
            // Mock check for admin count (return 2 admins)
            db.query.mockResolvedValueOnce({ rows: [{ count: '2' }] });
            // Mock delete
            db.query.mockResolvedValueOnce({ rowCount: 1 });

            const response = await request(app)
                .delete(`/api/users/${userId}`)
                .set('Authorization', mockToken);

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('message');
        });

        it('should prevent deleting yourself', async () => {
            const userId = 1; // Same as authenticated user

            const response = await request(app)
                .delete(`/api/users/${userId}`)
                .set('Authorization', mockToken);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('No puedes eliminar tu propio usuario');
        });

        it('should prevent deleting the last admin', async () => {
            const userId = 2;

            // Mock check for existing user
            db.query.mockResolvedValueOnce({ rows: [{ id: userId, role: 'admin' }] });
            // Mock check for admin count (return 1 admin)
            db.query.mockResolvedValueOnce({ rows: [{ count: '1' }] });

            const response = await request(app)
                .delete(`/api/users/${userId}`)
                .set('Authorization', mockToken);

            expect(response.status).toBe(400);
            expect(response.body.error).toContain('último administrador');
        });

        it('should return 404 for non-existent user', async () => {
            const userId = 999;

            // Mock check for existing user (returns empty)
            db.query.mockResolvedValueOnce({ rows: [] });

            const response = await request(app)
                .delete(`/api/users/${userId}`)
                .set('Authorization', mockToken);

            expect(response.status).toBe(404);
        });
    });
});
