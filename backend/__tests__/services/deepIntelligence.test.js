const prompts = require('../../services/ai/prompts');
const googlePlacesService = require('../../services/googlePlacesService');
const db = require('../../config/database');
const AIServiceFactory = require('../../services/ai/AIServiceFactory');
const CRMService = require('../../services/crmService');

// Mock dependencies
jest.mock('../../config/database');
jest.mock('../../services/ai/AIServiceFactory');

// Mock global fetch
global.fetch = jest.fn();

describe('NoahPro Deep Intelligence - Unit Tests', () => {

    beforeEach(() => {
        jest.resetAllMocks();
        // Default DB mock
        db.query.mockResolvedValue({ rows: [] });
    });

    describe('AI Prompts (prompts.js)', () => {
        const mockData = {
            name: 'Restaurante El Gourmet',
            business_type: 'Restaurante',
            address: 'Calle Mayor 1, Madrid',
            website: 'http://elgourmet.es',
            rating: 4.2,
            reviews_count: 156,
            reviews: [{ text: 'Excelente', rating: 5 }],
            webContent: 'Bienvenidos...'
        };

        it('should generate ANALYZE_PROSPECT prompt with correct business data', () => {
            const prompt = prompts.ANALYZE_PROSPECT(mockData);
            expect(prompt).toContain('Restaurante El Gourmet');
            expect(prompt).toContain('TPV/Datáfonos');
        });

        it('should handle missing website in ANALYZE_PROSPECT', () => {
            const noWebData = { ...mockData, website: null };
            const prompt = prompts.ANALYZE_PROSPECT(noWebData);
            expect(prompt).toContain('NO TIENE WEB');
        });
    });

    describe('Smart Cache (googlePlacesService.js)', () => {
        it('should generate consistent hashes for same query/location', () => {
            const hash1 = googlePlacesService.generateCacheHash('restaurantes', 'madrid');
            const hash2 = googlePlacesService.generateCacheHash('restaurantes ', ' Madrid');
            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(32);
        });

        it('should return results from cache if valid (Cache HIT)', async () => {
            const mockCachedResults = [{ name: 'Cached Bistro', place_id: '123' }];
            db.query.mockImplementation((sql) => {
                if (sql.includes('FROM search_cache_logs')) {
                    return Promise.resolve({
                        rows: [{ google_response_json: mockCachedResults, hit_count: 5 }]
                    });
                }
                return Promise.resolve({ rows: [] });
            });

            const results = await googlePlacesService.searchPlaces('restaurantes', 'madrid');
            expect(results).toEqual(mockCachedResults);
            expect(global.fetch).not.toHaveBeenCalled();
        });

        it('should fetch from Google and save to cache (Cache MISS)', async () => {
            const mockGoogleResults = {
                status: 'OK',
                results: [{ name: 'New Bistro', place_id: '456' }]
            };
            const mockGeoResults = {
                status: 'OK',
                results: [{ geometry: { location: { lat: 40.41, lng: -3.70 } } }]
            };

            db.query.mockImplementation((sql) => {
                if (sql.includes('SELECT api_key')) {
                    return Promise.resolve({ rows: [{ api_key: 'test-api-key' }] });
                }
                return Promise.resolve({ rows: [] });
            });

            global.fetch
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGeoResults) })
                .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(mockGoogleResults) });

            const results = await googlePlacesService.searchPlaces('restaurantes', 'madrid');
            expect(results).toEqual(mockGoogleResults.results);
            expect(global.fetch).toHaveBeenCalledTimes(2);
        });

        it('should track API cost correctly', async () => {
            await googlePlacesService.trackApiCost('search', false);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO api_cost_tracking'),
                ['search', false, 0.032]
            );
        });
    });

    describe('CRM Service (crmService.js)', () => {
        it('should update prospect analysis and track usage', async () => {
            const mockAnalysis = { priority: 'high', tags: [1, 2], reasoning: 'Test' };
            db.query.mockResolvedValue({ rows: [{ searched_by: 123 }] }); // For userID lookup

            await CRMService.updateProspectAnalysis(1, mockAnalysis);

            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('UPDATE maps_prospects SET'),
                expect.arrayContaining([JSON.stringify(mockAnalysis), 'high'])
            );
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO hunter_usage_stats'),
                expect.any(Array)
            );
        });

        it('should save prospect demo and return token', async () => {
            db.query.mockResolvedValueOnce({ rows: [{ searched_by: 123 }] }); // For userID
            db.query.mockResolvedValueOnce({ rows: [{ id: 456 }] }); // For insert return

            const result = await CRMService.saveProspectDemo(1, 'modern', '<html></html>');

            expect(result.success).toBe(true);
            expect(result.demoId).toBe(456);
            expect(result.publicToken).toHaveLength(32);
            expect(db.query).toHaveBeenCalledWith(
                expect.stringContaining('INSERT INTO hunter_demo_history'),
                expect.any(Array)
            );
        });
    });

    describe('Hunter Worker Logic (hunterWorker.js)', () => {
        const hunterWorker = require('../../workers/hunterWorker');

        it('should use custom prompt from DB if available', async () => {
            const customPromptText = "PROMPT PERSONALIZADO";
            db.query.mockImplementation((sql) => {
                if (sql.includes('system_prompts')) {
                    return Promise.resolve({ rows: [{ prompt_text: customPromptText }] });
                }
                return Promise.resolve({ rows: [] });
            });

            const mockAiService = { generateJSON: jest.fn().mockResolvedValue({ score: 80 }) };
            AIServiceFactory.getProvider.mockResolvedValue(mockAiService);

            const job = { data: { prospectId: 1, userId: 1, businessData: { name: 'Test' } } };
            await hunterWorker.processAnalysisJob(job);

            expect(mockAiService.generateJSON).toHaveBeenCalledWith(expect.stringContaining(customPromptText));
            // Verify it saved to CRM
            // Not checking CRMService here as it's mocked, but would verify interactions in integration test
        });

        it('should fallback to default prompt if DB fails', async () => {
            db.query.mockImplementation((sql) => {
                if (sql.includes('system_prompts')) {
                    return Promise.reject(new Error('DB Error'));
                }
                return Promise.resolve({ rows: [] });
            });

            const mockAiService = { generateJSON: jest.fn().mockResolvedValue({}) };
            AIServiceFactory.getProvider.mockResolvedValue(mockAiService);

            await hunterWorker.processAnalysisJob({ data: { prospectId: 1, userId: 1, businessData: { name: 'Test' } } });
            expect(mockAiService.generateJSON).toHaveBeenCalledWith(expect.stringContaining('ERES UN ANALISTA COMERCIAL EXPERTO'));
        });
    });
});
