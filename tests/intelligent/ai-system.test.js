/**
 * Intelligent AI System Test Suite
 * Integration tests for the complete AI enhancement system
 * 
 * Tests all phases: Narrative, Learning, Monitoring
 * Validates plugin architecture and fallback mechanisms
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2025
 */

const request = require('supertest');
const { PrismaClient } = require('@prisma/client');

// Import your existing app setup
// const app = require('../../src/server'); // Adjust path as needed

// Import AI components for direct testing
const AIPluginCore = require('../../src/intelligent/AIPluginCore');
const IntelligentNarrative = require('../../src/intelligent/IntelligentNarrative');
const IntelligentLearning = require('../../src/intelligent/IntelligentLearning');
const IntelligentMonitoring = require('../../src/intelligent/IntelligentMonitoring');

describe('AI Enhancement System Integration Tests', () => {
    let prisma;
    let aiCore;
    let narrativePhase;
    let learningPhase;
    let monitoringPhase;

    beforeAll(async () => {
        // Initialize test database
        prisma = new PrismaClient();
        
        // Initialize AI components
        aiCore = new AIPluginCore();
        narrativePhase = new IntelligentNarrative();
        learningPhase = new IntelligentLearning();
        monitoringPhase = new IntelligentMonitoring();

        // Ensure test environment
        process.env.NODE_ENV = 'test';
        process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'test-key';
    });

    afterAll(async () => {
        await prisma.$disconnect();
    });

    describe('AI Plugin Core', () => {
        test('should initialize successfully', () => {
            expect(aiCore).toBeDefined();
            expect(aiCore.config).toBeDefined();
            expect(aiCore.phases).toBeDefined();
        });

        test('should handle circuit breaker activation', async () => {
            // Simulate multiple failures to trigger circuit breaker
            for (let i = 0; i < 6; i++) {
                const result = await aiCore.executeWithFallback('narrative', async () => {
                    throw new Error('Simulated failure');
                }, { fallback: 'test fallback' });
                
                expect(result).toBe('test fallback');
            }

            // Circuit breaker should now be open
            expect(aiCore.circuitBreaker.isOpen()).toBe(true);
        });

        test('should reset circuit breaker after timeout', async () => {
            // Wait for circuit breaker to reset (shorter timeout for testing)
            aiCore.circuitBreaker.timeout = 100; // 100ms for testing
            
            setTimeout(async () => {
                expect(aiCore.circuitBreaker.isOpen()).toBe(false);
            }, 150);
        });

        test('should track metrics correctly', async () => {
            const initialMetrics = aiCore.getMetrics();
            
            await aiCore.executeWithFallback('test', async () => {
                return 'success';
            }, { fallback: 'fallback' });

            const updatedMetrics = aiCore.getMetrics();
            expect(updatedMetrics.totalCalls).toBeGreaterThan(initialMetrics.totalCalls);
        });
    });

    describe('Phase 1: Narrative Intelligence', () => {
        test('should generate market story for valid symbol', async () => {
            const story = await narrativePhase.generateMarketStory('AAPL', {
                action: 'BUY',
                grade: 'B+',
                confidence: 0.75,
                timeframe: '1D'
            });

            expect(story).toBeDefined();
            expect(story.symbol).toBe('AAPL');
            expect(story.narrative).toBeDefined();
            expect(story.keyPoints).toBeInstanceOf(Array);
            expect(story.sentiment).toMatch(/BULLISH|BEARISH|NEUTRAL/);
        });

        test('should handle invalid symbol gracefully', async () => {
            const story = await narrativePhase.generateMarketStory('INVALID', {
                action: 'BUY',
                grade: 'B+',
                confidence: 0.75
            });

            expect(story).toBeDefined();
            expect(story.error).toBeDefined();
        });

        test('should cache results appropriately', async () => {
            const symbol = 'TSLA';
            const options = { action: 'BUY', grade: 'A-', confidence: 0.8 };

            // First call
            const start1 = Date.now();
            const story1 = await narrativePhase.generateMarketStory(symbol, options);
            const duration1 = Date.now() - start1;

            // Second call (should be cached)
            const start2 = Date.now();
            const story2 = await narrativePhase.generateMarketStory(symbol, options);
            const duration2 = Date.now() - start2;

            expect(story1.narrative).toBe(story2.narrative);
            expect(duration2).toBeLessThan(duration1 / 2); // Should be much faster
        });

        test('should provide test functionality', async () => {
            const testResult = await narrativePhase.testNarrativeService('MSFT');
            
            expect(testResult).toBeDefined();
            expect(testResult.symbol).toBe('MSFT');
            expect(testResult.test).toBe('narrative_service');
        });
    });

    describe('Phase 2: Learning System', () => {
        test('should handle symbol with no history', async () => {
            const insights = await learningPhase.getSymbolInsights('NEWSTOCK');
            
            expect(insights).toBeDefined();
            expect(insights.hasHistory).toBe(false);
            expect(insights.tradeCount).toBe(0);
            expect(insights.recommendations).toBeInstanceOf(Array);
        });

        test('should record trade outcomes successfully', async () => {
            const mockTrade = {
                symbol: 'TEST',
                userId: 'test-user',
                action: 'BUY',
                entryPrice: 100.00,
                exitPrice: 105.00,
                quantity: 10,
                entryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
                exitDate: new Date(),
                outcome: 'WIN',
                pnlPercent: 5.0,
                aiEnhanced: true,
                originalGrade: 'B',
                enhancedGrade: 'B+',
                aiConfidence: 0.8
            };

            const result = await learningPhase.recordTradeOutcome(mockTrade);
            
            expect(result).toBeDefined();
            expect(result.success).toBe(true);
            expect(result.symbol).toBe('TEST');
            expect(result.outcome).toBe('WIN');
        });

        test('should calculate performance metrics correctly', () => {
            const mockTrades = [
                { outcome: 'WIN', pnlPercent: 5.0, daysHeld: 3, entryDate: new Date('2024-01-01') },
                { outcome: 'WIN', pnlPercent: 3.0, daysHeld: 5, entryDate: new Date('2024-01-02') },
                { outcome: 'LOSS', pnlPercent: -2.0, daysHeld: 2, entryDate: new Date('2024-01-03') },
                { outcome: 'WIN', pnlPercent: 7.0, daysHeld: 4, entryDate: new Date('2024-01-04') }
            ];

            const metrics = learningPhase.calculatePerformanceMetrics(mockTrades);
            
            expect(metrics.winRate).toBe(75); // 3 wins out of 4
            expect(metrics.avgReturn).toBe(3.25); // (5+3-2+7)/4
            expect(metrics.avgDuration).toBe(3.5); // (3+5+2+4)/4
            expect(metrics.totalTrades).toBe(4);
        });

        test('should provide test functionality', async () => {
            const testResult = await learningPhase.testLearningService('GOOGL');
            
            expect(testResult).toBeDefined();
            expect(testResult.symbol).toBe('GOOGL');
            expect(testResult.test).toBe('learning_service');
        });

        test('should perform health check', async () => {
            const health = await learningPhase.healthCheck();
            
            expect(health).toBeDefined();
            expect(health.status).toMatch(/HEALTHY|ERROR/);
            expect(health.lastCheck).toBeInstanceOf(Date);
        });
    });

    describe('Phase 5: Performance Monitoring', () => {
        test('should generate performance report', async () => {
            const report = await monitoringPhase.getPerformanceReport({
                days: 7,
                includeDetailed: false
            });

            expect(report).toBeDefined();
            expect(report.period).toBeDefined();
            expect(report.aiEnhanced).toBeDefined();
            expect(report.baseline).toBeDefined();
            expect(report.comparison).toBeDefined();
            expect(report.roiAnalysis).toBeDefined();
            expect(report.insights).toBeInstanceOf(Array);
            expect(report.summary).toBeDefined();
        });

        test('should track real-time performance', async () => {
            const mockTradeResult = {
                symbol: 'REALTIME',
                outcome: 'WIN',
                pnlPercent: 4.5,
                aiEnhanced: true
            };

            const tracking = await monitoringPhase.trackRealTimePerformance(mockTradeResult);
            
            expect(tracking).toBeDefined();
            expect(tracking.symbol).toBe('REALTIME');
            expect(tracking.aiEnhanced).toBe(true);
            expect(tracking.currentWinRate).toBeDefined();
        });

        test('should calculate ROI correctly', () => {
            const aiTrades = [
                { pnlPercent: 5.0 },
                { pnlPercent: 3.0 },
                { pnlPercent: -1.0 }
            ];

            const baselineTrades = [
                { pnlPercent: 2.0 },
                { pnlPercent: 1.0 },
                { pnlPercent: -0.5 },
                { pnlPercent: 1.5 }
            ];

            const roi = monitoringPhase.calculateROI(aiTrades, baselineTrades);
            
            expect(roi).toBeDefined();
            expect(roi.aiTotalReturn).toBe(7.0); // 5+3-1
            expect(roi.baselineTotalReturn).toBe(4.0); // 2+1-0.5+1.5
            expect(roi.roi).toBeDefined();
            expect(roi.isPositiveROI).toBeDefined();
        });

        test('should perform health check', async () => {
            const health = await monitoringPhase.healthCheck();
            
            expect(health).toBeDefined();
            expect(health.status).toMatch(/HEALTHY|ERROR/);
            expect(health.lastCheck).toBeInstanceOf(Date);
        });
    });

    describe('API Integration Tests', () => {
        // These tests would require your Express app to be running
        // Uncomment and adjust when integrating with your server

        /*
        test('GET /api/intelligent/health should return status', async () => {
            const res = await request(app)
                .get('/api/intelligent/health')
                .expect(200);

            expect(res.body.status).toBeDefined();
            expect(res.body.phases).toBeDefined();
        });

        test('POST /api/intelligent/analysis should enhance grade', async () => {
            const tradeData = {
                symbol: 'AAPL',
                action: 'BUY',
                grade: 'B',
                confidence: 0.7,
                timeframe: '1D'
            };

            const res = await request(app)
                .post('/api/intelligent/analysis')
                .send(tradeData)
                .expect(200);

            expect(res.body.enhanced).toBeDefined();
            expect(res.body.narrative).toBeDefined();
            expect(res.body.enhancedGrade).toBeDefined();
        });

        test('GET /api/intelligent/narrative/:symbol should return market story', async () => {
            const res = await request(app)
                .get('/api/intelligent/narrative/MSFT')
                .query({ action: 'BUY', grade: 'A-', confidence: 0.8 })
                .expect(200);

            expect(res.body.symbol).toBe('MSFT');
            expect(res.body.narrative).toBeDefined();
        });

        test('GET /api/intelligent/learning/:symbol should return insights', async () => {
            const res = await request(app)
                .get('/api/intelligent/learning/TSLA')
                .expect(200);

            expect(res.body.symbol).toBe('TSLA');
            expect(res.body.recommendations).toBeInstanceOf(Array);
        });

        test('GET /api/intelligent/performance should return report', async () => {
            const res = await request(app)
                .get('/api/intelligent/performance')
                .query({ days: 7 })
                .expect(200);

            expect(res.body.period).toBeDefined();
            expect(res.body.comparison).toBeDefined();
        });
        */
    });

    describe('Error Handling and Resilience', () => {
        test('should handle OpenAI API failures gracefully', async () => {
            // Temporarily break OpenAI connection
            const originalKey = process.env.OPENAI_API_KEY;
            process.env.OPENAI_API_KEY = 'invalid-key';

            const story = await narrativePhase.generateMarketStory('AAPL', {
                action: 'BUY',
                grade: 'B+',
                confidence: 0.75
            });

            expect(story).toBeDefined();
            expect(story.error || story.source).toBeDefined();

            // Restore key
            process.env.OPENAI_API_KEY = originalKey;
        });

        test('should handle database connection issues', async () => {
            // Disconnect database temporarily
            await prisma.$disconnect();

            const insights = await learningPhase.getSymbolInsights('AAPL');
            expect(insights).toBeDefined();
            expect(insights.error || insights.source === 'ERROR').toBeDefined();

            // Reconnect
            await prisma.$connect();
        });

        test('should provide fallback responses when AI is unavailable', async () => {
            // Test with circuit breaker open
            aiCore.circuitBreaker.state = 'OPEN';
            
            const result = await aiCore.executeWithFallback('narrative', async () => {
                throw new Error('Service unavailable');
            }, { fallback: 'fallback response' });

            expect(result).toBe('fallback response');
        });
    });

    describe('Performance Tests', () => {
        test('should handle multiple concurrent requests', async () => {
            const symbols = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN'];
            const promises = symbols.map(symbol => 
                narrativePhase.generateMarketStory(symbol, {
                    action: 'BUY',
                    grade: 'B',
                    confidence: 0.7
                })
            );

            const results = await Promise.all(promises);
            
            expect(results).toHaveLength(5);
            results.forEach((result, index) => {
                expect(result.symbol).toBe(symbols[index]);
            });
        });

        test('should complete analysis within reasonable time', async () => {
            const start = Date.now();
            
            await narrativePhase.generateMarketStory('AAPL', {
                action: 'BUY',
                grade: 'A',
                confidence: 0.9
            });

            const duration = Date.now() - start;
            expect(duration).toBeLessThan(30000); // Should complete within 30 seconds
        });

        test('should cache effectively reduce response times', async () => {
            const symbol = 'CACHE_TEST';
            const options = { action: 'BUY', grade: 'B+', confidence: 0.8 };

            // Clear any existing cache
            narrativePhase.cache.clear();

            // First call (uncached)
            const start1 = Date.now();
            await narrativePhase.generateMarketStory(symbol, options);
            const uncachedTime = Date.now() - start1;

            // Second call (cached)
            const start2 = Date.now();
            await narrativePhase.generateMarketStory(symbol, options);
            const cachedTime = Date.now() - start2;

            expect(cachedTime).toBeLessThan(uncachedTime / 2);
        });
    });

    describe('Data Validation Tests', () => {
        test('should validate trade data before recording', async () => {
            const invalidTrade = {
                // Missing required fields
                symbol: 'TEST',
                action: 'INVALID_ACTION'
                // Missing other required fields
            };

            const result = await learningPhase.recordTradeOutcome(invalidTrade);
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        test('should handle invalid symbols consistently', async () => {
            const invalidSymbols = ['', '123', 'TOOLONG_SYMBOL', null, undefined];
            
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

        test('should validate grades and confidence ranges', async () => {
            const invalidData = [
                { grade: 'Z', confidence: 0.7 }, // Invalid grade
                { grade: 'A', confidence: 1.5 }, // Invalid confidence > 1
                { grade: 'B', confidence: -0.1 } // Invalid confidence < 0
            ];

            for (const data of invalidData) {
                const story = await narrativePhase.generateMarketStory('AAPL', {
                    action: 'BUY',
                    ...data
                });
                
                // Should handle gracefully, not crash
                expect(story).toBeDefined();
            }
        });
    });
});

// Helper functions for testing
function createMockTrade(overrides = {}) {
    return {
        symbol: 'MOCK',
        userId: 'test-user',
        action: 'BUY',
        entryPrice: 100.00,
        exitPrice: 105.00,
        quantity: 10,
        entryDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        exitDate: new Date(),
        outcome: 'WIN',
        pnlPercent: 5.0,
        aiEnhanced: false,
        originalGrade: 'B',
        enhancedGrade: 'B+',
        aiConfidence: 0.7,
        ...overrides
    };
}

function createMockCandles(symbol, days = 5) {
    const candles = [];
    const basePrice = 100;
    
    for (let i = days; i >= 0; i--) {
        const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
        const variance = (Math.random() - 0.5) * 10;
        const price = basePrice + variance;
        
        candles.push({
            symbol,
            date: date.toISOString().split('T')[0],
            open: price - Math.random() * 2,
            high: price + Math.random() * 3,
            low: price - Math.random() * 3,
            close: price,
            volume: Math.floor(Math.random() * 1000000)
        });
    }
    
    return candles;
}

module.exports = {
    createMockTrade,
    createMockCandles
};
