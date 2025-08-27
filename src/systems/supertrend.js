
// Supertrend Rule-Based System (Weekly)
// Author: Pankaj Kumar Jha
// Based on 5-rule hack system from Supertrend breakout logic

/**
 * Supertrend Weekly Breakout Trading System
 * 
 * A complete implementation of Supertrend methodology with 5-rule confirmation:
 * - Rule 1: Supertrend flip (red to green)
 * - Rule 2: Candle confirmation (close above Supertrend)
 * - Rule 3: Breakout candle high crossed
 * - Rule 4: 18+ week consolidation before breakout
 * - Rule 5: Price structure change (Higher High + Higher Low)
 * 
 * Integrates with existing gate-based decision engine for:
 * - Risk/reward validation
 * - Trade readiness assessment  
 * - Dynamic position sizing
 * - Weekly trend confirmation
 */

class SupertrendWeekly {
  constructor() {
    this.systemId = 'supertrend_weekly';
    this.name = 'Supertrend Weekly Breakout';
    this.version = '1.0.0';
    this.description = '5-rule weekly Supertrend breakout system with consolidation detection';
  }

  /**
   * Analyze ticker using Supertrend Weekly methodology
   * @param {Object} tickerData - Pre-computed indicators from MultiSystemDataGenerator
   * @param {Object} options - Analysis options including capital, symbol, currentPrice
   * @returns {Object} Complete Supertrend analysis with BUY/WATCH/AVOID + confidence
   */
  analyze(tickerData, options = {}) {
    try {
      const { indicators, series } = tickerData;
      
      // Validate required data
      if (!this.validateData(indicators, series)) {
        return this.createAvoidSignal('INSUFFICIENT_DATA', 'Missing required weekly data or Supertrend indicators');
      }

      // Get weekly candles and Supertrend values
      const weeklyCandles = series.weekly;
      const supertrendValues = this.extractSupertrendValues(indicators, weeklyCandles);
      
      if (!supertrendValues || supertrendValues.length !== weeklyCandles.length) {
        return this.createAvoidSignal('INVALID_SUPERTREND', 'Supertrend data mismatch with candle data');
      }

      // Execute the 5-rule Supertrend analysis
      const supertrendAnalysis = this.executeFiveRuleAnalysis(weeklyCandles, supertrendValues);

      // Extract capital and pricing information from options
      const { capital, symbol, currentPrice } = options;
      const entryPrice = currentPrice || weeklyCandles[weeklyCandles.length - 1]?.close || 0;

      // Calculate risk/reward using current market data
      const riskReward = this.calculateRiskReward(weeklyCandles, supertrendAnalysis, supertrendValues);

      // Generate final decision with confidence and capital-aware position sizing
      const decision = this.generateDecision(supertrendAnalysis, riskReward, indicators, {
        capital,
        symbol,
        entryPrice
      });

      return {
        system: this.systemId,
        systemName: this.name,
        decision: decision.action,
        confidence: decision.confidence,
        reasoning: supertrendAnalysis.reasons,
        
        // Rule breakdown
        rules: supertrendAnalysis.rules,
        
        // Risk management
        riskReward: riskReward,
        
        // Execution details
        execution: decision.execution,
        
        // Quality metrics for gate engine
        signalQuality: decision.signalQuality,
        
        // System metadata
        systemVersion: this.version,
        dataQuality: this.assessDataQuality(indicators, series)
      };

    } catch (error) {
      console.error('Supertrend Weekly analysis error:', error);
      return this.createAvoidSignal('ANALYSIS_ERROR', `System error: ${error.message}`);
    }
  }

  /**
   * Execute the 5-rule Supertrend analysis
   */
  executeFiveRuleAnalysis(candles, supertrend) {
    if (!candles || candles.length < 30 || !supertrend || supertrend.length !== candles.length) {
      return { signal: 'NO_DECISION', confidence: 0, reasons: ['Insufficient data or mismatched inputs'] };
    }

    const result = {
      signal: 'NO_DECISION',
      confidence: 0,
      reasons: [],
      rules: {}
    };

    const last = candles.length - 1;
    const prev = last - 1;

    const getHigh = (index) => candles[index]?.high;
    const getLow = (index) => candles[index]?.low;
    const getClose = (index) => candles[index]?.close;
    const getST = (index) => supertrend[index];

    // Rule 1: Supertrend flip (red to green)
    const stFlipToBuy = getST(prev) > getClose(prev) && getST(last) < getClose(last);
    result.rules.rule1 = {
      name: 'Supertrend Flip',
      passed: stFlipToBuy,
      score: stFlipToBuy ? 1 : 0,
      details: `Previous: ST(${getST(prev)?.toFixed(2)}) > Close(${getClose(prev)?.toFixed(2)}), Current: ST(${getST(last)?.toFixed(2)}) < Close(${getClose(last)?.toFixed(2)})`
    };
    if (stFlipToBuy) {
      result.reasons.push('Supertrend flipped to green');
      result.confidence += 1;
    }

    // Rule 2: Wait for candle confirmation
    const confirmCandle = getClose(last) > getST(last);
    result.rules.rule2 = {
      name: 'Candle Confirmation',
      passed: confirmCandle,
      score: confirmCandle ? 1 : 0,
      details: `Close(${getClose(last)?.toFixed(2)}) ${confirmCandle ? '>' : '≤'} ST(${getST(last)?.toFixed(2)})`
    };
    if (confirmCandle) {
      result.reasons.push('Close is above Supertrend — confirmation');
      result.confidence += 1;
    }

    // Rule 3: Cross breakout candle high
    const breakoutHigh = getHigh(prev);
    const crossedBreakoutHigh = getHigh(last) > breakoutHigh || getClose(last) > breakoutHigh;
    result.rules.rule3 = {
      name: 'Breakout High Crossed',
      passed: crossedBreakoutHigh,
      score: crossedBreakoutHigh ? 1 : 0,
      details: `Current High(${getHigh(last)?.toFixed(2)}) or Close(${getClose(last)?.toFixed(2)}) > Previous High(${breakoutHigh?.toFixed(2)})`
    };
    if (crossedBreakoutHigh) {
      result.reasons.push('Breakout candle high crossed');
      result.confidence += 1;
    }

    // Rule 4: 18+ week consolidation before breakout
    const CONSOLIDATION_LOOKBACK = 26;
    let isConsolidated = true;
    let min = getLow(last - CONSOLIDATION_LOOKBACK);
    let max = getHigh(last - CONSOLIDATION_LOOKBACK);
    for (let i = last - CONSOLIDATION_LOOKBACK + 1; i <= prev; i++) {
      min = Math.min(min, getLow(i));
      max = Math.max(max, getHigh(i));
      if (getHigh(i) - getLow(i) > 0.12 * getLow(i)) isConsolidated = false; // 12% range filter
    }
    const stGreen = getST(last) < getClose(last);
    const consolidationBreakout = isConsolidated && stGreen;
    result.rules.rule4 = {
      name: '18+ Week Consolidation',
      passed: consolidationBreakout,
      score: consolidationBreakout ? 1.5 : 0,
      details: `Consolidation: ${isConsolidated}, ST Green: ${stGreen}, Range: ${min?.toFixed(2)}-${max?.toFixed(2)}`
    };
    if (consolidationBreakout) {
      result.reasons.push('18+ week consolidation breakout with ST green');
      result.confidence += 1.5;
    }

    // Rule 5: Price structure change (improved for weekly timeframe)
    const STRUCTURE_LOOKBACK = 8; // 8 weeks = ~2 months for better structure analysis
    let recentLows = [];
    let recentHighs = [];
    
    // Collect recent swing points
    for (let i = last - STRUCTURE_LOOKBACK; i <= last; i++) {
      if (i >= 0) {
        recentLows.push(getLow(i));
        recentHighs.push(getHigh(i));
      }
    }
    
    const minLow = Math.min(...recentLows.slice(0, -1)); // Exclude current candle
    const maxHigh = Math.max(...recentHighs.slice(0, -1)); // Exclude current candle
    const currentLow = getLow(last);
    const currentHigh = getHigh(last);
    
    const higherLow = currentLow > minLow;
    const higherHigh = currentHigh > maxHigh;
    const structureChange = higherHigh && higherLow;
    
    result.rules.rule5 = {
      name: 'Price Structure Change',
      passed: structureChange,
      score: structureChange ? 1.5 : (higherLow ? 0.5 : 0),
      details: `Higher High: ${higherHigh}, Higher Low: ${higherLow}, Current: ${currentHigh?.toFixed(2)}/${currentLow?.toFixed(2)}, Previous Max: ${maxHigh?.toFixed(2)}/${minLow?.toFixed(2)}`
    };
    
    if (structureChange) {
      result.reasons.push('Structure shifted to Higher High + Higher Low (8-week analysis)');
      result.confidence += 1.5;
    } else if (higherLow) {
      result.reasons.push('Higher Low formed but awaiting Higher High');
      result.confidence += 0.5;
    } else {
      result.reasons.push('Structure not yet bullish — may be weak');
    }

    // Decision logic
    if (result.confidence >= 3.5) {
      result.signal = 'BUY';
    } else if (result.confidence >= 2) {
      result.signal = 'WATCH';
    } else {
      result.signal = 'AVOID';
    }

    return result;
  }

  /**
   * Extract Supertrend values from indicators
   */
  extractSupertrendValues(indicators, weeklyCandles) {
    // Check if Supertrend is already calculated
    if (indicators.supertrend && Array.isArray(indicators.supertrend)) {
      return indicators.supertrend;
    }
    
    // If not available, calculate it using our built-in function
    const supertrendData = calculateSupertrend(weeklyCandles, 10, 3);
    return supertrendData.map(entry => entry.value);
  }

  /**
   * Calculate risk/reward for Supertrend setup (ATR-based stop/targets)
   */
  calculateRiskReward(weeklyCandles, supertrendAnalysis, supertrendValues) {
    const latest = weeklyCandles[weeklyCandles.length - 1];
    const latestST = supertrendValues[supertrendValues.length - 1];
    
    // Calculate ATR for weekly candles
    const atrPeriod = 14;
    const bars = weeklyCandles.slice(-atrPeriod - 1);
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

    let stopLoss = null, targets = null, riskReward = null;
    const round2 = v => Math.round(v * 100) / 100;
    
    if (supertrendAnalysis.signal === 'BUY') {
      // Use Supertrend as stop loss for trend-following
      stopLoss = latestST;
      targets = [latest.close + atr * 2, latest.close + atr * 3, latest.close + atr * 4];
      riskReward = (targets[0] - latest.close) / (latest.close - stopLoss);
    } else if (supertrendAnalysis.signal === 'WATCH') {
      // Anticipated entry at current close with Supertrend stop
      const anticipatedEntry = latest.close;
      stopLoss = latestST;
      targets = [anticipatedEntry + atr * 2, anticipatedEntry + atr * 3];
      riskReward = (targets[0] - anticipatedEntry) / (anticipatedEntry - stopLoss);
    } else {
      stopLoss = 0;
      targets = [];
      riskReward = 0;
    }

    return {
      stopLoss: round2(stopLoss),
      targets: targets.map(round2),
      riskReward: round2(riskReward),
      atr: round2(atr),
      latestClose: round2(latest.close),
      supertrendLevel: round2(latestST)
    };
  }

  /**
   * Generate final decision with confidence and execution plan
   */
  generateDecision(supertrendAnalysis, riskReward, indicators, capitalInfo = {}) {
    let confidence = this.calculateConfidence(supertrendAnalysis, riskReward);
    let reason = supertrendAnalysis.reasons.join('; ');

    // Calculate signal quality for this decision
    const signalQuality = this.calculateSignalQuality(supertrendAnalysis, riskReward);

    // Create execution plan with capital-aware position sizing
    let execution = null;
    if (supertrendAnalysis.signal === 'BUY' || supertrendAnalysis.signal === 'WATCH') {
      const positionSizing = this.calculatePositionSizing(confidence, capitalInfo, riskReward, supertrendAnalysis);
      execution = {
        entry: this.buildEntryStrategy(supertrendAnalysis, riskReward),
        exit: this.buildExitStrategy(riskReward, supertrendAnalysis),
        position: positionSizing,
      };
    }

    return {
      action: supertrendAnalysis.signal,
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
   * Calculate confidence based on rule scoring and risk/reward
   */
  calculateConfidence(supertrendAnalysis, riskReward) {
    // Base confidence from rule scoring
    const maxPossibleScore = 6.0; // 1+1+1+1.5+1.5
    let confidence = supertrendAnalysis.confidence / maxPossibleScore;
    
    // Risk/reward bonus
    if (riskReward.riskReward >= 3.0) confidence += 0.1;
    else if (riskReward.riskReward >= 2.0) confidence += 0.05;
    
    // Signal strength adjustment
    if (supertrendAnalysis.signal === 'BUY') {
      confidence = Math.max(0.6, confidence); // Minimum 60% for BUY
    } else if (supertrendAnalysis.signal === 'WATCH') {
      confidence = Math.max(0.4, confidence * 0.8); // 20% penalty for incomplete setup
    }

    return Math.max(0.15, Math.min(0.95, confidence));
  }

  /**
   * Calculate signal quality grade
   */
  calculateSignalQuality(supertrendAnalysis, riskReward) {
    let score = 50; // Base score

    // Rule scoring
    score += (supertrendAnalysis.confidence / 6.0) * 30;

    // Risk/reward scoring
    if (riskReward.riskReward >= 3.0) score += 20;
    else if (riskReward.riskReward >= 2.0) score += 15;
    else if (riskReward.riskReward >= 1.5) score += 10;

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
    else if (percentage >= 45) grade = 'D';

    return { grade, percentage: Math.round(percentage) };
  }

  /**
   * Build entry strategy
   */
  buildEntryStrategy(supertrendAnalysis, riskReward) {
    const strategy = {
      conditions: supertrendAnalysis.reasons,
      timing: 'Immediate on confirmation',
      type: supertrendAnalysis.signal === 'BUY' ? 'IMMEDIATE' : 'CONDITIONAL',
      entryPrice: riskReward.latestClose
    };

    if (supertrendAnalysis.signal === 'WATCH') {
      strategy.timing = 'Wait for Supertrend confirmation and breakout trigger';
      strategy.watchFor = 'Price staying above Supertrend with volume confirmation';
    }

    return strategy;
  }

  /**
   * Build exit strategy
   */
  buildExitStrategy(riskReward, supertrendAnalysis) {
    return {
      stopLoss: riskReward.stopLoss,
      stopMethod: 'Supertrend level',
      targets: riskReward.targets,
      systemExit: 'Exit when price closes below Supertrend',
      trailingStop: true,
      timeStop: 'Monitor weekly Supertrend for trend change'
    };
  }

  /**
   * Calculate position sizing
   */
  calculatePositionSizing(confidence, capitalInfo = {}, riskReward = {}, supertrendAnalysis = {}) {
    const { capital = 100000, entryPrice = 100 } = capitalInfo;
    const { stopLoss = 0, riskReward: rrRatio = 1 } = riskReward;
    
    let recommendation = 'AVOID';
    let riskPercent = 0;
    let maxPosition = 0;
    
    if (confidence >= 0.8) {
      recommendation = 'FULL';
      riskPercent = 2.0;
      maxPosition = 0.08;
    } else if (confidence >= 0.7) {
      recommendation = 'REDUCED';
      riskPercent = 1.5;
      maxPosition = 0.06;
    } else if (confidence >= 0.6) {
      recommendation = 'CONSERVATIVE';
      riskPercent = 1.2;
      maxPosition = 0.05;
    } else if (confidence >= 0.5) {
      recommendation = 'HALF';
      riskPercent = 1.0;
      maxPosition = 0.03;
    } else {
      recommendation = 'AVOID';
    }

    // Calculate actual position sizing
    let shares = 0;
    let positionValue = 0;
    let riskAmount = 0;
    
    if (recommendation !== 'AVOID' && entryPrice > 0) {
      const riskPerShare = Math.abs(entryPrice - stopLoss);
      if (riskPerShare > 0) {
        riskAmount = capital * (riskPercent / 100);
        shares = Math.floor(riskAmount / riskPerShare);
        positionValue = shares * entryPrice;
        
        // Respect maximum position size
        const maxPositionValue = capital * maxPosition;
        if (positionValue > maxPositionValue) {
          shares = Math.floor(maxPositionValue / entryPrice);
          positionValue = shares * entryPrice;
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
      riskPerShare: Math.round((Math.abs(entryPrice - stopLoss)) * 100) / 100,
      stopDistance: stopLoss > 0 ? Math.round(((entryPrice - stopLoss) / entryPrice) * 10000) / 100 : 0
    };
  }

  /**
   * Validate required data
   */
  validateData(indicators, series) {
    // Check for weekly data (minimum requirement)
    if (!series?.weekly || series.weekly.length < 30) return false;
    
    // Check if we can get Supertrend data
    const hasSupertrendData = indicators?.supertrend || 
                             (series.weekly && series.weekly.length > 10);
    
    return hasSupertrendData;
  }

  /**
   * Assess data quality
   */
  assessDataQuality(indicators, series) {
    const quality = {
      overall: 'GOOD',
      weekly: series?.weekly?.length >= 104 ? 'EXCELLENT' : series?.weekly?.length >= 52 ? 'GOOD' : 'POOR',
      indicators: indicators?.supertrend ? 'COMPLETE' : 'CALCULATED'
    };

    if (quality.weekly === 'POOR') quality.overall = 'POOR';
    else if (quality.weekly === 'EXCELLENT') quality.overall = 'EXCELLENT';

    return quality;
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
      riskReward: { riskReward: 0 },
      signalQuality: { grade: 'F', percentage: 0 },
      execution: null,
      error: reasonCode,
      timestamp: new Date().toISOString()
    };
  }
};

function calculateSupertrend(data, period = 10, multiplier = 3) {
  const atr = [];
  const supertrend = [];
  const signals = [];

  for (let i = 0; i < data.length; i++) {
    const { high, low, close } = data[i];

    // Calculate True Range
    const prevClose = i > 0 ? data[i - 1].close : close;
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );

    // Calculate ATR
    if (i < period) {
      atr.push(tr);
      supertrend.push(null);
      signals.push(null);
      continue;
    }

    const atrSlice = atr.slice(i - period, i);
    const atrAvg = atrSlice.reduce((sum, v) => sum + v, 0) / period;
    atr.push(tr);

    // Calculate basic upper and lower bands
    const hl2 = (high + low) / 2;
    const upperBand = hl2 + multiplier * atrAvg;
    const lowerBand = hl2 - multiplier * atrAvg;

    let finalUpperBand = upperBand;
    let finalLowerBand = lowerBand;

    // Refine bands to avoid band contraction
    if (i > 0 && supertrend[i - 1]) {
      const prev = supertrend[i - 1];
      if (upperBand < prev.upperBand || data[i - 1].close > prev.upperBand) {
        finalUpperBand = upperBand;
      } else {
        finalUpperBand = prev.upperBand;
      }

      if (lowerBand > prev.lowerBand || data[i - 1].close < prev.lowerBand) {
        finalLowerBand = lowerBand;
      } else {
        finalLowerBand = prev.lowerBand;
      }
    }

    let trend = 'up';
    let value = finalLowerBand;

    if (
      i > 0 &&
      supertrend[i - 1] &&
      supertrend[i - 1].trend === 'down' &&
      close <= finalUpperBand
    ) {
      trend = 'down';
      value = finalUpperBand;
    }

    supertrend[i] = {
      trend,
      value,
      upperBand: finalUpperBand,
      lowerBand: finalLowerBand
    };

    // Generate signal
    const prevTrend = i > 0 && supertrend[i - 1] ? supertrend[i - 1].trend : null;
    if (prevTrend && trend !== prevTrend) {
      signals[i] = trend === 'up' ? 'BUY' : 'SELL';
    } else {
      signals[i] = null;
    }
  }

  return supertrend.map((entry, idx) => ({
    ...entry,
    signal: signals[idx],
    timestamp: data[idx].timestamp
  }));
}

module.exports = { SupertrendWeekly, calculateSupertrend };
