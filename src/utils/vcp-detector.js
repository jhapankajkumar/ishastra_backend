/**
 * VCP Detector — Volatility Contraction Pattern
 *
 * VCP is a stock's corrections getting progressively shallower and tighter
 * as it approaches a breakout. The key insight is that this is TIME-AGNOSTIC —
 * a VCP can form in 2 weeks or 6 months; the structure is the same.
 *
 * ─── Why NOT use ATR/BBW step counting ───────────────────────────────────────
 * ATR/BBW counting fails because:
 *   - It fires on random daily volatility fluctuations (noise)
 *   - One slightly larger bar breaks the entire sequence
 *   - It measures volatility of a window, not the STRUCTURE of corrections
 *
 * ─── The ZigZag + Linear Regression approach ─────────────────────────────────
 * 1. findPivots()         — Identify meaningful swing highs/lows (≥2% reversals)
 * 2. extractDownswings()  — Measure each correction: (swingHigh - swingLow) / swingHigh
 * 3. scoreContractionTrend() — Linear regression slope on depths. Negative = tightening.
 *    Unlike sequential comparison, regression tolerates one "off" swing and still
 *    detects the overall trend.
 * 4. scoreConsistency()   — Fraction of swings that ARE sequentially smaller
 * 5. scoreVolumeTrend()   — Volume declining on pullbacks (bonus)
 *
 * ─── Scoring weights ─────────────────────────────────────────────────────────
 *   Contraction trend  55%  — Is the overall trend of swing depths negative?
 *   Consistency        30%  — What fraction of swings are sequentially smaller?
 *   Volume trend       15%  — Is volume declining on each pullback?
 *
 * ─── Visual examples that should score high ──────────────────────────────────
 *   Classic VCP:  corrections of 12% → 7% → 4% → 1.5%  (perfect)
 *   Imperfect:    corrections of 10% → 6% → 8% → 3%     (one larger swing — still passes)
 *   Too noisy:    corrections of 8%  → 7% → 9% → 6%     (no clear trend — fails)
 *
 * Author: Ishastra AI Expert Engine
 */

class VcpDetector {
  /**
   * @param {Object} options
   * @param {number} options.minSwingPct  — Minimum reversal to register a swing pivot (default 0.02 = 2%)
   *                                        Lower = catches tighter final contractions
   *                                        Higher = less noise but may miss tight VCP pivots
   */
  constructor(options = {}) {
    this.minSwingPct = options.minSwingPct || 0.02; // 2% — catches tight final contractions
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Detect VCP structure in price data.
   *
   * @param {Array}  data  — OHLCV array, chronological order. Typically 40–80 bars.
   * @returns {Object} {
   *   score          {number},    // 0–1 overall VCP quality
   *   numContractions {number},   // how many downswings found
   *   depths         {number[]},  // each correction as % (e.g. [10.2, 6.5, 3.1])
   *   contractionTrend {number},  // 0–1 strength of the contraction trend
   *   consistency    {number},    // 0–1 fraction of swings that are sequentially smaller
   *   volumeTrend    {number},    // 0–1 volume declining on pullbacks
   *   pivots         {Array}      // raw swing pivot data for debugging
   * }
   */
  detect(data) {
    const NONE = { score: 0, numContractions: 0, depths: [], contractionTrend: 0, consistency: 0, volumeTrend: 0, pivots: [] };
    if (!data || data.length < 10) return NONE;

    // Position gate — "don't trade downside bases by calling it VCP" (Big Base deck).
    // A real VCP forms in the UPPER portion of the recent range as supply dries up
    // near highs. Contractions happening in the lower half of the range are a
    // downtrend/basing structure, not a VCP — score 0 regardless of swing shape.
    const windowHigh = Math.max(...data.map(d => d.high));
    const windowLow  = Math.min(...data.map(d => d.low));
    const lastClose  = data[data.length - 1].close;
    const positionInRange = windowHigh > windowLow
      ? (lastClose - windowLow) / (windowHigh - windowLow)
      : 0;
    if (positionInRange < 0.5) return NONE;

    const pivots     = this.findPivots(data, this.minSwingPct);
    const downswings = this.extractDownswings(pivots, data);

    // A VCP needs at least 3 contractions (e.g. 10% → 6% → 3%). Two shrinking
    // swings is one comparison — random noise produces that constantly.
    if (downswings.length < 3) return { ...NONE, pivots };

    const contractionTrend = this.scoreContractionTrend(downswings);
    const consistency      = this.scoreConsistency(downswings);
    const volumeTrend      = this.scoreVolumeTrend(downswings);

    const score = Math.min(1.0, Math.max(0,
      contractionTrend * 0.55 +
      consistency      * 0.30 +
      volumeTrend      * 0.15
    ));

    return {
      score:            Math.round(score * 100) / 100,
      numContractions:  downswings.length,
      depths:           downswings.map(s => Math.round(s.depth * 1000) / 10), // %
      contractionTrend: Math.round(contractionTrend * 100) / 100,
      consistency:      Math.round(consistency * 100) / 100,
      volumeTrend:      Math.round(volumeTrend * 100) / 100,
      pivots
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 — FIND SWING PIVOTS (ZigZag)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Identifies alternating swing HIGH and LOW pivots.
   *
   * A swing high is confirmed when price reverses DOWN by >= minSwingPct from the extreme.
   * A swing low  is confirmed when price reverses UP   by >= minSwingPct from the extreme.
   *
   * The final unconfirmed extreme is also included (represents the current swing in progress).
   *
   * Example: in a VCP with three contractions:
   *   HIGH(10%) → LOW → HIGH(6%) → LOW → HIGH(3%) → LOW(current)
   *   Depths extracted: [10%, 6%, 3%] → clear contraction trend
   */
  findPivots(data, minPct) {
    const pivots = [];
    let dir      = null;   // 'up' | 'down'
    let extPrice = 0;      // current extreme (high or low)
    let extIdx   = 0;

    for (let i = 0; i < data.length; i++) {
      const bar = data[i];

      if (dir === null) {
        dir = 'up';
        extPrice = bar.high;
        extIdx = i;
        continue;
      }

      if (dir === 'up') {
        // Track new swing high
        if (bar.high > extPrice) { extPrice = bar.high; extIdx = i; }
        // Confirm swing high when price reverses down by minPct
        if (extPrice > 0 && bar.low <= extPrice * (1 - minPct)) {
          pivots.push({ type: 'high', price: extPrice, idx: extIdx });
          dir = 'down'; extPrice = bar.low; extIdx = i;
        }
      } else {
        // Track new swing low
        if (bar.low < extPrice) { extPrice = bar.low; extIdx = i; }
        // Confirm swing low when price reverses up by minPct
        if (extPrice > 0 && bar.high >= extPrice * (1 + minPct)) {
          pivots.push({ type: 'low', price: extPrice, idx: extIdx });
          dir = 'up'; extPrice = bar.high; extIdx = i;
        }
      }
    }

    // Include the final unconfirmed extreme (the current swing still in progress)
    if (pivots.length > 0) {
      const lastConfirmedType = pivots[pivots.length - 1].type;
      const expectedNext = lastConfirmedType === 'high' ? 'low' : 'high';
      if ((dir === 'down' && expectedNext === 'low') || (dir === 'up' && expectedNext === 'high')) {
        pivots.push({ type: expectedNext, price: extPrice, idx: extIdx });
      }
    }

    return pivots;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 — EXTRACT DOWNSWINGS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Extracts each HIGH→LOW pair as a "correction" with:
   *   depth    — (high - low) / high  (the correction magnitude)
   *   bars     — number of bars the correction lasted
   *   avgVol   — average volume during the correction
   */
  extractDownswings(pivots, data) {
    const result = [];

    for (let i = 0; i < pivots.length - 1; i++) {
      if (pivots[i].type !== 'high' || pivots[i + 1].type !== 'low') continue;

      const h = pivots[i];
      const l = pivots[i + 1];
      const depth = h.price > 0 ? (h.price - l.price) / h.price : 0;

      if (depth < 0.005) continue; // Skip trivially small moves (< 0.5%)

      // Average volume during the correction
      const swingSlice = data.slice(h.idx, l.idx + 1);
      const avgVol = swingSlice.length
        ? swingSlice.reduce((s, b) => s + (b.volume || 0), 0) / swingSlice.length
        : 0;

      result.push({
        depth,
        highPrice: h.price,
        lowPrice:  l.price,
        bars:      l.idx - h.idx + 1,
        avgVol
      });
    }

    return result;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3 — SCORE COMPONENTS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Linear regression slope of swing depths.
   * Negative slope = depths are shrinking = VCP structure present.
   *
   * Uses regression (not strict sequential comparison) so one "off" swing
   * doesn't invalidate an otherwise strong contraction pattern.
   *
   * Reference calibration:
   *   slope = -0.01 per swing step → score ~ 0.20 (mild)
   *   slope = -0.03 per swing step → score ~ 0.60 (clear)
   *   slope = -0.05 per swing step → score ~ 1.00 (strong)
   */
  scoreContractionTrend(swings) {
    if (swings.length < 2) return 0;
    const depths = swings.map(s => s.depth);
    const slope  = this._linSlope(depths);

    if (slope >= 0) return 0.05; // Flat or expanding → not a VCP

    // Score: steeper negative slope = stronger contraction
    return Math.min(1.0, Math.abs(slope) * 20);
  }

  /**
   * What fraction of consecutive swing pairs are strictly decreasing?
   * Perfect VCP: 1.0  (every correction smaller than the previous)
   * Imperfect:   0.5–0.8 (still valid)
   * No structure: 0.0–0.3
   */
  scoreConsistency(swings) {
    if (swings.length < 2) return 0;
    let smallerCount = 0;
    for (let i = 1; i < swings.length; i++) {
      if (swings[i].depth < swings[i - 1].depth) smallerCount++;
    }
    return smallerCount / (swings.length - 1);
  }

  /**
   * Is volume on each pullback declining?
   * In a proper VCP, supply (selling pressure) dries up → each correction
   * has lower average volume than the prior correction.
   */
  scoreVolumeTrend(swings) {
    const vols = swings.map(s => s.avgVol).filter(v => v > 0);
    if (vols.length < 2) return 0;

    const slope  = this._linSlope(vols);
    const refVol = vols[0] || 1;

    // Normalize slope by first-swing volume to make it scale-independent
    return slope < 0 ? Math.min(1.0, Math.abs(slope / refVol) * 5) : 0;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPER
  // ─────────────────────────────────────────────────────────────────────────────

  /** Ordinary least-squares slope for a sequence of values */
  _linSlope(values) {
    const n    = values.length;
    if (n < 2) return 0;
    const xBar = (n - 1) / 2;
    const yBar = values.reduce((s, v) => s + v, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xBar) * (values[i] - yBar);
      den += (i - xBar) ** 2;
    }
    return den !== 0 ? num / den : 0;
  }
}

module.exports = { VcpDetector };
