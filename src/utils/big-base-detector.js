/**
 * Big Base Detector
 *
 * Detects long-duration consolidation bases bounded between a prior high (ceiling)
 * and a base floor (support). Based on Hiren Gabani's "Big Base" pattern from
 * Minervini/SEPA methodology.
 *
 * ─── What a Big Base looks like ──────────────────────────────────────────────
 *   1. Stock makes a prior HIGH (becomes the "ceiling" / resistance level)
 *   2. Price declines significantly — creates the base (correction of 15–60%)
 *   3. Price oscillates for months (20+ weeks) between the floor and ceiling
 *   4. Two valid entry zones on the RIGHT SIDE of the base:
 *      - UPPER ZONE (>75% of base range): Price approaching ceiling — buy
 *        anticipating the breakout above the prior high
 *      - FLOOR ZONE (<20% of base range): Price bouncing from support — buy
 *        the recovery leg up within the base
 *      - MIDDLE (20%–75%): NOT actionable — price not at a clear decision point
 *
 * ─── Why duration matters ────────────────────────────────────────────────────
 *   Longer bases (26+ weeks) shake out weak holders more completely and build
 *   institutional accumulation. A 6-month base is more significant than a 2-month
 *   base because it took longer to absorb the supply.
 *
 * ─── Scoring weights ─────────────────────────────────────────────────────────
 *   Entry zone quality   30% — Upper or floor zone; middle = 0 (non-trade)
 *   Right-side tightness 20% — Recent bars should be tight (supply absorbed)
 *   Base duration        20% — Longer = more institutional significance
 *   Base depth           20% — 20–45% correction is the sweet spot
 *   Volume contraction   10% — Volume declining near entry = supply drying up
 *
 * ─── Visual examples ─────────────────────────────────────────────────────────
 *   Strong:  Prior high ₹500 → base floor ₹320 (36% deep), 8-month base,
 *            current price ₹470 (UPPER zone), tight 15 bars, volume drying up
 *   Weak:    Prior high ₹500 → current ₹380 (MIDDLE zone) — not actionable
 *
 * Author: Ishastra AI Expert Engine
 */

class BigBaseDetector {
  /**
   * @param {Object} options
   * @param {number} options.minBaseBars     — Minimum bars since prior high to qualify (default 100 ≈ 20 weeks)
   * @param {number} options.maxBaseBars     — Maximum lookback in bars (default 504 ≈ 2 years)
   * @param {number} options.minBaseDepth    — Minimum correction depth from peak (default 0.15 = 15%)
   * @param {number} options.maxBaseDepth    — Maximum correction depth allowed (default 0.60 = 60%)
   * @param {number} options.upperZoneMin    — Base position threshold for UPPER zone (default 0.75)
   * @param {number} options.floorZoneMax    — Base position threshold for FLOOR zone (default 0.20)
   * @param {number} options.tightnessBars   — Bars to measure right-side tightness (default 15)
   */
  constructor(options = {}) {
    this.minBaseBars   = options.minBaseBars   ?? 100;  // ~20 weeks minimum
    this.maxBaseBars   = options.maxBaseBars   ?? 504;  // ~2 years
    this.minBaseDepth  = options.minBaseDepth  ?? 0.15; // 15% minimum correction
    this.maxBaseDepth  = options.maxBaseDepth  ?? 0.60; // 60% maximum (too damaged above this)
    this.upperZoneMin  = options.upperZoneMin  ?? 0.75; // top 25% of range
    this.floorZoneMax  = options.floorZoneMax  ?? 0.20; // bottom 20% of range
    this.tightnessBars = options.tightnessBars ?? 15;   // right-side tightness window
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Main entry point. Detects a big base and scores entry quality.
   *
   * @param {Array}  dailyData    — OHLCV array, chronological (oldest → newest)
   * @param {number} currentPrice — Current market price
   * @returns {Object} {
   *   detected          {boolean},
   *   entryZone         {string},  // 'UPPER' | 'FLOOR' | 'MIDDLE' | 'NONE'
   *   score             {number},  // 0–1 quality score
   *   ceiling           {number},  // prior high (resistance)
   *   floor             {number},  // base support level
   *   baseDepthPct      {number},  // correction depth as %
   *   baseDurationBars  {number},
   *   baseDurationWeeks {number},
   *   basePosition      {number},  // 0–100, where price sits in the range (0=floor, 100=ceiling)
   *   details           {Object}   // sub-scores for transparency
   * }
   */
  detect(dailyData, currentPrice) {
    const empty = {
      detected: false, entryZone: 'NONE', score: 0,
      ceiling: null, floor: null, baseDepthPct: null,
      baseDurationBars: null, baseDurationWeeks: null, basePosition: null,
      details: {}
    };

    if (!dailyData || dailyData.length < this.minBaseBars + 20) return empty;

    // ── Step 1: Find the prior peak (ceiling) in the full lookback window
    const lookback = dailyData.slice(-this.maxBaseBars);
    let ceilingValue = -Infinity;
    let ceilingIdx   = 0;
    for (let i = 0; i < lookback.length; i++) {
      if (lookback[i].high > ceilingValue) {
        ceilingValue = lookback[i].high;
        ceilingIdx   = i;
      }
    }

    // The base needs enough bars AFTER the peak
    const barsAfterPeak = lookback.length - 1 - ceilingIdx;
    if (barsAfterPeak < this.minBaseBars) {
      // Peak is too recent — still inside the initial decline, not a base yet
      return empty;
    }

    // ── Step 2: Find the floor (lowest low AFTER the peak)
    const afterPeak = lookback.slice(ceilingIdx);
    let floorValue = Infinity;
    for (const bar of afterPeak) {
      if (bar.low < floorValue) floorValue = bar.low;
    }

    // ── Step 3: Validate the base structure
    const baseRange = ceilingValue - floorValue;
    if (baseRange <= 0 || floorValue <= 0) return empty;

    const baseDepth = baseRange / ceilingValue;
    if (baseDepth < this.minBaseDepth || baseDepth > this.maxBaseDepth) return empty;

    // ── Step 4: Locate current price within the base range
    // basePosition: 0.0 = at floor, 1.0 = at ceiling
    const basePosition = Math.min(1, Math.max(0, (currentPrice - floorValue) / baseRange));

    let entryZone;
    if (basePosition >= this.upperZoneMin) {
      entryZone = 'UPPER';   // approaching resistance → pre-breakout
    } else if (basePosition <= this.floorZoneMax) {
      entryZone = 'FLOOR';   // near support on right side → recovery leg
    } else {
      entryZone = 'MIDDLE';  // no-trade zone
    }

    // ── Step 5: Right-side tightness — are recent bars tight within the base?
    const recentBars = dailyData.slice(-this.tightnessBars);
    const tightnessScore = this._tightnessScore(recentBars, baseRange);

    // ── Step 6: Volume contraction — is volume declining near the entry?
    const baseVolAvg   = this._avgVol(afterPeak);
    const recentVolAvg = this._avgVol(recentBars);
    // volRatio < 1 = volume contracting (good), > 1 = expanding (bad for accumulation phase)
    const volRatio          = baseVolAvg > 0 ? recentVolAvg / baseVolAvg : 1;
    const volContractionScore = Math.max(0, Math.min(1, 1 - (volRatio - 0.5) / 0.5));

    // ── Step 7: Right-side recovery — are lows rising on the right side?
    const recoveryScore = this._rightSideRecovery(afterPeak);

    // ── Step 8: Entry zone quality score
    let zoneScore = 0;
    if (entryZone === 'UPPER') {
      // Closer to ceiling = higher score (0.5 at 75%, 1.0 at 100%)
      zoneScore = 0.5 + (basePosition - this.upperZoneMin) / (1 - this.upperZoneMin) * 0.5;
    } else if (entryZone === 'FLOOR') {
      // Closer to floor = higher score (0.5 at 20%, 1.0 at 0%)
      zoneScore = 0.5 + (this.floorZoneMax - basePosition) / this.floorZoneMax * 0.5;
    }
    // MIDDLE → zoneScore = 0

    // ── Step 9: Duration score (longer = more significant; caps at 52+ weeks)
    const durationScore = Math.min(1.0, (barsAfterPeak - this.minBaseBars) / (260 - this.minBaseBars));

    // ── Step 10: Depth score (20–45% is the Minervini sweet spot)
    let depthScore;
    if (baseDepth >= 0.20 && baseDepth <= 0.45) {
      depthScore = 1.0;
    } else if (baseDepth < 0.20) {
      depthScore = baseDepth / 0.20; // too shallow
    } else {
      // 45–60% — gets penalized; >60% already filtered above
      depthScore = Math.max(0, 1.0 - (baseDepth - 0.45) / 0.15);
    }

    // ── Step 11: Weighted final score
    // recoveryScore (higher lows on the right side) is the anti-V-shape check —
    // the trader explicitly excludes V-shaped bases ("sudden drops, sudden moves").
    const score =
      zoneScore           * 0.25 +
      tightnessScore      * 0.20 +
      durationScore       * 0.15 +
      depthScore          * 0.20 +
      volContractionScore * 0.10 +
      recoveryScore       * 0.10;

    // Detected = UPPER zone only. FLOOR-zone bounces are anticipation trades
    // inside the base — the trader's rule is confirmation-only ("no trade in the
    // anticipation zone"). FLOOR is still reported via entryZone for WATCH lists.
    const detected = entryZone === 'UPPER' && score >= 0.30;

    return {
      detected,
      entryZone,
      score:            Math.round(Math.min(1.0, score) * 1000) / 1000,
      ceiling:          Math.round(ceilingValue * 100) / 100,
      floor:            Math.round(floorValue   * 100) / 100,
      baseDepthPct:     Math.round(baseDepth   * 1000) / 10,    // e.g. 32.4
      baseDurationBars: barsAfterPeak,
      baseDurationWeeks: Math.round(barsAfterPeak / 5),
      basePosition:     Math.round(basePosition * 100),          // 0–100%
      details: {
        zoneScore:           Math.round(zoneScore           * 100) / 100,
        tightnessScore:      Math.round(tightnessScore      * 100) / 100,
        durationScore:       Math.round(durationScore       * 100) / 100,
        depthScore:          Math.round(depthScore          * 100) / 100,
        volContractionScore: Math.round(volContractionScore * 100) / 100,
        recoveryScore:       Math.round(recoveryScore       * 100) / 100,
        volRatio:            Math.round(volRatio            * 100) / 100
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PRIVATE HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Tightness score of recent bars relative to the base range.
   * stddev of closes as a fraction of baseRange:
   *   < 5% of range → very tight → score 1.0
   *   > 25% of range → chaotic  → score 0.0
   */
  _tightnessScore(bars, baseRange) {
    if (!bars || bars.length < 3 || baseRange <= 0) return 0;
    const closes = bars.map(d => d.close);
    const avg    = closes.reduce((a, b) => a + b, 0) / closes.length;
    if (avg <= 0) return 0;
    const variance = closes.reduce((a, c) => a + (c - avg) ** 2, 0) / closes.length;
    const stdDev   = Math.sqrt(variance);
    // tightnessPct: how large is the spread relative to the base range
    const tightnessPct = stdDev / baseRange;
    // 5% = perfect, 25% = chaotic; linear between
    return Math.max(0, Math.min(1, 1 - (tightnessPct - 0.05) / 0.20));
  }

  /**
   * Right-side recovery: are the lows on the right side of the base higher
   * than the lows on the left side? Indicates accumulation and improving structure.
   * Score 0–1: 1 = strong higher-lows pattern, 0 = none.
   */
  _rightSideRecovery(afterPeakData) {
    if (!afterPeakData || afterPeakData.length < 20) return 0.5;
    const mid       = Math.floor(afterPeakData.length / 2);
    const leftHalf  = afterPeakData.slice(0, mid);
    const rightHalf = afterPeakData.slice(mid);
    const leftLow   = Math.min(...leftHalf.map(d => d.low));
    const rightLow  = Math.min(...rightHalf.map(d => d.low));
    if (leftLow <= 0) return 0.5;
    const improvement = (rightLow - leftLow) / leftLow;
    // 10%+ higher lows on right = full score
    return Math.max(0, Math.min(1, improvement / 0.10));
  }

  _avgVol(bars) {
    if (!bars || bars.length === 0) return 0;
    return bars.reduce((a, d) => a + (d.volume || 0), 0) / bars.length;
  }
}

module.exports = { BigBaseDetector };
