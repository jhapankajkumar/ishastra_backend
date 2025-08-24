/**
 * Elder's Triple Screen Trading System
 * 
 * A complete implementation of Alexander Elder's Triple Screen methodology:
 * - Screen 1 (Weekly): Trend identification using MACD and EMA
 * - Screen 2 (Daily): Counter-trend oscillator entry using Stochastic
 * - Screen 3 (Intraday): Precise timing with volume confirmation
 * 
 * Integrates with existing gate-based decision engine for:
 * - Risk/reward validation
 * - Trade readiness assessment  
 * - Dynamic position sizing
 * - Trend restrictions and earnings proximity
 */

class ElderTripleScreen {
  constructor() {
    this.systemId = 'elder_triple_screen';
    this.name = 'Elder Triple Screen (Strict)';
    this.version = '1.0.1';
    this.description = 'Multi-timeframe trend-following system with precise entry timing';
  }

  /**
   * Analyze ticker using Elder's Triple Screen methodology
   * @param {Object} tickerData - Pre-computed indicators from MultiSystemDataGenerator
   * @param {Object} options - Analysis options
   * @returns {Object} Complete Elder's analysis with BUY/SELL/WATCH/AVOID + confidence
   */
  analyze(tickerData, options = {}) {
    try {
      const { indicators, series } = tickerData;
      //console.log(`🔍 [ELDER] Starting analysis for ${tickerData.meta?.symbol}`);

      // Validate required data
      if (!this.validateData(indicators, series)) {
        //console.log('🔍 [ELDER] Data validation failed');
        return this.createAvoidSignal('INSUFFICIENT_DATA', 'Missing required weekly/daily/intraday data');
      }

      // Execute the three screens
      const screen1 = this.executeScreen1(indicators.triple_screen, series.weekly);
      const screen2 = this.executeScreen2(indicators.triple_screen, indicators.base, series.daily);
      const screen3 = this.executeScreen3(series.intraday, series.daily);

      // Combine screens for final signal
      const combinedAnalysis = this.combineScreens(screen1, screen2, screen3);

      // if (combinedAnalysis.overallSignal === 'AVOID') {
      //   return {
      //     system: this.systemId,
      //     systemName: this.name,
      //     decision: combinedAnalysis.overallSignal,
      //     confidence: 0,
      //     reasoning: combinedAnalysis.reasoning,
      //   }
      // }

      // Calculate risk/reward using current market data
      const riskReward = this.calculateRiskReward(series.daily, combinedAnalysis);

      // Generate final decision with confidence
      const decision = this.generateDecision(combinedAnalysis, riskReward, indicators);

      return {
        system: this.systemId,
        systemName: this.name,
        decision: decision.action,
        confidence: decision.confidence,
        reasoning: combinedAnalysis.reasoning,

        // Detailed screen breakdown
        screens: {
          screen1: { ...screen1, description: 'Weekly Trend (MACD/EMA)' },
          screen2: { ...screen2, description: 'Daily Counter-trend (Stochastic)' },
          screen3: { ...screen3, description: 'Intraday Timing (Volume)' }
        },

        // Risk management
        riskReward: riskReward,

        // Execution details
        executionPlan: decision.executionPlan,

        // Quality metrics for gate engine
        signalQuality: decision.signalQuality,

        // System metadata
        timestamp: new Date().toISOString(),
        dataQuality: this.assessDataQuality(indicators, series)
      };

    } catch (error) {
      console.error('Elder Triple Screen analysis error:', error);
      return this.createAvoidSignal('ANALYSIS_ERROR', `System error: ${error.message}`);
    }
  }

  /**
   * SCREEN 1: Weekly MACD Histogram Slope (Elder strict method)
   */
  executeScreen1(tripleScreenIndicators, weeklyData) {
    const { weeklyMACDHist, weeklyMACDHist_1, weeklyMACDHist_2, weeklyEMA10, weeklyEMA40 } = tripleScreenIndicators;

    const screen1 = {
      timeframe: 'weekly',
      status: 'NEUTRAL',
      signal: 'NEUTRAL',
      strength: 0,
      components: {},
      reasoning: []
    };
    // MACD Histogram Slope
    const macdHistSlopeUp = weeklyMACDHist > weeklyMACDHist_1 && weeklyMACDHist_1 > weeklyMACDHist_2;
    const macdHistSlopeDown = weeklyMACDHist < weeklyMACDHist_1 && weeklyMACDHist_1 < weeklyMACDHist_2;
    screen1.components.macdHistSlope = {
      values: { weeklyMACDHist, weeklyMACDHist_1, weeklyMACDHist_2 },
      up: macdHistSlopeUp,
      down: macdHistSlopeDown
    };
    // EMA Trend
    let emaTrend = 'NEUTRAL';
    let emaStrength = 0;
    if (typeof weeklyEMA10 === 'number' && typeof weeklyEMA40 === 'number') {
      emaTrend = weeklyEMA10 > weeklyEMA40 ? 'UPTREND' : 'DOWNTREND';
      const emaSpread = Math.abs(weeklyEMA10 - weeklyEMA40) / Math.max(Math.abs(weeklyEMA40), 0.001);
      emaStrength = Math.min(emaSpread * 100, 100);
    }
    screen1.components.ema = {
      trend: emaTrend,
      strength: emaStrength,
      values: {
        ema10: weeklyEMA10 || 0,
        ema40: weeklyEMA40 || 0,
        spread: emaStrength / 100
      }
    };
    // Combine for Screen 1 decision (only MACD slope required by strict Elder)
    if (macdHistSlopeUp) {
      screen1.signal = 'BULLISH';
      screen1.status = 'GO_LONG';
      screen1.strength = 90;
      screen1.reasoning.push('Weekly MACD histogram slope up (3 bars rising)');
    } else if (macdHistSlopeDown) {
      screen1.signal = 'BEARISH';
      screen1.status = 'GO_SHORT';
      screen1.strength = 90;
      screen1.reasoning.push('Weekly MACD histogram slope down (3 bars falling)');
    } else {
      screen1.signal = 'NEUTRAL';
      screen1.status = 'NO_TRADE';
      screen1.strength = 0;
      screen1.reasoning.push('Weekly MACD histogram slope unclear');
    }
    return screen1;
  }

  /**
   * SCREEN 2: Daily Pullback via Oscillator (RSI, Stochastic, Force Index)
   */
  executeScreen2(tripleScreenIndicators, baseIndicators, dailyData) {
    // Inputs: rsi14, stochasticK, stochasticD, dailyForceIndex
    const { rsi14, stochasticK, stochasticD, dailyForceIndex } = {
      rsi14: baseIndicators.rsi14,
      stochasticK: tripleScreenIndicators.dailyStochK ?? tripleScreenIndicators.dailyStoch, // fallback
      stochasticD: tripleScreenIndicators.dailyStochD ?? tripleScreenIndicators.dailyStoch, // fallback
      dailyForceIndex: tripleScreenIndicators.dailyForceIndex
    };
    
    const screen2 = {
      timeframe: 'daily',
      status: 'NEUTRAL',
      signal: 'NEUTRAL',
      strength: 0,
      components: {},
      reasoning: []
    };
    
    // More sophisticated pullback logic with stricter Elder criteria
    const rsiOversold = rsi14 < 40;        // More strict: oversold territory
    const rsiModeratelyLow = rsi14 < 50 && rsi14 >= 40;  // Moderately low
    const stochasticPullback = stochasticK < stochasticD;
    const stochasticOversold = stochasticK < 30;  // Oversold stochastic
    const forceIndexNegative = dailyForceIndex < 0;
    const forceIndexStronglyNegative = dailyForceIndex < -1000; // Strong negative force
    
    // Count different levels of pullback confirmation
    let pullbackScore = 0;
    const pullbackReasons = [];
    
    // RSI scoring
    if (rsiOversold) {
      pullbackScore += 2;
      pullbackReasons.push('RSI oversold (<40)');
    } else if (rsiModeratelyLow) {
      pullbackScore += 1;
      pullbackReasons.push('RSI below 50');
    }
    
    // Stochastic scoring
    if (stochasticOversold && stochasticPullback) {
      pullbackScore += 2;
      pullbackReasons.push('Stochastic oversold & declining');
    } else if (stochasticPullback) {
      pullbackScore += 1;
      pullbackReasons.push('Stochastic declining');
    }
    
    // Force Index scoring
    if (forceIndexStronglyNegative) {
      pullbackScore += 2;
      pullbackReasons.push('Strong negative force index');
    } else if (forceIndexNegative) {
      pullbackScore += 1;
      pullbackReasons.push('Negative force index');
    }
    
    screen2.components = {
      rsi14, stochasticK, stochasticD, dailyForceIndex,
      rsiOversold, rsiModeratelyLow, stochasticPullback, stochasticOversold,
      forceIndexNegative, forceIndexStronglyNegative, pullbackScore
    };
    
    // Determine signal based on pullback score with three tiers
    if (pullbackScore >= 5) {
      screen2.signal = 'STRONG_PULLBACK_CONFIRMED';
      screen2.status = 'EXCEPTIONAL_PULLBACK';
      screen2.strength = 98;
      screen2.reasoning.push(`Exceptional pullback confirmed (score: ${pullbackScore}/6): ${pullbackReasons.join(', ')}`);
    } else if (pullbackScore >= 3) {
      screen2.signal = 'PULLBACK_CONFIRMED';
      screen2.status = 'STRONG_PULLBACK';
      screen2.strength = 85 + (pullbackScore * 3); // 88-97 range
      screen2.reasoning.push(`Strong pullback confirmed (score: ${pullbackScore}/6): ${pullbackReasons.join(', ')}`);
    } else if (pullbackScore >= 2) {
      screen2.signal = 'MODERATE_PULLBACK_CONFIRMED';
      screen2.status = 'PULLBACK';
      screen2.strength = 65 + (pullbackScore * 5); // 70-75 range
      screen2.reasoning.push(`Moderate pullback confirmed (score: ${pullbackScore}/6): ${pullbackReasons.join(', ')}`);
    } else if (pullbackScore >= 1) {
      screen2.signal = 'WEAK_PULLBACK';
      screen2.status = 'WEAK_PULLBACK';
      screen2.strength = 40;
      screen2.reasoning.push(`Weak pullback detected (score: ${pullbackScore}/6): ${pullbackReasons.join(', ')}`);
    } else {
      screen2.signal = 'NO_PULLBACK';
      screen2.status = 'NO_PULLBACK';
      screen2.strength = 0;
      screen2.reasoning.push('No significant pullback detected - oscillators not oversold');
    }
    
    return screen2;
  }

  /**
   * SCREEN 3: Entry Trigger (Elder strict method: EMA10 breakout)
   */
  executeScreen3(intradayData, dailyData) {
    // Use daily bars for trigger (most recent two closes and EMA10)
    const screen3 = {
      timeframe: 'entry',
      status: 'NEUTRAL',
      signal: 'NEUTRAL',
      strength: 0,
      components: {},
      reasoning: []
    };
    if (!dailyData || dailyData.length < 2) {
      screen3.reasoning.push('Not enough daily bars for entry trigger');
      return screen3;
    }
    const latest = dailyData[dailyData.length - 1];
    const previous = dailyData[dailyData.length - 2];
    const ema10 = latest.ema10 !== undefined ? latest.ema10 : latest.EMA10;
    // Strict Elder trigger: price crosses EMA10 up or down
    const trigger = latest.close > ema10 && previous.close <= ema10;
    const triggerDown = latest.close < ema10 && previous.close >= ema10;
    screen3.components = { latestClose: latest.close, previousClose: previous.close, ema10, trigger, triggerDown };
    if (trigger) {
      screen3.signal = 'TRIGGER_UP';
      screen3.status = 'BREAKOUT';
      screen3.strength = 100;
      screen3.reasoning.push('Price crossed above EMA10');
    } else if (triggerDown) {
      screen3.signal = 'TRIGGER_DOWN';
      screen3.status = 'BREAKDOWN';
      screen3.strength = 100;
      screen3.reasoning.push('Price crossed below EMA10');
    } else {
      screen3.signal = 'NO_TRIGGER';
      screen3.status = 'NO_TRIGGER';
      screen3.strength = 0;
      screen3.reasoning.push('No EMA10 breakout trigger');
    }
    return screen3;
  }

  /**
   * Combine all three screens for final Elder's decision (strict method)
   */
  combineScreens(screen1, screen2, screen3) {
    // Determine supporting and conflicting screens
    const supportingScreens = [];
    const conflictingScreens = [];
    
    // Analyze screen relationships for three-tier watch system
    if (screen1.signal === 'BULLISH') {
      supportingScreens.push('Screen 1 (Weekly Bullish)');
      if (screen2.signal === 'STRONG_PULLBACK_CONFIRMED') {
        supportingScreens.push('Screen 2 (Exceptional Pullback)');
      } else if (screen2.signal === 'PULLBACK_CONFIRMED') {
        supportingScreens.push('Screen 2 (Strong Pullback)');
      } else if (screen2.signal === 'MODERATE_PULLBACK_CONFIRMED') {
        supportingScreens.push('Screen 2 (Moderate Pullback)');
      } else if (screen2.signal === 'WEAK_PULLBACK') {
        supportingScreens.push('Screen 2 (Weak Pullback)');
      } else if (screen2.signal === 'NO_PULLBACK') {
        conflictingScreens.push('Screen 2 (No Pullback Setup)');
      }
      
      if (screen3.signal === 'TRIGGER_UP') {
        supportingScreens.push('Screen 3 (Breakout Trigger)');
      } else if (screen3.signal === 'TRIGGER_DOWN') {
        conflictingScreens.push('Screen 3 (Conflicting Direction)');
      }
    } else if (screen1.signal === 'BEARISH') {
      supportingScreens.push('Screen 1 (Weekly Bearish)');
      if (screen2.signal === 'STRONG_PULLBACK_CONFIRMED') {
        supportingScreens.push('Screen 2 (Exceptional Pullback)');
      } else if (screen2.signal === 'PULLBACK_CONFIRMED') {
        supportingScreens.push('Screen 2 (Strong Pullback)');
      } else if (screen2.signal === 'MODERATE_PULLBACK_CONFIRMED') {
        supportingScreens.push('Screen 2 (Moderate Pullback)');
      } else if (screen2.signal === 'WEAK_PULLBACK') {
        supportingScreens.push('Screen 2 (Weak Pullback)');
      } else if (screen2.signal === 'NO_PULLBACK') {
        conflictingScreens.push('Screen 2 (No Pullback Setup)');
      }
      
      if (screen3.signal === 'TRIGGER_DOWN') {
        supportingScreens.push('Screen 3 (Breakdown Trigger)');
      } else if (screen3.signal === 'TRIGGER_UP') {
        conflictingScreens.push('Screen 3 (Conflicting Direction)');
      }
    } else {
      conflictingScreens.push('Screen 1 (No Clear Weekly Trend)');
    }

    // Strict Elder: Perfect alignment for BUY/SELL, three-tier WATCH system
    let signal = 'AVOID';
    
    // Perfect BUY/SELL signals - all 3 screens must align perfectly
    if (
      screen1.signal === 'BULLISH' &&
      (screen2.signal === 'STRONG_PULLBACK_CONFIRMED' || screen2.signal === 'PULLBACK_CONFIRMED' || screen2.signal === 'MODERATE_PULLBACK_CONFIRMED') &&
      screen3.signal === 'TRIGGER_UP'
    ) {
      signal = 'BUY';
    } else if (
      screen1.signal === 'BEARISH' &&
      (screen2.signal === 'STRONG_PULLBACK_CONFIRMED' || screen2.signal === 'PULLBACK_CONFIRMED' || screen2.signal === 'MODERATE_PULLBACK_CONFIRMED') &&
      screen3.signal === 'TRIGGER_DOWN'
    ) {
      signal = 'SELL';
    }
    // Three-tier WATCH system based on pullback strength
    else if (
      screen1.signal === 'BULLISH' &&
      screen2.signal === 'STRONG_PULLBACK_CONFIRMED' &&
      screen3.signal === 'NO_TRIGGER'
    ) {
      signal = 'STRONG_WATCH';
    } else if (
      screen1.signal === 'BEARISH' &&
      screen2.signal === 'STRONG_PULLBACK_CONFIRMED' &&
      screen3.signal === 'NO_TRIGGER'
    ) {
      signal = 'STRONG_WATCH';
    } else if (
      screen1.signal === 'BULLISH' &&
      (screen2.signal === 'PULLBACK_CONFIRMED' || screen2.signal === 'MODERATE_PULLBACK_CONFIRMED') &&
      screen3.signal === 'NO_TRIGGER'
    ) {
      signal = 'WATCH';
    } else if (
      screen1.signal === 'BEARISH' &&
      (screen2.signal === 'PULLBACK_CONFIRMED' || screen2.signal === 'MODERATE_PULLBACK_CONFIRMED') &&
      screen3.signal === 'NO_TRIGGER'
    ) {
      signal = 'WATCH';
    } else if (
      screen1.signal === 'BULLISH' &&
      screen2.signal === 'WEAK_PULLBACK' &&
      screen3.signal === 'NO_TRIGGER'
    ) {
      signal = 'WEAK_WATCH';
    } else if (
      screen1.signal === 'BEARISH' &&
      screen2.signal === 'WEAK_PULLBACK' &&
      screen3.signal === 'NO_TRIGGER'
    ) {
      signal = 'WEAK_WATCH';
    }

    return {
      overallSignal: signal,
      overallStrength:
        (signal === 'BUY' || signal === 'SELL')
          ? (screen1.strength + screen2.strength + screen3.strength) / 3
          : (signal === 'STRONG_WATCH')
            ? (screen1.strength + screen2.strength) / 2 * 1.1  // 10% bonus for strong setup
            : (signal === 'WATCH')
              ? (screen1.strength + screen2.strength) / 2
              : (signal === 'WEAK_WATCH')
                ? (screen1.strength + screen2.strength) / 2 * 0.7  // 30% penalty for weak setup
                : 0,
      screenAlignment: signal === 'BUY' || signal === 'SELL',
      conflictingScreens: conflictingScreens,
      supportingScreens: supportingScreens,
      reasoning: [
        signal === 'BUY'
          ? 'Weekly MACD uptrend + daily pullback + EMA10 breakout trigger'
          : signal === 'SELL'
            ? 'Weekly MACD downtrend + daily pullback + EMA10 breakdown trigger'
            : signal === 'STRONG_WATCH'
              ? 'Weekly trend + exceptional daily pullback, prime setup awaiting EMA10 trigger'
              : signal === 'WATCH'
                ? 'Weekly trend + daily pullback aligned, waiting for EMA10 trigger'
                : signal === 'WEAK_WATCH'
                  ? 'Weekly trend + weak daily pullback, waiting for stronger setup'
                  : 'Strict Elder alignment not met'
      ]
    };
  }

  /**
   * Calculate risk/reward for Elder's Triple Screen setup (ATR-based stop/targets)
   */
  calculateRiskReward(dailyData, combinedAnalysis) {
    // Use latest daily bar for stop/target calculation
    const latest = dailyData[dailyData.length - 1];
    const previous = dailyData[dailyData.length - 2] || latest;
    // Calculate ATR
    const atrPeriod = 14;
    const bars = dailyData.slice(-atrPeriod - 1);
    let atrSum = 0;
    for (let i = 1; i < bars.length; i++) {
      const tr = Math.max(
        bars[i].high - bars[i].low,
        Math.abs(bars[i].high - bars[i - 1].close),
        Math.abs(bars[i].low - bars[i - 1].close)
      );
      atrSum += tr;
    }
    const atr = atrSum / atrPeriod;
    // ATR-based stop/targets per Elder
    let stopLoss = null, targets = null, riskReward = null;
    const round2 = v => Math.round(v * 100) / 100;
    if (combinedAnalysis.overallSignal === 'BUY') {
      stopLoss = latest.low - atr * 1.5;
      targets = [latest.close + atr * 2, latest.close + atr * 3];
      riskReward = (targets[0] - latest.close) / (latest.close - stopLoss);
    } else if (combinedAnalysis.overallSignal === 'SELL') {
      stopLoss = latest.high + atr * 1.5;
      targets = [latest.close - atr * 2, latest.close - atr * 3];
      riskReward = (latest.close - targets[0]) / (stopLoss - latest.close);
    } else if (combinedAnalysis.overallSignal === 'STRONG_WATCH' || combinedAnalysis.overallSignal === 'WATCH' || combinedAnalysis.overallSignal === 'WEAK_WATCH') {
      return {
        stopLoss: null,
        targets: null,
        riskReward: 0,
        atr: round2(atr),
        latestClose: round2(latest.close)
      };
    } else {
      return {
        stopLoss: null,
        targets: null,
        riskReward: 0,
        atr,
        latestClose: latest.close
      };
    }
    return {
      stopLoss: round2(stopLoss),
      targets: targets.map(round2),
      riskReward: round2(riskReward),
      atr: round2(atr),
      latestClose: round2(latest.close)
    };
  }

  /**
   * Generate final Elder's Triple Screen decision with confidence and strict result object
   */
  generateDecision(combinedAnalysis, riskReward, indicators) {
    // Strict Elder result object with internal signal for confidence calculation
    let internalSignal = combinedAnalysis.overallSignal;
    let confidence = this.calculateConfidence(combinedAnalysis, riskReward, internalSignal);
    let reason = combinedAnalysis.reasoning.join('; ');

    // Map internal three-tier WATCH system to external WATCH signal
    let externalSignal = internalSignal;
    if (internalSignal === 'STRONG_WATCH' || internalSignal === 'WEAK_WATCH') {
      externalSignal = 'WATCH';
    }

    // Calculate signal quality for this decision
    const signalQuality = this.calculateSignalQuality(combinedAnalysis, riskReward);

    // Create execution plan based on signal
    let executionPlan = null;
    if (internalSignal === 'BUY' || internalSignal === 'SELL' || internalSignal === 'STRONG_WATCH' || internalSignal === 'WATCH' || internalSignal === 'WEAK_WATCH') {
      executionPlan = {
        strategy: 'Elder Triple Screen',
        timeframe: 'Multi-timeframe (Weekly/Daily/Intraday)',
        exitStrategy: {
          stopLoss: riskReward.stopLoss,
          targets: riskReward.targets,
          trailingStop: signal === 'BUY' || signal === 'SELL' ? true : false
        },
        positionSizing: {
          recommendation: confidence >= 0.8 ? 'FULL' : 
                        confidence >= 0.7 ? 'REDUCED' : 
                        confidence >= 0.6 ? 'CONSERVATIVE' : 
                        confidence >= 0.5 ? 'HALF' : 
                        confidence >= 0.4 ? 'QUARTER' : 'AVOID',
          rationale: `${(confidence * 100).toFixed(1)}% confidence with ${combinedAnalysis.supportingScreens.length}/3 screens supporting`
        },
        riskReward: riskReward.riskReward
      };
    }

    return {
      action: externalSignal, // Use external mapped signal
      confidence,
      strategy: 'Elder Triple Screen',
      reason,
      stopLoss: riskReward.stopLoss,
      targets: riskReward.targets,
      riskReward: riskReward.riskReward,
      executionPlan: executionPlan,
      signalQuality: signalQuality
    };
  }

  /**
   * Calculate confidence based on screen alignment and risk/reward
   */
  calculateConfidence(combinedAnalysis, riskReward, signal) {
    // Standardized base confidence for harmonized system competition
    let confidence = (signal === 'BUY' || signal === 'SELL') ? 0.65 : 0.40;

    // Screen alignment bonus - optimized for 0.40 WATCH base
    if (combinedAnalysis.screenAlignment) {
      confidence += 0.35; // Perfect alignment bonus
    } else if (combinedAnalysis.supportingScreens.length >= 2) {
      confidence += 0.12; // Partial alignment bonus
    } else if (combinedAnalysis.supportingScreens.length === 1) {
      confidence += 0.04; // Single screen bonus
    }

    // Signal strength bonus - balanced for standardized base
    const strengthWeight = (signal === 'WATCH' || signal === 'WEAK_WATCH' || signal === 'STRONG_WATCH') ? 0.12 : 0.16;
    const strengthBonus = (combinedAnalysis.overallStrength / 100) * strengthWeight;
    confidence += strengthBonus;

    // Risk/reward bonus - only for executable signals
    if (signal === 'BUY' || signal === 'SELL') {
      if (riskReward.riskReward >= 2.5) confidence += 0.06;
      else if (riskReward.riskReward >= 2.0) confidence += 0.04;
      else if (riskReward.riskReward < 1.5) confidence -= 0.08;
    }

    // Conflict penalty - standardized
    if (combinedAnalysis.conflictingScreens.length > 0) {
      confidence -= 0.06 * combinedAnalysis.conflictingScreens.length;
    }

    // Elder's three-tier WATCH system with harmonized caps
    if (signal === 'STRONG_WATCH') {
      // STRONG_WATCH: exceptional Screen 2 + missing Screen 3 - minimal penalty
      confidence *= 0.92; // 8% penalty for incomplete setup
      confidence = Math.min(confidence, 0.75); // Cap at 75% for fair competition
    } else if (signal === 'WATCH') {
      // WATCH: missing the crucial Screen 3 trigger - moderate penalty
      confidence *= 0.80; // 20% penalty for incomplete setup
      confidence = Math.min(confidence, 0.65); // Cap at 65% for fair competition
    } else if (signal === 'WEAK_WATCH') {
      // WEAK_WATCH: weak Screen 2 + missing Screen 3 - heavy penalty
      confidence *= 0.68; // 32% penalty for weak incomplete setup
      confidence = Math.min(confidence, 0.55); // Cap at 55% for fair competition
    } else if (signal === 'AVOID') {
      // AVOID signals should have low confidence
      confidence = Math.min(confidence, 0.45); // Cap at 45%
    }

    return Math.max(0.15, Math.min(0.95, confidence));
  }

  /**
   * Calculate signal quality grade for gate engine integration
   */
  calculateSignalQuality(combinedAnalysis, riskReward) {
    let score = 50; // Base score

    // Screen alignment scoring
    if (combinedAnalysis.screenAlignment) {
      score += 30; // Perfect three-screen alignment
    } else if (combinedAnalysis.supportingScreens.length >= 2) {
      score += 20; // Two screens supporting
    } else if (combinedAnalysis.supportingScreens.length === 1) {
      score += 10; // One screen supporting
    }

    // Signal strength scoring
    score += (combinedAnalysis.overallStrength / 100) * 20;

    // Risk/reward scoring
    if (riskReward.riskReward >= 2.5) score += 15;
    else if (riskReward.riskReward >= 2.0) score += 10;
    else if (riskReward.riskReward >= 1.5) score += 5;
    else score -= 10;

    // Conflicts penalty
    score -= combinedAnalysis.conflictingScreens.length * 5;

    // Convert to grade
    const percentage = Math.max(0, Math.min(100, score));
    let grade = 'F';

    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 85) grade = 'A';
    else if (percentage >= 80) grade = 'A-';
    else if (percentage >= 75) grade = 'B+';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 65) grade = 'B-';
    else if (percentage >= 60) grade = 'C+';
    else if (percentage >= 55) grade = 'C';
    else if (percentage >= 50) grade = 'C-';
    else if (percentage >= 45) grade = 'D+';
    else if (percentage >= 40) grade = 'D';
    else grade = 'F';

    return { grade, percentage: Math.round(percentage) };
  }

  /**
   * Validate that required data is available
   */
  validateData(indicators, series) {
    // Check for required indicators
    if (!indicators?.triple_screen) return false;
    if (!indicators.triple_screen.weeklyMACD && !indicators.triple_screen.weeklyMACDHist) return false;
    if (!indicators.base?.rsi14) return false;
    if (!indicators.triple_screen.dailyStoch && !indicators.triple_screen.dailyStochK) return false;

    // Check for required series data
    if (!series?.weekly || series.weekly.length < 10) return false;
    if (!series?.daily || series.daily.length < 20) return false;
    if (!series?.intraday || series.intraday.length < 6) return false;

    return true;
  }

  /**
   * Assess data quality for diagnostic purposes
   */
  assessDataQuality(indicators, series) {
    const quality = {
      overall: 'GOOD',
      weekly: series?.weekly?.length >= 52 ? 'EXCELLENT' : series?.weekly?.length >= 26 ? 'GOOD' : 'POOR',
      daily: series?.daily?.length >= 200 ? 'EXCELLENT' : series?.daily?.length >= 50 ? 'GOOD' : 'POOR',
      intraday: series?.intraday?.length >= 30 ? 'EXCELLENT' : series?.intraday?.length >= 6 ? 'GOOD' : 'POOR',
      indicators: indicators?.triple_screen ? 'COMPLETE' : 'MISSING'
    };

    // Determine overall quality
    const scores = [quality.weekly, quality.daily, quality.intraday].map(q =>
      q === 'EXCELLENT' ? 3 : q === 'GOOD' ? 2 : q === 'POOR' ? 1 : 0
    );
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    if (avgScore >= 2.5) quality.overall = 'EXCELLENT';
    else if (avgScore >= 2.0) quality.overall = 'GOOD';
    else if (avgScore >= 1.5) quality.overall = 'FAIR';
    else quality.overall = 'POOR';

    return quality;
  }

  /**
   * Calculate ATR-based Force Index for Elder's Triple Screen
   */
  calculateForceIndex(ohlcData) {
    if (!ohlcData || ohlcData.length < 2) return [];
    
    const forceIndex = [];
    
    for (let i = 1; i < ohlcData.length; i++) {
      const current = ohlcData[i];
      const previous = ohlcData[i - 1];
      
      // Force Index = (Close - Previous Close) * Volume
      const priceChange = current.close - previous.close;
      const volume = current.volume || 1; // Fallback to 1 if volume is missing
      const force = priceChange * volume;
      
      forceIndex.push(force);
    }
    
    return forceIndex;
  }
  createAvoidSignal(reasonCode, message) {
    return {
      system: this.systemId,
      systemName: this.name,
      decision: 'AVOID',
      confidence: 0.2,
      reasoning: [message],

      screens: {
        screen1: { status: 'ERROR', reasoning: [reasonCode] },
        screen2: { status: 'ERROR', reasoning: [reasonCode] },
        screen3: { status: 'ERROR', reasoning: [reasonCode] }
      },

      riskReward: { riskReward: 0 },
      signalQuality: { grade: 'F', percentage: 0 },
      executionPlan: null,

      error: reasonCode,
      timestamp: new Date().toISOString()
    };
  }
}

module.exports = { ElderTripleScreen };
