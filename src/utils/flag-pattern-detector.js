/**
 * Flag Pattern Detector
 *
 * Detects post-pole consolidation patterns that simple volatility metrics (stddev, ATR, BBW)
 * miss, because they look at raw dispersion rather than the STRUCTURE of the move.
 *
 * Patterns detected (strongest → weakest):
 *   HIGH_TIGHT_FLAG  — 90%+ pole gain + ≤15% flag range (Minervini's #1 power setup)
 *   TIGHT_FLAG       — 15%+ pole gain + ≤10% flag range (tight bull flag)
 *   BULL_FLAG        — 15%+ pole gain + ≤50% pullback from pole high (orderly flag)
 *   BASE             — 12%+ pole gain + ≤25% range (wide consolidation on a pole)
 *   NONE             — No detectable pole/flag structure
 *
 * Algorithm overview:
 *   1. findPole()    — Walk back from current price to find the most recent strong directional run
 *   2. measureFlag() — Characterise the consolidation from pole-peak to now
 *   3. classifyType()— Name the pattern based on pole gain + flag tightness
 *   4. score()       — Produce a 0–1 quality score (pole strength × tightness × volume × orderliness)
 *
 * Visual examples this should catch (all detected as flags or HTFs):
 *   - COCO  : +65% pole (Apr→May), ~5% flag range at highs
 *   - LQDA  : +85% pole (6 weeks),  ~8% flag range → HIGH_TIGHT_FLAG
 *   - DOCN  : +100%+ gap-and-run,  tight base at $150–166 → HIGH_TIGHT_FLAG / BASE
 *   - HUM   : Parabolic +90%,       consolidating near all-time-highs
 *
 * Author: Ishastra AI Expert Engine
 */

class FlagPatternDetector {
  /**
   * @param {Object} options
   * @param {number} options.maxPoleSearchBars  — How far back to look for a pole (default 80)
   * @param {number} options.maxFlagBars        — Max bars of consolidation to qualify as a flag (default 35)
   * @param {number} options.minFlagBars        — Min bars needed to confirm a flag exists (default 3)
   * @param {number} options.minPoleGain        — Minimum pole gain % to qualify (default 0.12 = 12%)
   */
  constructor(options = {}) {
    this.maxPoleSearchBars = options.maxPoleSearchBars || 80;
    this.maxFlagBars       = options.maxFlagBars       || 35;
    this.minFlagBars       = options.minFlagBars       || 3;
    this.minPoleGain       = options.minPoleGain       || 0.12;
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Main entry point. Classifies the most recent pattern and returns a scored result.
   *
   * @param {Array}  dailyData     — OHLCV array in chronological (oldest → newest) order
   * @param {number} currentPrice  — Current market price
   * @returns {Object} {
   *   detected       {boolean},
   *   type           {string},     // 'HIGH_TIGHT_FLAG' | 'TIGHT_FLAG' | 'BULL_FLAG' | 'BASE' | 'NONE'
   *   score          {number},     // 0–1 quality score
   *   readyForBreakout {boolean},  // price within 3% of flag high
   *   pole           {Object|null},
   *   flag           {Object|null}
   * }
   */
  classify(dailyData, currentPrice) {
    const NONE = { detected: false, type: 'NONE', score: 0, pole: null, flag: null, readyForBreakout: false };
    if (!dailyData || dailyData.length < 25 || !currentPrice || currentPrice <= 0) return NONE;

    const pole = this.findPole(dailyData, currentPrice);
    if (!pole) return NONE;

    const flag = this.measureFlag(dailyData, pole);
    if (!flag) return NONE;

    const type  = this.classifyType(pole, flag);
    const score = this.scorePattern(pole, flag, type);

    return {
      // CONSOLIDATION means "something is there but it isn't a valid flag"
      // (e.g. pullback deeper than 20% from peak) — never a confirmed pattern.
      detected: score >= 0.35 && type !== 'CONSOLIDATION',
      type,
      score: Math.round(score * 100) / 100,
      readyForBreakout: this.isNearBreakout(flag, currentPrice),
      pole: {
        gain:       Math.round(pole.gain * 1000) / 1000,
        bars:       pole.bars,
        high:       Math.round(pole.high * 100) / 100,
        base:       Math.round(pole.base * 100) / 100,
        avgVolume:  Math.round(pole.avgVolume)
      },
      flag: {
        bars:              flag.bars,
        range:             Math.round(flag.range * 1000) / 1000,
        pullback:          Math.round(flag.pullback * 1000) / 1000,
        slope:             Math.round(flag.slope * 10000) / 10000,
        volRatio:          Math.round(flag.volRatio * 100) / 100,
        volContracted:     flag.volContracted,
        tighteningAtEnd:   flag.tighteningAtEnd
      }
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 1 — FIND THE POLE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Finds the most recent strong directional run ending near the current price.
   *
   * Logic:
   *   a) Find the highest high within the last `maxPoleSearchBars` bars
   *   b) Confirm current price is within 20% of that peak (we're still "near the top")
   *   c) Walk backwards from the peak to find the launch low (pole base)
   *   d) Validate: poleGain >= minPoleGain and poleBars >= 5
   *
   * @returns {Object|null} pole descriptor or null if no valid pole found
   */
  findPole(dailyData, currentPrice) {
    const lookback = dailyData.slice(-this.maxPoleSearchBars);

    // (a) Find the peak high in the lookback window
    let peakHigh = 0, peakIdx = 0;
    for (let i = 0; i < lookback.length; i++) {
      if (lookback[i].high > peakHigh) {
        peakHigh = lookback[i].high;
        peakIdx  = i;
      }
    }
    if (peakHigh <= 0) return null;

    // (b) Current price must be within 20% of the peak — we're in the flag, not extended down
    const distFromPeak = (peakHigh - currentPrice) / peakHigh;
    if (distFromPeak > 0.20) return null;

    // Flag must have started: peak cannot be the most recent bar
    const peakBarFromEnd = lookback.length - 1 - peakIdx;
    if (peakBarFromEnd < this.minFlagBars) return null;

    // (c) Walk backwards from peak to find the pole launch low
    // Scan up to 60 bars before the peak (covers 12-week pole)
    const poleSearchStart = Math.max(0, peakIdx - 60);
    let poleBase    = peakHigh;
    let poleBaseIdx = peakIdx;

    for (let i = peakIdx - 1; i >= poleSearchStart; i--) {
      if (lookback[i].low < poleBase) {
        poleBase    = lookback[i].low;
        poleBaseIdx = i;
      }
    }

    // (d) Validate minimum gain and minimum pole duration
    const poleGain = poleBase > 0 ? (peakHigh - poleBase) / poleBase : 0;
    const poleBars = peakIdx - poleBaseIdx;
    if (poleGain < this.minPoleGain || poleBars < 5) return null;

    // (e) Pre-pole trend check — reject V-reversals.
    //
    // A valid flag is a CONTINUATION pattern: the pole must launch from an uptrend
    // or a flat base, NOT from the bottom of a downtrend. If the stock was declining
    // significantly in the bars just before the pole's launch low, it is a reversal
    // (V-bottom gap-and-run), not a flag.
    //
    // Rule: look at the 20 bars immediately before the pole base. If the highest close
    // in that window is more than 20% above the lowest close (i.e., price was falling
    // into the pole base), reject the pole.
    const prePoleWindow = 20;
    const prePoleStart  = Math.max(0, poleBaseIdx - prePoleWindow);
    const prePoleSlice  = lookback.slice(prePoleStart, poleBaseIdx + 1);
    if (prePoleSlice.length >= 5) {
      const prePoleHighClose = Math.max(...prePoleSlice.map(d => d.close));
      const prePoleEndClose  = prePoleSlice[prePoleSlice.length - 1].close;
      // How much did price fall into the pole base?
      const declineIntoPole = prePoleHighClose > 0
        ? (prePoleHighClose - prePoleEndClose) / prePoleHighClose
        : 0;
      // If price fell more than 20% going INTO the pole base → this is a reversal, not a flag
      if (declineIntoPole > 0.20) return null;
    }

    // Average volume during the pole (for flag volume contraction comparison)
    const poleSlice  = lookback.slice(poleBaseIdx, peakIdx + 1);
    const poleAvgVol = poleSlice.length
      ? poleSlice.reduce((s, d) => s + (d.volume || 0), 0) / poleSlice.length
      : 0;

    return { gain: poleGain, bars: poleBars, high: peakHigh, base: poleBase, peakBarFromEnd, avgVolume: poleAvgVol };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 2 — MEASURE THE FLAG
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Characterises the consolidation from pole peak to current bar.
   *
   * Metrics:
   *   range          — (flagHigh - flagLow) / flagLow  — overall tightness
   *   pullback       — (poleHigh - flagLow) / poleHeight — retracement fraction of pole
   *   slope          — normalised linear regression slope of closes (% per bar)
   *   volRatio       — flagAvgVol / poleAvgVol  — < 1.0 = volume contracting
   *   volContracted  — volRatio < 0.70
   *   tighteningAtEnd— last 5 bars range < 60% of full flag range (squeeze building)
   *
   * @returns {Object|null}
   */
  measureFlag(dailyData, pole) {
    const { peakBarFromEnd } = pole;
    if (peakBarFromEnd < this.minFlagBars || peakBarFromEnd > this.maxFlagBars) return null;

    const flagData = dailyData.slice(-peakBarFromEnd);
    if (!flagData.length) return null;

    const flagHigh = Math.max(...flagData.map(d => d.high));
    const flagLow  = Math.min(...flagData.map(d => d.low));
    if (flagLow <= 0) return null;

    const range      = (flagHigh - flagLow) / flagLow;
    const poleHeight = pole.high - pole.base;
    const pullback   = poleHeight > 0 ? (pole.high - flagLow) / poleHeight : 1;
    // Pullback in PRICE terms from the peak — the trader's rule: "strong start,
    // then mild pullback, under 20% from the high regardless of pole size."
    // The pole-fraction `pullback` alone is misleading on big poles (a 50%
    // retracement of a 100% pole = 25% price drop — too deep).
    const dropFromPeak = pole.high > 0 ? (pole.high - flagLow) / pole.high : 1;
    const slope      = this._calcSlope(flagData.map(d => d.close));

    const flagAvgVol = flagData.length
      ? flagData.reduce((s, d) => s + (d.volume || 0), 0) / flagData.length
      : 0;
    const volRatio = pole.avgVolume > 0 ? flagAvgVol / pole.avgVolume : 1;

    // Tightening-at-end: last 5 bars narrower than full flag?
    let tighteningAtEnd = false;
    if (flagData.length >= 8) {
      const tail      = flagData.slice(-5);
      const tailRange = (Math.max(...tail.map(d => d.high)) - Math.min(...tail.map(d => d.low)))
                        / Math.min(...tail.map(d => d.low));
      tighteningAtEnd = tailRange < range * 0.60;
    }

    return {
      bars: peakBarFromEnd,
      high: flagHigh,
      low:  flagLow,
      range,
      pullback,
      dropFromPeak,
      slope,
      volRatio,
      volContracted:   volRatio < 0.70,
      tighteningAtEnd
    };
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 3 — CLASSIFY TYPE
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Names the pattern.
   *
   * Priority order (strongest first):
   *   HIGH_TIGHT_FLAG  — Minervini's most powerful: 90%+ pole + ≤15% range
   *   TIGHT_FLAG       — ≤10% range + ≤35% pullback of pole
   *   BULL_FLAG        — ≤50% pullback + flat/slightly-down slope
   *   BASE             — wider but still within 25% range (valid for large-caps)
   *   CONSOLIDATION    — something is happening but doesn't fit cleaner labels
   */
  classifyType(pole, flag) {
    // Hard cap for ALL flag classes: pullback must stay within 20% of the peak
    // in PRICE terms (trader's rule — "mild pullback regardless of pole size").
    // Deeper than 20% = character change / base-in-progress, not a flag.
    if (flag.dropFromPeak > 0.20)                              return 'CONSOLIDATION';

    if (pole.gain >= 0.90 && flag.range <= 0.15)              return 'HIGH_TIGHT_FLAG';
    if (flag.range   <= 0.10 && flag.pullback <= 0.35)        return 'TIGHT_FLAG';
    if (flag.pullback <= 0.50 && flag.slope   <= 0.003)       return 'BULL_FLAG';
    if (flag.range   <= 0.25)                                  return 'BASE';
    return 'CONSOLIDATION';
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // STEP 4 — SCORE THE PATTERN (0 → 1)
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Weighted quality score.
   *
   * Component weights:
   *   Pole strength       max 0.25  (bigger pole = higher quality)
   *   Flag tightness      max 0.30  (tighter range = less noise = better setup)
   *   Volume contraction  max 0.20  (lower vol in flag = supply absorbed)
   *   Pullback orderliness max 0.15 (shallow, controlled pullback)
   *   Tightening at end   max 0.10  (squeeze building = breakout imminent)
   */
  scorePattern(pole, flag, type) {
    let s = 0;

    // 1. Pole strength (max 0.25)
    if (type === 'HIGH_TIGHT_FLAG') {
      s += Math.min(0.25, 0.15 + (pole.gain - 0.90) * 0.10);
    } else {
      s += Math.min(0.20, 0.04 + pole.gain * 0.20);
    }

    // 2. Flag tightness (max 0.30)
    if      (flag.range <= 0.05) s += 0.30;
    else if (flag.range <= 0.08) s += 0.24;
    else if (flag.range <= 0.12) s += 0.17;
    else if (flag.range <= 0.18) s += 0.09;
    else if (flag.range <= 0.25) s += 0.03;

    // 3. Volume contraction vs pole average (max 0.20)
    if      (flag.volRatio < 0.35) s += 0.20;
    else if (flag.volRatio < 0.50) s += 0.15;
    else if (flag.volRatio < 0.65) s += 0.10;
    else if (flag.volRatio < 0.80) s += 0.05;

    // 4. Orderly pullback depth (max 0.15)
    if      (flag.pullback < 0.20) s += 0.15;
    else if (flag.pullback < 0.30) s += 0.10;
    else if (flag.pullback < 0.40) s += 0.05;

    // 5. Squeeze-in-progress: tightening at end (max 0.10)
    if (flag.tighteningAtEnd) s += 0.10;

    return Math.min(1.0, s);
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Is current price within 3% of the flag high?
   * If yes, a breakout attempt is imminent.
   */
  isNearBreakout(flag, currentPrice) {
    return flag && flag.high > 0 && (flag.high - currentPrice) / flag.high <= 0.03;
  }

  /**
   * Normalised linear regression slope: % change per bar relative to mean price.
   * Positive = drifting up, negative = drifting down, near-zero = flat.
   */
  _calcSlope(prices) {
    const n = prices.length;
    if (n < 2) return 0;
    const xBar = (n - 1) / 2;
    const yBar = prices.reduce((s, p) => s + p, 0) / n;
    let num = 0, den = 0;
    for (let i = 0; i < n; i++) {
      num += (i - xBar) * (prices[i] - yBar);
      den += (i - xBar) ** 2;
    }
    return den !== 0 ? (num / den) / yBar : 0;
  }
}

module.exports = { FlagPatternDetector };
