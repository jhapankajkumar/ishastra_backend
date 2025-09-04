/**
 * --------------------------------------------------------------------------
 * Ishastra — Signal Stability Manager (SSM) • Swing Simple Mode v1.0
 * Authored by: GPT-5 Thinking (OpenAI) • 2025-09-04
 * --------------------------------------------------------------------------
 * Purpose:
 *   A lean, deterministic anti-thrashing layer for 2–6 week swing trading.
 *   Focuses on: (1) ATR-anchored hysteresis, (2) BUY latching with origin,
 *   (3) cooldown after flips, and (4) time-based expiry if no progress.
 *
 * Design principles:
 *   - Stable > reactive. Use ATR multiples, not dollar ticks.
 *   - Sticky BUY: anchor to latchOriginPrice/ATR until clear invalidation.
 *   - Simplicity > cleverness. No grade/score gymnastics by default.
 *   - Deterministic output with small, bounded confidence adjustments.
 *
 * Public contract (unchanged):
 *   stabilizeSignal(symbol, rawAnalysis, dailyData, currentPrice, systemId)
 *
 * Returned fields (superset of rawAnalysis):
 *   action, confidence, reasoning, readiness {state,factors,canExecute,...},
 *   latched, latchOriginPrice, latchOriginATR, latchIndex,
 *   cooldownActive, barsSinceLatch, atrContext {atr, atrMultiples{...}},
 *   stabilized (boolean), stabilizationReason (string)
 * --------------------------------------------------------------------------
 */

class SignalStabilityManager {
  constructor(config = {}) {
    // Defaults tuned for daily bars / 2–6 week holds
    this.cfg = {
      atrPeriod: 14,
      promoteATR: 0.6,         // price improvement ≥ 0.6 ATR to upgrade WATCH→BUY
      demoteATR: 0.9,          // price deterioration ≥ 0.9 ATR to downgrade BUY→WATCH
      stopATR: 2.0,            // hard invalidation for BUY when -2.0 ATR from latch origin
      progressATR: 0.5,        // require +0.5 ATR progress within expiryBars
      expiryBars: 10,          // if no progress in N bars after BUY latch → WATCH
      cooldownBars: 3,         // freeze headline action for N bars after any flip
      minBuyConfidence: 0.60,  // floor for latched BUY confidence
      maxWatchConfidence: 0.85 // cap when stabilizing WATCH upward
    };
    Object.assign(this.cfg, config);

    this.signalHistory = new Map(); // key -> array of states
    this.historyLimit = 12;         // keep last 12 observations per key
  }

  /**
   * Main entry — stabilizes the raw system signal.
   */
  stabilizeSignal(symbol, rawAnalysis, dailyData, currentPrice, systemId) {
    const key = `${symbol}_${systemId}`;
    const prev = this._last(key);

    const atr = this._atrWilder(dailyData, this.cfg.atrPeriod) ?? this._atrSimple(dailyData.slice(-this.cfg.atrPeriod));
    const lastBarIndex = Math.max(0, (dailyData?.length || 1) - 1);
    const lastBar = dailyData?.[lastBarIndex] || { volume: 0, high: currentPrice, low: currentPrice, close: currentPrice, date: undefined };

    // Normalize raw fields
    let signal = {
      action: rawAnalysis?.action || 'WATCH',
      confidence: this._clamp(rawAnalysis?.confidence ?? 0.50, 0, 1),
      reasoning: rawAnalysis?.reasoning || '',
      factors: rawAnalysis?.factors || {},
      stabilized: false,
      stabilizationReason: ''
    };

    // 0) Cooldown: if within cooldown after a flip, freeze headline action
    const cooldownActive = this._isInCooldown(prev, lastBarIndex);
    if (cooldownActive && prev) {
      signal = {
        ...signal,
        action: prev.action,
        confidence: Math.max(signal.confidence * 0.98, prev.confidence * 0.95), // tiny decay while cooling
        reasoning: this._append(signal.reasoning, `[COOLDOWN: holding ${prev.action}]`),
        cooledFromAction: rawAnalysis?.action || 'WATCH'
      };
    }

    // 1) ATR-anchored hysteresis (promotion/demotion bands)
    signal = this._applyHysteresis(signal, prev, currentPrice, atr);

    // 2) BUY latching with origin (sticky until true invalidation)
    signal = this._applyBuyLatching(signal, prev, currentPrice, atr, dailyData, lastBarIndex);

    // 3) Readiness (execution feasibility) — separate from decision stability
    signal = this._readiness(signal, lastBar, dailyData);

    // 4) Attach ATR context
    signal = {
      ...signal,
      atrContext: {
        atr,
        atrMultiples: {
          smallMove: 0.25 * atr,
          significantMove: 0.5 * atr,
          majorMove: 1.0 * atr,
          stopLevel: this.cfg.stopATR * atr
        }
      },
      cooldownActive
    };

    // 5) Persist state (flip detection, latch origin capture)
    const toPersist = this._preparePersist(signal, prev, currentPrice, atr, lastBarIndex, key);
    this._push(key, toPersist);

    return toPersist;
  }

  // ---------------------------
  // Core layers (simple & robust)
  // ---------------------------

  _applyHysteresis(signal, prev, price, atr) {
    if (!prev) return signal;

    // Demotion guard: BUY → WATCH/AVOID requires ≥ demoteATR * ATR decline from LATCH ORIGIN (not from last tick)
    if (prev.action === 'BUY' && (signal.action === 'WATCH' || signal.action === 'AVOID')) {
      const originPrice = prev.latchOriginPrice ?? prev.price;
      const decline = (originPrice - price);
      const need = this.cfg.demoteATR * atr;

      if (decline < need) {
        return {
          ...signal,
          action: 'BUY',
          confidence: Math.max(this.cfg.minBuyConfidence, Math.min(1, (signal.confidence || 0.6) - 0.05)),
          stabilized: true,
          stabilizationReason: `HYSTERESIS: decline ${decline.toFixed(2)} < ${need.toFixed(2)} (${this.cfg.demoteATR}×ATR)`
        };
      }
    }

    // Promotion guard: WATCH → BUY requires ≥ promoteATR * ATR improvement from previous observed price
    if (prev.action === 'WATCH' && signal.action === 'BUY') {
      const improvement = (price - prev.price);
      const need = this.cfg.promoteATR * atr;

      if (improvement < need) {
        return {
          ...signal,
          action: 'WATCH',
          confidence: Math.min(this.cfg.maxWatchConfidence, Math.max(prev.confidence ?? 0.5, (signal.confidence || 0.6) + 0.03)),
          stabilized: true,
          stabilizationReason: `HYSTERESIS: improvement ${improvement.toFixed(2)} < ${need.toFixed(2)} (${this.cfg.promoteATR}×ATR)`
        };
      }
    }

    return signal;
    }

  _applyBuyLatching(signal, prev, price, atr, data, barIndex) {
    // If we weren't previously BUY, only latch when BUY now (persist handled later)
    if (!prev || prev.action !== 'BUY') return signal;

    const originPrice = prev.latchOriginPrice ?? prev.price;
    const originATR = prev.latchOriginATR ?? atr;

    // Invalidation 1: hard stop from origin (e.g., -2.0 ATR)
    const stopLevel = originPrice - this.cfg.stopATR * originATR;
    if (price < stopLevel) {
      return {
        ...signal,
        action: 'WATCH',
        confidence: Math.min(signal.confidence, 0.55),
        latched: false,
        latchCleared: true,
        latchClearReason: `STOP: price ${price.toFixed(2)} < stop ${stopLevel.toFixed(2)} (${this.cfg.stopATR}×ATR from origin)`
      };
    }

    // Invalidation 2: time-based expiry if no progress after N bars since latch
    const barsSinceLatch = Math.max(0, barIndex - (prev.latchIndex ?? barIndex));
    if (barsSinceLatch >= this.cfg.expiryBars) {
      const hiSinceLatch = this._maxHighSinceIndex(data, prev.latchIndex ?? barIndex);
      const progress = (hiSinceLatch - originPrice);
      const need = this.cfg.progressATR * originATR;

      if (progress < need) {
        return {
          ...signal,
          action: 'WATCH',
          confidence: Math.min(signal.confidence, 0.55),
          latched: false,
          latchCleared: true,
          latchClearReason: `EXPIRY: no +${this.cfg.progressATR}×ATR progress in ${this.cfg.expiryBars} bars`
        };
      }
    }

    // Otherwise keep BUY latched (do NOT double-decay if already stabilized earlier)
    return {
      ...signal,
      action: 'BUY',
      latched: true,
      latchOriginPrice: originPrice,
      latchOriginATR: originATR,
      barsSinceLatch
    };
  }

  _readiness(signal, lastBar, data) {
    // Separate “can we execute now?” — does not change the headline action.
    const avgVol = this._avgVol(data, 20);
    const vol = lastBar?.volume ?? 0;
    const spreadPct = lastBar?.low > 0 ? (lastBar.high - lastBar.low) / lastBar.low : 0;

    // Severity ladder
    let state = 'READY';
    const reasons = [];

    if (vol < 0.7 * avgVol) {
      state = 'NOT_READY';
      reasons.push('Low volume (<70% of 20-day avg)');
    } else if (vol < avgVol) {
      state = 'CAUTION';
      reasons.push('Subpar volume (<100% of 20-day avg)');
    }

    if (spreadPct > 0.08) {
      state = 'NOT_READY';
      reasons.push('Wide intraday range (>8%)');
    } else if (spreadPct > 0.05) {
      // upgrade to at least CAUTION if not already NOT_READY
      if (state !== 'NOT_READY') state = 'CAUTION';
      reasons.push('Elevated intraday range (>5%)');
    }

    return {
      ...signal,
      readiness: {
        state,
        factors: reasons,
        canExecute: state === 'READY',
        timestamp: new Date().toISOString()
      }
    };
  }

  // ---------------------------
  // Persistence & helpers
  // ---------------------------

  _preparePersist(signal, prev, price, atr, barIndex, key) {
    const flip = prev && prev.action !== signal.action;
    const becameBuy = (!prev || prev.action !== 'BUY') && signal.action === 'BUY';

    // Capture/keep latch origin on BUY
    let latchOriginPrice = signal.latchOriginPrice ?? prev?.latchOriginPrice;
    let latchOriginATR = signal.latchOriginATR ?? prev?.latchOriginATR;
    let latchIndex = signal.latchIndex ?? prev?.latchIndex;

    if (becameBuy) {
      latchOriginPrice = price;
      latchOriginATR = atr;
      latchIndex = barIndex;
    }

    const lastFlipIndex = flip ? barIndex : (prev?.lastFlipIndex ?? barIndex);

    return {
      ...signal,
      price,
      symbol: key.split('_')[0],
      systemId: key.split('_')[1],
      timestamp: new Date().toISOString(),
      lastFlipIndex,
      latchOriginPrice,
      latchOriginATR,
      latchIndex
    };
  }

  _isInCooldown(prev, currentIndex) {
    if (!prev || typeof prev.lastFlipIndex !== 'number') return false;
    return (currentIndex - prev.lastFlipIndex) < this.cfg.cooldownBars;
  }

  _maxHighSinceIndex(data, startIdx) {
    if (!data || data.length === 0) return 0;
    const from = Math.max(0, startIdx ?? (data.length - 1));
    let mx = -Infinity;
    for (let i = from; i < data.length; i++) {
      const h = data[i]?.high ?? -Infinity;
      if (h > mx) mx = h;
    }
    return mx === -Infinity ? 0 : mx;
  }

  _avgVol(data, lookback = 20) {
    if (!data || data.length === 0) return 0;
    const slice = data.slice(-lookback);
    const sum = slice.reduce((acc, d) => acc + (d?.volume ?? 0), 0);
    return slice.length ? (sum / slice.length) : 0;
  }

  _atrSimple(data) {
    if (!data || data.length < 2) return 2.0;
    let sum = 0;
    for (let i = 1; i < data.length; i++) {
      const h = data[i].high, l = data[i].low, pc = data[i - 1].close;
      const tr = Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc));
      sum += tr;
    }
    return sum / (data.length - 1);
  }

  _atrWilder(data, period = 14) {
    if (!data || data.length < period + 1) return null; // not enough data to seed
    // Seed ATR with simple average of first 'period' TRs
    const trs = [];
    for (let i = 1; i < data.length; i++) {
      const h = data[i].high, l = data[i].low, pc = data[i - 1].close;
      trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
    }
    const seed = trs.slice(0, period).reduce((a, b) => a + b, 0) / period;
    let atr = seed;
    for (let i = period; i < trs.length; i++) {
      atr = ((atr * (period - 1)) + trs[i]) / period;
    }
    return atr;
  }

  _clamp(x, lo, hi) {
    return Math.max(lo, Math.min(hi, x));
  }

  _append(base, addon) {
    if (!addon) return base || '';
    if (!base) return addon;
    return `${base} ${addon}`;
  }

  _key(symbol, systemId) {
    return `${symbol}_${systemId}`;
  }

  _last(key) {
    const arr = this.signalHistory.get(key);
    return (arr && arr.length) ? arr[arr.length - 1] : null;
  }

  _push(key, state) {
    if (!this.signalHistory.has(key)) this.signalHistory.set(key, []);
    const arr = this.signalHistory.get(key);
    arr.push(state);
    if (arr.length > this.historyLimit) arr.shift();
  }
}

module.exports = { SignalStabilityManager };
