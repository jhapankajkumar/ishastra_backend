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
      console.log(`🔍 [ELDER] Starting analysis for ${tickerData.meta?.symbol}`);
      
      // Validate required data
      if (!this.validateData(indicators, series)) {
        console.log('🔍 [ELDER] Data validation failed');
        return this.createAvoidSignal('INSUFFICIENT_DATA', 'Missing required weekly/daily/intraday data');
      }

      // Execute the three screens
      const screen1 = this.executeScreen1(indicators.triple_screen, series.weekly);
      const screen2 = this.executeScreen2(indicators.triple_screen, indicators.base, series.daily);
      const screen3 = this.executeScreen3(series.intraday, series.daily);

      // Combine screens for final signal
      const combinedAnalysis = this.combineScreens(screen1, screen2, screen3);
      
      // Calculate risk/reward using current market data
      const riskReward = this.calculateRiskReward(series.daily, combinedAnalysis);
      
      // Generate final decision with confidence
      const decision = this.generateDecision(combinedAnalysis, riskReward, indicators);

      return {
        system: this.systemId,
        systemName: this.name,
        decision: decision.action,
        confidence: decision.confidence,
        reasoning: decision.reasoning,
        
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
    // Pullback logic
    const rsiPullback = rsi14 < 50;
    const stochasticPullback = stochasticK < stochasticD;
    const forceIndexPullback = dailyForceIndex < 0;
    const pullbackConfirmed = rsiPullback || stochasticPullback || forceIndexPullback;
    screen2.components = {
      rsi14, stochasticK, stochasticD, dailyForceIndex,
      rsiPullback, stochasticPullback, forceIndexPullback, pullbackConfirmed
    };
    if (pullbackConfirmed) {
      screen2.signal = 'PULLBACK_CONFIRMED';
      screen2.status = 'PULLBACK';
      screen2.strength = 80;
      screen2.reasoning.push('Daily pullback confirmed by: ' +
        [
          rsiPullback ? 'RSI<50' : null,
          stochasticPullback ? 'StochK<StochD' : null,
          forceIndexPullback ? 'ForceIndex<0' : null
        ].filter(Boolean).join(', ')
      );
    } else {
      screen2.signal = 'NO_PULLBACK';
      screen2.status = 'NO_PULLBACK';
      screen2.strength = 0;
      screen2.reasoning.push('No daily pullback detected');
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
    // Strict Elder: Only allow signal if all 3 screens align
    let signal = 'HOLD';
    if (
      screen1.signal === 'BULLISH' &&
      screen2.signal === 'PULLBACK_CONFIRMED' &&
      screen3.signal === 'TRIGGER_UP'
    ) {
      signal = 'BUY';
    } else if (
      screen1.signal === 'BEARISH' &&
      screen2.signal === 'PULLBACK_CONFIRMED' &&
      screen3.signal === 'TRIGGER_DOWN'
    ) {
      signal = 'SELL';
    }
    return {
      overallSignal: signal,
      overallStrength: signal === 'BUY' || signal === 'SELL'
        ? (screen1.strength + screen2.strength + screen3.strength) / 3
        : 0,
      screenAlignment: signal === 'BUY' || signal === 'SELL',
      conflictingScreens: [],
      supportingScreens: [],
      reasoning: [
        signal === 'BUY'
          ? 'Weekly MACD uptrend + daily pullback + EMA10 breakout trigger'
          : signal === 'SELL'
          ? 'Weekly MACD downtrend + daily pullback + EMA10 breakdown trigger'
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
    if (combinedAnalysis.overallSignal === 'BUY') {
      stopLoss = latest.low - atr * 1.5;
      targets = [latest.close + atr * 2, latest.close + atr * 3];
      riskReward = (targets[0] - latest.close) / (latest.close - stopLoss);
    } else if (combinedAnalysis.overallSignal === 'SELL') {
      stopLoss = latest.high + atr * 1.5;
      targets = [latest.close - atr * 2, latest.close - atr * 3];
      riskReward = (latest.close - targets[0]) / (stopLoss - latest.close);
    } else {
      return {
        stopLoss: null,
        targets: null,
        riskReward: 0,
        atr,
        latestClose: latest.close
      };
    }
    const round2 = v => Math.round(v * 100) / 100;
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
    // Strict Elder result object
    let signal = combinedAnalysis.overallSignal;
    let confidence = this.calculateConfidence(combinedAnalysis, riskReward, signal); // Dynamic confidence!
    let reason =
      signal === 'BUY'
        ? 'Weekly MACD uptrend + daily pullback + EMA10 breakout trigger'
        : signal === 'SELL'
        ? 'Weekly MACD downtrend + daily pullback + EMA10 breakdown trigger'
        : 'Strict Elder alignment not met';
    return {
      action: signal,  // Changed from signal to action
      confidence,
      strategy: 'Triple Screen',
      reason,
      stopLoss: riskReward.stopLoss,
      targets: riskReward.targets,
      riskReward: riskReward.riskReward
    };
  }

  /**
   * Calculate confidence based on screen alignment and risk/reward
   */
  calculateConfidence(combinedAnalysis, riskReward, direction) {
    let confidence = 0.5; // Base confidence

    // Screen alignment bonus
    if (combinedAnalysis.screenAlignment) {
      confidence += 0.25; // Perfect alignment
    } else if (combinedAnalysis.supportingScreens.length >= 2) {
      confidence += 0.15; // Partial alignment
    }

    // Signal strength bonus
    const strengthBonus = (combinedAnalysis.overallStrength / 100) * 0.2;
    confidence += strengthBonus;

    // Risk/reward bonus
    if (riskReward.riskReward >= 2.5) {
      confidence += 0.1; // Excellent R/R
    } else if (riskReward.riskReward >= 2.0) {
      confidence += 0.05; // Good R/R
    } else if (riskReward.riskReward < 1.5) {
      confidence -= 0.1; // Poor R/R penalty
    }

    // Conflicts penalty
    if (combinedAnalysis.conflictingScreens.length > 0) {
      confidence -= 0.05 * combinedAnalysis.conflictingScreens.length;
    }

    return Math.max(0.3, Math.min(0.95, confidence));
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
    if (!indicators.triple_screen.weeklyMACD) return false;
    // Corrected: check base.rsi14, not triple_screen.dailyRSI
    if (!indicators.base?.rsi14) return false;
    if (!indicators.triple_screen.dailyStoch) return false;

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
   * Create an AVOID signal with specific reason
   */
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
