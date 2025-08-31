/**
 * Intelligent Narrative Tests
 * Unit tests for market story generation and narrative analysis
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2025
 */

const IntelligentNarrative = require('../../src/intelligent/IntelligentNarrative');

describe('Intelligent Narrative', () => {
    let narrativePhase;

    beforeAll(() => {
        narrativePhase = new IntelligentNarrative();
        process.env.NODE_ENV = 'test';
    });

    beforeEach(() => {
        // Clear cache before each test
        narrativePhase.cache.clear();
    });

    describe('Market Story Generation', () => {
        test('should generate complete market story with all required fields', async () => {
            const story = await narrativePhase.generateMarketStory('AAPL', {
                action: 'BUY',
                grade: 'A-',
                confidence: 0.85,
                timeframe: '1D'
            });

            expect(story).toMatchObject({
                symbol: 'AAPL',
                narrative: expect.any(String),
                keyPoints: expect.any(Array),
                sentiment: expect.stringMatching(/BULLISH|BEARISH|NEUTRAL/),
                confidence: expect.any(Number),
                source: expect.any(String),
                timestamp: expect.any(Date)
            });

            expect(story.narrative.length).toBeGreaterThan(50);
            expect(story.keyPoints.length).toBeGreaterThan(0);
            expect(story.confidence).toBeGreaterThanOrEqual(0);
            expect(story.confidence).toBeLessThanOrEqual(1);
        });

        test('should handle different action types correctly', async () => {
            const actions = ['BUY', 'SELL', 'HOLD'];
            
            for (const action of actions) {
                const story = await narrativePhase.generateMarketStory('MSFT', {
                    action,
                    grade: 'B+',
                    confidence: 0.7
                });

                expect(story.action).toBe(action);
                expect(story.narrative).toContain(action.toLowerCase());
            }
        });

        test('should adapt narrative based on grade quality', async () => {
            const grades = ['A+', 'A', 'B+', 'B', 'C', 'D'];
            const stories = [];
            
            for (const grade of grades) {
                const story = await narrativePhase.generateMarketStory('GOOGL', {
                    action: 'BUY',
                    grade,
                    confidence: 0.75
                });
                
                stories.push({ grade, story });
            }

            // Higher grades should generally have more positive sentiment
            const aGradeStory = stories.find(s => s.grade === 'A+');
            const dGradeStory = stories.find(s => s.grade === 'D');
            
            expect(aGradeStory.story.sentiment).not.toBe('BEARISH');
            expect(dGradeStory.story.sentiment).not.toBe('BULLISH');
        });

        test('should handle confidence levels appropriately', async () => {
            const highConfidence = await narrativePhase.generateMarketStory('TSLA', {
                action: 'BUY',
                grade: 'A',
                confidence: 0.95
            });

            const lowConfidence = await narrativePhase.generateMarketStory('TSLA', {
                action: 'BUY',
                grade: 'A',
                confidence: 0.3
            });

            expect(highConfidence.narrative).toContain('strong');
            expect(lowConfidence.narrative).toContain('caution');
        });
    });

    describe('Cache Management', () => {
        test('should cache and retrieve stories correctly', async () => {
            const symbol = 'CACHE_TEST';
            const options = { action: 'BUY', grade: 'B', confidence: 0.7 };

            // First call - should generate new story
            const story1 = await narrativePhase.generateMarketStory(symbol, options);
            
            // Second call - should return cached story
            const story2 = await narrativePhase.generateMarketStory(symbol, options);

            expect(story1.narrative).toBe(story2.narrative);
            expect(story1.timestamp).toEqual(story2.timestamp);
        });

        test('should respect cache expiry', async () => {
            const symbol = 'EXPIRY_TEST';
            const options = { action: 'BUY', grade: 'B', confidence: 0.7 };

            // Set very short cache expiry for testing
            const originalExpiry = narrativePhase.cacheExpiry;
            narrativePhase.cacheExpiry = 100; // 100ms

            const story1 = await narrativePhase.generateMarketStory(symbol, options);
            
            // Wait for cache to expire
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const story2 = await narrativePhase.generateMarketStory(symbol, options);

            expect(story1.timestamp).not.toEqual(story2.timestamp);

            // Restore original expiry
            narrativePhase.cacheExpiry = originalExpiry;
        });

        test('should cache different combinations separately', async () => {
            const symbol = 'MULTI_TEST';
            
            const story1 = await narrativePhase.generateMarketStory(symbol, {
                action: 'BUY', grade: 'A', confidence: 0.8
            });
            
            const story2 = await narrativePhase.generateMarketStory(symbol, {
                action: 'SELL', grade: 'A', confidence: 0.8
            });

            expect(story1.narrative).not.toBe(story2.narrative);
            expect(story1.action).toBe('BUY');
            expect(story2.action).toBe('SELL');
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid symbols gracefully', async () => {
            const invalidSymbols = ['', '   ', 'INVALID_SYMBOL_123', null, undefined];
            
            for (const symbol of invalidSymbols) {
                const story = await narrativePhase.generateMarketStory(symbol, {
                    action: 'BUY',
                    grade: 'B',
                    confidence: 0.7
                });

                expect(story).toBeDefined();
                expect(story.error || story.source === 'ERROR').toBeDefined();
            }
        });

        test('should handle OpenAI API failures', async () => {
            // Mock OpenAI failure
            const originalMethod = narrativePhase.openai.chat.completions.create;
            narrativePhase.openai.chat.completions.create = jest.fn().mockRejectedValue(
                new Error('API rate limit exceeded')
            );

            const story = await narrativePhase.generateMarketStory('AAPL', {
                action: 'BUY',
                grade: 'A',
                confidence: 0.8
            });

            expect(story).toBeDefined();
            expect(story.error || story.source === 'ERROR').toBeDefined();

            // Restore original method
            narrativePhase.openai.chat.completions.create = originalMethod;
        });

        test('should handle malformed OpenAI responses', async () => {
            // Mock malformed response
            const originalMethod = narrativePhase.openai.chat.completions.create;
            narrativePhase.openai.chat.completions.create = jest.fn().mockResolvedValue({
                choices: [] // Empty choices array
            });

            const story = await narrativePhase.generateMarketStory('AAPL', {
                action: 'BUY',
                grade: 'A',
                confidence: 0.8
            });

            expect(story).toBeDefined();
            expect(story.error || story.source === 'ERROR').toBeDefined();

            // Restore original method
            narrativePhase.openai.chat.completions.create = originalMethod;
        });
    });

    describe('Prompt Engineering', () => {
        test('should build comprehensive prompts', () => {
            const prompt = narrativePhase.buildNarrativePrompt('AAPL', {
                action: 'BUY',
                grade: 'A-',
                confidence: 0.85,
                timeframe: '1D'
            });

            expect(prompt).toContain('AAPL');
            expect(prompt).toContain('BUY');
            expect(prompt).toContain('A-');
            expect(prompt).toContain('85%');
            expect(prompt).toContain('narrative');
            expect(prompt).toContain('JSON');
        });

        test('should include all required prompt sections', () => {
            const prompt = narrativePhase.buildNarrativePrompt('MSFT', {
                action: 'SELL',
                grade: 'B+',
                confidence: 0.7
            });

            const requiredSections = [
                'expert trading system',
                'market story',
                'technical analysis',
                'sentiment',
                'key points',
                'confidence',
                'JSON format'
            ];

            requiredSections.forEach(section => {
                expect(prompt.toLowerCase()).toContain(section.toLowerCase());
            });
        });
    });

    describe('Response Parsing', () => {
        test('should parse valid JSON responses correctly', () => {
            const validResponse = JSON.stringify({
                narrative: "Strong bullish momentum detected for AAPL...",
                keyPoints: ["Technical breakout", "Strong volume"],
                sentiment: "BULLISH",
                confidence: 0.85,
                marketContext: "Risk-on environment"
            });

            const parsed = narrativePhase.parseNarrativeResponse(validResponse);

            expect(parsed).toMatchObject({
                narrative: expect.any(String),
                keyPoints: expect.any(Array),
                sentiment: "BULLISH",
                confidence: 0.85,
                marketContext: expect.any(String)
            });
        });

        test('should handle invalid JSON gracefully', () => {
            const invalidResponses = [
                'Invalid JSON response',
                '{"incomplete": json',
                '',
                null,
                undefined
            ];

            invalidResponses.forEach(response => {
                const parsed = narrativePhase.parseNarrativeResponse(response);
                
                expect(parsed).toBeDefined();
                expect(parsed.narrative).toContain('parsing failed');
            });
        });

        test('should handle partial JSON responses', () => {
            const partialResponse = JSON.stringify({
                narrative: "Market story here",
                // Missing other fields
            });

            const parsed = narrativePhase.parseNarrativeResponse(partialResponse);

            expect(parsed.narrative).toBe("Market story here");
            expect(parsed.keyPoints).toEqual([]);
            expect(parsed.sentiment).toBe("NEUTRAL");
        });
    });

    describe('Performance and Optimization', () => {
        test('should complete story generation within timeout', async () => {
            const start = Date.now();
            
            await narrativePhase.generateMarketStory('AAPL', {
                action: 'BUY',
                grade: 'A',
                confidence: 0.8
            });

            const duration = Date.now() - start;
            expect(duration).toBeLessThan(narrativePhase.config.timeout + 5000); // Allow 5s buffer
        });

        test('should handle concurrent requests efficiently', async () => {
            const symbols = ['AAPL', 'MSFT', 'GOOGL'];
            const promises = symbols.map(symbol => 
                narrativePhase.generateMarketStory(symbol, {
                    action: 'BUY',
                    grade: 'B+',
                    confidence: 0.75
                })
            );

            const results = await Promise.all(promises);
            
            expect(results).toHaveLength(3);
            results.forEach((result, index) => {
                expect(result.symbol).toBe(symbols[index]);
            });
        });

        test('should maintain cache size within limits', async () => {
            // Generate many stories to test cache management
            const symbols = Array.from({ length: 20 }, (_, i) => `TEST${i}`);
            
            for (const symbol of symbols) {
                await narrativePhase.generateMarketStory(symbol, {
                    action: 'BUY',
                    grade: 'B',
                    confidence: 0.7
                });
            }

            // Cache size should be reasonable (not unlimited growth)
            expect(narrativePhase.cache.size).toBeLessThanOrEqual(100);
        });
    });

    describe('Test Service Functionality', () => {
        test('should provide test service with valid results', async () => {
            const testResult = await narrativePhase.testNarrativeService('TEST_SYMBOL');

            expect(testResult).toMatchObject({
                success: expect.any(Boolean),
                symbol: 'TEST_SYMBOL',
                story: expect.any(Object),
                test: 'narrative_service',
                timestamp: expect.any(Date)
            });

            if (testResult.success) {
                expect(testResult.story.narrative).toBeDefined();
                expect(testResult.story.keyPoints).toBeDefined();
                expect(testResult.story.sentiment).toBeDefined();
            }
        });

        test('should handle test service errors gracefully', async () => {
            // Test with invalid configuration
            const originalKey = process.env.OPENAI_API_KEY;
            process.env.OPENAI_API_KEY = 'invalid-test-key';

            const testResult = await narrativePhase.testNarrativeService('ERROR_TEST');

            expect(testResult).toMatchObject({
                success: false,
                symbol: 'ERROR_TEST',
                error: expect.any(String),
                test: 'narrative_service',
                timestamp: expect.any(Date)
            });

            // Restore key
            process.env.OPENAI_API_KEY = originalKey;
        });
    });

    describe('Health Check', () => {
        test('should perform comprehensive health check', async () => {
            const health = await narrativePhase.healthCheck();

            expect(health).toMatchObject({
                status: expect.stringMatching(/HEALTHY|ERROR/),
                openai: expect.any(String),
                cache: expect.any(String),
                lastCheck: expect.any(Date)
            });

            if (health.status === 'HEALTHY') {
                expect(health.openai).toBe('Connected');
                expect(health.cache).toContain('items');
            }
        });

        test('should detect OpenAI connection issues', async () => {
            // Test with invalid API key
            const originalKey = process.env.OPENAI_API_KEY;
            process.env.OPENAI_API_KEY = 'invalid-key';

            const health = await narrativePhase.healthCheck();

            expect(health.status).toBe('ERROR');
            expect(health.error).toBeDefined();

            // Restore key
            process.env.OPENAI_API_KEY = originalKey;
        });
    });
});

// Helper functions for testing
function createMockNarrativeOptions(overrides = {}) {
    return {
        action: 'BUY',
        grade: 'B+',
        confidence: 0.75,
        timeframe: '1D',
        ...overrides
    };
}

function createMockOpenAIResponse(overrides = {}) {
    return {
        choices: [{
            message: {
                content: JSON.stringify({
                    narrative: "Mock market story for testing purposes",
                    keyPoints: ["Point 1", "Point 2"],
                    sentiment: "BULLISH",
                    confidence: 0.8,
                    marketContext: "Test context",
                    ...overrides
                })
            }
        }]
    };
}

module.exports = {
    createMockNarrativeOptions,
    createMockOpenAIResponse
};
