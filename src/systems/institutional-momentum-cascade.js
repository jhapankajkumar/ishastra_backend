/**
 * Institutional Momentum Cascade - Advanced Momentum System
 * 
 * Based on institutional momentum cascade theory for detecting major trend acceleration.
 * Combines multi-timeframe momentum analysis with institutional flow detection.
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
 * Version: 2.0.0 - Centralized Configuration
 * Last Updated: 2024
 */

const { getSystemThresholds } = require('../config/trading-thresholds');

class InstitutionalMomentumCascade {
  constructor() {
    this.systemId = 'institutional_momentum_cascade';
    this.name = 'Institutional Momentum Cascade (Advanced)';
    this.version = '1.0.0';
    this.description = '6-rule momentum cascade system for institutional trend detection';

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
   * @param {Object} options - Analysis options including capital, symbol, currentPrice, aiSignals
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
      const { capital, symbol, currentPrice, aiSignals } = options;
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
      const riskAssessment = this.assessRisk(cascadeAnalysis, completedDaily, entryPrice);

      // Generate final decision with AI enhancement
      const finalDecision = this.makeFinalDecisionWithAI(
        cascadeAnalysis, 
        riskAssessment, 
        completedDaily, 
        { capital, symbol, entryPrice },
        aiSignals
      );

      // Calculate signal quality for gate engine integration
      const signalQuality = this.calculateSignalQuality(finalDecision.confidence, cascadeAnalysis);

      // Build execution plan
      const execution = this.buildExecutionPlan(finalDecision, riskAssessment, cascadeAnalysis, entryPrice, capital, completedDaily);

      console.log(`  🌊 CASCADE: Decision: ${finalDecision.action}, Confidence: ${(finalDecision.confidence * 100).toFixed(1)}%`);

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
        cascadeAnalysis: cascadeAnalysis,
        factors: finalDecision.factors,
        aiEnhanced: finalDecision.aiEnhanced || false,
        aiReasoning: finalDecision.aiReasoning || 'No AI enhancement applied',
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
  executeCascadeAnalysis(dailyData, weeklyData, indicators, currentPrice) {
    console.log(`  🌊 CASCADE: Executing 6-rule momentum cascade validation...`);

    const rules = {};
    const reasoning = [];
    let weightedScore = 0;
    let passedRules = 0;

    // Rule 1: Weekly Momentum Confirmation
    const rule1 = this.analyzeWeeklyMomentum(weeklyData, indicators);
    rules.weeklyMomentum = rule1;
    weightedScore += rule1.score * this.RULE_WEIGHTS.weeklyMomentum;
    if (rule1.passed) {
      passedRules++;
      reasoning.push('Weekly momentum strongly confirmed');
    }

    // Rule 2: Daily Momentum Acceleration
    const rule2 = this.analyzeDailyAcceleration(dailyData, indicators, currentPrice);
    rules.dailyAcceleration = rule2;
    weightedScore += rule2.score * this.RULE_WEIGHTS.dailyAcceleration;
    if (rule2.passed) {
      passedRules++;
      reasoning.push('Daily momentum showing acceleration');
    }

    // Rule 3: Price Structure Validation
    const rule3 = this.analyzePriceStructure(dailyData, currentPrice);
    rules.priceStructure = rule3;
    weightedScore += rule3.score * this.RULE_WEIGHTS.priceStructure;
    if (rule3.passed) {
      passedRules++;
      reasoning.push('Price structure confirms uptrend');
    }

    // Rule 4: Institutional Flow Detection
    const rule4 = this.analyzeInstitutionalFlow(dailyData, indicators);
    rules.institutionalFlow = rule4;
    weightedScore += rule4.score * this.RULE_WEIGHTS.institutionalFlow;
    if (rule4.passed) {
      passedRules++;
      reasoning.push('Institutional accumulation detected');
    }

    // Rule 5: Risk-Adjusted Momentum Score
    const rule5 = this.analyzeRiskAdjustedMomentum(dailyData, indicators, currentPrice);
    rules.riskAdjustedScore = rule5;
    weightedScore += rule5.score * this.RULE_WEIGHTS.riskAdjustedScore;
    if (rule5.passed) {
      passedRules++;
      reasoning.push('Risk-adjusted momentum favorable');
    }

    // Rule 6: Cascade Trigger Confirmation
    const rule6 = this.analyzeCascadeTrigger(dailyData, weeklyData, indicators);
    rules.cascadeTrigger = rule6;
    weightedScore += rule6.score * this.RULE_WEIGHTS.cascadeTrigger;
    if (rule6.passed) {
      passedRules++;
      reasoning.push('Multi-timeframe cascade triggered');
    }

    // Calculate momentum cascade metrics
    const momentumCascade = this.calculateMomentumCascade(rules, weightedScore);
    
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
  analyzeWeeklyMomentum(weeklyData, indicators) {
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
    const rocPositive = weeklyROC > 5; // 5% positive momentum
    
    // Weekly price momentum
    const priceChange4Week = (latest.close - weeklyData[weeklyData.length - 5].close) / weeklyData[weeklyData.length - 5].close;
    const strongWeeklyMomentum = priceChange4Week > 0.12; // ULTRA-SELECTIVE: 12% in 4 weeks (was 4%)
    
    const confirmations = [macdBullish, rocPositive, strongWeeklyMomentum].filter(Boolean).length;
    const passed = confirmations >= 2;
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
  analyzeDailyAcceleration(dailyData, indicators, currentPrice) {
    const rsi14 = indicators.base?.rsi14 || 50;
    const macd = indicators.base?.macd || 0;
    const latest = dailyData[dailyData.length - 1];
    
    // RSI momentum (>60 shows strong momentum)
    const rsiMomentum = rsi14 > 60;
    
    // MACD rising (acceleration)
    const macdRising = macd > (indicators.base?.macdSignal || 0);
    
    // Volume expansion (recent vs average)
    const avgVolume = this.calculateAverageVolume(dailyData.slice(-20));
    const recentVolume = this.calculateAverageVolume(dailyData.slice(-3));
    const volumeExpansion = recentVolume > avgVolume * 1.3;
    
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
      details: `Daily acceleration: RSI ${rsi14.toFixed(1)} ${rsiMomentum ? '>60' : '≤60'}, MACD ${macdRising ? 'rising' : 'falling'}, Volume ${volumeExpansion ? 'expanding' : 'normal'}, Price ${accelerating ? 'accelerating' : 'steady'}`
    };
  }

  /**
   * Rule 3: Analyze Price Structure Validation
   */
  analyzePriceStructure(dailyData, currentPrice) {
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
    
    // Breakout confirmation (above 20-day high)
    const high20Day = Math.max(...highs20Day);
    const breakoutConfirmed = currentPrice > high20Day * 0.995; // Within 0.5% of breakout
    
    // Trend consistency (EMA alignment simulation)
    const closes = dailyData.slice(-20).map(d => d.close);
    const ema10 = this.calculateEMA(closes, 10);
    const ema20 = this.calculateEMA(closes, 20);
    const trendAlignment = ema10 > ema20 && currentPrice > ema10;
    
    const confirmations = [higherHighs, higherLows, breakoutConfirmed, trendAlignment].filter(Boolean).length;
    const passed = confirmations >= 3;
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
  analyzeInstitutionalFlow(dailyData, indicators) {
    // Volume profile analysis (accumulation vs distribution)
    const recentData = dailyData.slice(-10);
    let accumulation = 0;
    let distribution = 0;
    
    recentData.forEach(day => {
      const bodySize = Math.abs(day.close - day.open);
      const range = day.high - day.low;
      const bodyRatio = range > 0 ? bodySize / range : 0;
      
      if (day.close > day.open && bodyRatio > 0.6) {
        accumulation += day.volume;
      } else if (day.close < day.open && bodyRatio > 0.6) {
        distribution += day.volume;
      }
    });
    
    const accumulationRatio = (accumulation + distribution) > 0 ? accumulation / (accumulation + distribution) : 0.5;
    const institutionalAccumulation = accumulationRatio > 0.75; // ULTRA-SELECTIVE: 0.75 (was 0.55)
    
    // Large volume days (institutional interest)
    const avgVolume = this.calculateAverageVolume(dailyData.slice(-50));
    const largeVolumeDays = recentData.filter(d => d.volume > avgVolume * 1.5).length;
    const institutionalInterest = largeVolumeDays >= 3;
    
    // OBV trend (On Balance Volume simulation)
    const obvTrend = this.calculateOBVTrend(dailyData.slice(-20));
    const obvPositive = obvTrend > 0;
    
    // Price-volume relationship
    const priceVolumeCorrelation = this.calculatePriceVolumeCorrelation(recentData);
    const positiveCorrelation = priceVolumeCorrelation > 0.5; // ULTRA-SELECTIVE: 0.5 (was 0.2)
    
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
  analyzeRiskAdjustedMomentum(dailyData, indicators, currentPrice) {
    // Calculate returns and volatility
    const returns = this.calculateReturns(dailyData.slice(-20));
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const volatility = this.calculateStandardDeviation(returns);
    
    // Sharpe-like ratio for momentum quality
    const momentumQuality = volatility > 0 ? avgReturn / volatility : 0;
    const highQualityMomentum = momentumQuality > 0.15;
    
    // Momentum consistency (winning days ratio)
    const winningDays = returns.filter(r => r > 0).length;
    const winRatio = winningDays / returns.length;
    const consistentMomentum = winRatio > 0.75; // ULTRA-SELECTIVE: 0.75 (was 0.5)
    
    // Drawdown analysis (maximum adverse movement)
    const maxDrawdown = this.calculateMaxDrawdown(dailyData.slice(-20));
    const lowDrawdown = maxDrawdown < 0.08; // Less than 8% drawdown
    
    // Momentum persistence (trend strength)
    const trendStrength = this.calculateTrendStrength(dailyData.slice(-20));
    const strongTrend = trendStrength > 0.5; // RELAXED from 0.7 to 0.5
    
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
  analyzeCascadeTrigger(dailyData, weeklyData, indicators) {
    // Multi-timeframe alignment
    const dailyTrend = this.getTrendDirection(dailyData.slice(-10));
    const weeklyTrend = weeklyData.length > 0 ? this.getTrendDirection(weeklyData.slice(-4)) : dailyTrend;
    const trendAlignment = dailyTrend === 'UP' && weeklyTrend === 'UP';
    
    // Momentum synchronization across timeframes
    const dailyMomentum = this.calculatePriceMomentum(dailyData, 5);
    const weeklyMomentumDaily = weeklyData.length > 0 ? this.calculatePriceMomentum(weeklyData, 2) * 0.2 : dailyMomentum; // Scale weekly to daily
    const momentumSync = dailyMomentum > 0 && weeklyMomentumDaily > 0 && Math.abs(dailyMomentum - weeklyMomentumDaily) < 0.05;
    
    // Volume cascade (daily volume confirming weekly trend)
    const dailyVolumeTrend = this.getVolumeTrend(dailyData.slice(-5));
    const weeklyVolumeTrend = weeklyData.length > 0 ? this.getVolumeTrend(weeklyData.slice(-3)) : dailyVolumeTrend;
    const volumeCascade = dailyVolumeTrend === 'INCREASING' && weeklyVolumeTrend === 'INCREASING';
    
    // Cascade trigger timing (recent acceleration)
    const recentAcceleration = this.detectRecentAcceleration(dailyData.slice(-5));
    
    const confirmations = [trendAlignment, momentumSync, volumeCascade, recentAcceleration].filter(Boolean).length;
    const passed = confirmations >= 3;
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
  calculateMomentumCascade(rules, weightedScore) {
    const cascadeScore = weightedScore;
    
    let grade = 'F';
    let intensity = 'WEAK';
    
    // ULTRA-SELECTIVE grading - Only exceptional momentum gets high grades
    if (cascadeScore >= 0.80) {
      grade = 'A+';
      intensity = 'EXCEPTIONAL';
    } else if (cascadeScore >= 0.70) {
      grade = 'A';
      intensity = 'STRONG';
    } else if (cascadeScore >= 0.60) {
      grade = 'B';
      intensity = 'MODERATE';
    } else if (cascadeScore >= 0.50) {
      grade = 'C';
      intensity = 'BUILDING';
    } else if (cascadeScore >= 0.40) {
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
   * 🤖 AI-ENHANCED: Make final trading decision with AI momentum validation
   */
  makeFinalDecisionWithAI(cascadeAnalysis, riskAssessment, dailyData, options, aiSignals = null) {
    // Get the base Cascade decision first
    const baseDecision = this.makeFinalDecision(cascadeAnalysis, riskAssessment, dailyData, options);
    
    // If no AI signals, return base decision
    if (!aiSignals) {
      return {
        ...baseDecision,
        aiEnhanced: false,
        aiReasoning: 'No AI signals provided'
      };
    }

    // Apply AI enhancements to Cascade's momentum requirements
    return this.applyCascadeAIEnhancement(baseDecision, cascadeAnalysis, aiSignals);
  }

  /**
   * 🤖 CASCADE AI ENHANCEMENT: Boost momentum cascade with AI confirmation
   */
  applyCascadeAIEnhancement(baseDecision, cascadeAnalysis, aiSignals) {
    const { momentum, conviction, bias } = aiSignals;
    let enhancedAction = baseDecision.action;
    let enhancedConfidence = baseDecision.confidence;
    let aiReasoningParts = [];
    let aiEnhanced = false;

    // ENHANCEMENT 1: Strong Cascade + Perfect AI = STRONG_BUY
    if (cascadeAnalysis.momentumCascade.grade === 'A+' && 
        momentum === 'BULLISH' && conviction === 'HIGH' && bias === 'BULLISH') {
      if (baseDecision.action === 'BUY') {
        enhancedAction = 'STRONG_BUY';
        enhancedConfidence = Math.min(0.98, enhancedConfidence + 0.15);
        aiReasoningParts.push('AI confirms explosive momentum cascade with maximum conviction');
        aiEnhanced = true;
      } else if (baseDecision.action === 'WATCH') {
        enhancedAction = 'BUY';
        enhancedConfidence = Math.min(0.90, enhancedConfidence + 0.20);
        aiReasoningParts.push('AI upgrades strong cascade from WATCH to BUY with high conviction');
        aiEnhanced = true;
      }
    }

    // ENHANCEMENT 2: Good Cascade + Strong AI = BUY
    else if ((cascadeAnalysis.momentumCascade.grade === 'A' || cascadeAnalysis.momentumCascade.grade === 'B') &&
             baseDecision.action === 'WATCH' &&
             momentum === 'BULLISH' && conviction === 'HIGH') {
      enhancedAction = 'BUY';
      enhancedConfidence = Math.min(0.85, enhancedConfidence + 0.12);
      aiReasoningParts.push('AI confirms solid momentum cascade with high conviction');
      aiEnhanced = true;
    }

    // ENHANCEMENT 3: Moderate Cascade + Perfect AI Alignment = BUY
    else if (cascadeAnalysis.passedRules >= 4 && 
             baseDecision.action === 'WATCH' &&
             momentum === 'BULLISH' && conviction === 'HIGH' && bias === 'BULLISH') {
      enhancedAction = 'BUY';
      enhancedConfidence = Math.min(0.80, enhancedConfidence + 0.10);
      aiReasoningParts.push('AI validates moderate cascade with perfect momentum alignment');
      aiEnhanced = true;
    }

    // ENHANCEMENT 4: Confidence adjustments based on AI momentum quality
    if (!aiEnhanced) {
      if (momentum === 'BULLISH' && conviction === 'HIGH') {
        enhancedConfidence = Math.min(0.95, enhancedConfidence + 0.08);
        aiReasoningParts.push('AI high conviction bullish momentum reinforces cascade analysis');
      } else if (momentum === 'BEARISH' && conviction === 'HIGH') {
        enhancedConfidence = Math.max(0.15, enhancedConfidence - 0.12);
        aiReasoningParts.push('AI high conviction bearish momentum conflicts with cascade');
      }
    }

    return {
      action: enhancedAction,
      confidence: enhancedConfidence,
      reasoning: baseDecision.reasoning,
      factors: baseDecision.factors,
      aiEnhanced: aiEnhanced,
      aiReasoning: aiReasoningParts.join('; ') || 'No significant AI adjustments',
      originalCascadeAction: baseDecision.action,
      aiSignals: aiSignals
    };
  }

  /**
   * Make final trading decision based on Cascade analysis
   */
  makeFinalDecision(cascadeAnalysis, riskAssessment, dailyData, options) {
    const { momentumCascade, overallScore, passedRules, reasoning } = cascadeAnalysis;
    const { riskReward } = riskAssessment;

    let action = 'AVOID';
    let confidence = cascadeAnalysis.confidence;
    let decisionReasoning = reasoning.join('; ');

    // ULTRA-SELECTIVE Decision logic - A+ and A get BUY
    if (momentumCascade.grade === 'A+') {
      action = 'BUY';
      confidence = Math.min(0.95, confidence + 0.10);
      decisionReasoning = `Exceptional momentum cascade (${momentumCascade.grade}): ${decisionReasoning}`;
    } else if (momentumCascade.grade === 'A') {
      action = 'BUY';
      confidence = Math.min(0.85, confidence + 0.05);
      decisionReasoning = `Excellent momentum cascade (${momentumCascade.grade}): ${decisionReasoning}`;
    } else if (momentumCascade.grade === 'B') {
      action = 'WATCH';
      confidence = Math.max(0.60, confidence);
      decisionReasoning = `Moderate momentum cascade (${momentumCascade.grade}), monitor for improvement: ${decisionReasoning}`;
    } else if (momentumCascade.grade === 'C') {
      action = 'AVOID';
      confidence = Math.max(0.45, confidence);
      decisionReasoning = `Building momentum cascade (${momentumCascade.grade}), insufficient for ultra-selective criteria: ${decisionReasoning}`;
      confidence = Math.max(0.50, confidence);
      decisionReasoning = `Weak momentum cascade but high risk/reward: ${decisionReasoning}`;
    } else if (momentumCascade.grade === 'C' || (momentumCascade.grade === 'D' && passedRules >= 1)) {
      action = 'WATCH';
      confidence = Math.max(0.45, confidence);
      decisionReasoning = `Minimal momentum cascade (${momentumCascade.grade}), watchlist: ${decisionReasoning}`;
    } else {
      action = 'AVOID';
      confidence = Math.max(0.20, confidence * 0.8);
      decisionReasoning = `Momentum cascade criteria insufficient (${passedRules}/6 rules, ${momentumCascade.grade} grade): ${decisionReasoning}`;
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
  assessRisk(cascadeAnalysis, dailyData, currentPrice) {
    const atr = this.calculateATR(dailyData.slice(-14));
    const volatility = this.calculateVolatility(dailyData.slice(-20));
    
    // Momentum-based stop loss (tighter for high-quality setups)
    let stopMultiplier = 2.5; // Base ATR multiplier
    if (cascadeAnalysis.momentumCascade.grade === 'A+') {
      stopMultiplier = 2.0; // Tighter stop for explosive setups
    } else if (cascadeAnalysis.momentumCascade.grade === 'A') {
      stopMultiplier = 2.2;
    }
    
    const atrStop = currentPrice - (atr * stopMultiplier);
    const percentStop = currentPrice * 0.92; // 8% maximum stop
    const stopLoss = Math.max(atrStop, percentStop);
    
    // Volatility-adjusted stop for high-momentum stocks
    const volatilityAdjustedStop = currentPrice - (currentPrice * volatility * 2.0);
    const finalStopLoss = Math.max(stopLoss, volatilityAdjustedStop);
    
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
      cascadeTriggers: this.calculateCascadeTriggers(cascadeAnalysis, currentPrice, latest, atr, momentum),
      
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
   * Calculate Cascade confidence-based position sizing with enhanced granular tiers
   */
  calculateCascadePositionSizing(confidence, capitalInfo, riskAssessment, cascadeAnalysis) {
    const { capital = 100000, entryPrice = 100 } = capitalInfo;
    const { stopLoss = 0, riskReward = 1 } = riskAssessment;
    
    let recommendation = 'AVOID';
    let riskPercent = 0;
    let maxPosition = 0;
    
    // Enhanced Cascade position sizing with granular tiers and realistic risk management
    
    // EXPLOSIVE TIER - Perfect momentum cascades only
    if (cascadeAnalysis.momentumCascade.grade === 'A+' && cascadeAnalysis.passedRules >= 6 && confidence >= 0.95) {
      recommendation = 'FULL';
      riskPercent = 2.0;  // Max 2% risk (was 3% - too aggressive)
      maxPosition = 20;   // 20% max position (was 30% - too concentrated)
    } else if (cascadeAnalysis.momentumCascade.grade === 'A+' && cascadeAnalysis.passedRules >= 5) {
      recommendation = 'STRONG';
      riskPercent = 1.8;
      maxPosition = 18;
    } else if (cascadeAnalysis.momentumCascade.grade === 'A' && cascadeAnalysis.passedRules >= 5) {
      recommendation = 'STRONG';
      riskPercent = 1.6;
      maxPosition = 16;
    }
    
    // HIGH MOMENTUM TIER
    else if (cascadeAnalysis.momentumCascade.grade === 'A' && cascadeAnalysis.passedRules >= 4) {
      recommendation = 'LARGE';
      riskPercent = 1.4;
      maxPosition = 14;
    } else if (cascadeAnalysis.momentumCascade.grade === 'A+' && cascadeAnalysis.passedRules >= 4) {
      recommendation = 'LARGE';
      riskPercent = 1.3;
      maxPosition = 13;
    } else if (cascadeAnalysis.momentumCascade.grade === 'B' && cascadeAnalysis.passedRules >= 5) {
      recommendation = 'LARGE';
      riskPercent = 1.2;
      maxPosition = 12;
    }
    
    // MODERATE MOMENTUM TIER
    else if (cascadeAnalysis.momentumCascade.grade === 'A' && cascadeAnalysis.passedRules >= 3) {
      recommendation = 'REDUCED';
      riskPercent = 1.1;
      maxPosition = 11;
    } else if (cascadeAnalysis.momentumCascade.grade === 'B' && cascadeAnalysis.passedRules >= 4) {
      recommendation = 'REDUCED';
      riskPercent = 1.0;
      maxPosition = 10;
    } else if (cascadeAnalysis.momentumCascade.grade === 'C' && cascadeAnalysis.passedRules >= 5) {
      recommendation = 'REDUCED';
      riskPercent = 0.9;
      maxPosition = 9;
    }
    
    // BUILDING MOMENTUM TIER
    else if (cascadeAnalysis.momentumCascade.grade === 'B' && cascadeAnalysis.passedRules >= 3) {
      recommendation = 'HALF';
      riskPercent = 0.8;
      maxPosition = 8;
    } else if (cascadeAnalysis.momentumCascade.grade === 'A' && cascadeAnalysis.passedRules >= 2) {
      recommendation = 'HALF';
      riskPercent = 0.8;  // Low rule count A grade
      maxPosition = 8;
    } else if (cascadeAnalysis.momentumCascade.grade === 'C' && cascadeAnalysis.passedRules >= 4) {
      recommendation = 'HALF';
      riskPercent = 0.7;
      maxPosition = 7;
    }
    
    // EARLY MOMENTUM TIER
    else if (cascadeAnalysis.momentumCascade.grade === 'B' && cascadeAnalysis.passedRules >= 2) {
      recommendation = 'QUARTER';
      riskPercent = 0.6;
      maxPosition = 6;
    } else if (cascadeAnalysis.momentumCascade.grade === 'C' && cascadeAnalysis.passedRules >= 3) {
      recommendation = 'QUARTER';
      riskPercent = 0.6;
      maxPosition = 6;
    } else if (cascadeAnalysis.momentumCascade.grade === 'A' && cascadeAnalysis.passedRules >= 1) {
      recommendation = 'QUARTER';
      riskPercent = 0.5;  // Very low rule count but A grade
      maxPosition = 5;
    }
    
    // MINIMAL MOMENTUM TIER - Testing waters
    else if (cascadeAnalysis.momentumCascade.grade === 'C' && cascadeAnalysis.passedRules >= 2) {
      recommendation = 'MICRO';
      riskPercent = 0.4;
      maxPosition = 4;
    } else if (cascadeAnalysis.momentumCascade.grade === 'B' && cascadeAnalysis.passedRules >= 1) {
      recommendation = 'MICRO';
      riskPercent = 0.4;
      maxPosition = 4;
    } else if (cascadeAnalysis.momentumCascade.grade === 'D' && cascadeAnalysis.passedRules >= 3) {
      recommendation = 'MICRO';
      riskPercent = 0.3;  // Ultra-conservative for uncertain momentum
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
        console.log(`  ⚠️ CASCADE: Invalid risk per share: ${riskPerShare.toFixed(4)} (entry: ${entryPrice}, stop: ${stopLoss})`);
      }
    } else {
      console.log(`  ⚠️ CASCADE: Position sizing skipped - recommendation: ${recommendation}, entryPrice: ${entryPrice}, stopLoss: ${stopLoss}, capital: ${capital}`);
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
    const gradeScores = { 'A+': 40, 'A': 35, 'B': 25, 'C': 15, 'F': 0 };
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
    const closes = data.map(d => d.close);
    const fastEMA = this.calculateEMA(closes, fastPeriod);
    const slowEMA = this.calculateEMA(closes, slowPeriod);
    const macd = fastEMA - slowEMA;
    const signal = this.calculateEMA([macd], signalPeriod);
    return { macd, signal };
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
    
    return {
      priceAcceleration: {
        threshold: momentum5 > momentum10 * 1.2,
        current: momentum5 / momentum10,
        target: 1.2
      },
      volumeAcceleration: {
        threshold: latest.volume * 1.5,
        current: latest.volume,
        met: false
      },
      breakoutAcceleration: {
        threshold: latest.close + atr * 0.5,
        current: latest.close,
        met: false
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

  calculateCascadeTriggers(cascadeAnalysis, currentPrice, latest, atr, momentum) {
    const triggers = [];
    
    // Volume cascade trigger
    const avgVol = this.calculateAverageVolume([latest]); // Simplified
    triggers.push({
      type: 'VOLUME_CASCADE',
      threshold: avgVol * 2.0,
      current: latest.volume,
      met: latest.volume > avgVol * 2.0
    });
    
    // Momentum acceleration trigger
    triggers.push({
      type: 'MOMENTUM_ACCELERATION',
      threshold: 0.015, // 1.5% momentum
      current: momentum,
      met: momentum > 0.015
    });
    
    // Price breakout trigger
    const breakoutLevel = currentPrice + atr * 0.5;
    triggers.push({
      type: 'PRICE_BREAKOUT',
      threshold: breakoutLevel,
      current: currentPrice,
      met: false // To be triggered
    });
    
    // Cascade grade trigger
    triggers.push({
      type: 'CASCADE_GRADE',
      threshold: 'A',
      current: cascadeAnalysis.momentumCascade.grade,
      met: ['A+', 'A'].includes(cascadeAnalysis.momentumCascade.grade)
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
      momentum: staticTargets[0] * momentumFactor * cascadeBonus,
      acceleration: staticTargets[1] * momentumFactor * cascadeBonus,
      cascade: staticTargets[2] * momentumFactor * cascadeBonus,
      explosive: staticTargets[2] * momentumFactor * cascadeBonus * 1.5,
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
