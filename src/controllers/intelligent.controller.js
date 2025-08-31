/**
 * Intelligent System Controller
 * Master orchestration controller for AI enhancement system
 * 
 * Coordinates all AI enhancement phases and provides unified API
 * Integrates seamlessly with your existing expert trading system
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2025
 */

const AIPluginCore = require('../intelligent/AIPluginCore');
const { SYSTEM_IDS } = require('../utils/systemConstants');

class IntelligentController {
    constructor() {
        // Initialize AI plugin core (this already initializes all phases)
        this.aiCore = new AIPluginCore();

        // Access the phases from the core
        this.narrative = this.aiCore.services?.narrative;
        this.learning = this.aiCore.services?.learning;
        this.monitoring = this.aiCore.services?.monitoring;

        console.log('🧠 Intelligent Controller initialized with all phases');
    }

    /**
     * Master enhancement function - enhances your existing trade analysis
     * This is the main integration point with your sophisticated system
     */
    async enhanceAnalysis(req, res) {
        try {
            const {
                symbol,
                existingAnalysis = null
            } = req.body;

            // Validate required fields
            if (!symbol) {
                return res.status(400).json({
                    error: 'Missing required fields: symbol',
                    required: ['symbol']
                });
            }

            // Step 1: Get sophisticated system analysis if not provided
            let analysisResult = existingAnalysis;
            if (!analysisResult) {
                analysisResult = await this.getSophisticatedAnalysis(symbol);
            }

            console.log(`🔧 sophisticated analysis for ${symbol}: ${JSON.stringify(analysisResult)}`);

            // Phase 1: Generate market narrative with circuit breaker protection
            const narrative = await this.aiCore.executeWithFallback(
                'narrative',
                () => this.narrative.analyzeMarketStory(symbol, analysisResult),
                {
                    fallback: this.createFallbackNarrative(analysisResult, symbol),
                    timeout: 20000
                }
            );

            // Phase 2: Get learning insights about this symbol
            const learningInsights = await this.aiCore.executeWithFallback(
                'learning',
                () => this.learning.getSymbolInsights(symbol, {
                    userId,
                    sophisticatedContext: sophisticatedAnalysis // Include sophisticated analysis
                }),
                {
                    fallback: this.createFallbackLearning(symbol),
                    timeout: 15000
                }
            );

            // AI Enhancement Logic: Improve grade based on narrative + learning + sophisticated analysis
            const enhancedGrade = this.calculateEnhancedGrade(
                grade,
                confidence,
                narrative,
                learningInsights,
                sophisticatedAnalysis // Include sophisticated analysis in enhancement
            );

            // Calculate AI confidence boost using sophisticated analysis
            const aiConfidence = this.calculateAIConfidence(
                confidence,
                narrative,
                learningInsights,
                sophisticatedAnalysis
            );

            // Generate enhanced recommendation using all available data
            const recommendation = this.generateEnhancedRecommendation(
                action,
                enhancedGrade,
                aiConfidence,
                narrative,
                sophisticatedAnalysis
            );

            // Prepare enhanced response with sophisticated system integration
            const enhancedAnalysis = {
                ...baseAnalysis,
                enhanced: true,
                enhancedGrade,
                gradeImprovement: this.calculateGradeImprovement(grade, enhancedGrade),
                aiConfidence,
                confidenceBoost: aiConfidence - confidence,
                narrative: narrative.mainStory || narrative.error || 'Analysis completed',
                keyFactors: narrative.keyFactors || [],
                riskFactors: narrative.riskFactors || [],
                sentiment: narrative.sentiment || 'NEUTRAL',
                learningInsights: {
                    hasHistory: learningInsights.hasHistory || false,
                    winRate: learningInsights.winRate || 0,
                    recommendations: learningInsights.recommendations || []
                },
                sophisticatedSystemInsights: this.extractSophisticatedInsights(sophisticatedAnalysis),
                recommendation,
                enhancementSource: 'AI_ANALYSIS_WITH_SOPHISTICATED_SYSTEM',
                requestId,
                processingTime: Date.now() - new Date(baseAnalysis.timestamp).getTime()
            };

            // Track this enhancement for monitoring
            this.trackEnhancement(enhancedAnalysis);

            res.json(enhancedAnalysis);

        } catch (error) {
            console.error('❌ Enhancement analysis failed:', error);

            // Graceful fallback - return base analysis without enhancement
            res.json({
                symbol: req.body.symbol,
                action: req.body.action,
                originalGrade: req.body.grade,
                enhancedGrade: req.body.grade, // No change
                enhanced: false,
                error: 'AI enhancement temporarily unavailable',
                fallback: true,
                timestamp: new Date()
            });
        }
    }

    /**
     * Enhanced analysis that directly integrates with your sophisticated system
     * This is the recommended way to use AI enhancement
     */
    async enhanceWithSophisticatedSystem(req, res) {
        try {
            const {
                symbol,
                systems = ['TRIPLE_SCREEN', 'MINERVINI_SEPA'], // Default to best systems
                userId = null,
                requestId = null
            } = req.body;

            console.log(`🚀 Running complete AI-enhanced sophisticated analysis for ${symbol}`);

            if (!symbol) {
                return res.status(400).json({
                    error: 'Symbol is required',
                    required: ['symbol']
                });
            }

            // Step 1: Get comprehensive sophisticated system analysis
            console.log(`🔧 Phase 1: Running sophisticated system analysis...`);
            const sophisticatedAnalysis = await this.getSophisticatedAnalysis(symbol, systems[0]);

            if (!sophisticatedAnalysis.success) {
                return res.status(500).json({
                    error: 'Sophisticated system analysis failed',
                    details: sophisticatedAnalysis.error
                });
            }

            // Extract key data from sophisticated analysis
            const insights = this.extractSophisticatedInsights(sophisticatedAnalysis);
            const consensus = insights.consensus;

            // Step 2: Use sophisticated analysis results as input to AI enhancement
            console.log(`🧠 Phase 2: Enhancing with AI intelligence...`);
            const enhancementRequest = {
                body: {
                    symbol,
                    action: consensus.decision,
                    grade: consensus.grade,
                    confidence: consensus.confidence,
                    userId,
                    requestId,
                    existingAnalysis: sophisticatedAnalysis
                }
            };

            // Create a mock response object to capture the enhancement
            let enhancementResult = null;
            const mockRes = {
                json: (data) => {
                    enhancementResult = data;
                },
                status: () => mockRes
            };

            // Run AI enhancement
            await this.enhanceAnalysis(enhancementRequest, mockRes);

            // Step 3: Combine results into comprehensive response
            const completeAnalysis = {
                symbol,
                timestamp: new Date(),
                requestId,

                // Original sophisticated system results
                sophisticatedSystem: {
                    success: sophisticatedAnalysis.success,
                    consensus: insights.consensus,
                    systems: insights.systems,
                    gateAnalysis: insights.gateAnalysis,
                    qualityScore: insights.qualityScore
                },

                // AI enhancement results
                aiEnhancement: enhancementResult,

                // Final recommendation combining both
                finalRecommendation: this.generateFinalRecommendation(
                    insights,
                    enhancementResult
                ),

                // Processing summary
                processing: {
                    sophisticatedSystemTime: sophisticatedAnalysis.timestamp,
                    aiEnhancementTime: enhancementResult?.processingTime || 0,
                    totalSystems: Object.keys(insights.systems).length,
                    enhancementApplied: enhancementResult?.enhanced || false
                }
            };

            res.json(completeAnalysis);

        } catch (error) {
            console.error('❌ Complete AI-enhanced analysis failed:', error);
            res.status(500).json({
                error: 'Complete analysis failed',
                message: error.message,
                timestamp: new Date()
            });
        }
    }

    /**
     * Generate final recommendation combining sophisticated system + AI
     */
    generateFinalRecommendation(sophisticatedInsights, aiEnhancement) {
        try {
            const sophisticatedDecision = sophisticatedInsights.consensus.decision;
            const sophisticatedGrade = sophisticatedInsights.consensus.grade;
            const sophisticatedConfidence = sophisticatedInsights.consensus.confidence;

            const aiGrade = aiEnhancement.enhancedGrade || sophisticatedGrade;
            const aiConfidence = aiEnhancement.aiConfidence || sophisticatedConfidence;
            const aiSentiment = aiEnhancement.sentiment || 'NEUTRAL';

            // Calculate agreement between systems
            const gradeImprovement = aiEnhancement.gradeImprovement || '=';
            const confidenceBoost = aiEnhancement.confidenceBoost || 0;

            let recommendation = `${sophisticatedDecision} ${aiGrade}`;
            let reasoning = [];

            // Add sophisticated system reasoning
            reasoning.push(`Sophisticated system: ${sophisticatedDecision} ${sophisticatedGrade} (${Math.round(sophisticatedConfidence * 100)}% confidence)`);

            // Add AI enhancement reasoning
            if (aiEnhancement.enhanced) {
                reasoning.push(`AI enhancement: Grade ${gradeImprovement === '+' ? 'improved' : gradeImprovement === '-' ? 'downgraded' : 'confirmed'}`);
                reasoning.push(`Market sentiment: ${aiSentiment}`);

                if (confidenceBoost > 0.05) {
                    reasoning.push(`AI increased confidence by ${Math.round(confidenceBoost * 100)}%`);
                } else if (confidenceBoost < -0.05) {
                    reasoning.push(`AI decreased confidence by ${Math.round(Math.abs(confidenceBoost) * 100)}%`);
                }
            }

            // Add gate analysis
            if (sophisticatedInsights.gateAnalysis.total > 0) {
                const passRate = Math.round(sophisticatedInsights.gateAnalysis.passRate * 100);
                reasoning.push(`Gate analysis: ${sophisticatedInsights.gateAnalysis.passed}/${sophisticatedInsights.gateAnalysis.total} passed (${passRate}%)`);
            }

            return {
                action: sophisticatedDecision,
                grade: aiGrade,
                confidence: aiConfidence,
                recommendation,
                reasoning,
                strength: aiConfidence > 0.8 ? 'STRONG' : aiConfidence > 0.6 ? 'MODERATE' : 'WEAK',
                agreement: gradeImprovement === '=' ? 'HIGH' : gradeImprovement === '+' ? 'AI_BULLISH' : 'AI_BEARISH'
            };

        } catch (error) {
            console.error('⚠️ Final recommendation generation error:', error);
            return {
                action: 'HOLD',
                grade: 'C',
                confidence: 0.5,
                recommendation: 'Analysis incomplete - manual review recommended',
                reasoning: ['Error in recommendation generation'],
                strength: 'WEAK',
                agreement: 'UNKNOWN'
            };
        }
    }
    /**
     * Record trade outcome for learning
     */
    async recordLearning(req, res) {
        try {
            const result = await this.learning.recordTradeOutcome(req.body);
            res.json(result);

        } catch (error) {
            console.error('❌ Record learning failed:', error);
            res.status(500).json({ error: 'Failed to record trade outcome' });
        }
    }

    /**
     * Get performance monitoring report
     */
    async getPerformanceReport(req, res) {
        try {
            const options = {
                symbol: req.query.symbol,
                userId: req.query.userId,
                days: parseInt(req.query.days) || 30,
                includeDetailed: req.query.detailed === 'true'
            };

            const report = await this.monitoring.getPerformanceReport(options);
            res.json(report);

        } catch (error) {
            console.error('❌ Performance report failed:', error);
            res.status(500).json({ error: 'Performance report failed' });
        }
    }

    /**
     * Get system health status
     */
    async getSystemHealth(req, res) {
        try {
            const {
                includeTests = false,
                includeMetrics = false,
                clearCache = false,
                testSymbol = 'AAPL'
            } = req?.query || {};

            // Handle cache clearing if requested
            if (clearCache === 'true') {
                this.narrative.cache.clear();
                this.learning.cache.clear();
                console.log('🧹 AI system caches cleared');
            }

            const health = {
                status: 'HEALTHY',
                timestamp: new Date(),
                aiCore: await this.aiCore.getSystemHealth(),
                phases: {
                    narrative: await this.narrative.healthCheck(),
                    learning: await this.learning.healthCheck(),
                    monitoring: await this.monitoring.healthCheck()
                },
                circuitBreaker: {
                    state: this.aiCore.circuitBreaker.state,
                    isOpen: this.aiCore.circuitBreaker.state === 'OPEN',
                    failures: this.aiCore.circuitBreaker.failures,
                    lastFailure: this.aiCore.circuitBreaker.lastFailure
                }
            };

            // Include detailed metrics if requested
            if (includeMetrics === 'true') {
                health.metrics = {
                    aiCore: this.aiCore.metrics,
                    cache: {
                        narrative: this.narrative.cache.size,
                        learning: this.learning.cache.size
                    },
                    system: {
                        uptime: process.uptime(),
                        memory: process.memoryUsage(),
                        nodeVersion: process.version
                    }
                };
            }

            // Include comprehensive tests if requested
            if (includeTests === 'true') {
                console.log(`🧪 Running comprehensive tests with ${testSymbol}`);

                const tests = await Promise.allSettled([
                    this.narrative.testNarrativeService(testSymbol),
                    this.learning.testLearningService(testSymbol),
                    this.monitoring.healthCheck()
                ]);

                health.tests = {
                    symbol: testSymbol,
                    results: {
                        narrative: tests[0].status === 'fulfilled' ? tests[0].value : { error: tests[0].reason?.message },
                        learning: tests[1].status === 'fulfilled' ? tests[1].value : { error: tests[1].reason?.message },
                        monitoring: tests[2].status === 'fulfilled' ? tests[2].value : { error: tests[2].reason?.message }
                    },
                    overall: tests.every(t => t.status === 'fulfilled') ? 'PASSED' : 'PARTIAL'
                };
            }

            // Add cache clearing confirmation if it was requested
            if (clearCache === 'true') {
                health.cacheCleared = true;
                health.message = 'System health checked and caches cleared';
            }

            // Determine overall status
            const phaseStatuses = Object.values(health.phases).map(p => p.status);
            if (phaseStatuses.some(status => status === 'ERROR')) {
                health.status = 'DEGRADED';
            }

            if (health.tests && health.tests.overall === 'PARTIAL') {
                health.status = 'DEGRADED';
            }

            if (res) {
                res.json(health);
            } else {
                return health; // Called internally
            }

        } catch (error) {
            console.error('❌ System health check failed:', error);
            const errorHealth = {
                status: 'ERROR',
                error: error.message,
                timestamp: new Date()
            };

            if (res) {
                res.status(503).json(errorHealth);
            } else {
                return errorHealth;
            }
        }
    }

    // ==========================================
    // SOPHISTICATED SYSTEM INTEGRATION
    // ==========================================

    /**
     * Get analysis from your sophisticated trading system
     */
    async getSophisticatedAnalysis(symbol) {
        try {
            
            // Import your existing signal analysis controller
            const { TradingSystemController } = require('./signal-analysis.controller');
            const tradingController = new TradingSystemController();

            const systems = [SYSTEM_IDS.TRIPLE_SCREEN, SYSTEM_IDS.MINERVINI_SEPA, SYSTEM_IDS.CAN_SLIM_CUP_HANDLE, SYSTEM_IDS.RSI_MEAN_REVERSION, SYSTEM_IDS.MACD_DIVERGENCE, SYSTEM_IDS.SUPERTREND_WEEKLY]; // Default to all systems

            // Get comprehensive analysis using your sophisticated system
            const analysisResult = await tradingController.getStockAnalysis(systems, [symbol]);
            console.log(`🔧 Sophisticated analysis result for ${symbol}:`, analysisResult);
            if (analysisResult.success && analysisResult.results && analysisResult.results.length > 0) {
                const symbolAnalysis = analysisResult.results[0];
                // Ensure the symbol is properly set
                if (symbolAnalysis) {
                    symbolAnalysis.symbol = symbol;
                    return symbolAnalysis;
                }
            } 
            
            console.warn(`⚠️ Sophisticated analysis failed for ${symbol}:`, analysisResult.error || 'No results returned');
            return this.createFallbackSophisticatedAnalysis(symbol);

        } catch (error) {
            console.error(`❌ Failed to get sophisticated analysis for ${symbol}:`, error);
            return this.createFallbackSophisticatedAnalysis(symbol);
        }
    }

    /**
     * Extract key insights from sophisticated system analysis
     */
    extractSophisticatedInsights(sophisticatedAnalysis) {
        if (!sophisticatedAnalysis || !sophisticatedAnalysis.success) {
            return {
                available: false,
                reason: 'Sophisticated analysis unavailable'
            };
        }

        const { systems, consensus, gateAnalysis } = sophisticatedAnalysis;

        // Extract consensus decision
        const consensusDecision = consensus?.finalDecision || 'HOLD';
        const consensusConfidence = consensus?.confidence || 0.5;
        const consensusGrade = consensus?.grade || 'C';

        // Extract system decisions
        const systemDecisions = {};
        if (systems) {
            Object.keys(systems).forEach(systemId => {
                const system = systems[systemId];
                systemDecisions[systemId] = {
                    decision: system.decision || 'HOLD',
                    confidence: system.confidence || 0.5,
                    grade: system.grade || 'C'
                };
            });
        }

        // Extract gate analysis insights
        const gateResults = gateAnalysis?.gates || {};
        const gatesPassed = Object.values(gateResults).filter(gate => gate.pass).length;
        const totalGates = Object.keys(gateResults).length;
        const gatePassRate = totalGates > 0 ? gatesPassed / totalGates : 0;

        return {
            available: true,
            consensus: {
                decision: consensusDecision,
                confidence: consensusConfidence,
                grade: consensusGrade
            },
            systems: systemDecisions,
            gateAnalysis: {
                passRate: gatePassRate,
                passed: gatesPassed,
                total: totalGates,
                results: gateResults
            },
            qualityScore: this.calculateSophisticatedQualityScore(sophisticatedAnalysis),
            timestamp: sophisticatedAnalysis.timestamp
        };
    }

    /**
     * Calculate quality score from sophisticated analysis
     */
    calculateSophisticatedQualityScore(analysis) {
        try {
            const { consensus, gateAnalysis } = analysis;

            let score = 0;

            // Consensus confidence weight (40%)
            if (consensus?.confidence) {
                score += consensus.confidence * 0.4;
            }

            // Gate pass rate weight (30%)
            if (gateAnalysis?.gates) {
                const gates = Object.values(gateAnalysis.gates);
                const passRate = gates.filter(g => g.pass).length / gates.length;
                score += passRate * 0.3;
            }

            // System agreement weight (30%)
            if (analysis.systems) {
                const systemDecisions = Object.values(analysis.systems).map(s => s.decision);
                const buyDecisions = systemDecisions.filter(d => d === 'BUY').length;
                const agreement = buyDecisions / systemDecisions.length;
                score += agreement * 0.3;
            }

            return Math.round(score * 100) / 100; // Round to 2 decimal places

        } catch (error) {
            console.error('⚠️ Quality score calculation error:', error);
            return 0.5; // Default neutral score
        }
    }

    /**
     * Create fallback sophisticated analysis
     */
    createFallbackSophisticatedAnalysis(symbol) {
        return {
            success: false,
            symbol,
            error: 'Sophisticated system analysis unavailable',
            fallback: true,
            decision: {
                action: 'HOLD',
                confidence: 0.5
            },
            systems: {},
            consensus: {
                finalDecision: 'HOLD',
                confidence: 0.5,
                grade: 'C'
            },
            aiSignals: [],
            source: 'FALLBACK'
        };
    }

    // ==========================================
    // HELPER METHODS FOR GRADE ENHANCEMENT
    // ==========================================

    /**
     * Calculate enhanced grade based on AI insights + sophisticated system
     */
    calculateEnhancedGrade(originalGrade, confidence, narrative, learning, sophisticatedAnalysis = null) {
        try {
            let gradeBoost = 0;

            // Narrative-based boost (20% weight)
            if (narrative.sentiment === 'POSITIVE' && narrative.confidence > 0.7) {
                gradeBoost += 0.5; // Half grade boost
            } else if (narrative.sentiment === 'NEGATIVE' && narrative.confidence > 0.7) {
                gradeBoost -= 0.5; // Half grade penalty
            }

            // Learning-based boost (20% weight)
            if (learning.hasHistory && learning.winRate > 70) {
                gradeBoost += 0.3;
            } else if (learning.hasHistory && learning.winRate < 40) {
                gradeBoost -= 0.3;
            }

            // Sophisticated system boost (60% weight) - MOST IMPORTANT
            if (sophisticatedAnalysis && sophisticatedAnalysis.success) {
                const insights = this.extractSophisticatedInsights(sophisticatedAnalysis);

                if (insights.available) {
                    // Consensus decision boost
                    if (insights.consensus.decision === 'BUY' && insights.consensus.confidence > 0.7) {
                        gradeBoost += 0.8; // Strong boost for BUY consensus
                    } else if (insights.consensus.decision === 'SELL' && insights.consensus.confidence > 0.7) {
                        gradeBoost -= 0.8; // Strong penalty for SELL consensus
                    }

                    // Gate analysis boost
                    if (insights.gateAnalysis.passRate > 0.8) {
                        gradeBoost += 0.3; // High gate pass rate
                    } else if (insights.gateAnalysis.passRate < 0.4) {
                        gradeBoost -= 0.3; // Low gate pass rate
                    }

                    // Quality score adjustment
                    const qualityAdjustment = (insights.qualityScore - 0.5) * 0.4;
                    gradeBoost += qualityAdjustment;
                }
            }

            // Risk factor adjustments
            if (narrative.riskFactors && narrative.riskFactors.length > 2) {
                gradeBoost -= 0.2;
            }

            // Convert grade to number, apply boost, convert back
            const gradeNumber = this.gradeToNumber(originalGrade);
            const enhancedNumber = Math.max(0, Math.min(4.3, gradeNumber + gradeBoost));

            return this.numberToGrade(enhancedNumber);

        } catch (error) {
            console.error('⚠️ Grade calculation error:', error);
            return originalGrade; // Fallback to original
        }
    }

    /**
     * Calculate AI confidence boost including sophisticated analysis
     */
    calculateAIConfidence(baseConfidence, narrative, learning, sophisticatedAnalysis = null) {
        try {
            let confidenceBoost = 0;

            // Narrative confidence factor (20% weight)
            if (narrative.confidence) {
                confidenceBoost += (narrative.confidence - 0.5) * 0.1;
            }

            // Learning confidence factor (20% weight)
            if (learning.hasHistory && learning.tradeCount >= 10) {
                if (learning.winRate > 60) {
                    confidenceBoost += 0.05;
                } else if (learning.winRate < 40) {
                    confidenceBoost -= 0.05;
                }
            }

            // Sophisticated system confidence factor (60% weight) - MOST IMPORTANT
            if (sophisticatedAnalysis && sophisticatedAnalysis.success) {
                const insights = this.extractSophisticatedInsights(sophisticatedAnalysis);

                if (insights.available) {
                    // Use sophisticated system confidence directly
                    const sophisticatedConfidence = insights.consensus.confidence || 0.5;
                    confidenceBoost += (sophisticatedConfidence - 0.5) * 0.3;

                    // Gate analysis confidence boost
                    if (insights.gateAnalysis.passRate > 0.8) {
                        confidenceBoost += 0.1; // High confidence when gates pass
                    } else if (insights.gateAnalysis.passRate < 0.4) {
                        confidenceBoost -= 0.1; // Lower confidence when gates fail
                    }

                    // Quality score confidence adjustment
                    confidenceBoost += (insights.qualityScore - 0.5) * 0.1;
                }
            }

            // Ensure confidence stays within bounds
            return Math.max(0.1, Math.min(0.95, baseConfidence + confidenceBoost));

        } catch (error) {
            console.error('⚠️ Confidence calculation error:', error);
            return baseConfidence;
        }
    }

    /**
     * Generate enhanced recommendation including sophisticated system insights
     */
    generateEnhancedRecommendation(action, enhancedGrade, aiConfidence, narrative, sophisticatedAnalysis = null) {
        const gradeQuality = this.getGradeQuality(enhancedGrade);
        const confidenceLevel = aiConfidence > 0.8 ? 'high' : aiConfidence > 0.6 ? 'medium' : 'moderate';

        let recommendation = `${action} ${enhancedGrade} - ${gradeQuality} opportunity with ${confidenceLevel} confidence`;

        // Add sophisticated system insights
        if (sophisticatedAnalysis && sophisticatedAnalysis.success) {
            const insights = this.extractSophisticatedInsights(sophisticatedAnalysis);

            if (insights.available) {
                const consensus = insights.consensus.decision;
                const gatePass = insights.gateAnalysis.passRate;

                if (consensus === 'BUY' && gatePass > 0.7) {
                    recommendation += '. Sophisticated system strongly supports this position.';
                } else if (consensus === 'SELL' || gatePass < 0.3) {
                    recommendation += '. Caution: Sophisticated system shows concerns.';
                } else {
                    recommendation += '. Mixed signals from sophisticated system - use smaller position size.';
                }
            }
        }

        // Add narrative context
        if (narrative.sentiment === 'POSITIVE') {
            recommendation += ' Market narrative supports the position.';
        } else if (narrative.sentiment === 'NEGATIVE') {
            recommendation += ' Consider market headwinds in position sizing.';
        }

        return recommendation;
    }

    // ==========================================
    // UTILITY METHODS
    // ==========================================

    gradeToNumber(grade) {
        const gradeMap = { 'F': 0, 'D': 1, 'C': 2, 'B': 3, 'A': 4 };
        const baseLetter = grade.charAt(0);
        const modifier = grade.includes('+') ? 0.3 : grade.includes('-') ? -0.3 : 0;
        return (gradeMap[baseLetter] || 2) + modifier;
    }

    numberToGrade(number) {
        const gradeMap = ['F', 'D', 'C', 'B', 'A'];
        const baseIndex = Math.floor(number);
        const fraction = number - baseIndex;

        let grade = gradeMap[Math.min(baseIndex, 4)] || 'C';

        if (fraction >= 0.2 && fraction < 0.7) {
            // No modifier
        } else if (fraction >= 0.7) {
            grade += '+';
        } else if (fraction < 0.2 && baseIndex > 0) {
            grade += '-';
        }

        return grade;
    }

    calculateGradeImprovement(original, enhanced) {
        const originalNum = this.gradeToNumber(original);
        const enhancedNum = this.gradeToNumber(enhanced);
        const diff = enhancedNum - originalNum;

        if (diff > 0.1) return '+';
        if (diff < -0.1) return '-';
        return '=';
    }

    getGradeQuality(grade) {
        const gradeNum = this.gradeToNumber(grade);
        if (gradeNum >= 3.7) return 'excellent';
        if (gradeNum >= 3.0) return 'good';
        if (gradeNum >= 2.0) return 'fair';
        return 'weak';
    }

    // ==========================================
    // FALLBACK METHODS
    // ==========================================

    createFallbackNarrative(symbolAnalysisResult, symbol = 'UNKNOWN') {
        // Handle undefined or empty analysis result
        const resultSymbol = symbolAnalysisResult?.symbol || symbol;
        const action = symbolAnalysisResult?.decision?.action || 'HOLD';
        
        return {
            symbol: resultSymbol,
            sentiment: 'NEUTRAL',
            confidence: 0.5,
            mainStory: `Technical analysis primary for ${resultSymbol} ${action} position`,
            keyFactors: ['Technical indicators active'],
            riskFactors: ['AI analysis unavailable'],
            tradingImplications: 'Rely on technical analysis',
            source: 'FALLBACK'
        };
    }

    createFallbackLearning(symbol) {
        return {
            symbol,
            hasHistory: false,
            tradeCount: 0,
            winRate: 50,
            recommendations: [{
                message: 'Learning system temporarily unavailable',
                confidence: 0.3,
                priority: 'LOW'
            }],
            source: 'FALLBACK'
        };
    }

    // ==========================================
    // MONITORING & TRACKING
    // ==========================================

    trackEnhancement(enhancedAnalysis) {
        try {
            // Track this enhancement for real-time monitoring
            this.monitoring.trackRealTimePerformance({
                symbol: enhancedAnalysis.symbol,
                outcome: 'PENDING', // Will be updated when trade completes
                aiEnhanced: true,
                confidence: enhancedAnalysis.aiConfidence,
                grade: enhancedAnalysis.enhancedGrade
            });

            // Update AI core metrics
            this.aiCore.recordSuccess('enhancement');

        } catch (error) {
            console.error('⚠️ Enhancement tracking failed:', error);
        }
    }
}

module.exports = IntelligentController;
