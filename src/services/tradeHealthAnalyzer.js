/**
 * Trade Health Analyzer Service - Phase 1A Enhanced Exit Intelligence
 * Now leverages real generateExpertAIDecision for maximum accuracy
 */

const { prepareAnalysisContext, generateExpertAIDecision } = require('../controllers/ai/stock.expert.controller');
const { calculateUnrealizedPnL } = require('../utils/tradeCalculations');

class TradeHealthAnalyzer {
  constructor() {
    this.analysisCache = new Map(); // Cache analysis for 5 minutes
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Clear cache for a specific ticker (useful for partial trades)
   */
  clearCacheForTicker(ticker) {
    const keysToDelete = [];
    for (const key of this.analysisCache.keys()) {
      if (key.startsWith(ticker)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.analysisCache.delete(key));
    console.log(`🗑️ Cleared ${keysToDelete.length} cache entries for ${ticker}`);
  }

  /**
   * Main method: Analyze trade health using real AI infrastructure
   */
  async analyzeTradeHealth(trade) {
    try {
      console.log(`🔍 [TRADE-HEALTH] Analyzing health for ${trade.ticker} (${trade.tradeId}) with REAL AI`);
      
      // Check cache first - include quantity for partial trades
      const isPartialTrade = trade.originalQuantity && trade.quantity !== trade.originalQuantity;
      const quantityKey = isPartialTrade ? `_qty${trade.quantity}` : '';
      const cacheKey = `${trade.ticker}${quantityKey}_${Date.now() - (Date.now() % this.cacheTimeout)}`;
      console.log(`🔧 Cache key for ${trade.ticker}: "${cacheKey}" (Original: ${trade.originalQuantity}, Current: ${trade.quantity}, Partial: ${isPartialTrade})`);
      if (this.analysisCache.has(cacheKey)) {
        console.log(`📊 [TRADE-HEALTH] Using cached analysis for ${trade.ticker}${quantityKey}`);
        const cachedData = this.analysisCache.get(cacheKey);
        return this.transformToTradeHealth(cachedData, trade);
      }

      // Get REAL AI analysis using generateExpertAIDecision
      const aiAnalysis = await this.getRealAIAnalysis(trade.ticker);
      
      // Cache the analysis
      this.analysisCache.set(cacheKey, aiAnalysis);
      
      // Transform AI analysis into trade-specific health metrics
      const tradeHealth = this.transformToTradeHealth(aiAnalysis, trade);
      
      console.log(`✅ [TRADE-HEALTH] REAL AI analysis complete for ${trade.ticker}: ${tradeHealth.exitAnalysis.recommendation}`);
      console.log(`   🧠 AI Decision: ${aiAnalysis._expertDecision?.finalDecision?.action} (${aiAnalysis._expertDecision?.signalQuality?.grade})`);
      console.log(`   📊 AI Confidence: ${Math.round((aiAnalysis._expertDecision?.finalDecision?.confidence || 0) * 100)}%`);
      console.log(`   🏛️ Market Regime: ${aiAnalysis._expertDecision?.regimeDetection?.regime}`);
      
      return tradeHealth;
      
    } catch (error) {
      console.error(`❌ [TRADE-HEALTH] Error analyzing ${trade.ticker}:`, error.message);
      
      // Return fallback health data
      return this.getFallbackHealth(trade, error);
    }
  }

  /**
   * Get REAL AI analysis using generateExpertAIDecision
   */
  async getRealAIAnalysis(ticker) {
    try {
      console.log(`🧠 [TRADE-HEALTH] Getting REAL AI analysis for ${ticker} using generateExpertAIDecision`);
      
      // Prepare analysis context (gathers technical data, sentiment, etc.)
      const { analysisContext } = await prepareAnalysisContext(
        ticker, 
        '3mo', // 3 months of data
        100000  // $100k capital for position sizing
      );
      
      // Run the Expert AI Decision Engine - the REAL AI system
      const expertDecision = await generateExpertAIDecision(analysisContext);
      
      console.log(`✅ [TRADE-HEALTH] REAL AI Analysis complete for ${ticker}:`);
      console.log(`   🎯 AI Decision: ${expertDecision.finalDecision?.action} (Grade: ${expertDecision.signalQuality?.grade})`);
      console.log(`   📊 AI Confidence: ${Math.round((expertDecision.finalDecision?.confidence || 0) * 100)}%`);
      console.log(`   ⚖️ Risk/Reward: ${(expertDecision.executionPlan?.riskReward || 0).toFixed(2)}x`);
      console.log(`   🏛️ Market Regime: ${expertDecision.regimeDetection?.regime} (${Math.round((expertDecision.regimeDetection?.confidence || 0) * 100)}%)`);
      console.log(`   🔧 Trade Readiness: ${expertDecision.tradeReadiness?.status}`);
      
      // Transform expert decision to format expected by trade health analysis
      return this.transformExpertDecisionToTradeFormat(expertDecision, analysisContext);
      
    } catch (error) {
      console.error(`❌ [TRADE-HEALTH] REAL AI Analysis failed for ${ticker}:`, error.message);
      console.error('Stack:', error.stack);
      
      // Fallback to mock data if real AI fails
      console.log(`🔄 [TRADE-HEALTH] Falling back to mock analysis for ${ticker}`);
      return this.getMockAnalysis(ticker);
    }
  }

  /**
   * Transform Expert AI Decision to trade analysis format
   */
  transformExpertDecisionToTradeFormat(expertDecision, analysisContext) {
    const technical = analysisContext?.technical || {};
    const currentPrice = technical.currentPrice || technical.latestPrice || 0;
    
    // Map AI decision to trade format with enhanced intelligence
    const decision = {
      status: this.mapAIActionToStatus(
        expertDecision.finalDecision?.action, 
        expertDecision.tradeReadiness?.status,
        expertDecision.signalQuality?.grade || 'C',
        expertDecision.finalDecision?.confidence || 0
      ),
      confidence: Math.round((expertDecision.finalDecision?.confidence || 0) * 100),
      grade: expertDecision.signalQuality?.grade || 'C',
      reasonCodes: this.extractReasonCodes(expertDecision)
    };
    
    const execution = {
      entry: Math.round((expertDecision.executionPlan?.entryPrice || currentPrice) * 100) / 100,
      stop: Math.round((expertDecision.executionPlan?.stopLoss || 0) * 100) / 100,
      riskReward: Math.round((expertDecision.executionPlan?.riskReward || 0) * 100) / 100,
      target1: expertDecision.breakoutPlan ? 
        Math.round(expertDecision.breakoutPlan.targets.primary * 100) / 100 : 
        Math.round((currentPrice * 1.08) * 100) / 100,
      target2: expertDecision.breakoutPlan ? 
        Math.round(expertDecision.breakoutPlan.targets.secondary * 100) / 100 : 
        Math.round((currentPrice * 1.15) * 100) / 100,
      positionSize: {
        shares: expertDecision.positionSizing?.recommendedShares || 0,
        value: Math.round(expertDecision.positionSizing?.positionValue || 0),
        risk: `${Math.round((expertDecision.positionSizing?.percentOfPortfolio || 0) * 10) / 10}%`
      }
    };
    
    const context = {
      trend: this.mapTrendState(technical, expertDecision),
      levels: {
        support: Math.round((technical.levels?.support || 0) * 100) / 100,
        resistance: Math.round((technical.levels?.resistance || 0) * 100) / 100
      },
      volume: this.extractVolumeAnalysis(technical, expertDecision),
      earnings: this.extractEarningsContext(expertDecision, technical),
      regime: {
        type: expertDecision.regimeDetection?.regime || 'UNKNOWN',
        confidence: Math.round((expertDecision.regimeDetection?.confidence || 0) * 100),
        strength: Math.round((expertDecision.regimeDetection?.regimeStrength || 0) * 100)
      }
    };
    
    const scenarios = {
      breakout: expertDecision.breakoutPlan ? {
        trigger: Math.round(expertDecision.breakoutPlan.triggerPrice * 100) / 100,
        probability: Math.round((expertDecision.breakoutPlan.successProbability || 0.38) * 100),
        target: Math.round(expertDecision.breakoutPlan.targets.primary * 100) / 100
      } : {
        trigger: Math.round((technical.levels?.resistance || currentPrice * 1.05) * 100) / 100,
        probability: 35,
        target: Math.round((currentPrice * 1.08) * 100) / 100
      },
      breakdown: expertDecision.breakdownPlan ? {
        trigger: Math.round(expertDecision.breakdownPlan.triggerPrice * 100) / 100,
        probability: Math.round((expertDecision.breakdownPlan.successProbability || 0.44) * 100),
        target: Math.round(expertDecision.breakdownPlan.targets.primary * 100) / 100
      } : {
        trigger: Math.round((technical.levels?.support || currentPrice * 0.95) * 100) / 100,
        probability: 35,
        target: Math.round((currentPrice * 0.92) * 100) / 100
      }
    };
    
    const risk = {
      level: this.mapRiskLevel(expertDecision.signalQuality?.grade, expertDecision.executionPlan?.riskReward),
      tailRiskScore: expertDecision.riskAssessment?.tailRiskScore || 25,
      maxDrawdown: `${Math.round((expertDecision.riskAssessment?.maxDrawdown || 0.18) * 100)}%`
    };
    
    return {
      symbol: expertDecision.symbol || analysisContext.symbol,
      currentPrice,
      timestamp: new Date().toISOString(),
      decision,
      execution,
      context,
      scenarios,
      risk,
      nextStepSummary: this.generateNextStepSummary(expertDecision, technical),
      // Include raw expert decision for advanced analysis
      _expertDecision: expertDecision,
      _analysisContext: analysisContext
    };
  }

  /**
   * Fallback mock analysis for when real AI fails
   */
  getMockAnalysis(ticker) {
    console.log(`🔄 [TRADE-HEALTH] Using mock analysis for ${ticker}`);
    return {
      symbol: ticker,
      currentPrice: 100,
      timestamp: new Date().toISOString(),
      decision: {
        status: 'WATCH',
        confidence: 65,
        grade: 'B',
        reasonCodes: ['MOCK_ANALYSIS', 'AI_SYSTEM_UNAVAILABLE']
      },
      execution: {
        entry: 100,
        stop: 95,
        riskReward: 2.0,
        target1: 108,
        target2: 115,
        positionSize: { shares: 100, value: 10000, risk: '2.0%' }
      },
      context: {
        trend: 'SIDEWAYS',
        levels: { support: 95, resistance: 110 },
        volume: { status: 'NORMAL', multiple: 1.2 },
        earnings: { daysAway: null, impact: 'NONE' },
        regime: { type: 'UNKNOWN', confidence: 50, strength: 50 }
      },
      scenarios: {
        breakout: { trigger: 110, probability: 50, target: 115 },
        breakdown: { trigger: 95, probability: 50, target: 90 }
      },
      risk: { level: 'MEDIUM', tailRiskScore: 50, maxDrawdown: '15%' },
      nextStepSummary: 'AI analysis temporarily unavailable - using conservative estimates'
    };
  }

  /**
   * REFACTORED: Enhanced AI action mapping with signal elevation logic
   * Addresses ChatGPT suggestions for WATCH vs BUY behavior and STRONG signals
   */
  mapAIActionToStatus(action, readiness, grade, confidence) {
    // Handle STRONG signals with distinct urgency
    if (action === 'STRONG_SELL') return 'STRONG_SELL';
    if (action === 'STRONG_BUY') return 'STRONG_BUY';
    
    // Basic signal mapping
    if (action === 'SELL') return 'SELL';
    if (action === 'BUY') return 'BUY';
    if (action === 'AVOID' || readiness === 'AVOID') return 'AVOID';
    
    // ENHANCED: Signal elevation logic for WATCH
    if (action === 'WATCH') {
      // Elevate WATCH to BUY if conditions are strong
      if (this.shouldElevateWatchToBuy(grade, confidence)) {
        return 'BUY_ELEVATED';
      }
      return 'WATCH';
    }
    
    return 'HOLD';
  }

  /**
   * NEW: Signal elevation logic - WATCH to BUY promotion
   * Addresses ChatGPT suggestion for borderline strong signals
   */
  shouldElevateWatchToBuy(grade, confidence) {
    // Standardized confidence (0-100 scale)
    const normalizedConfidence = confidence >= 1 ? confidence : confidence * 100;
    
    // Elevation criteria: Strong grade + high confidence
    const strongGrades = ['A+', 'A', 'A-', 'B+'];
    const isStrongGrade = strongGrades.includes(grade);
    const isHighConfidence = normalizedConfidence >= 75;
    
    return isStrongGrade && isHighConfidence;
  }

  mapTrendState(technical, expertDecision) {
    // Enhanced trend mapping using AI regime detection
    const regime = expertDecision.regimeDetection?.regime;
    const trendState = technical.trendState;
    
    if (regime === 'BULL' || trendState === 'ABOVE_BAND') return 'UPTREND';
    if (regime === 'BEAR' || trendState === 'BELOW_BAND') return 'DOWNTREND';
    return 'SIDEWAYS';
  }

  extractVolumeAnalysis(technical, expertDecision) {
    const volumeData = technical.technicalIndicators?.latest;
    const lastVol = volumeData?.volume || volumeData?.avgVolume || 0;
    const avgVol = volumeData?.avgVolume20DMA || volumeData?.avgVolume || 1;
    const multiple = lastVol / avgVol;
    
    let status = 'NORMAL';
    if (multiple >= 2.0) status = 'VERY_STRONG';
    else if (multiple >= 1.5) status = 'STRONG';
    else if (multiple < 1.0) status = 'WEAK';
    
    return {
      status,
      multiple: Math.round(multiple * 100) / 100
    };
  }

  extractEarningsContext(expertDecision, technical) {
    const earningsDate = technical?.earnings?.nextDate;
    const daysAway = earningsDate ? 
      Math.ceil((new Date(earningsDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;
    
    const impact = (daysAway && daysAway <= 14 && daysAway >= 0) ? 'AVOID_OR_REDUCE' : 'NONE';
    
    return { daysAway, impact };
  }

  /**
   * REFACTORED: Extract reason codes with deduplication
   * Addresses ChatGPT suggestion to avoid duplicating regime/riskReward codes
   */
  extractReasonCodes(expertDecision) {
    const codes = new Set(); // Use Set to avoid duplicates
    
    // Extract from AI decision reasoning
    const confidence = Math.round((expertDecision.finalDecision?.confidence || 0) * 100);
    const grade = expertDecision.signalQuality?.grade || 'C';
    const regime = expertDecision.regimeDetection?.regime || 'UNKNOWN';
    const riskReward = expertDecision.executionPlan?.riskReward || 0;
    const action = expertDecision.finalDecision?.action || 'HOLD';
    
    // Core signal information
    codes.add(`GRADE_${grade.replace('+', 'PLUS').replace('-', 'MINUS')}`);
    codes.add(`CONFIDENCE_${confidence}PCT`);
    
    // Market regime (only if meaningful)
    if (regime !== 'UNKNOWN') {
      codes.add(`REGIME_${regime}`);
    }
    
    // Risk/Reward assessment (simplified)
    if (riskReward >= 3.0) codes.add('EXCELLENT_RR');
    else if (riskReward >= 2.0) codes.add('GOOD_RR');
    else if (riskReward < 1.5) codes.add('POOR_RR');
    
    // Action-specific codes
    if (action === 'STRONG_SELL' || action === 'STRONG_BUY') {
      codes.add('STRONG_SIGNAL');
    }
    
    // Return as array for consistency
    return Array.from(codes);
  }

  mapRiskLevel(grade, riskReward) {
    if (grade === 'A+' || grade === 'A') return 'LOW';
    if ((grade === 'A-' || grade === 'B+') && riskReward >= 2.0) return 'LOW';
    if (grade === 'B' || grade === 'B-') return 'MEDIUM';
    return 'HIGH';
  }

  generateNextStepSummary(expertDecision, technical) {
    const action = expertDecision.finalDecision?.action || 'HOLD';
    const readiness = expertDecision.tradeReadiness?.status || 'UNKNOWN';
    const currentPrice = technical.currentPrice || technical.latestPrice || 0;
    const resistance = technical.levels?.resistance || 0;
    
    if (readiness === 'READY' && ['BUY', 'SELL', 'STRONG_BUY', 'STRONG_SELL'].includes(action)) {
      const entry = expertDecision.executionPlan?.entryPrice || currentPrice;
      const stop = expertDecision.executionPlan?.stopLoss || 0;
      const rr = expertDecision.executionPlan?.riskReward || 0;
      return `AI recommends ${action.toLowerCase()} at ${entry.toFixed(2)} with stop ${stop.toFixed(2)} (R/R: ${rr.toFixed(2)}x)`;
    }
    
    if (action === 'AVOID' || readiness === 'AVOID') {
      return 'AI recommends avoiding - multiple constraints active';
    }
    
    if (resistance > 0) {
      return `AI watching for breakout above ${resistance.toFixed(2)}`;
    }
    
    return `AI monitoring for improved signal quality (current grade: ${expertDecision.signalQuality?.grade || 'C'})`;
  }

  /**
   * Transform AI analysis into trade-specific health metrics
   */
  transformToTradeHealth(aiAnalysis, trade) {
    const currentPrice = trade.currentPrice || aiAnalysis.currentPrice || 0;
    const entryPrice = trade.entryPrice || 0;
    
    // Calculate trade-specific metrics using the utility function
    const unrealizedPnL = calculateUnrealizedPnL(trade, currentPrice);
    // REFACTORED: Use AI's risk/reward instead of duplicate calculation
    const riskReward = aiAnalysis.execution?.riskReward || 0;
    
    // Build exit analysis using AI intelligence
    const exitAnalysis = this.buildExitAnalysis(aiAnalysis, trade, currentPrice);
    
    // Build health metrics
    const healthMetrics = this.buildHealthMetrics(aiAnalysis, trade, currentPrice);
    
    // Build risk assessment
    const riskAssessment = this.buildRiskAssessment(aiAnalysis, trade, currentPrice);

    // Create simplified bird's eye view summary
    const birdEyeView = this.createBirdEyeView(exitAnalysis, healthMetrics, riskAssessment, {
      unrealizedPnL,
      riskReward,
      daysHeld: this.calculateDaysHeld(trade),
      priceChange: entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice * 100).toFixed(2) : 0
    }, trade);

    return {
      // NEW: Simplified bird's eye view - what you need to know NOW
      birdEyeView,
      
      // Detailed analysis (for those who want to dig deeper)
      exitAnalysis,
      healthMetrics,
      riskAssessment,
      tradeMetrics: {
        unrealizedPnL,
        riskReward,
        daysHeld: this.calculateDaysHeld(trade),
        priceChange: entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice * 100).toFixed(2) : 0
      },
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Build comprehensive exit analysis using real AI intelligence
   */
  buildExitAnalysis(aiAnalysis, trade, currentPrice) {
    const decision = aiAnalysis.decision || {};
    const execution = aiAnalysis.execution || {};
    const context = aiAnalysis.context || {};
    const expertDecision = aiAnalysis._expertDecision;
    
    // Use AI intelligence for exit recommendations
    let recommendation = 'HOLD';
    let confidence = 0.5;
    let timeframe = '1-3 days';
    let reasoning = [];

    // ENHANCED: AI suggests SELL or position is at high risk
    if (decision.status === 'STRONG_SELL') {
      recommendation = 'EXIT_IMMEDIATE';
      confidence = Math.min(decision.confidence / 100 || 0.5, 0.95);
      reasoning.push(`URGENT: AI strong sell signal (${decision.grade} grade)`);
    }
    else if (decision.status === 'SELL' || decision.status === 'AVOID') {
      recommendation = 'EXIT';
      confidence = Math.min(decision.confidence / 100 || 0.5, 0.95);
      reasoning.push(`AI analysis: ${decision.status} signal (${decision.grade} grade)`);
      
      // Add specific AI reasoning
      if (expertDecision?.regimeDetection?.regime === 'BEAR') {
        reasoning.push(`Bear market regime detected (${context.regime?.strength}% strength)`);
      }
    }
    // ENHANCED: AI suggests strong buy for existing positions
    else if (decision.status === 'STRONG_BUY') {
      recommendation = 'ADD_POSITION';
      confidence = Math.min(decision.confidence / 100 || 0.5, 0.95);
      reasoning.push(`STRONG: AI strong buy signal (${decision.grade} grade) - consider adding to position`);
    }
    else if (decision.status === 'BUY_ELEVATED') {
      recommendation = 'HOLD_STRONG';
      confidence = Math.min(decision.confidence / 100 || 0.5, 0.90);
      reasoning.push(`AI watch elevated to buy (${decision.grade} grade, ${decision.confidence}% confidence)`);
    }
    // AI grade is poor or risk/reward deteriorated
    else if (decision.grade && ['D+', 'D', 'D-', 'F'].includes(decision.grade)) {
      recommendation = 'REDUCE';
      confidence = 0.7;
      reasoning.push(`Poor AI setup quality: Grade ${decision.grade}`);
    }
    // Check if approaching AI target levels
    else if (this.isApproachingTarget(trade, currentPrice, execution)) {
      recommendation = 'REDUCE';
      confidence = 0.8;
      reasoning.push('Approaching AI target levels - consider profit taking');
    }
    // AI volume or trend concerns
    else {
      const volumeStatus = context.volume?.status || 'NORMAL';
      const trend = context.trend || 'SIDEWAYS';
      const aiConfidence = decision.confidence || 50;
      
      if (volumeStatus === 'WEAK' && trend === 'DOWNTREND') {
        recommendation = 'REDUCE';
        confidence = 0.6;
        reasoning.push('AI detects weak volume with downtrend - risk increasing');
      } else if (aiConfidence < 50) {
        reasoning.push(`AI low confidence environment (${aiConfidence}%) - monitor closely`);
      } else {
        reasoning.push(`AI trade thesis intact (${decision.grade} grade, ${aiConfidence}% confidence) - continue holding`);
      }
    }

    // Determine risk level using AI data
    const riskLevel = this.determineRiskLevel(aiAnalysis, trade, currentPrice);
    
    // Add AI-specific reasoning
    if (context.earnings?.impact === 'AVOID_OR_REDUCE') {
      reasoning.push(`AI detects earnings in ${context.earnings.daysAway} days - consider reducing exposure`);
      if (recommendation === 'HOLD') recommendation = 'REDUCE';
    }

    // Add regime-aware reasoning
    if (context.regime?.type === 'BEAR' && context.regime?.confidence > 70) {
      reasoning.push(`High-confidence bear regime (${context.regime.confidence}%) reduces holding attractiveness`);
      if (recommendation === 'HOLD') recommendation = 'REDUCE';
    }

    return {
      recommendation,
      confidence: Math.round(confidence * 100),
      timeframe,
      reasoning: reasoning.slice(0, 3), // Top 3 reasons
      riskLevel,
      nextReview: this.calculateNextReviewDate(recommendation),
      aiGrade: decision.grade,
      aiConfidence: decision.confidence
    };
  }

  /**
   * Build health metrics with AI intelligence
   */
  buildHealthMetrics(aiAnalysis, trade, currentPrice) {
    const decision = aiAnalysis.decision || {};
    const context = aiAnalysis.context || {};
    
    // Calculate health score using AI data
    let healthScore = 50; // Base score
    
    // AI grade impact (40% of score)
    const gradeMap = { 'A+': 40, 'A': 38, 'A-': 35, 'B+': 32, 'B': 28, 'B-': 24, 'C+': 20, 'C': 16, 'C-': 12, 'D+': 8, 'D': 4, 'D-': 2, 'F': 0 };
    healthScore = gradeMap[decision.grade] || 16;
    
    // AI confidence impact (30% of score)
    const confidenceBonus = Math.round((decision.confidence || 50) * 0.3);
    healthScore += confidenceBonus;
    
    // Risk/reward impact (20% of score)
    const riskReward = aiAnalysis.execution?.riskReward || 0;
    if (riskReward >= 3.0) healthScore += 20;
    else if (riskReward >= 2.0) healthScore += 15;
    else if (riskReward >= 1.5) healthScore += 10;
    else if (riskReward < 1.0) healthScore -= 10;
    
    // Market regime impact (10% of score)
    if (context.regime?.type === 'BULL' && context.regime?.confidence > 70) {
      healthScore += 10;
    } else if (context.regime?.type === 'BEAR' && context.regime?.confidence > 70) {
      healthScore -= 10;
    }
    
    healthScore = Math.max(0, Math.min(100, healthScore));
    
    // Performance metrics
    const unrealizedPnL = calculateUnrealizedPnL(trade, currentPrice);
    const performanceGrade = this.calculatePerformanceGrade(unrealizedPnL, trade);
    
    return {
      healthScore,
      performanceGrade,
      momentum: this.calculateMomentum(aiAnalysis, trade),
      signals: {
        technical: decision.grade,
        volume: context.volume?.status || 'NORMAL',
        trend: context.trend || 'SIDEWAYS',
        regime: context.regime?.type || 'UNKNOWN'
      },
      alerts: this.generateHealthAlerts(aiAnalysis, trade, currentPrice)
    };
  }

  /**
   * Build risk assessment with AI intelligence
   */
  buildRiskAssessment(aiAnalysis, trade, currentPrice) {
    const decision = aiAnalysis.decision || {};
    const context = aiAnalysis.context || {};
    const risk = aiAnalysis.risk || {};
    
    // Overall risk level from AI
    const overallRisk = risk.level || 'MEDIUM';
    
    // Specific risk factors identified by AI
    const riskFactors = [];
    
    if (decision.grade && ['D+', 'D', 'D-', 'F'].includes(decision.grade)) {
      riskFactors.push('Poor AI signal quality');
    }
    
    if (context.volume?.status === 'WEAK') {
      riskFactors.push('Weak volume conditions');
    }
    
    if (context.regime?.type === 'BEAR' && context.regime?.confidence > 70) {
      riskFactors.push(`High-confidence bear market regime (${context.regime.confidence}%)`);
    }
    
    if (context.earnings?.impact === 'AVOID_OR_REDUCE') {
      riskFactors.push(`Earnings in ${context.earnings.daysAway} days`);
    }
    
    const riskReward = aiAnalysis.execution?.riskReward || 0;
    if (riskReward < 1.5) {
      riskFactors.push(`Poor risk/reward ratio (${riskReward.toFixed(2)}x)`);
    }
    
    // Position risk
    const positionRisk = this.calculatePositionRisk(trade, currentPrice);
    
    return {
      overallRisk,
      riskFactors: riskFactors.slice(0, 5), // Top 5 risk factors
      positionRisk,
      maxDrawdown: risk.maxDrawdown || '15%',
      tailRisk: risk.tailRiskScore || 25,
      stopLossDistance: this.calculateStopLossDistance(trade, currentPrice),
      recommendation: this.getRiskRecommendation(overallRisk, riskFactors.length)
    };
  }

  /**
   * Helper calculation methods
   * REFACTORED: Removed calculateCurrentRiskReward - now using AI's risk/reward directly
   */
  calculateDaysHeld(trade) {
    if (!trade.entryDate) return 0;
    
    const entryDate = new Date(trade.entryDate);
    const now = new Date();
    const diffTime = Math.abs(now - entryDate);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  isApproachingTarget(trade, currentPrice, execution) {
    const target1 = execution?.target1 || 0;
    if (!target1 || !currentPrice) return false;
    
    const distanceToTarget = Math.abs(target1 - currentPrice) / currentPrice;
    return distanceToTarget < 0.03; // Within 3% of target
  }

  determineRiskLevel(aiAnalysis, trade, currentPrice) {
    const decision = aiAnalysis.decision || {};
    const risk = aiAnalysis.risk || {};
    
    if (risk.level === 'HIGH' || decision.grade === 'F') return 'HIGH';
    if (risk.level === 'LOW' && decision.confidence > 80) return 'LOW';
    return 'MEDIUM';
  }

  calculateNextReviewDate(recommendation) {
    const now = new Date();
    const daysToAdd = recommendation === 'EXIT' ? 1 : 
                     recommendation === 'REDUCE' ? 2 : 3;
    
    const nextReview = new Date(now);
    nextReview.setDate(now.getDate() + daysToAdd);
    return nextReview.toISOString().split('T')[0];
  }

  calculatePerformanceGrade(unrealizedPnL, trade) {
    if (!trade.entryPrice || !trade.quantity) return 'C';
    
    const positionValue = trade.entryPrice * trade.quantity;
    const returnPct = (unrealizedPnL / positionValue) * 100;
    
    if (returnPct >= 15) return 'A+';
    if (returnPct >= 10) return 'A';
    if (returnPct >= 5) return 'B+';
    if (returnPct >= 0) return 'B';
    if (returnPct >= -5) return 'C';
    if (returnPct >= -10) return 'D';
    return 'F';
  }

  calculateMomentum(aiAnalysis, trade) {
    const decision = aiAnalysis.decision || {};
    const context = aiAnalysis.context || {};
    
    if (decision.status === 'BUY' && context.trend === 'UPTREND') return 'STRONG_POSITIVE';
    if (decision.status === 'SELL' && context.trend === 'DOWNTREND') return 'STRONG_NEGATIVE';
    if (context.trend === 'UPTREND') return 'POSITIVE';
    if (context.trend === 'DOWNTREND') return 'NEGATIVE';
    return 'NEUTRAL';
  }

  generateHealthAlerts(aiAnalysis, trade, currentPrice) {
    const alerts = [];
    const decision = aiAnalysis.decision || {};
    const context = aiAnalysis.context || {};
    
    if (decision.status === 'SELL') {
      alerts.push({ type: 'WARNING', message: 'AI recommends selling this position' });
    }
    
    if (decision.grade && ['D+', 'D', 'D-', 'F'].includes(decision.grade)) {
      alerts.push({ type: 'CRITICAL', message: `Poor AI grade: ${decision.grade}` });
    }
    
    if (context.earnings?.impact === 'AVOID_OR_REDUCE') {
      alerts.push({ type: 'INFO', message: `Earnings in ${context.earnings.daysAway} days` });
    }
    
    return alerts;
  }

  calculatePositionRisk(trade, currentPrice) {
    const unrealizedPnL = calculateUnrealizedPnL(trade, currentPrice);
    const positionValue = (trade.entryPrice || 0) * (trade.quantity || 0);
    
    if (!positionValue) return 'UNKNOWN';
    
    const riskPct = Math.abs(unrealizedPnL / positionValue) * 100;
    
    if (riskPct < 2) return 'LOW';
    if (riskPct < 5) return 'MEDIUM';
    return 'HIGH';
  }

  calculateStopLossDistance(trade, currentPrice) {
    const stopLoss = trade.stopLoss || 0;
    if (!stopLoss || !currentPrice) return 'N/A';
    
    const distance = Math.abs(currentPrice - stopLoss) / currentPrice * 100;
    return `${distance.toFixed(2)}%`;
  }

  getRiskRecommendation(overallRisk, numRiskFactors) {
    if (overallRisk === 'HIGH' || numRiskFactors >= 3) {
      return 'Consider reducing position size or exiting';
    }
    if (overallRisk === 'MEDIUM' || numRiskFactors >= 2) {
      return 'Monitor closely and tighten stops';
    }
    return 'Continue with current strategy';
  }

  /**
   * Fallback health analysis for errors
   */
  getFallbackHealth(trade, error) {
    console.log(`🔄 [TRADE-HEALTH] Creating fallback health analysis for ${trade.ticker}`);
    
    const currentPrice = trade.currentPrice || trade.entryPrice || 100;
    const unrealizedPnL = calculateUnrealizedPnL(trade, currentPrice);
    
    return {
      exitAnalysis: {
        recommendation: 'HOLD',
        confidence: 50,
        timeframe: '2-5 days',
        reasoning: ['AI analysis unavailable', 'Using conservative fallback'],
        riskLevel: 'MEDIUM',
        nextReview: this.calculateNextReviewDate('HOLD'),
        aiGrade: 'C',
        aiConfidence: 50
      },
      healthMetrics: {
        healthScore: 50,
        performanceGrade: this.calculatePerformanceGrade(unrealizedPnL, trade),
        momentum: 'NEUTRAL',
        signals: {
          technical: 'C',
          volume: 'NORMAL',
          trend: 'SIDEWAYS',
          regime: 'UNKNOWN'
        },
        alerts: [{ type: 'WARNING', message: 'AI analysis temporarily unavailable' }]
      },
      riskAssessment: {
        overallRisk: 'MEDIUM',
        riskFactors: ['AI analysis unavailable'],
        positionRisk: this.calculatePositionRisk(trade, currentPrice),
        maxDrawdown: '15%',
        tailRisk: 50,
        stopLossDistance: this.calculateStopLossDistance(trade, currentPrice),
        recommendation: 'Monitor position manually'
      },
      tradeMetrics: {
        unrealizedPnL,
        riskReward: 0,
        daysHeld: this.calculateDaysHeld(trade),
        priceChange: trade.entryPrice > 0 ? ((currentPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2) : 0
      },
      lastUpdated: new Date().toISOString(),
      error: error.message
    };
  }

  /**
   * Create simplified bird's eye view - what you need to know NOW
   */
  createBirdEyeView(exitAnalysis, healthMetrics, riskAssessment, tradeMetrics, trade) {
    const { unrealizedPnL, priceChange, daysHeld } = tradeMetrics;
    const isProfit = unrealizedPnL > 0;
    const isProfitSignificant = Math.abs(parseFloat(priceChange)) >= 5; // 5%+ move
    const isHighRisk = riskAssessment.positionRisk === 'HIGH' || riskAssessment.overallRisk === 'HIGH';
    const aiGrade = exitAnalysis.aiGrade || 'C';
    const healthScore = healthMetrics.healthScore || 50;
    
    // ENHANCED: Determine overall status with new signal types
    let status, statusEmoji, action, priority;
    
    if (exitAnalysis.recommendation === 'EXIT_IMMEDIATE') {
      status = 'EXIT IMMEDIATELY';
      statusEmoji = '🚨';
      action = 'URGENT: Sell all shares now - Strong AI sell signal';
      priority = 'CRITICAL';
    }
    else if (exitAnalysis.recommendation === 'EXIT') {
      status = 'EXIT NOW';
      statusEmoji = '🚨';
      action = 'Sell immediately - AI recommends exit';
      priority = 'URGENT';
    }
    else if (exitAnalysis.recommendation === 'ADD_POSITION') {
      status = 'STRONG BUY';
      statusEmoji = '🚀';
      action = 'AI strong buy signal - consider adding to position';
      priority = 'HIGH';
    }
    else if (exitAnalysis.recommendation === 'HOLD_STRONG') {
      status = 'STRONG HOLD';
      statusEmoji = '💪';
      action = 'AI elevated signal - strong conviction hold';
      priority = 'MEDIUM';
    }
    else if (exitAnalysis.recommendation === 'REDUCE' || (isProfit && isProfitSignificant && isHighRisk)) {
      status = 'TAKE PROFITS';
      statusEmoji = '💰';
      // Calculate exact shares to sell
      const sharesToSell = this.calculateSharesToSell(trade, 'PARTIAL', unrealizedPnL);
      action = isProfit ? 
        `Sell ${sharesToSell.shares} shares (${sharesToSell.percent}%) to lock in $${sharesToSell.profitLocked.toLocaleString()}` : 
        `Sell ${sharesToSell.shares} shares (${sharesToSell.percent}%) to reduce risk exposure`;
      priority = 'HIGH';
    }
    else if (isHighRisk && !isProfit) {
      status = 'RISK ALERT';
      statusEmoji = '⚠️';
      // Calculate exact stop loss value
      const currentPrice = trade.currentPrice || 0;
      const newStopLoss = this.calculateOptimalStopLoss(trade, currentPrice, riskAssessment);
      action = `Move stop loss to $${newStopLoss.price.toFixed(2)} (${newStopLoss.reason}) OR sell ${this.calculateSharesToSell(trade, 'REDUCE', unrealizedPnL).shares} shares`;
      priority = 'HIGH';
    }
    else if (exitAnalysis.recommendation === 'HOLD' && healthScore >= 70) {
      status = 'LOOKING GOOD';
      statusEmoji = '✅';
      action = 'Continue holding, monitor daily';
      priority = 'LOW';
    }
    else {
      status = 'WATCH CLOSELY';
      statusEmoji = '👀';
      action = 'Monitor for changes, be ready to act';
      priority = 'MEDIUM';
    }
    
    // Calculate key price levels for action
    const currentPrice = trade.currentPrice || 0;
    const stopLoss = trade.stopLoss || 0;
    const entryPrice = trade.entryPrice || 0;
    
    let keyLevel = null;
    if (stopLoss > 0) {
      const stopDistance = ((currentPrice - stopLoss) / currentPrice * 100).toFixed(1);
      keyLevel = `Stop: $${stopLoss.toFixed(2)} (${stopDistance}% away)`;
    } else if (entryPrice > 0) {
      const entryDistance = ((currentPrice - entryPrice) / entryPrice * 100).toFixed(1);
      keyLevel = `Entry: $${entryPrice.toFixed(2)} (${entryDistance}% ${parseFloat(entryDistance) > 0 ? 'above' : 'below'})`;
    }
    
    // Simplified reasoning
    let reason = '';
    if (isProfit && isProfitSignificant) {
      reason = `${priceChange}% gain in ${daysHeld} days`;
    } else if (!isProfit && Math.abs(parseFloat(priceChange)) >= 3) {
      reason = `${priceChange}% loss, risk increasing`;
    } else {
      reason = `AI grade ${aiGrade}, ${exitAnalysis.aiConfidence}% confidence`;
    }
    
    return {
      // Main Status
      status,
      statusEmoji,
      action,
      priority,
      
      // Key Numbers
      profit: isProfit ? `+$${Math.abs(unrealizedPnL).toLocaleString()}` : `-$${Math.abs(unrealizedPnL).toLocaleString()}`,
      profitPercent: `${priceChange}%`,
      aiGrade,
      healthScore: `${healthScore}/100`,
      
      // Action Details
      nextAction: this.getNextActionDetails(exitAnalysis, riskAssessment, tradeMetrics, trade),
      keyLevel,
      reason,
      
      // Timing
      reviewBy: exitAnalysis.nextReview,
      daysHeld,
      
      // Quick Risk Check
      riskLevel: riskAssessment.overallRisk,
      riskEmoji: riskAssessment.overallRisk === 'HIGH' ? '🔴' : 
                riskAssessment.overallRisk === 'MEDIUM' ? '🟡' : '🟢'
    };
  }
  
  /**
   * Get specific next action details
   */
  getNextActionDetails(exitAnalysis, riskAssessment, tradeMetrics, trade) {
    const recommendation = exitAnalysis.recommendation;
    const positionRisk = riskAssessment.positionRisk;
    const { unrealizedPnL, priceChange } = tradeMetrics;
    const isProfit = unrealizedPnL > 0;
    const profitPercent = Math.abs(parseFloat(priceChange));
    const currentPrice = trade.currentPrice || 0;
    
    console.log(`🎯 [NEXT-ACTION] ${trade.ticker}: recommendation=${recommendation}, isProfit=${isProfit}, profitPercent=${profitPercent}%`);
    
    if (recommendation === 'EXIT') {
      const limitPrice = currentPrice * (isProfit ? 0.98 : 1.02); // 2% buffer
      return {
        action: 'SELL',
        urgency: 'Immediate',
        details: `Sell ALL ${trade.quantity} shares. Limit order at $${limitPrice.toFixed(2)} or market order if urgent`
      };
    }
    
    if (recommendation === 'REDUCE' || (isProfit && profitPercent >= 8)) {
      console.log(`🎯 [NEXT-ACTION] ${trade.ticker}: REDUCE/PARTIAL path triggered`);
      const sellData = this.calculateSharesToSell(trade, 'PARTIAL', unrealizedPnL);
      
      // Smart recommendation based on transaction history
      if (sellData.hasPartialSales && sellData.percentSoldPreviously >= 25) {
        // If significant portion already sold, recommend holding
        console.log(`🎯 [NEXT-ACTION] ${trade.ticker}: Already sold enough, recommending HOLD`);
        return {
          action: 'HOLD_MONITOR',
          urgency: 'Daily check',
          details: `Already sold ${sellData.totalSoldPreviously} shares (${sellData.percentSoldPreviously.toFixed(0)}%). Hold remaining ${trade.quantity} shares and monitor`
        };
      } else {
        // Normal partial sell recommendation
        console.log(`🎯 [NEXT-ACTION] ${trade.ticker}: Recommending PARTIAL_SELL, remaining: ${sellData.remainingShares}`);
        return {
          action: 'PARTIAL_SELL',
          urgency: 'Today',
          details: `Sell ${sellData.shares} shares (${sellData.percent}%) to lock in $${sellData.profitLocked.toLocaleString()} profit. Keep ${sellData.remainingShares} shares`
        };
      }
    }
    
    if (positionRisk === 'HIGH' && !isProfit) {
      const stopData = this.calculateOptimalStopLoss(trade, currentPrice, riskAssessment);
      const sellData = this.calculateSharesToSell(trade, 'REDUCE', unrealizedPnL);
      return {
        action: 'TIGHTEN_STOP',
        urgency: 'Today',
        details: `Update stop loss to $${stopData.price.toFixed(2)} (${stopData.reason}) OR sell ${sellData.shares} shares to reduce exposure`
      };
    }
    
    if (exitAnalysis.aiConfidence >= 80 && exitAnalysis.aiGrade >= 'B') {
      return {
        action: 'HOLD_MONITOR',
        urgency: 'Daily check',
        details: `Position healthy with ${trade.quantity} shares. Monitor for AI grade changes or 5%+ price moves`
      };
    }

    // 🚀 Enhanced: Calculate shares to monitor considering potential sell recommendation
    let sharesToMonitor = trade.quantity;
    
    // Check if there's a pending sell recommendation for partial profits
    console.log(`🎯 [NEXT-ACTION] ${trade.ticker}: Default MONITOR path, checking for profit-taking opportunity`);
    if (isProfit && profitPercent >= 5) {
      const sellData = this.calculateSharesToSell(trade, 'PARTIAL', unrealizedPnL);
      
      // Always consider sell recommendation from main action logic
      // If main action would sell shares, nextAction should show remaining shares
      if (sellData.shares > 0) {
        sharesToMonitor = sellData.remainingShares;
        console.log(`📊 [NEXT-ACTION] ${trade.ticker}: Main action recommends selling ${sellData.shares} shares, will monitor ${sharesToMonitor} remaining`);
      } else {
        console.log(`📊 [NEXT-ACTION] ${trade.ticker}: No selling recommended, monitoring all ${sharesToMonitor} shares`);
      }
    }
    
    return {
      action: 'MONITOR',
      urgency: '2x daily',
      details: `Watch ${sharesToMonitor} shares closely. Set alerts at ${(currentPrice * 1.05).toFixed(2)} (upside) and ${(currentPrice * 0.95).toFixed(2)} (downside)`
    };
  }

  /**
   * Calculate exact number of shares to sell for profit taking or risk reduction
   * Now considers transaction history for smarter recommendations
   */
  calculateSharesToSell(trade, actionType, unrealizedPnL) {
    const totalShares = trade.quantity || 0; // This is now the current/remaining quantity
    const originalShares = trade.originalQuantity || totalShares;
    const hasTransactions = trade.tradeTransactions && trade.tradeTransactions.length > 0;
    
    // Calculate how much has already been sold
    const totalSold = hasTransactions ? 
      trade.tradeTransactions
        .filter(t => t.transactionType === 'Exit')
        .reduce((sum, t) => sum + (t.quantity || 0), 0) : 0;
    const percentAlreadySold = originalShares > 0 ? (totalSold / originalShares) * 100 : 0;
    
    console.log(`🔢 [SELL-CALC] ${trade.ticker}: Total: ${totalShares}, Original: ${originalShares}, Already sold: ${totalSold} (${percentAlreadySold.toFixed(1)}%)`);
    
    let percentToSell = 0;
    
    // Determine percentage based on action type and profit/loss situation
    if (actionType === 'PARTIAL') {
      // For profit taking - adjust based on what's already been sold
      if (unrealizedPnL > 0) {
        const profitPercent = Math.abs(parseFloat(((trade.currentPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2)));
        
        // Base percentage recommendation
        if (profitPercent >= 15) percentToSell = 50; // Take 50% at 15%+ gains
        else if (profitPercent >= 10) percentToSell = 40; // Take 40% at 10%+ gains
        else if (profitPercent >= 7) percentToSell = 30; // Take 30% at 7%+ gains
        else percentToSell = 25; // Take 25% at 5%+ gains
        
        // 🚀 Smart adjustment: If we've already sold some, reduce further selling
        if (percentAlreadySold >= 30) {
          percentToSell = Math.max(10, percentToSell - 15); // Much more conservative
          console.log(`🧠 [SELL-CALC] ${trade.ticker}: Already sold ${percentAlreadySold.toFixed(1)}%, reducing recommendation to ${percentToSell}%`);
        } else if (percentAlreadySold >= 20) {
          percentToSell = Math.max(15, percentToSell - 10); // More conservative
          console.log(`🧠 [SELL-CALC] ${trade.ticker}: Already sold ${percentAlreadySold.toFixed(1)}%, reducing recommendation to ${percentToSell}%`);
        } else if (percentAlreadySold >= 10) {
          percentToSell = Math.max(20, percentToSell - 5); // Slightly more conservative
          console.log(`🧠 [SELL-CALC] ${trade.ticker}: Already sold ${percentAlreadySold.toFixed(1)}%, reducing recommendation to ${percentToSell}%`);
        }
      } else {
        percentToSell = 30; // Reduce by 30% if losing but need to reduce
      }
    } else if (actionType === 'REDUCE') {
      // For risk reduction
      const lossPercent = Math.abs(parseFloat(((trade.currentPrice - trade.entryPrice) / trade.entryPrice * 100).toFixed(2)));
      if (lossPercent >= 10) percentToSell = 50; // Cut 50% at 10%+ loss
      else if (lossPercent >= 7) percentToSell = 40; // Cut 40% at 7%+ loss
      else if (lossPercent >= 5) percentToSell = 30; // Cut 30% at 5%+ loss
      else percentToSell = 25; // Cut 25% for other risk factors
    }
    
    const sharesToSell = Math.floor(totalShares * (percentToSell / 100));
    const profitLocked = unrealizedPnL * (percentToSell / 100);
    const remainingAfterSale = totalShares - sharesToSell;
    
    console.log(`📊 [SELL-CALC] ${trade.ticker}: Recommending ${sharesToSell} shares (${percentToSell}%), leaving ${remainingAfterSale} shares`);
    
    return {
      shares: sharesToSell,
      percent: percentToSell,
      profitLocked: Math.abs(profitLocked),
      remainingShares: remainingAfterSale,
      remainingValue: remainingAfterSale * (trade.currentPrice || 0),
      // Add context for next action
      hasPartialSales: hasTransactions,
      totalSoldPreviously: totalSold,
      percentSoldPreviously: percentAlreadySold
    };
  }

  /**
   * Calculate optimal stop loss price based on current conditions
   */
  calculateOptimalStopLoss(trade, currentPrice, riskAssessment) {
    const entryPrice = trade.entryPrice || 0;
    const currentStop = trade.stopLoss || 0;
    
    // Different stop loss strategies based on situation
    let newStopPrice = currentStop;
    let reason = '';
    
    // If position is profitable, use trailing stop
    if (currentPrice > entryPrice) {
      // Trailing stop: 3-5% below current price
      const trailingStop = currentPrice * 0.95; // 5% trailing stop
      newStopPrice = Math.max(trailingStop, entryPrice * 1.02); // Never below 2% above entry
      reason = '5% trailing stop to protect gains';
    }
    // If position is losing, tighten stop based on risk level
    else {
      const lossPercent = Math.abs((currentPrice - entryPrice) / entryPrice * 100);
      
      if (riskAssessment.overallRisk === 'HIGH') {
        // Aggressive stop: 2-3% below current price
        newStopPrice = currentPrice * 0.97; // 3% below current
        reason = '3% stop due to high risk conditions';
      } else {
        // Standard stop: 5% below current price or 8% below entry (whichever is higher)
        const standardStop = currentPrice * 0.95;
        const maxLossStop = entryPrice * 0.92; // Max 8% loss from entry
        newStopPrice = Math.max(standardStop, maxLossStop);
        reason = lossPercent >= 6 ? 'Limit max loss to 8% from entry' : '5% stop below current price';
      }
    }
    
    // Round to 2 decimal places
    newStopPrice = Math.round(newStopPrice * 100) / 100;
    
    // Calculate the impact
    const stopDistance = Math.abs(currentPrice - newStopPrice) / currentPrice * 100;
    const potentialLoss = (newStopPrice - entryPrice) * (trade.quantity || 0);
    
    return {
      price: newStopPrice,
      reason,
      distanceFromCurrent: `${stopDistance.toFixed(1)}%`,
      potentialLoss: potentialLoss,
      currentStop: currentStop,
      improvement: currentStop > 0 ? `${((newStopPrice - currentStop) / currentStop * 100).toFixed(1)}% better` : 'New stop set'
    };
  }
}

module.exports = TradeHealthAnalyzer;
