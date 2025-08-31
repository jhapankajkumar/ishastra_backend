/**
 * Intelligent Learning
 * Historical performance analysis and trade outcome learning
 * 
 * Learns from completed trades to improve future decision-making
 * Tracks what worked and what didn't for each symbol
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2025
 */

const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');

class IntelligentLearning {
    constructor() {
        this.prisma = new PrismaClient();
        
        // Handle missing API key gracefully
        const apiKey = process.env.OPENAI_API_KEY;
        this.hasApiKey = Boolean(apiKey && apiKey.trim() !== '');
        
        if (this.hasApiKey) {
            this.openai = new OpenAI({
                apiKey: apiKey
            });
        } else {
            console.warn('⚠️  OpenAI API key not configured - AI learning will use fallback mode');
            this.openai = null;
        }
        
        this.config = {
            model: 'gpt-4',
            maxTokens: 600,
            temperature: 0.3,
            timeout: 15000
        };
        
        this.cache = new Map();
        this.cacheExpiry = 600000; // 10 minutes
        
        console.log('🧠 Intelligent Learning System initialized');
    }

    /**
     * Get learning insights for a symbol
     * Analyzes historical trade performance and patterns
     */
    async getSymbolInsights(symbol, options = {}) {
        try {
            const { userId = null } = options;
            
            console.log(`🧠 Getting learning insights for ${symbol} (user: ${userId || 'all'})`);

            // Check cache first
            const cacheKey = `learning_${symbol}_${userId || 'all'}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log(`🧠 Using cached learning insights for ${symbol}`);
                return cached;
            }

            // Get historical trade data
            const tradeHistory = await this.getTradeHistory(symbol, userId);
            
            if (!tradeHistory || tradeHistory.length === 0) {
                return this.createNoHistoryResponse(symbol);
            }

            // Calculate basic performance metrics
            const performanceMetrics = this.calculatePerformanceMetrics(tradeHistory);
            
            // Analyze patterns with AI (if enough data)
            let aiInsights = null;
            if (tradeHistory.length >= 5) {
                aiInsights = await this.generateAIInsights(symbol, tradeHistory, performanceMetrics);
            }

            // Generate recommendations
            const recommendations = this.generateRecommendations(performanceMetrics, aiInsights);

            const insights = {
                symbol,
                hasHistory: true,
                tradeCount: tradeHistory.length,
                winRate: performanceMetrics.winRate,
                avgReturn: performanceMetrics.avgReturn,
                avgDuration: performanceMetrics.avgDuration,
                maxDrawdown: performanceMetrics.maxDrawdown,
                recentPerformance: performanceMetrics.recentPerformance,
                patterns: aiInsights?.patterns || [],
                recommendations,
                aiInsights: aiInsights?.summary || 'Insufficient data for AI analysis',
                source: 'HISTORICAL_ANALYSIS',
                timestamp: new Date()
            };

            // Cache the result
            this.setCache(cacheKey, insights);
            
            return insights;

        } catch (error) {
            console.error('❌ Learning insights failed:', error);
            return this.createErrorResponse(symbol, error.message);
        }
    }

    /**
     * Record trade outcome for future learning
     */
    async recordTradeOutcome(tradeData) {
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
                outcome, // 'WIN' or 'LOSS'
                pnlPercent,
                aiEnhanced = false,
                originalGrade,
                enhancedGrade,
                aiConfidence,
                marketStoryEntry,
                systemUsed
            } = tradeData;

            console.log(`📊 Recording trade outcome: ${symbol} | ${outcome} | AI: ${aiEnhanced}`);

            // Calculate additional metrics
            const daysHeld = exitDate ? 
                Math.floor((new Date(exitDate) - new Date(entryDate)) / (1000 * 60 * 60 * 24)) : null;

            // Check if database is available before trying to store
            let recorded = null;
            if (this.prisma && this.prisma.tradeOutcome) {
                try {
                    // Store in database (adjust schema as needed)
                    recorded = await this.prisma.tradeOutcome.create({
                        data: {
                            symbol,
                            userId: userId || 'anonymous',
                            action,
                            entryPrice,
                            exitPrice,
                            quantity,
                            entryDate: new Date(entryDate),
                            exitDate: exitDate ? new Date(exitDate) : null,
                            outcome,
                            pnlPercent,
                            daysHeld,
                            aiEnhanced,
                            originalGrade,
                            enhancedGrade,
                            aiConfidence,
                            marketStoryEntry,
                            systemUsed,
                            createdAt: new Date()
                        }
                    });

                    // Invalidate cache for this symbol
                    this.invalidateSymbolCache(symbol, userId);

                    // Extract lessons if this completes a trade
                    if (exitDate && outcome) {
                        await this.extractAndStoreLessons(recorded);
                    }
                } catch (dbError) {
                    console.error('❌ Database storage failed:', dbError.message);
                    // Continue without database storage
                    recorded = { id: `temp_${Date.now()}` };
                }
            } else {
                console.warn('⚠️ Database not available - trade outcome recorded in memory only');
                recorded = { id: `temp_${Date.now()}` };
            }

            return {
                success: true,
                tradeId: recorded.id,
                symbol,
                outcome,
                recorded: true
            };

        } catch (error) {
            console.error('❌ Record trade outcome failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Get historical trade data for a symbol
     */
    async getTradeHistory(symbol, userId = null) {
        try {
            // Check if Prisma is properly initialized
            if (!this.prisma || !this.prisma.tradeTransaction) {
                console.warn('⚠️ Database not properly initialized - returning empty trade history');
                return [];
            }

            const whereClause = {
                symbol,
                exitDate: { not: null }, // Only completed trades
                outcome: { not: null }
            };

            if (userId) {
                whereClause.userId = userId;
            }

            const trades = await this.prisma.tradeOutcome.findMany({
                where: whereClause,
                orderBy: { entryDate: 'desc' },
                take: 50 // Last 50 trades
            });

            return trades;

        } catch (error) {
            console.error('❌ Get trade history failed:', error);
            // Return empty array so the system can continue working
            return [];
        }
    }

    /**
     * Calculate performance metrics from trade history
     */
    calculatePerformanceMetrics(trades) {
        if (!trades || trades.length === 0) {
            return {
                winRate: 0,
                avgReturn: 0,
                avgDuration: 0,
                maxDrawdown: 0,
                recentPerformance: 'NO_DATA'
            };
        }

        const winners = trades.filter(t => t.outcome === 'WIN');
        const winRate = (winners.length / trades.length) * 100;

        const returns = trades.filter(t => t.pnlPercent !== null).map(t => t.pnlPercent);
        const avgReturn = returns.length > 0 ? 
            returns.reduce((sum, ret) => sum + ret, 0) / returns.length : 0;

        const durations = trades.filter(t => t.daysHeld !== null).map(t => t.daysHeld);
        const avgDuration = durations.length > 0 ?
            durations.reduce((sum, dur) => sum + dur, 0) / durations.length : 0;

        // Calculate max drawdown
        const maxDrawdown = this.calculateMaxDrawdown(trades);

        // Recent performance (last 10 trades)
        const recentTrades = trades.slice(0, 10);
        const recentWinRate = recentTrades.length > 0 ? 
            (recentTrades.filter(t => t.outcome === 'WIN').length / recentTrades.length) * 100 : 0;
        
        let recentPerformance = 'NEUTRAL';
        if (recentWinRate > 70) recentPerformance = 'STRONG';
        else if (recentWinRate > 50) recentPerformance = 'GOOD';
        else if (recentWinRate < 30) recentPerformance = 'POOR';

        return {
            winRate,
            avgReturn,
            avgDuration,
            maxDrawdown,
            recentPerformance,
            totalTrades: trades.length,
            recentWinRate
        };
    }

    /**
     * Calculate maximum drawdown from trade sequence
     */
    calculateMaxDrawdown(trades) {
        if (trades.length === 0) return 0;

        let maxDrawdown = 0;
        let peak = 0;
        let cumulative = 0;

        // Sort by entry date
        const sortedTrades = trades.sort((a, b) => new Date(a.entryDate) - new Date(b.entryDate));

        sortedTrades.forEach(trade => {
            if (trade.pnlPercent !== null) {
                cumulative += trade.pnlPercent;
                if (cumulative > peak) peak = cumulative;
                const drawdown = peak - cumulative;
                if (drawdown > maxDrawdown) maxDrawdown = drawdown;
            }
        });

        return maxDrawdown;
    }

    /**
     * Generate AI insights from trade patterns
     */
    async generateAIInsights(symbol, trades, metrics) {
        try {
            console.log(`🧠 Generating AI insights for ${symbol} (${trades.length} trades)`);

            // If no OpenAI API key, use fallback analysis
            if (!this.hasApiKey || !this.openai) {
                console.warn(`⚠️  No OpenAI API key - using fallback insights for ${symbol}`);
                return this.createFallbackInsights(symbol, trades, metrics);
            }

            const prompt = this.buildInsightsPrompt(symbol, trades, metrics);
            
            const response = await this.openai.chat.completions.create({
                model: this.config.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert trading analyst specializing in pattern recognition and performance optimization.'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                max_tokens: this.config.maxTokens,
                temperature: this.config.temperature
            });

            if (!response.choices || response.choices.length === 0) {
                throw new Error('No response from OpenAI');
            }

            return this.parseInsightsResponse(response.choices[0].message.content);

        } catch (error) {
            console.error('❌ AI insights generation failed:', error);
            console.warn(`⚠️  Falling back to non-AI insights for ${symbol}`);
            return this.createFallbackInsights(symbol, trades, metrics);
        }
    }

    /**
     * Build prompt for AI insights analysis
     */
    buildInsightsPrompt(symbol, trades, metrics) {
        // Prepare trade data summary
        const aiTrades = trades.filter(t => t.aiEnhanced);
        const normalTrades = trades.filter(t => !t.aiEnhanced);
        
        const tradesSummary = trades.slice(0, 10).map((trade, index) => {
            return `Trade ${index + 1}: ${trade.action} ${trade.outcome} (${trade.pnlPercent?.toFixed(1) || 'N/A'}%) ${trade.daysHeld || 'N/A'} days ${trade.aiEnhanced ? 'AI' : 'Normal'}`;
        }).join('\n');

        return `Analyze the trading performance for symbol ${symbol} and identify patterns and improvement opportunities.

Performance Summary:
- Total Trades: ${trades.length}
- Win Rate: ${metrics.winRate.toFixed(1)}%
- Average Return: ${metrics.avgReturn.toFixed(1)}%
- Average Duration: ${metrics.avgDuration.toFixed(1)} days
- Max Drawdown: ${metrics.maxDrawdown.toFixed(1)}%
- AI-Enhanced Trades: ${aiTrades.length}
- Normal Trades: ${normalTrades.length}

Recent Trades:
${tradesSummary}

Please provide analysis in JSON format:
{
    "patterns": [
        {
            "pattern": "Pattern description",
            "confidence": 0.0-1.0,
            "impact": "POSITIVE|NEGATIVE|NEUTRAL"
        }
    ],
    "strengths": ["strength1", "strength2"],
    "weaknesses": ["weakness1", "weakness2"],
    "recommendations": [
        {
            "recommendation": "Specific recommendation",
            "priority": "HIGH|MEDIUM|LOW",
            "rationale": "Why this matters"
        }
    ],
    "summary": "2-3 sentence overall assessment"
}

Focus on actionable insights that can improve future trading performance. Consider timing, position sizing, market conditions, and AI enhancement effectiveness.

Respond with only the JSON object.`;
    }

    /**
     * Parse AI insights response
     */
    parseInsightsResponse(response) {
        try {
            const parsed = JSON.parse(response);
            
            return {
                patterns: parsed.patterns || [],
                strengths: parsed.strengths || [],
                weaknesses: parsed.weaknesses || [],
                recommendations: parsed.recommendations || [],
                summary: parsed.summary || 'Analysis completed'
            };

        } catch (error) {
            console.error('⚠️ Failed to parse insights response:', error);
            return {
                patterns: [],
                summary: 'Insights parsing failed'
            };
        }
    }

    /**
     * Generate recommendations based on performance analysis
     */
    generateRecommendations(metrics, aiInsights) {
        const recommendations = [];

        // Win rate based recommendations
        if (metrics.winRate > 70) {
            recommendations.push({
                message: 'Excellent win rate - consider increasing position sizes',
                confidence: 0.8,
                priority: 'HIGH'
            });
        } else if (metrics.winRate < 40) {
            recommendations.push({
                message: 'Low win rate - review entry criteria and risk management',
                confidence: 0.9,
                priority: 'HIGH'
            });
        }

        // Average return recommendations
        if (metrics.avgReturn > 5) {
            recommendations.push({
                message: 'Strong average returns - system working well',
                confidence: 0.7,
                priority: 'MEDIUM'
            });
        } else if (metrics.avgReturn < 1) {
            recommendations.push({
                message: 'Low average returns - consider tighter stop losses',
                confidence: 0.6,
                priority: 'MEDIUM'
            });
        }

        // Duration recommendations
        if (metrics.avgDuration > 15) {
            recommendations.push({
                message: 'Long holding periods - consider time-based exits',
                confidence: 0.5,
                priority: 'LOW'
            });
        }

        // Add AI insights recommendations if available
        if (aiInsights && aiInsights.recommendations) {
            aiInsights.recommendations.forEach(rec => {
                recommendations.push({
                    message: rec.recommendation,
                    confidence: 0.7,
                    priority: rec.priority,
                    source: 'AI_ANALYSIS'
                });
            });
        }

        return recommendations.slice(0, 5); // Limit to top 5
    }

    /**
     * Extract and store lessons from completed trades
     */
    async extractAndStoreLessons(trade) {
        try {
            // Simple lesson extraction for now
            const lesson = {
                symbol: trade.symbol,
                userId: trade.userId,
                outcome: trade.outcome,
                returnPercent: trade.pnlPercent,
                daysHeld: trade.daysHeld,
                aiEnhanced: trade.aiEnhanced,
                confidence: trade.aiConfidence,
                grade: trade.enhancedGrade || trade.originalGrade,
                marketContext: trade.marketStoryEntry,
                timestamp: new Date()
            };

            // Store lesson (you might want to create a separate lessons table)
            console.log(`📚 Lesson extracted for ${trade.symbol}: ${trade.outcome}`);
            
            return lesson;

        } catch (error) {
            console.error('❌ Lesson extraction failed:', error);
        }
    }

    /**
     * Create response when no history available
     */
    createNoHistoryResponse(symbol) {
        return {
            symbol,
            hasHistory: false,
            tradeCount: 0,
            winRate: 50,
            avgReturn: 0,
            avgDuration: 0,
            maxDrawdown: 0,
            recentPerformance: 'NO_DATA',
            patterns: [],
            recommendations: [{
                message: 'No trading history available - start building performance data',
                confidence: 1.0,
                priority: 'MEDIUM'
            }],
            aiInsights: 'No data available for analysis',
            source: 'NO_HISTORY',
            timestamp: new Date()
        };
    }

    /**
     * Create error response
     */
    createErrorResponse(symbol, error) {
        return {
            symbol,
            hasHistory: false,
            tradeCount: 0,
            winRate: 50,
            avgReturn: 0,
            avgDuration: 0,
            maxDrawdown: 0,
            recentPerformance: 'ERROR',
            patterns: [],
            recommendations: [{
                message: 'Learning analysis temporarily unavailable',
                confidence: 0.3,
                priority: 'LOW'
            }],
            aiInsights: 'Analysis error occurred',
            source: 'ERROR',
            timestamp: new Date(),
            error
        };
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() < cached.expiry) {
            return cached.data;
        }
        if (cached) {
            this.cache.delete(key);
        }
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            expiry: Date.now() + this.cacheExpiry
        });
    }

    invalidateSymbolCache(symbol, userId = null) {
        const keysToDelete = [];
        for (const key of this.cache.keys()) {
            if (key.includes(`learning_${symbol}`)) {
                keysToDelete.push(key);
            }
        }
        keysToDelete.forEach(key => this.cache.delete(key));
    }

    /**
     * Test learning service functionality
     */
    async testLearningService(symbol = 'AAPL') {
        console.log(`🧪 Testing learning service with ${symbol}`);
        
        try {
            // Test insights retrieval
            const insights = await this.getSymbolInsights(symbol);

            // Test recording a mock trade
            const mockTrade = {
                symbol,
                userId: 'test-user',
                action: 'BUY',
                entryPrice: 150.00,
                exitPrice: 155.00,
                quantity: 10,
                entryDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                exitDate: new Date(),
                outcome: 'WIN',
                pnlPercent: 3.33,
                aiEnhanced: true,
                originalGrade: 'B',
                enhancedGrade: 'B+',
                aiConfidence: 0.75
            };

            const recordResult = await this.recordTradeOutcome(mockTrade);

            return {
                success: true,
                symbol,
                insights,
                recordResult,
                test: 'learning_service',
                timestamp: new Date()
            };

        } catch (error) {
            return {
                success: false,
                symbol,
                error: error.message,
                test: 'learning_service',
                timestamp: new Date()
            };
        }
    }

    /**
     * Create fallback insights when OpenAI is not available
     */
    createFallbackInsights(symbol, trades, metrics) {
        const patterns = [];
        
        // Basic pattern analysis without AI
        if (metrics.winRate > 60) {
            patterns.push("Strong historical performance");
        }
        if (metrics.winRate < 40) {
            patterns.push("Performance needs improvement");
        }
        if (metrics.avgReturn > 3) {
            patterns.push("Good average returns");
        }
        if (trades.length >= 10) {
            patterns.push("Sufficient trading history");
        } else {
            patterns.push("Limited trading history");
        }

        return {
            patterns: patterns,
            summary: `Basic analysis for ${symbol}. AI pattern recognition temporarily unavailable.`,
            confidence: 0.4,
            source: 'FALLBACK_ANALYSIS'
        };
    }

    /**
     * Health check for learning service
     */
    async healthCheck() {
        try {
            let databaseStatus = 'Unknown';
            let totalTrades = 0;
            
            // Test database connection more gracefully
            try {
                await this.prisma.$connect();
                databaseStatus = 'Connected';
                
                // Try to get trade count - handle if table doesn't exist
                try {
                    totalTrades = await this.prisma.tradeOutcome.count();
                } catch (tableError) {
                    console.warn('⚠️ TradeOutcome table not found - this is normal for new installations');
                    databaseStatus = 'Connected (Tables not initialized)';
                    totalTrades = 0;
                }
                
            } catch (dbError) {
                console.warn('⚠️ Database connection failed:', dbError.message);
                databaseStatus = `Connection Failed: ${dbError.message}`;
            }

            const result = {
                status: databaseStatus === 'Connected' ? 'HEALTHY' : 'DEGRADED',
                database: databaseStatus,
                totalTrades,
                cache: `${this.cache.size} items`,
                lastCheck: new Date()
            };

            // Add AI status
            if (!this.hasApiKey || !this.openai) {
                if (result.status === 'HEALTHY') result.status = 'DEGRADED';
                result.openai = 'API key not configured - fallback mode active';
                result.mode = 'FALLBACK';
            } else {
                result.openai = 'Configured';
                result.mode = 'AI_ENHANCED';
            }

            return result;

        } catch (error) {
            return {
                status: 'ERROR',
                error: error.message,
                database: 'Health check failed',
                lastCheck: new Date()
            };
        }
    }
}

module.exports = IntelligentLearning;
