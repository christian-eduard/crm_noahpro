const leadHunterService = require('../../services/leadHunterService');
const db = require('../../config/database');
const geminiService = require('../../services/geminiService');
const googlePlacesService = require('../../services/googlePlacesService');

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../services/geminiService');
jest.mock('../../services/googlePlacesService');

describe('LeadHunterService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default DB query mock implementation
        db.query.mockResolvedValue({ rows: [] });
    });

    describe('checkUserAccess', () => {
        it('should return access details for valid user', async () => {
            const mockUser = {
                has_lead_hunter_access: true,
                hunter_daily_limit: 50,
                hunter_prospects_today: 10,
                hunter_last_reset: new Date().toISOString().split('T')[0]
            };
            db.query.mockResolvedValue({ rows: [mockUser] });

            const result = await leadHunterService.checkUserAccess(1);

            expect(result.hasAccess).toBe(true);
            expect(result.remaining).toBe(40);
        });

        it('should throw error if user has no access', async () => {
            const mockUser = {
                has_lead_hunter_access: false
            };
            db.query.mockResolvedValue({ rows: [mockUser] });

            await expect(leadHunterService.checkUserAccess(1))
                .rejects.toThrow('No tienes acceso');
        });

        it('should throw error if daily limit reached', async () => {
            const mockUser = {
                has_lead_hunter_access: true,
                hunter_daily_limit: 50,
                hunter_prospects_today: 50,
                hunter_last_reset: new Date().toISOString().split('T')[0]
            };
            db.query.mockResolvedValue({ rows: [mockUser] });

            await expect(leadHunterService.checkUserAccess(1))
                .rejects.toThrow('límite diario');
        });
    });

    describe('generateDemo', () => {
        it('should generate demo and save public token', async () => {
            // Mock Access Check
            jest.spyOn(leadHunterService, 'checkUserAccess').mockResolvedValue(true);

            // Mock Prospect
            const mockProspect = { id: 1, name: 'Test Corp' };
            db.query.mockResolvedValueOnce({ rows: [mockProspect] }); // For prospect search

            // Mock Gemini
            const mockHtml = '<html>Demo</html>';
            geminiService.generateLandingPage.mockResolvedValue(mockHtml);

            // Mock History Insert
            db.query.mockResolvedValueOnce({ rows: [] }); // For history insert
            db.query.mockResolvedValueOnce({ rows: [] }); // For timestamp update
            db.query.mockResolvedValueOnce({ rows: [] }); // For usage stats

            await leadHunterService.generateDemo(1, 1, 'modern', '', '');

            // Verify db.query was called for history with a token
            const historyCall = db.query.mock.calls.find(call =>
                call[0].includes('INSERT INTO hunter_demo_history')
            );

            expect(historyCall).toBeDefined();
            // Check that params include 5 values (prospect, user, html, type, TOKEN)
            expect(historyCall[1].length).toBe(5);
            // Verify public_token param (index 4) is a string and reasonable length
            expect(typeof historyCall[1][4]).toBe('string');
            expect(historyCall[1][4].length).toBeGreaterThan(10);
        });
    });
});
