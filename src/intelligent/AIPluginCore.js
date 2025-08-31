/**
 * AI Plugin Core System
 * Central orchestrator for all AI trading intelligence phases
 * 
 * Provides plugin architecture that can be completely disabled
 * without affecting the base trading system
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 1.0.0
 * Last Updated: 2025
 */

const IntelligentNarrative = require('./IntelligentNarrative');
const IntelligentLearning = require('./IntelligentLearning');
const IntelligentMonitoring = require('./IntelligentMonitoring');

class AIPluginCore {
    constructor(config = {}) {
        this.enabled = config.enabled !== false; // Default enabled
        this.phases = {
            narrative: config.phases?.narrative !== false,
            learning: config.phases?.learning !== false,
            monitoring: config.phases?.monitoring !== false
        };
        
        this.costLimits = {
            daily: config.costLimits?.daily || 50,
            monthly: config.costLimits?.monthly || 200
        };
        
        this.circuitBreaker = {
            failures: 0,
            threshold: 3,
            timeout: 300000, // 5 minutes
            lastFailure: null,
            state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
        };
        
        // Initialize phases if enabled
        if (this.enabled) {
            this.services = {
                narrative: new IntelligentNarrative(),
                learning: new IntelligentLearning(),
                monitoring: new IntelligentMonitoring()
            };
            console.log('🧠 AI Plugin Core initialized - ALL PHASES ACTIVE');
        } else {
            this.services = null;
            console.log('🚫 AI Plugin Core initialized - DISABLED MODE');
        }
        
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            averageResponseTime: 0,
            lastError: null
        };
    }

    /**
     * Initialize the AI Plugin Core system
     * This is an optional method for explicit initialization
     * The system auto-initializes on construction but this can be used for validation
     * 
     * @returns {Promise<Object>} Initialization status
     */
    async initialize() {
        try {
            const health = await this.getSystemHealth();
            return {
                success: true,
                status: health.status,
                services: health.services,
                message: 'AI Plugin Core initialized successfully'
            };
        } catch (error) {
            return {
                success: false,
                status: 'ERROR',
                error: error.message,
                message: 'AI Plugin Core initialization failed'
            };
        }
    }

    /**
     * Convenience method with trade-specific context
     * Maps to enhanceAnalysis with appropriate options
     * 
     * @param {Object} tradeContext - Trade decision context
     * @returns {Object} Enhanced trade decision
     */
    async enhanceTradeDecision(tradeContext) {
        const baseAnalysis = {
            symbol: tradeContext.symbol,
            currentPrice: tradeContext.currentPrice,
            decision: tradeContext.action,
            finalDecision: {
                signal: tradeContext.action,
                confidence: tradeContext.systemRecommendation?.confidence || 0.5
            },
            signalQuality: {
                grade: tradeContext.systemRecommendation?.grade || 'C'
            },
            reasoning: tradeContext.systemRecommendation?.reasoning || 'System recommendation'
        };

        const options = {
            phase: 'all',
            userId: tradeContext.userId,
            includeNarrative: true,
            includeLearning: true
        };

        const enhancement = await this.enhanceAnalysis(baseAnalysis, options);
        
        // Map back to trade decision format
        return {
            enhancedGrade: enhancement.enhancedGrade,
            confidenceAdjustment: enhancement.enhancedConfidence - baseAnalysis.finalDecision.confidence,
            narrativeInsights: enhancement.enhancements?.narrative ? [enhancement.enhancements.narrative] : [],
            learningInsights: enhancement.enhancements?.learning ? [enhancement.enhancements.learning] : [],
            recommendation: {
                shouldTrade: enhancement.recommendation.action !== 'HOLD',
                action: enhancement.recommendation.action,
                riskLevel: enhancement.enhancements?.narrative?.confidence > 0.7 ? 'MODERATE' : 'HIGH',
                confidence: enhancement.enhancedConfidence
            },
            source: enhancement.metrics.source,
            processingTime: enhancement.metrics.processingTime
        };
    }

    /**
     * Convenience method that returns health check in expected format
     * Maps to getSystemHealth for consistency
     * 
     * @returns {Promise<Object>} Health status with component details
     */
    async healthCheck() {
        const health = await this.getSystemHealth();
        
        return {
            status: health.status,
            components: {
                IntelligentNarrative: health.services.narrative || { status: 'UNKNOWN' },
                IntelligentLearning: health.services.learning || { status: 'UNKNOWN' },
                IntelligentMonitoring: health.services.monitoring || { status: 'UNKNOWN' }
            },
            enabled: health.enabled,
            timestamp: health.timestamp
        };
    }

    /**
     * Main enhancement method
     * Orchestrates all AI phases based on options
     * 
     * @param {Object} baseAnalysis - Original system analysis
     * @param {Object} options - Enhancement options
     * @returns {Object} Enhanced analysis with AI insights
     */
    async enhanceAnalysis(baseAnalysis, options = {}) {
        const startTime = Date.now();
        
        // If plugin disabled, return original analysis immediately
        if (!this.enabled) {
            return {
                success: false,
                reason: 'AI Plugin disabled',
                original: baseAnalysis,
                enhancements: null,
                metrics: { processingTime: 0, source: 'DISABLED' }
            };
        }

        // Check circuit breaker
        if (this.circuitBreaker.state === 'OPEN') {
            if (Date.now() - this.circuitBreaker.lastFailure < this.circuitBreaker.timeout) {
                return this.createFallbackResponse(baseAnalysis, 'Circuit breaker OPEN');
            } else {
                this.circuitBreaker.state = 'HALF_OPEN';
                console.log('🔄 Circuit breaker moving to HALF_OPEN state');
            }
        }

        try {
            this.metrics.totalRequests++;
            
            const { symbol, userId, phase = 'all', newsData = [], period } = options;
            
            console.log(`🧠 AI Enhancement: ${symbol} | Phase: ${phase} | User: ${userId || 'anonymous'}`);
            
            const enhancements = {};
            const processingSteps = [];

            // Phase 1: Narrative Intelligence (if enabled and requested)
            if (this.shouldRunPhase('narrative', phase)) {
                try {
                    const narrativeStart = Date.now();
                    enhancements.narrative = await this.services.narrative.analyzeMarketStory(symbol, {
                        newsData,
                        targetDate: null // Use latest available
                    });
                    processingSteps.push({
                        phase: 'narrative',
                        success: true,
                        time: Date.now() - narrativeStart
                    });
                    console.log(`📰 Narrative analysis completed: ${enhancements.narrative.sentiment}`);
                } catch (error) {
                    console.error('⚠️ Narrative analysis failed:', error.message);
                    enhancements.narrative = this.createNarrativeFallback();
                    processingSteps.push({
                        phase: 'narrative',
                        success: false,
                        error: error.message
                    });
                }
            }

            // Phase 2: Learning System (if enabled and requested)
            if (this.shouldRunPhase('learning', phase)) {
                try {
                    const learningStart = Date.now();
                    enhancements.learning = await this.services.learning.getSymbolInsights(symbol, {
                        userId
                    });
                    processingSteps.push({
                        phase: 'learning',
                        success: true,
                        time: Date.now() - learningStart
                    });
                    console.log(`🧠 Learning insights: ${enhancements.learning.hasHistory ? 'Available' : 'No history'}`);
                } catch (error) {
                    console.error('⚠️ Learning analysis failed:', error.message);
                    enhancements.learning = this.createLearningFallback();
                    processingSteps.push({
                        phase: 'learning',
                        success: false,
                        error: error.message
                    });
                }
            }

            // Generate enhanced metrics
            const enhancedMetrics = this.calculateEnhancedMetrics(baseAnalysis, enhancements);
            
            // Generate final recommendation
            const recommendation = this.generateEnhancedRecommendation(baseAnalysis, enhancements);

            const processingTime = Date.now() - startTime;
            this.updateMetrics(true, processingTime);

            // Update circuit breaker on success
            if (this.circuitBreaker.state === 'HALF_OPEN') {
                this.circuitBreaker.state = 'CLOSED';
                this.circuitBreaker.failures = 0;
                console.log('✅ Circuit breaker CLOSED - service recovered');
            }

            return {
                success: true,
                enhancements,
                enhancedConfidence: enhancedMetrics.confidence,
                enhancedGrade: enhancedMetrics.grade,
                recommendation,
                metrics: {
                    processingTime,
                    processingSteps,
                    source: 'AI_ENHANCED',
                    phasesRun: Object.keys(enhancements).length
                }
            };

        } catch (error) {
            console.error('❌ AI Enhancement failed:', error);
            this.updateMetrics(false, Date.now() - startTime);
            this.updateCircuitBreaker(error);
            
            return this.createFallbackResponse(baseAnalysis, `AI Enhancement failed: ${error.message}`);
        }
    }

    /**
     * Check if a specific phase should run
     */
    shouldRunPhase(phaseName, requestedPhase) {
        if (!this.phases[phaseName]) return false; // Phase disabled in config
        if (requestedPhase === 'none') return false; // No AI requested
        if (requestedPhase === 'all') return true; // All phases requested
        return requestedPhase === phaseName; // Specific phase requested
    }

    /**
     * Calculate enhanced confidence and grade based on AI inputs
     */
    calculateEnhancedMetrics(baseAnalysis, enhancements) {
        let confidence = baseAnalysis.finalDecision?.confidence || 0.5;
        let grade = baseAnalysis.signalQuality?.grade || 'C';
        const adjustments = [];

        // Narrative-based adjustments
        if (enhancements.narrative && enhancements.narrative.sentiment) {
            const narrativeBonus = this.calculateNarrativeBonus(enhancements.narrative, baseAnalysis);
            confidence += narrativeBonus.confidenceAdjustment;
            adjustments.push(`Narrative ${enhancements.narrative.sentiment}: ${narrativeBonus.confidenceAdjustment > 0 ? '+' : ''}${(narrativeBonus.confidenceAdjustment * 100).toFixed(1)}%`);
            
            if (narrativeBonus.gradeAdjustment !== 0) {
                grade = this.adjustGrade(grade, narrativeBonus.gradeAdjustment);
                adjustments.push(`Grade adjusted by narrative analysis`);
            }
        }

        // Learning-based adjustments
        if (enhancements.learning && enhancements.learning.hasHistory) {
            const learningBonus = this.calculateLearningBonus(enhancements.learning, baseAnalysis);
            confidence += learningBonus.confidenceAdjustment;
            adjustments.push(`Historical learning: ${learningBonus.confidenceAdjustment > 0 ? '+' : ''}${(learningBonus.confidenceAdjustment * 100).toFixed(1)}%`);
            
            if (learningBonus.gradeAdjustment !== 0) {
                grade = this.adjustGrade(grade, learningBonus.gradeAdjustment);
                adjustments.push(`Grade adjusted by historical performance`);
            }
        }

        // Ensure confidence stays within bounds
        confidence = Math.max(0.1, Math.min(0.95, confidence));

        return {
            confidence,
            grade,
            adjustments,
            original: {
                confidence: baseAnalysis.finalDecision?.confidence || 0.5,
                grade: baseAnalysis.signalQuality?.grade || 'C'
            }
        };
    }

    /**
     * Generate enhanced recommendation combining base analysis with AI insights
     */
    generateEnhancedRecommendation(baseAnalysis, enhancements) {
        const baseAction = baseAnalysis.finalDecision?.signal || baseAnalysis.decision || 'HOLD';
        let enhancedAction = baseAction;
        const reasoning = [];

        // Base analysis reasoning
        reasoning.push(`Technical analysis: ${baseAction} signal`);

        // Add narrative context
        if (enhancements.narrative && enhancements.narrative.sentiment) {
            reasoning.push(`Market narrative: ${enhancements.narrative.sentiment.toLowerCase()} sentiment`);
            
            // Strong negative narrative might downgrade BUY to WATCH
            if (enhancements.narrative.sentiment === 'NEGATIVE' && enhancements.narrative.confidence > 0.7) {
                if (baseAction === 'BUY') {
                    enhancedAction = 'WATCH';
                    reasoning.push(`Downgraded to WATCH due to strong negative market narrative`);
                }
            }
        }

        // Add learning insights
        if (enhancements.learning && enhancements.learning.hasHistory) {
            const winRate = enhancements.learning.winRate || 50;
            reasoning.push(`Historical performance: ${winRate.toFixed(0)}% win rate over ${enhancements.learning.tradeCount} trades`);
            
            // Poor historical performance might add caution
            if (winRate < 40 && baseAction === 'BUY') {
                reasoning.push(`Historical underperformance noted - consider reduced position size`);
            }
        }

        return {
            action: enhancedAction,
            reasoning: reasoning.join('. '),
            confidence: this.calculateEnhancedMetrics(baseAnalysis, enhancements).confidence,
            aiContributions: {
                narrative: enhancements.narrative ? 'Applied' : 'Not available',
                learning: enhancements.learning?.hasHistory ? 'Applied' : 'No history'
            }
        };
    }

    /**
     * Calculate narrative-based confidence and grade adjustments
     */
    calculateNarrativeBonus(narrative, baseAnalysis) {
        let confidenceAdjustment = 0;
        let gradeAdjustment = 0;

        const sentiment = narrative.sentiment;
        const confidence = narrative.confidence || 0.5;
        const baseSignal = baseAnalysis.finalDecision?.signal || baseAnalysis.decision;

        // Positive narrative + BUY signal = bonus
        if (sentiment === 'POSITIVE' && baseSignal === 'BUY' && confidence > 0.6) {
            confidenceAdjustment = 0.1;
            gradeAdjustment = 1;
        }
        // Negative narrative + BUY signal = penalty
        else if (sentiment === 'NEGATIVE' && baseSignal === 'BUY' && confidence > 0.6) {
            confidenceAdjustment = -0.05;
            gradeAdjustment = -1;
        }
        // Positive narrative + SELL signal = conflict penalty
        else if (sentiment === 'POSITIVE' && baseSignal === 'SELL' && confidence > 0.6) {
            confidenceAdjustment = -0.03;
        }

        return { confidenceAdjustment, gradeAdjustment };
    }

    /**
     * Calculate learning-based confidence and grade adjustments
     */
    calculateLearningBonus(learning, baseAnalysis) {
        let confidenceAdjustment = 0;
        let gradeAdjustment = 0;

        const winRate = learning.winRate || 50;
        const tradeCount = learning.tradeCount || 0;

        // Only apply learning bonus if we have sufficient history
        if (tradeCount >= 5) {
            if (winRate > 70) {
                confidenceAdjustment = 0.08;
                gradeAdjustment = 1;
            } else if (winRate > 60) {
                confidenceAdjustment = 0.04;
            } else if (winRate < 40) {
                confidenceAdjustment = -0.06;
                gradeAdjustment = -1;
            } else if (winRate < 30) {
                confidenceAdjustment = -0.10;
                gradeAdjustment = -1;
            }
        }

        return { confidenceAdjustment, gradeAdjustment };
    }

    /**
     * Adjust grade by specified amount
     */
    adjustGrade(currentGrade, adjustment) {
        const grades = ['F', 'D', 'D+', 'C-', 'C', 'C+', 'B-', 'B', 'B+', 'A-', 'A', 'A+'];
        const currentIndex = grades.indexOf(currentGrade);
        
        if (currentIndex === -1) return currentGrade; // Invalid grade
        
        const newIndex = Math.max(0, Math.min(grades.length - 1, currentIndex + adjustment));
        return grades[newIndex];
    }

    /**
     * Create fallback response when AI fails
     */
    createFallbackResponse(baseAnalysis, reason) {
        return {
            success: false,
            reason,
            original: baseAnalysis,
            enhancements: {
                narrative: this.createNarrativeFallback(),
                learning: this.createLearningFallback()
            },
            enhancedConfidence: baseAnalysis.finalDecision?.confidence || 0.5,
            enhancedGrade: baseAnalysis.signalQuality?.grade || 'C',
            recommendation: {
                action: baseAnalysis.finalDecision?.signal || baseAnalysis.decision || 'HOLD',
                reasoning: 'Using base analysis only - AI enhancement unavailable',
                confidence: baseAnalysis.finalDecision?.confidence || 0.5,
                aiContributions: {
                    narrative: 'Fallback',
                    learning: 'Fallback'
                }
            },
            metrics: {
                processingTime: 0,
                source: 'FALLBACK',
                phasesRun: 0
            }
        };
    }

    /**
     * Create narrative fallback when service fails
     */
    createNarrativeFallback() {
        return {
            sentiment: 'NEUTRAL',
            confidence: 0.5,
            mainStory: 'Market narrative analysis temporarily unavailable',
            keyFactors: ['Technical analysis active'],
            riskFactors: [],
            source: 'FALLBACK'
        };
    }

    /**
     * Create learning fallback when service fails
     */
    createLearningFallback() {
        return {
            hasHistory: false,
            tradeCount: 0,
            winRate: 50,
            avgReturn: 0,
            recommendations: [{
                message: 'Historical analysis temporarily unavailable',
                confidence: 0.3,
                source: 'FALLBACK'
            }],
            source: 'FALLBACK'
        };
    }

    /**
     * Update circuit breaker on failure
     */
    updateCircuitBreaker(error) {
        this.circuitBreaker.failures++;
        this.circuitBreaker.lastFailure = Date.now();
        this.metrics.lastError = error.message;

        if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
            this.circuitBreaker.state = 'OPEN';
            console.log(`🔴 Circuit breaker OPEN - ${this.circuitBreaker.failures} failures`);
        }
    }

    /**
     * Update metrics tracking
     */
    updateMetrics(success, responseTime) {
        if (success) {
            this.metrics.successfulRequests++;
        } else {
            this.metrics.failedRequests++;
        }
        
        // Update average response time
        const totalRequests = this.metrics.successfulRequests + this.metrics.failedRequests;
        this.metrics.averageResponseTime = 
            (this.metrics.averageResponseTime * (totalRequests - 1) + responseTime) / totalRequests;
    }

    /**
     * Execute a service method with automatic fallback
     * This is the missing method the controller expects
     */
    async executeWithFallback(serviceName, serviceMethod, options = {}) {
        const { fallback } = options;
        
        if (!this.enabled || this.circuitBreaker.state === 'OPEN') {
            return fallback || this.createGenericFallback(serviceName);
        }

        try {
            const result = await serviceMethod();
            
            // Reset circuit breaker on success
            if (this.circuitBreaker.state === 'HALF_OPEN') {
                this.circuitBreaker.state = 'CLOSED';
                this.circuitBreaker.failures = 0;
            }
            
            return result;
            
        } catch (error) {
            console.error(`❌ ${serviceName} service failed:`, error.message);
            this.updateCircuitBreaker(error);
            
            return fallback || this.createGenericFallback(serviceName);
        }
    }

    /**
     * Create generic fallback for any service
     */
    createGenericFallback(serviceName) {
        switch (serviceName) {
            case 'narrative':
                return this.createNarrativeFallback();
            case 'learning':
                return this.createLearningFallback();
            case 'monitoring':
                return { status: 'fallback', message: 'Monitoring temporarily unavailable' };
            default:
                return { status: 'fallback', service: serviceName };
        }
    }

    /**
     * Get system health status
     */
    async getSystemHealth() {
        const health = {
            enabled: this.enabled,
            circuitBreaker: {
                state: this.circuitBreaker.state,
                failures: this.circuitBreaker.failures,
                lastFailure: this.circuitBreaker.lastFailure
            },
            phases: this.phases,
            metrics: {
                ...this.metrics,
                successRate: this.metrics.totalRequests > 0 ? 
                    (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(1) : 0
            },
            services: {},
            timestamp: new Date()
        };

        // Test each service if enabled
        if (this.enabled && this.services) {
            try {
                health.services.narrative = await this.services.narrative.healthCheck();
            } catch (error) {
                health.services.narrative = { status: 'ERROR', error: error.message };
            }

            try {
                health.services.learning = await this.services.learning.healthCheck();
            } catch (error) {
                health.services.learning = { status: 'ERROR', error: error.message };
            }

            try {
                health.services.monitoring = await this.services.monitoring.healthCheck();
            } catch (error) {
                health.services.monitoring = { status: 'ERROR', error: error.message };
            }
        }

        // Determine overall status
        const serviceStatuses = Object.values(health.services);
        const hasErrors = serviceStatuses.some(s => s.status === 'ERROR');
        
        health.status = this.enabled ? 
            (this.circuitBreaker.state === 'OPEN' ? 'DEGRADED' : 
             hasErrors ? 'DEGRADED' : 'HEALTHY') : 'DISABLED';

        return health;
    }

    /**
     * Update user-specific AI configuration
     */
    async updateUserConfig(userId, config) {
        // Store user preferences (would typically save to database)
        console.log(`⚙️ Updating AI config for user ${userId}:`, config);
        
        return {
            userId,
            config,
            updated: true,
            timestamp: new Date()
        };
    }

    /**
     * Disable plugin (emergency stop)
     */
    disable(reason = 'Manual disable') {
        this.enabled = false;
        console.log(`🚫 AI Plugin disabled: ${reason}`);
    }

    /**
     * Enable plugin
     */
    enable() {
        this.enabled = true;
        this.circuitBreaker.state = 'CLOSED';
        this.circuitBreaker.failures = 0;
        console.log('✅ AI Plugin enabled');
    }
}

module.exports = AIPluginCore;
