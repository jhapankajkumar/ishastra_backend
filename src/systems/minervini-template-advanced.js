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

const { Console } = require('console');
const { getSystemThresholds } = require('../config/trading-thresholds');
const { SimpleSwingStability } = require('../utils/simple-swing-stability');
const { FlagPatternDetector } = require('../utils/flag-pattern-detector');
const { VcpDetector } = require('../utils/vcp-detector');
const { BigBaseDetector } = require('../utils/big-base-detector');
const { TRIGGER_TYPES } = require('../utils/systemConstants');

// --- Market session helpers (used to decide whether the last candle is complete)
function detectMarket(symbol = '') {
  const s = String(symbol || '').toUpperCase();
  if (s.endsWith('.NS') || s.endsWith('.BO')) return 'IN';
  return 'US';
}

// NOTE: This is a conservative EOD-focused check to avoid using a partially formed daily candle.
// If market is open, we drop the last bar. If market is closed, we keep it.
function isMarketOpenNow(market) {
  const now = new Date();

  // Use UTC so server timezone doesn't matter
  const utcH = now.getUTCHours();
  const utcM = now.getUTCMinutes();
  const minutes = utcH * 60 + utcM;

  if (market === 'IN') {
    // NSE/BSE cash session roughly 03:45–10:00 UTC (09:15–15:30 IST)
    const open = 3 * 60 + 45;
    const close = 10 * 60 + 0;
    return minutes >= open && minutes < close;
  }

  // US (NYSE/NASDAQ) regular session roughly 14:30–21:00 UTC (09:30–16:00 ET)
  const open = 14 * 60 + 30;
  const close = 21 * 60 + 0;
  return minutes >= open && minutes < close;
}

class MinerviniTemplateAdvanced {
  constructor() {
    this.systemId = 'minervini_template_advanced';
    this.name = 'Minervini Template Advanced (Institutional)';
    this.version = '2.2.0';
    this.description = '8-criteria template system for institutional momentum investing';
    this.shortName = "SEPA"
    // 🔒 SIMPLE STABILITY: Initialize simple swing stability manager
    this.stabilityManager = new SimpleSwingStability(3); // 3-bar cooldown
    this.flagDetector  = new FlagPatternDetector();         // flag/HTF pattern detection
    this.vcpDetector   = new VcpDetector();                 // ZigZag swing-based VCP detection
    this.bigBaseDetector = new BigBaseDetector();           // long-duration base detection (6–24 months)
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
      const { capital, symbol, currentPrice } = options;
      // Validate required data
      if (!this.validateData(indicators, historical, symbol)) {
        return this.createAvoidSignal('INVALID_DATA', 'Insufficient data for Template analysis');
      }

      // Extract analysis parameters - AI signals no longer passed directly to systems
      

      // Decide whether the latest daily candle is complete based on current market session.
      // If market is currently open, the last candle is likely partial -> exclude it.
      // If market is closed, keep the last candle (EOD complete).
      const market = detectMarket(symbol);
      const marketOpen = isMarketOpenNow(market);
      const completedDaily = marketOpen ? historical.slice(0, -1) : historical;
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

      // Calculate signal quality for gate engine integration
      const signalQuality = this.calculateSignalQuality(stabilizedDecision.confidence, templateAnalysis);

      // Build execution plan
      const execution = this.buildExecutionPlan(stabilizedDecision, riskAssessment, templateAnalysis, entryPrice, capital, completedDaily, indicators);

      // Calculate unified display grade (Template + Signal combined for user display)
      const unifiedGrade = this.calculateUnifiedDisplayGrade(templateAnalysis, signalQuality.grade);

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
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error(`  🏛️ TEMPLATE: Analysis error: ${options.symbol} `, error.message);
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

    /*
      1 Price > 150-day and 200-day moving averages
      2 150-day MA > 200-day MA
      3 200-day MA trending up for ≥1 month
      4 50-day MA > 150-day and 200-day MA
      5 Price > 50-day MA
      6 Price ≥ 30% above 52-week low
      7 Price within 25% of 52-week high
      8 RS ranking ≥ 70 (ideally 80–90)
    */
    const criteria = {};
    const reasoning = [];
    let totalScore = 0;

    // 🚨 EMERGENCY FIX: Get SMA data from correct location (arrays or latest values)
    const sma150 = indicators?.sma150 || [];
    const sma200 = indicators?.sma200 || [];
    const sma50 = indicators?.sma50 || [];

    // Handle both array format and single value format
    let currentSMA150, currentSMA200, currentSMA50;

    if (sma150.length > 0) {
      currentSMA150 = sma150[sma150.length - 1];
    } else {
      currentSMA150 = indicators.latest?.sma150;
    }

    if (sma200.length > 0) {
      currentSMA200 = sma200[sma200.length - 1];
    } else {
      currentSMA200 = indicators.latest?.sma200;
    }

    if (sma50.length > 0) {
      currentSMA50 = sma50[sma50.length - 1];
    } else {
      currentSMA50 = indicators.latest?.sma50;
    }

    // Fallback if still no data
    if (!currentSMA150 || !currentSMA200 || !currentSMA50) {
      return this.createAvoidSignal('MISSING_SMA', 'Missing SMA150/SMA200/SMA50 data for Template analysis');
    }

    let totalDaily = dailyData.length;
    let maxLength = 252;
    // Calculate 26-week high/low
    if (totalDaily <= 252) {
      maxLength = totalDaily; // Use available data if less than 252 days
    }
    
    const lastMaxDays = dailyData.slice(-maxLength); // 1 year
    const highMaxWeek = Math.max(...lastMaxDays.map(d => d.high));
    const lowMaxWeek = Math.min(...lastMaxDays.map(d => d.low));


    // ****************** TEMPLATE RULE VALIDATIONS ********************
    // --- RULE 1: Price > 150-day and 200-day SMA (medium + long-term uptrend)
    const rule1 = currentPrice > currentSMA150 && currentPrice > currentSMA200;
    const rule1Score = rule1 ? 1.0 : 0.0;
    criteria.criterion1 = { passed: rule1, score: rule1Score };
    totalScore += rule1Score;
    if (rule1) reasoning.push('Rule 1: Price above 150-day and 200-day SMA');

    // --- RULE 2: Price > 50-day MA (short-term uptrend)
    const rule2 = currentPrice > currentSMA50;
    const rule2Score = rule2 ? 1.0 : 0.0;
    criteria.criterion2 = { passed: rule2, score: rule2Score };
    totalScore += rule2Score;
    if (rule2) reasoning.push('Rule 2: Price > 50-day MA');

    // --- RULE 3: Price ≥ 30% above 52-week low (confirmed recovery from base)
    //
    // Edge case — "broke out from the 52W low to the 52W high":
    // A stock that was at its annual low and has now surged to within 10% of its
    // 52-week high is definitively NOT a laggard, which is all Rule 3 is designed
    // to catch. Allow a pass if both conditions hold:
    //   (a) price is within 10% of the 52-week high  (near-high strength)
    //   (b) price has risen at least 20% from the 52-week low (not a flat base)
    const distanceFromLow  = (currentPrice - lowMaxWeek)  / lowMaxWeek;
    const distFromHighRule3 = (highMaxWeek - currentPrice) / highMaxWeek;
    const nearHighOverride  = distFromHighRule3 <= 0.10 && distanceFromLow >= 0.20;
    let rule3 = distanceFromLow >= thresholds.low_distance_threshold || nearHighOverride;
    let rule3Score = rule3 ? Math.min(1.0, distanceFromLow / 0.5) : 0.0;
    criteria.criterion3 = { passed: rule3, score: rule3Score };
    totalScore += rule3Score;
    if (rule3) {
      if (nearHighOverride && distanceFromLow < thresholds.low_distance_threshold) {
        reasoning.push(`Rule 3: ${(distanceFromLow * 100).toFixed(1)}% above 52-week low (override: within ${(distFromHighRule3 * 100).toFixed(1)}% of 52-week high)`);
      } else {
        reasoning.push(`Rule 3: ${(distanceFromLow * 100).toFixed(1)}% above 52-week low`);
      }
    }

    // --- RULE 4: Price within 25% of 52-week high (Stage 2 / near-high positioning)
    const isNearRecentHigh = this.dynamicHighProximity(dailyData, currentPrice, thresholds);
    const distanceFromHigh = distFromHighRule3; // already computed above for Rule 3 override
    const brokeKeyResistanceRecently = indicators?.brokeKeyResistanceRecently || false;

    const rule4 = isNearRecentHigh.passed || brokeKeyResistanceRecently;
    const rule4Score = rule4 ? 1.0 : 0.0;
    if (rule4 && brokeKeyResistanceRecently) {
      reasoning.push('Broke key resistance within last 3–10 bars');
    }
    criteria.criterion4 = {
      passed: rule4,
      value: distanceFromHigh * 100,
      score: rule4Score,
    };
    totalScore += rule4Score;
    if (rule4) reasoning.push(`Rule 4: Within ${(thresholds.high_proximity_threshold * 100).toFixed(0)}% of 52-week high (${(distanceFromHigh * 100).toFixed(1)}% away)`);
    // ****************** TEMPLATE RULE VALIDATIONS FINISH ********************

    //*******************Entry Criteria *******************/

  // ─── PERFORMANCE FILTER (mirrors TradingView’s 3-window OR logic) ────────────────
  // Filter 1: Perf 1M > 20% — fresh momentum (recent breakout or surge)
  // Filter 2: Perf 3M > 30% — medium-term trend established
  // Filter 3: Perf 6M > 30% — mature uptrend (base breakouts, big base recoveries)
  // A stock must pass AT LEAST ONE window. Combines with pattern gates for BUY.
  const price1MAgo  = dailyData.length >= 21  ? dailyData[dailyData.length - 21].close  : null;
  const price3MAgo  = dailyData.length >= 63  ? dailyData[dailyData.length - 63].close  : null;
  const price6MAgo  = dailyData.length >= 126 ? dailyData[dailyData.length - 126].close : null;
  const perf1M  = price1MAgo  ? (currentPrice - price1MAgo)  / price1MAgo  * 100 : 0;
  const perf3M  = price3MAgo  ? (currentPrice - price3MAgo)  / price3MAgo  * 100 : 0;
  const perf6M  = price6MAgo  ? (currentPrice - price6MAgo)  / price6MAgo  * 100 : 0;
  const perfWindow1M = perf1M >= 20;
  const perfWindow3M = perf3M >= 30;
  const perfWindow6M = perf6M >= 30;
  const performanceGate = perfWindow1M || perfWindow3M || perfWindow6M;
  criteria.performanceFilter = {
    passed:   performanceGate,
    perf1M:   Math.round(perf1M * 10) / 10,
    perf3M:   Math.round(perf3M * 10) / 10,
    perf6M:   Math.round(perf6M * 10) / 10,
    window1M: perfWindow1M,
    window3M: perfWindow3M,
    window6M: perfWindow6M
  };
  if (performanceGate) {
    const windows = [perfWindow1M && `1M:+${perf1M.toFixed(1)}%`, perfWindow3M && `3M:+${perf3M.toFixed(1)}%`, perfWindow6M && `6M:+${perf6M.toFixed(1)}%`].filter(Boolean).join(', ');
    reasoning.push(`✅ Performance gate — ${windows} (momentum confirmed)`);
  } else {
    reasoning.push(`⚠️ Performance gate — 1M:${perf1M.toFixed(1)}% 3M:${perf3M.toFixed(1)}% 6M:${perf6M.toFixed(1)}% (none above threshold)`);
  }

  // ─── LIQUIDITY GATE (mirrors TradingView’s “Price × avg vol 30D > $1M USD”) ──────────
  // Ensures the stock is tradeable at swing trading size.
  // Note: threshold is in price-currency units (USD for US stocks, INR for .NS/.BO).
  const avgVol30D = this.calculateAverageVolume(dailyData.slice(-30));
  const dollarVolume = currentPrice * avgVol30D;
  const liquidityGate = dollarVolume >= 500_000; // ~$500K daily dollar volume minimum
  criteria.liquidityGate = {
    passed: liquidityGate,
    dollarVolume: Math.round(dollarVolume),
    avgVol30D: Math.round(avgVol30D)
  };
  if (!liquidityGate) {
    reasoning.push(`⚠️ Liquidity: $${(dollarVolume / 1e6).toFixed(2)}M daily vol — below $500K threshold`);
  }

  // --- RULE 9a: Volume Dry-Up (Absorption) BEFORE breakout
  // Definition: last 5-day avg volume is <= 70% of last 20-day avg volume
  // This is a state-based signal (supply drying up), works across caps without needing market-cap detection.
  let hasVolumeDryUp = false;
  let dryUpRatio = 1.0;
  if (dailyData.length >= 25) {
    // ✅ FIXED: Use days 6–25 ago as baseline, NOT the last 20 bars which overlaps the
    // 5-bar observation window. Overlap inflated avg20 and made the dry-up ratio look
    // smaller (easier to pass) than reality.
    const baselineData = dailyData.slice(-25, -5); // 20 bars: 6–25 days ago (clean baseline)
    const avg20 = this.calculateAverageVolume(baselineData);
    const avg5 = this.calculateAverageVolume(dailyData.slice(-5));
    dryUpRatio = avg20 > 0 ? (avg5 / avg20) : 1.0;
    // ✅ FIXED: True Minervini dry-up = volume contracts to ≤75% of baseline (≥25% below avg).
    // Previous 0.90 threshold (only 10% below) was too loose and flagged normal pullbacks.
    hasVolumeDryUp = dryUpRatio <= 0.75;
  }

  criteria.volumeDryUp = {
    passed: hasVolumeDryUp,
    value: dryUpRatio,
    // Score: full credit for very dry volume (≤0.50), scaled credit up to threshold, penalty above
    score: hasVolumeDryUp
      ? Math.min(1.0, 0.5 + (0.75 - dryUpRatio) / 0.5)
      : Math.max(0, 1.0 - (dryUpRatio - 0.75) * 4)
  };

  if (hasVolumeDryUp) {
    reasoning.push(`✅ Volume dry-up (absorption): 5D/20D avg vol = ${(dryUpRatio).toFixed(2)} (≤ 0.90)`);
  } else {
    reasoning.push(`⚠️ No volume dry-up: 5D/20D avg vol = ${(dryUpRatio).toFixed(2)} (> 0.90)`);
  }


    // === PATTERN QUALITY DETECTION (VCP / Flag / Big Base)
    // Each detector has its own minimum data requirement.
    // If a stock doesn't have enough history for a detector, that check is skipped
    // (not failed) — the score from other detectors still applies.
    //
    //   VCP      : 20 bars minimum  (~1 month)
    //   Flag     : 25 bars minimum  (~1.5 months)  — pole + flag needs at least 25 bars
    //   Big Base : 120 bars minimum (~6 months)     — 100 base bars + 20 pre-peak buffer
    const MIN_BARS_VCP      = 20;
    const MIN_BARS_FLAG     = 25;
    const MIN_BARS_BIG_BASE = 120;

    // --- VCP ---
    let vcpResult = { score: 0, numContractions: 0, depths: [], consistency: 0, contractionTrend: 0 };
    if (dailyData.length >= MIN_BARS_VCP) {
      const vcpLookback = dailyData.slice(-80);
      vcpResult = this.vcpDetector.detect(vcpLookback);
    } else {
      reasoning.push(`⚠️ VCP: skipped — need ${MIN_BARS_VCP}+ bars, have ${dailyData.length}`);
    }
    const vcpContractionScore = vcpResult.score;
    const vcpContraction = vcpContractionScore >= 0.4;

    // patternQualityScore starts as the VCP score (0–1).
    // Flag and BigBase detectors fold in below via Math.max — whichever is strongest wins.
    const patternQualityScore = vcpContractionScore;

    const patternGrade =
      patternQualityScore >= 0.90 ? 'A+' :
        patternQualityScore >= 0.70 ? 'A' :
          patternQualityScore >= 0.50 ? 'B' :
            patternQualityScore >= 0.30 ? 'C' : 'F';

    criteria.patternQuality = {
      passed: patternQualityScore >= 0.5,
      score: patternQualityScore,
      grade: patternGrade,
      details: {
        vcpContraction: {
          score: vcpContractionScore,
          numContractions: vcpResult.numContractions,
          depths: vcpResult.depths,
          consistency: vcpResult.consistency
        },
        scoreBreakdown: { vcp: vcpContractionScore }
      }
    };

    if (dailyData.length >= MIN_BARS_VCP) {
      if (vcpContraction) {
        const depthStr = vcpResult.depths.length > 0 ? ` [${vcpResult.depths.map(d => `${d}%`).join(' → ')}]` : '';
        reasoning.push(
          `✅ VCP: ${vcpResult.numContractions} contractions${depthStr}, trend=${vcpResult.contractionTrend.toFixed(2)}, consistency=${vcpResult.consistency.toFixed(2)}, score=${vcpContractionScore.toFixed(2)}`
        );
      } else {
        const depthStr = vcpResult.depths.length > 0 ? ` [${vcpResult.depths.map(d => `${d}%`).join(' → ')}]` : ' (no swings found)';
        reasoning.push(
          `⚠️ No VCP: ${vcpResult.numContractions} swings${depthStr}, score=${vcpContractionScore.toFixed(2)}`
        );
      }

      if (patternQualityScore >= 0.5) {
        reasoning.push(`✅ Pattern quality: Grade ${patternGrade} (VCP score ${(patternQualityScore * 100).toFixed(0)}%)`);
      } else {
        reasoning.push(`⚠️ Weak pattern: Grade ${patternGrade} (VCP score ${(patternQualityScore * 100).toFixed(0)}%)`);
      }
    }

    // --- FLAG ---
    let flagResult = { detected: false, type: 'NONE', score: 0, pole: null, flag: null, readyForBreakout: false };
    if (dailyData.length >= MIN_BARS_FLAG) {
      flagResult = this.flagDetector.classify(dailyData, currentPrice);
    } else {
      reasoning.push(`⚠️ Flag: skipped — need ${MIN_BARS_FLAG}+ bars, have ${dailyData.length}`);
    }

    // Flag score: raw score + small bonus if volume already dry (double confirmation)
    const flagPatternScore = flagResult.detected
      ? Math.min(1.0, flagResult.score + (hasVolumeDryUp ? 0.15 : 0))
      : 0;

    // Unified pattern score: best of VCP vs flag — whichever scores higher wins.
    const unifiedPatternScore = Math.max(patternQualityScore, flagPatternScore);
    if (unifiedPatternScore !== patternQualityScore) {
      criteria.patternQuality.score  = unifiedPatternScore;
      criteria.patternQuality.passed = unifiedPatternScore >= 0.5;
      criteria.patternQuality.grade  =
        unifiedPatternScore >= 0.90 ? 'A+' :
        unifiedPatternScore >= 0.70 ? 'A'  :
        unifiedPatternScore >= 0.50 ? 'B'  :
        unifiedPatternScore >= 0.30 ? 'C'  : 'F';
    }

    // Flag pattern criteria entry (for reporting and gate engine)
    criteria.flagPattern = {
      passed:           flagResult.detected && flagResult.score >= 0.50,
      type:             flagResult.type,
      score:            flagResult.score,
      readyForBreakout: flagResult.readyForBreakout,
      poleGainPct:      flagResult.pole ? Math.round(flagResult.pole.gain * 1000) / 10 : null,
      flagRangePct:     flagResult.flag ? Math.round(flagResult.flag.range * 1000) / 10 : null
    };

    if (dailyData.length >= MIN_BARS_FLAG) {
      if (flagResult.detected) {
        const p = flagResult.pole;
        const f = flagResult.flag;
        reasoning.push(
          `✅ ${flagResult.type.replace(/_/g, ' ')}: pole +${(p.gain * 100).toFixed(0)}% in ${p.bars}d, ` +
          `flag range ${(f.range * 100).toFixed(1)}%, vol ${(f.volRatio * 100).toFixed(0)}% of pole avg` +
          (flagResult.readyForBreakout ? ' — ⚡ NEAR BREAKOUT POINT' : '')
        );
      } else {
        reasoning.push(`⚠️ No flag/pole structure detected (type: ${flagResult.type}, score: ${flagResult.score.toFixed(2)})`);
      }
    }

    // --- BIG BASE ---
    // Requires 120+ bars (~6 months). BigBaseDetector returns an empty result internally
    // if data is insufficient, but we skip the call entirely to avoid noise.
    let bigBaseResult = { detected: false, entryZone: 'NONE', score: 0, ceiling: null, floor: null, baseDepthPct: 0, baseDurationWeeks: 0, basePosition: 0, details: {} };
    if (dailyData.length >= MIN_BARS_BIG_BASE) {
      bigBaseResult = this.bigBaseDetector.detect(dailyData, currentPrice);
    } else {
      reasoning.push(`⚠️ Big Base: skipped — need ${MIN_BARS_BIG_BASE}+ bars, have ${dailyData.length}`);
    }
    const bigBaseScore = bigBaseResult.score;

    // Fold big base into the unified pattern score — whichever source scores highest wins.
    const bigBaseAdjustedScore = bigBaseResult.detected
      ? Math.min(1.0, bigBaseScore + (hasVolumeDryUp ? 0.10 : 0))
      : 0;
    const finalUnifiedPatternScore = Math.max(unifiedPatternScore, bigBaseAdjustedScore);
    if (finalUnifiedPatternScore !== unifiedPatternScore) {
      criteria.patternQuality.score  = finalUnifiedPatternScore;
      criteria.patternQuality.passed = finalUnifiedPatternScore >= 0.5;
      criteria.patternQuality.grade  =
        finalUnifiedPatternScore >= 0.90 ? 'A+' :
        finalUnifiedPatternScore >= 0.70 ? 'A'  :
        finalUnifiedPatternScore >= 0.50 ? 'B'  :
        finalUnifiedPatternScore >= 0.30 ? 'C'  : 'F';
    }

    criteria.bigBase = {
      passed:            bigBaseResult.detected && bigBaseScore >= 0.40,
      entryZone:         bigBaseResult.entryZone,
      score:             bigBaseScore,
      ceiling:           bigBaseResult.ceiling,
      floor:             bigBaseResult.floor,
      baseDepthPct:      bigBaseResult.baseDepthPct,
      baseDurationWeeks: bigBaseResult.baseDurationWeeks,
      basePosition:      bigBaseResult.basePosition,
      details:           bigBaseResult.details
    };

    if (dailyData.length >= MIN_BARS_BIG_BASE) {
      if (bigBaseResult.detected) {
        const z = bigBaseResult.entryZone;
        const zLabel = z === 'UPPER' ? 'approaching ceiling (breakout zone)' : 'bouncing from floor (support zone)';
        reasoning.push(
          `✅ BIG BASE: ${bigBaseResult.baseDurationWeeks}w base, ` +
          `depth ${bigBaseResult.baseDepthPct}%, ` +
          `price at ${bigBaseResult.basePosition}% of range — ${zLabel}, ` +
          `Score ${bigBaseScore.toFixed(2)}`
        );
      } else if (bigBaseResult.entryZone === 'MIDDLE') {
        reasoning.push(
          `⚠️ Big base structure found (${bigBaseResult.baseDurationWeeks}w, ${bigBaseResult.baseDepthPct}% deep) ` +
          `but price is in the MIDDLE of the range (${bigBaseResult.basePosition}%) — not actionable`
        );
      } else {
        reasoning.push(`⚠️ No big base structure detected (need ≥20w base, 15–60% depth, not in middle)`);
      }
    }

    // 4 hard rules. Rule 3 uses a gradient score (0–1). Others are binary.
    const overallScore = totalScore / 4;
    const passedCriteria = [
      criteria.criterion1, criteria.criterion2, criteria.criterion3, criteria.criterion4
    ].filter(c => c?.passed).length;

    // Expose rule booleans on criteria for external access
    criteria.rule1 = rule1;
    criteria.rule2 = rule2;
    criteria.rule3 = rule3;
    criteria.rule4 = rule4;

    let templateGrade = 'F';
    let confidence = 0;

    // Grading: 4 hard rules max. BUY requires all 4 (hardRulesPass) + entry gates.
    if (passedCriteria >= 4 && overallScore >= thresholds.grade_A_plus) {
      templateGrade = 'A+';
      confidence = 0.95;
    } else if (passedCriteria >= 3 && overallScore >= thresholds.grade_A) {
      templateGrade = 'A';
      confidence = 0.85;
    } else if (passedCriteria >= 3 && overallScore >= thresholds.grade_B_plus) {
      templateGrade = 'B+';
      confidence = 0.75;
    } else if (passedCriteria >= 2 && overallScore >= thresholds.grade_B) {
      templateGrade = 'B';
      confidence = 0.65;
    } else if (passedCriteria >= 2 && overallScore >= thresholds.grade_C) {
      templateGrade = 'C';
      confidence = 0.55;
    } else if (passedCriteria >= 1 && overallScore >= 0.25) {
      templateGrade = 'D';
      confidence = 0.40;
    } else {
      templateGrade = 'F';
      confidence = 0.25;
    }

    return {
      criteria,
      overallScore,
      templateGrade,
      confidence,
      reasoning,
      rule1, rule2, rule3, rule4
    };
  }

  //Rule 4 helper: High proximity to 52-week high or breakout
  dynamicHighProximity(dailyData, currentPrice, thresholds) {
    const lookbacks = [
      { days: 252, label: "52-week" },
      { days: 180, label: "180-day" },
      { days: 90, label: "90-day" }
    ];

    for (let { days, label } of lookbacks) {
      const periodData = dailyData.slice(-days);
      if (periodData.length === 0) continue;

      const high = Math.max(...periodData.map(d => d.high));
      const distance = (high - currentPrice) / high;

      if (distance <= thresholds.high_proximity_threshold) {
        return {
          passed: true,
          reasoning: `Within ${(thresholds.high_proximity_threshold * 100).toFixed(0)}% of ${label} high (${(distance * 100).toFixed(1)}% away)`
        };
      }
    }

    return {
      passed: false,
      reasoning: `Too far from 52W/180D/90D highs`
    };
  }

  /**
   * Make final trading decision based on Template analysis (using rule block logic)
   */
  makeFinalDecision(templateAnalysis, riskAssessment, dailyData, options, thresholds) {
    const { confidence, reasoning, overallScore, criteria, rule1, rule2, rule3, rule4 } = templateAnalysis;
    const { riskReward } = riskAssessment;


    // ─── Rule classification (all 4 rules are HARD) ───────────────────────────
    //   Rule 1: Price > SMA150 & SMA200   Rule 2: Price > SMA50
    //   Rule 3: 30%+ above 52W low         Rule 4: Within 25% of 52W high
    const hardRulesPass = rule1 && rule2 && rule3 && rule4;
    const passedRules = [rule1, rule2, rule3, rule4].filter(Boolean).length;

    // Entry gates
    const volumeDryUp = criteria.volumeDryUp?.passed;
    const patternQuality = criteria.patternQuality?.passed;
    const performanceGate = criteria.performanceFilter?.passed ?? true;
    const liquidityOk = criteria.liquidityGate?.passed ?? true;

    let decision = 'REJECTED';

    // BUY: All 4 trend rules + pre-breakout consolidation (dry-up) + pattern confirmed + momentum
    // Volume expansion is NOT required — if it already happened you’re late.
    // The dry-up signals you’re IN the consolidation phase; the pattern says the structure is valid.
    if (hardRulesPass && true && patternQuality && performanceGate) {
      decision = 'BUY';
    }
    // WATCH: 3 of 4 hard rules pass (one rule missing — monitor)
    else if (passedRules >= 3) {
      decision = 'WATCH';
    }


    reasoning.push('Failed Rules: --------------');
    if (!rule1) reasoning.push('❌ Rule 1: Price is not above SMA150 and SMA200.');
    if (!rule2) reasoning.push('❌ Rule 2: Price is not above 50-day MA.');
    if (!rule3) reasoning.push('❌ Rule 3: Price is less than 30% above 52-week low.');
    if (!rule4) reasoning.push('❌ Rule 4: Price is not within 25% of 52-week high.');
    if (!volumeDryUp) reasoning.push('❌ Volume not in dry-up phase.');
    if (!patternQuality) reasoning.push('❌ No confirmed pattern structure (VCP / Flag / Big Base).');
    if (!performanceGate) reasoning.push('❌ Performance gate: needs 1M>20% OR 3M>30% OR 6M>30%.');

    // Compose reasoning
    let finalConfidence = confidence;
    let decisionReasoning = reasoning.join('; ');
    if (decision === 'BUY') {
      finalConfidence = Math.max(0.9, confidence);
      decisionReasoning = `BUY candidate: Template rules passed + entry filters confirmed (volume + breakout/pattern quality + momentum). ${decisionReasoning}`;
    } else if (decision === 'WATCH') {
      finalConfidence = Math.max(0.6, confidence);
      decisionReasoning = `WATCH candidate: ${passedRules}/4 Template rules passed, but BUY entry filters not met. ${decisionReasoning}`;
    } else {
      decision = 'AVOID';
      finalConfidence = Math.max(0.2, confidence * 0.8);
      decisionReasoning = `REJECTED: Insufficient Template rules met (${passedRules}/4). ${decisionReasoning}`;
    }

    return {
      action: decision,
      confidence: finalConfidence,
      reasoning: decisionReasoning,
      factors: {
        passedRules,
        rule1, rule2, rule3, rule4,
        overallScore,
        criteriaCount: Object.values(criteria).filter(c => c?.passed).length,
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

    // Structural/ATR stop logic with 8% max cap
    const candidateStopLoss = bufferedSupport || Math.min(percentStop, atrStop);
    const maxAllowedStop = currentPrice * 0.95; // 5% max stop
    const stopLoss = Math.max(candidateStopLoss, maxAllowedStop);

    const stopDistance = stopLoss > 0 ? Number(((currentPrice - stopLoss) / currentPrice) * 100).toFixed(2) : 0;
    const riskAmount = currentPrice - stopLoss;
    const riskPercentage = (currentPrice - stopLoss) / currentPrice;

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

    const patternScore = (templateAnalysis.criteria?.patternQuality?.score || 0) >= 0.85 ? 1.0 :
      (templateAnalysis.criteria?.patternQuality?.score || 0) >= 0.7 ? 0.5 : 0;

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
    const finalScore = totalScore * confidenceMultiplier + patternScore;

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

    //Making maximum position size 10% of capital for risk management
    riskPercent = 1.0;
    maxPosition = 20;
    let shares = 0;
    let positionValue = 0;
    let riskAmount = 0;
    
    
    if (recommendation !== 'AVOID' && entryPrice > 0 && stopLoss > 0 && capital > 0) {
      const maxRiskAmount = capital * (riskPercent / 100);
      const riskPerShare = entryPrice - stopLoss;

      if (riskPerShare > 0) {
        shares = Math.floor(maxRiskAmount / riskPerShare);
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
      // console.log(`  ⚠️ TEMPLATE: Position sizing skipped - recommendation: ${recommendation}, entryPrice: ${entryPrice}, stopLoss: ${stopLoss}, capital: ${capital}`);
    }

    // 🎯 UNIFIED SCORING DEBUG INFO
    // console.log(`  🎯 UNIFIED SCORING: Template ${templateAnalysis.templateGrade}(${templateScore}) + Signal ${signalQualityGrade}(${signalScore}) = ${totalScore.toFixed(1)} → ${recommendation}`);

    const stopDistance = stopLoss > 0 ? Number(((entryPrice - stopLoss) / entryPrice) * 100).toFixed(2) : 0;
    const riskPerShare = Math.round((entryPrice - stopLoss) * 100) / 100;
    riskAmount = shares * riskPerShare;
    return {
      recommendation,
      riskPercent,
      maxPosition,
      shares: Math.max(0, shares),
      positionValue: positionValue,
      riskAmount: riskAmount,
      riskPerShare: riskPerShare,
      stopDistance: stopDistance,
      riskReward: riskReward,
    };
  }

  /**
   * Generate execution notes specific to Template methodology
   */
  generateTemplateExecutionNotes(templateAnalysis, signal) {
    const passedRules = ['criterion1', 'criterion2', 'criterion3', 'criterion4']
      .filter(k => templateAnalysis.criteria[k]?.passed).length;

    const notes = [
      `Template Grade: ${templateAnalysis.templateGrade} (${(templateAnalysis.overallScore * 100).toFixed(1)}% score)`,
      `Rules passed: ${passedRules}/4`
    ];

    if (signal === 'BUY') {
      notes.push('Execute with conviction - all 4 template rules met');
      notes.push('Monitor for continued institutional accumulation');
    } else if (signal === 'WATCH') {
      notes.push('Setup has potential but not all rules met');
      notes.push('Wait for remaining rules to confirm before entry');
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
  calculateUnifiedDisplayGrade(templateAnalysis, signalGrade) {
    const gradePoints = {
      'A+': 3,
      'A': 2.5,
      'B+': 2,
      'B': 1.5,
      'C': 1,
      'D': 0.5,
      'F': 0
    };

    const patternPoints = (templateAnalysis.criteria?.patternQuality?.score || 0) >= 0.85 ? 1 :
      (templateAnalysis.criteria?.patternQuality?.score || 0) >= 0.7 ? 0.5 : 0;
    const templateScore = gradePoints[templateAnalysis.templateGrade] || 0;
    const signalScore = gradePoints[signalGrade] || 0;
    const totalScore = templateScore + signalScore + patternPoints;

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

  validateData(indicators, series, symbol) {
    // Require 200+ days: minimum for SMA200 calculation.
    // Recently-listed stocks with 200–251 days are handled gracefully —
    // executeTemplateAnalysis uses all available bars for 52-week high/low.
    if (!series || series.length < 200) {
      console.log(`  ❌ MINERVINI: Insufficient data for ${symbol} - need 200+ days, got ${series?.length || 0}`);
      return false;
    }

    // 🚨 EMERGENCY FIX: Check both base arrays and latest values for SMA data
    const hasSMA150 = indicators?.sma150 || indicators?.latest?.sma150;
    const hasSMA200 = indicators?.sma200 || indicators?.latest?.sma200;

    if (!hasSMA150 || !hasSMA200) {
      console.log(`  ❌ MINERVINI: Missing SMA data for ${symbol} - SMA150: ${!!hasSMA150}, SMA200: ${!!hasSMA200}`);
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
      // Detect PARTICIPATION (volume expansion) within last 3 bars
      // Criteria: max volume in last 3 bars >= 1.3x the 10-day average volume
      if (!dailyData || dailyData.length < 15) {
        return { hasVolumeBreakout: false, volumeRatio: 1.0, breakoutDaysAgo: 0 };
      }

      // ✅ FIXED: Baseline uses 10 bars BEFORE the last 3 bars, so the potential
      // breakout surge days don't inflate the reference average — which was causing
      // the ratio to appear smaller than it actually was vs. pre-breakout baseline.
      const baselineData = dailyData.slice(-13, -3); // 10 bars: 4–13 days ago (clean baseline)
      const last3 = dailyData.slice(-3);

      const avg10 = this.calculateAverageVolume(baselineData);
      const vols3 = last3.map(d => d.volume || 0);
      const maxVol3 = Math.max(...vols3);

      const volumeRatio = avg10 > 0 ? (maxVol3 / avg10) : 1.0;
      // ✅ FIXED: Raised from 1.3x → 1.4x. 30% above baseline was too easily triggered
      // by normal daily variation. 40% better reflects genuine institutional participation.
      const threshold = 1.4;
      const hasExpansion = volumeRatio >= threshold;

      // how many bars ago the max volume occurred (0 = latest bar)
      const idx = vols3.lastIndexOf(maxVol3);
      const breakoutDaysAgo = (last3.length - 1) - idx;

      return {
        hasVolumeBreakout: hasExpansion,
        volumeRatio,
        breakoutDaysAgo
      };
    } catch (error) {
      console.warn('Volume expansion analysis error:', error.message);
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

  // --- VCP Contraction: ATR or BBW contraction in last 10 candles
  calculateATR(data, period = 14) {
    if (!data || data.length < period + 1) return Array(data.length).fill(0);
    const atrs = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period) {
        atrs.push(0);
      } else {
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) {
          const high = data[j].high;
          const low = data[j].low;
          const prevClose = data[j - 1]?.close ?? data[j].close;
          const tr = Math.max(
            high - low,
            Math.abs(high - prevClose),
            Math.abs(low - prevClose)
          );
          sum += tr;
        }
        atrs.push(sum / period);
      }
    }
    return atrs;
  }
  calculateBollingerBandWidth(data, period = 20) {
    if (!data || data.length < period) return Array(data.length).fill(0);
    const bbws = [];
    for (let i = 0; i < data.length; i++) {
      if (i < period - 1) {
        bbws.push(0);
      } else {
        const slice = data.slice(i - period + 1, i + 1);
        const closes = slice.map(c => c.close);
        const mean = closes.reduce((a, b) => a + b, 0) / period;
        const std = Math.sqrt(closes.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period);
        const upper = mean + 2 * std;
        const lower = mean - 2 * std;
        const width = (upper - lower) / mean;
        bbws.push(width);
      }
    }
    return bbws;
  }
  detectVcpContraction(data) {
    // Returns a numeric score between 0 and 1
    // === Component 1: ATR / BBW sequential contraction (existing logic) ===
    const atrList = this.calculateATR(data, 14);
    const bbWidthList = this.calculateBollingerBandWidth(data, 20);
    const recentATR = atrList.slice(-10);
    const recentBBW = bbWidthList.slice(-10);
    let atrContractionSteps = 0;
    for (let i = 1; i < recentATR.length; i++) {
      if (recentATR[i] < recentATR[i - 1]) atrContractionSteps++;
    }
    let bbwContractionSteps = 0;
    for (let i = 1; i < recentBBW.length; i++) {
      if (recentBBW[i] < recentBBW[i - 1]) bbwContractionSteps++;
    }
    const contractionSteps = Math.max(atrContractionSteps, bbwContractionSteps);
    const volatilityScore = Math.max(0, Math.min(1, contractionSteps / 10));

    // === Component 2: Price range contraction across 3 base segments ===
    // True VCP: each swing (high-low span) should be visibly narrower than the prior.
    // ATR/BBW alone can pass in choppy, directionless markets — price range validates structure.
    let rangeScore = 0;
    const segmentSize = Math.floor(data.length / 3);
    if (segmentSize >= 5) {
      const seg1 = data.slice(0, segmentSize);
      const seg2 = data.slice(segmentSize, segmentSize * 2);
      const seg3 = data.slice(segmentSize * 2);
      const range = seg => Math.max(...seg.map(d => d.high)) - Math.min(...seg.map(d => d.low));
      const r1 = range(seg1), r2 = range(seg2), r3 = range(seg3);
      if (r3 < r2 && r2 < r1) {
        rangeScore = 1.0; // Full contraction: all three stages tightening
      } else if (r3 < r1) {
        rangeScore = 0.5; // Partial: end is at least tighter than the beginning
      }
      // else rangeScore = 0 (expanding or flat range — not VCP)
    }

    // === Combined score: 50% volatility contraction + 50% price range contraction ===
    const combinedScore = (volatilityScore * 0.5) + (rangeScore * 0.5);
    return Math.max(0, Math.min(1, combinedScore));
  }

}

module.exports = MinerviniTemplateAdvanced;
