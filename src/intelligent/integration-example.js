/**
 * Server Integration Example
 * Shows how to integrate AI enhancement routes with your existing server
 * 
 * Add this to your main server.js file to enable AI enhancement
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2025
 */

// ========================================
// EXAMPLE: Add to your existing server.js
// ========================================

/*
// 1. Import the AI routes
const intelligentRoutes = require('./intelligent/intelligent.routes');

// 2. Add environment variables (add to your .env file)
// OPENAI_API_KEY=your_openai_api_key_here
// AI_ENHANCEMENT_ENABLED=true

// 3. Register the routes with your Express app
app.use('/api/intelligent', intelligentRoutes);

// 4. Optional: Add AI enhancement to your existing trading endpoints
const { intelligentController } = require('./intelligent/intelligent.controller');

// Example: Enhance your existing trade analysis endpoint
app.post('/api/trade/analyze', async (req, res) => {
    try {
        // Your existing trade analysis logic
        const baseAnalysis = await yourExistingAnalysisFunction(req.body);
        
        // Enhance with AI if enabled
        if (process.env.AI_ENHANCEMENT_ENABLED === 'true') {
            const aiEnhancement = await intelligentController.enhanceAnalysis({
                body: {
                    symbol: baseAnalysis.symbol,
                    action: baseAnalysis.recommendedAction,
                    grade: baseAnalysis.grade,
                    confidence: baseAnalysis.confidence,
                    timeframe: baseAnalysis.timeframe
                }
            });
            
            // Merge base analysis with AI enhancement
            const enhancedResult = {
                ...baseAnalysis,
                aiEnhanced: true,
                enhancedGrade: aiEnhancement.enhancedGrade,
                marketStory: aiEnhancement.narrative,
                aiConfidence: aiEnhancement.aiConfidence,
                originalGrade: baseAnalysis.grade
            };
            
            res.json(enhancedResult);
        } else {
            // Return base analysis without AI enhancement
            res.json({
                ...baseAnalysis,
                aiEnhanced: false
            });
        }
        
    } catch (error) {
        console.error('Trade analysis failed:', error);
        res.status(500).json({ error: 'Analysis failed' });
    }
});
*/

// ========================================
// COMPLETE INTEGRATION EXAMPLE
// ========================================

const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

// Your existing imports
// const existingRoutes = require('./routes');
// const existingMiddleware = require('./middleware');

// AI Enhancement imports
const intelligentRoutes = require('./intelligent/intelligent.routes');
const IntelligentController = require('./intelligent/intelligent.controller');

const app = express();
const prisma = new PrismaClient();
const intelligentController = new IntelligentController();

// Middleware
app.use(cors());
app.use(express.json());

// Your existing routes
// app.use('/api', existingRoutes);

// AI Enhancement routes
app.use('/api/intelligent', intelligentRoutes);

// Enhanced endpoint examples
app.post('/api/enhanced/analyze', async (req, res) => {
    try {
        const { symbol, action, grade, confidence, timeframe, userId } = req.body;

        // Validate required fields
        if (!symbol || !action || !grade || !confidence) {
            return res.status(400).json({
                error: 'Missing required fields: symbol, action, grade, confidence'
            });
        }

        // Create enhanced analysis request
        const enhancedAnalysis = await intelligentController.enhanceAnalysis({
            body: {
                symbol,
                action,
                grade,
                confidence,
                timeframe: timeframe || '1D',
                userId
            }
        });

        res.json(enhancedAnalysis);

    } catch (error) {
        console.error('Enhanced analysis failed:', error);
        res.status(500).json({
            error: 'Enhanced analysis failed',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Check database
        await prisma.$queryRaw`SELECT 1`;
        
        // Check AI system
        const aiHealth = await intelligentController.getSystemHealth();
        
        res.json({
            status: 'healthy',
            timestamp: new Date(),
            database: 'connected',
            ai: aiHealth.status,
            version: '1.0.0'
        });

    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            timestamp: new Date(),
            error: error.message
        });
    }
});

// Example: Record trade outcome for learning
app.post('/api/trade/record-outcome', async (req, res) => {
    try {
        const {
            symbol,
            userId,
            action,
            entryPrice,
            exitPrice,
            quantity,
            entryDate,
            exitDate,
            outcome,
            pnlPercent,
            aiEnhanced = false,
            originalGrade,
            enhancedGrade,
            aiConfidence,
            marketStoryEntry
        } = req.body;

        // Record in your existing system
        // const tradeRecord = await yourExistingTradeRecordingFunction(req.body);

        // Also record for AI learning if AI was used
        if (aiEnhanced) {
            const learningResult = await intelligentController.recordLearning({
                body: {
                    symbol,
                    userId,
                    action,
                    entryPrice,
                    exitPrice,
                    quantity,
                    entryDate,
                    exitDate,
                    outcome,
                    pnlPercent,
                    aiEnhanced: true,
                    originalGrade,
                    enhancedGrade,
                    aiConfidence,
                    marketStoryEntry,
                    systemUsed: 'enhanced_system'
                }
            });

            res.json({
                success: true,
                // tradeRecord,
                learningRecord: learningResult,
                message: 'Trade outcome recorded for AI learning'
            });
        } else {
            res.json({
                success: true,
                // tradeRecord,
                message: 'Trade outcome recorded'
            });
        }

    } catch (error) {
        console.error('Trade outcome recording failed:', error);
        res.status(500).json({
            error: 'Failed to record trade outcome',
            details: error.message
        });
    }
});

// Example: Get performance comparison
app.get('/api/performance/comparison', async (req, res) => {
    try {
        const { days = 30, symbol, userId } = req.query;

        const performanceReport = await intelligentController.getPerformanceReport({
            query: { days: parseInt(days), symbol, userId, includeDetailed: false }
        });

        res.json(performanceReport);

    } catch (error) {
        console.error('Performance comparison failed:', error);
        res.status(500).json({
            error: 'Failed to generate performance report',
            details: error.message
        });
    }
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    await prisma.$disconnect();
    process.exit(0);
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🧠 AI Enhancement: ${process.env.AI_ENHANCEMENT_ENABLED === 'true' ? 'ENABLED' : 'DISABLED'}`);
    console.log(`📊 OpenAI: ${process.env.OPENAI_API_KEY ? 'CONFIGURED' : 'NOT CONFIGURED'}`);
});

module.exports = app;

// ========================================
// ENVIRONMENT VARIABLES (.env file)
// ========================================

/*
# Add these to your .env file:

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# AI Enhancement Toggle
AI_ENHANCEMENT_ENABLED=true

# Database (your existing database URL)
DATABASE_URL=your_database_connection_string

# Server Configuration
PORT=3000
NODE_ENV=development

# Optional: AI Configuration
AI_MODEL=gpt-4
AI_MAX_TOKENS=800
AI_TEMPERATURE=0.3
AI_TIMEOUT=15000
AI_CACHE_EXPIRY=600000
*/

// ========================================
// PACKAGE.JSON ADDITIONS
// ========================================

/*
Add these dependencies to your package.json:

{
  "dependencies": {
    "openai": "^4.20.0",
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "@prisma/client": "latest"
  },
  "devDependencies": {
    "jest": "^29.0.0",
    "supertest": "^6.3.0"
  },
  "scripts": {
    "test": "jest",
    "test:ai": "jest tests/intelligent/",
    "test:watch": "jest --watch",
    "dev": "nodemon src/server.js",
    "start": "node src/server.js"
  }
}
*/

// ========================================
// USAGE EXAMPLES
// ========================================

/*
1. ENHANCE EXISTING TRADE ANALYSIS:
   POST /api/enhanced/analyze
   {
     "symbol": "AAPL",
     "action": "BUY",
     "grade": "B+",
     "confidence": 0.75,
     "timeframe": "1D",
     "userId": "user123"
   }

2. GET MARKET NARRATIVE:
   GET /api/intelligent/narrative/AAPL?action=BUY&grade=A-&confidence=0.8

3. GET LEARNING INSIGHTS:
   GET /api/intelligent/learning/AAPL?userId=user123

4. GET PERFORMANCE COMPARISON:
   GET /api/performance/comparison?days=30&symbol=AAPL

5. RECORD TRADE OUTCOME:
   POST /api/trade/record-outcome
   {
     "symbol": "AAPL",
     "userId": "user123",
     "action": "BUY",
     "entryPrice": 150.00,
     "exitPrice": 155.00,
     "quantity": 10,
     "entryDate": "2024-01-01T10:00:00Z",
     "exitDate": "2024-01-05T15:00:00Z",
     "outcome": "WIN",
     "pnlPercent": 3.33,
     "aiEnhanced": true,
     "originalGrade": "B+",
     "enhancedGrade": "A-",
     "aiConfidence": 0.85
   }

6. SYSTEM HEALTH CHECK:
   GET /api/intelligent/health

7. TEST ALL PHASES:
   GET /api/intelligent/test?symbol=AAPL
*/
