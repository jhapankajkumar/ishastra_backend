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
    this.name = "Elder's Triple Screen";
    this.version = '2.0';
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
      
      // Validate required data
      if (!this.validateData(indicators, series)) {
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
   * SCREEN 1: Weekly Trend Analysis
   * Uses MACD and EMA on weekly timeframe to determine major trend
   */
  executeScreen1(tripleScreenIndicators, weeklyData) {
    const { weeklyMACD, weeklyEMA10, weeklyEMA40 } = tripleScreenIndicators;
    
    const screen1 = {
      timeframe: 'weekly',
      status: 'NEUTRAL',
      signal: 'NEUTRAL',
      strength: 0,
      components: {},
      reasoning: []
    };

    // MACD Analysis
    const macdBullish = weeklyMACD.macd > weeklyMACD.signal && weeklyMACD.hist > 0;
    const macdBearish = weeklyMACD.macd < weeklyMACD.signal && weeklyMACD.hist < 0;
    const macdStrength = Math.abs(weeklyMACD.hist) / Math.max(Math.abs(weeklyMACD.macd), 0.001);
    
    screen1.components.macd = {
      signal: macdBullish ? 'BULLISH' : macdBearish ? 'BEARISH' : 'NEUTRAL',
      strength: Math.min(macdStrength * 100, 100),
      values: { macd: weeklyMACD.macd, signal: weeklyMACD.signal, histogram: weeklyMACD.hist }
    };

    // EMA Trend Analysis  
    const emaTrend = weeklyEMA10 > weeklyEMA40 ? 'UPTREND' : 'DOWNTREND';
    const emaSpread = Math.abs(weeklyEMA10 - weeklyEMA40) / weeklyEMA40;
    const emaStrength = Math.min(emaSpread * 100, 100);
    
    screen1.components.ema = {
      trend: emaTrend,
      strength: emaStrength,
      values: { ema10: weeklyEMA10, ema40: weeklyEMA40, spread: emaSpread }
    };

    // Combine for Screen 1 decision
    if (macdBullish && emaTrend === 'UPTREND') {
      screen1.signal = 'BULLISH';
      screen1.status = 'GO_LONG';
      screen1.strength = (screen1.components.macd.strength + screen1.components.ema.strength) / 2;
      screen1.reasoning.push('Weekly uptrend confirmed: MACD bullish + EMA uptrend');
    } else if (macdBearish && emaTrend === 'DOWNTREND') {
      screen1.signal = 'BEARISH';  
      screen1.status = 'GO_SHORT';
      screen1.strength = (screen1.components.macd.strength + screen1.components.ema.strength) / 2;
      screen1.reasoning.push('Weekly downtrend confirmed: MACD bearish + EMA downtrend');
    } else {
      screen1.signal = 'NEUTRAL';
      screen1.status = 'NO_TRADE';
      screen1.strength = 0;
      screen1.reasoning.push('Weekly trend unclear: MACD and EMA signals conflict');
    }

    return screen1;
  }

  /**
   * SCREEN 2: Daily Counter-trend Entry
   * Uses Stochastic on daily timeframe for entry timing
   */
  executeScreen2(tripleScreenIndicators, baseIndicators, dailyData) {
    const { dailyRSI, dailyStoch } = tripleScreenIndicators;
    const { rsi14 } = baseIndicators;
    
    const screen2 = {
      timeframe: 'daily',
      status: 'NEUTRAL',
      signal: 'NEUTRAL', 
      strength: 0,
      components: {},
      reasoning: []
    };

    // Stochastic Analysis
    const stochOversold = dailyStoch < 20;
    const stochOverbought = dailyStoch > 80;
    const stochNeutral = dailyStoch >= 20 && dailyStoch <= 80;
    
    screen2.components.stochastic = {
      value: dailyStoch,
      condition: stochOversold ? 'OVERSOLD' : stochOverbought ? 'OVERBOUGHT' : 'NEUTRAL',
      strength: stochOversold ? (20 - dailyStoch) * 5 : stochOverbought ? (dailyStoch - 80) * 5 : 0
    };

    // RSI Confirmation
    const rsiOversold = rsi14 < 30;
    const rsiOverbought = rsi14 > 70;
    
    screen2.components.rsi = {
      value: rsi14,
      condition: rsiOversold ? 'OVERSOLD' : rsiOverbought ? 'OVERBOUGHT' : 'NEUTRAL',
      confirmation: (stochOversold && rsiOversold) || (stochOverbought && rsiOverbought)
    };

    // Screen 2 Decision Logic
    if (stochOversold) {
      screen2.signal = 'BUY_SETUP';
      screen2.status = 'OVERSOLD_BOUNCE';
      screen2.strength = screen2.components.stochastic.strength;
      screen2.reasoning.push(`Daily oversold setup: Stochastic ${dailyStoch.toFixed(1)}`);
      
      if (rsiOversold) {
        screen2.strength += 20;
        screen2.reasoning.push(`RSI confirmation: ${rsi14.toFixed(1)} also oversold`);
      }
    } else if (stochOverbought) {
      screen2.signal = 'SELL_SETUP';
      screen2.status = 'OVERBOUGHT_PULLBACK';
      screen2.strength = screen2.components.stochastic.strength;
      screen2.reasoning.push(`Daily overbought setup: Stochastic ${dailyStoch.toFixed(1)}`);
      
      if (rsiOverbought) {
        screen2.strength += 20;
        screen2.reasoning.push(`RSI confirmation: ${rsi14.toFixed(1)} also overbought`);
      }
    } else {
      screen2.signal = 'NEUTRAL';
      screen2.status = 'NO_SETUP';
      screen2.strength = 0;
      screen2.reasoning.push('Daily oscillators in neutral zone - no setup');
    }

    return screen2;
  }

  /**
   * SCREEN 3: Intraday Timing and Volume
   * Precise entry timing using intraday price action and volume
   */
  executeScreen3(intradayData, dailyData) {
    const screen3 = {
      timeframe: 'intraday',
      status: 'NEUTRAL',
      signal: 'NEUTRAL',
      strength: 0,
      components: {},
      reasoning: []
    };

    if (!intradayData || intradayData.length === 0) {
      screen3.reasoning.push('No intraday data available');
      return screen3;
    }

    // Get latest intraday bars and daily context
    const recentBars = intradayData.slice(-6); // Last hour of trading
    const latestBar = recentBars[recentBars.length - 1];
    const dailyBar = dailyData[dailyData.length - 1];
    
    // Volume Analysis
    const avgIntradayVolume = recentBars.reduce((sum, bar) => sum + bar.volume, 0) / recentBars.length;
    const latestVolume = latestBar.volume;
    const volumeRatio = latestVolume / Math.max(avgIntradayVolume, 1);
    const dailyVolumeRate = recentBars.reduce((sum, bar) => sum + bar.volume, 0) / dailyBar.volume;
    
    screen3.components.volume = {
      latestVolume,
      avgVolume: Math.round(avgIntradayVolume),
      volumeRatio: Math.round(volumeRatio * 100) / 100,
      dailyVolumeRate: Math.round(dailyVolumeRate * 100) / 100,
      signal: volumeRatio > 1.5 ? 'HIGH' : volumeRatio < 0.7 ? 'LOW' : 'NORMAL'
    };

    // Price Action Analysis
    const priceDirection = latestBar.close > recentBars[0].close ? 'UP' : 'DOWN';
    const priceStrength = Math.abs(latestBar.close - recentBars[0].close) / recentBars[0].close * 100;
    const withinDailyRange = latestBar.close > dailyBar.low * 1.01 && latestBar.close < dailyBar.high * 0.99;
    
    screen3.components.priceAction = {
      direction: priceDirection,
      strength: Math.round(priceStrength * 100) / 100,
      withinRange: withinDailyRange,
      momentum: priceStrength > 0.5 ? 'STRONG' : 'WEAK'
    };

    // Screen 3 Decision
    const highVolume = volumeRatio > 1.5;
    const goodMomentum = priceStrength > 0.3;
    
    if (priceDirection === 'UP' && highVolume && goodMomentum) {
      screen3.signal = 'BUY_NOW';
      screen3.status = 'BREAKOUT_VOLUME';
      screen3.strength = Math.min(priceStrength * 20 + (volumeRatio - 1) * 30, 100);
      screen3.reasoning.push(`Intraday breakout: ${priceStrength.toFixed(2)}% move with ${volumeRatio.toFixed(1)}x volume`);
    } else if (priceDirection === 'DOWN' && highVolume && goodMomentum) {
      screen3.signal = 'SELL_NOW';
      screen3.status = 'BREAKDOWN_VOLUME';
      screen3.strength = Math.min(priceStrength * 20 + (volumeRatio - 1) * 30, 100);
      screen3.reasoning.push(`Intraday breakdown: ${priceStrength.toFixed(2)}% move with ${volumeRatio.toFixed(1)}x volume`);
    } else if (!highVolume) {
      screen3.signal = 'WAIT';
      screen3.status = 'LOW_VOLUME';
      screen3.strength = 0;
      screen3.reasoning.push(`Insufficient volume: ${volumeRatio.toFixed(1)}x average`);
    } else {
      screen3.signal = 'WAIT';
      screen3.status = 'WEAK_MOMENTUM';
      screen3.strength = 0;
      screen3.reasoning.push(`Weak price momentum: ${priceStrength.toFixed(2)}%`);
    }

    return screen3;
  }

  /**
   * Combine all three screens for final Elder's decision
   */
  combineScreens(screen1, screen2, screen3) {
    const combined = {
      overallSignal: 'AVOID',
      overallStrength: 0,
      screenAlignment: false,
      conflictingScreens: [],
      supportingScreens: [],
      reasoning: []
    };

    // Screen 1 must show clear trend direction
    if (screen1.status === 'NO_TRADE') {
      combined.overallSignal = 'AVOID';
      combined.reasoning.push('Screen 1 BLOCK: Weekly trend unclear');
      return combined;
    }

    // Long Trade Logic (Screen 1 bullish)
    if (screen1.status === 'GO_LONG') {
      combined.supportingScreens.push('Screen 1: Weekly uptrend');
      
      if (screen2.status === 'OVERSOLD_BOUNCE') {
        combined.supportingScreens.push('Screen 2: Daily oversold setup');
        
        if (screen3.status === 'BREAKOUT_VOLUME' && screen3.signal === 'BUY_NOW') {
          combined.overallSignal = 'BUY';
          combined.screenAlignment = true;
          combined.overallStrength = (screen1.strength + screen2.strength + screen3.strength) / 3;
          combined.reasoning.push('Perfect alignment: Weekly uptrend + Daily oversold + Intraday breakout');
        } else if (screen3.signal === 'WAIT') {
          combined.overallSignal = 'WATCH';
          combined.overallStrength = (screen1.strength + screen2.strength) / 2;
          combined.reasoning.push('Setup forming: Weekly uptrend + Daily oversold, waiting for intraday trigger');
        } else {
          combined.conflictingScreens.push('Screen 3: Poor intraday timing');
          combined.overallSignal = 'WATCH';
          combined.overallStrength = 30;
        }
      } else if (screen2.status === 'NO_SETUP') {
        combined.overallSignal = 'WATCH';
        combined.overallStrength = screen1.strength / 2;
        combined.reasoning.push('Weekly uptrend present but daily setup not ready');
      } else if (screen2.status === 'OVERBOUGHT_PULLBACK') {
        // In uptrend, daily overbought is a conflict (we want oversold for entries)
        combined.conflictingScreens.push('Screen 2: Daily overbought in uptrend - wait for pullback');
        combined.overallSignal = 'WATCH';
        combined.overallStrength = screen1.strength / 3;
        combined.reasoning.push('Weekly uptrend strong but daily overbought - wait for oversold entry');
      } else {
        combined.conflictingScreens.push('Screen 2: Daily setup unclear');
        combined.overallSignal = 'WATCH';
        combined.overallStrength = screen1.strength / 3;
        combined.reasoning.push('Weekly uptrend present but daily signals mixed');
      }
    }

    // Short Trade Logic (Screen 1 bearish)
    else if (screen1.status === 'GO_SHORT') {
      combined.supportingScreens.push('Screen 1: Weekly downtrend');
      
      if (screen2.status === 'OVERBOUGHT_PULLBACK') {
        combined.supportingScreens.push('Screen 2: Daily overbought setup');
        
        if (screen3.status === 'BREAKDOWN_VOLUME' && screen3.signal === 'SELL_NOW') {
          combined.overallSignal = 'SELL';
          combined.screenAlignment = true;
          combined.overallStrength = (screen1.strength + screen2.strength + screen3.strength) / 3;
          combined.reasoning.push('Perfect alignment: Weekly downtrend + Daily overbought + Intraday breakdown');
        } else if (screen3.signal === 'WAIT') {
          combined.overallSignal = 'WATCH';
          combined.overallStrength = (screen1.strength + screen2.strength) / 2;
          combined.reasoning.push('Setup forming: Weekly downtrend + Daily overbought, waiting for intraday trigger');
        } else {
          combined.conflictingScreens.push('Screen 3: Poor intraday timing');
          combined.overallSignal = 'WATCH';
          combined.overallStrength = 30;
        }
      } else if (screen2.status === 'NO_SETUP') {
        combined.overallSignal = 'WATCH';
        combined.overallStrength = screen1.strength / 2;
        combined.reasoning.push('Weekly downtrend present but daily setup not ready');
      } else if (screen2.status === 'OVERSOLD_BOUNCE') {
        // In downtrend, daily oversold is a conflict (we want overbought for short entries)
        combined.conflictingScreens.push('Screen 2: Daily oversold in downtrend - wait for bounce to short');
        combined.overallSignal = 'WATCH';
        combined.overallStrength = screen1.strength / 3;
        combined.reasoning.push('Weekly downtrend strong but daily oversold - wait for overbought short entry');
      } else {
        combined.conflictingScreens.push('Screen 2: Daily setup unclear');
        combined.overallSignal = 'WATCH';
        combined.overallStrength = screen1.strength / 3;
        combined.reasoning.push('Weekly downtrend present but daily signals mixed');
      }
    }

    return combined;
  }

  /**
   * Calculate risk/reward for Elder's Triple Screen setup
   */
  calculateRiskReward(dailyData, combinedAnalysis) {
    const latestBar = dailyData[dailyData.length - 1];
    const currentPrice = latestBar.close;
    
    // Calculate ATR for position sizing
    const atrPeriod = 14;
    const atrBars = dailyData.slice(-atrPeriod - 1);
    let atrSum = 0;
    
    for (let i = 1; i < atrBars.length; i++) {
      const tr = Math.max(
        atrBars[i].high - atrBars[i].low,
        Math.abs(atrBars[i].high - atrBars[i-1].close),
        Math.abs(atrBars[i].low - atrBars[i-1].close)
      );
      atrSum += tr;
    }
    const atr = atrSum / atrPeriod;

    // Risk/Reward based on Elder's methodology
    let stopLoss, target1, target2, riskReward1, riskReward2;
    
    if (combinedAnalysis.overallSignal === 'BUY') {
      // Long position
      stopLoss = currentPrice - (atr * 2.0); // 2 ATR stop
      target1 = currentPrice + (atr * 3.0);   // 3 ATR first target
      target2 = currentPrice + (atr * 5.0);   // 5 ATR second target
      
      riskReward1 = (target1 - currentPrice) / (currentPrice - stopLoss);
      riskReward2 = (target2 - currentPrice) / (currentPrice - stopLoss);
      
    } else if (combinedAnalysis.overallSignal === 'SELL') {
      // Short position
      stopLoss = currentPrice + (atr * 2.0); // 2 ATR stop
      target1 = currentPrice - (atr * 3.0);   // 3 ATR first target  
      target2 = currentPrice - (atr * 5.0);   // 5 ATR second target
      
      riskReward1 = (currentPrice - target1) / (stopLoss - currentPrice);
      riskReward2 = (currentPrice - target2) / (stopLoss - currentPrice);
      
    } else {
      // No trade
      return {
        currentPrice,
        stopLoss: null,
        target1: null,
        target2: null,
        riskReward: 0,
        riskReward1: 0,
        riskReward2: 0,
        atr: atr,
        riskAmount: 0
      };
    }

    return {
      currentPrice: Math.round(currentPrice * 100) / 100,
      stopLoss: Math.round(stopLoss * 100) / 100,
      target1: Math.round(target1 * 100) / 100,
      target2: Math.round(target2 * 100) / 100,
      riskReward: Math.round(riskReward1 * 100) / 100, // Primary R/R
      riskReward1: Math.round(riskReward1 * 100) / 100,
      riskReward2: Math.round(riskReward2 * 100) / 100,
      atr: Math.round(atr * 100) / 100,
      riskAmount: Math.round((currentPrice - stopLoss) * 100) / 100
    };
  }

  /**
   * Generate final Elder's Triple Screen decision with confidence
   */
  generateDecision(combinedAnalysis, riskReward, indicators) {
    const decision = {
      action: 'AVOID',
      confidence: 0.5,
      reasoning: [],
      signalQuality: { grade: 'F', percentage: 0 },
      executionPlan: null
    };

    // Map Elder's signal to standard actions
    switch (combinedAnalysis.overallSignal) {
      case 'BUY':
        decision.action = 'BUY';
        decision.confidence = this.calculateConfidence(combinedAnalysis, riskReward, 'bullish');
        decision.reasoning = [...combinedAnalysis.reasoning];
        break;
        
      case 'SELL':
        decision.action = 'SELL';
        decision.confidence = this.calculateConfidence(combinedAnalysis, riskReward, 'bearish');
        decision.reasoning = [...combinedAnalysis.reasoning];
        break;
        
      case 'WATCH':
        decision.action = 'WATCH';
        decision.confidence = Math.max(0.6, combinedAnalysis.overallStrength / 100);
        decision.reasoning = [...combinedAnalysis.reasoning];
        break;
        
      default:
        decision.action = 'AVOID';
        decision.confidence = 0.3;
        decision.reasoning = [...combinedAnalysis.reasoning];
        break;
    }

    // Calculate signal quality grade
    decision.signalQuality = this.calculateSignalQuality(combinedAnalysis, riskReward);
    
    // Create execution plan
    if (['BUY', 'SELL'].includes(decision.action)) {
      decision.executionPlan = {
        entryPrice: riskReward.currentPrice,
        stopLoss: riskReward.stopLoss,
        target1: riskReward.target1,
        target2: riskReward.target2,
        riskReward: riskReward.riskReward,
        atrMultiplier: 2.0,
        positionSizing: 'NORMAL',
        timeframe: 'Multi-timeframe (Weekly/Daily/Intraday)',
        validity: '2-3 days'
      };
    }

    return decision;
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
    if (!indicators.triple_screen.dailyRSI) return false;
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
