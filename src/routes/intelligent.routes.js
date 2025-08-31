/**
 * Intelligent System Routes
 * Unified API endpoints for AI enhancement system
 * 
 * Provides clean REST API for all AI enhancement functionality
 * Integrates seamlessly with your existing trading system
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2025
 */

const express = require('express');
const IntelligentController = require('../controllers/intelligent.controller');

const router = express.Router();
const intelligentController = new IntelligentController();

// ==========================================
// CORE AI ENHANCEMENT ENDPOINTS (4 TOTAL)
// ==========================================

/**
 * POST /api/intelligent/analysis
 * Master AI enhancement endpoint - enhances your existing trade analysis
 * 
 * This is the main integration point with your sophisticated expert system.
 * Includes narrative intelligence and learning insights in a single response.
 * 
 * Body: {
 *   symbol: string,
 *   action: 'BUY'|'SELL'|'HOLD',
 *   grade: string (A+, A, A-, B+, B, B-, C+, C, C-, D+, D, D-, F),
 *   confidence: number (0.0-1.0),
 *   timeframe?: string (default: '1D'),
 *   userId?: string,
 *   requestId?: string
 * }
 * 
 * Response includes: enhanced grade, AI confidence, market narrative, 
 * historical learning insights, and actionable recommendations.
 */
router.post('/analysis', async (req, res) => {
    await intelligentController.enhanceAnalysis(req, res);
});

/**
 * POST /api/intelligent/learning/record
 * Record trade outcome for AI learning system
 * 
 * Essential for the learning system to improve over time.
 * Records both AI-enhanced and baseline trades for comparison.
 * 
 * Body: {
 *   symbol: string,
 *   userId?: string,
 *   action: 'BUY'|'SELL',
 *   entryPrice: number,
 *   exitPrice: number,
 *   quantity: number,
 *   entryDate: string (ISO date),
 *   exitDate: string (ISO date),
 *   outcome: 'WIN'|'LOSS',
 *   pnlPercent: number,
 *   aiEnhanced?: boolean,
 *   originalGrade?: string,
 *   enhancedGrade?: string,
 *   aiConfidence?: number,
 *   marketStoryEntry?: string,
 *   systemUsed?: string
 * }
 */
router.post('/learning/record', async (req, res) => {
    await intelligentController.recordLearning(req, res);
});

/**
 * GET /api/intelligent/performance
 * Get AI vs baseline performance comparison report
 * 
 * Shows ROI analysis, win rate improvements, and proves the value
 * of AI enhancement over your baseline expert system.
 * 
 * Query: days?, symbol?, userId?, detailed?
 */
router.get('/performance', async (req, res) => {
    await intelligentController.getPerformanceReport(req, res);
});

/**
 * GET /api/intelligent/health
 * Get comprehensive system health status
 * 
 * Includes health checks, system metrics, test results, and circuit breaker status.
 * Essential for production monitoring and troubleshooting.
 * 
 * Query: includeTests? (boolean), includeMetrics? (boolean)
 */
router.get('/health', async (req, res) => {
    await intelligentController.getSystemHealth(req, res);
});

// ==========================================
// ERROR HANDLING MIDDLEWARE
// ==========================================

router.use((error, req, res, next) => {
    console.error('❌ Intelligent system error:', error);
    
    res.status(500).json({
        error: 'AI enhancement system error',
        message: error.message,
        path: req.path,
        method: req.method,
        timestamp: new Date()
    });
});

// ==========================================
// API DOCUMENTATION ENDPOINT
// ==========================================

/**
 * GET /api/intelligent/docs
 * Get API documentation
 */
router.get('/docs', (req, res) => {
    res.json({
        name: 'Ishastra AI Enhancement System',
        version: '1.0.0',
        description: 'AI-powered enhancement layer for sophisticated trading systems',
        endpoints: {
            'POST /analysis': 'Enhance trade analysis with AI narrative and grade improvement',
            'GET /narrative/:symbol': 'Get AI-generated market story for symbol',
            'GET /learning/:symbol': 'Get historical performance insights and recommendations',
            'POST /learning/record': 'Record trade outcome for future learning',
            'GET /performance': 'Get AI vs baseline performance comparison report',
            'GET /health': 'Get comprehensive system health status',
            'GET /test': 'Test all phases with sample data',
            'GET /metrics': 'Get detailed system metrics',
            'POST /cache/clear': 'Clear all system caches',
            'GET /docs': 'This documentation'
        },
        features: [
            'Market narrative intelligence using GPT-4',
            'Historical trade outcome learning',
            'Performance monitoring and ROI tracking',
            'Circuit breaker protection',
            'Graceful fallback to baseline system',
            'Real-time performance metrics'
        ],
        integration: {
            'Your Expert System': 'Enhances but never replaces your existing analysis',
            'Previous-Day Analysis': 'Works with your completed candles approach',
            'Grade Enhancement': 'Improves trade grades based on AI insights',
            'Risk Management': 'Can be disabled without affecting base system'
        },
        timestamp: new Date()
    });
});

module.exports = router;
