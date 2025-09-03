/**
 * Signal Stability Manager - Anti-Thrashing for Trading Systems
 * 
 * Implements comprehensive signal stability to prevent thrashing from minor price movements.
 * Based on hysteresis, latching, and ATR-relative thresholds.
 * 
 * Key Features:
 * 1. Two-sided thresholds (promote vs demote bands)
 * 2. Signal latching (sticky BUY until clear invalidation)
 * 3. ATR-relative tolerances (not fixed dollar amounts)
 * 4. Score buffers for grade boundaries
 * 5. Separate decision vs readiness states
 * 6. Historical state memory
 * 
 * Usage:
 * - Trading systems call stabilizeSignal() instead of direct decision logic
 * - Manager tracks previous states and applies stability rules
 * - Returns stable signal that won't flip on minor price noise
 */

class SignalStabilityManager {
  constructor() {
    this.signalHistory = new Map(); // symbol -> SignalState
    this.historyLimit = 10; // Keep last 10 signals per symbol
  }

  /**
   * Stabilize trading signal using comprehensive anti-thrashing logic
   * @param {string} symbol - Stock symbol
   * @param {Object} rawAnalysis - Raw system analysis (unstabilized)
   * @param {Array} dailyData - Historical price data
   * @param {number} currentPrice - Current stock price
   * @param {string} systemId - System identifier
   * @returns {Object} Stabilized signal with anti-thrashing protection
   */
  stabilizeSignal(symbol, rawAnalysis, dailyData, currentPrice, systemId) {
    const atr = this.calculateATR(dailyData.slice(-14));
    const previousState = this.getLastState(symbol, systemId);
    
    // Apply comprehensive stability layers
    const stabilizedSignal = this.applyStabilityLayers(
      rawAnalysis, 
      previousState, 
      currentPrice, 
      atr,
      dailyData
    );
    
    // Update signal history
    this.updateSignalHistory(symbol, systemId, stabilizedSignal, currentPrice);
    
    return stabilizedSignal;
  }

  /**
   * Apply all 6 stability layers in sequence
   */
  applyStabilityLayers(rawAnalysis, previousState, currentPrice, atr, dailyData) {
    let signal = { ...rawAnalysis };
    
    // Layer 1: Already implemented (close-only decisions)
    // Layer 2: Two-sided thresholds (hysteresis bands)
    signal = this.applyHysteresisBands(signal, previousState, currentPrice, atr);
    
    // Layer 3: Signal latching (sticky BUY)
    signal = this.applySignalLatching(signal, previousState, currentPrice, atr, dailyData);
    
    // Layer 4: Score buffers for grade thresholds  
    signal = this.applyScoreBuffers(signal, previousState);
    
    // Layer 5: ATR-relative tolerance everywhere
    signal = this.applyATRTolerance(signal, previousState, currentPrice, atr);
    
    // Layer 6: Separate decision vs readiness
    signal = this.calculateReadinessState(signal, currentPrice, atr, dailyData);
    
    return signal;
  }

  /**
   * Layer 2: Apply two-sided thresholds (hysteresis bands)
   * Different thresholds for promotion vs demotion
   */
  applyHysteresisBands(signal, previousState, currentPrice, atr) {
    if (!previousState) return signal; // First signal, no hysteresis
    
    const prevAction = previousState.action;
    const currentAction = signal.action;
    
    // Define hysteresis bands - wider thresholds to prevent noise-based flipping
    const promotionBuffer = atr * 0.50; // Need to exceed by 0.5 ATR to promote
    const demotionBuffer = atr * 0.75;  // Need to fall by 0.75 ATR to demote
    
    // BUY → WATCH/AVOID: Require significant deterioration
    if (prevAction === 'BUY' && (currentAction === 'WATCH' || currentAction === 'AVOID')) {
      // Use latch origin price for stable comparison, not last tick price
      const referencePrice = previousState.latchOriginPrice || previousState.price;
      const priceDecline = referencePrice - currentPrice;
      
      if (priceDecline < demotionBuffer) {
        // Price hasn't declined enough - keep BUY but reduce confidence
        return {
          ...signal,
          action: 'BUY',
          confidence: Math.max(0.50, signal.confidence - 0.10),
          reasoning: `${signal.reasoning} [STABILIZED: Insufficient price decline for demotion]`,
          stabilized: true,
          stabilizationReason: `Hysteresis: Price decline $${priceDecline.toFixed(2)} < required $${demotionBuffer.toFixed(2)}`
        };
      }
    }
    
    // WATCH → BUY: Require significant improvement  
    if (prevAction === 'WATCH' && currentAction === 'BUY') {
      // Use previous price for comparison (not latch origin for promotions)
      const priceImprovement = currentPrice - previousState.price;
      
      if (priceImprovement < promotionBuffer) {
        // Price hasn't improved enough - keep WATCH but increase confidence
        return {
          ...signal,
          action: 'WATCH',
          confidence: Math.min(0.85, signal.confidence + 0.05),
          reasoning: `${signal.reasoning} [STABILIZED: Building momentum, await confirmation]`,
          stabilized: true,
          stabilizationReason: `Hysteresis: Price improvement $${priceImprovement.toFixed(2)} < required $${promotionBuffer.toFixed(2)}`
        };
      }
    }
    
    return signal; // No hysteresis applied
  }

  /**
   * Layer 3: Apply signal latching (sticky BUY)
   * Keep BUY latched until clear invalidation
   */
  applySignalLatching(signal, previousState, currentPrice, atr, dailyData) {
    if (!previousState || previousState.action !== 'BUY') return signal;
    
    // Check invalidation conditions for latched BUY
    const invalidationConditions = this.checkBuyInvalidation(
      signal, previousState, currentPrice, atr, dailyData
    );
    
    if (!invalidationConditions.shouldInvalidate) {
      // Keep BUY latched - preserve or set latch origin price
      const latchOriginPrice = previousState.latchOriginPrice || previousState.price;
      const latchOriginATR = previousState.latchOriginATR || atr;
      
      return {
        ...signal,
        action: 'BUY',
        confidence: Math.max(0.60, signal.confidence * 0.95), // Slight confidence decay
        reasoning: `${signal.reasoning} [LATCHED: BUY signal maintained]`,
        latched: true,
        latchReason: 'No clear invalidation criteria met',
        latchOriginPrice: latchOriginPrice,
        latchOriginATR: latchOriginATR
      };
    }
    
    // Clear invalidation detected
    return {
      ...signal,
      reasoning: `${signal.reasoning} [LATCH CLEARED: ${invalidationConditions.reason}]`,
      latchCleared: true,
      latchClearReason: invalidationConditions.reason
    };
  }

  /**
   * Check if BUY signal should be invalidated (clear the latch)
   */
  checkBuyInvalidation(signal, previousState, currentPrice, atr, dailyData) {
    const reasons = [];
    
    // Use latch origin price for stable reference, not moving previous price
    const latchOriginPrice = previousState.latchOriginPrice || previousState.price;
    const latchOriginATR = previousState.latchOriginATR || atr;
    
    // Invalidation 1: Price below stop loss equivalent
    const stopLossLevel = latchOriginPrice - (latchOriginATR * 2.0);
    if (currentPrice < stopLossLevel) {
      reasons.push(`Price $${currentPrice.toFixed(2)} below stop level $${stopLossLevel.toFixed(2)}`);
    }
    
    // Invalidation 2: Significant price deterioration 
    const priceDecline = latchOriginPrice - currentPrice;
    const significantDecline = latchOriginATR * 1.0; // 1.0 ATR decline from origin
    if (priceDecline > significantDecline) {
      reasons.push(`Significant price decline $${priceDecline.toFixed(2)} > $${significantDecline.toFixed(2)}`);
    }
    
    // Invalidation 3: Grade degradation (system-specific)
    if (this.hasSignificantGradeDegradation(signal, previousState)) {
      reasons.push('Significant grade degradation detected');
    }
    
    // Invalidation 4: Multiple consecutive weaker signals
    const recentHistory = this.getRecentSignalHistory(previousState.symbol, previousState.systemId, 3);
    if (this.hasConsistentDegradation(recentHistory, signal)) {
      reasons.push('Consistent signal degradation over multiple bars');
    }
    
    return {
      shouldInvalidate: reasons.length > 0,
      reason: reasons.join('; ')
    };
  }

  /**
   * Layer 4: Apply score buffers for grade thresholds
   * Add buffer zones around grade boundaries
   */
  applyScoreBuffers(signal, previousState) {
    if (!previousState) return signal;
    
    const GRADE_BUFFER = 0.03; // 3% buffer around grade boundaries
    
    // Map grades to numeric values for comparison
    const gradeValues = { 'A+': 95, 'A': 85, 'B+': 75, 'B': 65, 'C': 55, 'D': 45, 'F': 35 };
    
    const currentGrade = signal.factors?.templateGrade || signal.factors?.cascadeGrade || 'F';
    const previousGrade = previousState.factors?.templateGrade || previousState.factors?.cascadeGrade || 'F';
    
    const currentScore = signal.factors?.overallScore || signal.factors?.cascadeScore || 0;
    const previousScore = previousState.factors?.overallScore || previousState.factors?.cascadeScore || 0;
    
    // Check if we're near a grade boundary and apply buffer
    const currentGradeValue = gradeValues[currentGrade] || 35;
    const previousGradeValue = gradeValues[previousGrade] || 35;
    
    // If grade would downgrade and we're within buffer zone, maintain previous grade
    if (currentGradeValue < previousGradeValue) {
      const scoreDifference = Math.abs(currentScore - previousScore);
      
      if (scoreDifference < GRADE_BUFFER) {
        // Within buffer zone - maintain previous grade and action
        return {
          ...signal,
          action: previousState.action,
          confidence: Math.max(0.50, signal.confidence - 0.05),
          reasoning: `${signal.reasoning} [BUFFERED: Grade boundary protection]`,
          buffered: true,
          bufferReason: `Score difference ${(scoreDifference * 100).toFixed(1)}% < ${(GRADE_BUFFER * 100).toFixed(1)}% buffer`
        };
      }
    }
    
    return signal;
  }

  /**
   * Layer 5: Apply ATR-relative tolerance everywhere
   * Replace fixed dollar amounts with ATR-scaled tolerances
   */
  applyATRTolerance(signal, previousState, currentPrice, atr) {
    // This is more of a guideline for the trading systems themselves
    // The key is that all price-based conditions should use ATR multiples
    
    // Add ATR context to the signal for downstream use
    return {
      ...signal,
      atrContext: {
        atr: atr,
        atrMultiples: {
          smallMove: atr * 0.25,   // 0.25 ATR = small move (ignore)
          significantMove: atr * 0.5, // 0.5 ATR = significant  
          majorMove: atr * 1.0,    // 1.0 ATR = major move
          stopLevel: atr * 2.0     // 2.0 ATR = stop loss level
        }
      }
    };
  }

  /**
   * Layer 6: Calculate readiness state (separate from decision)
   * Decision stays stable, readiness can fluctuate
   */
  calculateReadinessState(signal, currentPrice, atr, dailyData) {
    const latest = dailyData[dailyData.length - 1];
    const avgVolume = this.calculateAverageVolume(dailyData.slice(-20));
    
    let readiness = 'READY';
    const readinessFactors = [];
    
    // Volume readiness
    if (latest.volume < avgVolume * 0.7) {
      readiness = 'NOT_READY';
      readinessFactors.push('Low volume');
    }
    
    // Spread readiness (if available)
    const spread = (latest.high - latest.low) / latest.low;
    if (spread > 0.05) { // > 5% daily range = high volatility
      readiness = 'CAUTION';
      readinessFactors.push('High intraday volatility');
    }
    
    // Time-based readiness (market hours, etc.)
    // This would integrate with real-time market data
    
    return {
      ...signal,
      readiness: {
        state: readiness,
        factors: readinessFactors,
        canExecute: readiness === 'READY',
        timestamp: new Date().toISOString()
      }
    };
  }

  // Helper Methods
  
  getLastState(symbol, systemId) {
    const key = `${symbol}_${systemId}`;
    const history = this.signalHistory.get(key);
    return history && history.length > 0 ? history[history.length - 1] : null;
  }

  updateSignalHistory(symbol, systemId, signal, currentPrice) {
    const key = `${symbol}_${systemId}`;
    
    if (!this.signalHistory.has(key)) {
      this.signalHistory.set(key, []);
    }
    
    const history = this.signalHistory.get(key);
    
    // Add current state
    history.push({
      ...signal,
      price: currentPrice,
      timestamp: new Date().toISOString(),
      symbol: symbol,
      systemId: systemId
    });
    
    // Trim history to limit
    if (history.length > this.historyLimit) {
      history.shift();
    }
  }

  getRecentSignalHistory(symbol, systemId, count = 3) {
    const key = `${symbol}_${systemId}`;
    const history = this.signalHistory.get(key) || [];
    return history.slice(-count);
  }

  hasSignificantGradeDegradation(current, previous) {
    const gradeWeights = { 'A+': 6, 'A': 5, 'B+': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 };
    
    const currentGrade = current.factors?.templateGrade || current.factors?.cascadeGrade || 'F';
    const previousGrade = previous.factors?.templateGrade || previous.factors?.cascadeGrade || 'F';
    
    const currentWeight = gradeWeights[currentGrade] || 0;
    const previousWeight = gradeWeights[previousGrade] || 0;
    
    // Significant degradation = drop by 2+ grade levels
    return (previousWeight - currentWeight) >= 2;
  }

  hasConsistentDegradation(history, current) {
    if (history.length < 2) return false;
    
    // Check if confidence has been declining consistently
    const confidences = history.map(h => h.confidence).concat(current.confidence);
    
    let decliningCount = 0;
    for (let i = 1; i < confidences.length; i++) {
      if (confidences[i] < confidences[i-1]) {
        decliningCount++;
      }
    }
    
    return decliningCount >= 2; // 2+ consecutive declines
  }

  calculateATR(data) {
    if (!data || data.length < 2) return 2.0; // Default
    
    let atrSum = 0;
    for (let i = 1; i < data.length; i++) {
      const high = data[i].high;
      const low = data[i].low;
      const prevClose = data[i-1].close;
      
      const tr = Math.max(
        high - low,
        Math.abs(high - prevClose),
        Math.abs(low - prevClose)
      );
      
      atrSum += tr;
    }
    
    return atrSum / (data.length - 1);
  }

  calculateAverageVolume(data) {
    if (!data || data.length === 0) return 1000000; // Default
    return data.reduce((sum, d) => sum + d.volume, 0) / data.length;
  }
}

module.exports = { SignalStabilityManager };
