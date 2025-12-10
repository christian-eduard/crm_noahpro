module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/__tests__/**/*.test.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'routes/**/*.js',
        'services/**/*.js',
        '!**/node_modules/**',
        '!**/__tests__/**'
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    },
    testTimeout: 10000,
    setupFilesAfterEnv: ['./__tests__/setup.js']
};
