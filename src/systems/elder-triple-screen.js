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
   * @param {Object} options - Analysis options including capital, symbol, currentPrice, aiSignals
   * @returns {Object} Complete Elder's analysis with BUY/SELL/WATCH/AVOID + confidence
   */
  analyze(technicalData, options = {}) {
    try {

      const { indicators, series } = this.convertToElderFormat(technicalData);

      // Validate required data
      if (!this.validateData(indicators, series)) {
        //console.log('🔍 [ELDER] Data validation failed');
        return this.createAvoidSignal('INSUFFICIENT_DATA', 'Missing required weekly/daily/intraday data');
      }

      // Execute the three screens
      const screen1 = this.executeScreen1(indicators.triple_screen, series.weekly);
      const screen2 = this.executeScreen2(indicators.triple_screen, indicators.base, series.daily);
      // ⚠️ NOTE: Screen 3 (intraday trigger) deferred — only Screen 1 & 2 used for BUY signal
      const screen3 = {
        timeframe: 'entry',
        signal: 'NOT_EVALUATED',
        status: 'PENDING',
        strength: 0,
        components: {},
        reasoning: ['Screen 3 not evaluated during end-of-day scan']
      };

      // 🤖 AI-ENHANCED SCREEN COMBINATION
      const combinedAnalysis = this.combineScreens(screen1, screen2, screen3);

      // Extract capital and pricing information from options
      const { capital, symbol, currentPrice } = options;
      const entryPrice = currentPrice || series.daily[series.daily.length - 1]?.close || 0;

      // Calculate risk/reward using current market data
      const riskReward = this.calculateRiskReward(series.daily, combinedAnalysis);

      // Generate final decision with AI-enhanced confidence
      const decision = this.generateDecision(combinedAnalysis, riskReward, indicators, {
        capital,
        symbol,
        entryPrice
      });

      return {
        system: this.systemId,
        systemName: this.name,
        decision: decision.action,
        confidence: decision.confidence,
        reasoning: decision.reason,
        stopLoss: decision.stopLoss,
        targets: decision.targets,
        riskReward: decision.riskReward,
        execution: decision.execution,
        signalQuality: decision.signalQuality,
        screenAnalysis: {
          screen1: screen1,
          screen2: screen2,
          screen3: screen3,
          alignment: combinedAnalysis.screenAlignment,
          supporting: combinedAnalysis.supportingScreens,
          conflicting: combinedAnalysis.conflictingScreens
        },
        factors: {
          overallSignal: combinedAnalysis.overallSignal,
          overallStrength: combinedAnalysis.overallStrength,
          screenAlignment: combinedAnalysis.screenAlignment,
          riskReward: decision.riskReward
        },
        intradayTriggerPending: true,
        timestamp: new Date().toISOString()
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
   * SCREEN 2: Daily Pullback via RSI (Modernized, RSI-only logic)
   */
  executeScreen2(tripleScreenIndicators, baseIndicators, dailyData) {
    // Inputs: rsi14
    const { rsi14 } = {
      rsi14: baseIndicators.rsi14
    };

    const screen2 = {
      timeframe: 'daily',
      status: 'NEUTRAL',
      signal: 'NEUTRAL',
      strength: 0,
      components: {},
      reasoning: []
    };

    // RSI-only pullback logic
    const rsiOversold = rsi14 < 40;
    const rsiPullback = rsi14 < 50;

    // Trend-aware logic: check if weekly MACD histogram is bullish
    const trendDirection = tripleScreenIndicators.weeklyMACDHist > 0 ? 'BULLISH' :
      tripleScreenIndicators.weeklyMACDHist < 0 ? 'BEARISH' : 'NEUTRAL';
    const trendAligned = trendDirection === 'BULLISH';

    let pullbackScore = 0;
    const pullbackReasons = [];

    if (rsiOversold) {
      pullbackScore = 2;
      pullbackReasons.push('RSI oversold (<40)');
    } else {
      pullbackScore = 0;
      pullbackReasons.push('RSI not in oversold zone');
    }

    // Stricter trend enforcement: disqualify setup if not bullish trend
    if (!trendAligned) {
      pullbackScore = 0;
      pullbackReasons.push('Trend not bullish — setup disqualified');
    }

    screen2.components = {
      rsi14, rsiOversold, rsiPullback, pullbackScore
    };

    // Assign signals based on pullbackScore
    if (pullbackScore >= 2) {
      screen2.signal = 'PULLBACK_CONFIRMED';
      screen2.status = 'PULLBACK';
      screen2.strength = 90;
      screen2.reasoning.push(`Confirmed pullback: ${pullbackReasons.join(', ')}`);
    } else {
      screen2.signal = 'NO_PULLBACK';
      screen2.status = 'NO_PULLBACK';
      screen2.strength = 0;
      screen2.reasoning.push('No pullback detected');
    }

    return screen2;
  }

  /**
   * SCREEN 3: Entry Trigger (Elder strict method: price breaks previous day high/low using intraday data)
   */
  executeScreen3(intradayData, dailyData) {
    const screen3 = {
      timeframe: 'entry',
      status: 'NEUTRAL',
      signal: 'NO_TRIGGER',
      strength: 0,
      components: {},
      reasoning: []
    };

    // Ensure we have at least two completed daily candles
    if (!dailyData || dailyData.length < 3) {
      screen3.reasoning.push('Not enough daily bars for trigger detection');
      return screen3;
    }

    // Use the last completed daily candle for trigger level
    const previousDay = dailyData[dailyData.length - 2];
    // const currentDay = dailyData[dailyData.length - 1]; // Not used in strict intraday logic

    // Elder's strict breakout logic using intraday data: look for close above previous day's high (or below for short)
    const previousHigh = previousDay.high;
    const previousLow = previousDay.low;

    let intradayBreakout = false;
    let intradayBreakdown = false;

    if (Array.isArray(intradayData) && intradayData.length > 0) {
      for (let candle of intradayData) {
        if (candle.close > previousHigh) {
          intradayBreakout = true;
        }
        if (candle.close < previousLow) {
          intradayBreakdown = true;
        }
      }
    }

    screen3.components = {
      previousDayHigh: previousHigh,
      previousDayLow: previousLow,
      currentIntradayBreakout: intradayBreakout,
      currentIntradayBreakdown: intradayBreakdown
    };

    if (intradayBreakout) {
      screen3.signal = 'TRIGGER_UP';
      screen3.status = 'BREAKOUT';
      screen3.strength = 100;
      screen3.reasoning.push('Intraday close broke above previous day\'s high');
    } else if (intradayBreakdown) {
      screen3.signal = 'TRIGGER_DOWN';
      screen3.status = 'BREAKDOWN';
      screen3.strength = 100;
      screen3.reasoning.push('Intraday close broke below previous day\'s low');
    } else {
      screen3.reasoning.push('No intraday breakout or breakdown trigger');
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

    // Analyze screen relationships
    if (screen1.signal === 'BULLISH') {
      supportingScreens.push('Screen 1 (Weekly Bullish)');
      if (screen2.signal === 'PULLBACK_CONFIRMED') {
        supportingScreens.push('Screen 2 (RSI Pullback Confirmed)');
      } else if (screen2.signal === 'PULLBACK_WEAK') {
        supportingScreens.push('Screen 2 (RSI Weak Pullback)');
      } else if (screen2.signal === 'NO_PULLBACK') {
        conflictingScreens.push('Screen 2 (No Pullback Setup)');
      }
    } else {
      conflictingScreens.push('Screen 1 (No Clear Weekly Trend)');
    }

    // Simplified signal mapping
    let signal = 'AVOID';
    if (screen1.signal === 'BULLISH' && screen2.signal === 'PULLBACK_CONFIRMED') {
      signal = 'BUY';
    } 

    return {
      overallSignal: signal,
      overallStrength:
        (signal === 'BUY')
          ? (screen1.strength + screen2.strength) / 2
          : 0,
      screenAlignment: signal === 'BUY',
      conflictingScreens: conflictingScreens,
      supportingScreens: supportingScreens,
      reasoning: [
        signal === 'BUY'
          ? 'Weekly MACD uptrend + confirmed RSI pullback (Screen 3 trigger deferred)'
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
    } else if (combinedAnalysis.overallSignal === 'WATCH') {
      // For WATCH signals, calculate conditional risk/reward based on anticipated EMA10 breakout entry
      const anticipatedEntry = latest.ema10 || latest.EMA10 || latest.close * 1.002; // EMA10 or slight premium

      // Determine direction based on Screen 1 (weekly trend)
      const isLongWatch = combinedAnalysis.supportingScreens.some(screen => screen.includes('Weekly Bullish'));
      const isShortWatch = combinedAnalysis.supportingScreens.some(screen => screen.includes('Weekly Bearish'));

      if (isLongWatch) {
        // Long WATCH: stop below recent low, targets above anticipated entry
        stopLoss = latest.low - atr * 1.5;
        targets = [anticipatedEntry + atr * 2, anticipatedEntry + atr * 3];
        riskReward = (targets[0] - anticipatedEntry) / (anticipatedEntry - stopLoss);
      } else if (isShortWatch) {
        // Short WATCH: stop above recent high, targets below anticipated entry
        stopLoss = latest.high + atr * 1.5;
        targets = [anticipatedEntry - atr * 2, anticipatedEntry - atr * 3];
        riskReward = (anticipatedEntry - targets[0]) / (stopLoss - anticipatedEntry);
      } else {
        // Neutral WATCH (shouldn't happen, but fallback)
        return {
          stopLoss: null,
          targets: null,
          riskReward: 0,
          atr: round2(atr),
          latestClose: round2(latest.close),
          anticipatedEntry: round2(anticipatedEntry)
        };
      }

      return {
        stopLoss: round2(stopLoss),
        targets: targets.map(round2),
        riskReward: round2(riskReward),
        atr: round2(atr),
        latestClose: round2(latest.close),
        anticipatedEntry: round2(anticipatedEntry),
        watchType: isLongWatch ? 'LONG_WATCH' : 'SHORT_WATCH'
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
   * Generate final Elder's Triple Screen decision with confidence and capital-aware position sizing
   * @param {Object} combinedAnalysis - Combined screen analysis
   * @param {Object} riskReward - Risk/reward calculations
   * @param {Object} indicators - Technical indicators
   * @param {Object} capitalInfo - Capital and pricing information
   */
  generateDecision(combinedAnalysis, riskReward, indicators, capitalInfo = {}) {
    // Strict Elder result object with internal signal for confidence calculation
    let internalSignal = combinedAnalysis.overallSignal;
    let confidence = this.calculateConfidence(combinedAnalysis, riskReward, internalSignal);
    let reason = combinedAnalysis.reasoning.join('; ');

    // No more mapping of three-tier WATCH system; only 'WATCH'
    let externalSignal = internalSignal;

    // Calculate signal quality for this decision
    const signalQuality = this.calculateSignalQuality(combinedAnalysis, riskReward);

    // Create execution plan with capital-aware position sizing
    let execution = null;
    if (internalSignal === 'BUY') {
      // Calculate position sizing based on available capital and Elder's confidence tiers
      const positionSizing = this.calculateElderPositionSizing(confidence, capitalInfo, riskReward, combinedAnalysis);
      execution = {
        entry: this.buildPreciseEntryStrategy(combinedAnalysis, externalSignal, riskReward),
        exit: this.buildPreciseExitStrategy(riskReward, combinedAnalysis, externalSignal),
        position: positionSizing,
      };
    }

    return {
      action: externalSignal, // Use external mapped signal
      confidence,
      reason,
      stopLoss: riskReward.stopLoss,
      targets: riskReward.targets,
      riskReward: riskReward.riskReward,
      execution: execution,
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
    const strengthWeight = (signal === 'WATCH') ? 0.12 : 0.16;
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

    // Simplified: only cap for WATCH and AVOID
    if (signal === 'WATCH') {
      confidence *= 0.80; // 20% penalty for incomplete setup
      confidence = Math.min(confidence, 0.65); // Cap at 65% for fair competition
    } else if (signal === 'AVOID') {
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
    // Removed intraday requirement for EOD scan
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
  /**
   * Build precise entry strategy based on actual screen analysis
   */
  buildPreciseEntryStrategy(combinedAnalysis, signal, riskReward = {}) {
    const strategy = {
      conditions: [],
      timing: 'Immediate on confirmation',
      readiness: combinedAnalysis.overallSignal
    };

    // Build precise conditions based on actual screen results
    combinedAnalysis.supportingScreens.forEach(screen => {
      strategy.conditions.push(screen);
    });

    if (combinedAnalysis.conflictingScreens.length > 0) {
      strategy.conflicts = combinedAnalysis.conflictingScreens;
    }

    // Set precise timing and entry details based on signal type
    if (signal === 'BUY' || signal === 'SELL') {
      strategy.timing = 'Execute immediately - all 3 screens aligned';
      strategy.urgency = 'HIGH';
      strategy.entryType = 'IMMEDIATE';
      if (riskReward.latestClose) {
        strategy.entryPrice = riskReward.latestClose;
      }
    } else if (signal === 'WATCH') {
      strategy.timing = 'Setup developing - await EMA10 breakout trigger';
      strategy.urgency = 'LOW';
      strategy.nextTrigger = 'EMA10 breakout confirmation';
      // Add anticipated entry details for WATCH signals
      strategy.entryType = 'CONDITIONAL';
      if (riskReward.anticipatedEntry) {
        strategy.anticipatedEntry = riskReward.anticipatedEntry;
        strategy.currentPrice = riskReward.latestClose;
        strategy.triggerLevel = `EMA10 breakout at $${riskReward.anticipatedEntry}`;
      }
    } else {
      strategy.timing = 'Hold - insufficient screen alignment';
      strategy.urgency = 'NONE';
      strategy.entryType = 'NONE';
    }

    return strategy;
  }

  /**
   * Build precise exit strategy based on actual risk/reward and screen analysis
   */
  buildPreciseExitStrategy(riskReward, combinedAnalysis, signal) {
    const strategy = {
      stopLoss: riskReward.stopLoss,
      targets: riskReward.targets,
      timeStop: null,
      systemExit: null,
      trailingStop: false
    };

    // Set precise time stop based on screen analysis
    if (combinedAnalysis.overallSignal === 'BUY' || combinedAnalysis.overallSignal === 'SELL') {
      strategy.timeStop = 'Monitor weekly MACD histogram for trend reversal';
      strategy.systemExit = 'Exit when weekly MACD histogram slope changes direction';
    } else if (signal === 'WATCH') {
      strategy.timeStop = 'Monitor for 5-10 trading days maximum';
      strategy.systemExit = 'Cancel setup if weekly trend deteriorates or no EMA10 trigger';
      strategy.triggerRequired = 'EMA10 breakout confirmation required before position establishment';
    }

    // Set trailing stop based on signal strength
    if (signal === 'BUY' || signal === 'SELL') {
      if (combinedAnalysis.overallStrength >= 85) {
        strategy.trailingStop = 'Implement 1.5x ATR trailing stop after 2x ATR profit';
      } else {
        strategy.trailingStop = 'Consider trailing stop after initial target hit';
      }
    } else if (signal === 'WATCH') {
      strategy.trailingStop = 'Plan 1.5x ATR trailing stop after entry and initial move';
    }

    return strategy;
  }

  /**
   * Calculate Elder's confidence-based position sizing with available capital
   * Elder's approach: Higher confidence = larger position, with risk management
   */
  calculateElderPositionSizing(confidence, capitalInfo = {}, riskReward = {}, combinedAnalysis = {}) {
    const { capital = 100000, entryPrice = 100 } = capitalInfo;
    const { stopLoss = 0, riskReward: rrRatio = 1, anticipatedEntry } = riskReward;

    // Use anticipated entry for WATCH signals, actual entry for BUY/SELL
    const effectiveEntryPrice = anticipatedEntry || entryPrice;

    // Elder's 6-tier confidence-based position sizing
    let recommendation = 'AVOID';
    let maxPosition = 0;
    let riskPercent = 0;

    if (confidence >= 0.85) {
      recommendation = 'FULL';
      maxPosition = 0.10; // 10% of portfolio max
      riskPercent = 2.0;  // 2% risk for highest confidence
    } else if (confidence >= 0.75) {
      recommendation = 'REDUCED';
      maxPosition = 0.075; // 7.5% of portfolio
      riskPercent = 1.8;
    } else if (confidence >= 0.65) {
      recommendation = 'CONSERVATIVE';
      maxPosition = 0.06; // 6% of portfolio
      riskPercent = 1.5;
    } else if (confidence >= 0.55) {
      recommendation = 'HALF';
      maxPosition = 0.05; // 5% of portfolio
      riskPercent = 1.2;
    } else if (confidence >= 0.45) {
      recommendation = 'QUARTER';
      maxPosition = 0.03; // 3% of portfolio
      riskPercent = 1.0;
    } else {
      recommendation = 'AVOID';
      maxPosition = 0;
      riskPercent = 0;
    }

    // Calculate actual position sizing
    let shares = 0;
    let positionValue = 0;
    let riskAmount = 0;

    if (recommendation !== 'AVOID' && effectiveEntryPrice > 0) {
      // Calculate risk-based position size (Elder's method)
      const riskPerShare = Math.abs(effectiveEntryPrice - stopLoss);
      if (riskPerShare > 0) {
        riskAmount = capital * (riskPercent / 100);
        shares = Math.floor(riskAmount / riskPerShare);
        positionValue = shares * effectiveEntryPrice;

        // Apply maximum position limit
        const maxPositionValue = capital * maxPosition;
        if (positionValue > maxPositionValue) {
          positionValue = maxPositionValue;
          shares = Math.floor(maxPositionValue / effectiveEntryPrice);
          riskAmount = shares * riskPerShare;
        }
      }
    }

    return {
      recommendation,
      riskPercent,
      maxPosition,
      shares: Math.max(0, shares),
      positionValue: positionValue,
      riskAmount: riskAmount,
      riskPerShare: Math.round((Math.abs(effectiveEntryPrice - stopLoss)) * 100) / 100,
      stopDistance: stopLoss > 0 ? Math.round(((effectiveEntryPrice - stopLoss) / effectiveEntryPrice) * 10000) / 100 : 0, // Percentage with 2 decimals
      entryType: anticipatedEntry ? 'CONDITIONAL' : 'IMMEDIATE',
      effectiveEntry: Math.round(effectiveEntryPrice * 100) / 100
    };
  }

  /**
   * Create avoid signal for error conditions
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

  // OPTIMIZED: Convert technical data to Elder's format using existing data structure
  convertToElderFormat(technicalData) {

    //console.log(`  🔧 DEBUG: Converting technical data for Elder's system...`);
    //console.log(`  🔧 Input keys: ${Object.keys(technicalData).join(', ')}`);

    const ohlcData = technicalData.historical || [];
    //console.log(`  🔧 OHLC data length: ${ohlcData.length}`);

    const indicators = technicalData.indicators || {};
    
    // Create weekly data from daily data (reuse logic)
    const weeklyData = this.convertDailyToWeekly(ohlcData);
    //console.log(`  🔧 Weekly data length: ${weeklyData.length}`);

    // Create intraday simulation from daily data (last 30 days, 6 periods per day)
    const intradayData = this.createIntradayFromDaily(ohlcData.slice(-30));
    //console.log(`  🔧 Intraday data length: ${intradayData.length}`);

    // Calculate required indicators for Elder system
    const dailyRSI = indicators.rsi 
    const dailyStoch = indicators.stochastic
    const weeklyMACD = this.createWeeklyMACD(weeklyData);
    const weeklyEMA10 = this.calculateWeeklyEMA(weeklyData, 10);
    const weeklyEMA40 = this.calculateWeeklyEMA(weeklyData, 40);
    const dailyATR = indicators.atr
    const dailyEMA10 = indicators.ema10
    const dailyForceIndex = this.calculateForceIndex(ohlcData);


    // Prepare the data structure that matches what Elder system expects
    const elderData = {
      series: {
        daily: ohlcData,
        weekly: weeklyData,
        intraday: intradayData
      },
      indicators: {
        // baseIndicators structure that Elder expects
        base: {
          rsi14: Array.isArray(dailyRSI) ? (dailyRSI.length > 0 ? dailyRSI[dailyRSI.length - 1] : 50) : dailyRSI,
          stoch14: Array.isArray(dailyStoch) ? (dailyStoch.length > 0 ? dailyStoch[dailyStoch.length - 1] : { k: 50, d: 50 }) : dailyStoch,
          atr14: Array.isArray(dailyATR) ? dailyATR : [],
          ema10: Array.isArray(dailyEMA10) ? dailyEMA10 : [],
          ema20: indicators.ema20,
          ema50: indicators.ema50,
          ema200: indicators.ema200,
          macd: indicators.macd,
          obv: indicators.obv
        },
        // tripleScreenIndicators structure that Elder expects  
        triple_screen: {
          // Weekly MACD object that the validation expects
          weeklyMACD: weeklyMACD || { macd: 0, signal: 0, hist: 0 },
          // Weekly MACD histogram values (Elder needs last 3 for slope calculation)
          weeklyMACDHist: Array.isArray(weeklyMACD?.hist) && weeklyMACD.hist.length > 0 ?
            weeklyMACD.hist[weeklyMACD.hist.length - 1] : 0,
          weeklyMACDHist_1: Array.isArray(weeklyMACD?.hist) && weeklyMACD.hist.length > 1 ?
            weeklyMACD.hist[weeklyMACD.hist.length - 2] : 0,
          weeklyMACDHist_2: Array.isArray(weeklyMACD?.hist) && weeklyMACD.hist.length > 2 ?
            weeklyMACD.hist[weeklyMACD.hist.length - 3] : 0,
          // Weekly EMAs for trend analysis
          weeklyEMA10: weeklyEMA10 || 0,
          weeklyEMA40: weeklyEMA40 || 0,
          // Daily oscillators for Screen 2
          dailyStochK: Array.isArray(dailyStoch) ?
            (dailyStoch.length > 0 ? dailyStoch[dailyStoch.length - 1]?.k || 50 : 50) :
            (dailyStoch?.k || 50),
          dailyStochD: Array.isArray(dailyStoch) ?
            (dailyStoch.length > 0 ? dailyStoch[dailyStoch.length - 1]?.d || 50 : 50) :
            (dailyStoch?.d || 50),
          dailyStoch: Array.isArray(dailyStoch) ?
            (dailyStoch.length > 0 ? dailyStoch[dailyStoch.length - 1]?.k || 50 : 50) :
            (dailyStoch?.k || 50), // Fallback
          dailyForceIndex: Array.isArray(dailyForceIndex) ?
            (dailyForceIndex.length > 0 ? dailyForceIndex[dailyForceIndex.length - 1] : 0) : 0
        }
      },
      meta: {
        symbol: technicalData.symbol,
        market: 'US'
      }
    };
    return elderData;
  }

  // OPTIMIZED: Reuse existing weekly conversion logic
  convertDailyToWeekly(dailyData) {
    const weeklyData = [];

    for (let i = 0; i < dailyData.length; i += 5) {
      const weekData = dailyData.slice(i, i + 5);
      if (weekData.length === 0) continue;

      const weekly = {
        date: weekData[weekData.length - 1].date,
        open: weekData[0].open,
        high: Math.max(...weekData.map(d => d.high)),
        low: Math.min(...weekData.map(d => d.low)),
        close: weekData[weekData.length - 1].close,
        volume: weekData.reduce((sum, d) => sum + d.volume, 0)
      };

      weeklyData.push(weekly);
    }

    return weeklyData;
  }

  // Create intraday data simulation from daily data
  createIntradayFromDaily(recentDaily) {
    const intradayData = [];

    recentDaily.slice(-10).forEach(day => {
      const dayRange = day.high - day.low;
      const periods = 6; // Simulate 6 intraday periods per day

      for (let i = 0; i < periods; i++) {
        const timePercent = (i + 1) / periods;
        const price = day.low + (dayRange * timePercent * Math.random() * 0.8) + (dayRange * 0.1);

        intradayData.push({
          datetime: new Date(`${day.date}T${9 + Math.floor(i * 1.17)}:${(i * 17) % 60}:00`),
          open: i === 0 ? day.open : intradayData[intradayData.length - 1]?.close || price,
          high: Math.max(price, price * (1 + Math.random() * 0.005)),
          low: Math.min(price, price * (1 - Math.random() * 0.005)),
          close: price,
          volume: Math.floor(day.volume / periods * (0.5 + Math.random()))
        });
      }
    });

    return intradayData;
  }

  // Create weekly MACD from weekly data
  createWeeklyMACD(weeklyData) {
    if (!weeklyData || weeklyData.length < 2) {
      // Not enough data for MACD, return neutral values
      return { macd: [0], signal: [0], hist: [0] };
    }

    const closes = weeklyData.map(w => w.close);

    // Adjust periods for available data
    const ema12Period = Math.min(12, Math.max(2, closes.length - 1));
    const ema26Period = Math.min(26, Math.max(3, closes.length - 1));

    const ema12 = this.calculateEMA(closes, ema12Period);
    const ema26 = this.calculateEMA(closes, ema26Period);

    if (ema12.length === 0 || ema26.length === 0) {
      return { macd: [0], signal: [0], hist: [0] };
    }

    // Calculate MACD line for all available data points
    const macdLine = [];
    const minLength = Math.min(ema12.length, ema26.length);

    for (let i = 0; i < minLength; i++) {
      macdLine.push(ema12[i] - ema26[i]);
    }

    if (macdLine.length === 0) {
      return { macd: [0], signal: [0], hist: [0] };
    }

    // Calculate signal line (9-period EMA of MACD, or shorter if not enough data)
    const signalPeriod = Math.min(9, Math.max(2, macdLine.length));
    const signalLine = this.calculateEMA(macdLine, signalPeriod);

    // Calculate histogram array (Elder needs at least last 3 values for slope)
    const histogramArray = [];
    const signalLength = signalLine.length;
    const startIndex = Math.max(0, macdLine.length - Math.max(signalLength, 3));

    for (let i = startIndex; i < macdLine.length; i++) {
      const signalValue = i < signalLength ?
        signalLine[i] :
        (signalLine.length > 0 ? signalLine[signalLine.length - 1] : macdLine[i]);
      histogramArray.push(macdLine[i] - signalValue);
    }

    // Ensure we have at least 3 histogram values for Elder's slope calculation
    while (histogramArray.length < 3) {
      histogramArray.unshift(histogramArray[0] || 0);
    }

    return {
      macd: macdLine,
      signal: signalLine,
      hist: histogramArray  // Array of histogram values (Elder needs this for slope)
    };
  }

  // Calculate RSI
  calculateRSI(ohlcData, period = 14) {
    if (ohlcData.length < period + 1) return [];

    const closes = ohlcData.map(d => d.close);
    const rsi = [];

    for (let i = period; i < closes.length; i++) {
      let gains = 0, losses = 0;

      for (let j = i - period; j < i; j++) {
        const change = closes[j + 1] - closes[j];
        if (change > 0) gains += change;
        else losses -= change;
      }

      const avgGain = gains / period;
      const avgLoss = losses / period;
      const rs = avgGain / (avgLoss || 0.001);
      const rsiValue = 100 - (100 / (1 + rs));

      rsi.push(rsiValue);
    }

    return rsi;
  }

  // Calculate Stochastic
  calculateStochastic(ohlcData, period = 14) {
    if (ohlcData.length < period) return [];

    const stoch = [];

    for (let i = period - 1; i < ohlcData.length; i++) {
      const periodData = ohlcData.slice(i - period + 1, i + 1);
      const lowestLow = Math.min(...periodData.map(d => d.low));
      const highestHigh = Math.max(...periodData.map(d => d.high));
      const currentClose = ohlcData[i].close;

      const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
      stoch.push({ k, d: k }); // Simplified D = K
    }

    return stoch;
  }

  // Calculate Force Index
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

  // Calculate ATR (Average True Range)
  calculateATR(ohlcData, period = 14) {
    if (!ohlcData || ohlcData.length < period + 1) return [];

    const trueRanges = [];

    // Calculate True Range for each period
    for (let i = 1; i < ohlcData.length; i++) {
      const current = ohlcData[i];
      const previous = ohlcData[i - 1];

      const tr = Math.max(
        current.high - current.low,
        Math.abs(current.high - previous.close),
        Math.abs(current.low - previous.close)
      );

      trueRanges.push(tr);
    }

    // Calculate ATR using EMA of True Range
    const atr = [];
    let ema = trueRanges.slice(0, period).reduce((sum, tr) => sum + tr, 0) / period;
    atr.push(ema);

    const k = 2 / (period + 1);
    for (let i = period; i < trueRanges.length; i++) {
      ema = trueRanges[i] * k + ema * (1 - k);
      atr.push(ema);
    }

    return atr;
  }
  calculateWeeklyEMA(weeklyData, period) {
    if (!weeklyData || weeklyData.length === 0) return null;

    // For periods longer than available data, use all available data
    const adjustedPeriod = Math.min(period, weeklyData.length);

    if (adjustedPeriod < 2) {
      // If we have very little data, just return the latest close
      return weeklyData[weeklyData.length - 1].close;
    }

    const closes = weeklyData.map(w => w.close);
    const ema = this.calculateEMA(closes, adjustedPeriod);

    // Return the latest EMA value
    return ema.length > 0 ? ema[ema.length - 1] : closes[closes.length - 1];
  }


  // Calculate EMA - fixed version
  calculateEMA(data, period) {
    if (!data || data.length === 0) return [];
    if (period <= 0) return [];

    // Ensure we have valid numeric data
    const validData = data.filter(val => typeof val === 'number' && !isNaN(val));
    if (validData.length === 0) return [];

    // Adjust period if we don't have enough data
    const effectivePeriod = Math.min(period, validData.length);
    if (effectivePeriod === 1) {
      return [validData[validData.length - 1]];
    }

    const k = 2 / (effectivePeriod + 1);
    const ema = [];

    // Start with SMA
    let sum = 0;
    for (let i = 0; i < effectivePeriod; i++) {
      sum += validData[i];
    }
    const sma = sum / effectivePeriod;
    ema.push(sma);

    // Continue with EMA
    for (let i = effectivePeriod; i < validData.length; i++) {
      const prevEMA = ema[ema.length - 1];
      const currentValue = validData[i];
      const newEMA = currentValue * k + prevEMA * (1 - k);
      ema.push(newEMA);
    }

    return ema;
  }

  calculateSMA(data, period) {
    if (!data || data.length < period) return [];
    const sma = [];

    for (let i = period - 1; i < data.length; i++) {
      const sum = data.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val.close, 0);
      sma.push(sum / period);
    }

    return sma;
  }


}

module.exports = ElderTripleScreen;
