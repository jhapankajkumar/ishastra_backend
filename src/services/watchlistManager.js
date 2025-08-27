/**
 * SIGNAL EVOLUTION TRACKER
 * 
 * Expert-Recommended Strategy: S&P 500 CORE + SATELLITE
 * - CORE UNIVERSE: Top 100 S&P 500 by Market Cap (daily analysis)
 * - SATELLITE UNIVERSE: Remaining S&P 500 companies (weekly analysis for breakouts)
 * - TOTAL: ~500 stocks maximum
 * 
 * Professional Approach:
 * - Liquidity Focus: Can enter/exit without moving markets
 * - Information Edge: Better research coverage on fewer stocks
 * - 80/20 Rule: 80% of profits from 20% of stocks
 * - Signal Evolution: BUY → WATCH → AVOID progression
 * - Capital Allocation: Confidence-based position sizing
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Expert-recommended S&P 500 CORE Universe (Top 100 by Market Cap - Highest Liquidity)
const SP500_CORE = [
    // // Top 50 - Mega Cap Tech & Growth Leaders (Highest Priority - Daily Analysis)
    // "NVDA", "MSFT", "AAPL", "AMZN", "META", "AVGO", "GOOGL", "GOOG", "TSLA", "BRK.B",
    // "LLY", "JPM", "UNH", "V", "XOM", "MA", "PG", "COST", "HD", "JNJ",
    // "NFLX", "ABBV", "BAC", "CRM", "CVX", "KO", "AMD", "PEP", "TMO", "WMT",
    // "CSCO", "ACN", "LIN", "ABT", "MRK", "ADBE", "IBM", "TXN", "PM", "CAT",
    // "DHR", "ISRG", "GE", "QCOM", "NOW", "VZ", "UBER", "INTU", "COP", "RTX",
    
    // Next 50 - Large Cap Value & Diversified (High Priority - Daily Analysis)
    "AMGN", "AMAT", "HON", "PFE", "BKNG", "NEE", "T", "LOW", "SPGI", "BSX",
    "AXP", "SYK", "PGR", "TJX", "C", "LRCX", "BLK", "VRTX", "MS", "MDT",
    "ETN", "CB", "REGN", "ADI", "SCHW", "MU", "FI", "KKR", "GILD", "AON",
    "PANW", "CMG", "SO", "ICE", "APD", "DUK", "PLD", "MMC", "KLAC", "PYPL",
    "USB", "SHW", "ZTS", "ITW", "MCO", "WM", "EMR", "CDNS", "FCX", "MAR",

];

// S&P 500 SATELLITE Universe (Remaining S&P 500 for Weekly Breakout Scans)
const SP500_SATELLITE = [
    // Mid-Large Cap Opportunities (Weekly Breakout Analysis) - No duplicates from CORE
    "WTW", "MTD", "WAB", "TMUS", "DOW", "COO", "TSCO", "SYY", "PPG", "RSG",
    "ANET", "BK", "FTV", "TYL", "CBOE", "KHC", "EIX", "PEG", "AME", "WY",
    "MTB", "HUBB", "CDW", "STT", "WEC", "ALGN", "AWK", "NTRS", "BR", "GPN",
    "FITB", "HBAN", "ATO", "PPL", "BF.B", "LH", "CAH", "ETR", "ESS", "TER",
    "INVH", "FSLR", "PKG", "UAL", "ZBRA", "RF", "LDOS", "STE", "BALL", "VICI",
    "ARE", "K", "FE", "POOL", "EXPE", "NTAP", "J", "WRB", "EXPD", "JBHT",
    "LUV", "SYF", "JKHY", "DFS", "STLD", "SWKS", "CLX", "CFG", "KEY", "EPAM",
    "TDY", "IEX", "VLTO", "PFG", "LNT", "CINF", "CAG", "LVS", "AKAM", "MAS",
    
    // Additional S&P 500 companies for comprehensive coverage  
    "TPG", "GLW", "URI", "NEM", "CTVA", "LYB", "DVN", "DAL", "GRMN", "ADM",
    "AVB", "EQR", "SMCI", "NDAQ", "ANSS", "KEYS", "ROK", "MPWR", "CSGP", "AMP",
    
    // Smaller S&P 500 components for complete universe coverage
    "PODD", "CHRW", "TECH", "PAYC", "HOLX", "TXT", "ENPH", "SBAC", "NDSN", "MKC",
    "SJM", "DGX", "TPR", "HSIC", "HAS", "BEN", "IP", "UDR", "CBRE", "WYNN",
    "AIZ", "ROL", "PEAK", "ALB", "CE", "SOLV", "EMN", "PTCT", "CRL", "MRNA",
    "MTCH", "PARA", "TAP", "MHK", "NRG", "FFIV", "PNR", "AMCR", "FRT", "ZION",
    "MOH", "JWN", "NI", "ALLE", "RJF", "RL", "NCLH", "BWA", "VTR", "QRVO",
    "CPT", "DISH", "BXP", "AIV", "MAA", "EQT", "GL", "AAL", "CZR", "GPS"
];

class WatchlistManager {
    constructor() {
        this.CORE_ANALYSIS_INTERVAL = 300; // 0.3 seconds for S&P 500 Core
        this.SATELLITE_ANALYSIS_INTERVAL = 1000; // 1 second for S&P 500 Satellite
        this.signalHierarchy = {
            'STRONG_BUY': 5,
            'BUY': 4,
            'WATCH': 3,
            'HOLD': 2,
            'AVOID': 1,
            'SELL': 0
        };
        
        // Professional signal evolution patterns
        this.evolutionPatterns = {
            'STRENGTHENING': { weight: 1.0, priority: 'HIGH' },
            'STABLE': { weight: 0.8, priority: 'MEDIUM' },
            'DEGRADING': { weight: 0.6, priority: 'MEDIUM' },
            'BREAKING': { weight: 0.4, priority: 'LOW' },
            'RECOVERING': { weight: 0.9, priority: 'HIGH' }
        };
    }

    /**
     * EXPERT STRATEGY: S&P 500 CORE + SATELLITE ANALYSIS
     * Professional approach with liquidity focus and 80/20 rule
     * SMART FALLBACK: Auto-trigger SATELLITE scan if CORE lacks BUY signals
     */
    async runExpertUniverseAnalysis(options = {}) {
        const {
            includeSatellite = true,
            trackPositions = true,
            isWeeklyRun = false,
            minBuySignalsThreshold = 0  // Minimum BUY signals expected from CORE
        } = options;

        console.log('🎯 [EXPERT-STRATEGY] Starting S&P 500 CORE + SATELLITE analysis...');
        
        const startTime = Date.now();
        
        // Step 1: Core Universe Analysis (S&P 500 Top 100 - Daily)
        console.log('🏆 Analyzing CORE UNIVERSE: S&P 500 Top 100 (Daily Analysis)');
        const coreResults = await this.analyzeCoreUniverse();
        
        // SMART FALLBACK LOGIC: Check if CORE has sufficient BUY signals
        const coreBuySignals = coreResults.filter(result => 
            result.decision?.action === 'BUY' || result.decision?.action === 'STRONG_BUY'
        );
        
        const coreWatchSignals = coreResults.filter(result => 
            result.decision?.action === 'WATCH'
        );
        
        const shouldTriggerSatelliteFallback = coreBuySignals.length < minBuySignalsThreshold;
        
        console.log(`📊 CORE Results: ${coreBuySignals.length} BUY signals, ${coreWatchSignals.length} WATCH signals`);
        
        if (shouldTriggerSatelliteFallback) {
            console.log(`🚨 SMART FALLBACK TRIGGERED: Core has only ${coreBuySignals.length} BUY signals (threshold: ${minBuySignalsThreshold})`);
            console.log('🛰️ Expanding search to SATELLITE universe for additional opportunities...');
        }
        
        // Step 2: Satellite Universe Analysis (Conditional + Smart Fallback)
        let satelliteResults = [];
        let satelliteAnalysisReason = 'SKIPPED';
        
        if (includeSatellite && (
            isWeeklyRun || 
            this.shouldRunSatelliteAnalysis() || 
            shouldTriggerSatelliteFallback
        )) {
            if (shouldTriggerSatelliteFallback) {
                satelliteAnalysisReason = 'SMART_FALLBACK';
                console.log('� SATELLITE SCAN: Triggered by insufficient CORE BUY signals');
            } else if (isWeeklyRun) {
                satelliteAnalysisReason = 'WEEKLY_SCHEDULED';
                console.log('📅 SATELLITE SCAN: Weekly scheduled analysis');
            } else {
                satelliteAnalysisReason = 'TIME_BASED';
                console.log('⏰ SATELLITE SCAN: Time-based trigger');
            }
            
            satelliteResults = await this.analyzeSatelliteUniverse();
            
            // Log SATELLITE results for comparison
            const satelliteBuySignals = satelliteResults.filter(result => 
                result.decision?.action === 'BUY' || result.decision?.action === 'STRONG_BUY'
            );
            console.log(`🛰️ SATELLITE Results: ${satelliteBuySignals.length} additional BUY signals found`);
        }
        
        // Step 3: Combine results with priority weighting
        const allCurrentSignals = this.combineUniverseResults(coreResults, satelliteResults);
        
        // Enhanced signal summary with fallback context
        const totalBuySignals = allCurrentSignals.filter(s => 
            s.decision?.action === 'BUY' || s.decision?.action === 'STRONG_BUY'
        );
        const totalWatchSignals = allCurrentSignals.filter(s => s.decision?.action === 'WATCH');
        
        console.log(`📈 COMBINED Results: ${totalBuySignals.length} total BUY signals, ${totalWatchSignals.length} total WATCH signals`);
        
        // Step 4: Get previous signal states for evolution tracking
        const previousSignals = await this.getPreviousSignalStates();
        
        // Step 5: Analyze signal evolution with professional patterns
        const evolutionAnalysis = await this.analyzeSignalEvolutionExpert(previousSignals, allCurrentSignals);
        
        // Step 6: Update managed watchlist with expert prioritization
        const managedWatchlist = await this.updateExpertWatchlist(evolutionAnalysis);
        
        // Step 7: Generate capital allocation recommendations
        const capitalRecommendations = await this.generateCapitalAllocationAdvice(evolutionAnalysis);
        
        const executionTime = Date.now() - startTime;
        console.log(`✅ [EXPERT-STRATEGY] Analysis complete in ${executionTime}ms`);
        
        return {
            strategy: 'SP500_CORE_PLUS_SATELLITE',
            analysis_summary: {
                core_analyzed: coreResults.length,
                satellite_analyzed: satelliteResults.length,
                total_signals: allCurrentSignals.length,
                buy_signals: totalBuySignals.length,
                watch_signals: totalWatchSignals.length,
                execution_time_ms: executionTime,
                // Enhanced fallback context
                smart_fallback: {
                    triggered: shouldTriggerSatelliteFallback,
                    reason: shouldTriggerSatelliteFallback ? `Core BUY signals (${coreBuySignals.length}) below threshold (${minBuySignalsThreshold})` : null,
                    core_buy_signals: coreBuySignals.length,
                    satellite_analysis_reason: satelliteAnalysisReason,
                    satellite_buy_signals: satelliteResults.filter(r => r.decision?.action === 'BUY' || r.decision?.action === 'STRONG_BUY').length
                }
            },
            evolution_analysis: evolutionAnalysis,
            managed_watchlist: managedWatchlist,
            capital_recommendations: capitalRecommendations,
            universe_composition: {
                core_universe: SP500_CORE.length,
                satellite_universe: SP500_SATELLITE.length,
                focus_approach: "Professional liquidity-focused S&P 500 strategy with smart fallback"
            }
        };
    }

    /**
     * ANALYZE CORE UNIVERSE (S&P 500 Top 100) - Daily Analysis
     */
    async analyzeCoreUniverse() {
        console.log(`📊 Core Universe: ${SP500_CORE.length} stocks (0.3s intervals)`);
        
        return await this.batchAnalyzeWithProfessionalIntervals(SP500_CORE, {
            batchSize: 40, // Smaller batches for core stocks
            delayBetweenBatches: this.CORE_ANALYSIS_INTERVAL,
            universe: 'CORE',
            priority: 'HIGH'
        });
    }

    /**
     * ANALYZE SATELLITE UNIVERSE (Remaining S&P 500) - Weekly Breakout Scans
     * Enhanced with fallback-specific targeting
     */
    async analyzeSatelliteUniverse(fallbackStrategy = null) {
        console.log(`🛰️ Satellite Universe: ${SP500_SATELLITE.length} stocks (1s intervals)`);
        
        if (fallbackStrategy) {
            console.log(`🎯 Fallback Strategy: ${fallbackStrategy.type} - ${fallbackStrategy.description}`);
        }
        
        // Adjust analysis parameters based on fallback strategy
        const analysisOptions = this.getSatelliteAnalysisOptions(fallbackStrategy);
        
        return await this.batchAnalyzeWithProfessionalIntervals(SP500_SATELLITE, {
            batchSize: analysisOptions.batchSize,
            delayBetweenBatches: analysisOptions.delayBetweenBatches,
            universe: 'SATELLITE',
            priority: analysisOptions.priority,
            focusFilter: analysisOptions.focusFilter
        });
    }

    /**
     * GET SATELLITE ANALYSIS OPTIONS BASED ON FALLBACK STRATEGY
     */
    getSatelliteAnalysisOptions(fallbackStrategy) {
        if (!fallbackStrategy) {
            // Standard satellite analysis
            return {
                batchSize: 25,
                delayBetweenBatches: this.SATELLITE_ANALYSIS_INTERVAL,
                priority: 'MEDIUM',
                focusFilter: null
            };
        }

        switch (fallbackStrategy.type) {
            case 'COMPREHENSIVE_SATELLITE':
                return {
                    batchSize: 30, // Larger batches for comprehensive scan
                    delayBetweenBatches: 800, // Slightly faster
                    priority: 'HIGH',
                    focusFilter: 'ALL_SIGNALS'
                };
                
            case 'TARGETED_BUY_SCAN':
                return {
                    batchSize: 20, // Smaller batches for focused analysis
                    delayBetweenBatches: 600, // Faster for targeted scan
                    priority: 'HIGH',
                    focusFilter: 'BUY_OPPORTUNITIES'
                };
                
            case 'BREAKOUT_FOCUSED':
                return {
                    batchSize: 25,
                    delayBetweenBatches: 700,
                    priority: 'MEDIUM',
                    focusFilter: 'BREAKOUT_PATTERNS'
                };
                
            default:
                return {
                    batchSize: 25,
                    delayBetweenBatches: this.SATELLITE_ANALYSIS_INTERVAL,
                    priority: 'MEDIUM',
                    focusFilter: null
                };
        }
    }

    /**
     * ENHANCED EXPERT ANALYSIS WITH COMPREHENSIVE FALLBACK
     * Alternative method with more sophisticated fallback logic
     */
    async runAdvancedExpertAnalysis(options = {}) {
        const {
            includeSatellite = true,
            trackPositions = true,
            isWeeklyRun = false,
            fallbackOptions = {
                minBuySignals: 1,        // Reduced from 3 to 1 - more aggressive
                minInstitutionalGrade: 0, // Reduced from 1 to 0 - include all grades
                minWatchSignals: 3       // Reduced from 5 to 3 - more lenient
            }
        } = options;

        console.log('🎯 [ADVANCED-EXPERT] Starting sophisticated S&P 500 analysis with smart fallback...');
        
        const startTime = Date.now();
        
        // Step 1: Core Universe Analysis
        console.log('🏆 Analyzing CORE UNIVERSE: S&P 500 Top 100');
        const coreResults = await this.analyzeCoreUniverse();
        
        // Step 2: Assess fallback strategy based on CORE results
        const fallbackAssessment = this.assessFallbackStrategy(coreResults, fallbackOptions);
        
        console.log('📊 FALLBACK ASSESSMENT:');
        console.log(`   Should Trigger: ${fallbackAssessment.should_trigger}`);
        console.log(`   Triggers: ${fallbackAssessment.triggers_activated.join(', ') || 'None'}`);
        console.log(`   Strategy: ${fallbackAssessment.recommended_strategy.type}`);
        console.log(`   Core Metrics: ${JSON.stringify(fallbackAssessment.core_metrics, null, 2)}`);
        
        // Step 3: Conditional SATELLITE analysis with strategy-specific targeting
        let satelliteResults = [];
        let satelliteAnalysisReason = 'SKIPPED';
        
        if (includeSatellite && (
            isWeeklyRun || 
            this.shouldRunSatelliteAnalysis() || 
            fallbackAssessment.should_trigger
        )) {
            if (fallbackAssessment.should_trigger) {
                satelliteAnalysisReason = 'SMART_FALLBACK';
                console.log(`🚨 SMART FALLBACK: ${fallbackAssessment.recommended_strategy.description}`);
                satelliteResults = await this.analyzeSatelliteUniverse(fallbackAssessment.recommended_strategy);
            } else {
                satelliteAnalysisReason = isWeeklyRun ? 'WEEKLY_SCHEDULED' : 'TIME_BASED';
                satelliteResults = await this.analyzeSatelliteUniverse();
            }
        }
        
        // Step 4: Enhanced result combination and analysis
        const allCurrentSignals = this.combineUniverseResults(coreResults, satelliteResults);
        const previousSignals = await this.getPreviousSignalStates();
        const evolutionAnalysis = await this.analyzeSignalEvolutionExpert(previousSignals, allCurrentSignals);
        const managedWatchlist = await this.updateExpertWatchlist(evolutionAnalysis);
        const capitalRecommendations = await this.generateCapitalAllocationAdvice(evolutionAnalysis);
        
        const executionTime = Date.now() - startTime;
        console.log(`✅ [ADVANCED-EXPERT] Analysis complete in ${executionTime}ms`);
        
        return {
            strategy: 'SP500_ADVANCED_CORE_SATELLITE',
            analysis_summary: {
                core_analyzed: coreResults.length,
                satellite_analyzed: satelliteResults.length,
                total_signals: allCurrentSignals.length,
                buy_signals: allCurrentSignals.filter(s => ['BUY', 'STRONG_BUY'].includes(s.decision?.action)).length,
                watch_signals: allCurrentSignals.filter(s => s.decision?.action === 'WATCH').length,
                execution_time_ms: executionTime
            },
            fallback_analysis: {
                assessment: fallbackAssessment,
                satellite_reason: satelliteAnalysisReason,
                strategy_effectiveness: this.assessStrategyEffectiveness(coreResults, satelliteResults, fallbackAssessment)
            },
            evolution_analysis: evolutionAnalysis,
            managed_watchlist: managedWatchlist,
            capital_recommendations: capitalRecommendations,
            universe_composition: {
                core_universe: SP500_CORE.length,
                satellite_universe: SP500_SATELLITE.length,
                focus_approach: "Advanced professional S&P 500 strategy with intelligent fallback"
            }
        };
    }

    /**
     * ASSESS STRATEGY EFFECTIVENESS
     */
    assessStrategyEffectiveness(coreResults, satelliteResults, fallbackAssessment) {
        const coreBuySignals = coreResults.filter(r => ['BUY', 'STRONG_BUY'].includes(r.decision?.action)).length;
        const satelliteBuySignals = satelliteResults.filter(r => ['BUY', 'STRONG_BUY'].includes(r.decision?.action)).length;
        
        const totalBuySignals = coreBuySignals + satelliteBuySignals;
        const fallbackContribution = satelliteResults.length > 0 ? (satelliteBuySignals / totalBuySignals) * 100 : 0;
        
        return {
            total_buy_signals: totalBuySignals,
            core_contribution: coreBuySignals,
            satellite_contribution: satelliteBuySignals,
            fallback_effectiveness: fallbackContribution,
            strategy_success: totalBuySignals >= fallbackAssessment.core_metrics.buy_signals + (fallbackAssessment.recommended_strategy?.expected_additional_signals || 0) * 0.3,
            recommendation: totalBuySignals >= 5 ? 'SUFFICIENT_OPPORTUNITIES' : 'CONSIDER_BROADER_ANALYSIS'
        };
    }

    /**
     * COMBINE UNIVERSE RESULTS WITH EXPERT WEIGHTING
     */
    combineUniverseResults(coreResults, satelliteResults) {
        // Core universe gets higher priority weighting
        const weightedCore = coreResults.map(result => ({
            ...result,
            universe: 'CORE',
            priority_weight: 1.0,
            liquidity_tier: 'HIGH'
        }));
        
        // Satellite universe gets medium priority (breakout focus)
        const weightedSatellite = satelliteResults.map(result => ({
            ...result,
            universe: 'SATELLITE',
            priority_weight: 0.7,
            liquidity_tier: 'MEDIUM'
        }));
        
        return [...weightedCore, ...weightedSatellite]
            .sort((a, b) => {
                // Sort by signal strength * priority weight
                const scoreA = this.calculateSignalScore(a) * a.priority_weight;
                const scoreB = this.calculateSignalScore(b) * b.priority_weight;
                return scoreB - scoreA;
            });
    }

    /**
     * PROFESSIONAL BATCH ANALYSIS WITH SMART INTERVALS
     */
    async batchAnalyzeWithProfessionalIntervals(stocks, options) {
        const { batchSize, delayBetweenBatches, universe, priority } = options;
        const results = [];
        
        for (let i = 0; i < stocks.length; i += batchSize) {
            const batch = stocks.slice(i, i + batchSize);
            const batchNum = Math.floor(i/batchSize) + 1;
            const totalBatches = Math.ceil(stocks.length/batchSize);
            
            console.log(`🔄 [${universe}] Batch ${batchNum}/${totalBatches}: ${batch.length} stocks`);
            
            // Analyze batch in parallel with error handling
            const batchPromises = batch.map(symbol => 
                this.analyzeStockWithProfessionalErrorHandling(symbol, { universe, priority })
            );
            
            const batchResults = await Promise.allSettled(batchPromises);
            
            // Process results with enhanced metadata
            batchResults.forEach((result, index) => {
                if (result.status === 'fulfilled' && result.value) {
                    results.push({
                        symbol: batch[index],
                        ...result.value,
                        universe,
                        priority,
                        analyzed_at: new Date(),
                        batch_number: batchNum
                    });
                } else {
                    console.warn(`⚠️ [${universe}] Analysis failed for ${batch[index]}: ${result.reason?.message || 'Unknown error'}`);
                }
            });
            
            // Smart delay (except for last batch)
            if (i + batchSize < stocks.length) {
                await this.sleep(delayBetweenBatches);
            }
        }
        
        console.log(`✅ [${universe}] Completed: ${results.length}/${stocks.length} stocks analyzed`);
        return results;
    }

    /**
     * PROFESSIONAL STOCK ANALYSIS WITH ENHANCED ERROR HANDLING
     */
    async analyzeStockWithProfessionalErrorHandling(symbol, metadata = {}) {
        try {
            const http = require('http');
            
            return await new Promise((resolve, reject) => {
                const options = {
                    hostname: 'localhost',
                    port: 8000,
                    path: `/api/trading/signal-analysis?symbols=${symbol}`,
                    method: 'GET',
                    timeout: 15000 // 15 second timeout for professional analysis
                };

                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            const result = JSON.parse(data);
                            if (result.success && result.results?.[0]) {
                                const analysis = result.results[0];
                                
                                // Enhanced analysis with professional metrics
                                resolve({
                                    ...analysis,
                                    signal_quality: this.assessSignalQuality(analysis),
                                    liquidity_tier: metadata.universe === 'CORE' ? 'HIGH' : 'MEDIUM',
                                    research_coverage: metadata.universe === 'CORE' ? 'EXCELLENT' : 'GOOD',
                                    position_sizing_weight: this.calculatePositionSizingWeight(analysis, metadata)
                                });
                            } else {
                                resolve(null);
                            }
                        } catch (error) {
                            console.warn(`📊 Parse error for ${symbol}: ${error.message}`);
                            resolve(null);
                        }
                    });
                });

                req.on('error', (error) => {
                    console.warn(`🌐 Network error for ${symbol}: ${error.message}`);
                    resolve(null);
                });
                
                req.on('timeout', () => {
                    console.warn(`⏰ Timeout for ${symbol}`);
                    req.abort();
                    resolve(null);
                });
                
                req.end();
            });
        } catch (error) {
            console.warn(`💥 Unexpected error for ${symbol}: ${error.message}`);
            return null;
        }
    }

    /**
     * ASSESS SIGNAL QUALITY FOR PROFESSIONAL TRADING
     * Grade and Confidence are independent metrics:
     * - Grade: Technical setup quality (A+ to F)
     * - Confidence: System certainty about signal direction (0.0 to 1.0)
     */
    assessSignalQuality(analysis) {
        const { decision } = analysis;
        const confidence = decision.confidence || 0;
        const grade = decision.grade || 'C';
        
        // Professional signal quality assessment based on BOTH metrics
        // High-grade setups with high confidence = Institutional
        if (['A+', 'A'].includes(grade) && confidence >= 0.75) {
            return 'INSTITUTIONAL_GRADE';
        }
        // High-grade setups with moderate confidence OR good setups with high confidence
        else if ((['A+', 'A', 'A-'].includes(grade) && confidence >= 0.60) || 
                 (['B+', 'B'].includes(grade) && confidence >= 0.80)) {
            return 'PROFESSIONAL_GRADE';
        }
        // Good setups with reasonable confidence OR average setups with high confidence
        else if ((['A-', 'B+', 'B', 'B-'].includes(grade) && confidence >= 0.50) || 
                 (['C+', 'C'].includes(grade) && confidence >= 0.75)) {
            return 'RETAIL_GRADE';
        }
        // Lower quality setups or low confidence signals
        else {
            return 'SPECULATIVE_GRADE';
        }
    }

    /**
     * CALCULATE POSITION SIZING WEIGHT BASED ON PROFESSIONAL CRITERIA
     */
    calculatePositionSizingWeight(analysis, metadata) {
        const { decision } = analysis;
        const baseWeight = metadata.universe === 'CORE' ? 1.0 : 0.7;
        const confidenceMultiplier = (decision.confidence || 0.5);
        const gradeMultiplier = this.getGradeMultiplier(decision.grade);
        
        return Math.min(baseWeight * confidenceMultiplier * gradeMultiplier, 1.0);
    }

    /**
     * GET GRADE MULTIPLIER FOR POSITION SIZING
     */
    getGradeMultiplier(grade) {
        const gradeMap = {
            'A+': 1.0, 'A': 0.95, 'A-': 0.9,
            'B+': 0.85, 'B': 0.8, 'B-': 0.75,
            'C+': 0.7, 'C': 0.6, 'C-': 0.5,
            'D': 0.3, 'F': 0.1
        };
        return gradeMap[grade] || 0.5;
    }

    /**
     * CALCULATE SIGNAL SCORE FOR SORTING
     */
    calculateSignalScore(signal) {
        const actionScore = this.signalHierarchy[signal.decision?.action] || 0;
        const confidence = signal.decision?.confidence || 0;
        const gradeMultiplier = this.getGradeMultiplier(signal.decision?.grade);
        
        return actionScore * confidence * gradeMultiplier;
    }

    /**
     * DETERMINE IF SATELLITE ANALYSIS SHOULD RUN
     * Enhanced with smart fallback logic
     */
    shouldRunSatelliteAnalysis() {
        const now = new Date();
        const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const hour = now.getHours();
        
        // Run satellite analysis on weekdays between 9 AM - 4 PM
        // Or if it's been more than 24 hours since last run
        return (dayOfWeek >= 1 && dayOfWeek <= 5 && hour >= 9 && hour <= 16);
    }

    /**
     * SMART FALLBACK STRATEGY ASSESSMENT
     * Determines if SATELLITE scan should be triggered based on CORE results
     */
    assessFallbackStrategy(coreResults, options = {}) {
        const {
            minBuySignals = 1,        // More aggressive - was 3
            minInstitutionalGrade = 0, // More aggressive - was 1
            minWatchSignals = 3,      // More aggressive - was 5
            marketConditionWeight = 1.0
        } = options;

        const coreBuySignals = coreResults.filter(result => 
            result.decision?.action === 'BUY' || result.decision?.action === 'STRONG_BUY'
        );
        
        const coreWatchSignals = coreResults.filter(result => 
            result.decision?.action === 'WATCH'
        );
        
        const institutionalGradeSignals = coreResults.filter(result => 
            result.signal_quality === 'INSTITUTIONAL_GRADE'
        );

        // Professional fallback triggers
        const triggers = {
            insufficient_buy_signals: coreBuySignals.length < minBuySignals,
            low_institutional_quality: institutionalGradeSignals.length < minInstitutionalGrade,
            insufficient_total_opportunities: (coreBuySignals.length + coreWatchSignals.length) < minWatchSignals,
            weak_market_breadth: this.assessMarketBreadth(coreResults) < 0.3
        };

        const shouldTriggerFallback = Object.values(triggers).some(trigger => trigger);
        
        const strategy = this.determineFallbackStrategy(triggers, coreResults);

        return {
            should_trigger: shouldTriggerFallback,
            triggers_activated: Object.entries(triggers).filter(([_, active]) => active).map(([trigger, _]) => trigger),
            recommended_strategy: strategy,
            core_metrics: {
                buy_signals: coreBuySignals.length,
                watch_signals: coreWatchSignals.length,
                institutional_grade: institutionalGradeSignals.length,
                market_breadth: this.assessMarketBreadth(coreResults),
                total_analyzed: coreResults.length
            }
        };
    }

    /**
     * ASSESS MARKET BREADTH FROM CORE RESULTS
     */
    assessMarketBreadth(coreResults) {
        if (coreResults.length === 0) return 0;
        
        const positiveSignals = coreResults.filter(result => 
            ['BUY', 'STRONG_BUY', 'WATCH'].includes(result.decision?.action)
        );
        
        return positiveSignals.length / coreResults.length;
    }

    /**
     * DETERMINE OPTIMAL FALLBACK STRATEGY
     */
    determineFallbackStrategy(triggers, coreResults) {
        // If multiple triggers, use comprehensive SATELLITE scan
        if (Object.values(triggers).filter(t => t).length >= 2) {
            return {
                type: 'COMPREHENSIVE_SATELLITE',
                description: 'Run full SATELLITE analysis due to multiple weak signals in CORE',
                priority: 'HIGH',
                expected_additional_signals: 15
            };
        }
        
        // If only insufficient BUY signals, focus on SATELLITE BUY opportunities
        if (triggers.insufficient_buy_signals) {
            return {
                type: 'TARGETED_BUY_SCAN',
                description: 'Focus SATELLITE scan on BUY signal opportunities',
                priority: 'MEDIUM',
                expected_additional_signals: 8
            };
        }
        
        // If low institutional quality, scan for breakout patterns
        if (triggers.low_institutional_quality) {
            return {
                type: 'BREAKOUT_FOCUSED',
                description: 'SATELLITE scan focusing on breakout and momentum patterns',
                priority: 'MEDIUM',
                expected_additional_signals: 10
            };
        }
        
        // Default strategy
        return {
            type: 'STANDARD_SATELLITE',
            description: 'Standard SATELLITE analysis',
            priority: 'LOW',
            expected_additional_signals: 5
        };
    }

    /**
     * GET PREVIOUS SIGNAL STATES
     */
    async getPreviousSignalStates() {
        const previousStocks = await prisma.watchlistStock.findMany({
            select: {
                symbol: true,
                decisionAction: true,
                decisionGrade: true,
                decisionConfidence: true,
                lastAnalyzedAt: true,
                systemsData: true
            }
        });

        const signalMap = {};
        previousStocks.forEach(stock => {
            signalMap[stock.symbol] = {
                action: stock.decisionAction,
                grade: stock.decisionGrade,
                confidence: stock.decisionConfidence,
                last_updated: stock.lastAnalyzedAt,
                systems_data: stock.systemsData ? JSON.parse(stock.systemsData) : null
            };
        });

        return signalMap;
    }

    /**
     * EXPERT SIGNAL EVOLUTION ANALYSIS WITH PROFESSIONAL PATTERNS
     */
    async analyzeSignalEvolutionExpert(previousSignals, currentSignals) {
        const evolution = {
            strengthening: [],    // Professional: Getting stronger (confidence/grade improving)
            degrading: [],       // Professional: Getting weaker (confidence/grade declining)
            stable: [],          // Professional: Consistent signal with stable metrics
            breaking: [],        // Critical: Major signal breakdown (BUY → AVOID)
            recovering: [],      // Opportunity: Signal recovery from weakness
            new_entries: [],     // Fresh opportunities
            disappeared: []      // No longer tracked
        };

        // Professional position impact analysis
        const positionImpact = {
            critical_risk: [],          // Immediate attention required
            moderate_risk: [],          // Monitor closely
            confirmed_holdings: [],     // Strong positions to hold
            upgrade_opportunities: [],  // Positions getting stronger
            new_opportunities: [],      // Fresh high-quality entries
            capital_reallocation: []    // Suggest moving capital
        };

        // Get current open positions with enhanced metadata
        const openPositions = await this.getEnhancedPositionData();
        const positionMap = {};
        openPositions.forEach(pos => {
            positionMap[pos.ticker] = pos;
        });

        console.log(`🔍 Analyzing evolution for ${currentSignals.length} signals vs ${Object.keys(previousSignals).length} previous`);

        // Professional signal evolution analysis
        currentSignals.forEach(current => {
            const previous = previousSignals[current.symbol];
            const hasPosition = positionMap[current.symbol];
            const currentScore = this.calculateSignalScore(current);

            if (!previous) {
                // New entry analysis
                const newEntry = {
                    symbol: current.symbol,
                    action: current.decision.action,
                    grade: current.decision.grade,
                    confidence: current.decision.confidence,
                    signal_quality: current.signal_quality,
                    universe: current.universe,
                    has_position: !!hasPosition,
                    entry_score: currentScore
                };

                evolution.new_entries.push(newEntry);

                // Categorize new opportunities by quality
                if (current.decision.action === 'BUY' && !hasPosition) {
                    if (current.signal_quality === 'INSTITUTIONAL_GRADE') {
                        positionImpact.new_opportunities.push({
                            ...newEntry,
                            opportunity_type: 'INSTITUTIONAL_GRADE',
                            recommended_allocation: this.calculateRecommendedAllocation(current)
                        });
                    }
                }
            } else {
                // Evolution analysis for existing signals
                const prevScore = this.calculatePreviousSignalScore(previous);
                const scoreChange = currentScore - prevScore;
                const confidenceChange = current.decision.confidence - (previous.confidence || 0);
                
                const evolutionItem = {
                    symbol: current.symbol,
                    previous_action: previous.action,
                    current_action: current.decision.action,
                    previous_grade: previous.grade,
                    current_grade: current.decision.grade,
                    confidence_change: confidenceChange,
                    confidence: current.decision.confidence, // Add current confidence
                    score_change: scoreChange,
                    signal_quality: current.signal_quality,
                    evolution_pattern: this.identifyEvolutionPattern(previous, current),
                    has_position: !!hasPosition,
                    universe: current.universe
                };

                // Categorize by evolution pattern
                const pattern = evolutionItem.evolution_pattern;
                
                if (pattern === 'STRENGTHENING') {
                    evolution.strengthening.push(evolutionItem);
                    
                    if (hasPosition) {
                        positionImpact.upgrade_opportunities.push({
                            ...evolutionItem,
                            position: hasPosition,
                            action_suggestion: 'CONSIDER_INCREASING_POSITION'
                        });
                    }
                } else if (pattern === 'DEGRADING') {
                    evolution.degrading.push(evolutionItem);
                    
                    if (hasPosition) {
                        const riskLevel = this.assessPositionRisk(previous, current);
                        if (riskLevel === 'CRITICAL') {
                            positionImpact.critical_risk.push({
                                ...evolutionItem,
                                position: hasPosition,
                                risk_level: riskLevel,
                                action_suggestion: 'IMMEDIATE_REVIEW_REQUIRED'
                            });
                        } else {
                            positionImpact.moderate_risk.push({
                                ...evolutionItem,
                                position: hasPosition,
                                risk_level: riskLevel,
                                action_suggestion: 'MONITOR_CLOSELY'
                            });
                        }
                    }
                } else if (pattern === 'BREAKING') {
                    evolution.breaking.push(evolutionItem);
                    
                    if (hasPosition) {
                        positionImpact.critical_risk.push({
                            ...evolutionItem,
                            position: hasPosition,
                            risk_level: 'CRITICAL',
                            action_suggestion: 'CONSIDER_EXIT'
                        });
                    }
                } else if (pattern === 'RECOVERING') {
                    evolution.recovering.push(evolutionItem);
                } else {
                    evolution.stable.push(evolutionItem);
                    
                    if (hasPosition) {
                        positionImpact.confirmed_holdings.push({
                            ...evolutionItem,
                            position: hasPosition,
                            action_suggestion: 'MAINTAIN_POSITION'
                        });
                    }
                }
            }
        });

        // Find disappeared signals
        Object.keys(previousSignals).forEach(symbol => {
            if (!currentSignals.find(c => c.symbol === symbol)) {
                evolution.disappeared.push({
                    symbol,
                    previous_action: previousSignals[symbol].action,
                    has_position: !!positionMap[symbol],
                    concern_level: positionMap[symbol] ? 'HIGH' : 'LOW'
                });
            }
        });

        // Generate capital reallocation suggestions
        positionImpact.capital_reallocation = this.generateCapitalReallocationSuggestions(
            positionImpact.critical_risk,
            positionImpact.new_opportunities
        );

        return {
            evolution_patterns: evolution,
            position_impact: positionImpact,
            professional_summary: {
                total_tracked: currentSignals.length,
                strengthening: evolution.strengthening.length,
                degrading: evolution.degrading.length,
                breaking: evolution.breaking.length,
                recovering: evolution.recovering.length,
                stable: evolution.stable.length,
                new_opportunities: positionImpact.new_opportunities.length,
                critical_risks: positionImpact.critical_risk.length,
                institutional_grade_signals: currentSignals.filter(s => s.signal_quality === 'INSTITUTIONAL_GRADE').length
            },
            risk_assessment: {
                overall_portfolio_risk: this.assessOverallPortfolioRisk(positionImpact),
                immediate_actions_required: positionImpact.critical_risk.length,
                monitoring_required: positionImpact.moderate_risk.length
            }
        };
    }

    /**
     * ANALYZE SIGNAL EVOLUTION (Legacy method for backward compatibility)
     */
    async analyzeSignalEvolution(previousSignals, currentSignals) {
        const evolution = {
            upgraded: [],      // WATCH → BUY, AVOID → WATCH, etc.
            degraded: [],      // BUY → WATCH, WATCH → AVOID, etc.
            stable: [],        // Same signal
            new_entries: [],   // First time appearance
            disappeared: []    // No longer in results
        };

        // Track position impact
        const positionImpact = {
            positions_at_risk: [],      // Existing positions with degraded signals
            positions_confirmed: [],    // Existing positions with stable/upgraded signals
            new_opportunities: []       // New BUY signals for fresh positions
        };

        // Get current open positions
        const openPositions = await prisma.trade.findMany({
            where: { status: { in: ['Open', 'Partial Closed'] } },
            select: { ticker: true, entryPrice: true, currentPrice: true, status: true }
        });
        
        const positionMap = {};
        openPositions.forEach(pos => {
            positionMap[pos.ticker] = pos;
        });

        // Analyze each current signal
        currentSignals.forEach(current => {
            const previous = previousSignals[current.symbol];
            const hasPosition = positionMap[current.symbol];

            if (!previous) {
                evolution.new_entries.push({
                    symbol: current.symbol,
                    action: current.decision.action,
                    grade: current.decision.grade,
                    confidence: current.decision.confidence,
                    has_position: !!hasPosition
                });
                
                if (current.decision.action === 'BUY' && !hasPosition) {
                    positionImpact.new_opportunities.push(current);
                }
            } else {
                const prevRank = this.signalHierarchy[previous.action] || 0;
                const currRank = this.signalHierarchy[current.decision.action] || 0;

                const evolutionItem = {
                    symbol: current.symbol,
                    previous_action: previous.action,
                    current_action: current.decision.action,
                    previous_grade: previous.grade,
                    current_grade: current.decision.grade,
                    confidence_change: current.decision.confidence - (previous.confidence || 0),
                    confidence: current.decision.confidence, // Add current confidence
                    has_position: !!hasPosition,
                    signal_strength_change: currRank - prevRank
                };

                if (currRank > prevRank) {
                    evolution.upgraded.push(evolutionItem);
                } else if (currRank < prevRank) {
                    evolution.degraded.push(evolutionItem);
                    
                    // Critical: Existing position with degraded signal
                    if (hasPosition) {
                        positionImpact.positions_at_risk.push({
                            ...evolutionItem,
                            position: hasPosition,
                            risk_level: this.calculateRiskLevel(previous.action, current.decision.action)
                        });
                    }
                } else {
                    evolution.stable.push(evolutionItem);
                    
                    if (hasPosition) {
                        positionImpact.positions_confirmed.push({
                            ...evolutionItem,
                            position: hasPosition
                        });
                    }
                }
            }
        });

        // Find disappeared signals
        Object.keys(previousSignals).forEach(symbol => {
            if (!currentSignals.find(c => c.symbol === symbol)) {
                evolution.disappeared.push({
                    symbol,
                    previous_action: previousSignals[symbol].action,
                    has_position: !!positionMap[symbol]
                });
            }
        });

        return {
            signal_evolution: evolution,
            position_impact: positionImpact,
            summary: {
                total_tracked: currentSignals.length,
                upgraded: evolution.upgraded.length,
                degraded: evolution.degraded.length,
                stable: evolution.stable.length,
                new_entries: evolution.new_entries.length,
                positions_at_risk: positionImpact.positions_at_risk.length
            }
        };
    }

    /**
     * UPDATE WATCHLIST WITH EVOLUTION CONTEXT
     */
    async updateWatchlistWithEvolution(evolutionAnalysis) {
        console.log('💾 Updating watchlist with signal evolution context...');
        
        // Clear existing watchlist
        await prisma.watchlistStock.deleteMany({});
        
        const { signal_evolution } = evolutionAnalysis;
        const watchlistEntries = [];

        // Helper to create watchlist entry
        const createWatchlistEntry = (item, evolutionType) => {
            const priority = this.calculateEvolutionPriority(item, evolutionType);
            
            return {
                symbol: item.symbol,
                currentPrice: item.currentPrice || 0,
                decisionAction: item.current_action || item.action,
                decisionGrade: item.current_grade || item.grade,
                decisionConfidence: item.confidence || 0,
                priority,
                status: 'ACTIVE',
                evolutionType,
                signalStrengthChange: item.signal_strength_change || 0,
                hasPosition: item.has_position || false,
                nextStepSummary: this.generateEvolutionSummary(item, evolutionType),
                addedAt: new Date(),
                lastAnalyzedAt: new Date()
            };
        };

        // Add entries by evolution type with priority
        
        // 1. Highest Priority: Upgraded signals (especially with positions)
        signal_evolution.upgraded.forEach(item => {
            watchlistEntries.push(createWatchlistEntry(item, 'UPGRADED'));
        });

        // 2. High Priority: New BUY entries
        signal_evolution.new_entries
            .filter(item => item.action === 'BUY')
            .forEach(item => {
                watchlistEntries.push(createWatchlistEntry(item, 'NEW_BUY'));
            });

        // 3. Medium Priority: Stable BUY/WATCH signals
        signal_evolution.stable
            .filter(item => ['BUY', 'WATCH'].includes(item.current_action))
            .forEach(item => {
                watchlistEntries.push(createWatchlistEntry(item, 'STABLE'));
            });

        // 4. Monitor Priority: Degraded signals (especially with positions)
        signal_evolution.degraded
            .filter(item => ['BUY', 'WATCH'].includes(item.current_action))
            .forEach(item => {
                watchlistEntries.push(createWatchlistEntry(item, 'DEGRADED'));
            });

        // 5. Lower Priority: New WATCH entries
        signal_evolution.new_entries
            .filter(item => item.action === 'WATCH')
            .forEach(item => {
                watchlistEntries.push(createWatchlistEntry(item, 'NEW_WATCH'));
            });

        // Sort by priority and limit to manageable size
        const sortedEntries = watchlistEntries
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 50); // Top 50 for manageable watchlist

        // Batch insert
        if (sortedEntries.length > 0) {
            await prisma.watchlistStock.createMany({
                data: sortedEntries
            });
        }

        console.log(`✅ Updated watchlist: ${sortedEntries.length} stocks with evolution context`);
        
        return {
            total_entries: sortedEntries.length,
            by_evolution_type: this.groupByEvolutionType(sortedEntries),
            top_priorities: sortedEntries.slice(0, 10)
        };
    }

    /**
     * GENERATE POSITION MANAGEMENT RECOMMENDATIONS
     */
    async generatePositionRecommendations(evolutionAnalysis) {
        const { position_impact } = evolutionAnalysis;
        const recommendations = [];

        // Critical: Positions at risk
        position_impact.positions_at_risk.forEach(item => {
            const recommendation = {
                symbol: item.symbol,
                current_position: item.position,
                signal_change: `${item.previous_action} → ${item.current_action}`,
                risk_level: item.risk_level,
                recommendation: this.getPositionRecommendation(item),
                urgency: this.getUrgencyLevel(item),
                action_required: true
            };
            
            recommendations.push(recommendation);
        });

        // New opportunities
        position_impact.new_opportunities.forEach(item => {
            recommendations.push({
                symbol: item.symbol,
                signal: item.decision.action,
                grade: item.decision.grade,
                confidence: item.decision.confidence,
                recommendation: 'CONSIDER_ENTRY',
                urgency: 'MEDIUM',
                action_required: false
            });
        });

        return {
            total_recommendations: recommendations.length,
            critical_actions: recommendations.filter(r => r.action_required),
            new_opportunities: recommendations.filter(r => r.recommendation === 'CONSIDER_ENTRY'),
            recommendations
        };
    }

    // Helper methods
    calculateRiskLevel(previousAction, currentAction) {
        const riskMatrix = {
            'BUY_TO_AVOID': 'CRITICAL',
            'BUY_TO_HOLD': 'HIGH',
            'BUY_TO_WATCH': 'MEDIUM',
            'WATCH_TO_AVOID': 'HIGH',
            'WATCH_TO_HOLD': 'MEDIUM'
        };
        
        return riskMatrix[`${previousAction}_TO_${currentAction}`] || 'LOW';
    }

    calculateEvolutionPriority(item, evolutionType) {
        let basePriority = {
            'UPGRADED': 100,
            'NEW_BUY': 200,
            'STABLE': 300,
            'DEGRADED': 250,
            'NEW_WATCH': 400
        }[evolutionType] || 500;

        // Adjust for positions
        if (item.has_position) basePriority -= 50;
        
        // Adjust for signal strength
        if (item.signal_strength_change) {
            basePriority -= (item.signal_strength_change * 25);
        }

        return basePriority;
    }

    generateEvolutionSummary(item, evolutionType) {
        if (evolutionType === 'UPGRADED') {
            return `Signal upgraded: ${item.previous_action} → ${item.current_action}${item.has_position ? ' (Has Position)' : ''}`;
        } else if (evolutionType === 'DEGRADED') {
            return `Signal degraded: ${item.previous_action} → ${item.current_action}${item.has_position ? ' (Position At Risk)' : ''}`;
        } else if (evolutionType === 'NEW_BUY') {
            return `New BUY signal: ${item.grade} grade, ${Math.round((item.confidence || 0) * 100)}% confidence`;
        }
        
        return `${evolutionType}: ${item.current_action || item.action}`;
    }

    getPositionRecommendation(item) {
        const riskActions = {
            'CRITICAL': 'IMMEDIATE_EXIT',
            'HIGH': 'TIGHT_STOP_LOSS',
            'MEDIUM': 'MONITOR_CLOSELY',
            'LOW': 'CONTINUE_HOLDING'
        };
        
        return riskActions[item.risk_level] || 'REVIEW_POSITION';
    }

    getUrgencyLevel(item) {
        return {
            'CRITICAL': 'IMMEDIATE',
            'HIGH': 'WITHIN_1_HOUR',
            'MEDIUM': 'WITHIN_24_HOURS',
            'LOW': 'NEXT_REVIEW_CYCLE'
        }[item.risk_level] || 'LOW';
    }

    groupByEvolutionType(entries) {
        const groups = {};
        entries.forEach(entry => {
            if (!groups[entry.evolutionType]) groups[entry.evolutionType] = 0;
            groups[entry.evolutionType]++;
        });
        return groups;
    }

    // ===== EXPERT ANALYSIS HELPER METHODS =====

    /**
     * GET ENHANCED POSITION DATA FOR PROFESSIONAL ANALYSIS
     */
    async getEnhancedPositionData() {
        const positions = await prisma.trade.findMany({
            where: { status: { in: ['Open', 'Partial Closed'] } },
            select: {
                ticker: true,
                entryPrice: true,
                currentPrice: true,
                status: true,
                quantity: true,
                createdAt: true,
                rMultiple: true,
                riskPerTradeValue: true
            }
        });

        return positions.map(pos => ({
            ...pos,
            // Calculate derived values from existing fields
            totalValue: (pos.currentPrice || 0) * (pos.quantity || 0),
            unrealizedPnL: ((pos.currentPrice || 0) - (pos.entryPrice || 0)) * (pos.quantity || 0),
            positionSize: pos.riskPerTradeValue || 0,
            position_age_days: Math.floor((Date.now() - new Date(pos.createdAt)) / (1000 * 60 * 60 * 24)),
            position_size_pct: this.calculatePositionSizePercentage((pos.currentPrice || 0) * (pos.quantity || 0)),
            risk_level: this.assessPositionRiskLevel(pos)
        }));
    }

    /**
     * IDENTIFY EVOLUTION PATTERN FOR PROFESSIONAL TRADING
     */
    identifyEvolutionPattern(previous, current) {
        const prevRank = this.signalHierarchy[previous.action] || 0;
        const currRank = this.signalHierarchy[current.decision.action] || 0;
        const confidenceChange = current.decision.confidence - (previous.confidence || 0);
        const gradeImprovement = this.compareGrades(previous.grade, current.decision.grade);

        // Professional pattern recognition
        if (currRank > prevRank || (currRank === prevRank && confidenceChange > 0.1)) {
            return 'STRENGTHENING';
        } else if (currRank < prevRank || (currRank === prevRank && confidenceChange < -0.1)) {
            if (previous.action === 'BUY' && current.decision.action === 'AVOID') {
                return 'BREAKING';
            }
            return 'DEGRADING';
        } else if (previous.action === 'AVOID' && ['WATCH', 'BUY'].includes(current.decision.action)) {
            return 'RECOVERING';
        } else {
            return 'STABLE';
        }
    }

    /**
     * CALCULATE PREVIOUS SIGNAL SCORE FOR COMPARISON
     */
    calculatePreviousSignalScore(previous) {
        const actionScore = this.signalHierarchy[previous.action] || 0;
        const confidence = previous.confidence || 0.5;
        const gradeMultiplier = this.getGradeMultiplier(previous.grade);
        
        return actionScore * confidence * gradeMultiplier;
    }

    /**
     * ASSESS POSITION RISK LEVEL FOR PROFESSIONAL TRADING
     */
    assessPositionRisk(previous, current) {
        const riskMatrix = {
            'BUY_TO_AVOID': 'CRITICAL',
            'BUY_TO_SELL': 'CRITICAL',
            'BUY_TO_HOLD': 'HIGH',
            'BUY_TO_WATCH': 'MODERATE',
            'WATCH_TO_AVOID': 'HIGH',
            'WATCH_TO_SELL': 'HIGH',
            'WATCH_TO_HOLD': 'MODERATE'
        };
        
        const key = `${previous.action}_TO_${current.decision.action}`;
        return riskMatrix[key] || 'LOW';
    }

    /**
     * CALCULATE RECOMMENDED ALLOCATION FOR NEW OPPORTUNITIES
     */
    calculateRecommendedAllocation(signal) {
        const baseAllocation = 0.05; // 5% base allocation
        const confidenceMultiplier = signal.decision.confidence || 0.5;
        const qualityMultiplier = signal.signal_quality === 'INSTITUTIONAL_GRADE' ? 1.5 : 1.0;
        const universeMultiplier = signal.universe === 'CORE' ? 1.2 : 1.0;
        
        return Math.min(baseAllocation * confidenceMultiplier * qualityMultiplier * universeMultiplier, 0.15); // Max 15%
    }

    /**
     * GENERATE CAPITAL REALLOCATION SUGGESTIONS
     */
    generateCapitalReallocationSuggestions(criticalRisks, newOpportunities) {
        const suggestions = [];
        
        // Suggest moving capital from critical risks to new opportunities
        criticalRisks.forEach(risk => {
            const bestOpportunity = newOpportunities
                .filter(opp => opp.signal_quality === 'INSTITUTIONAL_GRADE')
                .sort((a, b) => b.entry_score - a.entry_score)[0];
                
            if (bestOpportunity) {
                suggestions.push({
                    action: 'REALLOCATION',
                    from: risk.symbol,
                    to: bestOpportunity.symbol,
                    reason: `Exit declining ${risk.symbol} (${risk.risk_level} risk) → Enter strengthening ${bestOpportunity.symbol}`,
                    expected_benefit: 'Risk reduction + opportunity capture',
                    urgency: 'HIGH'
                });
            }
        });
        
        return suggestions;
    }

    /**
     * ASSESS OVERALL PORTFOLIO RISK
     */
    assessOverallPortfolioRisk(positionImpact) {
        const totalPositions = positionImpact.critical_risk.length + 
                             positionImpact.moderate_risk.length + 
                             positionImpact.confirmed_holdings.length;
        
        if (totalPositions === 0) return 'MINIMAL';
        
        const criticalRatio = positionImpact.critical_risk.length / totalPositions;
        const moderateRatio = positionImpact.moderate_risk.length / totalPositions;
        
        if (criticalRatio > 0.3) return 'HIGH';
        if (criticalRatio > 0.15 || moderateRatio > 0.4) return 'MODERATE';
        return 'LOW';
    }

    /**
     * COMPARE GRADES FOR EVOLUTION ANALYSIS
     */
    compareGrades(prevGrade, currGrade) {
        const gradeValues = {
            'A+': 10, 'A': 9, 'A-': 8,
            'B+': 7, 'B': 6, 'B-': 5,
            'C+': 4, 'C': 3, 'C-': 2,
            'D': 1, 'F': 0
        };
        
        const prevValue = gradeValues[prevGrade] || 3;
        const currValue = gradeValues[currGrade] || 3;
        
        return currValue - prevValue;
    }

    /**
     * CALCULATE POSITION SIZE PERCENTAGE (Mock implementation)
     */
    calculatePositionSizePercentage(totalValue) {
        // This would normally calculate against total portfolio value
        // For now, return a mock percentage
        return Math.random() * 10; // 0-10%
    }

    /**
     * ASSESS POSITION RISK LEVEL BASED ON POSITION DATA
     */
    assessPositionRiskLevel(position) {
        const unrealizedPnLPct = position.unrealizedPnL / position.totalValue;
        
        if (unrealizedPnLPct < -0.15) return 'HIGH';
        if (unrealizedPnLPct < -0.05) return 'MODERATE';
        return 'LOW';
    }

    /**
     * UPDATE EXPERT WATCHLIST WITH PROFESSIONAL PRIORITIZATION
     */
    async updateExpertWatchlist(evolutionAnalysis) {
        console.log('💎 Updating watchlist with expert prioritization...');
        
        // Debug logging
        console.log('🔍 DEBUG - Evolution Analysis Structure:');
        console.log('- position_impact.new_opportunities:', evolutionAnalysis.position_impact?.new_opportunities?.length || 0);
        console.log('- evolution_patterns.stable BUY:', evolutionAnalysis.evolution_patterns?.stable?.filter(item => item.current_action === 'BUY')?.length || 0);
        console.log('- evolution_patterns.new_entries BUY:', evolutionAnalysis.evolution_patterns?.new_entries?.filter(item => item.action === 'BUY')?.length || 0);
        console.log('- evolution_patterns.strengthening:', evolutionAnalysis.evolution_patterns?.strengthening?.length || 0);

        // Log all BUY signals for debugging
        if (evolutionAnalysis.evolution_patterns?.stable) {
            const stableBuys = evolutionAnalysis.evolution_patterns.stable.filter(item => item.current_action === 'BUY');
            console.log('🔍 Stable BUY signals:', stableBuys.map(item => `${item.symbol} (${item.current_grade})`));
        }
        
        if (evolutionAnalysis.evolution_patterns?.new_entries) {
            const newBuys = evolutionAnalysis.evolution_patterns.new_entries.filter(item => item.action === 'BUY');
            console.log('🔍 New BUY signals:', newBuys.map(item => `${item.symbol} (${item.grade})`));
        }
        
        // Clear existing watchlist
        await prisma.watchlistStock.deleteMany({});
        
        const { evolution_patterns, position_impact } = evolutionAnalysis;
        const watchlistEntries = [];

        // Priority 1: Critical risk positions requiring immediate attention
        if (position_impact?.critical_risk) {
            position_impact.critical_risk.forEach(item => {
                watchlistEntries.push(this.createExpertWatchlistEntry(item, 'CRITICAL_RISK', 1));
            });
            console.log(`🚨 Added ${position_impact.critical_risk.length} critical risk entries`);
        }

        // Priority 2: Institutional grade new opportunities (RELAXED FILTER)
        if (position_impact?.new_opportunities) {
            const institutionalOpps = position_impact.new_opportunities.filter(item => 
                item.opportunity_type === 'INSTITUTIONAL_GRADE' || 
                item.current_action === 'BUY' ||
                (item.confidence && item.confidence > 0.8)
            );
            institutionalOpps.forEach(item => {
                watchlistEntries.push(this.createExpertWatchlistEntry(item, 'INSTITUTIONAL_OPPORTUNITY', 2));
            });
            console.log(`💎 Added ${institutionalOpps.length} institutional opportunities (${position_impact.new_opportunities.length} total available)`);
        }

        // Priority 3: Strengthening signals with positions
        if (evolution_patterns?.strengthening) {
            const strengtheningWithPos = evolution_patterns.strengthening.filter(item => item.has_position);
            strengtheningWithPos.forEach(item => {
                watchlistEntries.push(this.createExpertWatchlistEntry(item, 'STRENGTHENING_POSITION', 3));
            });
            console.log(`📈 Added ${strengtheningWithPos.length} strengthening positions (${evolution_patterns.strengthening.length} total strengthening)`);
        }

        // Priority 4: Core universe stable BUY signals (RELAXED FILTER)
        if (evolution_patterns?.stable) {
            const coreStableBuys = evolution_patterns.stable.filter(item => 
                item.current_action === 'BUY' && 
                (item.universe === 'CORE' || item.universe === 'SATELLITE' || !item.universe)
            );
            coreStableBuys.forEach(item => {
                watchlistEntries.push(this.createExpertWatchlistEntry(item, 'CORE_STABLE_BUY', 4));
            });
            console.log(`🎯 Added ${coreStableBuys.length} core stable BUY signals (${evolution_patterns.stable.filter(item => item.current_action === 'BUY').length} total BUY in stable)`);
        }

        // Priority 5: NEW BUY signals from new_entries
        if (evolution_patterns?.new_entries) {
            const newBuySignals = evolution_patterns.new_entries.filter(item => 
                item.action === 'BUY' &&
                (item.universe === 'CORE' || item.universe === 'SATELLITE' || !item.universe)
            );
            newBuySignals.forEach(item => {
                // Convert new_entries format to stable format for consistency
                const normalizedItem = {
                    symbol: item.symbol,
                    current_action: item.action,
                    current_grade: item.grade,
                    confidence: item.confidence / 100, // Convert percentage to decimal
                    signal_quality: item.signal_quality,
                    universe: item.universe,
                    has_position: item.has_position || false
                };
                watchlistEntries.push(this.createExpertWatchlistEntry(normalizedItem, 'NEW_BUY_SIGNAL', 5));
            });
            console.log(`🚀 Added ${newBuySignals.length} new BUY signals (${evolution_patterns.new_entries.filter(item => item.action === 'BUY').length} total BUY in new_entries)`);
        }

        // Priority 6: HIGH-QUALITY WATCH SIGNALS (Top 10 Watch Opportunities)
        const allWatchSignals = [];

        // Collect WATCH signals from stable patterns
        if (evolution_patterns?.stable) {
            const stableWatchSignals = evolution_patterns.stable.filter(item => 
                item.current_action === 'WATCH' &&
                (item.universe === 'CORE' || item.universe === 'SATELLITE' || !item.universe)
            );
            allWatchSignals.push(...stableWatchSignals.map(item => ({ ...item, source: 'stable' })));
        }

        // Collect WATCH signals from new_entries
        if (evolution_patterns?.new_entries) {
            const newWatchSignals = evolution_patterns.new_entries.filter(item => 
                item.action === 'WATCH' &&
                (item.universe === 'CORE' || item.universe === 'SATELLITE' || !item.universe)
            );
            allWatchSignals.push(...newWatchSignals.map(item => ({
                symbol: item.symbol,
                current_action: item.action,
                current_grade: item.grade,
                confidence: item.confidence / 100,
                signal_quality: item.signal_quality,
                universe: item.universe,
                has_position: item.has_position || false,
                source: 'new_entries'
            })));
        }

        // Sort WATCH signals by quality and take top 10
        const topWatchSignals = allWatchSignals
            .filter(item => !watchlistEntries.some(entry => entry.symbol === item.symbol)) // Avoid duplicates
            .sort((a, b) => {
                // Sort by: 1) Signal quality, 2) Confidence, 3) Universe priority
                const qualityScore = (item) => {
                    const qualityMap = {
                        'INSTITUTIONAL_GRADE': 4,
                        'PROFESSIONAL_GRADE': 3,
                        'RETAIL_GRADE': 2,
                        'SPECULATIVE_GRADE': 1
                    };
                    return qualityMap[item.signal_quality] || 0;
                };
                
                const scoreA = qualityScore(a) * 10 + (a.confidence || 0) * 5 + (a.universe === 'CORE' ? 2 : 1);
                const scoreB = qualityScore(b) * 10 + (b.confidence || 0) * 5 + (b.universe === 'CORE' ? 2 : 1);
                
                return scoreB - scoreA;
            })
            .slice(0, 10); // Top 10 WATCH signals

        topWatchSignals.forEach(item => {
            watchlistEntries.push(this.createExpertWatchlistEntry(item, 'TOP_WATCH_SIGNAL', 6));
        });
        console.log(`👁️ Added ${topWatchSignals.length} top-quality WATCH signals (${allWatchSignals.length} total WATCH available)`);

        console.log(`📊 Total watchlist entries before sort/limit: ${watchlistEntries.length}`);

        // FALLBACK: If we don't have many entries, add ALL high-quality signals as backup
        if (watchlistEntries.length < 15) { // Increased from 5 to 15 to accommodate BUY + WATCH
            console.log('🔄 FALLBACK: Adding all available high-quality signals to ensure comprehensive coverage');
            
            // Add any BUY signals from evolution patterns that we might have missed
            if (evolutionAnalysis.all_signals) {
                const allBuySignals = evolutionAnalysis.all_signals.filter(item => 
                    item.current_action === 'BUY' && 
                    !watchlistEntries.some(entry => entry.symbol === item.symbol)
                );
                
                allBuySignals.forEach(item => {
                    watchlistEntries.push(this.createExpertWatchlistEntry(item, 'FALLBACK_BUY', 7));
                });
                console.log(`🔄 Added ${allBuySignals.length} fallback BUY signals`);
            }
            
            // COMPREHENSIVE SEARCH: Look through ALL evolution pattern categories
            const allEvolutionBuys = [];
            const allEvolutionWatches = [];
            
            // Check breaking, recovering, strengthening, degrading for BUY and WATCH signals
            ['breaking', 'recovering', 'strengthening', 'degrading'].forEach(category => {
                if (evolutionAnalysis.evolution_patterns?.[category]) {
                    const categoryBuys = evolutionAnalysis.evolution_patterns[category].filter(item => 
                        (item.current_action === 'BUY' || item.action === 'BUY') &&
                        !watchlistEntries.some(entry => entry.symbol === item.symbol)
                    );
                    const categoryWatches = evolutionAnalysis.evolution_patterns[category].filter(item => 
                        (item.current_action === 'WATCH' || item.action === 'WATCH') &&
                        !watchlistEntries.some(entry => entry.symbol === item.symbol)
                    );
                    
                    allEvolutionBuys.push(...categoryBuys);
                    allEvolutionWatches.push(...categoryWatches);
                    
                    if (categoryBuys.length > 0) {
                        console.log(`🔄 Found ${categoryBuys.length} BUY signals in ${category}:`, categoryBuys.map(item => item.symbol));
                    }
                    if (categoryWatches.length > 0) {
                        console.log(`🔄 Found ${categoryWatches.length} WATCH signals in ${category}:`, categoryWatches.map(item => item.symbol));
                    }
                }
            });
            
            // Add fallback BUY signals
            allEvolutionBuys.forEach(item => {
                const normalizedItem = {
                    symbol: item.symbol,
                    current_action: item.current_action || item.action,
                    current_grade: item.current_grade || item.grade,
                    confidence: typeof item.confidence === 'number' ? 
                        (item.confidence > 1 ? item.confidence / 100 : item.confidence) : 0.5,
                    signal_quality: item.signal_quality || 'PROFESSIONAL_GRADE',
                    universe: item.universe || 'CORE',
                    has_position: item.has_position || false
                };
                watchlistEntries.push(this.createExpertWatchlistEntry(normalizedItem, 'COMPREHENSIVE_BUY', 8));
            });
            
            // Add fallback WATCH signals (top 5 only to keep manageable)
            const topFallbackWatches = allEvolutionWatches
                .sort((a, b) => (b.confidence || 0) - (a.confidence || 0))
                .slice(0, 5);
                
            topFallbackWatches.forEach(item => {
                const normalizedItem = {
                    symbol: item.symbol,
                    current_action: item.current_action || item.action,
                    current_grade: item.current_grade || item.grade,
                    confidence: typeof item.confidence === 'number' ? 
                        (item.confidence > 1 ? item.confidence / 100 : item.confidence) : 0.5,
                    signal_quality: item.signal_quality || 'PROFESSIONAL_GRADE',
                    universe: item.universe || 'CORE',
                    has_position: item.has_position || false
                };
                watchlistEntries.push(this.createExpertWatchlistEntry(normalizedItem, 'COMPREHENSIVE_WATCH', 9));
            });
            
            if (allEvolutionBuys.length > 0) {
                console.log(`🔄 Added ${allEvolutionBuys.length} comprehensive BUY signals from other categories`);
            }
            if (topFallbackWatches.length > 0) {
                console.log(`🔄 Added ${topFallbackWatches.length} comprehensive WATCH signals from other categories`);
            }
            
            // Check for new_opportunities without filtering
            if (position_impact?.new_opportunities) {
                const allNewOpps = position_impact.new_opportunities.filter(item =>
                    !watchlistEntries.some(entry => entry.symbol === item.symbol)
                );
                
                allNewOpps.forEach(item => {
                    watchlistEntries.push(this.createExpertWatchlistEntry(item, 'FALLBACK_OPPORTUNITY', 10));
                });
                console.log(`🔄 Added ${allNewOpps.length} fallback opportunities`);
            }
        }

        console.log(`📊 Final watchlist entries before sort/limit: ${watchlistEntries.length}`);

        // Sort by priority and limit to top 50 for comprehensive coverage (BUY + WATCH)
        const sortedEntries = watchlistEntries
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 50); // Increased from 30 to 50 to accommodate BUY + WATCH signals

        // Use transaction with upsert operations to handle unique constraints
        if (sortedEntries.length > 0) {
            await prisma.$transaction(async (tx) => {
                for (const entry of sortedEntries) {
                    await tx.watchlistStock.upsert({
                        where: { symbol: entry.symbol },
                        update: {
                            currentPrice: entry.currentPrice,
                            currency: entry.currency,
                            market: entry.market,
                            decisionAction: entry.decisionAction,
                            decisionConfidence: entry.decisionConfidence,
                            decisionGrade: entry.decisionGrade,
                            decisionReasoning: entry.decisionReasoning,
                            systemsAgreement: entry.systemsAgreement,
                            systemsAnalyzed: entry.systemsAnalyzed,
                            tier: entry.tier,
                            signalEvolution: entry.signalEvolution,
                            daysInTier: entry.daysInTier,
                            historicalGrades: entry.historicalGrades,
                            tierHistory: entry.tierHistory,
                            strengthTrend: entry.strengthTrend,
                            momentumMultiplier: entry.momentumMultiplier,
                            elitePriority: entry.elitePriority,
                            executionData: entry.executionData,
                            addedAt: entry.addedAt,
                            lastAnalyzed: entry.lastAnalyzed
                        },
                        create: entry
                    });
                }
            });
        }

        console.log(`✅ Expert watchlist updated: ${sortedEntries.length} focused positions`);
        
        return {
            total_entries: sortedEntries.length,
            by_priority: this.groupByPriority(sortedEntries),
            by_tier: this.groupByTier(sortedEntries),
            focus_approach: 'Professional concentrated watchlist'
        };
    }

    /**
     * CREATE EXPERT WATCHLIST ENTRY
     */
    createExpertWatchlistEntry(item, entryType, priority) {
        // Normalize confidence to decimal format (0-1 range)
        let normalizedConfidence = 0;
        if (typeof item.confidence === 'number') {
            normalizedConfidence = item.confidence > 1 ? item.confidence / 100 : item.confidence;
        }
        
        return {
            symbol: item.symbol,
            currentPrice: item.currentPrice || 0,
            decisionAction: item.current_action || item.action,
            decisionGrade: item.current_grade || item.grade,
            decisionConfidence: normalizedConfidence,
            priority,
            status: 'ACTIVE',
            tier: this.mapEntryTypeToTier(entryType), // Use existing tier field
            signalEvolution: this.mapEntryTypeToEvolution(entryType), // Use existing signalEvolution field
            strengthTrend: this.mapEntryTypeToStrength(entryType), // Use existing strengthTrend field
            elitePriority: priority * 100, // Use existing elitePriority field
            sector: this.getSectorFromSymbol(item.symbol), // Map S&P 500 sector
            country: 'US', // S&P 500 stocks are US companies
            exchange: 'NASDAQ', // Default to NASDAQ (could be NYSE for some)
            nextStepSummary: this.generateExpertSummary(item, entryType),
            addedAt: new Date(),
            lastAnalyzedAt: new Date()
        };
    }

    /**
     * MAP ENTRY TYPE TO EXISTING TIER FIELD
     */
    mapEntryTypeToTier(entryType) {
        const tierMap = {
            'CRITICAL_RISK': 'COOLING',
            'INSTITUTIONAL_OPPORTUNITY': 'HOT_BUY',
            'STRENGTHENING_POSITION': 'STRONG_WATCH',
            'CORE_STABLE_BUY': 'DEVELOPING'
        };
        return tierMap[entryType] || 'DEVELOPING';
    }

    /**
     * MAP ENTRY TYPE TO EXISTING SIGNAL EVOLUTION FIELD
     */
    mapEntryTypeToEvolution(entryType) {
        const evolutionMap = {
            'CRITICAL_RISK': 'DETERIORATING',
            'INSTITUTIONAL_OPPORTUNITY': 'NEW_BREAKOUT',
            'STRENGTHENING_POSITION': 'IMPROVING',
            'CORE_STABLE_BUY': 'STABLE_STRONG'
        };
        return evolutionMap[entryType] || 'STABLE_STRONG';
    }

    /**
     * MAP ENTRY TYPE TO EXISTING STRENGTH TREND FIELD
     */
    mapEntryTypeToStrength(entryType) {
        const strengthMap = {
            'CRITICAL_RISK': 'WEAKENING',
            'INSTITUTIONAL_OPPORTUNITY': 'STRENGTHENING',
            'STRENGTHENING_POSITION': 'STRENGTHENING',
            'CORE_STABLE_BUY': 'STABLE'
        };
        return strengthMap[entryType] || 'STABLE';
    }

    /**
     * GENERATE EXPERT SUMMARY FOR WATCHLIST ENTRIES
     */
    generateExpertSummary(item, entryType) {
        const summaryMap = {
            'CRITICAL_RISK': `🚨 URGENT: Position at risk - ${item.risk_level} risk level`,
            'INSTITUTIONAL_OPPORTUNITY': `💎 QUALITY: Institutional grade opportunity - ${Math.round((item.confidence || 0) * 100)}% confidence`,
            'STRENGTHENING_POSITION': `📈 STRENGTH: Existing position getting stronger`,
            'CORE_STABLE_BUY': `🎯 CORE: Stable buy signal in liquid stock`
        };
        
        return summaryMap[entryType] || 'Professional signal tracking';
    }

    /**
     * GENERATE CAPITAL ALLOCATION ADVICE
     */
    async generateCapitalAllocationAdvice(evolutionAnalysis) {
        const { position_impact } = evolutionAnalysis;
        const advice = {
            immediate_actions: [],
            strategic_moves: [],
            risk_management: [],
            opportunity_capture: []
        };

        // Immediate actions for critical risks
        position_impact.critical_risk.forEach(risk => {
            advice.immediate_actions.push({
                action: 'REVIEW_EXIT',
                symbol: risk.symbol,
                reason: `${risk.risk_level} risk - signal degraded to ${risk.current_action}`,
                urgency: 'IMMEDIATE',
                timeframe: '24 hours'
            });
        });

        // Strategic moves for capital reallocation
        position_impact.capital_reallocation.forEach(realloc => {
            advice.strategic_moves.push(realloc);
        });

        // Risk management for moderate risks
        position_impact.moderate_risk.forEach(risk => {
            advice.risk_management.push({
                action: 'MONITOR_CLOSELY',
                symbol: risk.symbol,
                reason: 'Signal showing weakness',
                suggested_action: 'Reduce position size or set tighter stops',
                timeframe: '1 week'
            });
        });

        // Opportunity capture for new institutional grade signals
        position_impact.new_opportunities
            .filter(opp => opp.opportunity_type === 'INSTITUTIONAL_GRADE')
            .forEach(opp => {
                advice.opportunity_capture.push({
                    action: 'CONSIDER_ENTRY',
                    symbol: opp.symbol,
                    quality: opp.signal_quality,
                    recommended_allocation: `${Math.round(opp.recommended_allocation * 100)}%`,
                    confidence: `${Math.round(opp.confidence * 100)}%`,
                    timeframe: '3-5 days'
                });
            });

        return {
            summary: {
                immediate_actions_required: advice.immediate_actions.length,
                strategic_opportunities: advice.strategic_moves.length,
                monitoring_required: advice.risk_management.length,
                new_opportunities: advice.opportunity_capture.length
            },
            professional_advice: advice,
            portfolio_health: evolutionAnalysis.risk_assessment
        };
    }

    /**
     * GROUP WATCHLIST ENTRIES BY PRIORITY
     */
    groupByPriority(entries) {
        const groups = {};
        entries.forEach(entry => {
            const priorityLabel = this.getPriorityLabel(entry.priority);
            if (!groups[priorityLabel]) groups[priorityLabel] = 0;
            groups[priorityLabel]++;
        });
        return groups;
    }

    /**
     * GET PRIORITY LABEL FOR GROUPING
     */
    getPriorityLabel(priority) {
        const labels = {
            1: 'CRITICAL',
            2: 'HIGH',
            3: 'MEDIUM',
            4: 'LOW'
        };
        return labels[priority] || 'UNKNOWN';
    }

    /**
     * GROUP WATCHLIST ENTRIES BY TIER
     */
    groupByTier(entries) {
        const groups = {};
        entries.forEach(entry => {
            const tier = entry.tier || 'UNKNOWN';
            if (!groups[tier]) groups[tier] = 0;
            groups[tier]++;
        });
        return groups;
    }

    /**
     * GET SECTOR FROM S&P 500 SYMBOL (Basic mapping for major companies)
     */
    getSectorFromSymbol(symbol) {
        const sectorMap = {
            // Technology
            'NVDA': 'TECHNOLOGY', 'MSFT': 'TECHNOLOGY', 'AAPL': 'TECHNOLOGY', 'GOOGL': 'TECHNOLOGY', 'GOOG': 'TECHNOLOGY',
            'META': 'TECHNOLOGY', 'TSLA': 'TECHNOLOGY', 'NFLX': 'TECHNOLOGY', 'CRM': 'TECHNOLOGY', 'ADBE': 'TECHNOLOGY',
            'AMD': 'TECHNOLOGY', 'CSCO': 'TECHNOLOGY', 'IBM': 'TECHNOLOGY', 'TXN': 'TECHNOLOGY', 'QCOM': 'TECHNOLOGY',
            'NOW': 'TECHNOLOGY', 'INTU': 'TECHNOLOGY', 'AMAT': 'TECHNOLOGY', 'LRCX': 'TECHNOLOGY', 'ADI': 'TECHNOLOGY',
            'MU': 'TECHNOLOGY', 'PANW': 'TECHNOLOGY', 'CDNS': 'TECHNOLOGY', 'SNPS': 'TECHNOLOGY', 'NXPI': 'TECHNOLOGY',
            
            // Healthcare & Pharmaceuticals
            'LLY': 'HEALTHCARE', 'UNH': 'HEALTHCARE', 'JNJ': 'HEALTHCARE', 'ABBV': 'HEALTHCARE', 'TMO': 'HEALTHCARE',
            'ABT': 'HEALTHCARE', 'MRK': 'HEALTHCARE', 'DHR': 'HEALTHCARE', 'ISRG': 'HEALTHCARE', 'AMGN': 'HEALTHCARE',
            'PFE': 'HEALTHCARE', 'BSX': 'HEALTHCARE', 'VRTX': 'HEALTHCARE', 'MDT': 'HEALTHCARE', 'REGN': 'HEALTHCARE',
            'GILD': 'HEALTHCARE', 'ZTS': 'HEALTHCARE', 'BDX': 'HEALTHCARE', 'BIIB': 'HEALTHCARE', 'DXCM': 'HEALTHCARE',
            
            // Financial Services
            'JPM': 'FINANCIALS', 'V': 'FINANCIALS', 'MA': 'FINANCIALS', 'BAC': 'FINANCIALS', 'AXP': 'FINANCIALS',
            'BLK': 'FINANCIALS', 'MS': 'FINANCIALS', 'SCHW': 'FINANCIALS', 'KKR': 'FINANCIALS', 'AON': 'FINANCIALS',
            'ICE': 'FINANCIALS', 'MMC': 'FINANCIALS', 'USB': 'FINANCIALS', 'MCO': 'FINANCIALS', 'CME': 'FINANCIALS',
            'TFC': 'FINANCIALS', 'PNC': 'FINANCIALS', 'AJG': 'FINANCIALS', 'SPGI': 'FINANCIALS', 'CB': 'FINANCIALS',
            
            // Consumer & Retail
            'AMZN': 'CONSUMER', 'COST': 'CONSUMER', 'HD': 'CONSUMER', 'PG': 'CONSUMER', 'KO': 'CONSUMER',
            'PEP': 'CONSUMER', 'WMT': 'CONSUMER', 'TJX': 'CONSUMER', 'LOW': 'CONSUMER', 'BKNG': 'CONSUMER',
            'CMG': 'CONSUMER', 'PYPL': 'CONSUMER', 'SHW': 'CONSUMER', 'MAR': 'CONSUMER', 'ORLY': 'CONSUMER',
            'HCA': 'CONSUMER', 'ABNB': 'CONSUMER', 'HLT': 'CONSUMER', 'ROST': 'CONSUMER', 'YUM': 'CONSUMER',
            
            // Energy
            'XOM': 'ENERGY', 'CVX': 'ENERGY', 'COP': 'ENERGY', 'SLB': 'ENERGY', 'EOG': 'ENERGY',
            'PSX': 'ENERGY', 'KMI': 'ENERGY', 'OKE': 'ENERGY', 'FANG': 'ENERGY', 'DVN': 'ENERGY',
            
            // Industrials
            'CAT': 'INDUSTRIALS', 'GE': 'INDUSTRIALS', 'RTX': 'INDUSTRIALS', 'HON': 'INDUSTRIALS', 'ETN': 'INDUSTRIALS',
            'APD': 'INDUSTRIALS', 'ITW': 'INDUSTRIALS', 'EMR': 'INDUSTRIALS', 'WM': 'INDUSTRIALS', 'CSX': 'INDUSTRIALS',
            'GM': 'INDUSTRIALS', 'MSI': 'INDUSTRIALS', 'APH': 'INDUSTRIALS', 'CARR': 'INDUSTRIALS', 'ECL': 'INDUSTRIALS',
            
            // Utilities & Infrastructure
            'NEE': 'UTILITIES', 'SO': 'UTILITIES', 'DUK': 'UTILITIES', 'PLD': 'UTILITIES', 'EXC': 'UTILITIES',
            'AEP': 'UTILITIES', 'EIX': 'UTILITIES', 'PEG': 'UTILITIES', 'AWK': 'UTILITIES', 'WEC': 'UTILITIES'
        };
        
        return sectorMap[symbol] || 'OTHER';
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

module.exports = WatchlistManager;
