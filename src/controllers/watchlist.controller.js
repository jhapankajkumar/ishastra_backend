const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const WatchlistService = require('../services/watchlistService');
const { calculateWatchlistScore, rankWatchlistCandidates, WATCHLIST_FILTERS } = require('../utils/systemConstants');
const { getMarketInfo, formatCurrency } = require('../utils/marketUtils');

/**
 * Watchlist Controller - API endpoints for managing watchlist
 */
class WatchlistController {
    constructor() {
        this.watchlistService = new WatchlistService();
    }

    /**
     * GET /api/watchlist
     * Fetch all watchlist stocks with filtering and pagination
     */
    async getWatchlist(req, res) {
        try {
            const {
                action,        // Filter by decision action: BUY, WATCH, HOLD
                grade,         // Filter by grade: A, B, C, D
                market,        // Filter by market: US, IN
                priority,      // Filter by priority: 1, 2, 3
                status,        // Filter by status: ACTIVE, EXECUTED, EXPIRED
                limit = 50,    // Results per page
                offset = 0,    // Pagination offset
                sortBy = 'addedAt', // Sort field
                sortOrder = 'desc'  // Sort order
            } = req.query;

            // Build where clause for filtering
            const whereClause = {};
            if (action) whereClause.decisionAction = action;
            if (grade) whereClause.decisionGrade = grade;
            if (market) whereClause.market = market;
            if (priority) whereClause.priority = parseInt(priority);
            if (status) whereClause.status = status;

            // Build order by clause
            const orderBy = {};
            orderBy[sortBy] = sortOrder;

            // Fetch watchlist with filters and pagination
            const [stocks, totalCount] = await Promise.all([
                prisma.watchlistStock.findMany({
                    where: whereClause,
                    orderBy,
                    take: parseInt(limit),
                    skip: parseInt(offset)
                }),
                prisma.watchlistStock.count({ where: whereClause })
            ]);

            // Parse JSON fields and format response
            const formattedStocks = stocks.map(stock => ({
                ...stock,
                executionData: stock.executionData ? JSON.parse(stock.executionData) : null,
                systemsData: stock.systemsData ? JSON.parse(stock.systemsData) : null
            }));

            res.json({
                stocks: formattedStocks,
                pagination: {
                    total: totalCount,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < totalCount
                },
                filters: { action, grade, market, priority, status },
                sort: { field: sortBy, order: sortOrder }
            });

        } catch (error) {
            console.error('Error fetching watchlist:', error);
            res.status(500).json({
                error: 'Failed to fetch watchlist',
                details: error.message
            });
        }
    }

    /**
     * GET /api/watchlist/stats
     * Get watchlist statistics and summary
     */
    async getWatchlistStats(req, res) {
        try {
            const stats = await this.watchlistService.getWatchlistStats();

            // Get top performers (highest confidence + grade)
            const topPerformers = await prisma.watchlistStock.findMany({
                where: {
                    status: 'ACTIVE',
                    decisionAction: { in: ['BUY', 'WATCH'] }
                },
                orderBy: [
                    { priority: 'desc' },
                    { decisionConfidence: 'desc' }
                ],
                take: 10
            });

            // Get recent additions
            const recentAdditions = await prisma.watchlistStock.findMany({
                where: { status: 'ACTIVE' },
                orderBy: { addedAt: 'desc' },
                take: 5
            });

            res.json({
                overview: stats,
                topPerformers: topPerformers.map(stock => ({
                    symbol: stock.symbol,
                    currentPrice: stock.currentPrice,
                    decisionAction: stock.decisionAction,
                    decisionGrade: stock.decisionGrade,
                    decisionConfidence: stock.decisionConfidence,
                    priority: stock.priority,
                    market: stock.market
                })),
                recentAdditions: recentAdditions.map(stock => ({
                    symbol: stock.symbol,
                    decisionAction: stock.decisionAction,
                    decisionGrade: stock.decisionGrade,
                    addedAt: stock.addedAt
                }))
            });

        } catch (error) {
            console.error('Error fetching watchlist stats:', error);
            res.status(500).json({
                error: 'Failed to fetch watchlist stats',
                details: error.message
            });
        }
    }

    /**
     * GET /api/watchlist/:symbol
     * Get detailed information for a specific watchlist stock
     */
    async getWatchlistStock(req, res) {
        try {
            const { symbol } = req.params;

            const stock = await prisma.watchlistStock.findUnique({
                where: { symbol: symbol.toUpperCase() }
            });

            if (!stock) {
                return res.status(404).json({ error: 'Stock not found in watchlist' });
            }

            // Parse JSON fields
            const formattedStock = {
                ...stock,
                executionData: stock.executionData ? JSON.parse(stock.executionData) : null,
                systemsData: stock.systemsData ? JSON.parse(stock.systemsData) : null
            };

            res.json(formattedStock);

        } catch (error) {
            console.error('Error fetching watchlist stock:', error);
            res.status(500).json({
                error: 'Failed to fetch watchlist stock',
                details: error.message
            });
        }
    }

    /**
     * POST /api/watchlist/populate
     * Trigger automatic population of watchlist from signal analysis with optional professional filtering
     */
    async populateWatchlist(req, res) {
        try {
            const {
                batchSize = 20,
                delayBetweenBatches = 2000,
                overwriteExisting = false,
                // Professional filtering options
                useProfessionalFiltering = true,
                maxWatchlistSize = 15,
                requireMinimumScore = 100,
                symbols = []  // Specific symbols to analyze (optional)
            } = req.body;

            console.log('🚀 Starting watchlist population...');
            console.log('📋 Request body:', req.body);
            console.log('🏛️ Professional filtering enabled:', useProfessionalFiltering);

            if (useProfessionalFiltering) {
                console.log('🏛️ Professional filtering enabled - applying institutional-grade criteria');
                console.log(`🎯 Target watchlist size: ${maxWatchlistSize} stocks`);

                // Use professional filtering approach
                const result = await this.populateWithProfessionalFiltering({
                    symbols,
                    maxWatchlistSize,
                    requireMinimumScore,
                    overwriteExisting
                });

                res.json({
                    message: 'Professional watchlist population completed',
                    summary: result,
                    methodology: 'Institutional-grade filtering with multi-tier scoring'
                });
            } else {
                // Use existing standard batch approach
                console.log(`📊 Standard batch processing: ${batchSize} stocks per batch with ${delayBetweenBatches}ms delay`);
                
                const summary = await this.watchlistService.populateWatchlistFromAnalysis({
                    batchSize,
                    delayBetweenBatches,
                    overwriteExisting
                });

                console.log(`✅ Watchlist population completed: ${summary.processed} stocks processed, ${summary.added} added, ${summary.updated} updated`);
                res.json({
                    message: 'Watchlist population completed',
                    summary
                });
            }

        } catch (error) {
            console.error('Error populating watchlist:', error);
            res.status(500).json({
                error: 'Failed to populate watchlist',
                details: error.message
            });
        }
    }

    /**
     * Professional filtering implementation for enhanced watchlist population
     */
    async populateWithProfessionalFiltering(options) {
        const {
            symbols = [],
            maxWatchlistSize = 15,
            requireMinimumScore = 100,
            overwriteExisting = true
        } = options;

        // If no symbols provided, use the full stock list for professional analysis
        let symbolsToAnalyze = symbols;
        if (symbols.length === 0) {
            const { getAllStocks } = require('../utils/stockList');
            symbolsToAnalyze = getAllStocks(); // Gets all 500 stocks
            console.log(`📈 No symbols provided - analyzing all ${symbolsToAnalyze.length} stocks from master list`);
        } else {
            console.log(`📊 Analyzing ${symbolsToAnalyze.length} provided symbols with professional filters`);
        }

        // Optional: Clear existing watchlist first
        if (overwriteExisting) {
            await prisma.watchlistStock.deleteMany({});
            console.log('🗑️ Cleared existing watchlist for fresh analysis');
        }

        // Step 1: Analyze all symbols in parallel
        console.log('📈 Phase 1: Running comprehensive analysis...');
        const analysisPromises = symbolsToAnalyze.map(async (symbol) => {
            try {
                // Use http module instead of fetch for Node.js compatibility
                const http = require('http');

                const analysisResult = await new Promise((resolve, reject) => {
                    const options = {
                        hostname: 'localhost',
                        port: 8000,
                        path: `/api/trading/signal-analysis?symbols=${symbol}`,
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    };

                    const req = http.request(options, (res) => {
                        let data = '';
                        res.on('data', (chunk) => {
                            data += chunk;
                        });
                        res.on('end', () => {
                            try {
                                resolve(JSON.parse(data));
                            } catch (error) {
                                reject(new Error(`Invalid JSON response: ${data}`));
                            }
                        });
                    });

                    req.on('error', (error) => {
                        reject(error);
                    });

                    req.end();
                });

                if (analysisResult.success && analysisResult.results?.[0]) {
                    const result = analysisResult.results[0];
                    result.sector = this.getSectorFromSymbol(symbol);
                    return result;
                }
                return null;
            } catch (error) {
                console.error(`❌ Analysis failed for ${symbol}:`, error.message);
                return null;
            }
        });

        const allAnalyses = await Promise.all(analysisPromises);
        const validAnalyses = allAnalyses.filter(analysis => analysis !== null);

        console.log(`✅ Analysis complete: ${validAnalyses.length}/${symbolsToAnalyze.length} successful`);
        
        // Step 2: Filter BUY/WATCH candidates
        const candidates = validAnalyses.filter(analysis =>
            analysis.decision.action === 'BUY' || analysis.decision.action === 'WATCH'
        );

        console.log(`🔍 Filtering: ${candidates.length} BUY/WATCH candidates identified`);

        if (candidates.length === 0) {
            return {
                analyzed: symbolsToAnalyze.length,
                candidates: 0,
                added_to_watchlist: 0,
                professional_filters_applied: true
            };
        }

        // Step 3: Apply professional scoring and ranking (but don't store scores)
        console.log('🏛️ Phase 2: Applying professional ranking...');
        const rankedWatchlist = rankWatchlistCandidates(candidates, maxWatchlistSize);

        console.log(`🎯 Professional ranking complete: ${rankedWatchlist.length} stocks selected`);

        // Step 4: Add to database using existing schema
        console.log('💾 Phase 3: Adding to watchlist...');
        const addedStocks = [];

        for (const stock of rankedWatchlist) {
            try {
                const confidenceDecimal = stock.decision.confidence > 1 ?
                    stock.decision.confidence / 100 : stock.decision.confidence;

                const watchlistEntry = await prisma.watchlistStock.create({
                    data: {
                        symbol: stock.symbol,
                        currentPrice: stock.currentPrice,
                        decisionAction: stock.decision.action,
                        decisionConfidence: confidenceDecimal,
                        decisionGrade: stock.decision.grade,
                        decisionReasoning: stock.decision.reasoning,
                        systemsAgreement: stock.decision.systemsAgreement,
                        systemsAnalyzed: stock.decision.systemsAnalyzed || 0,

                        // Standard execution data
                        executionData: JSON.stringify({
                            entry: stock.execution.entry,
                            stop: stock.execution.stop,
                            riskReward: stock.execution.riskReward,
                            target1: stock.execution.target1,
                            target2: stock.execution.target2,
                            positionSize: stock.execution.positionSize
                        }),

                        // Systems data
                        systemsData: JSON.stringify(stock.systems),

                        // Status and priority using existing schema
                        status: 'ACTIVE',
                        priority: stock.priority_tier || 2,
                        nextStepSummary: stock.nextStepSummary || `Execute ${stock.decision.action} order`,

                        // Market info - dynamic detection based on symbol
                        ...getMarketInfo(stock.symbol),  // This adds market, currency, exchange

                        addedAt: new Date(),
                        lastAnalyzedAt: new Date()
                    }
                });

                addedStocks.push({
                    symbol: stock.symbol,
                    action: stock.decision.action,
                    confidence: stock.decision.confidence,
                    tier: stock.priority_tier || 2
                });

            } catch (dbError) {
                console.error(`❌ Database error for ${stock.symbol}:`, dbError.message);
            }
        }

        // Return summary
        return {
            analyzed: symbolsToAnalyze.length,
            valid_analyses: validAnalyses.length,
            buy_watch_candidates: candidates.length,
            final_watchlist_size: addedStocks.length,
            target_size: maxWatchlistSize,
            buy_signals: addedStocks.filter(s => s.action === 'BUY').length,
            watch_signals: addedStocks.filter(s => s.action === 'WATCH').length,
            tier_1_signals: addedStocks.filter(s => s.tier === 1).length,
            added_stocks: addedStocks
        };
    }

    /**
     * POST /api/watchlist/populate-professional
     * Professional-grade watchlist population with institutional filtering and ranking
     */
    /**
     * Helper method to get sector from symbol (basic implementation)
     */
    getSectorFromSymbol(symbol) {
        const sectorMap = {
            // Technology
            'AAPL': 'Technology', 'MSFT': 'Technology', 'GOOGL': 'Technology', 'GOOG': 'Technology',
            'AMZN': 'Technology', 'META': 'Technology', 'NVDA': 'Technology', 'ORCL': 'Technology',
            'CRM': 'Technology', 'ADBE': 'Technology', 'NFLX': 'Technology', 'INTC': 'Technology',
            'CSCO': 'Technology', 'QCOM': 'Technology', 'TXN': 'Technology', 'AVGO': 'Technology',
            'AMAT': 'Technology', 'LRCX': 'Technology',

            // Industrial
            'IBM': 'Technology', // Actually more services now

            // Automotive
            'TSLA': 'Automotive',

            // Add more sectors as needed
        };

        return sectorMap[symbol] || 'UNKNOWN';
    }

    /**
     * POST /api/watchlist/update-now
     * Manually trigger watchlist update (for testing the cron job logic)
     */
    async updateWatchlistNow(req, res) {
        try {
            const { watchlistCron } = require('../watchlist-update-cron');
            
            console.log('🔄 Manual watchlist update triggered via API');
            const summary = await watchlistCron.runNow();
            
            res.json({
                message: 'Watchlist update completed',
                summary,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Manual watchlist update failed:', error);
            res.status(500).json({
                error: 'Failed to update watchlist',
                details: error.message
            });
        }
    }

    /**
     * POST /api/watchlist/analyze/:symbol
     * Analyze a specific stock and add to watchlist if BUY/WATCH
     */
    async analyzeAndAddStock(req, res) {
        try {
            const { symbol } = req.params;
            const { overwriteExisting = false } = req.body;

            const result = await this.watchlistService.analyzeAndAddToWatchlist(
                symbol.toUpperCase(),
                overwriteExisting
            );

            res.json({
                symbol: symbol.toUpperCase(),
                result
            });

        } catch (error) {
            console.error('Error analyzing stock:', error);
            res.status(500).json({
                error: 'Failed to analyze stock',
                details: error.message
            });
        }
    }

    /**
     * PUT /api/watchlist/:symbol/status
     * Update stock status (ACTIVE, EXECUTED, EXPIRED, REMOVED)
     */
    async updateStockStatus(req, res) {
        try {
            const { symbol } = req.params;
            const { status } = req.body;

            if (!['ACTIVE', 'EXECUTED', 'EXPIRED', 'REMOVED'].includes(status)) {
                return res.status(400).json({
                    error: 'Invalid status. Must be: ACTIVE, EXECUTED, EXPIRED, or REMOVED'
                });
            }

            const updatedStock = await prisma.watchlistStock.update({
                where: { symbol: symbol.toUpperCase() },
                data: {
                    status,
                    updatedAt: new Date()
                }
            });

            res.json({
                message: `Stock status updated to ${status}`,
                stock: updatedStock
            });

        } catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Stock not found in watchlist' });
            }
            console.error('Error updating stock status:', error);
            res.status(500).json({
                error: 'Failed to update stock status',
                details: error.message
            });
        }
    }

    /**
     * DELETE /api/watchlist/:symbol
     * Remove stock from watchlist
     */
    async removeFromWatchlist(req, res) {
        try {
            const { symbol } = req.params;

            await prisma.watchlistStock.delete({
                where: { symbol: symbol.toUpperCase() }
            });

            res.json({
                message: `${symbol.toUpperCase()} removed from watchlist`
            });

        } catch (error) {
            if (error.code === 'P2025') {
                return res.status(404).json({ error: 'Stock not found in watchlist' });
            }
            console.error('Error removing from watchlist:', error);
            res.status(500).json({
                error: 'Failed to remove from watchlist',
                details: error.message
            });
        }
    }

    /**
     * POST /api/watchlist/cleanup
     * Clean up old or irrelevant watchlist entries
     */
    async cleanupWatchlist(req, res) {
        try {
            const {
                daysOld = 30,
                removeExecuted = true,
                removeAvoid = true
            } = req.body;

            const deletedCount = await this.watchlistService.cleanupWatchlist({
                daysOld,
                removeExecuted,
                removeAvoid
            });

            res.json({
                message: 'Watchlist cleanup completed',
                deletedCount
            });

        } catch (error) {
            console.error('Error cleaning up watchlist:', error);
            res.status(500).json({
                error: 'Failed to cleanup watchlist',
                details: error.message
            });
        }
    }

    /**
     * GET /api/watchlist/by-grade
     * Get watchlist stocks grouped by grade
     */
    async getWatchlistByGrade(req, res) {
        try {
            const gradeGroups = await prisma.watchlistStock.groupBy({
                by: ['decisionGrade'],
                where: { status: 'ACTIVE' },
                _count: true,
                orderBy: { decisionGrade: 'asc' }
            });

            const detailedGroups = {};

            for (const group of gradeGroups) {
                const stocks = await prisma.watchlistStock.findMany({
                    where: {
                        decisionGrade: group.decisionGrade,
                        status: 'ACTIVE'
                    },
                    orderBy: { decisionConfidence: 'desc' },
                    select: {
                        symbol: true,
                        currentPrice: true,
                        decisionAction: true,
                        decisionConfidence: true,
                        priority: true,
                        market: true,
                        addedAt: true
                    }
                });

                detailedGroups[group.decisionGrade] = {
                    count: group._count,
                    stocks
                };
            }

            res.json(detailedGroups);

        } catch (error) {
            console.error('Error fetching watchlist by grade:', error);
            res.status(500).json({
                error: 'Failed to fetch watchlist by grade',
                details: error.message
            });
        }
    }
}

module.exports = WatchlistController;
