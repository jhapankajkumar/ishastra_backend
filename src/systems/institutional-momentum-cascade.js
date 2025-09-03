/**
 * Institutional Momentum Cascade - Advanced Momentum System
 * 
 * Based on institutional momentum cascade theory for detecting major trend acceleration.
 * Combines multi-timeframe momentum analysis with institutional flow detection.
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
 * Core Cascade Rules:
 * 1. Weekly Momentum Confirmation (MACD, ROC, Stochastic alignment)
 * 2. Daily Momentum Acceleration (RSI >60, MACD rising, Volume expansion)
 * 3. Price Structure Validation (Higher highs, higher lows, breakout)
 * 4. Institutional Flow Detection (Volume profile, accumulation/distribution)
 * 5. Risk-Adjusted Momentum Score (Sharpe-like momentum quality)
 * 6. Cascade Trigger Confirmation (Multi-timeframe alignment)
 * 
 * Signal Generation:
 * - STRONG_BUY: All 6 rules + momentum cascade >80%
 * - BUY: 5/6 rules + momentum cascade >65% 
 * - WATCH: 4/6 rules + momentum cascade >50%
 * - AVOID: <4 rules or momentum cascade <50%
 * 
 * Author: Ishastra AI Expert Engine
 * Version: 2.1.0 - Anti-Thrashing Protection
 * Last Updated: 2024
 */

const { getSystemThresholds } = require('../config/trading-thresholds');
const { SignalStabilityManager } = require('../utils/signal-stability-manager');
const { TRIGGER_TYPES } = require('../utils/systemConstants');

class InstitutionalMomentumCascade {
  constructor() {
    this.systemId = 'institutional_momentum_cascade';
    this.name = 'Institutional Momentum Cascade (Advanced)';
    this.version = '2.1.0';
    this.description = '6-rule momentum cascade system for institutional trend detection';

    // 🔒 ANTI-THRASHING: Initialize signal stability manager
    this.stabilityManager = new SignalStabilityManager();

    // Rule weights for cascade calculation
    this.RULE_WEIGHTS = {
      weeklyMomentum: 0.20,     // 20% - Long-term trend
      dailyAcceleration: 0.18,  // 18% - Short-term acceleration
      priceStructure: 0.16,     // 16% - Technical structure
      institutionalFlow: 0.18,  // 18% - Volume/flow analysis
      riskAdjustedScore: 0.14,  // 14% - Risk-adjusted momentum
      cascadeTrigger: 0.14      // 14% - Multi-timeframe trigger
    };
  }

  /**
   * Main analysis method for Institutional Momentum Cascade system
   * @param {Object} data - Technical data with OHLCV and indicators
   * @param {Object} options - Analysis options including capital, symbol, currentPrice
   * @returns {Object} Complete Cascade analysis with STRONG_BUY/BUY/WATCH/AVOID + confidence
   */
  analyze(data, options = {}) {
    // console.log(`  🌊 CASCADE: Starting Institutional Momentum Cascade analysis...`);

    try {
      // Get current threshold configuration
      const thresholds = getSystemThresholds('institutional_momentum_cascade');
      
      const { indicators, series } = data;
      
      // Validate required data
      if (!this.validateData(indicators, series)) {
        return this.createAvoidSignal('INVALID_DATA', 'Insufficient data for Cascade analysis');
      }

      // Extract analysis parameters
      const { capital, symbol, currentPrice } = options;
      const completedDaily = series.daily.slice(0, -1); // Use only completed candles
      const weeklyData = series.weekly || [];
      const latest = completedDaily[completedDaily.length - 1];
      const entryPrice = currentPrice || latest?.close || 0;

      if (entryPrice <= 0) {
        return this.createAvoidSignal('INVALID_PRICE', 'Invalid current price for Cascade analysis');
      }

      console.log(`  🌊 CASCADE: Analyzing ${symbol || 'stock'} at $${entryPrice.toFixed(2)}`);

      // Execute the 6-rule Cascade analysis
      const cascadeAnalysis = this.executeCascadeAnalysis(completedDaily, weeklyData, indicators, entryPrice, thresholds);

      // Calculate risk/reward using momentum-based methodology
      const riskAssessment = this.assessRisk(cascadeAnalysis, completedDaily, entryPrice, thresholds);

      // Generate final decision (AI processing now handled by Gate Engine)
      const rawDecision = this.makeFinalDecision(
        cascadeAnalysis, 
        riskAssessment, 
        completedDaily, 
        { capital, symbol, entryPrice }
      );

      // 🔒 ANTI-THRASHING: Apply signal stabilization
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

      console.log(`  🌊 CASCADE: Raw: ${rawDecision.action}, Stabilized: ${stabilizedDecision.action}${stabilizedDecision.stabilized ? ' [STABILIZED]' : ''}, Confidence: ${(stabilizedDecision.confidence * 100).toFixed(1)}%`);

      // Calculate signal quality for gate engine integration
      const signalQuality = this.calculateSignalQuality(stabilizedDecision.confidence, cascadeAnalysis);

      // Build execution plan
      const execution = this.buildExecutionPlan(stabilizedDecision, riskAssessment, cascadeAnalysis, entryPrice, capital, completedDaily);

      // Calculate unified display grade (Cascade Grade + Signal Quality combined for user display)
      const unifiedGrade = this.calculateUnifiedDisplayGrade(cascadeAnalysis.momentumCascade.grade, signalQuality.grade);

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
        cascadeAnalysis: cascadeAnalysis,
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
      console.error('  🌊 CASCADE: Analysis error:', error.message);
      return this.createAvoidSignal('ANALYSIS_ERROR', `Cascade analysis failed: ${error.message}`);
    }
  }

  /**
   * Execute the 6-rule Institutional Momentum Cascade analysis
   */
  executeCascadeAnalysis(dailyData, weeklyData, indicators, currentPrice, thresholds) {
    console.log(`  🌊 CASCADE: Executing 6-rule momentum cascade validation...`);

    const rules = {};
    const reasoning = [];
    let weightedScore = 0;
    let passedRules = 0;

    // Rule 1: Weekly Momentum Confirmation
    const rule1 = this.analyzeWeeklyMomentum(weeklyData, indicators, thresholds);
    rules.weeklyMomentum = rule1;
    weightedScore += rule1.score * this.RULE_WEIGHTS.weeklyMomentum;
    if (rule1.passed) {
      passedRules++;
      reasoning.push('Weekly momentum strongly confirmed');
    }

    // Rule 2: Daily Momentum Acceleration
    const rule2 = this.analyzeDailyAcceleration(dailyData, indicators, currentPrice, thresholds);
    rules.dailyAcceleration = rule2;
    weightedScore += rule2.score * this.RULE_WEIGHTS.dailyAcceleration;
    if (rule2.passed) {
      passedRules++;
      reasoning.push('Daily momentum showing acceleration');
    }

    // Rule 3: Price Structure Validation
    const rule3 = this.analyzePriceStructure(dailyData, currentPrice, thresholds);
    rules.priceStructure = rule3;
    weightedScore += rule3.score * this.RULE_WEIGHTS.priceStructure;
    if (rule3.passed) {
      passedRules++;
      reasoning.push('Price structure confirms uptrend');
    }

    // Rule 4: Institutional Flow Detection
    const rule4 = this.analyzeInstitutionalFlow(dailyData, indicators, thresholds);
    rules.institutionalFlow = rule4;
    weightedScore += rule4.score * this.RULE_WEIGHTS.institutionalFlow;
    if (rule4.passed) {
      passedRules++;
      reasoning.push('Institutional accumulation detected');
    }

    // Rule 5: Risk-Adjusted Momentum Score
    const rule5 = this.analyzeRiskAdjustedMomentum(dailyData, indicators, currentPrice, thresholds);
    rules.riskAdjustedScore = rule5;
    weightedScore += rule5.score * this.RULE_WEIGHTS.riskAdjustedScore;
    if (rule5.passed) {
      passedRules++;
      reasoning.push('Risk-adjusted momentum favorable');
    }

    // Rule 6: Cascade Trigger Confirmation
    const rule6 = this.analyzeCascadeTrigger(dailyData, weeklyData, indicators, thresholds);
    rules.cascadeTrigger = rule6;
    weightedScore += rule6.score * this.RULE_WEIGHTS.cascadeTrigger;
    if (rule6.passed) {
      passedRules++;
      reasoning.push('Multi-timeframe cascade triggered');
    }

    // Calculate momentum cascade metrics
    const momentumCascade = this.calculateMomentumCascade(rules, weightedScore, thresholds);
    
    // Overall confidence calculation
    const ruleCompletionRatio = passedRules / 6;
    const scoreWeightedConfidence = weightedScore;
    const confidence = (ruleCompletionRatio * 0.4 + scoreWeightedConfidence * 0.6);

    console.log(`  🌊 CASCADE: Score ${(weightedScore * 100).toFixed(1)}% (${passedRules}/6 rules), Cascade: ${momentumCascade.grade}`);

    return {
      rules,
      momentumCascade,
      overallScore: weightedScore,
      passedRules,
      confidence,
      reasoning
    };
  }

  /**
   * Rule 1: Analyze Weekly Momentum Confirmation
   */
  analyzeWeeklyMomentum(weeklyData, indicators, thresholds) {
    if (!weeklyData || weeklyData.length < 26) {
      return {
        passed: false,
        score: 0,
        weight: this.RULE_WEIGHTS.weeklyMomentum,
        details: 'Insufficient weekly data for momentum analysis'
      };
    }

    const latest = weeklyData[weeklyData.length - 1];
    const previous = weeklyData[weeklyData.length - 2];
    
    // Weekly MACD analysis (simulated if not available)
    const weeklyMACD = this.calculateMACD(weeklyData.slice(-26), 12, 26, 9);
    const macdBullish = weeklyMACD.macd > weeklyMACD.signal && weeklyMACD.macd > 0;
    
    // Weekly ROC (Rate of Change) analysis
    const weeklyROC = this.calculateROC(weeklyData, 14);
    const rocThreshold = thresholds.weekly_roc_threshold || 3.0; // Use threshold
    const rocPositive = weeklyROC > rocThreshold;
    
    // Weekly price momentum - USE THRESHOLD
    const priceChange4Week = (latest.close - weeklyData[weeklyData.length - 5].close) / weeklyData[weeklyData.length - 5].close;
    const weeklyThreshold = (thresholds.weekly_momentum_threshold || 8.0) / 100; // Convert to decimal
    const strongWeeklyMomentum = priceChange4Week > weeklyThreshold;
    
    const confirmations = [macdBullish, rocPositive, strongWeeklyMomentum].filter(Boolean).length;
    const weeklyConfirmationsThreshold = thresholds.weekly_confirmations_threshold || 2;
    const passed = confirmations >= weeklyConfirmationsThreshold;
    const score = confirmations / 3;

    return {
      passed,
      score,
      weight: this.RULE_WEIGHTS.weeklyMomentum,
      details: `Weekly momentum: MACD ${macdBullish ? 'bullish' : 'bearish'}, ROC ${rocPositive ? 'positive' : 'negative'}, 4-week change ${(priceChange4Week * 100).toFixed(1)}%`
    };
  }

  /**
   * Rule 2: Analyze Daily Momentum Acceleration
   */
  analyzeDailyAcceleration(dailyData, indicators, currentPrice, thresholds) {
    const rsi14 = indicators.base?.rsi14 || 50;
    const macd = indicators.base?.macd || 0;
    const latest = dailyData[dailyData.length - 1];
    
    // RSI momentum (use threshold)
    const rsiThreshold = thresholds.rsi_momentum_threshold || 60;
    const rsiMomentum = rsi14 > rsiThreshold;
    
    // MACD rising (acceleration)
    const macdRising = macd > (indicators.base?.macdSignal || 0);
    
    // Volume expansion (recent vs average) - use threshold
    const avgVolume = this.calculateAverageVolume(dailyData.slice(-20));
    const recentVolume = this.calculateAverageVolume(dailyData.slice(-3));
    const volumeExpansionThreshold = thresholds.volume_expansion_threshold || 1.3;
    const volumeExpansion = recentVolume > avgVolume * volumeExpansionThreshold;
    
    // Price acceleration (5-day vs 10-day momentum)
    const momentum5Day = this.calculatePriceMomentum(dailyData, 5);
    const momentum10Day = this.calculatePriceMomentum(dailyData, 10);
    const accelerating = momentum5Day > momentum10Day;
    
    const confirmations = [rsiMomentum, macdRising, volumeExpansion, accelerating].filter(Boolean).length;
    const passed = confirmations >= 3;
    const score = confirmations / 4;

    return {
      passed,
      score,
      weight: this.RULE_WEIGHTS.dailyAcceleration,
      details: `Daily acceleration: RSI ${rsi14.toFixed(1)} ${rsiMomentum ? `>${rsiThreshold}` : `≤${rsiThreshold}`}, MACD ${macdRising ? 'rising' : 'falling'}, Volume ${volumeExpansion ? 'expanding' : 'normal'}, Price ${accelerating ? 'accelerating' : 'steady'}`
    };
  }

  /**
   * Rule 3: Analyze Price Structure Validation
   */
  analyzePriceStructure(dailyData, currentPrice, thresholds) {
    // Higher highs analysis (20-day)
    const highs20Day = dailyData.slice(-20).map(d => d.high);
    const recentHigh = Math.max(...highs20Day.slice(-5));
    const priorHigh = Math.max(...highs20Day.slice(-20, -5));
    const higherHighs = recentHigh > priorHigh;
    
    // Higher lows analysis (20-day)
    const lows20Day = dailyData.slice(-20).map(d => d.low);
    const recentLow = Math.min(...lows20Day.slice(-5));
    const priorLow = Math.min(...lows20Day.slice(-20, -5));
    const higherLows = recentLow > priorLow;
    
    // Breakout confirmation (above 20-day high) - use threshold
    const high20Day = Math.max(...highs20Day);
    const breakoutBuffer = thresholds.breakout_buffer || 0.995; // 0.5% buffer
    const breakoutConfirmed = currentPrice > high20Day * breakoutBuffer;
    
    // Trend consistency (EMA alignment simulation)
    const closes = dailyData.slice(-20).map(d => d.close);
    const ema10 = this.calculateEMA(closes, 10);
    const ema20 = this.calculateEMA(closes, 20);
    const trendAlignment = ema10 > ema20 && currentPrice > ema10;
    
    const confirmations = [higherHighs, higherLows, breakoutConfirmed, trendAlignment].filter(Boolean).length;
    const structureThreshold = thresholds.structure_confirmations || 3;
    const passed = confirmations >= structureThreshold;
    const score = confirmations / 4;

    return {
      passed,
      score,
      weight: this.RULE_WEIGHTS.priceStructure,
      details: `Structure: Higher highs ${higherHighs ? 'confirmed' : 'absent'}, Higher lows ${higherLows ? 'confirmed' : 'absent'}, Breakout ${breakoutConfirmed ? 'confirmed' : 'pending'}, Trend ${trendAlignment ? 'aligned' : 'mixed'}`
    };
  }

  /**
   * Rule 4: Analyze Institutional Flow Detection
   */
  analyzeInstitutionalFlow(dailyData, indicators, thresholds) {
    // Volume profile analysis (accumulation vs distribution)
    const recentData = dailyData.slice(-10);
    let accumulation = 0;
    let distribution = 0;
    
    recentData.forEach(day => {
      const bodySize = Math.abs(day.close - day.open);
      const range = day.high - day.low;
      const bodyRatio = range > 0 ? bodySize / range : 0;
      
      const bodyRatioThreshold = thresholds.body_ratio_threshold || 0.6; // Use threshold
      if (day.close > day.open && bodyRatio > bodyRatioThreshold) {
        accumulation += day.volume;
      } else if (day.close < day.open && bodyRatio > bodyRatioThreshold) {
        distribution += day.volume;
      }
    });
    
    const accumulationRatio = (accumulation + distribution) > 0 ? accumulation / (accumulation + distribution) : 0.5;
    const institutionalAccumulation = accumulationRatio > (thresholds.accumulation_ratio_threshold || 0.65); // USE THRESHOLD
    
    // Large volume days (institutional interest) - use threshold
    const avgVolume = this.calculateAverageVolume(dailyData.slice(-50));
    const largeVolumeMultiplier = thresholds.large_volume_multiplier || 1.5;
    const largeVolumeDays = recentData.filter(d => d.volume > avgVolume * largeVolumeMultiplier).length;
    const largeVolumeDaysThreshold = thresholds.large_volume_days_threshold || 3;
    const institutionalInterest = largeVolumeDays >= largeVolumeDaysThreshold;
    
    // OBV trend (On Balance Volume simulation)
    const obvTrend = this.calculateOBVTrend(dailyData.slice(-20));
    const obvPositive = obvTrend > 0;
    
    // Price-volume relationship
    const priceVolumeCorrelation = this.calculatePriceVolumeCorrelation(recentData);
    const positiveCorrelation = priceVolumeCorrelation > (thresholds.correlation_threshold || 0.35); // USE THRESHOLD
    
    const confirmations = [institutionalAccumulation, institutionalInterest, obvPositive, positiveCorrelation].filter(Boolean).length;
    const passed = confirmations >= 3;
    const score = confirmations / 4;

    return {
      passed,
      score,
      weight: this.RULE_WEIGHTS.institutionalFlow,
      details: `Flow: Accumulation ${(accumulationRatio * 100).toFixed(1)}%, Large volume days ${largeVolumeDays}, OBV ${obvPositive ? 'positive' : 'negative'}, Price-volume corr ${priceVolumeCorrelation.toFixed(2)}`
    };
  }

  /**
   * Rule 5: Analyze Risk-Adjusted Momentum Score
   */
  analyzeRiskAdjustedMomentum(dailyData, indicators, currentPrice, thresholds) {
    // Calculate returns and volatility
    const returns = this.calculateReturns(dailyData.slice(-20));
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = this.calculateStandardDeviation(returns);
    
    // Sharpe-like ratio for momentum quality - use threshold
    const momentumQuality = volatility > 0 ? avgReturn / volatility : 0;
    const momentumQualityThreshold = thresholds.momentum_quality_threshold || 0.15;
    const highQualityMomentum = momentumQuality > momentumQualityThreshold;
    
    // Momentum consistency (winning days ratio)
    const winningDays = returns.filter(r => r > 0).length;
    const winRatio = winningDays / returns.length;
    const consistentMomentum = winRatio > (thresholds.win_ratio_threshold || 0.65); // USE THRESHOLD
    
    // Drawdown analysis (maximum adverse movement) - use threshold
    const maxDrawdownThreshold = thresholds.max_drawdown_threshold || 0.08; // Default 8%
    const maxDrawdown = this.calculateMaxDrawdown(dailyData.slice(-20));
    const lowDrawdown = maxDrawdown < maxDrawdownThreshold;
    
    // Momentum persistence (trend strength) - use threshold
    const trendStrengthThreshold = thresholds.trend_strength_threshold || 0.4;
    const trendStrength = this.calculateTrendStrength(dailyData.slice(-20));
    const strongTrend = trendStrength > trendStrengthThreshold;
    
    const confirmations = [highQualityMomentum, consistentMomentum, lowDrawdown, strongTrend].filter(Boolean).length;
    const passed = confirmations >= 3;
    const score = confirmations / 4;

    return {
      passed,
      score,
      weight: this.RULE_WEIGHTS.riskAdjustedScore,
      details: `Risk-adjusted: Quality ${momentumQuality.toFixed(3)}, Win ratio ${(winRatio * 100).toFixed(1)}%, Max DD ${(maxDrawdown * 100).toFixed(1)}%, Trend strength ${trendStrength.toFixed(2)}`
    };
  }

  /**
   * Rule 6: Analyze Cascade Trigger Confirmation
   */
  analyzeCascadeTrigger(dailyData, weeklyData, indicators, thresholds) {
    // Multi-timeframe alignment
    const dailyTrend = this.getTrendDirection(dailyData.slice(-10));
    const weeklyTrend = weeklyData.length > 0 ? this.getTrendDirection(weeklyData.slice(-4)) : dailyTrend;
    const trendAlignment = dailyTrend === 'UP' && weeklyTrend === 'UP';
    
    // Momentum synchronization across timeframes - use threshold
    const dailyMomentum = this.calculatePriceMomentum(dailyData, 5);
    const weeklyMomentumDaily = weeklyData.length > 0 ? this.calculatePriceMomentum(weeklyData, 2) * 0.2 : dailyMomentum; // Scale weekly to daily
    const momentumSyncThreshold = thresholds.momentum_sync_threshold || 0.05;
    const momentumSync = dailyMomentum > 0 && weeklyMomentumDaily > 0 && Math.abs(dailyMomentum - weeklyMomentumDaily) < momentumSyncThreshold;
    
    // Volume cascade (daily volume confirming weekly trend)
    const dailyVolumeTrend = this.getVolumeTrend(dailyData.slice(-5));
    const weeklyVolumeTrend = weeklyData.length > 0 ? this.getVolumeTrend(weeklyData.slice(-3)) : dailyVolumeTrend;
    const volumeCascade = dailyVolumeTrend === 'INCREASING' && weeklyVolumeTrend === 'INCREASING';
    
    // Cascade trigger timing (recent acceleration) - use threshold
    const accelerationThreshold = thresholds.recent_acceleration_threshold || 0.01; // 1% default
    const recentAcceleration = this.detectRecentAcceleration(dailyData.slice(-5));
    
    const confirmations = [trendAlignment, momentumSync, volumeCascade, recentAcceleration].filter(Boolean).length;
    const triggerConfirmations = thresholds.trigger_confirmations || 3;
    const passed = confirmations >= triggerConfirmations;
    const score = confirmations / 4;

    return {
      passed,
      score,
      weight: this.RULE_WEIGHTS.cascadeTrigger,
      details: `Trigger: Trend alignment ${trendAlignment ? 'confirmed' : 'mixed'}, Momentum sync ${momentumSync ? 'yes' : 'no'}, Volume cascade ${volumeCascade ? 'yes' : 'no'}, Recent acceleration ${recentAcceleration ? 'detected' : 'absent'}`
    };
  }

  /**
   * Calculate momentum cascade metrics
   */
  calculateMomentumCascade(rules, weightedScore, thresholds) {
    const cascadeScore = weightedScore;
    
    let grade = 'F';
    let intensity = 'WEAK';
    
    // Use threshold-based grading system
    if (cascadeScore >= (thresholds.cascade_A_plus || 0.80)) {
      grade = 'A+';
      intensity = 'EXCEPTIONAL';
    } else if (cascadeScore >= (thresholds.cascade_A || 0.70)) {
      grade = 'A';
      intensity = 'STRONG';
    } else if (cascadeScore >= (thresholds.cascade_B_plus || 0.60)) {
      grade = 'B+';
      intensity = 'STRONG_MODERATE';
    } else if (cascadeScore >= (thresholds.cascade_B || 0.50)) {
      grade = 'B';
      intensity = 'MODERATE';
    } else if (cascadeScore >= (thresholds.cascade_C || 0.40)) {
      grade = 'C';
      intensity = 'BUILDING';
    } else if (cascadeScore >= 0.30) {
      grade = 'D';
      intensity = 'WEAK';
    }
    
    // Calculate timeframe synergy
    const weeklyScore = rules.weeklyMomentum?.score || 0;
    const dailyScore = rules.dailyAcceleration?.score || 0;
    const triggerScore = rules.cascadeTrigger?.score || 0;
    const timeframeSynergy = (weeklyScore + dailyScore + triggerScore) / 3;

    return {
      score: cascadeScore,
      grade,
      intensity,
      timeframeSynergy
    };
  }

  /**
   * Make final trading decision based on Cascade analysis
   */
  makeFinalDecision(cascadeAnalysis, riskAssessment, dailyData, options) {
    const { momentumCascade, overallScore, passedRules, reasoning } = cascadeAnalysis;
    const { riskReward } = riskAssessment;

    // Get thresholds for decision making
    const thresholds = getSystemThresholds('institutional_momentum_cascade');

    let action = 'AVOID';
    let confidence = cascadeAnalysis.confidence;
    let decisionReasoning = reasoning.join('; ');

    // Check if cascade grade is in the buy_allowed_cascades list
    const buyAllowed = (thresholds.buy_allowed_cascades || ['A+', 'A']).includes(momentumCascade.grade);
    const buyMinScore = thresholds.buy_min_score || 0.70;
    const watchMinScore = thresholds.watch_min_score || 0.50;

    // Threshold-based Decision logic
    if (buyAllowed && overallScore >= buyMinScore) {
      action = 'BUY';
      confidence = Math.min(0.95, confidence + 0.10);
      decisionReasoning = `Strong momentum cascade (${momentumCascade.grade}, ${(overallScore * 100).toFixed(1)}%): ${decisionReasoning}`;
    } else if (overallScore >= watchMinScore) {
      action = 'WATCH';
      confidence = Math.max(0.50, confidence);
      decisionReasoning = `Developing momentum cascade (${momentumCascade.grade}, ${(overallScore * 100).toFixed(1)}%), monitor for improvement: ${decisionReasoning}`;
    } else {
      action = 'AVOID';
      confidence = Math.max(0.20, confidence * 0.8);
      decisionReasoning = `Momentum cascade criteria insufficient (${passedRules}/6 rules, ${momentumCascade.grade} grade, ${(overallScore * 100).toFixed(1)}%): ${decisionReasoning}`;
    }

    return {
      action,
      confidence,
      reasoning: decisionReasoning,
      factors: {
        cascadeGrade: momentumCascade.grade,
        cascadeScore: overallScore,
        passedRules,
        intensity: momentumCascade.intensity,
        timeframeSynergy: momentumCascade.timeframeSynergy,
        riskReward
      }
    };
  }

  /**
   * Assess risk using momentum-based methodology
   */
  assessRisk(cascadeAnalysis, dailyData, currentPrice, thresholds) {
    const atr = this.calculateATR(dailyData.slice(-14));
    const volatility = this.calculateVolatility(dailyData.slice(-20));
    
    // Momentum-based stop loss (tighter for high-quality setups) - use thresholds
    let stopMultiplier = thresholds.base_stop_multiplier || 2.5; // Base ATR multiplier from threshold
    if (cascadeAnalysis.momentumCascade.grade === 'A+') {
      stopMultiplier = thresholds.aplus_stop_multiplier || 2.0; // Tighter stop for explosive setups
    } else if (cascadeAnalysis.momentumCascade.grade === 'A') {
      stopMultiplier = thresholds.a_stop_multiplier || 2.2;
    }
    
    const atrStop = currentPrice - (atr * stopMultiplier);
    const maxStopPercentage = thresholds.max_stop_percentage || 0.92; // 8% maximum stop from threshold
    const percentStop = currentPrice * maxStopPercentage;
    const stopLoss = Math.max(atrStop, percentStop);
    
    // Volatility-adjusted stop for high-momentum stocks - FIXED: Widen stops in high volatility
    const volatilityAdjustedStop = currentPrice - (currentPrice * volatility * 2.0);
    // Use the WIDER (more conservative) stop when volatility is high
    const finalStopLoss = volatility > 0.03 ? Math.min(stopLoss, volatilityAdjustedStop) : stopLoss;
    
    // Momentum-based targets (higher targets for stronger cascades)
    const riskAmount = currentPrice - finalStopLoss;
    let targetMultipliers = [2.5, 4.0, 6.0]; // Conservative targets
    
    if (cascadeAnalysis.momentumCascade.grade === 'A+') {
      targetMultipliers = [3.0, 5.0, 8.0]; // Aggressive targets for explosive setups
    } else if (cascadeAnalysis.momentumCascade.grade === 'A') {
      targetMultipliers = [2.8, 4.5, 7.0];
    }
    
    const targets = targetMultipliers.map(mult => currentPrice + (riskAmount * mult));
    const momentumBasedTargets = targets;
    
    const riskReward = riskAmount > 0 ? (targets[0] - currentPrice) / riskAmount : 0;

    return {
      stopLoss: Math.round(finalStopLoss * 100) / 100,
      targets: targets.map(t => Math.round(t * 100) / 100),
      riskReward: Math.round(riskReward * 100) / 100,
      atr: Math.round(atr * 100) / 100,
      volatilityAdjustedStop: Math.round(volatilityAdjustedStop * 100) / 100,
      momentumBasedTargets: momentumBasedTargets.map(t => Math.round(t * 100) / 100)
    };
  }

  /**
   * Build execution plan with Cascade-specific strategies
   */
  buildExecutionPlan(decision, riskAssessment, cascadeAnalysis, entryPrice, capital = 100000, dailyData) {
    if (decision.action === 'AVOID') return null;

    const positionSizing = this.calculateCascadePositionSizing(
      decision.confidence, 
      { capital, entryPrice }, 
      riskAssessment, 
      cascadeAnalysis
    );

    return {
      entryStrategy: this.buildPreciseCascadeEntryStrategy(cascadeAnalysis, decision.action, riskAssessment, dailyData, entryPrice),
      exitStrategy: this.buildPreciseCascadeExitStrategy(riskAssessment, cascadeAnalysis, decision.action, dailyData, entryPrice),
      positionSizing: positionSizing,
      executionNotes: this.generateCascadeExecutionNotes(cascadeAnalysis, decision.action)
    };
  }

  /**
   * Build dynamic Cascade entry strategy with calculated momentum parameters
   */
  buildPreciseCascadeEntryStrategy(cascadeAnalysis, signal, riskAssessment, dailyData, currentPrice) {
    const latest = dailyData[dailyData.length - 1];
    const atr = this.calculateATR(dailyData.slice(-14));
    const avgVolume = this.calculateAverageVolume(dailyData.slice(-20));
    const volatility = this.calculateVolatility(dailyData.slice(-10));
    const momentum = this.calculatePriceMomentum(dailyData, 5);
    
    // Calculate dynamic momentum entry parameters
    const momentumZone = this.calculateMomentumEntryZone(currentPrice, atr, momentum, volatility);
    const volumeExpansion = this.calculateMomentumVolumeThresholds(avgVolume, cascadeAnalysis.momentumCascade.grade);
    const accelerationTriggers = this.calculateAccelerationTriggers(dailyData, atr);
    const cascadeSlippage = this.calculateCascadeSlippage(volatility, momentum, cascadeAnalysis.momentumCascade.grade);
    
    const strategy = {
      type: signal === 'STRONG_BUY' || signal === 'BUY' ? 'IMMEDIATE' : 'CONDITIONAL',
      
      // DYNAMIC MOMENTUM ENTRY ZONE
      momentumZone: {
        optimal: momentumZone.optimal,
        acceleration: momentumZone.acceleration,
        breakout: momentumZone.breakout,
        maximum: momentumZone.maximum
      },
      
      // CALCULATED VOLUME EXPANSION REQUIREMENTS
      volumeExpansion: {
        baseline: Math.round(volumeExpansion.baseline),
        momentum: Math.round(volumeExpansion.momentum),
        cascade: Math.round(volumeExpansion.cascade),
        explosive: Math.round(volumeExpansion.explosive)
      },
      
      // MOMENTUM ACCELERATION TRIGGERS
      accelerationTriggers: accelerationTriggers,
      
      // DYNAMIC TIMING FOR MOMENTUM
      momentumTimeWindows: this.calculateMomentumTimeWindows(volatility, momentum),
      
      // CALCULATED ORDER PARAMETERS FOR MOMENTUM
      orderParameters: {
        type: momentum > 0.02 ? 'MARKET_AGGRESSIVE' : 'LIMIT_MOMENTUM',
        slippageAllowance: `${(cascadeSlippage * 100).toFixed(2)}%`,
        timeInForce: volatility > 0.04 ? 'IOC' : momentum > 0.01 ? 'FOK' : 'DAY',
        urgency: this.calculateMomentumUrgency(cascadeAnalysis, signal, momentum)
      },
      
      // DYNAMIC CASCADE CONDITIONS
      cascadeTriggers: this.calculateCascadeTriggers(cascadeAnalysis, currentPrice, latest, atr, momentum, dailyData),
      
      // MOMENTUM REGIME ADJUSTMENTS
      momentumRegimeAdjustments: this.calculateMomentumRegimeAdjustments(dailyData, cascadeAnalysis, momentum)
    };

    return strategy;
  }

  /**
   * Build dynamic Cascade exit strategy with momentum-based parameters
   */
  buildPreciseCascadeExitStrategy(riskAssessment, cascadeAnalysis, signal, dailyData, currentPrice) {
    const atr = riskAssessment.atr;
    const volatility = this.calculateVolatility(dailyData.slice(-10));
    const momentum = this.calculatePriceMomentum(dailyData, 5);
    const momentumDecay = this.calculateMomentumDecay(dailyData);
    
    // Calculate dynamic momentum trailing stops
    const momentumTrailingStops = this.calculateMomentumTrailingStops(currentPrice, atr, volatility, momentum, cascadeAnalysis.momentumCascade.grade);
    
    // Calculate momentum-based targets
    const momentumTargets = this.calculateMomentumTargets(riskAssessment.targets, volatility, momentum, cascadeAnalysis);
    
    // Calculate cascade breakdown exits
    const cascadeBreakdownExits = this.calculateCascadeBreakdownExits(cascadeAnalysis, momentum, volatility);
    
    return {
      // CALCULATED MOMENTUM STOP LOSS LEVELS
      stopLoss: {
        initial: riskAssessment.stopLoss,
        momentumTrailing: momentumTrailingStops.trailing,
        accelerationStop: momentumTrailingStops.acceleration,
        cascadeBreakdown: momentumTrailingStops.cascadeBreakdown,
        volatilityAdjusted: momentumTrailingStops.volatilityAdjusted
      },
      
      // DYNAMIC MOMENTUM TARGET MANAGEMENT
      targets: {
        momentum: momentumTargets.momentum,
        acceleration: momentumTargets.acceleration,
        cascade: momentumTargets.cascade,
        explosive: momentumTargets.explosive,
        scalingMethod: momentumTargets.scalingMethod
      },
      
      // CALCULATED MOMENTUM DECAY EXITS
      momentumDecayExits: cascadeBreakdownExits.momentumDecay,
      
      // DYNAMIC CASCADE BREAKDOWN TRIGGERS
      cascadeBreakdownTriggers: cascadeBreakdownExits.breakdown,
      
      // MOMENTUM CONDITION EXITS
      momentumConditionExits: this.calculateMomentumConditionExits(dailyData, cascadeAnalysis, momentum)
    };
  }

  /**
   * Calculate Cascade position sizing using unified Momentum + Signal Quality scoring
   */
  calculateCascadePositionSizing(confidence, capitalInfo, riskAssessment, cascadeAnalysis) {
    const { capital = 100000, entryPrice = 100 } = capitalInfo;
    const { stopLoss = 0, riskReward = 1 } = riskAssessment;
    
    // Calculate Signal Quality Grade for unified scoring
    const signalQuality = this.calculateSignalQuality(confidence, cascadeAnalysis);
    const signalQualityGrade = signalQuality.grade;
    
    // 🎯 UNIFIED SCORING SYSTEM: Momentum Grade + Signal Quality Grade
    const gradePoints = {
      'A+': 3,
      'A': 2.5,
      'B+': 2,
      'B': 1.5,
      'C': 1,
      'D': 0.5,
      'F': 0
    };

    const momentumScore = gradePoints[cascadeAnalysis.momentumCascade.grade] || 0;
    const signalScore = gradePoints[signalQualityGrade] || 0;
    const totalScore = momentumScore + signalScore;
    
    // Confidence and rules multiplier for edge cases
    const confidenceMultiplier = confidence > 0.8 ? 1.1 : confidence < 0.6 ? 0.9 : 1.0;
    const rulesBonus = cascadeAnalysis.passedRules >= 5 ? 1.1 : cascadeAnalysis.passedRules <= 2 ? 0.9 : 1.0;
    const finalScore = totalScore * confidenceMultiplier * rulesBonus;

    let recommendation = 'AVOID';
    let riskPercent = 0;
    let maxPosition = 0;
    
    // 🚀 UNIFIED SIZING MATRIX - Both grades matter!
    if (finalScore >= 6.0) {
      recommendation = 'FULL';
      riskPercent = 2.0;
      maxPosition = 20;
    } else if (finalScore >= 5.6) {
      recommendation = 'STRONG';
      riskPercent = 1.8;
      maxPosition = 18;
    } else if (finalScore >= 5.2) {
      recommendation = 'STRONG';
      riskPercent = 1.6;
      maxPosition = 16;
    } else if (finalScore >= 4.8) {
      recommendation = 'LARGE';
      riskPercent = 1.4;
      maxPosition = 14;
    } else if (finalScore >= 4.4) {
      recommendation = 'LARGE';
      riskPercent = 1.2;
      maxPosition = 12;
    } else if (finalScore >= 4.0) {
      recommendation = 'REDUCED';
      riskPercent = 1.0;
      maxPosition = 10;
    } else if (finalScore >= 3.6) {
      recommendation = 'HALF';
      riskPercent = 0.8;
      maxPosition = 8;
    } else if (finalScore >= 3.0) {
      recommendation = 'QUARTER';
      riskPercent = 0.6;
      maxPosition = 6;
    } else if (finalScore >= 2.4) {
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
        console.log(`  ⚠️ CASCADE: Invalid risk per share: ${riskPerShare.toFixed(4)} (entry: ${entryPrice}, stop: ${stopLoss})`);
      }
    } else {
      console.log(`  ⚠️ CASCADE: Position sizing skipped - recommendation: ${recommendation}, entryPrice: ${entryPrice}, stopLoss: ${stopLoss}, capital: ${capital}`);
    }

    // 🎯 UNIFIED SCORING DEBUG INFO
    console.log(`  🎯 UNIFIED SCORING: Momentum ${cascadeAnalysis.momentumCascade.grade}(${momentumScore}) + Signal ${signalQualityGrade}(${signalScore}) = ${totalScore.toFixed(1)} → ${recommendation}`);

    return {
      recommendation,
      riskPercent,
      maxPosition,
      shares: Math.max(0, shares),
      positionValue: positionValue,
      riskAmount: riskAmount,
      riskPerShare: Math.round((entryPrice - stopLoss) * 100) / 100,
      stopDistance: stopLoss > 0 ? Math.round(((entryPrice - stopLoss) / entryPrice) * 10000) / 100 : 0,
      
      // 🎯 UNIFIED SCORING METADATA
      unifiedScoring: {
        momentumGrade: cascadeAnalysis.momentumCascade.grade,
        momentumScore: momentumScore,
        signalQualityGrade: signalQualityGrade,
        signalScore: signalScore,
        totalScore: totalScore,
        finalScore: finalScore,
        confidenceMultiplier: confidenceMultiplier,
        rulesBonus: rulesBonus
      }
    };
  }

  /**
   * Generate execution notes specific to Cascade methodology
   */
  generateCascadeExecutionNotes(cascadeAnalysis, signal) {
    const notes = [
      `Momentum Cascade: ${cascadeAnalysis.momentumCascade.grade} grade (${cascadeAnalysis.momentumCascade.intensity} intensity)`,
      `Rules passed: ${cascadeAnalysis.passedRules}/6, Timeframe synergy: ${(cascadeAnalysis.momentumCascade.timeframeSynergy * 100).toFixed(1)}%`
    ];

    if (signal === 'STRONG_BUY') {
      notes.push('EXPLOSIVE SETUP - Execute with maximum conviction');
      notes.push('Monitor for continued momentum acceleration');
      notes.push('Consider scaling position if cascade intensifies');
    } else if (signal === 'BUY') {
      notes.push('Strong momentum cascade confirmed - Execute with confidence');
      notes.push('Watch for institutional flow continuation');
      notes.push('Trail stops aggressively to capture momentum');
    } else if (signal === 'WATCH') {
      notes.push('Developing cascade - Monitor for rule improvements');
      notes.push('Wait for stronger timeframe alignment');
      notes.push('Watch for institutional accumulation signs');
    }

    // Add specific rule insights
    const failedRules = Object.entries(cascadeAnalysis.rules)
      .filter(([_, rule]) => !rule.passed)
      .map(([name, _]) => name);

    if (failedRules.length > 0) {
      notes.push(`Monitor for improvement in: ${failedRules.join(', ')}`);
    }

    return notes;
  }

  /**
   * Calculate signal quality grade for gate engine integration
   */
  calculateSignalQuality(confidence, cascadeAnalysis) {
    let score = 50; // Base score

    // Cascade grade scoring
    const gradeScores = { 'A+': 40, 'A': 35, 'B+': 30, 'B': 25, 'C': 15, 'F': 0 };
    score += gradeScores[cascadeAnalysis.momentumCascade.grade] || 0;

    // Rules passed scoring
    score += (cascadeAnalysis.passedRules / 6) * 15;

    // Confidence scoring
    score += confidence * 10;

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

  /**
   * Calculate unified display grade combining Cascade Grade + Signal Quality Grade
   * This is for display purposes only and matches the position sizing logic
   */
  calculateUnifiedDisplayGrade(cascadeGrade, signalGrade) {
    const gradePoints = {
      'A+': 3,
      'A': 2.5,
      'B+': 2,
      'B': 1.5,
      'C': 1,
      'D': 0.5,
      'F': 0
    };

    const cascadeScore = gradePoints[cascadeGrade] || 0;
    const signalScore = gradePoints[signalGrade] || 0;
    const totalScore = cascadeScore + signalScore;

    // Convert combined score to unified grade
    if (totalScore >= 5.5) return 'A+';      // FULL territory (A+ + A or better)
    else if (totalScore >= 4.5) return 'A';  // STRONG territory (A + B+ or better)
    else if (totalScore >= 3.5) return 'B+'; // LARGE territory (B+ + B+ or A + C)
    else if (totalScore >= 2.5) return 'B';  // REDUCED territory (B + C or B+ + D)
    else if (totalScore >= 1.5) return 'C';  // QUARTER territory (C + C or B + F)
    else if (totalScore >= 0.5) return 'D';  // MICRO territory (D + D or C + F)
    else return 'F';                         // AVOID territory
  }

  // Helper methods for calculations
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

  calculateMACD(data, fastPeriod, slowPeriod, signalPeriod) {
    if (!data || data.length < Math.max(fastPeriod, slowPeriod) + signalPeriod) {
      return { macd: 0, signal: 0, histogram: 0 };
    }
    
    const closes = data.map(d => d.close);
    const macdLine = [];
    
    // Calculate MACD line for each period
    for (let i = Math.max(fastPeriod, slowPeriod) - 1; i < closes.length; i++) {
      const periodCloses = closes.slice(0, i + 1);
      const fastEMA = this.calculateEMA(periodCloses, fastPeriod);
      const slowEMA = this.calculateEMA(periodCloses, slowPeriod);
      macdLine.push(fastEMA - slowEMA);
    }
    
    // Calculate signal line from MACD array
    const signal = this.calculateEMA(macdLine, signalPeriod);
    const macd = macdLine[macdLine.length - 1];
    const histogram = macd - signal;
    
    return { macd, signal, histogram };
  }

  calculateEMA(data, period) {
    if (!data || data.length === 0) return 0;
    const multiplier = 2 / (period + 1);
    let ema = data[0];
    for (let i = 1; i < data.length; i++) {
      ema = (data[i] * multiplier) + (ema * (1 - multiplier));
    }
    return ema;
  }

  calculateROC(data, period) {
    if (!data || data.length < period + 1) return 0;
    const current = data[data.length - 1].close;
    const previous = data[data.length - 1 - period].close;
    return ((current - previous) / previous) * 100;
  }

  calculatePriceMomentum(data, period) {
    if (!data || data.length < period + 1) return 0;
    const current = data[data.length - 1].close;
    const previous = data[data.length - 1 - period].close;
    return (current - previous) / previous;
  }

  calculateReturns(data) {
    const returns = [];
    for (let i = 1; i < data.length; i++) {
      returns.push((data[i].close - data[i - 1].close) / data[i - 1].close);
    }
    return returns;
  }

  calculateStandardDeviation(data) {
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
    return Math.sqrt(variance);
  }

  calculateMaxDrawdown(data) {
    let maxPrice = data[0].close;
    let maxDrawdown = 0;
    
    for (let i = 1; i < data.length; i++) {
      if (data[i].close > maxPrice) {
        maxPrice = data[i].close;
      } else {
        const drawdown = (maxPrice - data[i].close) / maxPrice;
        maxDrawdown = Math.max(maxDrawdown, drawdown);
      }
    }
    
    return maxDrawdown;
  }

  calculateTrendStrength(data) {
    const closes = data.map(d => d.close);
    const trend = closes[closes.length - 1] - closes[0];
    const volatility = this.calculateStandardDeviation(this.calculateReturns(data));
    return volatility > 0 ? Math.abs(trend) / (closes[0] * volatility * Math.sqrt(data.length)) : 0;
  }

  calculateVolatility(data) {
    const returns = this.calculateReturns(data);
    return this.calculateStandardDeviation(returns);
  }

  getTrendDirection(data) {
    if (!data || data.length < 2) return 'NEUTRAL';
    const firstPrice = data[0].close;
    const lastPrice = data[data.length - 1].close;
    const change = (lastPrice - firstPrice) / firstPrice;
    return change > 0.02 ? 'UP' : change < -0.02 ? 'DOWN' : 'NEUTRAL';
  }

  getVolumeTrend(data) {
    if (!data || data.length < 2) return 'NEUTRAL';
    const firstVolume = data[0].volume;
    const lastVolume = data[data.length - 1].volume;
    const change = (lastVolume - firstVolume) / firstVolume;
    return change > 0.1 ? 'INCREASING' : change < -0.1 ? 'DECREASING' : 'NEUTRAL';
  }

  detectRecentAcceleration(data) {
    if (!data || data.length < 3) return false;
    const recentReturns = this.calculateReturns(data.slice(-3));
    const priorReturns = this.calculateReturns(data.slice(-6, -3));
    const recentAvg = recentReturns.reduce((sum, r) => sum + r, 0) / recentReturns.length;
    const priorAvg = priorReturns.reduce((sum, r) => sum + r, 0) / priorReturns.length;
    return recentAvg > priorAvg && recentAvg > 0.01; // Recent acceleration > 1%
  }

  calculateOBVTrend(data) {
    let obv = 0;
    const obvValues = [0];
    
    for (let i = 1; i < data.length; i++) {
      if (data[i].close > data[i - 1].close) {
        obv += data[i].volume;
      } else if (data[i].close < data[i - 1].close) {
        obv -= data[i].volume;
      }
      obvValues.push(obv);
    }
    
    // Return trend of OBV (positive = accumulation)
    return obvValues[obvValues.length - 1] - obvValues[0];
  }

  calculatePriceVolumeCorrelation(data) {
    const priceChanges = [];
    const volumeChanges = [];
    
    for (let i = 1; i < data.length; i++) {
      priceChanges.push((data[i].close - data[i - 1].close) / data[i - 1].close);
      volumeChanges.push((data[i].volume - data[i - 1].volume) / data[i - 1].volume);
    }
    
    // Simple correlation calculation
    const priceAvg = priceChanges.reduce((sum, p) => sum + p, 0) / priceChanges.length;
    const volumeAvg = volumeChanges.reduce((sum, v) => sum + v, 0) / volumeChanges.length;
    
    let covariance = 0;
    let priceVariance = 0;
    let volumeVariance = 0;
    
    for (let i = 0; i < priceChanges.length; i++) {
      const priceDiff = priceChanges[i] - priceAvg;
      const volumeDiff = volumeChanges[i] - volumeAvg;
      covariance += priceDiff * volumeDiff;
      priceVariance += priceDiff * priceDiff;
      volumeVariance += volumeDiff * volumeDiff;
    }
    
    const denominator = Math.sqrt(priceVariance * volumeVariance);
    return denominator > 0 ? covariance / denominator : 0;
  }

  validateData(indicators, series) {
    if (!series?.daily || series.daily.length < 60) return false; // Need ~3 months minimum
    return true;
  }

  // DYNAMIC MOMENTUM STRATEGY CALCULATION METHODS

  calculateMomentumEntryZone(currentPrice, atr, momentum, volatility) {
    const momentumFactor = Math.max(0.5, Math.min(3.0, momentum * 20));
    const volatilityFactor = Math.max(0.5, Math.min(2.0, volatility * 15));
    
    return {
      optimal: currentPrice,
      acceleration: currentPrice + (atr * 0.3 * momentumFactor),
      breakout: currentPrice + (atr * 0.7 * momentumFactor),
      maximum: currentPrice + (atr * 1.2 * volatilityFactor)
    };
  }

  calculateMomentumVolumeThresholds(avgVolume, cascadeGrade) {
    const gradeMultipliers = { 'A+': 3.0, 'A': 2.5, 'B': 2.0, 'C': 1.5, 'D': 1.2 };
    const multiplier = gradeMultipliers[cascadeGrade] || 1.0;
    
    return {
      baseline: avgVolume * multiplier,
      momentum: avgVolume * multiplier * 1.5,
      cascade: avgVolume * multiplier * 2.5,
      explosive: avgVolume * multiplier * 4.0
    };
  }

  calculateAccelerationTriggers(dailyData, atr) {
    const latest = dailyData[dailyData.length - 1];
    const momentum5 = this.calculatePriceMomentum(dailyData, 5);
    const momentum10 = this.calculatePriceMomentum(dailyData, 10);
    const avgVolume20Day = this.calculateAverageVolume(dailyData.slice(-20));
    
    return {
      priceAcceleration: {
        threshold: momentum5 > momentum10 * 1.2,
        current: momentum5 / momentum10,
        target: 1.2,
        met: momentum5 > momentum10 * 1.2
      },
      volumeAcceleration: {
        threshold: avgVolume20Day * 1.5,
        current: latest.volume,
        met: latest.volume > avgVolume20Day * 1.5
      },
      breakoutAcceleration: {
        threshold: latest.close + atr * 0.5,
        current: latest.close,
        met: false // To be triggered on next price update
      }
    };
  }

  calculateCascadeSlippage(volatility, momentum, cascadeGrade) {
    const baseSlippage = volatility * 1.5; // 1.5x volatility for momentum
    const momentumAdjustment = Math.max(0.5, Math.min(2.0, momentum * 10));
    const gradeAdjustment = { 'A+': 1.2, 'A': 1.1, 'B': 1.0, 'C': 0.9, 'D': 0.8 }[cascadeGrade] || 1.0;
    
    return Math.max(0.003, Math.min(0.015, baseSlippage * momentumAdjustment * gradeAdjustment)); // 0.3% to 1.5%
  }

  calculateMomentumTimeWindows(volatility, momentum) {
    if (momentum > 0.02 && volatility > 0.04) {
      return {
        primary: 'First 15 minutes after open (explosive momentum)',
        secondary: 'Breakout confirmation periods',
        avoid: 'Low volume periods'
      };
    } else if (momentum > 0.01) {
      return {
        primary: 'First 30 minutes after open',
        secondary: 'Momentum continuation periods',
        avoid: 'End of day unless strong momentum'
      };
    } else {
      return {
        primary: 'Wait for momentum acceleration',
        secondary: 'Any acceleration signals',
        avoid: 'Current low momentum period'
      };
    }
  }

  calculateMomentumUrgency(cascadeAnalysis, signal, momentum) {
    if (signal === 'STRONG_BUY' && cascadeAnalysis.momentumCascade.grade === 'A+') return 'EXPLOSIVE';
    if (signal === 'BUY' && momentum > 0.02) return 'URGENT';
    if (signal === 'BUY' && cascadeAnalysis.momentumCascade.grade === 'A') return 'HIGH';
    if (signal === 'BUY') return 'MEDIUM';
    return 'LOW';
  }

  calculateCascadeTriggers(cascadeAnalysis, currentPrice, latest, atr, momentum, dailyData) {
    const triggers = [];
    
    // 🎯 REAL VOLUME CASCADE: Compare to 20-day average, look for institutional flow
    if (dailyData.length >= 20) {
      const avg20DayVolume = this.calculateAverageVolume(dailyData.slice(-20));
      const institutionalThreshold = avg20DayVolume * 1.8; // Higher threshold for institutional flow
      triggers.push({
        type: TRIGGER_TYPES.VOLUME,
        threshold: institutionalThreshold,
        current: latest.volume,
        met: latest.volume > institutionalThreshold,
        description: `Volume ${latest.volume.toLocaleString()} vs institutional threshold ${institutionalThreshold.toLocaleString()}`
      });
    }
    
    // 🎯 MOMENTUM ACCELERATION: Real momentum vs recent average
    const recentMomentum = this.calculatePriceMomentum(dailyData.slice(-5), 5);
    const longerMomentum = this.calculatePriceMomentum(dailyData.slice(-10), 10);
    const momentumAcceleration = recentMomentum - longerMomentum;
    const accelerationThreshold = 0.01; // 1% acceleration
    triggers.push({
      type: TRIGGER_TYPES.MOMENTUM_ACCELERATION,
      threshold: accelerationThreshold,
      current: momentumAcceleration,
      met: momentumAcceleration > accelerationThreshold,
      description: `Momentum acceleration ${(momentumAcceleration * 100).toFixed(2)}% vs threshold ${(accelerationThreshold * 100).toFixed(2)}%`
    });
    
    // 🎯 DYNAMIC BREAKOUT: Find actual resistance from price structure
    const resistanceLevel = this.findInstitutionalResistance(dailyData, currentPrice);
    const breakoutBuffer = resistanceLevel * 1.003; // 0.3% above resistance for institutional move
    triggers.push({
      type: TRIGGER_TYPES.BREAKOUT_LEVEL,
      threshold: breakoutBuffer,
      current: currentPrice,
      met: currentPrice >= breakoutBuffer,
      description: `Price ${currentPrice.toFixed(2)} vs institutional resistance ${resistanceLevel.toFixed(2)}`
    });
    
    // 🎯 CASCADE GRADE: Based on actual analysis, not hardcoded
    const gradeScore = this.getGradeScore(cascadeAnalysis.momentumCascade.grade);
    const gradeThreshold = 2.5; // Equivalent to 'A' grade
    triggers.push({
      type: TRIGGER_TYPES.CASCADE_GRADE,
      threshold: gradeThreshold,
      current: gradeScore,
      met: gradeScore >= gradeThreshold,
      description: `Grade ${cascadeAnalysis.momentumCascade.grade} (${gradeScore}) vs threshold ${gradeThreshold}`
    });
    
    return triggers;
  }

  calculateMomentumRegimeAdjustments(dailyData, cascadeAnalysis, momentum) {
    const recentMomentum = this.calculatePriceMomentum(dailyData.slice(-3), 3);
    const longerMomentum = this.calculatePriceMomentum(dailyData.slice(-10), 10);
    const momentumRegime = recentMomentum > longerMomentum * 2.0 ? 'ACCELERATING' : 
                          momentum > 0.01 ? 'BUILDING' : 'WEAK';
    
    const adjustments = {
      'ACCELERATING': ['Increase urgency', 'Use market orders', 'Accept higher slippage'],
      'BUILDING': ['Standard momentum approach', 'Monitor acceleration', 'Use limit orders'],
      'WEAK': ['Wait for acceleration', 'Reduce position sizes', 'Very tight stops']
    };
    
    return {
      regime: momentumRegime,
      adjustments: adjustments[momentumRegime],
      confidence: momentumRegime === 'ACCELERATING' ? 'HIGH' : 
                 momentumRegime === 'BUILDING' ? 'MEDIUM' : 'LOW'
    };
  }

  calculateMomentumTrailingStops(currentPrice, atr, volatility, momentum, cascadeGrade) {
    const baseDistance = atr * 2.2; // Tighter for momentum
    const momentumAdjustment = Math.max(0.7, Math.min(1.8, momentum * 15));
    const volatilityAdjustment = Math.max(0.8, Math.min(1.5, volatility * 10));
    const gradeAdjustment = { 'A+': 0.8, 'A': 0.9, 'B': 1.0, 'C': 1.1, 'D': 1.2 }[cascadeGrade] || 1.0;
    
    return {
      trailing: currentPrice - (baseDistance * gradeAdjustment),
      acceleration: currentPrice - (baseDistance * momentumAdjustment * 0.8),
      cascadeBreakdown: currentPrice - (atr * 3.0), // Wider stop for cascade breakdown
      volatilityAdjusted: currentPrice - (baseDistance * volatilityAdjustment)
    };
  }

  calculateMomentumTargets(staticTargets, volatility, momentum, cascadeAnalysis) {
    const momentumFactor = Math.max(0.8, Math.min(2.0, momentum * 20));
    // FIXED: Volatility factor should extend targets for high volatility, not reduce them
    const volatilityFactor = Math.max(1.0, Math.min(1.8, 1 + (volatility * 8)));
    const cascadeBonus = { 'A+': 1.5, 'A': 1.3, 'B': 1.1, 'C': 1.0, 'D': 0.9 }[cascadeAnalysis.momentumCascade.grade] || 1.0;
    
    return {
      momentum: staticTargets[0] * momentumFactor * cascadeBonus * volatilityFactor,
      acceleration: staticTargets[1] * momentumFactor * cascadeBonus * volatilityFactor,
      cascade: staticTargets[2] * momentumFactor * cascadeBonus * volatilityFactor,
      explosive: staticTargets[2] * momentumFactor * cascadeBonus * volatilityFactor * 1.5,
      scalingMethod: cascadeAnalysis.momentumCascade.grade === 'A+' ? 
        '20% at momentum, 20% at acceleration, 30% at cascade, 30% explosive runner' : 
        '25% at momentum, 25% at acceleration, 50% at cascade'
    };
  }

  calculateCascadeBreakdownExits(cascadeAnalysis, momentum, volatility) {
    const momentumThreshold = Math.max(0.005, momentum * 0.3); // 30% of current momentum
    const cascadeThreshold = cascadeAnalysis.overallScore * 0.7; // 70% of current score
    
    return {
      momentumDecay: {
        threshold: momentumThreshold,
        action: 'Exit 30% if momentum drops below threshold',
        timeframe: volatility > 0.03 ? '2 days' : '5 days'
      },
      breakdown: {
        ruleFailures: 'Exit 50% if 3+ cascade rules fail',
        gradeDowngrade: 'Exit 25% if cascade grade drops by 2 levels',
        volumeDryUp: 'Exit 30% if volume drops below 70% average for 3 days'
      }
    };
  }

  calculateMomentumConditionExits(dailyData, cascadeAnalysis, momentum) {
    const marketMomentum = this.calculatePriceMomentum(dailyData, 3);
    const momentumDivergence = Math.abs(momentum - marketMomentum) / Math.max(momentum, marketMomentum);
    
    return {
      momentumDivergence: momentumDivergence > 0.5 ? 
        'Consider exit if momentum diverges from market by >50%' : 'Momentum aligned with market',
      cascadeIntegrity: cascadeAnalysis.passedRules < 3 ? 
        'Monitor cascade integrity - less than 3 rules passing' : 'Cascade integrity maintained',
      accelerationStall: momentum < 0.005 ? 
        'Momentum stalled - consider profit taking' : 'Momentum maintained'
    };
  }

  calculateMomentumDecay(dailyData) {
    const recent = this.calculatePriceMomentum(dailyData.slice(-3), 3);
    const prior = this.calculatePriceMomentum(dailyData.slice(-6, -3), 3);
    const decay = prior > 0 ? (prior - recent) / prior : 0;
    
    return {
      decayRate: decay,
      isDecaying: decay > 0.3, // 30% momentum loss
      severity: decay > 0.5 ? 'HIGH' : decay > 0.3 ? 'MEDIUM' : 'LOW'
    };
  }

  calculateMomentumDecay(dailyData) {
    if (!dailyData || dailyData.length < 10) return 0;
    
    const recent5 = dailyData.slice(-5);
    const prior5 = dailyData.slice(-10, -5);
    
    const recentMomentum = this.calculatePriceMomentum(recent5, 5);
    const priorMomentum = this.calculatePriceMomentum(prior5, 5);
    
    return priorMomentum - recentMomentum; // Positive value indicates decay
  }

  /**
   * Find institutional resistance level from volume-weighted price action
   * @param {Array} dailyData - Historical price data
   * @param {number} currentPrice - Current stock price
   * @returns {number} Institutional resistance level
   */
  findInstitutionalResistance(dailyData, currentPrice) {
    if (!dailyData || dailyData.length < 30) return currentPrice * 1.03; // Fallback
    
    // Look for institutional resistance in last 90 days with volume confirmation
    const recentData = dailyData.slice(-90);
    const avgVolume = this.calculateAverageVolume(recentData);
    
    // Find high-volume resistance levels
    const volumeWeightedHighs = [];
    for (let i = 2; i < recentData.length - 2; i++) {
      const day = recentData[i];
      const prevDay = recentData[i-1];
      const nextDay = recentData[i+1];
      
      // Check if it's a local high with significant volume
      if (day.high > prevDay.high && day.high > nextDay.high && 
          day.volume > avgVolume * 1.2) { // 20% above average volume
        volumeWeightedHighs.push({
          price: day.high,
          volume: day.volume,
          weight: day.volume / avgVolume
        });
      }
    }
    
    if (volumeWeightedHighs.length === 0) {
      // Use 30-day high if no volume-weighted highs found
      return Math.max(...recentData.slice(-30).map(d => d.high));
    }
    
    // Find nearest resistance above current price, weighted by volume
    const resistanceLevels = volumeWeightedHighs
      .filter(level => level.price > currentPrice)
      .sort((a, b) => a.price - b.price); // Sort by price ascending
    
    if (resistanceLevels.length === 0) {
      // Use highest volume-weighted level if none above current price
      const highestVolumeLevel = volumeWeightedHighs
        .sort((a, b) => b.weight - a.weight)[0];
      return highestVolumeLevel ? highestVolumeLevel.price : currentPrice * 1.03;
    }
    
    return resistanceLevels[0].price; // Return nearest resistance
  }

  /**
   * Convert grade to numeric score for trigger calculations
   * @param {string} grade - Grade (A+, A, B+, etc.)
   * @returns {number} Numeric score
   */
  getGradeScore(grade) {
    const gradeScores = {
      'A+': 4.0,
      'A': 3.0,
      'B+': 2.0,
      'B': 1.0,
      'C': 0.5,
      'D': 0.2,
      'F': 0
    };
    return gradeScores[grade] || 0;
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

module.exports = InstitutionalMomentumCascade;
