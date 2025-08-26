const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const WatchlistService = require('../services/watchlistService');
const WatchlistManager = require('../services/watchlistManager'); // EXPERT SYSTEM with NIFTY 200+500
const { calculateWatchlistScore, rankWatchlistCandidates, WATCHLIST_FILTERS } = require('../utils/systemConstants');
const { getMarketInfo, formatCurrency } = require('../utils/marketUtils');

/**
 * Watchlist Controller - API endpoints for managing watchlist
 */
class WatchlistController {
    constructor() {
        this.watchlistService = new WatchlistService();
        this.expertEvolutionManager = new WatchlistManager(); // EXPERT NIFTY 200+500 SYSTEM
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
                // ELITE OPTIONS
                useEliteSystem = true,         // Enable Top 0.1% Elite System with INTELLIGENT DISCOVERY
                useProfessionalFiltering = true,
                maxWatchlistSize = 15,
                requireMinimumScore = 100,
                symbols = []  // Leave empty for INTELLIGENT DISCOVERY from 500+ stocks
            } = req.body;

            console.log('🧠 Starting ELITE INTELLIGENT DISCOVERY...');
            console.log('📋 Request body:', req.body);

            if (useEliteSystem) {
                console.log('� ELITE SYSTEM ENABLED - Top 0.1% methodology with INTELLIGENT DISCOVERY');
                console.log(`📊 Symbols provided: ${symbols.length} (${symbols.length === 0 ? 'SMART DISCOVERY from 500+ universe' : 'Custom list'})`);
                
                // Use elite watchlist system with INTELLIGENT DISCOVERY
                const result = await this.populateWithEliteSystem({
                    symbols, // Empty = trigger intelligent discovery from 500+ stocks
                    overwriteExisting
                });

                res.json({
                    message: 'Elite watchlist population with intelligent discovery completed',
                    summary: result,
                    methodology: 'Top 0.1% Elite System with INTELLIGENT STOCK DISCOVERY',
                    eliteFeatures: {
                        intelligentDiscovery: true,
                        tierManagement: true,
                        signalEvolution: true,
                        professionalRanking: true,
                        smartRotation: true,
                        executionReadiness: true,
                        discoveryFromUniverse: symbols.length === 0 ? '500+ NSE stocks' : `${symbols.length} provided stocks`
                    },
                    discoveryIntelligence: {
                        universe_analyzed: symbols.length === 0 ? '500+ stocks via smart filtering' : `${symbols.length} provided`,
                        quick_filters_applied: 'Volume, momentum, volatility, basic technicals',
                        discovery_algorithms: 'Momentum breakouts, technical setups, sector rotation, earnings plays',
                        strategy_rotation: 'Weekly adaptive (momentum → technical → sector → earnings)',
                        professional_ranking: 'Institutional-grade multi-tier scoring'
                    }
                });
                
            } else if (useProfessionalFiltering) {
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
                    // result.sector = this.getSectorFromSymbol(symbol);
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

        // Step 4: Add to database with enhanced analysis structure
        console.log('💾 Phase 3: Adding to watchlist with latest analysis structure...');
        const addedStocks = [];

        for (const stock of rankedWatchlist) {
            try {
                const confidenceDecimal = stock.decision.confidence > 1 ?
                    stock.decision.confidence / 100 : stock.decision.confidence;

                // Enhanced execution data structure
                const executionData = {
                    entry: stock.execution?.entry || stock.currentPrice,
                    stopLoss: stock.execution?.stopLoss,
                    target1: stock.execution?.target1,
                    target2: stock.execution?.target2,
                    riskReward: stock.execution?.riskReward || 0,
                    positionSize: stock.execution?.positionSize || {
                        shares: 0,
                        value: 0,
                        risk: "0%",
                        riskPerShare: 0
                    },
                    exitStrategy: stock.execution?.exitStrategy || {
                        exitConditions: []
                    }
                };

                // Enhanced systems data with formation dates and latest structure
                const systemsData = {
                    // Include all systems with their enhanced data
                    systems: stock.systems || {},
                    
                    // Add context information
                    context: stock.context || {},
                    
                    // Add scenarios
                    scenarios: stock.scenarios || {},
                    
                    // Add risk information
                    risk: stock.risk || {},
                    
                    // Formation dates summary (extract from MACD if available)
                    formationDates: stock.systems?.macdDivergence?.formationDates || null,
                    
                    // Next step summary
                    nextStepSummary: stock.nextStepSummary || `Execute ${stock.decision.action} order`,
                    
                    // Analysis metadata
                    analysisTimestamp: stock.timestamp,
                    systemsAnalyzed: stock.decision.systemsAnalyzed || 0,
                    systemsAgreement: stock.decision.systemsAgreement || 'UNKNOWN'
                };

                const watchlistEntry = await prisma.watchlistStock.create({
                    data: {
                        symbol: stock.symbol,
                        currentPrice: stock.currentPrice,
                        
                        // Decision data with enhanced reasoning
                        decisionAction: stock.decision.action,
                        decisionConfidence: confidenceDecimal,
                        decisionGrade: stock.decision.grade,
                        decisionReasoning: Array.isArray(stock.decision.reasoning) 
                            ? stock.decision.reasoning.join('; ') 
                            : (stock.decision.reasoning || 'Analysis complete'),
                        systemsAgreement: stock.decision.systemsAgreement || 'UNKNOWN',
                        systemsAnalyzed: stock.decision.systemsAnalyzed || 0,

                        // Enhanced execution data with latest structure
                        executionData: JSON.stringify(executionData),

                        // Enhanced systems data with formation dates and context
                        systemsData: JSON.stringify(systemsData),

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
                    tier: stock.priority_tier || 2,
                    hasFormationDates: !!(stock.systems?.macdDivergence?.formationDates)
                });

            } catch (dbError) {
                console.error(`❌ Database error for ${stock.symbol}:`, dbError.message);
            }
        }

        // Return enhanced summary with formation dates info
        return {
            analyzed: symbolsToAnalyze.length,
            valid_analyses: validAnalyses.length,
            buy_watch_candidates: candidates.length,
            final_watchlist_size: addedStocks.length,
            target_size: maxWatchlistSize,
            buy_signals: addedStocks.filter(s => s.action === 'BUY').length,
            watch_signals: addedStocks.filter(s => s.action === 'WATCH').length,
            tier_1_signals: addedStocks.filter(s => s.tier === 1).length,
            stocks_with_formation_dates: addedStocks.filter(s => s.hasFormationDates).length,
            analysis_enhancements: {
                formation_dates_included: true,
                enhanced_systems_data: true,
                context_and_scenarios: true,
                improved_recommendation_system: true
            },
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
     * EXPERT SIGNAL EVOLUTION SYSTEM: Professional NIFTY 200 + Select NIFTY 500
     */
    async populateWithExpertSystem(options) {
        const {
            symbols = [],
            overwriteExisting = true,
            includeSatellite = true,
            isWeeklyRun = false
        } = options;

        console.log('� [EXPERT] Initializing Expert Signal Evolution System - NIFTY 200 + Select 500...');
        
        // Optional: Clear existing watchlist for fresh expert analysis
        if (overwriteExisting) {
            await prisma.watchlistStock.deleteMany({});
            console.log('🗑️ Cleared existing watchlist for expert fresh analysis');
        }

        // Execute expert universe analysis with professional methodology
        const expertResult = await this.expertEvolutionManager.runExpertUniverseAnalysis({
            includeSatellite,
            isWeeklyRun,
            trackPositions: true
        });
        
        console.log('💾 [EXPERT] Expert analysis complete - watchlist already updated by system');
        
        // Get the updated watchlist from database (already saved by expert system)
        const expertWatchlist = await prisma.watchlistStock.findMany({
            where: { status: 'ACTIVE' },
            orderBy: { priority: 'asc' }
        });

        return {
            strategy: 'EXPERT_NIFTY_200_PLUS_SELECT_500',
            analysis_summary: expertResult.analysis_summary,
            evolution_analysis: expertResult.evolution_analysis?.professional_summary || {},
            capital_recommendations: expertResult.capital_recommendations?.summary || {},
            managed_watchlist: {
                total_entries: expertWatchlist.length,
                focus_approach: 'Professional concentrated watchlist'
            },
            expert_insights: {
                core_universe: 'NIFTY 200 - Daily Analysis',
                satellite_universe: includeSatellite ? 'NIFTY 300-500 - Weekly Breakouts' : 'Disabled',
                professional_approach: 'Liquidity focus + 80/20 rule + Signal evolution tracking'
            },
            added_stocks: expertWatchlist
        };
    }

    async runExpertAnalysis(req, res) {
        try {
            const { 
                includeSatellite = true,
                isWeeklyRun = false,
                forceAnalysis = false 
            } = req.body;

            console.log('🎯 [EXPERT-ANALYSIS] Starting professional signal evolution analysis...');
            console.log(`💎 Core Universe: NIFTY 200 | 🛰️ Satellite: ${includeSatellite ? 'NIFTY 300-500' : 'Disabled'}`);

            const WatchlistManager = require('../services/watchlistManager');
            const evolutionManager = new WatchlistManager();

            const startTime = Date.now();

            // Run expert universe analysis
            const analysisResult = await evolutionManager.runExpertUniverseAnalysis({
                includeSatellite,
                isWeeklyRun,
                trackPositions: true
            });

            const executionTime = Date.now() - startTime;

            // Professional response structure
            const response = {
                success: true,
                strategy: "EXPERT_NIFTY_200_PLUS_SELECT_500",
                execution_summary: {
                    execution_time_ms: executionTime,
                    execution_time_readable: `${Math.round(executionTime / 1000)}s`,
                    analysis_approach: "Professional liquidity-focused trading",
                    universe_strategy: "80/20 rule: Focus on liquid stocks with institutional coverage"
                },
                analysis_results: analysisResult,
                professional_insights: {
                    market_approach: "Concentrate on NIFTY 200 for daily analysis + NIFTY 300-500 for weekly breakouts",
                    risk_management: "Confidence-based position sizing with signal evolution tracking",
                    capital_efficiency: "Systematic capital allocation based on signal quality and evolution patterns",
                    trade_validation: analysisResult.capital_recommendations?.professional_advice || {}
                },
                system_intelligence: {
                    core_universe_size: 200,
                    satellite_universe_size: includeSatellite ? 300 : 0,
                    total_tracked: analysisResult.analysis_summary?.total_signals || 0,
                    institutional_grade_signals: analysisResult.evolution_analysis?.professional_summary?.institutional_grade_signals || 0,
                    immediate_actions_required: analysisResult.capital_recommendations?.summary?.immediate_actions_required || 0
                },
                next_steps: {
                    daily_review: "Check critical risk positions and new institutional opportunities",
                    weekly_review: includeSatellite ? "Scan NIFTY 300-500 for breakout opportunities" : "Focus review on core universe",
                    monthly_review: "Analyze signal evolution patterns and adjust universe composition",
                    capital_allocation: "Follow professional recommendations for position sizing and reallocation"
                }
            };

            // Log professional summary
            console.log('📊 [EXPERT-ANALYSIS] Professional Summary:');
            console.log(`   💎 Core Universe: ${analysisResult.analysis_summary?.core_analyzed || 0} stocks analyzed`);
            console.log(`   🛰️ Satellite Universe: ${analysisResult.analysis_summary?.satellite_analyzed || 0} stocks analyzed`);
            console.log(`   🎯 Total Signals: ${analysisResult.analysis_summary?.total_signals || 0}`);
            console.log(`   ⚡ Buy Signals: ${analysisResult.analysis_summary?.buy_signals || 0}`);
            console.log(`   📈 Watch Signals: ${analysisResult.analysis_summary?.watch_signals || 0}`);
            console.log(`   🚨 Critical Risks: ${analysisResult.capital_recommendations?.summary?.immediate_actions_required || 0}`);
            console.log(`   💰 New Opportunities: ${analysisResult.capital_recommendations?.summary?.new_opportunities || 0}`);
            console.log(`   ⏱️ Execution Time: ${Math.round(executionTime / 1000)}s`);

            res.json(response);

        } catch (error) {
            console.error('💥 [EXPERT-ANALYSIS] Analysis failed:', error);
            
            res.status(500).json({
                success: false,
                error: 'Expert analysis failed',
                message: error.message,
                strategy: "EXPERT_NIFTY_200_PLUS_SELECT_500",
                fallback_action: "Check server status and try again"
            });
        }
    }

    /**
     * GET /api/watchlist/expert-status
     * Get current status of expert analysis system
     */
    async getExpertStatus(req, res) {
        try {
            // Get current watchlist stats by decision action and tier
            const watchlistStats = await prisma.watchlistStock.groupBy({
                by: ['decisionAction'],
                _count: true
            });

            const tierStats = await prisma.watchlistStock.groupBy({
                by: ['tier'],
                _count: true
            });

            // Get position stats
            const positionStats = await prisma.trade.groupBy({
                by: ['status'],
                _count: true,
                where: {
                    status: { in: ['Open', 'Partial Closed'] }
                }
            });

            // Calculate system health
            const totalWatchlist = await prisma.watchlistStock.count();
            const totalPositions = await prisma.trade.count({
                where: { status: { in: ['Open', 'Partial Closed'] } }
            });

            const response = {
                success: true,
                system_status: "OPERATIONAL",
                strategy: "EXPERT_NIFTY_200_PLUS_SELECT_500",
                universe_health: {
                    core_universe: "NIFTY 200 - Daily Analysis Ready",
                    satellite_universe: "NIFTY 300-500 - Weekly Scan Ready",
                    liquidity_focus: "HIGH - Institutional grade stocks prioritized"
                },
                current_state: {
                    watchlist_size: totalWatchlist,
                    active_positions: totalPositions,
                    watchlist_by_action: watchlistStats.reduce((acc, stat) => {
                        acc[stat.decisionAction] = stat._count;
                        return acc;
                    }, {}),
                    watchlist_by_tier: tierStats.reduce((acc, stat) => {
                        acc[stat.tier || 'UNKNOWN'] = stat._count;
                        return acc;
                    }, {}),
                    position_status: positionStats.reduce((acc, stat) => {
                        acc[stat.status] = stat._count;
                        return acc;
                    }, {})
                },
                professional_metrics: {
                    signal_evolution_tracking: "ACTIVE",
                    capital_allocation_advice: "ENABLED",
                    risk_management: "PROFESSIONAL_GRADE",
                    analysis_intervals: "Core: 0.3s | Satellite: 1.0s"
                },
                next_analysis: {
                    core_universe: "Ready for daily analysis",
                    satellite_universe: "Ready for weekly scan",
                    recommended_frequency: "Daily core + Weekly satellite"
                }
            };

            res.json(response);

        } catch (error) {
            console.error('💥 [EXPERT-STATUS] Status check failed:', error);
            
            res.status(500).json({
                success: false,
                error: 'Expert status check failed',
                message: error.message,
                system_status: "ERROR"
            });
        }
    }
}

module.exports = WatchlistController;
