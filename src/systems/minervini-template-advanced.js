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
const { computeSetupCharacter } = require('../utils/setupCompute');
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


      // Generate final decision WITHOUT AI enhancement (AI handled by Gate Engine)
      const rawDecision = this.makeFinalDecision(templateAnalysis, completedDaily,
        { capital, symbol, entryPrice },
        thresholds
      );
      return {
        system: this.systemId,
        systemName: this.name,
        decision: rawDecision.action,
        confidence: rawDecision.confidence,
        reasoning: rawDecision.reasoning,
        // patternScore is the real discriminator among prefiltered momentum
        // stocks — BUY confidence is floored at 0.9 so it can't rank anything.
        patternScore: templateAnalysis.criteria?.patternQuality?.score ?? 0,
        patternGrade: templateAnalysis.criteria?.patternQuality?.grade ?? 'F',
        dirEff: templateAnalysis.criteria?.setupCharacter?.directionalEfficiency60d ?? null,
        // was criteria.setupQuality — a key that never existed (always null)
        setupQuality: templateAnalysis.criteria?.patternQuality || null,
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
    reasoning.push(`✅ Volume dry-up (absorption): 5D/20D avg vol = ${(dryUpRatio).toFixed(2)} (≤ 0.75)`);
  } else {
    reasoning.push(`⚠️ No volume dry-up: 5D/20D avg vol = ${(dryUpRatio).toFixed(2)} (> 0.75)`);
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

    // === SETUP CHARACTER GATE (smooth-mover filter) ===
    // directionalEfficiency60d = net move / sum of daily moves over 60 bars.
    // Calibrated on the trader's own golden set (src/evals/analyze-features.js):
    // their taken setups run > ~0.25, their rejected choppy charts < ~0.12.
    // Structural detectors (flag/VCP/base) can't see movement QUALITY — a choppy
    // stair-stepper forms textbook flags and still gets rejected on manual review.
    // Golden-set baseline (analyze-detectors.js): all 6 scanner false approvals
    // were flag detections; 3 had dirEff < 0.12, 2 more were in the 0.12–0.20 zone.
    const setupCharacter = computeSetupCharacter(dailyData);
    const dirEff = setupCharacter?.directionalEfficiency60d ?? null;
    let characterGatedScore = finalUnifiedPatternScore;
    if (dirEff !== null) {
      if (dirEff < 0.12) {
        characterGatedScore = 0; // hard reject: trades like the charts the trader always skips
        reasoning.push(`❌ Setup character: dirEff ${dirEff} < 0.12 — choppy mover, pattern voided`);
      } else if (dirEff < 0.20) {
        characterGatedScore = Math.max(0, characterGatedScore - 0.10);
        reasoning.push(`⚠️ Setup character: dirEff ${dirEff} in 0.12–0.20 gray zone — pattern score penalized −0.10`);
      } else {
        reasoning.push(`✅ Setup character: dirEff ${dirEff} — smooth mover`);
      }
    }
    if (characterGatedScore !== finalUnifiedPatternScore) {
      criteria.patternQuality.score  = characterGatedScore;
      criteria.patternQuality.passed = characterGatedScore >= 0.5;
      criteria.patternQuality.grade  =
        characterGatedScore >= 0.90 ? 'A+' :
        characterGatedScore >= 0.70 ? 'A'  :
        characterGatedScore >= 0.50 ? 'B'  :
        characterGatedScore >= 0.30 ? 'C'  : 'F';
    }
    criteria.setupCharacter = {
      directionalEfficiency60d: dirEff,
      poleRunupPct: setupCharacter?.poleRunupPct ?? null,
      gate: dirEff === null ? 'SKIPPED' : dirEff < 0.12 ? 'REJECTED' : dirEff < 0.20 ? 'PENALIZED' : 'CLEAN'
    };

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
  makeFinalDecision(templateAnalysis, dailyData, options, thresholds) {
    const { confidence, reasoning, overallScore, criteria, rule1, rule2, rule3, rule4 } = templateAnalysis;


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

    // BUY: All 4 trend rules + pattern confirmed + momentum.
    // Volume dry-up is deliberately NOT a hard gate: dry-up often prints only in
    // the final days before the breakout, and gating on it drops good setups
    // whose contraction hasn't completed on scan day. It contributes as a score
    // BONUS inside the pattern fold (flag +0.15, big base +0.10) instead.
    if (hardRulesPass && patternQuality && performanceGate) {
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
      }
    };
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
}

module.exports = MinerviniTemplateAdvanced;
