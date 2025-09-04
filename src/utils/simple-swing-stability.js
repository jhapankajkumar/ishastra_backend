/**
 * Simple Swing Trading Stability Manager
 * 
 * Purpose: Prevent signal thrashing for 2-6 week swing trades
 * Philosophy: 95% of stability benefits with 5% of the complexity
 * 
 * Key Rules:
 * 1. No intraday signal changes (wait for bar close)
 * 2. 3-bar cooldown after any signal flip
 * 3. Hard stop invalidation only (close < stop level)
 */

class SimpleSwingStability {
  constructor(barsCooldown = 3) {
    this.last = new Map(); // symbol -> { action, barIndex, stopLevel }
    this.cooldown = barsCooldown;
  }

  /**
   * Stabilize signal for swing trading
   * @param {string} symbol - Stock symbol
   * @param {Object} rawSignal - Raw system signal {action, confidence, reasoning, stopLoss}
   * @param {number} barIndex - Current bar index (days since start)
   * @param {number} currentPrice - Current close price
   * @param {boolean} isBarClosed - Whether bar is closed (default: true for EOD)
   * @returns {Object} Stabilized signal
   */
  stabilize(symbol, rawSignal, barIndex, currentPrice, isBarClosed = true) {
    const prev = this.last.get(symbol);
    
    // Rule 1: Don't flip signals intrabar
    if (!isBarClosed && prev) {
      return { 
        ...rawSignal, 
        action: prev.action, 
        stabilized: true,
        stabilizationReason: 'Waiting for bar close'
      };
    }

    // Rule 2: Hard stop invalidation (only way to exit BUY)
    if (prev && prev.action === 'BUY' && prev.stopLevel && currentPrice < prev.stopLevel) {
      const result = {
        ...rawSignal,
        action: 'WATCH',
        confidence: Math.min(rawSignal.confidence || 0.5, 0.4),
        stabilized: true,
        stabilizationReason: `Hard stop triggered: ${currentPrice.toFixed(2)} < ${prev.stopLevel.toFixed(2)}`
      };
      
      if (isBarClosed) {
        this.last.set(symbol, { 
          action: result.action, 
          barIndex,
          stopLevel: rawSignal.stopLoss || null
        });
      }
      
      return result;
    }

    // Rule 3: Cooldown after any headline flip
    if (prev && prev.action !== rawSignal.action) {
      const barsSince = barIndex - (prev.barIndex || 0);
      if (barsSince < this.cooldown) {
        return { 
          ...rawSignal, 
          action: prev.action, 
          stabilized: true,
          stabilizationReason: `Cooldown active: ${this.cooldown - barsSince} bars remaining`
        };
      }
    }

    // Accept the new signal
    const result = { 
      ...rawSignal, 
      stabilized: !!prev,
      stabilizationReason: prev ? 'Signal confirmed' : 'Initial signal'
    };

    // Persist state on bar close
    if (isBarClosed) {
      this.last.set(symbol, { 
        action: result.action, 
        barIndex,
        stopLevel: rawSignal.stopLoss || null
      });
    }

    return result;
  }

  /**
   * Clear history for a symbol (useful for testing)
   */
  clearHistory(symbol) {
    this.last.delete(symbol);
  }

  /**
   * Get current state for a symbol
   */
  getState(symbol) {
    return this.last.get(symbol) || null;
  }
}

module.exports = { SimpleSwingStability };
