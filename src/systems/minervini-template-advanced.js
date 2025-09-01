/**
 * Minervini Template Advanced - Institutional Grade System
 * 
 * Based on Mark Minervini's "Template" methodology from "Think & Trade Like a Champion"
 * Enhanced for institutional traders with strict 8-criteria template validation.
 * 
 * CONFIGURABLE THRESHOLDS:
 * Thresholds are now managed in src/config/trading-thresholds.js
 * Change ACTIVE_CONFIG in that file to switch between:
 * - ULTRA_SELECTIVE: Maximum discipline, minimal signals
 * - SELECTIVE: Balanced approach, moderate signals  
 * - RELAXED: More opportunities, higher signal count
 * 
 * The Minervini Template 8 Criteria:
 * 1. Stock price > 150 SMA AND 150 SMA trending up
 * 2. Stock price > 200 SMA AND 200 SMA trending up  
 * 3. 150 SMA > 200 SMA (trend hierarchy)
 * 4. Stock price within 25% of 52-week high
 * 5. Stock price at least 30% above 52-week low
 * 6. Relative Strength (RS) Rating > 70 (vs SPY)
 * 7. Volume expansion on breakouts (50%+ above average)
 * 8. Strong fundamentals (EPS/Revenue growth - proxy via momentum)
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 2.0.0 - Centralized Configuration
 * Last Updated: 2024
 */

const yahooFinance = require('yahoo-finance2').default;
const { getSystemThresholds } = require('../config/trading-thresholds');

class MinerviniTemplateAdvanced {
  constructor() {
    this.systemId = 'minervini_template_advanced';
    this.name = 'Minervini Template Advanced (Institutional)';
    this.version = '1.0.0';
    this.description = '8-criteria template system for institutional momentum investing';
  }

  /**
   * Main analysis method for Minervini Template Advanced system
   * @param {Object} data - Technical data with OHLCV and indicators
   * @param {Object} options - Analysis options including capital, symbol, currentPrice, aiSignals
   * @returns {Object} Complete Template analysis with BUY/WATCH/AVOID + confidence
   */
  analyze(data, options = {}) {
    // console.log(`  🏛️ TEMPLATE: Starting Minervini Template Advanced analysis...`);

    try {
      // Get current threshold configuration
      const thresholds = getSystemThresholds('minervini_template_advanced');
      
      const { indicators, series } = data;
      
      // Validate required data
      if (!this.validateData(indicators, series)) {
        return this.createAvoidSignal('INVALID_DATA', 'Insufficient data for Template analysis');
      }

      // Extract analysis parameters
      const { capital, symbol, currentPrice, aiSignals } = options;
      const completedDaily = series.daily.slice(0, -1); // Use only completed candles
      const latest = completedDaily[completedDaily.length - 1];
      const entryPrice = currentPrice || latest?.close || 0;

      if (entryPrice <= 0) {
        return this.createAvoidSignal('INVALID_PRICE', 'Invalid current price for Template analysis');
      }

      console.log(`  🏛️ TEMPLATE: Analyzing ${symbol || 'stock'} at $${entryPrice.toFixed(2)}`);

      // Execute the 8-criteria Template analysis
      const templateAnalysis = this.executeTemplateAnalysis(completedDaily, indicators, entryPrice, thresholds);

      // Calculate risk/reward using Template methodology
      const riskAssessment = this.assessRisk(templateAnalysis, completedDaily, entryPrice);

      // Generate final decision with AI enhancement
      const finalDecision = this.makeFinalDecisionWithAI(
        templateAnalysis, 
        riskAssessment, 
        completedDaily, 
        { capital, symbol, entryPrice },
        aiSignals,
        thresholds
      );

      // Calculate signal quality for gate engine integration
      const signalQuality = this.calculateSignalQuality(finalDecision.confidence, templateAnalysis);

      // Build execution plan
      const execution = this.buildExecutionPlan(finalDecision, riskAssessment, templateAnalysis, entryPrice, capital, completedDaily);

      console.log(`  🏛️ TEMPLATE: Decision: ${finalDecision.action}, Confidence: ${(finalDecision.confidence * 100).toFixed(1)}%`);

      return {
        system: this.systemId,
        systemName: this.name,
        decision: finalDecision.action,
        confidence: finalDecision.confidence,
        reasoning: finalDecision.reasoning,
        stopLoss: riskAssessment.stopLoss,
        targets: riskAssessment.targets,
        riskReward: riskAssessment.riskReward,
        execution: execution,
        signalQuality: signalQuality,
        templateAnalysis: templateAnalysis,
        factors: finalDecision.factors,
        aiEnhanced: finalDecision.aiEnhanced || false,
        aiReasoning: finalDecision.aiReasoning || 'No AI enhancement applied',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('  🏛️ TEMPLATE: Analysis error:', error.message);
      return this.createAvoidSignal('ANALYSIS_ERROR', `Template analysis failed: ${error.message}`);
    }
  }

  /**
   * Execute the 8-criteria Minervini Template analysis
   */
  executeTemplateAnalysis(dailyData, indicators, currentPrice, thresholds) {
    console.log(`  🏛️ TEMPLATE: Executing 8-criteria template validation...`);

    const criteria = {};
    const reasoning = [];
    let totalScore = 0;

    // 🚨 EMERGENCY FIX: Get SMA data from correct location (arrays or latest values)
    const sma150 = indicators.base?.sma150 || [];
    const sma200 = indicators.base?.sma200 || [];
    
    // Handle both array format and single value format
    let currentSMA150, currentSMA200, prevSMA150, prevSMA200;
    
    if (sma150.length > 0) {
      // Array format
      currentSMA150 = sma150[sma150.length - 1];
      prevSMA150 = sma150[sma150.length - 10] || currentSMA150; // 10 days ago
    } else {
      // Single value format from latest
      currentSMA150 = indicators.latest?.sma150;
      prevSMA150 = currentSMA150; // Fallback for trend calculation
    }
    
    if (sma200.length > 0) {
      // Array format
      currentSMA200 = sma200[sma200.length - 1];
      prevSMA200 = sma200[sma200.length - 10] || currentSMA200; // 10 days ago
    } else {
      // Single value format from latest
      currentSMA200 = indicators.latest?.sma200;
      prevSMA200 = currentSMA200; // Fallback for trend calculation
    }
    
    console.log(`  🏛️ TEMPLATE: SMA150=${currentSMA150?.toFixed(2)}, SMA200=${currentSMA200?.toFixed(2)}, Price=${currentPrice?.toFixed(2)}`);
    
    // Fallback if still no data
    if (!currentSMA150 || !currentSMA200) {
      return this.createAvoidSignal('MISSING_SMA', 'Missing SMA150/SMA200 data for Template analysis');
    }

    // Calculate 52-week high/low
    const last252Days = dailyData.slice(-252); // 1 year
    const high52Week = Math.max(...last252Days.map(d => d.high));
    const low52Week = Math.min(...last252Days.map(d => d.low));

    // Criterion 1: Stock price > 150 SMA AND 150 SMA trending up
    const criterion1Pass = currentPrice > currentSMA150 && currentSMA150 > prevSMA150;
    const criterion1Score = criterion1Pass ? 1.0 : 0.0;
    criteria.criterion1 = {
      passed: criterion1Pass,
      value: currentPrice,
      threshold: currentSMA150,
      score: criterion1Score,
      details: `Price $${currentPrice.toFixed(2)} ${criterion1Pass ? '>' : '≤'} SMA150 $${currentSMA150?.toFixed(2)}, SMA150 trending ${currentSMA150 > prevSMA150 ? 'UP' : 'DOWN'}`
    };
    totalScore += criterion1Score;
    if (criterion1Pass) reasoning.push('Price above rising 150-day moving average');

    // Criterion 2: Stock price > 200 SMA AND 200 SMA trending up
    const criterion2Pass = currentPrice > currentSMA200 && currentSMA200 > prevSMA200;
    const criterion2Score = criterion2Pass ? 1.0 : 0.0;
    criteria.criterion2 = {
      passed: criterion2Pass,
      value: currentPrice,
      threshold: currentSMA200,
      score: criterion2Score,
      details: `Price $${currentPrice.toFixed(2)} ${criterion2Pass ? '>' : '≤'} SMA200 $${currentSMA200?.toFixed(2)}, SMA200 trending ${currentSMA200 > prevSMA200 ? 'UP' : 'DOWN'}`
    };
    totalScore += criterion2Score;
    if (criterion2Pass) reasoning.push('Price above rising 200-day moving average');

    // Criterion 3: 150 SMA > 200 SMA (trend hierarchy)
    const criterion3Pass = currentSMA150 > currentSMA200;
    const criterion3Score = criterion3Pass ? 1.0 : 0.0;
    criteria.criterion3 = {
      passed: criterion3Pass,
      value: currentSMA150,
      threshold: currentSMA200,
      score: criterion3Score,
      details: `SMA150 $${currentSMA150?.toFixed(2)} ${criterion3Pass ? '>' : '≤'} SMA200 $${currentSMA200?.toFixed(2)}`
    };
    totalScore += criterion3Score;
    if (criterion3Pass) reasoning.push('Moving average hierarchy correctly aligned');

    // Criterion 4: Stock price within 25% of 52-week high
    const distanceFromHigh = (high52Week - currentPrice) / high52Week;
    const criterion4Pass = distanceFromHigh <= 0.25;
    const criterion4Score = criterion4Pass ? (1.0 - distanceFromHigh * 2) : 0.0; // Scale score based on proximity
    criteria.criterion4 = {
      passed: criterion4Pass,
      value: distanceFromHigh * 100,
      threshold: 25,
      score: criterion4Score,
      details: `Price $${currentPrice.toFixed(2)} is ${(distanceFromHigh * 100).toFixed(1)}% from 52-week high $${high52Week.toFixed(2)}`
    };
    totalScore += criterion4Score;
    if (criterion4Pass) reasoning.push(`Within 25% of 52-week high (${(distanceFromHigh * 100).toFixed(1)}% away)`);

    // Criterion 5: Stock price at least 30% above 52-week low
    const distanceFromLow = (currentPrice - low52Week) / low52Week;
    const criterion5Pass = distanceFromLow >= 0.30;
    const criterion5Score = criterion5Pass ? Math.min(1.0, distanceFromLow / 0.5) : 0.0; // Scale up to 50%
    criteria.criterion5 = {
      passed: criterion5Pass,
      value: distanceFromLow * 100,
      threshold: 30,
      score: criterion5Score,
      details: `Price $${currentPrice.toFixed(2)} is ${(distanceFromLow * 100).toFixed(1)}% above 52-week low $${low52Week.toFixed(2)}`
    };
    totalScore += criterion5Score;
    if (criterion5Pass) reasoning.push(`Strong recovery: ${(distanceFromLow * 100).toFixed(1)}% above 52-week low`);

    // Criterion 6: Relative Strength Rating (CONFIGURABLE THRESHOLD)
    const rsi14 = indicators.latest?.rsi || indicators.base?.rsi14 || 50;
    const momentum = indicators.base?.momentum || 0;
    const relativeStrength = Math.min(100, Math.max(0, (rsi14 + momentum * 10) / 2));
    const criterion6Pass = relativeStrength > thresholds.criterion6_relative_strength;
    const criterion6Score = criterion6Pass ? (relativeStrength - 50) / 50 : relativeStrength / thresholds.criterion6_relative_strength;
    criteria.criterion6 = {
      passed: criterion6Pass,
      value: relativeStrength,
      threshold: thresholds.criterion6_relative_strength,
      score: criterion6Score,
      details: `Relative Strength ${relativeStrength.toFixed(1)} ${criterion6Pass ? '>' : '≤'} ${thresholds.criterion6_relative_strength} (RSI: ${rsi14?.toFixed(1)}, Momentum: ${momentum?.toFixed(3)})`
    };
    totalScore += criterion6Score;
    if (criterion6Pass) reasoning.push(`Exceptional relative strength rating: ${relativeStrength.toFixed(1)}`);

    // Criterion 7: Volume expansion (CONFIGURABLE THRESHOLD)
    const avgVolume = this.calculateAverageVolume(dailyData.slice(-50)); // 50-day average
    const recentVolume = this.calculateAverageVolume(dailyData.slice(-5)); // Recent 5-day average
    const volumeExpansion = recentVolume / avgVolume;
    const criterion7Pass = volumeExpansion >= thresholds.criterion7_volume_multiplier;
    const criterion7Score = criterion7Pass ? Math.min(1.0, (volumeExpansion - 1.2) / 0.8) : volumeExpansion / thresholds.criterion7_volume_multiplier;
    criteria.criterion7 = {
      passed: criterion7Pass,
      value: volumeExpansion,
      threshold: thresholds.criterion7_volume_multiplier,
      score: criterion7Score,
      details: `Volume expansion ${volumeExpansion.toFixed(2)}x ${criterion7Pass ? '≥' : '<'} ${thresholds.criterion7_volume_multiplier}x average`
    };
    totalScore += criterion7Score;
    if (criterion7Pass) reasoning.push(`Exceptional volume expansion: ${volumeExpansion.toFixed(2)}x average`);

    // Criterion 8: Fundamental strength (CONFIGURABLE THRESHOLD)
    const priceChange20 = dailyData.length >= 20 ? 
      (currentPrice - dailyData[dailyData.length - 21].close) / dailyData[dailyData.length - 21].close : 0;
    const fundamentalProxy = Math.min(100, Math.max(0, priceChange20 * 500 + 50)); // Scale to 0-100
    const criterion8Pass = fundamentalProxy > thresholds.criterion8_fundamental_score;
    const criterion8Score = criterion8Pass ? (fundamentalProxy - 40) / 60 : fundamentalProxy / thresholds.criterion8_fundamental_score;
    criteria.criterion8 = {
      passed: criterion8Pass,
      value: fundamentalProxy,
      threshold: thresholds.criterion8_fundamental_score,
      score: criterion8Score,
      details: `Fundamental proxy ${fundamentalProxy.toFixed(1)} ${criterion8Pass ? '>' : '≤'} ${thresholds.criterion8_fundamental_score} (20-day momentum: ${(priceChange20 * 100).toFixed(1)}%)`
    };
    totalScore += criterion8Score;
    if (criterion8Pass) reasoning.push(`Exceptional fundamental strength: ${fundamentalProxy.toFixed(1)}/100`);

    // Calculate overall metrics
    const overallScore = totalScore / 8.0; // Normalize to 0-1
    const passedCriteria = Object.values(criteria).filter(c => c.passed).length;
    
    let templateGrade = 'F';
    let confidence = 0;
    
    // Configurable grading system based on thresholds
    if (passedCriteria >= 6 && overallScore >= thresholds.grade_A_plus) {
      templateGrade = 'A+';
      confidence = 0.95;
    } else if (passedCriteria >= 5 && overallScore >= thresholds.grade_A) {
      templateGrade = 'A';
      confidence = 0.85;
    } else if (passedCriteria >= 4 && overallScore >= thresholds.grade_B_plus) {
      templateGrade = 'B+';
      confidence = 0.75;
    } else if (passedCriteria >= 3 && overallScore >= thresholds.grade_B) {
      templateGrade = 'B';
      confidence = 0.65;
    } else if (passedCriteria >= 2 && overallScore >= thresholds.grade_C) {
      templateGrade = 'C';
      confidence = 0.55;
    } else if (passedCriteria >= 2 && overallScore >= 0.40) {
      templateGrade = 'D';
      confidence = 0.40;
    } else {
      templateGrade = 'F';
      confidence = 0.25;
    }

    console.log(`  🏛️ TEMPLATE: Score ${(overallScore * 100).toFixed(1)}% (${passedCriteria}/8 criteria), Grade: ${templateGrade}`);

    return {
      criteria,
      overallScore,
      templateGrade,
      confidence,
      reasoning
    };
  }

  /**
   * 🤖 AI-ENHANCED: Make final trading decision with AI momentum validation
   */
  makeFinalDecisionWithAI(templateAnalysis, riskAssessment, dailyData, options, aiSignals = null, thresholds) {
    // Get the base Template decision first
    const baseDecision = this.makeFinalDecision(templateAnalysis, riskAssessment, dailyData, options, thresholds);
    
    // If no AI signals, return base decision
    if (!aiSignals) {
      return {
        ...baseDecision,
        aiEnhanced: false,
        aiReasoning: 'No AI signals provided'
      };
    }

    // Apply AI enhancements to Template's strict requirements
    return this.applyTemplateAIEnhancement(baseDecision, templateAnalysis, aiSignals);
  }

  /**
   * 🤖 TEMPLATE AI ENHANCEMENT: Upgrade strong Template setups with AI confirmation
   */
  applyTemplateAIEnhancement(baseDecision, templateAnalysis, aiSignals) {
    const { momentum, conviction, bias } = aiSignals;
    let enhancedAction = baseDecision.action;
    let enhancedConfidence = baseDecision.confidence;
    let aiReasoningParts = [];
    let aiEnhanced = false;

    // ENHANCEMENT 1: Allowed grades + Strong AI = BUY (even if action was WATCH)
    if (thresholds.buy_allowed_grades.includes(templateAnalysis.templateGrade) && 
        baseDecision.action === 'WATCH') {
      if (momentum === 'BULLISH' && conviction === 'HIGH' && bias === 'BULLISH') {
        enhancedAction = 'BUY';
        enhancedConfidence = Math.min(0.95, enhancedConfidence + 0.15);
        aiReasoningParts.push('AI confirms strong Template setup (A/A+ grade) with high conviction bullish momentum');
        aiEnhanced = true;
      } else if (momentum === 'BULLISH' && conviction === 'MEDIUM') {
        enhancedAction = 'BUY';
        enhancedConfidence = Math.min(0.90, enhancedConfidence + 0.10);
        aiReasoningParts.push('AI confirms Template setup with medium conviction bullish momentum');
        aiEnhanced = true;
      }
    }

    // ENHANCEMENT 2: Grade B Template + Perfect AI = BUY
    else if (templateAnalysis.templateGrade === 'B' && 
             baseDecision.action === 'WATCH' &&
             momentum === 'BULLISH' && conviction === 'HIGH' && bias === 'BULLISH') {
      enhancedAction = 'BUY';
      enhancedConfidence = Math.min(0.85, enhancedConfidence + 0.12);
      aiReasoningParts.push('AI upgrades solid Template setup (Grade B) with perfect momentum alignment');
      aiEnhanced = true;
    }

    // ENHANCEMENT 3: Confidence adjustments based on AI conviction
    if (!aiEnhanced) {
      if (conviction === 'HIGH' && momentum === 'BULLISH') {
        enhancedConfidence = Math.min(0.95, enhancedConfidence + 0.05);
        aiReasoningParts.push('AI high conviction bullish momentum adds confidence');
      } else if (conviction === 'HIGH' && momentum === 'BEARISH') {
        enhancedConfidence = Math.max(0.15, enhancedConfidence - 0.08);
        aiReasoningParts.push('AI high conviction bearish momentum reduces confidence');
      }
    }

    return {
      action: enhancedAction,
      confidence: enhancedConfidence,
      reasoning: baseDecision.reasoning,
      factors: baseDecision.factors,
      aiEnhanced: aiEnhanced,
      aiReasoning: aiReasoningParts.join('; ') || 'No significant AI adjustments',
      originalTemplateAction: baseDecision.action,
      aiSignals: aiSignals
    };
  }

  /**
   * Make final trading decision based on Template analysis
   */
  makeFinalDecision(templateAnalysis, riskAssessment, dailyData, options, thresholds) {
    const { templateGrade, confidence, reasoning, overallScore } = templateAnalysis;
    const { riskReward } = riskAssessment;

    let action = 'AVOID';
    let finalConfidence = confidence;
    let decisionReasoning = reasoning.join('; ');

    // Configurable decision logic based on buy_allowed_grades
    if (thresholds.buy_allowed_grades.includes(templateGrade)) {
      action = 'BUY';
      if (templateGrade === 'A+') {
        finalConfidence = Math.min(0.95, confidence + 0.05);
        decisionReasoning = `Exceptional Template setup (A+): ${decisionReasoning}`;
      } else if (templateGrade === 'A') {
        finalConfidence = Math.max(0.85, confidence);
        decisionReasoning = `Excellent Template setup (A): ${decisionReasoning}`;
      } else if (templateGrade === 'B+') {
        finalConfidence = Math.max(0.75, confidence);
        decisionReasoning = `Strong Template setup (B+): ${decisionReasoning}`;
      } else if (templateGrade === 'B') {
        finalConfidence = Math.max(0.65, confidence);
        decisionReasoning = `Good Template setup (B): ${decisionReasoning}`;
      }
    } else if (templateGrade === 'B+' || templateGrade === 'B') {
      action = 'WATCH';
      finalConfidence = Math.max(0.60, confidence);
      decisionReasoning = `Good Template setup (${templateGrade}), monitor for improvement: ${decisionReasoning}`;
    } else if (templateGrade === 'C') {
      action = 'WATCH';
      finalConfidence = Math.max(0.45, confidence);
      decisionReasoning = `Moderate Template setup (C), watchlist candidate: ${decisionReasoning}`;
    } else if (templateGrade === 'D' && riskReward >= 2.5) {
      action = 'WATCH';
      finalConfidence = Math.max(0.40, confidence);
      decisionReasoning = `Weak Template setup (D) but high risk/reward: ${decisionReasoning}`;
    } else {
      action = 'AVOID';
      finalConfidence = Math.max(0.20, confidence * 0.8);
      decisionReasoning = `Template criteria insufficient (Grade: ${templateGrade}, R/R: ${riskReward.toFixed(2)}): ${decisionReasoning}`;
    }

    return {
      action,
      confidence: finalConfidence,
      reasoning: decisionReasoning,
      factors: {
        templateGrade,
        overallScore,
        criteriaCount: Object.values(templateAnalysis.criteria).filter(c => c.passed).length,
        riskReward
      }
    };
  }

  /**
   * Assess risk and calculate stop losses and targets using Template methodology
   */
  assessRisk(templateAnalysis, dailyData, currentPrice) {
    const latest = dailyData[dailyData.length - 1];
    const atr = this.calculateATR(dailyData.slice(-14));

    // Template-based stop loss: 7-8% or key support level
    const percentStop = currentPrice * 0.925; // 7.5% stop
    const atrStop = currentPrice - (atr * 2.0); // 2 ATR stop
    const stopLoss = Math.max(percentStop, atrStop); // Use the higher (closer) stop

    // Template targets based on risk/reward and breakout methodology
    const riskAmount = currentPrice - stopLoss;
    const targets = [
      currentPrice + (riskAmount * 2.0), // 2R target
      currentPrice + (riskAmount * 3.0), // 3R target
      currentPrice + (riskAmount * 5.0)  // 5R target (Minervini's big winner target)
    ];

    const riskReward = riskAmount > 0 ? (targets[0] - currentPrice) / riskAmount : 0;
    const riskPercentage = (currentPrice - stopLoss) / currentPrice;

    return {
      stopLoss: Math.round(stopLoss * 100) / 100,
      targets: targets.map(t => Math.round(t * 100) / 100),
      riskReward: Math.round(riskReward * 100) / 100,
      atr: Math.round(atr * 100) / 100,
      riskPercentage: Math.round(riskPercentage * 10000) / 100
    };
  }

  /**
   * Build execution plan with Template-specific entry/exit strategies
   */
  buildExecutionPlan(decision, riskAssessment, templateAnalysis, entryPrice, capital = 100000, dailyData) {
    if (decision.action === 'AVOID') return null;

    const positionSizing = this.calculateTemplatePositionSizing(
      decision.confidence, 
      { capital, entryPrice }, 
      riskAssessment, 
      templateAnalysis
    );

    return {
      entryStrategy: this.buildPreciseTemplateEntryStrategy(templateAnalysis, decision.action, riskAssessment, dailyData, entryPrice),
      exitStrategy: this.buildPreciseTemplateExitStrategy(riskAssessment, templateAnalysis, decision.action, dailyData, entryPrice),
      positionSizing: positionSizing,
      executionNotes: this.generateTemplateExecutionNotes(templateAnalysis, decision.action)
    };
  }

  /**
   * Build dynamic Template entry strategy with calculated parameters
   */
  buildPreciseTemplateEntryStrategy(templateAnalysis, signal, riskAssessment, dailyData, currentPrice) {
    const latest = dailyData[dailyData.length - 1];
    const atr = this.calculateATR(dailyData.slice(-14));
    const avgVolume = this.calculateAverageVolume(dailyData.slice(-20));
    const volatility = this.calculateVolatility(dailyData.slice(-10));
    
    // Calculate dynamic entry parameters
    const entryZone = this.calculateEntryZone(currentPrice, atr, volatility);
    const volumeThreshold = this.calculateVolumeThreshold(avgVolume, templateAnalysis.templateGrade);
    const timeWindows = this.calculateOptimalTimeWindows(volatility);
    const slippageAllowance = this.calculateDynamicSlippage(volatility, templateAnalysis.templateGrade);
    
    const strategy = {
      type: signal === 'BUY' ? 'IMMEDIATE' : 'CONDITIONAL',
      
      // DYNAMIC ENTRY ZONE (not hardcoded prices)
      entryZone: {
        optimal: entryZone.optimal,
        acceptable: entryZone.acceptable,
        maximum: entryZone.maximum
      },
      
      // CALCULATED VOLUME REQUIREMENTS
      volumeRequirements: {
        minimum: Math.round(volumeThreshold.minimum),
        preferred: Math.round(volumeThreshold.preferred),
        explosive: Math.round(volumeThreshold.explosive)
      },
      
      // DYNAMIC TIMING WINDOWS
      timeWindows: timeWindows,
      
      // CALCULATED ORDER PARAMETERS
      orderParameters: {
        type: volatility > 0.03 ? 'LIMIT' : 'MARKET_LIMIT',
        slippageAllowance: `${(slippageAllowance * 100).toFixed(2)}%`,
        timeInForce: volatility > 0.05 ? 'IOC' : 'DAY',
        urgency: this.calculateUrgency(templateAnalysis, signal)
      },
      
      // DYNAMIC CONDITIONS (calculated, not hardcoded)
      triggerConditions: this.calculateTriggerConditions(templateAnalysis, currentPrice, latest, atr),
      
      // MARKET REGIME ADJUSTMENTS
      marketRegimeAdjustments: this.calculateMarketRegimeAdjustments(dailyData, templateAnalysis)
    };

    return strategy;
  }

  /**
   * Build dynamic Template exit strategy with calculated parameters
   */
  buildPreciseTemplateExitStrategy(riskAssessment, templateAnalysis, signal, dailyData, currentPrice) {
    const atr = riskAssessment.atr;
    const volatility = this.calculateVolatility(dailyData.slice(-10));
    
    // Calculate dynamic trailing stops
    const trailingStops = this.calculateDynamicTrailingStops(currentPrice, atr, volatility, templateAnalysis.templateGrade);
    
    // Calculate dynamic target adjustments
    const dynamicTargets = this.calculateDynamicTargets(riskAssessment.targets, volatility, templateAnalysis);
    
    // Calculate time-based exits
    const timeBasedExits = this.calculateTimeBasedExits(templateAnalysis, volatility);
    
    return {
      // CALCULATED STOP LOSS LEVELS
      stopLoss: {
        initial: riskAssessment.stopLoss,
        trailingActivation: trailingStops.activationLevel,
        trailingDistance: trailingStops.distance,
        volatilityAdjusted: trailingStops.volatilityAdjusted
      },
      
      // DYNAMIC TARGET MANAGEMENT
      targets: {
        conservative: dynamicTargets.conservative,
        moderate: dynamicTargets.moderate,
        aggressive: dynamicTargets.aggressive,
        scalingMethod: dynamicTargets.scalingMethod
      },
      
      // CALCULATED TIME EXITS
      timeBasedExits: timeBasedExits,
      
      // DYNAMIC SYSTEM EXITS (calculated thresholds)
      systemExits: this.calculateSystemExitTriggers(templateAnalysis, currentPrice, atr),
      
      // MARKET CONDITION EXITS
      marketConditionExits: this.calculateMarketConditionExits(dailyData, templateAnalysis)
    };
  }

  /**
   * Calculate Template confidence-based position sizing
   */
  calculateTemplatePositionSizing(confidence, capitalInfo, riskAssessment, templateAnalysis) {
    const { capital = 100000, entryPrice = 100 } = capitalInfo;
    const { stopLoss = 0, riskReward = 1 } = riskAssessment;
    
    let recommendation = 'AVOID';
    let riskPercent = 0;
    let maxPosition = 0;
    
    // Enhanced Template position sizing with granular tiers and realistic risk management
    
    // PREMIUM TIER - Perfect setups only
    if (templateAnalysis.templateGrade === 'A+' && confidence >= 0.95) {
      recommendation = 'FULL';
      riskPercent = 2.0;  // Max 2% risk (was 2.5% - too aggressive)
      maxPosition = 20;   // 20% max position (was 25% - too concentrated)
    } else if (templateAnalysis.templateGrade === 'A+' && confidence >= 0.85) {
      recommendation = 'STRONG';
      riskPercent = 1.8;
      maxPosition = 18;
    } else if (templateAnalysis.templateGrade === 'A' && confidence >= 0.85) {
      recommendation = 'STRONG';
      riskPercent = 1.6;
      maxPosition = 16;
    } 
    
    // HIGH QUALITY TIER
    else if (templateAnalysis.templateGrade === 'A' && confidence >= 0.75) {
      recommendation = 'LARGE';
      riskPercent = 1.4;
      maxPosition = 14;
    } else if (templateAnalysis.templateGrade === 'A+' && confidence >= 0.70) {
      recommendation = 'LARGE';
      riskPercent = 1.3;
      maxPosition = 13;
    } else if (templateAnalysis.templateGrade === 'B+' && confidence >= 0.80) {
      recommendation = 'LARGE';
      riskPercent = 1.2;
      maxPosition = 12;
    }
    
    // MODERATE TIER
    else if (templateAnalysis.templateGrade === 'A' && confidence >= 0.65) {
      recommendation = 'REDUCED';
      riskPercent = 1.1;
      maxPosition = 11;
    } else if (templateAnalysis.templateGrade === 'B+' && confidence >= 0.70) {
      recommendation = 'REDUCED';
      riskPercent = 1.0;
      maxPosition = 10;
    } else if (templateAnalysis.templateGrade === 'B' && confidence >= 0.75) {
      recommendation = 'REDUCED';
      riskPercent = 0.9;
      maxPosition = 9;
    }
    
    // CONSERVATIVE TIER
    else if (templateAnalysis.templateGrade === 'B+' && confidence >= 0.60) {
      recommendation = 'HALF';
      riskPercent = 0.8;  // Much more reasonable for B+ grade
      maxPosition = 8;
    } else if (templateAnalysis.templateGrade === 'B' && confidence >= 0.65) {
      recommendation = 'HALF';
      riskPercent = 0.7;  // Your suggestion - perfect for B grade
      maxPosition = 7;
    } else if (templateAnalysis.templateGrade === 'A' && confidence >= 0.55) {
      recommendation = 'HALF';
      riskPercent = 0.8;  // Low confidence A grade
      maxPosition = 8;
    }
    
    // SMALL POSITION TIER
    else if (templateAnalysis.templateGrade === 'B' && confidence >= 0.55) {
      recommendation = 'QUARTER';
      riskPercent = 0.6;
      maxPosition = 6;
    } else if (templateAnalysis.templateGrade === 'B+' && confidence >= 0.50) {
      recommendation = 'QUARTER';
      riskPercent = 0.6;
      maxPosition = 6;
    } else if (templateAnalysis.templateGrade === 'C' && confidence >= 0.70) {
      recommendation = 'QUARTER';
      riskPercent = 0.5;
      maxPosition = 5;
    }
    
    // MINIMAL TIER - Toe-dipping opportunities
    else if (templateAnalysis.templateGrade === 'B' && confidence >= 0.45) {
      recommendation = 'MICRO';
      riskPercent = 0.4;
      maxPosition = 4;
    } else if (templateAnalysis.templateGrade === 'C' && confidence >= 0.60) {
      recommendation = 'MICRO';
      riskPercent = 0.4;
      maxPosition = 4;
    } else if (templateAnalysis.templateGrade === 'B+' && confidence >= 0.40) {
      recommendation = 'MICRO';
      riskPercent = 0.3;  // Ultra-conservative for uncertain B+ setups
      maxPosition = 3;
    }

    // Calculate actual position sizing
    let shares = 0;
    let positionValue = 0;
    let riskAmount = 0;
    
    if (recommendation !== 'AVOID' && entryPrice > 0 && stopLoss > 0 && capital > 0) {
      riskAmount = capital * (riskPercent / 100);
      const riskPerShare = entryPrice - stopLoss;
      
      if (riskPerShare > 0) {
        shares = Math.floor(riskAmount / riskPerShare);
        positionValue = shares * entryPrice;
        
        // Ensure position doesn't exceed max allocation
        const maxPositionValue = capital * (maxPosition / 100);
        if (positionValue > maxPositionValue) {
          shares = Math.floor(maxPositionValue / entryPrice);
          positionValue = shares * entryPrice;
        }
      } else {
        console.log(`  ⚠️ TEMPLATE: Invalid risk per share: ${riskPerShare.toFixed(4)} (entry: ${entryPrice}, stop: ${stopLoss})`);
      }
    } else {
      console.log(`  ⚠️ TEMPLATE: Position sizing skipped - recommendation: ${recommendation}, entryPrice: ${entryPrice}, stopLoss: ${stopLoss}, capital: ${capital}`);
    }

    return {
      recommendation,
      riskPercent,
      maxPosition,
      shares: Math.max(0, shares),
      positionValue: positionValue,
      riskAmount: riskAmount,
      riskPerShare: Math.round((entryPrice - stopLoss) * 100) / 100,
      stopDistance: stopLoss > 0 ? Math.round(((entryPrice - stopLoss) / entryPrice) * 10000) / 100 : 0
    };
  }

  /**
   * Generate execution notes specific to Template methodology
   */
  generateTemplateExecutionNotes(templateAnalysis, signal) {
    const notes = [
      `Template Grade: ${templateAnalysis.templateGrade} (${(templateAnalysis.overallScore * 100).toFixed(1)}% score)`,
      `Criteria passed: ${Object.values(templateAnalysis.criteria).filter(c => c.passed).length}/8`
    ];

    if (signal === 'BUY') {
      notes.push('Execute with conviction - Template criteria strongly met');
      notes.push('Monitor for continued institutional accumulation');
      notes.push('Scale position if additional volume expansion occurs');
    } else if (signal === 'WATCH') {
      notes.push('Setup has potential but needs improvement');
      notes.push('Wait for additional criteria confirmation before entry');
      notes.push('Monitor weekly for Template criteria evolution');
    }

    // Add specific Template insights
    const failedCriteria = Object.entries(templateAnalysis.criteria)
      .filter(([_, criterion]) => !criterion.passed)
      .map(([name, _]) => name);

    if (failedCriteria.length > 0) {
      notes.push(`Watch for improvement in: ${failedCriteria.join(', ')}`);
    }

    return notes;
  }

  /**
   * Calculate signal quality grade for gate engine integration
   */
  calculateSignalQuality(confidence, templateAnalysis) {
    let score = 50; // Base score

    // Template grade scoring
    const gradeScores = { 'A+': 40, 'A': 35, 'B': 25, 'C': 15, 'F': 0 };
    score += gradeScores[templateAnalysis.templateGrade] || 0;

    // Confidence scoring
    score += confidence * 20;

    // Convert to grade
    const percentage = Math.max(0, Math.min(100, score));
    let grade = 'F';

    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 85) grade = 'A';
    else if (percentage >= 75) grade = 'B';
    else if (percentage >= 65) grade = 'C';
    else if (percentage >= 55) grade = 'D';

    return { grade, percentage: Math.round(percentage) };
  }

  // Helper methods
  calculateAverageVolume(data) {
    if (!data || data.length === 0) return 0;
    return data.reduce((sum, d) => sum + d.volume, 0) / data.length;
  }

  calculateATR(data) {
    if (!data || data.length < 2) return 0;
    
    let atrSum = 0;
    for (let i = 1; i < data.length; i++) {
      const current = data[i];
      const previous = data[i - 1];
      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );
      atrSum += tr;
    }
    
    return atrSum / (data.length - 1);
  }

  validateData(indicators, series) {
    if (!series?.daily || series.daily.length < 150) return false; // RELAXED: Need ~6 months of data (was 260)
    
    // 🚨 EMERGENCY FIX: Check both base arrays and latest values for SMA data
    const hasSMA150 = indicators?.base?.sma150 || indicators?.latest?.sma150;
    const hasSMA200 = indicators?.base?.sma200 || indicators?.latest?.sma200;
    
    if (!hasSMA150 || !hasSMA200) {
      console.log(`  ❌ MINERVINI: Missing SMA data - SMA150: ${!!hasSMA150}, SMA200: ${!!hasSMA200}`);
      return false;
    }
    
    console.log(`  ✅ MINERVINI: Data validation passed - ${series.daily.length} days, SMA150: ${!!hasSMA150}, SMA200: ${!!hasSMA200}`);
    return true;
  }

  // DYNAMIC STRATEGY CALCULATION METHODS

  calculateEntryZone(currentPrice, atr, volatility) {
    const volatilityFactor = Math.max(0.5, Math.min(2.0, volatility * 20));
    return {
      optimal: currentPrice,
      acceptable: currentPrice + (atr * 0.5 * volatilityFactor),
      maximum: currentPrice + (atr * 1.0 * volatilityFactor)
    };
  }

  calculateVolumeThreshold(avgVolume, grade) {
    const gradeMultipliers = { 'A+': 2.0, 'A': 1.8, 'B+': 1.5, 'B': 1.3, 'C': 1.2 };
    const multiplier = gradeMultipliers[grade] || 1.0;
    return {
      minimum: avgVolume * multiplier,
      preferred: avgVolume * multiplier * 1.5,
      explosive: avgVolume * multiplier * 2.5
    };
  }

  calculateOptimalTimeWindows(volatility) {
    if (volatility > 0.05) {
      return {
        primary: 'First 30 minutes after open (high volatility)',
        secondary: 'Last 30 minutes before close',
        avoid: 'Lunch hour (11:30-13:30)'
      };
    } else {
      return {
        primary: 'First hour after open',
        secondary: 'Any time during session',
        avoid: 'Pre-market/after-hours'
      };
    }
  }

  calculateDynamicSlippage(volatility, grade) {
    const baseSlippage = volatility * 2; // 2x volatility as base
    const gradeAdjustment = { 'A+': 0.8, 'A': 0.9, 'B+': 1.0, 'B': 1.1, 'C': 1.2 }[grade] || 1.0;
    return Math.max(0.002, Math.min(0.01, baseSlippage * gradeAdjustment)); // 0.2% to 1.0%
  }

  calculateUrgency(templateAnalysis, signal) {
    if (signal === 'BUY' && templateAnalysis.templateGrade === 'A+') return 'HIGHEST';
    if (signal === 'BUY' && templateAnalysis.templateGrade === 'A') return 'HIGH';
    if (signal === 'BUY') return 'MEDIUM';
    return 'LOW';
  }

  calculateTriggerConditions(templateAnalysis, currentPrice, latest, atr) {
    const conditions = [];
    
    // Volume condition
    if (latest.volume) {
      const avgVol = this.calculateAverageVolume([latest]); // Simplified
      conditions.push({
        type: 'VOLUME',
        threshold: avgVol * 1.5,
        current: latest.volume,
        met: latest.volume > avgVol * 1.5
      });
    }
    
    // Price action condition
    const candleStrength = latest.high > latest.low ? 
      (latest.close - latest.low) / (latest.high - latest.low) : 0;
    conditions.push({
      type: 'CANDLE_STRENGTH',
      threshold: 0.65,
      current: candleStrength,
      met: candleStrength > 0.65
    });
    
    // Breakout condition
    conditions.push({
      type: 'BREAKOUT_LEVEL',
      threshold: currentPrice + atr * 0.5,
      current: currentPrice,
      met: false // To be triggered
    });
    
    return conditions;
  }

  calculateMarketRegimeAdjustments(dailyData, templateAnalysis) {
    const recentVolatility = this.calculateVolatility(dailyData.slice(-5));
    const longerVolatility = this.calculateVolatility(dailyData.slice(-20));
    const volatilityRegime = recentVolatility > longerVolatility * 1.5 ? 'HIGH_VOL' : 'NORMAL_VOL';
    
    return {
      regime: volatilityRegime,
      adjustments: volatilityRegime === 'HIGH_VOL' ? 
        ['Reduce position size by 20%', 'Use tighter stops', 'Faster profit taking'] :
        ['Standard position sizing', 'Normal stops', 'Let winners run']
    };
  }

  calculateDynamicTrailingStops(currentPrice, atr, volatility, grade) {
    const baseDistance = atr * 2.0;
    const volatilityAdjustment = Math.max(0.5, Math.min(2.0, volatility * 10));
    const gradeAdjustment = { 'A+': 0.8, 'A': 0.9, 'B+': 1.0, 'B': 1.1, 'C': 1.2 }[grade] || 1.0;
    
    return {
      activationLevel: currentPrice * 1.15, // 15% profit activation
      distance: baseDistance * volatilityAdjustment * gradeAdjustment,
      volatilityAdjusted: currentPrice - (baseDistance * volatilityAdjustment)
    };
  }

  calculateDynamicTargets(staticTargets, volatility, templateAnalysis) {
    // FIXED: Volatility factor should enhance targets, not reduce them
    // For low volatility (stable): closer to 1.0 (normal targets)
    // For high volatility: extend targets higher (more room to run)
    const volatilityFactor = Math.max(1.0, Math.min(1.5, 1 + (volatility * 10)));
    const gradeBonus = { 'A+': 1.2, 'A': 1.1, 'B+': 1.0, 'B': 0.9, 'C': 0.8 }[templateAnalysis.templateGrade] || 1.0;
    
    return {
      conservative: staticTargets[0] * volatilityFactor * gradeBonus,
      moderate: staticTargets[1] * volatilityFactor * gradeBonus,
      aggressive: staticTargets[2] * volatilityFactor * gradeBonus,
      scalingMethod: templateAnalysis.templateGrade === 'A+' ? 
        '25% at each target + 25% runner' : '33% at each target'
    };
  }

  calculateTimeBasedExits(templateAnalysis, volatility) {
    const baseTimeframe = volatility > 0.03 ? 14 : 28; // Days
    const gradeAdjustment = { 'A+': 1.5, 'A': 1.2, 'B+': 1.0, 'B': 0.8, 'C': 0.6 }[templateAnalysis.templateGrade] || 1.0;
    
    return {
      maxHoldPeriod: Math.round(baseTimeframe * gradeAdjustment),
      reviewPeriod: Math.round(baseTimeframe * gradeAdjustment * 0.5),
      urgentReview: volatility > 0.05 ? 7 : 14
    };
  }

  calculateSystemExitTriggers(templateAnalysis, currentPrice, atr) {
    return {
      templateDegradation: {
        trigger: 'If 3+ Template criteria fail simultaneously',
        action: 'Exit 50% position immediately'
      },
      momentumLoss: {
        trigger: `Price below ${(currentPrice - atr * 1.5).toFixed(2)}`,
        action: 'Exit remaining position'
      },
      volumeDry: {
        trigger: 'Volume drops below 50% of 20-day average for 3 days',
        action: 'Reduce position by 30%'
      }
    };
  }

  calculateMarketConditionExits(dailyData, templateAnalysis) {
    const marketTrend = this.getTrendDirection(dailyData.slice(-10));
    const recentVolatility = this.calculateVolatility(dailyData.slice(-5));
    
    return {
      marketTrendExit: marketTrend === 'DOWN' ? 
        'Exit if market breaks key support levels' : 'Hold through normal corrections',
      volatilityExit: recentVolatility > 0.05 ? 
        'Consider profit-taking in high volatility' : 'Normal exit rules apply',
      sectorRotation: 'Monitor sector relative strength vs SPY'
    };
  }

  calculateVolatility(data) {
    if (!data || data.length < 2) return 0.02; // Default 2%
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].close - data[i-1].close) / data[i-1].close);
    }
    const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
    return Math.sqrt(variance);
  }

  getTrendDirection(data) {
    if (!data || data.length < 2) return 'NEUTRAL';
    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;
    const change = (lastPrice - firstPrice) / firstPrice;
    return change > 0.02 ? 'UP' : change < -0.02 ? 'DOWN' : 'NEUTRAL';
  }

  createAvoidSignal(reasonCode, message) {
    return {
      system: this.systemId,
      systemName: this.name,
      decision: 'AVOID',
      confidence: 0.2,
      reasoning: [message],
      riskReward: { riskReward: 0 },
      signalQuality: { grade: 'F', percentage: 0 },
      execution: null,
      error: reasonCode,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = MinerviniTemplateAdvanced;
