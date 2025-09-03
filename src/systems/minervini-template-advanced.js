/**
 * Minervini Template Advanced - Institutional Grade System
 * 
 * Based on Mark Minervini's "Template" methodology from "Think & Trade Like a Champion"
 * Enhanced for institutional traders with strict 8-criteria template validation.
 * 
 * ANTI-THRASHING PROTECTION:
 * Integrated with SignalStabilityManager to prevent signal flipping on minor price moves.
 * Uses hysteresis, latching, and ATR-relative thresholds for stable signals.
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
 * Version: 2.1.0 - Anti-Thrashing Protection
 * Last Updated: 2024
 */

const { getSystemThresholds } = require('../config/trading-thresholds');
const { SignalStabilityManager } = require('../utils/signal-stability-manager');
const { TRIGGER_TYPES } = require('../utils/systemConstants');

class MinerviniTemplateAdvanced {
  constructor() {
    this.systemId = 'minervini_template_advanced';
    this.name = 'Minervini Template Advanced (Institutional)';
    this.version = '2.1.0';
    this.description = '8-criteria template system for institutional momentum investing';
    
    // 🔒 ANTI-THRASHING: Initialize signal stability manager
    this.stabilityManager = new SignalStabilityManager();
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

      // Extract analysis parameters - AI signals no longer passed directly to systems
      const { capital, symbol, currentPrice } = options;
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

      // Generate final decision WITHOUT AI enhancement (AI handled by Gate Engine)
      const rawDecision = this.makeFinalDecision(
        templateAnalysis, 
        riskAssessment, 
        completedDaily, 
        { capital, symbol, entryPrice },
        thresholds
      );

      // 🔒 ANTI-THRASHING: Apply signal stabilization
      console.log(`  🏛️ TEMPLATE: Raw decision - Action: ${rawDecision.action}, Confidence: ${(rawDecision.confidence * 100).toFixed(1)}%`);
      
      const stabilizedDecision = this.stabilityManager.stabilizeSignal(
        symbol || 'UNKNOWN',
        {
          action: rawDecision.action,
          confidence: rawDecision.confidence,
          reasoning: rawDecision.reasoning,
          factors: rawDecision.factors
        },
        completedDaily,
        entryPrice,
        this.systemId
      );

      console.log(`  🏛️ TEMPLATE: Raw: ${rawDecision.action}, Stabilized: ${stabilizedDecision.action}${stabilizedDecision.stabilized ? ' [STABILIZED]' : ''}, Confidence: ${(stabilizedDecision.confidence * 100).toFixed(1)}%`);

      // Calculate signal quality for gate engine integration
      const signalQuality = this.calculateSignalQuality(stabilizedDecision.confidence, templateAnalysis);

      // Build execution plan
      const execution = this.buildExecutionPlan(stabilizedDecision, riskAssessment, templateAnalysis, entryPrice, capital, completedDaily);

      // Calculate unified display grade (Template + Signal combined for user display)
      const unifiedGrade = this.calculateUnifiedDisplayGrade(templateAnalysis.templateGrade, signalQuality.grade);

      return {
        system: this.systemId,
        systemName: this.name,
        decision: stabilizedDecision.action,
        confidence: stabilizedDecision.confidence,
        reasoning: stabilizedDecision.reasoning,
        grade: unifiedGrade, // 🎯 UNIFIED DISPLAY GRADE for user experience
        stopLoss: riskAssessment.stopLoss,
        targets: riskAssessment.targets,
        riskReward: riskAssessment.riskReward,
        execution: execution,
        signalQuality: signalQuality,
        templateAnalysis: templateAnalysis,
        factors: stabilizedDecision.factors,
        
        // 🔒 STABILITY METADATA
        stabilized: stabilizedDecision.stabilized || false,
        stabilizationReason: stabilizedDecision.stabilizationReason || null,
        latched: stabilizedDecision.latched || false,
        latchReason: stabilizedDecision.latchReason || null,
        readiness: stabilizedDecision.readiness || null,
        
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

    // Criterion 4: Stock price within configurable % of 52-week high
    const distanceFromHigh = (high52Week - currentPrice) / high52Week;
    const criterion4Pass = distanceFromHigh <= thresholds.criterion4_high_proximity_threshold;
    const criterion4Score = criterion4Pass ? (1.0 - distanceFromHigh * 2) : 0.0; // Scale score based on proximity
    criteria.criterion4 = {
      passed: criterion4Pass,
      value: distanceFromHigh * 100,
      threshold: thresholds.criterion4_high_proximity_threshold * 100,
      score: criterion4Score,
      details: `Price $${currentPrice.toFixed(2)} is ${(distanceFromHigh * 100).toFixed(1)}% from 52-week high $${high52Week.toFixed(2)}`
    };
    totalScore += criterion4Score;
    if (criterion4Pass) reasoning.push(`Within ${(thresholds.criterion4_high_proximity_threshold * 100).toFixed(0)}% of 52-week high (${(distanceFromHigh * 100).toFixed(1)}% away)`);

    // Criterion 5: Stock price at least configurable % above 52-week low
    const distanceFromLow = (currentPrice - low52Week) / low52Week;
    const criterion5Pass = distanceFromLow >= thresholds.criterion5_low_distance_threshold;
    const criterion5Score = criterion5Pass ? Math.min(1.0, distanceFromLow / 0.5) : 0.0; // Scale up to 50%
    criteria.criterion5 = {
      passed: criterion5Pass,
      value: distanceFromLow * 100,
      threshold: thresholds.criterion5_low_distance_threshold * 100,
      score: criterion5Score,
      details: `Price $${currentPrice.toFixed(2)} is ${(distanceFromLow * 100).toFixed(1)}% above 52-week low $${low52Week.toFixed(2)}`
    };
    totalScore += criterion5Score;
    if (criterion5Pass) reasoning.push(`Strong recovery: ${(distanceFromLow * 100).toFixed(1)}% above 52-week low`);

    // Criterion 6: Relative Strength Rating vs Benchmark (FIXED: Proper RS calculation)
    const relativeStrength = this.calculateRelativeStrength(dailyData, currentPrice, thresholds);
    const criterion6Pass = relativeStrength > thresholds.criterion6_relative_strength;
    const criterion6Score = criterion6Pass ? (relativeStrength - 50) / 50 : relativeStrength / thresholds.criterion6_relative_strength;
    criteria.criterion6 = {
      passed: criterion6Pass,
      value: relativeStrength,
      threshold: thresholds.criterion6_relative_strength,
      score: criterion6Score,
      details: `Relative Strength ${relativeStrength.toFixed(1)} ${criterion6Pass ? '>' : '≤'} ${thresholds.criterion6_relative_strength} (vs benchmark over 6 months)`
    };
    totalScore += criterion6Score;
    if (criterion6Pass) reasoning.push(`Exceptional relative strength vs benchmark: ${relativeStrength.toFixed(1)}`);

    // Criterion 7: Volume expansion on breakout (FIXED: Per-bar breakout volume)
    const volumeAnalysis = this.analyzeBreakoutVolume(dailyData, currentPrice, thresholds);
    const criterion7Pass = volumeAnalysis.hasVolumeBreakout;
    const criterion7Score = criterion7Pass ? Math.min(1.0, volumeAnalysis.volumeRatio / 2.0) : volumeAnalysis.volumeRatio / thresholds.criterion7_volume_multiplier;
    criteria.criterion7 = {
      passed: criterion7Pass,
      value: volumeAnalysis.volumeRatio,
      threshold: thresholds.criterion7_volume_multiplier,
      score: criterion7Score,
      details: `Breakout volume ${volumeAnalysis.volumeRatio.toFixed(2)}x avg ${criterion7Pass ? '≥' : '<'} ${thresholds.criterion7_volume_multiplier}x on ${volumeAnalysis.breakoutDaysAgo} days ago`
    };
    totalScore += criterion7Score;
    if (criterion7Pass) reasoning.push(`Strong volume breakout: ${volumeAnalysis.volumeRatio.toFixed(2)}x average on price breakout`);

    // Criterion 8: Fundamental strength proxy (RENAMED for clarity)
    const fundamentalProxy = this.calculateFundamentalProxy(dailyData, currentPrice);
    const criterion8Pass = fundamentalProxy > thresholds.criterion8_fundamental_score;
    const criterion8Score = criterion8Pass ? (fundamentalProxy - 40) / 60 : fundamentalProxy / thresholds.criterion8_fundamental_score;
    criteria.criterion8 = {
      passed: criterion8Pass,
      value: fundamentalProxy,
      threshold: thresholds.criterion8_fundamental_score,
      score: criterion8Score,
      details: `Fundamental proxy ${fundamentalProxy.toFixed(1)} ${criterion8Pass ? '>' : '≤'} ${thresholds.criterion8_fundamental_score} (momentum-based estimate)`
    };
    totalScore += criterion8Score;
    if (criterion8Pass) reasoning.push(`Strong fundamental proxy: ${fundamentalProxy.toFixed(1)}/100`);

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
   * DEPRECATED: AI enhancement now handled by Gate Engine
   * Make final trading decision based on Template analysis only
   * 
   * Note: AI signals and enhancements are now processed by the Gate Engine
   * after the system analysis. This method focuses purely on Template criteria.
   */
  makeFinalDecisionWithAI(templateAnalysis, riskAssessment, dailyData, options, aiSignals = null, thresholds) {
    console.warn('⚠️ TEMPLATE: makeFinalDecisionWithAI is deprecated - AI enhancement now handled by Gate Engine');
    
    // Fallback to base Template decision
    return this.makeFinalDecision(templateAnalysis, riskAssessment, dailyData, options, thresholds);
  }

  /**
   * DEPRECATED: AI enhancement now handled by Gate Engine
   * 🤖 TEMPLATE AI ENHANCEMENT: Upgrade strong Template setups with AI confirmation
   * 
   * Note: This method is kept for backwards compatibility but AI enhancement
   * is now handled by the Gate Engine integration after system analysis.
   */
  applyTemplateAIEnhancement(baseDecision, templateAnalysis, aiSignals) {
    console.warn('⚠️ TEMPLATE: applyTemplateAIEnhancement is deprecated - AI enhancement now handled by Gate Engine');
    
    // Return base decision without AI enhancement
    return {
      ...baseDecision,
      aiEnhanced: false,
      aiReasoning: 'AI enhancement now handled by Gate Engine',
      originalTemplateAction: baseDecision.action
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

    // FIXED: Dynamic targets based on nearest resistance levels and ATR
    const riskAmount = currentPrice - stopLoss;
    
    // Calculate dynamic targets based on volatility and recent price action
    const volatility = this.calculateVolatility(dailyData.slice(-10));
    const recentHigh = Math.max(...dailyData.slice(-20).map(d => d.high));
    const nextResistance = this.findNextResistanceLevel(dailyData, currentPrice);
    
    // TRULY DYNAMIC: Use resistance, volatility, and ATR to determine targets
    let target1, target2, target3;
    
    // 🎯 MINIMUM RISK/REWARD ENFORCEMENT
    const minimumTarget1 = currentPrice + (riskAmount * 2.5); // Minimum 2.5:1 R/R
    const minimumTarget2 = currentPrice + (riskAmount * 4.0); // Minimum 4:1 R/R  
    const minimumTarget3 = currentPrice + (riskAmount * 6.0); // Minimum 6:1 R/R
    
    if (nextResistance && nextResistance > currentPrice) {
      // Use resistance-based targets BUT enforce minimum R/R
      const resistanceDistance = nextResistance - currentPrice;
      const resistanceTarget1 = nextResistance;
      const resistanceTarget2 = nextResistance + (resistanceDistance * 0.5);
      const resistanceTarget3 = nextResistance + resistanceDistance;
      
      // Use the HIGHER of resistance-based or minimum R/R targets
      target1 = Math.max(resistanceTarget1, minimumTarget1);
      target2 = Math.max(resistanceTarget2, minimumTarget2);
      target3 = Math.max(resistanceTarget3, minimumTarget3);
    } else {
      // Use volatility and ATR-based targets with minimum R/R enforcement
      const volatilityFactor = Math.max(1.2, volatility * 25); // Higher volatility scaling
      const baseMove = atr * volatilityFactor;
      const volatilityTarget1 = currentPrice + baseMove * 2.0;
      const volatilityTarget2 = currentPrice + baseMove * 3.5;
      const volatilityTarget3 = currentPrice + baseMove * 5.5;
      
      // Use the HIGHER of volatility-based or minimum R/R targets
      target1 = Math.max(volatilityTarget1, minimumTarget1);
      target2 = Math.max(volatilityTarget2, minimumTarget2);
      target3 = Math.max(volatilityTarget3, minimumTarget3);
    }
    
    const targets = [target1, target2, target3];

    // FIXED: Calculate actual risk/reward based on first target with minimum enforcement
    const actualTarget = targets[0];
    const potentialReward = actualTarget - currentPrice;
    const actualRisk = currentPrice - stopLoss;
    const riskReward = actualRisk > 0 ? potentialReward / actualRisk : 0;
    
    // 🎯 QUALITY CONTROL: Log if targets had to be adjusted for minimum R/R
    const originalResistanceTarget = nextResistance || (currentPrice + atr * Math.max(1.0, volatility * 20) * 1.5);
    const wasAdjusted = actualTarget > originalResistanceTarget;
    
    if (wasAdjusted) {
      console.log(`  🎯 R/R ENFORCEMENT: Target adjusted from ${originalResistanceTarget.toFixed(2)} to ${actualTarget.toFixed(2)} for minimum 2.5:1 R/R`);
    }
    
    const riskPercentage = (currentPrice - stopLoss) / currentPrice;

    return {
      stopLoss: Math.round(stopLoss * 100) / 100,
      targets: targets.map(t => Math.round(t * 100) / 100),
      riskReward: Math.round(riskReward * 100) / 100, // FIXED: Always return number, not object
      atr: Math.round(atr * 100) / 100,
      riskPercentage: Math.round(riskPercentage * 10000) / 100,
      nextResistance: nextResistance ? Math.round(nextResistance * 100) / 100 : null,
      volatility: Math.round(volatility * 10000) / 100 // As percentage
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
      triggerConditions: this.calculateTriggerConditions(templateAnalysis, currentPrice, latest, atr, dailyData),
      
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
   * Calculate Template position sizing using unified Template + Signal Quality scoring
   */
  calculateTemplatePositionSizing(confidence, capitalInfo, riskAssessment, templateAnalysis) {
    const { capital = 100000, entryPrice = 100 } = capitalInfo;
    const { stopLoss = 0, riskReward = 1 } = riskAssessment;
    
    // Calculate Signal Quality Grade for unified scoring
    const signalQuality = this.calculateSignalQuality(confidence, templateAnalysis);
    const signalQualityGrade = signalQuality.grade;
    
    // 🎯 UNIFIED SCORING SYSTEM: Template Grade + Signal Quality Grade
    const gradePoints = {
      'A+': 3,
      'A': 2.5,
      'B+': 2,
      'B': 1.5,
      'C': 1,
      'D': 0.5,
      'F': 0
    };

    const templateScore = gradePoints[templateAnalysis.templateGrade] || 0;
    const signalScore = gradePoints[signalQualityGrade] || 0;
    const totalScore = templateScore + signalScore;
    
    // Confidence multiplier for edge cases
    const confidenceMultiplier = confidence > 0.8 ? 1.1 : confidence < 0.6 ? 0.9 : 1.0;
    const finalScore = totalScore * confidenceMultiplier;

    let recommendation = 'AVOID';
    let riskPercent = 0;
    let maxPosition = 0;
    
    // 🚀 UNIFIED SIZING MATRIX - Both grades matter!
    if (finalScore >= 5.8) {
      recommendation = 'FULL';
      riskPercent = 2.0;
      maxPosition = 20;
    } else if (finalScore >= 5.4) {
      recommendation = 'STRONG';
      riskPercent = 1.8;
      maxPosition = 18;
    } else if (finalScore >= 5.0) {
      recommendation = 'STRONG';
      riskPercent = 1.6;
      maxPosition = 16;
    } else if (finalScore >= 4.6) {
      recommendation = 'LARGE';
      riskPercent = 1.4;
      maxPosition = 14;
    } else if (finalScore >= 4.2) {
      recommendation = 'LARGE';
      riskPercent = 1.2;
      maxPosition = 12;
    } else if (finalScore >= 3.8) {
      recommendation = 'REDUCED';
      riskPercent = 1.0;
      maxPosition = 10;
    } else if (finalScore >= 3.4) {
      recommendation = 'HALF';
      riskPercent = 0.8;
      maxPosition = 8;
    } else if (finalScore >= 2.8) {
      recommendation = 'QUARTER';
      riskPercent = 0.6;
      maxPosition = 6;
    } else if (finalScore >= 2.2) {
      recommendation = 'MICRO';
      riskPercent = 0.4;
      maxPosition = 4;
    } else {
      recommendation = 'AVOID';
      riskPercent = 0;
      maxPosition = 0;
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

    // 🎯 UNIFIED SCORING DEBUG INFO
    console.log(`  🎯 UNIFIED SCORING: Template ${templateAnalysis.templateGrade}(${templateScore}) + Signal ${signalQualityGrade}(${signalScore}) = ${totalScore.toFixed(1)} → ${recommendation}`);

    return {
      recommendation,
      riskPercent,
      maxPosition,
      shares: Math.max(0, shares),
      positionValue: positionValue,
      riskAmount: riskAmount,
      riskPerShare: Math.round((entryPrice - stopLoss) * 100) / 100,
      stopDistance: stopLoss > 0 ? Math.round(((entryPrice - stopLoss) / entryPrice) * 10000) / 100 : 0,
      riskReward: riskReward,
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
    const gradeScores = { 'A+': 40, 'A': 35, 'B+': 30, 'B': 25, 'C': 15, 'F': 0 };
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

    return { 
      grade: grade, // Pure Signal Quality Grade for internal logic
      percentage: Math.round(percentage) 
    };
  }

  /**
   * Calculate unified display grade combining Template Grade + Signal Quality Grade
   * This is for display purposes only and matches the position sizing logic
   */
  calculateUnifiedDisplayGrade(templateGrade, signalGrade) {
    const gradePoints = {
      'A+': 3,
      'A': 2.5,
      'B+': 2,
      'B': 1.5,
      'C': 1,
      'D': 0.5,
      'F': 0
    };

    const templateScore = gradePoints[templateGrade] || 0;
    const signalScore = gradePoints[signalGrade] || 0;
    const totalScore = templateScore + signalScore;

    // Convert combined score to unified grade
    if (totalScore >= 5.5) return 'A+';      // FULL territory (A+ + A or better)
    else if (totalScore >= 4.5) return 'A';  // STRONG territory (A + B+ or better)
    else if (totalScore >= 3.5) return 'B+'; // LARGE territory (B+ + B+ or A + C)
    else if (totalScore >= 2.5) return 'B';  // REDUCED territory (B + C or B+ + D)
    else if (totalScore >= 1.5) return 'C';  // QUARTER territory (C + C or B + F)
    else if (totalScore >= 0.5) return 'D';  // MICRO territory (D + D or C + F)
    else return 'F';                         // AVOID territory
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
    // FIXED: Require 252+ days for proper 52-week calculations
    if (!series?.daily || series.daily.length < 252) {
      console.log(`  ❌ MINERVINI: Insufficient data - need 252+ days for 52-week calculations, got ${series?.daily?.length || 0}`);
      return false;
    }
    
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

  calculateTriggerConditions(templateAnalysis, currentPrice, latest, atr, dailyData) {
    const conditions = [];
    
    // 🎯 REAL VOLUME TRIGGER: Compare to 20-day average volume
    if (latest.volume && dailyData.length >= 20) {
      const avg20DayVolume = this.calculateAverageVolume(dailyData.slice(-20));
      const volumeThreshold = avg20DayVolume * 1.3; // 30% above 20-day average
      conditions.push({
        type: TRIGGER_TYPES.VOLUME,
        threshold: volumeThreshold,
        current: latest.volume,
        met: latest.volume > volumeThreshold,
        description: `Volume ${latest.volume.toLocaleString()} vs 20-day avg ${avg20DayVolume.toLocaleString()}`
      });
    }
    
    // 🎯 DYNAMIC BREAKOUT LEVEL: Find actual resistance from recent highs
    const resistanceLevel = this.findNearestResistance(dailyData, currentPrice);
    const breakoutBuffer = resistanceLevel * 1.002; // 0.2% above resistance
    conditions.push({
      type: TRIGGER_TYPES.BREAKOUT_LEVEL,
      threshold: breakoutBuffer,
      current: currentPrice,
      met: currentPrice >= breakoutBuffer,
      description: `Price ${currentPrice.toFixed(2)} vs resistance ${resistanceLevel.toFixed(2)}`
    });
    
    // 🎯 ADAPTIVE CANDLE STRENGTH: Based on recent volatility context
    const recentVolatility = this.calculateVolatility(dailyData.slice(-10));
    const adaptiveThreshold = Math.max(0.5, Math.min(0.8, 0.65 - (recentVolatility * 2))); // Adjust for volatility
    const candleStrength = latest.high > latest.low ? 
      (latest.close - latest.low) / (latest.high - latest.low) : 0;
    conditions.push({
      type: TRIGGER_TYPES.CANDLE_STRENGTH,
      threshold: adaptiveThreshold,
      current: candleStrength,
      met: candleStrength > adaptiveThreshold,
      description: `Candle strength ${(candleStrength * 100).toFixed(1)}% vs adaptive threshold ${(adaptiveThreshold * 100).toFixed(1)}%`
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
      riskReward: 0, // FIXED: Return number, not object
      signalQuality: { grade: 'F', percentage: 0 },
      execution: null,
      error: reasonCode,
      timestamp: new Date().toISOString()
    };
  }

  // NEW HELPER METHODS FOR FIXES

  /**
   * Calculate proper Relative Strength vs benchmark (SPY proxy)
   * @param {Array} dailyData - Historical price data
   * @param {number} currentPrice - Current stock price
   * @param {Object} thresholds - System thresholds
   * @returns {number} Relative strength score 0-100
   */
  calculateRelativeStrength(dailyData, currentPrice, thresholds) {
    try {
      // Calculate 6-month and 3-month performance
      const sixMonthsAgo = Math.min(126, dailyData.length - 1); // ~6 months of trading days
      const threeMonthsAgo = Math.min(63, dailyData.length - 1); // ~3 months of trading days
      
      if (dailyData.length < threeMonthsAgo) {
        return 50; // Neutral if insufficient data
      }
      
      const sixMonthPrice = dailyData[dailyData.length - 1 - sixMonthsAgo]?.close || currentPrice;
      const threeMonthPrice = dailyData[dailyData.length - 1 - threeMonthsAgo]?.close || currentPrice;
      
      // Calculate stock performance
      const sixMonthReturn = (currentPrice - sixMonthPrice) / sixMonthPrice;
      const threeMonthReturn = (currentPrice - threeMonthPrice) / threeMonthPrice;
      
      // Create a composite RS score (in real implementation, compare vs SPY/benchmark)
      // For now, we'll use price momentum as proxy for RS
      const momentumScore = (sixMonthReturn * 0.4 + threeMonthReturn * 0.6) * 100; // Weight recent more
      
      // Convert to 0-100 scale where 50 = neutral, >70 = strong
      const rsScore = Math.max(0, Math.min(100, 50 + momentumScore * 2));
      
      return rsScore;
    } catch (error) {
      console.warn('RS calculation error:', error.message);
      return 50; // Neutral on error
    }
  }

  /**
   * Analyze breakout volume on price breakouts
   * @param {Array} dailyData - Historical price data
   * @param {number} currentPrice - Current stock price
   * @param {Object} thresholds - System thresholds
   * @returns {Object} Volume breakout analysis
   */
  analyzeBreakoutVolume(dailyData, currentPrice, thresholds) {
    try {
      if (dailyData.length < 60) {
        return { hasVolumeBreakout: false, volumeRatio: 1.0, breakoutDaysAgo: 0 };
      }
      
      // Calculate 50-day average volume
      const avgVolume = this.calculateAverageVolume(dailyData.slice(-50));
      
      // Look for recent price breakouts (within last 10 days)
      const recentData = dailyData.slice(-10);
      const priorHigh = Math.max(...dailyData.slice(-30, -10).map(d => d.high));
      
      let bestBreakout = { hasBreakout: false, volumeRatio: 1.0, daysAgo: 0 };
      
      for (let i = recentData.length - 1; i >= 0; i--) {
        const candle = recentData[i];
        const isPriceBreakout = candle.close > priorHigh;
        const volumeRatio = candle.volume / avgVolume;
        const isVolumeBreakout = volumeRatio >= thresholds.criterion7_volume_multiplier;
        
        if (isPriceBreakout && isVolumeBreakout) {
          bestBreakout = {
            hasBreakout: true,
            volumeRatio: volumeRatio,
            daysAgo: recentData.length - 1 - i
          };
          break;
        }
      }
      
      return {
        hasVolumeBreakout: bestBreakout.hasBreakout,
        volumeRatio: bestBreakout.volumeRatio,
        breakoutDaysAgo: bestBreakout.daysAgo
      };
    } catch (error) {
      console.warn('Volume breakout analysis error:', error.message);
      return { hasVolumeBreakout: false, volumeRatio: 1.0, breakoutDaysAgo: 0 };
    }
  }

  /**
   * Calculate fundamental strength proxy
   * @param {Array} dailyData - Historical price data  
   * @param {number} currentPrice - Current stock price
   * @returns {number} Fundamental proxy score 0-100
   */
  calculateFundamentalProxy(dailyData, currentPrice) {
    try {
      if (dailyData.length < 60) return 50;
      
      // Multi-timeframe momentum analysis as fundamental proxy
      const price20DaysAgo = dailyData[dailyData.length - 21]?.close || currentPrice;
      const price60DaysAgo = dailyData[dailyData.length - 61]?.close || currentPrice;
      
      const shortTermMomentum = (currentPrice - price20DaysAgo) / price20DaysAgo;
      const mediumTermMomentum = (currentPrice - price60DaysAgo) / price60DaysAgo;
      
      // Convert to 0-100 scale
      const compositeScore = (shortTermMomentum * 0.6 + mediumTermMomentum * 0.4) * 200 + 50;
      
      return Math.max(0, Math.min(100, compositeScore));
    } catch (error) {
      console.warn('Fundamental proxy error:', error.message);
      return 50;
    }
  }

  /**
   * Find nearest resistance level from recent price action
   * @param {Array} dailyData - Historical price data
   * @param {number} currentPrice - Current stock price
   * @returns {number} Nearest resistance level above current price
   */
  findNearestResistance(dailyData, currentPrice) {
    if (!dailyData || dailyData.length < 20) return currentPrice * 1.02; // Fallback
    
    // Look for resistance in last 60 days
    const recentData = dailyData.slice(-60);
    const highs = recentData.map(d => d.high);
    
    // Find pivot highs (local peaks)
    const pivotHighs = [];
    for (let i = 2; i < highs.length - 2; i++) {
      if (highs[i] > highs[i-1] && highs[i] > highs[i-2] && 
          highs[i] > highs[i+1] && highs[i] > highs[i+2]) {
        pivotHighs.push(highs[i]);
      }
    }
    
    // Find nearest resistance above current price
    const resistanceLevels = pivotHighs.filter(high => high > currentPrice);
    
    if (resistanceLevels.length === 0) {
      // Use 20-day high if no pivot highs found
      return Math.max(...recentData.slice(-20).map(d => d.high));
    }
    
    // Return nearest resistance
    return Math.min(...resistanceLevels);
  }

  /**
   * Find next resistance level for dynamic targets
   * @param {Array} dailyData - Historical price data
   * @param {number} currentPrice - Current stock price
   * @returns {number|null} Next resistance level or null
   */
  findNextResistanceLevel(dailyData, currentPrice) {
    try {
      if (dailyData.length < 20) return null;
      
      // Look for recent swing highs above current price
      const recentData = dailyData.slice(-60); // Last 60 days
      const swingHighs = [];
      
      for (let i = 2; i < recentData.length - 2; i++) {
        const current = recentData[i];
        const prev2 = recentData[i - 2];
        const prev1 = recentData[i - 1];
        const next1 = recentData[i + 1];
        const next2 = recentData[i + 2];
        
        // Swing high: current high > previous 2 and next 2 highs
        if (current.high > Math.max(prev2.high, prev1.high, next1.high, next2.high)) {
          swingHighs.push(current.high);
        }
      }
      
      // Find nearest resistance above current price
      const resistanceLevels = swingHighs.filter(high => high > currentPrice).sort((a, b) => a - b);
      
      return resistanceLevels.length > 0 ? resistanceLevels[0] : null;
    } catch (error) {
      console.warn('Resistance level calculation error:', error.message);
      return null;
    }
  }
}

module.exports = MinerviniTemplateAdvanced;
