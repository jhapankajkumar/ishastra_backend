/**
 * Minervini Template Advanced - Institutional Grade System
 * 
 * Based on Mark Minervini's "Template" methodology from "Think & Trade Like a Champion"
 * Enhanced for institutional traders with strict 8-criteria template validation.
 * 
 * SIMPLE STABILITY PROTECTION:
 * Integrated with SimpleSwingStability to prevent signal flipping on minor price moves.
 * Uses 3-bar cooldown and hard stop invalidation for stable swing trading signals.
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
 * Version: 2.2.0 - Simple Stability Protection
 * Last Updated: 2024
 */

const { getSystemThresholds } = require('../config/trading-thresholds');
const { SimpleSwingStability } = require('../utils/simple-swing-stability');
const { TRIGGER_TYPES } = require('../utils/systemConstants');

class MinerviniTemplateAdvanced {
  constructor() {
    this.systemId = 'minervini_template_advanced';
    this.name = 'Minervini Template Advanced (Institutional)';
    this.version = '2.2.0';
    this.description = '8-criteria template system for institutional momentum investing';
    this.shortName = "SEPA"
    // 🔒 SIMPLE STABILITY: Initialize simple swing stability manager
    this.stabilityManager = new SimpleSwingStability(3); // 3-bar cooldown
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

      const { indicators, historical } = data;
      // Validate required data
      if (!this.validateData(indicators, historical)) {
        return this.createAvoidSignal('INVALID_DATA', 'Insufficient data for Template analysis');
      }

      // Extract analysis parameters - AI signals no longer passed directly to systems
      const { capital, symbol, currentPrice } = options;
      const completedDaily = historical.slice(0, -1); // Use only completed candles
      // console.log(`  🏛️ TEMPLATE: Completed daily bars: ${completedDaily.length}`);
      const latest = completedDaily[completedDaily.length - 1];
      const entryPrice = currentPrice || latest?.close || 0;

      if (entryPrice <= 0) {
        return this.createAvoidSignal('INVALID_PRICE', 'Invalid current price for Template analysis');
      }

      // console.log(`  🏛️ TEMPLATE: Analyzing ${symbol || 'stock'} at $${entryPrice.toFixed(2)}`);

      // Execute the 8-criteria Template analysis
      const templateAnalysis = this.executeTemplateAnalysis(completedDaily, indicators, entryPrice, thresholds);

      // Calculate risk/reward using Template methodology
      const riskAssessment = this.assessRisk(templateAnalysis, completedDaily, entryPrice, indicators);

      // Generate final decision WITHOUT AI enhancement (AI handled by Gate Engine)
      const rawDecision = this.makeFinalDecision(templateAnalysis, riskAssessment, completedDaily,
        { capital, symbol, entryPrice },
        thresholds
      );

      // 🔒 SIMPLE STABILITY: Apply signal stabilization for swing trading
      // console.log(`  🏛️ TEMPLATE: Raw decision - Action: ${rawDecision.action}, Confidence: ${(rawDecision.confidence * 100).toFixed(1)}%`);

      // Calculate current bar index (days since start of data)
      const barIndex = completedDaily.length - 1;

      const stabilizedDecision = this.stabilityManager.stabilize(
        symbol || 'UNKNOWN',
        {
          action: rawDecision.action,
          confidence: rawDecision.confidence,
          reasoning: rawDecision.reasoning,
          factors: rawDecision.factors,
          stopLoss: riskAssessment.stopLoss
        },
        barIndex,
        entryPrice,
        true // isBarClosed = true for EOD analysis
      );

      // console.log(`  🏛️ TEMPLATE: Raw: ${rawDecision.action}, Stabilized: ${stabilizedDecision.action}${stabilizedDecision.stabilized ? ' [STABILIZED]' : ''}, Confidence: ${(stabilizedDecision.confidence * 100).toFixed(1)}%`);

      // Calculate signal quality for gate engine integration
      const signalQuality = this.calculateSignalQuality(stabilizedDecision.confidence, templateAnalysis);

      // Build execution plan
      const execution = this.buildExecutionPlan(stabilizedDecision, riskAssessment, templateAnalysis, entryPrice, capital, completedDaily, indicators);

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
   * MINERVINI TEMPLATE ADVANCED - RULES & IMPACT ON SIGNAL
   * Rule 1: Price > 150 SMA && 150 SMA trending up → Confirms medium-term strength. (Weight: High)
   * Rule 2: Price > 200 SMA && 200 SMA trending up → Confirms long-term trend. (Weight: High)
   * Rule 3: 150 SMA > 200 SMA → Validates moving average hierarchy. (Weight: Medium)
   * Rule 4: Price within X% of 52-week high → Ensures not extended. (Weight: High)
   * Rule 5: Price is Y% above 52-week low → Avoids weak base stocks. (Weight: Medium)
   * Rule 6: RS Rating > 70 → Confirms relative strength. (Weight: High)
   * Rule 7: Volume surge > 50% → Institutional footprint. (Weight: High)
   * Rule 8: EPS or Sales momentum (proxy) → Growth leadership. (Weight: Medium)
   *
   * ➤ Scoring:
   * Each rule contributes a score. If ≥ 6 pass, we flag WATCH.
   * If volume + RS + price structure + trend hierarchy = PASS, we allow BUY candidate.
   */
  /**
   * Execute the 8-criteria Minervini Template analysis
   */
  executeTemplateAnalysis(dailyData, indicators, currentPrice, thresholds) {
    // console.log(`  🏛️ TEMPLATE: Executing 8-criteria template validation...`);

    const criteria = {};
    const reasoning = [];
    let totalScore = 0;

    // 🚨 EMERGENCY FIX: Get SMA data from correct location (arrays or latest values)
    const sma150 = indicators?.sma150 || [];
    const sma200 = indicators?.sma200 || [];

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

    // console.log(`  🏛️ TEMPLATE: SMA150=${currentSMA150?.toFixed(2)}, SMA200=${currentSMA200?.toFixed(2)}, Price=${currentPrice?.toFixed(2)}`);

    // Fallback if still no data
    if (!currentSMA150 || !currentSMA200) {
      return this.createAvoidSignal('MISSING_SMA', 'Missing SMA150/SMA200 data for Template analysis');
    }

    // Calculate 52-week high/low
    const last252Days = dailyData.slice(-252); // 1 year
    const high52Week = Math.max(...last252Days.map(d => d.high));
    const low52Week = Math.min(...last252Days.map(d => d.low));

    // --- RULE 1: Price > 150 SMA && 150 SMA trending up (Medium-term strength, BUY/WATCH impact: High)
    const rule1 = currentPrice > currentSMA150 && currentSMA150 > prevSMA150;
    const rule1Score = rule1 ? 1.0 : 0.0;
    criteria.criterion1 = {
      passed: rule1,
      value: currentPrice,
      threshold: currentSMA150,
      score: rule1Score,
      details: `Rule 1: Price $${currentPrice.toFixed(2)} ${rule1 ? '>' : '≤'} SMA150 $${currentSMA150?.toFixed(2)}, SMA150 trending ${currentSMA150 > prevSMA150 ? 'UP' : 'DOWN'}`
    };
    totalScore += rule1Score;
    if (rule1) reasoning.push('Rule 1: Price above rising 150-day SMA (medium-term strength)');

    // --- RULE 2: Price > 200 SMA && 200 SMA trending up (Long-term trend, BUY/WATCH impact: High)
    const rule2 = currentPrice > currentSMA200 && currentSMA200 > prevSMA200;
    const rule2Score = rule2 ? 1.0 : 0.0;
    criteria.criterion2 = {
      passed: rule2,
      value: currentPrice,
      threshold: currentSMA200,
      score: rule2Score,
      details: `Rule 2: Price $${currentPrice.toFixed(2)} ${rule2 ? '>' : '≤'} SMA200 $${currentSMA200?.toFixed(2)}, SMA200 trending ${currentSMA200 > prevSMA200 ? 'UP' : 'DOWN'}`
    };
    totalScore += rule2Score;
    if (rule2) reasoning.push('Rule 2: Price above rising 200-day SMA (long-term trend)');

    // --- RULE 3: 150 SMA > 200 SMA (MA hierarchy, BUY/WATCH impact: Medium)
    const rule3 = currentSMA150 > currentSMA200;
    const rule3Score = rule3 ? 1.0 : 0.0;
    criteria.criterion3 = {
      passed: rule3,
      value: currentSMA150,
      threshold: currentSMA200,
      score: rule3Score,
      details: `Rule 3: SMA150 $${currentSMA150?.toFixed(2)} ${rule3 ? '>' : '≤'} SMA200 $${currentSMA200?.toFixed(2)}`
    };
    totalScore += rule3Score;
    if (rule3) reasoning.push('Rule 3: 150 SMA > 200 SMA (trend hierarchy validated)');

    // --- Optional: define helper variables for strongVolume, RS, fundamentalsStrong
    // Calculate breakoutVolume and avgVolume for strongVolume
    const recentVolumes = [
      dailyData[dailyData.length - 1]?.volume || 0,
      dailyData[dailyData.length - 2]?.volume || 0,
      dailyData[dailyData.length - 3]?.volume || 0
    ];
    const avgVolume = this.calculateAverageVolume(dailyData.slice(-50));
    const breakoutVolume = recentVolumes[0];
    const strongVolume = breakoutVolume >= 2.0 * avgVolume;
    const RS = this.calculateMomentumScore(dailyData, currentPrice, thresholds);
    const fundamentalScore = this.calculateFundamentalProxy(dailyData, currentPrice);
    const fundamentalsStrong = fundamentalScore >= 75;

    // --- RULE 4: Price within X% of 52-week high (Not extended, BUY/WATCH impact: High)
    const distanceFromHigh = (high52Week - currentPrice) / high52Week;
    // Patch: dynamic threshold for criterion4_high_proximity_threshold
    const criterion4_high_proximity_threshold = (strongVolume && RS > 80 && fundamentalsStrong) ? 0.25 : 0.20;
    const rule4 = distanceFromHigh <= criterion4_high_proximity_threshold;
    const rule4Score = rule4 ? 1.0 : 0.0;
    criteria.criterion4 = {
      passed: rule4,
      value: distanceFromHigh * 100,
      threshold: criterion4_high_proximity_threshold * 100,
      score: rule4Score,
      details: `Rule 4: Price $${currentPrice.toFixed(2)} is ${(distanceFromHigh * 100).toFixed(1)}% from 52-week high $${high52Week.toFixed(2)}`
    };
    totalScore += rule4Score;
    if (rule4) reasoning.push(`Rule 4: Within ${(criterion4_high_proximity_threshold * 100).toFixed(0)}% of 52-week high (${(distanceFromHigh * 100).toFixed(1)}% away)`);

    // --- RULE 5: Price is Y% above 52-week low (Avoids weak bases, BUY/WATCH impact: Medium)
    const distanceFromLow = (currentPrice - low52Week) / low52Week;
    let rule5 = distanceFromLow >= thresholds.criterion5_low_distance_threshold;
    let rule5Score = rule5 ? Math.min(1.0, distanceFromLow / 0.5) : 0.0;
    // Patch: Make rule5 non-blocking, adjust confidence and reasons if not passed
    let rule5_passed = true;
    let rule5_confidence_penalty = 0;
    let rule5_reason = '';
    if (!rule5) {
      rule5_confidence_penalty = 0.05;
      rule5_reason = "Price still close to recent lows (riskier setup)";
    }
    criteria.criterion5 = {
      passed: rule5_passed,
      value: distanceFromLow * 100,
      threshold: thresholds.criterion5_low_distance_threshold * 100,
      score: rule5Score,
      details: `Rule 5: Price $${currentPrice.toFixed(2)} is ${(distanceFromLow * 100).toFixed(1)}% above 52-week low $${low52Week.toFixed(2)}`
    };
    totalScore += rule5Score;
    if (rule5) {
      reasoning.push(`Rule 5: Strong recovery: ${(distanceFromLow * 100).toFixed(1)}% above 52-week low`);
    } else {
      reasoning.push(rule5_reason);
    }

    // --- RULE 6: Momentum Score (proxy for RS), BUY/WATCH impact: High
    const momentumScore = this.calculateMomentumScore(dailyData, currentPrice, thresholds);
    const rule6 = momentumScore > thresholds.criterion6_relative_strength;
    const rule6Score = rule6 ? (momentumScore - 50) / 50 : momentumScore / thresholds.criterion6_relative_strength;
    criteria.criterion6 = {
      passed: rule6,
      value: momentumScore,
      threshold: thresholds.criterion6_relative_strength,
      score: rule6Score,
      details: `Rule 6: Momentum Score ${momentumScore.toFixed(1)} ${rule6 ? '>' : '≤'} ${thresholds.criterion6_relative_strength} (vs benchmark over 6 months)`
    };
    totalScore += rule6Score;
    if (rule6) reasoning.push(`Rule 6: Exceptional momentum vs benchmark: ${momentumScore.toFixed(1)}`);

    // --- RULE 7: Volume surge > 50% (Institutional footprint, BUY/WATCH impact: High)
    // Patch: Use recentVolumes check for volume breakout
    // Use avgVolume from above
    const todayVolume = recentVolumes[0];
    const yesterdayVolume = recentVolumes[1];
    const twoDaysAgoVolume = recentVolumes[2];
    const volumeBreakout = [todayVolume, yesterdayVolume, twoDaysAgoVolume].some(v => v >= 1.6 * avgVolume);
    const volumeAnalysis = this.analyzeBreakoutVolume(dailyData, currentPrice, thresholds);
    const rule7 = volumeBreakout;
    const rule7Score = rule7 ? Math.min(1.0, (todayVolume / avgVolume) / 2.0) : (todayVolume / avgVolume) / thresholds.criterion7_volume_multiplier;
    criteria.criterion7 = {
      passed: rule7,
      value: todayVolume / avgVolume,
      threshold: 1.6, // hardcoded for this new logic
      score: rule7Score,
      details: `Rule 7: Recent volume ${todayVolume.toLocaleString()} vs avg ${avgVolume.toLocaleString()} (${(todayVolume / avgVolume).toFixed(2)}x)`
    };
    totalScore += rule7Score;
    if (rule7) reasoning.push(`Rule 7: Strong volume breakout: ${(todayVolume / avgVolume).toFixed(2)}x average in recent days`);

    // --- RULE 8: EPS or Sales momentum (proxy) (Growth leadership, BUY/WATCH impact: Medium)
    // Patch: downgrade effect to confidence only
    const fundamentalProxy = fundamentalScore;
    let rule8 = fundamentalProxy > thresholds.criterion8_fundamental_score;
    let rule8Score = rule8 ? (fundamentalProxy - 40) / 60 : fundamentalProxy / thresholds.criterion8_fundamental_score;
    let rule8_passed = true;
    let rule8_confidence_penalty = 0;
    let rule8_reason = '';
    if (fundamentalProxy < 60) {
      rule8_passed = true;
      rule8_confidence_penalty = 0.1;
      rule8_reason = "Weak fundamentals; price action may be speculative";
    }
    criteria.criterion8 = {
      passed: rule8_passed,
      value: fundamentalProxy,
      threshold: thresholds.criterion8_fundamental_score,
      score: rule8Score,
      details: `Rule 8: Fundamental proxy ${fundamentalProxy.toFixed(1)} ${rule8 ? '>' : '≤'} ${thresholds.criterion8_fundamental_score} (momentum-based estimate)`
    };
    totalScore += rule8Score;
    if (rule8) {
      reasoning.push(`Rule 8: Strong fundamental proxy: ${fundamentalProxy.toFixed(1)}/100`);
    } else if (rule8_reason) {
      reasoning.push(rule8_reason);
    }

    // Calculate overall metrics
    const overallScore = totalScore / 8.0; // Normalize to 0-1
    const passedCriteria = Object.values(criteria).filter(c => c.passed).length;

    // Compose rule variables for external use (for final decision logic)
    // Patch: use rule5_passed and rule8_passed for external logic
    criteria.rule1 = rule1;
    criteria.rule2 = rule2;
    criteria.rule3 = rule3;
    criteria.rule4 = rule4;
    criteria.rule5 = rule5_passed;
    criteria.rule6 = rule6;
    criteria.rule7 = rule7;
    criteria.rule8 = rule8_passed;

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

    // Apply confidence penalties for rule5 and rule8 if not passed
    if (rule5_confidence_penalty) confidence -= rule5_confidence_penalty;
    if (rule8_confidence_penalty) confidence -= rule8_confidence_penalty;
    if (confidence < 0) confidence = 0;

    // console.log(`  🏛️ TEMPLATE: Score ${(overallScore * 100).toFixed(1)}% (${passedCriteria}/8 criteria), Grade: ${templateGrade}`);

    return {
      criteria,
      overallScore,
      templateGrade,
      confidence,
      reasoning,
      // Expose rule variables for external logic (for clarity)
      rule1, rule2, rule3, rule4, rule5: rule5_passed, rule6, rule7, rule8: rule8_passed
    };
  }

  /**
   * Make final trading decision based on Template analysis (using rule block logic)
   */
  makeFinalDecision(templateAnalysis, riskAssessment, dailyData, options, thresholds) {
    const { confidence, reasoning, overallScore, criteria, rule1, rule2, rule3, rule4, rule5, rule6, rule7, rule8 } = templateAnalysis;
    const { riskReward } = riskAssessment;

    // Use rule variables for new decision logic
    const passedRules = [rule1, rule2, rule3, rule4, rule5, rule6, rule7, rule8].filter(Boolean).length;

    let decision = 'REJECTED';
    if (passedRules >= 6) {
      decision = 'WATCH';
    }
    // Patch: BUY decision logic checks for non-negotiable rules (1,2,3,4,6,7)
    if (rule1 && rule2 && rule3 && rule4 && rule6 && rule7) {
      decision = 'BUY';
    }
    // Patch: WATCH downgrade logic for strong template but weak trend
    if (
      templateAnalysis.templateGrade === 'A+' &&
      rule6 && rule7 && rule4 && rule8 &&
      (!rule1 || !rule2)
    ) {
      decision = 'WATCH';
      reasoning.push("Strong breakout, but trend not yet confirmed. Wait for SMA150/200 alignment.");
    }
    reasoning.push('Failed Rules: --------------');
    if (!rule1) reasoning.push("Rule 1 : Price is not above or SMA150 is not rising.");
    if (!rule2) reasoning.push("Rule 2 : Price is not above or SMA200 is not rising.");
    if (!rule3) reasoning.push("Rule 3 : SMA150 is not above SMA200 — trend hierarchy missing.");
    if (!rule4) reasoning.push("Rule 4 : Price is more than 25% below 52-week high.");
    if (!rule5) reasoning.push("Rule 5 : Price is less than 30% above 52-week low.");
    if (!rule6) reasoning.push("Rule 6 : Relative Strength is below threshold.");
    if (!rule7) reasoning.push("Rule 7 : Volume breakout is insufficient.");
    if (!rule8) reasoning.push("Rule 8 : Fundamental score is weak.");

    // Compose reasoning
    let finalConfidence = confidence;
    let decisionReasoning = reasoning.join('; ');
    if (decision === 'BUY') {
      finalConfidence = Math.max(0.9, confidence);
      decisionReasoning = `BUY candidate: Key Minervini rules (1,2,3,4,6,7) passed. ${decisionReasoning}`;
    } else if (decision === 'WATCH') {
      finalConfidence = Math.max(0.6, confidence);
      decisionReasoning = `WATCH candidate: ${passedRules}/8 rules passed. ${decisionReasoning}`;
    } else {
      decision = 'AVOID';
      finalConfidence = Math.max(0.2, confidence * 0.8);
      decisionReasoning = `REJECTED: Insufficient Template rules met (${passedRules}/8). ${decisionReasoning}`;
    }

    return {
      action: decision,
      confidence: finalConfidence,
      reasoning: decisionReasoning,
      factors: {
        passedRules,
        rule1, rule2, rule3, rule4, rule5, rule6, rule7, rule8,
        overallScore,
        criteriaCount: Object.values(criteria).filter(c => c.passed).length,
        riskReward
      }
    };
  }

  /**
   * Assess risk and calculate stop losses and targets using Template methodology
   */
  assessRisk(templateAnalysis, dailyData, currentPrice, indicators) {
    const latest = dailyData[dailyData.length - 1];
    const atr = Number(indicators.atr).toFixed(2);
    const support = indicators.support; //Calculated via findNextSupportLevel
    const nextResistance = indicators.resistance; //Calculated via findNextResistanceLevel

    const percentStop = currentPrice * 0.925;
    const atrStop = currentPrice - (atr * 2.0);

    // Apply buffer to support, and validate it
    const supportBuffer = 0.98;

    const supportDifference = Number((((currentPrice - support) / currentPrice) * 1000).toFixed(2));
    const useSupport = support && (currentPrice - support) / currentPrice > 0.03;
    const bufferedSupport = useSupport ? support * supportBuffer : null;

    const stopLoss = bufferedSupport || Math.min(percentStop, atrStop);

    const stopDistance = stopLoss > 0 ? Number(((currentPrice - stopLoss) / currentPrice) * 100).toFixed(2) : 0;
    // console.log(`  🏛️ TEMPLATE: Stop Loss at $${stopLoss.toFixed(2)} (${stopDistance} ‰ below current price)`);
    // if (stopDistance < 5) {
    //   console.log(`    Current Price: ${currentPrice}
    // Percent Stop: $${percentStop.toFixed(2)},
    // ATR Stop: ATR: ${atr} ATR Stop $${atrStop.toFixed(2)},
    // Support: ${support} : Difference ${supportDifference}%
    // Buffered Support: ${bufferedSupport ? bufferedSupport : 0}%
    // Stop Loss: $${stopLoss.toFixed(2)}`);
    // }


    // FIXED: Dynamic targets based on nearest resistance levels and ATR
    const riskAmount = currentPrice - stopLoss;

    // Calculate dynamic targets based on volatility and recent price action
    const volatility = this.calculateVolatility(dailyData.slice(-10));
    const recentHigh = Math.max(...dailyData.slice(-20).map(d => d.high));


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
      // console.log(`  🎯 R/R ENFORCEMENT: Target adjusted from ${originalResistanceTarget.toFixed(2)} to ${actualTarget.toFixed(2)} for minimum 2.5:1 R/R`);
    }

    const riskPercentage = (currentPrice - stopLoss) / currentPrice;

    return {
      stopLoss: Math.round(stopLoss * 100) / 100,
      targets: targets.map(t => Math.round(t * 100) / 100),
      riskReward: Math.round(riskReward * 100) / 100, // FIXED: Always return number, not object
      atr: Math.round(atr * 100) / 100,
      riskPercentage: Math.round(riskPercentage * 100) / 100, // Round to 2 decimal places, not 4
      nextResistance: nextResistance ? Math.round(nextResistance) : null, // Round to nearest dollar
      volatility: Math.round(volatility * 100) / 100 // Round to 2 decimal places, not 4
    };
  }

  /**
   * Build execution plan with Template-specific entry/exit strategies
   */
  buildExecutionPlan(decision, riskAssessment, templateAnalysis, entryPrice, capital = 100000, dailyData, indicators) {
    if (decision.action === 'AVOID') return null;

    const positionSizing = this.calculateTemplatePositionSizing(
      decision.confidence,
      { capital, entryPrice },
      riskAssessment,
      templateAnalysis
    );

    return {
      entryStrategy: this.buildPreciseTemplateEntryStrategy(templateAnalysis, decision.action, riskAssessment, dailyData, entryPrice, indicators),
      exitStrategy: this.buildPreciseTemplateExitStrategy(riskAssessment, templateAnalysis, decision.action, dailyData, entryPrice),
      positionSizing: positionSizing,
      executionNotes: this.generateTemplateExecutionNotes(templateAnalysis, decision.action)
    };
  }

  /**
   * Build dynamic Template entry strategy with calculated parameters
   */
  buildPreciseTemplateEntryStrategy(templateAnalysis, signal, riskAssessment, dailyData, currentPrice, indicators) {
    const latest = dailyData[dailyData.length - 1];
    const atr = indicators.atr
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
        conservative: riskAssessment.targets[0],
        moderate: riskAssessment.targets[1],
        aggressive: riskAssessment.targets[2],
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
        console.log(`  ⚠️ TEMPLATE: Invalid risk per share: ${riskPerShare.toFixed(2)} (entry: ${entryPrice}, stop: ${stopLoss})`); // Practical precision
      }
    } else {
      console.log(`  ⚠️ TEMPLATE: Position sizing skipped - recommendation: ${recommendation}, entryPrice: ${entryPrice}, stopLoss: ${stopLoss}, capital: ${capital}`);
    }

    // 🎯 UNIFIED SCORING DEBUG INFO
    // console.log(`  🎯 UNIFIED SCORING: Template ${templateAnalysis.templateGrade}(${templateScore}) + Signal ${signalQualityGrade}(${signalScore}) = ${totalScore.toFixed(1)} → ${recommendation}`);

    const stopDistance = stopLoss > 0 ? Number(((entryPrice - stopLoss) / entryPrice) * 100).toFixed(2) : 0;
    return {
      recommendation,
      riskPercent,
      maxPosition,
      shares: Math.max(0, shares),
      positionValue: positionValue,
      riskAmount: riskAmount,
      riskPerShare: Math.round((entryPrice - stopLoss) * 100) / 100,
      stopDistance: stopDistance,
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

  validateData(indicators, series) {
    // FIXED: Require 252+ days for proper 52-week calculations
    if (!series || series.length < 252) {
      console.log(`  ❌ MINERVINI: Insufficient data - need 252+ days for 52-week calculations, got ${series?.length || 0}`);
      return false;
    }

    // 🚨 EMERGENCY FIX: Check both base arrays and latest values for SMA data
    const hasSMA150 = indicators?.sma150 || indicators?.latest?.sma150;
    const hasSMA200 = indicators?.sma200 || indicators?.latest?.sma200;

    if (!hasSMA150 || !hasSMA200) {
      console.log(`  ❌ MINERVINI: Missing SMA data - SMA150: ${!!hasSMA150}, SMA200: ${!!hasSMA200}`);
      return false;
    }

    // console.log(`  ✅ MINERVINI: Data validation passed - ${series.daily.length} days, SMA150: ${!!hasSMA150}, SMA200: ${!!hasSMA200}`);
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
      returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
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
  calculateMomentumScore(dailyData, currentPrice, thresholds) {
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
      if (highs[i] > highs[i - 1] && highs[i] > highs[i - 2] &&
        highs[i] > highs[i + 1] && highs[i] > highs[i + 2]) {
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
}

module.exports = MinerviniTemplateAdvanced;
