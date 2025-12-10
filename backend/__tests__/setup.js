// Suppress console errors during tests
global.console = {
    ...console,
    error: jest.fn(),
    warn: jest.fn(),
};

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.SMTP_HOST = 'smtp.test.com';
process.env.SMTP_USER = 'test@test.com';
process.env.SMTP_PASS = 'test-password';
process.env.FRONTEND_URL = 'http://localhost:5174';
process.env.ADMIN_EMAIL = 'admin@test.com';
