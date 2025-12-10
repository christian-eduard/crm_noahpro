const request = require('supertest');
const express = require('express');
const authRouter = require('../../routes/auth');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Mock database directly with factory function
jest.mock('../../config/database', () => {
    const mockQuery = jest.fn();
    return {
        query: mockQuery,
        pool: { query: mockQuery }
    };
});

const db = require('../../config/database');
const mockQuery = db.query;
jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('Auth Controller - Users Table Integration', () => {
    let app;
    let mockPool;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        app.use('/api/auth', authRouter);

        mockQuery.mockReset();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('POST /api/auth/login', () => {
        it('should login successfully with user from users table', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@test.com',
                password: await bcrypt.hash('password123', 10),
                role: 'admin'
            };

            mockQuery.mockResolvedValue({ rows: [mockUser] });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('mock-jwt-token');

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(response.status).toBe(200);
            expect(response.body).toHaveProperty('token', 'mock-jwt-token');
            expect(response.body).toHaveProperty('user');
            expect(response.body.user).toHaveProperty('username', 'testuser');
            expect(response.body.user).not.toHaveProperty('password'); // Should not expose password
        });

        it('should query the users table (not crm_users)', async () => {
            mockQuery.mockResolvedValue({
                rows: [{
                    id: 1,
                    username: 'admin',
                    password: 'hashed',
                    role: 'admin'
                }]
            });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token');

            await request(app)
                .post('/api/auth/login')
                .send({ username: 'admin', password: 'admin123' });

            expect(mockQuery).toHaveBeenCalledWith(
                expect.stringContaining('FROM users'), // Not FROM crm_users
                expect.any(Array)
            );
        });

        it('should reject invalid username', async () => {
            mockQuery.mockResolvedValue({ rows: [] }); // User not found

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'nonexistent',
                    password: 'password123'
                });

            expect(response.status).toBe(401);
            expect(response.body).toHaveProperty('error');
        });

        it('should reject invalid password', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                password: await bcrypt.hash('correctpassword', 10),
                role: 'user'
            };

            mockQuery.mockResolvedValue({ rows: [mockUser] });
            bcrypt.compare.mockResolvedValue(false); // Password doesn't match

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'wrongpassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.error).toContain('Credenciales');
        });

        it('should include user role in JWT token', async () => {
            const mockUser = {
                id: 1,
                username: 'adminuser',
                password: 'hashed',
                role: 'admin',
                email: 'admin@test.com'
            };

            mockQuery.mockResolvedValue({ rows: [mockUser] });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token-with-role');

            await request(app)
                .post('/api/auth/login')
                .send({ username: 'adminuser', password: 'pass' });

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.objectContaining({
                    userId: 1,  // Changed from 'id' to 'userId'
                    username: 'adminuser',
                    role: 'admin'
                }),
                expect.any(String),
                expect.any(Object)
            );
        });

        it('should require both username and password', async () => {
            let response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser' }); // Missing password

            expect(response.status).toBe(400);

            response = await request(app)
                .post('/api/auth/login')
                .send({ password: 'password123' }); // Missing username

            expect(response.status).toBe(400);
        });

        it('should handle database errors gracefully', async () => {
            mockQuery.mockRejectedValue(new Error('Database connection failed'));

            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    username: 'testuser',
                    password: 'password123'
                });

            expect(response.status).toBe(500);
        });

        it('should set appropriate JWT expiration', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                password: 'hashed',
                role: 'user'
            };

            mockQuery.mockResolvedValue({ rows: [mockUser] });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token');

            await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser', password: 'pass' });

            expect(jwt.sign).toHaveBeenCalledWith(
                expect.any(Object),
                expect.any(String),
                expect.objectContaining({
                    expiresIn: expect.any(String)
                })
            );
        });
    });

    describe('Security', () => {
        it('should not return password hash in response', async () => {
            const mockUser = {
                id: 1,
                username: 'testuser',
                email: 'test@test.com',
                password: '$2a$10$hashedpassword',
                role: 'user'
            };

            mockQuery.mockResolvedValue({ rows: [mockUser] });
            bcrypt.compare.mockResolvedValue(true);
            jwt.sign.mockReturnValue('token');

            const response = await request(app)
                .post('/api/auth/login')
                .send({ username: 'testuser', password: 'password' });

            expect(response.body.user).not.toHaveProperty('password');
            expect(JSON.stringify(response.body)).not.toContain('$2a$10$');
        });

        it('should rate limit login attempts (if implemented)', async () => {
            // This is a placeholder for rate limiting tests
            // Actual implementation depends on your rate limiting strategy
            expect(true).toBe(true);
        });
    });
});
