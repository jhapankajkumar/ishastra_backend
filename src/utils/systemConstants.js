/**
 * Trading System Constants
 * Canonical system identifiers and aliases for consistency across the application
 */

const SYSTEM_IDS = {
  TRIPLE_SCREEN: 'triple_screen',
  MINERVINI_SEPA: 'sepa_method',
  CAN_SLIM_CUP_HANDLE: 'cup_handle',
  // BB_SQUEEZE_BREAKOUT: 'bb_squeeze_breakout',
  // KELTNER_BREAKOUT: 'keltner_breakout',
  // DARVAS_BREAKOUT: 'darvas_breakout',
  // DONCHIAN_BREAKOUT: 'donchian_breakout',
  RSI_MEAN_REVERSION: 'rsi_mean',
  MACD_DIVERGENCE: 'divergence',
  ELDER_IMPULSE: 'impulse',
};

/**
 * Normalize system key aliases to canonical IDs
 * @param {string} key - Raw system identifier 
 * @returns {string} Canonical system ID
 */
function normalizeSystemKey(key) {
  const normalized = (key || '').toLowerCase().replace(/[_-]/g, '');
  
  // Triple Screen aliases (check both with and without underscore removal)
  if (['triplescreen', 'triplescreen', 'eldertriple', 'eldertriplescreen', 'elder_triple_screen'].includes(normalized) ||
      key === 'elder_triple_screen') {
    return SYSTEM_IDS.TRIPLE_SCREEN;
  }
  
  // SEPA aliases (check both with and without underscore removal) 
  if (['sepa', 'sepamethod', 'sepamethod', 'minervini', 'minervnisepa', 'sepa_method'].includes(normalized) ||
      key === 'sepa_method') {
    return SYSTEM_IDS.MINERVINI_SEPA;
  }
  
  // Bollinger Squeeze aliases
  if (['bollinger_squeeze', 'bb_squeeze', 'bb_squeeze_breakout', 'bollingersqueeze', 'squeeze'].includes(normalized)) {
    return SYSTEM_IDS.BB_SQUEEZE_BREAKOUT;
  }
  
  // Darvas aliases
  if (['darvas', 'darvas_breakout', 'darvasbreakout', 'darvasbox'].includes(normalized)) {
    return SYSTEM_IDS.DARVAS_BREAKOUT;
  }
  
  // Donchian aliases
  if (['donchian', 'donchian_breakout', 'donchianbreakout', 'turtle', 'turtletrading'].includes(normalized)) {
    return SYSTEM_IDS.DONCHIAN_BREAKOUT;
  }
  
  // RSI Mean Reversion aliases
  if (['rsi_mean', 'rsi_mean_reversion', 'mean_reversion', 'rsimean', 'meanreversion'].includes(normalized)) {
    return SYSTEM_IDS.RSI_MEAN_REVERSION;
  }
  
  // Divergence aliases
  // MACD Divergence aliases
  if (['divergence', 'macd_divergence', 'macddivergence', 'bull_bear_divergence', 'bullbeardivergence'].includes(normalized)) {
    return SYSTEM_IDS.MACD_DIVERGENCE;
  }
  
  // Keltner aliases
  if (['keltner', 'keltner_breakout', 'keltnerbreakout', 'kc'].includes(normalized)) {
    return SYSTEM_IDS.KELTNER_BREAKOUT;
  }
  
  // Elder Impulse aliases
  if (['impulse', 'elder_impulse', 'elderimpulse', 'impulse_system'].includes(normalized)) {
    return SYSTEM_IDS.ELDER_IMPULSE;
  }
  
  // CAN SLIM aliases
  if (['cup_handle', 'can_slim_cup_handle', 'canslim', 'cuphandle', 'cup_and_handle'].includes(normalized)) {
    return SYSTEM_IDS.CAN_SLIM_CUP_HANDLE;
  }
  
  // Return original if no match found
  return key;
}

/**
 * Check if a system requires weekly data
 * @param {string} systemId - System identifier
 * @returns {boolean} Whether weekly data is required
 */
function requiresWeeklyData(systemId) {
  return systemId === SYSTEM_IDS.TRIPLE_SCREEN;
}

/**
 * Check if a system requires intraday data
 * @param {string} systemId - System identifier  
 * @returns {boolean} Whether intraday data is required
 */
function requiresIntradayData(systemId) {
  return systemId === SYSTEM_IDS.TRIPLE_SCREEN;
}

/**
 * Get data requirements for a system
 * @param {string} systemId - System identifier
 * @returns {Object} Data requirements
 */
function getSystemRequirements(systemId) {
  return {
    needsWeekly: requiresWeeklyData(systemId),
    needsIntraday: requiresIntradayData(systemId),
    allowsDailyOnly: !requiresWeeklyData(systemId)
  };
}
const defaultLookBackPeriod = "2y"; // Use string format for consistency with API requests

/**
 * Professional System Weighting Tiers
 * Hierarchical classification based on system comprehensiveness and statistical reliability
 */
const SYSTEM_TIERS = {
  // TIER 1: Complete Multi-Factor Trading Systems (highest confidence thresholds, highest multipliers)
  sepa_method: {
    tier: 1,
    type: 'COMPLETE_SYSTEM',
    name: 'Minervini SEPA',
    description: '8-point comprehensive institutional-grade system',
    high_confidence: { threshold: 0.7, multiplier: 1.5 },
    medium_confidence: { threshold: 0.6, multiplier: 1.2 },
    low_confidence: { threshold: 0.5, multiplier: 0.9 }
  },
  triple_screen: {
    tier: 1,
    type: 'COMPLETE_SYSTEM', 
    name: 'Elder Triple Screen',
    description: 'Multi-timeframe system with 3 confirmation levels',
    high_confidence: { threshold: 0.7, multiplier: 1.4 },
    medium_confidence: { threshold: 0.6, multiplier: 1.1 },
    low_confidence: { threshold: 0.5, multiplier: 0.8 }
  },
  cup_handle: {
    tier: 1,
    type: 'PATTERN_SYSTEM',
    name: 'Cup-with-Handle',
    description: 'Pattern system with volume and breakout confirmation',
    high_confidence: { threshold: 0.75, multiplier: 1.3 },
    medium_confidence: { threshold: 0.6, multiplier: 1.0 },
    low_confidence: { threshold: 0.5, multiplier: 0.7 }
  },
  
  // TIER 2: Indicator-Based Systems (require higher confidence for same weight)
  divergence: {
    tier: 2,
    type: 'INDICATOR_SYSTEM',
    name: 'MACD Divergence',
    description: 'Powerful momentum divergence indicator (single-factor)',
    high_confidence: { threshold: 0.85, multiplier: 1.2 },
    medium_confidence: { threshold: 0.75, multiplier: 0.9 },
    low_confidence: { threshold: 0.6, multiplier: 0.6 }
  },
  rsi_mean: {
    tier: 2,
    type: 'INDICATOR_SYSTEM',
    name: 'RSI Mean Reversion',
    description: 'Mean reversion in oversold/overbought conditions (single-factor)',
    high_confidence: { threshold: 0.8, multiplier: 1.1 },
    medium_confidence: { threshold: 0.7, multiplier: 0.8 },
    low_confidence: { threshold: 0.6, multiplier: 0.5 }
  },
  
  // TIER 3: Experimental/Future Systems (conservative weighting)
  // Reserved for future system implementations
};

/**
 * Get system weight based on confidence and tier classification
 * @param {Object} result - System analysis result with confidence and system ID
 * @returns {number} Weighted confidence score
 */
function getSystemWeight(result) {
  const { confidence, system } = result;
  const baseWeight = confidence;
  
  // Get system configuration
  const systemConfig = SYSTEM_TIERS[system];
  
  if (!systemConfig) {
    // TIER 4: Default conservative weight for unclassified or experimental systems
    return baseWeight * 0.6;
  }
  
  // Determine confidence tier and apply appropriate multiplier
  if (confidence >= systemConfig.high_confidence.threshold) {
    return baseWeight * systemConfig.high_confidence.multiplier;
  } else if (confidence >= systemConfig.medium_confidence.threshold) {
    return baseWeight * systemConfig.medium_confidence.multiplier;
  } else if (confidence >= systemConfig.low_confidence.threshold) {
    return baseWeight * systemConfig.low_confidence.multiplier;
  } else {
    // Below minimum threshold - very conservative weight
    return baseWeight * 0.3;
  }
}

/**
 * Check if system is a complete multi-factor system (Tier 1)
 * @param {string} systemId - System identifier
 * @returns {boolean} True if complete system
 */
function isCompleteSystem(systemId) {
  const config = SYSTEM_TIERS[systemId];
  return config && config.tier === 1;
}

/**
 * Get high conviction threshold for system type
 * @param {string} systemId - System identifier
 * @returns {number} Confidence threshold for high conviction signals
 */
function getHighConvictionThreshold(systemId) {
  const config = SYSTEM_TIERS[systemId];
  if (!config) return 0.85; // Default high threshold for unknown systems
  
  return config.tier === 1 ? 0.75 : 0.85; // Complete systems can override at 75%, indicators need 85%
}

/**
 * Professional Watchlist Scoring and Filtering System
 * Institutional-grade filters to ensure only high-quality signals reach watchlist
 */
const WATCHLIST_FILTERS = {
  // TIER 1: Minimum Entry Thresholds (MANDATORY - No exceptions)
  minimum_confidence: {
    BUY: 0.70,           // 68% minimum confidence for BUY signals
    WATCH: 0.65,         // 65% minimum confidence for WATCH signals  
    REJECT_BELOW: 0.60   // Below 60% = noise, auto-reject
  },
  
  // TIER 2: System Convergence Bonuses (MANDATORY for quality)
  convergence_scoring: {
    pattern_plus_momentum: 25,     // Cup-Handle + MACD divergence
    complete_plus_indicator: 20,   // SEPA + RSI/MACD confirmation
    triple_confirmation: 30,       // Pattern + Complete + Indicator
    dual_complete_systems: 35      // SEPA + Elder agreement (rare, powerful)
  },
  
  // TIER 3: Risk-Adjusted Quality Filters (MANDATORY for professionals)
  risk_management: {
    minimum_risk_reward: 2.0,      // 2:1 R/R minimum (non-negotiable)
    preferred_risk_reward: 3.0,    // 3:1+ gets priority scoring
    reject_below_rr: 1.5,          // Auto-reject poor R/R setups
    
    // ATR-based stop validation
    atr_stop_validation: {
      too_tight_threshold: 0.5,    // Stop < 0.5 ATR = noise
      too_loose_threshold: 4.0,    // Stop > 4 ATR = poor entry
      optimal_range: [1.5, 3.0]    // Professional stop range
    },
    
    // Volatility and beta screening  
    volatility_limits: {
      max_beta: 2.0,               // Reject high-beta meme stocks
      min_daily_volume: 1000000,   // $1M+ daily volume minimum
      max_overnight_gap_risk: 0.05, // 5% max gap risk
      max_drawdown_tolerance: 0.15  // 15% max expected drawdown
    }
  },
  
  // TIER 4: Portfolio Diversification (MANDATORY for risk control)
  diversification: {
    max_per_sector: 3,             // Maximum 3 stocks per sector
    max_correlation: 0.7,          // Avoid highly correlated positions
    min_market_cap: 1000000000,    // $1B+ market cap minimum
    max_single_position: 0.10      // 10% max position size
  },
  
  // TIER 5: Timing and Market Context (MANDATORY for entry quality)
  market_timing: {
    earnings_blackout_days: 7,     // Avoid stocks with earnings in 7 days
    min_volume_multiple: 1.2,      // 1.2x average volume minimum
    max_gap_entry: 0.03,           // Avoid entries after 3%+ gaps
    require_breakout_volume: true   // Pattern breakouts need volume confirmation
  }
};

/**
 * Calculate comprehensive watchlist score for stock ranking
 * @param {Object} analysis - Stock analysis result
 * @param {Object} marketContext - Current market conditions
 * @returns {Object} Scoring breakdown and final score
 */
function calculateWatchlistScore(analysis, marketContext = {}) {
  const { decision, execution, systems, context } = analysis;
  let totalScore = 0;
  const scoring = {
    base_signal: 0,
    confidence_bonus: 0,
    system_convergence: 0,
    risk_reward_score: 0,
    quality_penalties: 0,
    final_score: 0
  };
  
  // TIER 1: Base Signal Quality (0-100 points)
  const baseSignal = {
    'BUY': 100,
    'WATCH': 70,
    'HOLD': 0,
    'AVOID': 0
  }[decision.action] || 0;
  
  scoring.base_signal = baseSignal;
  totalScore += baseSignal;
  
  // MANDATORY: Reject below minimum confidence
  const confidenceDecimal = decision.confidence > 1 ? decision.confidence / 100 : decision.confidence;
  if (confidenceDecimal < WATCHLIST_FILTERS.minimum_confidence.REJECT_BELOW) {
    return { ...scoring, final_score: 0, rejection_reason: 'Below minimum confidence threshold' };
  }
  
  // TIER 2: Confidence Bonus (0-20 points)
  if (confidenceDecimal >= 0.90) scoring.confidence_bonus = 20;
  else if (confidenceDecimal >= 0.80) scoring.confidence_bonus = 15;
  else if (confidenceDecimal >= 0.70) scoring.confidence_bonus = 10;
  else if (confidenceDecimal >= 0.65) scoring.confidence_bonus = 5;
  
  totalScore += scoring.confidence_bonus;
  
  // TIER 3: System Convergence Analysis (0-35 points)
  const activeSystemTypes = {
    complete: 0,
    pattern: 0, 
    indicator: 0
  };
  
  Object.values(systems || {}).forEach(system => {
    if (system.decision === 'BUY' || system.decision === 'WATCH') {
      const config = SYSTEM_TIERS[system.system];
      if (config) {
        if (config.type === 'COMPLETE_SYSTEM') activeSystemTypes.complete++;
        else if (config.type === 'PATTERN_SYSTEM') activeSystemTypes.pattern++;
        else if (config.type === 'INDICATOR_SYSTEM') activeSystemTypes.indicator++;
      }
    }
  });
  
  // Convergence scoring
  if (activeSystemTypes.complete >= 2) {
    scoring.system_convergence = WATCHLIST_FILTERS.convergence_scoring.dual_complete_systems;
  } else if (activeSystemTypes.complete >= 1 && activeSystemTypes.pattern >= 1 && activeSystemTypes.indicator >= 1) {
    scoring.system_convergence = WATCHLIST_FILTERS.convergence_scoring.triple_confirmation;
  } else if (activeSystemTypes.pattern >= 1 && activeSystemTypes.indicator >= 1) {
    scoring.system_convergence = WATCHLIST_FILTERS.convergence_scoring.pattern_plus_momentum;
  } else if (activeSystemTypes.complete >= 1 && activeSystemTypes.indicator >= 1) {
    scoring.system_convergence = WATCHLIST_FILTERS.convergence_scoring.complete_plus_indicator;
  }
  
  totalScore += scoring.system_convergence;
  
  // TIER 4: Risk/Reward Quality (0-25 points, with penalties)
  const riskReward = execution?.riskReward || 0;
  if (riskReward < WATCHLIST_FILTERS.risk_management.reject_below_rr) {
    return { ...scoring, final_score: 0, rejection_reason: 'Poor risk/reward ratio' };
  }
  
  if (riskReward >= 4.0) scoring.risk_reward_score = 25;
  else if (riskReward >= 3.0) scoring.risk_reward_score = 20;
  else if (riskReward >= 2.5) scoring.risk_reward_score = 15;
  else if (riskReward >= 2.0) scoring.risk_reward_score = 10;
  
  totalScore += scoring.risk_reward_score;
  
  // TIER 5: Quality Penalties (reduce score for poor setups)
  let penalties = 0;
  
  // Volume penalty
  if (context?.volume?.status === 'LOW') penalties += 10;
  
  // Risk level penalty
  if (context?.risk?.level === 'HIGH') penalties += 15;
  
  // Volatility regime penalty (if available)
  if (marketContext.volatilityRegime === 'HIGH_VOLATILITY') penalties += 10;
  
  scoring.quality_penalties = penalties;
  totalScore -= penalties;
  
  // Final score calculation
  scoring.final_score = Math.max(0, Math.min(200, totalScore));
  
  return scoring;
}

/**
 * Professional watchlist ranking function
 * @param {Array} candidates - Array of stock analysis results
 * @param {number} maxSize - Maximum watchlist size (default: 15)
 * @returns {Array} Ranked and filtered watchlist
 */
function rankWatchlistCandidates(candidates, maxSize = 15) {
  // Score all candidates
  const scored = candidates.map(stock => ({
    ...stock,
    watchlist_score: calculateWatchlistScore(stock),
    priority_tier: stock.decision.action === 'BUY' ? 1 : 
                  stock.decision.action === 'STRONG_BUY' ? 1 : 2
  }));
  
  // Filter out rejected candidates
  const qualified = scored.filter(stock => 
    stock.watchlist_score.final_score > 0 && 
    !stock.watchlist_score.rejection_reason
  );
  
  // Sort by priority tier, then by score
  const ranked = qualified.sort((a, b) => {
    if (a.priority_tier !== b.priority_tier) {
      return a.priority_tier - b.priority_tier; // BUY signals first
    }
    return b.watchlist_score.final_score - a.watchlist_score.final_score; // Higher scores first
  });
  
  // Apply sector diversification
  // const diversified = applySectorDiversification(ranked, maxSize);

  return ranked.slice(0, maxSize);
}

/**
 * Apply sector diversification limits
 * @param {Array} rankedStocks - Pre-ranked stocks
 * @param {number} maxSize - Target watchlist size
 * @returns {Array} Diversified selection
 */
function applySectorDiversification(rankedStocks, maxSize) {
  const sectorCounts = {};
  const maxPerSector = WATCHLIST_FILTERS.diversification.max_per_sector;
  const selected = [];
  
  for (const stock of rankedStocks) {
    const sector = stock.sector || 'UNKNOWN';
    const currentCount = sectorCounts[sector] || 0;
    
    if (currentCount < maxPerSector && selected.length < maxSize) {
      selected.push(stock);
      sectorCounts[sector] = currentCount + 1;
    }
  }
  
  return selected;
}

/**
 * PHASE 2: Normalize all signals to BUY/WATCH/AVOID standard
 * Centralizes signal normalization logic for all trading systems
 * @param {string} internalSignal - The internal signal from trading system
 * @returns {string} Standardized signal (BUY/WATCH/AVOID)
 */
function normalizeSignal(internalSignal) {
  switch (internalSignal) {
    case 'BUY':
    case 'STRONG_BUY':
    case 'LONG':
      return 'BUY';
    
    case 'WATCH':
    case 'STRONG_WATCH':
    case 'WEAK_WATCH':
      return 'WATCH';
    
    case 'SELL':
    case 'STRONG_SELL':
    case 'SHORT':
    case 'AVOID':
    case 'NO_TRADE':
    case 'HOLD':
    default:
      return 'AVOID';
  }
}

/**
 * PHASE 3: Unified Execution Plan Builder
 * Creates standardized execution plans while preserving system-specific logic
 * @param {Object} params - Execution plan parameters
 * @returns {Object} Unified execution plan structure
 */
function buildUnifiedExecutionPlan(params) {
  const {
    signal,
    systemId,
    systemName,
    timeframe,
    entryPrice,
    stopLoss,
    stopMethod,
    targets,
    riskReward,
    confidence,
    entryStrategy,
    systemSpecificExit,
    timeStop,
    trailingStop,
    volumeRequirements,
    entryConditions,
    entryTiming,
    systemMetadata
  } = params;

  // Calculate standardized risk metrics
  const riskPercentage = stopLoss && entryPrice ? 
    Math.abs((entryPrice - stopLoss) / entryPrice) : 0;

  // Unified position sizing logic
  const positionSizing = calculateUnifiedPositionSizing({
    signal,
    confidence,
    riskReward,
    riskPercentage,
    systemId
  });

  // Build unified structure
  const executionPlan = {
    // Core execution data
    signal: normalizeSignal(signal),
    action: normalizeSignal(signal), // Same as signal for consistency
    
    // Entry strategy
    entryStrategy: {
      type: entryStrategy?.type || `${systemName.toUpperCase()}_ENTRY`,
      method: entryStrategy?.method || 'Market order on signal confirmation',
      conditions: entryConditions || entryStrategy?.conditions || [],
      timing: entryTiming || 'Immediate on confirmation',
      volumeRequirements: volumeRequirements || null
    },
    
    // Exit strategy
    exitStrategy: {
      stopLoss: stopLoss ? Math.round(stopLoss * 100) / 100 : null,
      stopMethod: stopMethod || 'System-specific calculation',
      targets: (targets || []).map(t => Math.round(t * 100) / 100),
      timeStop: timeStop || null,
      systemExit: systemSpecificExit || null,
      trailingStop: trailingStop || false
    },
    
    // Position sizing
    positionSizing,
    
    // Risk metrics
    riskReward: riskReward ? Math.round(riskReward * 100) / 100 : 0,
    riskPercentage: Math.round(riskPercentage * 10000) / 100, // Convert to percentage
    
    // System metadata
    system: systemId,
    strategy: systemName,
    timeframe: timeframe || 'Daily',
    metadata: systemMetadata || null
  };

  // Remove null values for cleaner output
  return cleanExecutionPlan(executionPlan);
}

/**
 * Calculate unified position sizing while preserving system-specific logic
 * @param {Object} params - Position sizing parameters
 * @returns {Object} Position sizing recommendation
 */
function calculateUnifiedPositionSizing(params) {
  const { signal, confidence, riskReward, riskPercentage, systemId } = params;

  let recommendation = 'AVOID';
  let riskPercent = 0;
  let rationale = '';
  let maxPosition = 0;

  if (signal === 'BUY') {
    // System-specific position sizing logic
    if (systemId === 'elder_triple_screen') {
      // Elder's confidence-based 6-tier system
      if (confidence >= 0.8) {
        recommendation = 'FULL';
        riskPercent = 2.0;
        maxPosition = 0.10; // 10% max position
      } else if (confidence >= 0.7) {
        recommendation = 'REDUCED';
        riskPercent = 1.5;
        maxPosition = 0.08;
      } else if (confidence >= 0.6) {
        recommendation = 'CONSERVATIVE';
        riskPercent = 1.2;
        maxPosition = 0.06;
      } else if (confidence >= 0.5) {
        recommendation = 'HALF';
        riskPercent = 1.0;
        maxPosition = 0.05;
      } else if (confidence >= 0.4) {
        recommendation = 'QUARTER';
        riskPercent = 0.5;
        maxPosition = 0.025;
      }
      rationale = `${(confidence * 100).toFixed(1)}% confidence with multi-timeframe confirmation`;
    } else {
      // Standard risk/reward-based sizing for other systems
      if (riskReward >= 3.0) {
        recommendation = 'FULL';
        riskPercent = 2.0;
        maxPosition = 0.10;
      } else if (riskReward >= 2.5) {
        recommendation = 'FULL';
        riskPercent = 1.8;
        maxPosition = 0.09;
      } else if (riskReward >= 2.0) {
        recommendation = 'REDUCED';
        riskPercent = 1.5;
        maxPosition = 0.075;
      } else if (riskReward >= 1.5) {
        recommendation = 'HALF';
        riskPercent = 1.0;
        maxPosition = 0.05;
      } else {
        recommendation = 'CONSERVATIVE';
        riskPercent = 0.5;
        maxPosition = 0.025;
      }
      rationale = `${riskReward.toFixed(1)}:1 risk/reward ratio`;
    }
  } else if (signal === 'WATCH') {
    recommendation = 'WATCH';
    riskPercent = 0;
    maxPosition = 0;
    rationale = 'Position sizing pending signal confirmation';
  } else {
    recommendation = 'AVOID';
    riskPercent = 0;
    maxPosition = 0;
    rationale = 'No position recommended';
  }

  return {
    recommendation,
    riskPercent,
    rationale,
    maxPosition,
    riskAmount: riskPercent > 0 ? `${riskPercent}% of portfolio at stop loss` : null
  };
}

/**
 * Clean execution plan by removing null/undefined values
 * @param {Object} plan - Execution plan object
 * @returns {Object} Cleaned execution plan
 */
function cleanExecutionPlan(plan) {
  const cleaned = {};
  
  for (const [key, value] of Object.entries(plan)) {
    if (value !== null && value !== undefined) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleanedSubObject = cleanExecutionPlan(value);
        if (Object.keys(cleanedSubObject).length > 0) {
          cleaned[key] = cleanedSubObject;
        }
      } else if (Array.isArray(value) && value.length > 0) {
        cleaned[key] = value;
      } else if (typeof value !== 'object') {
        cleaned[key] = value;
      }
    }
  }
  
  return cleaned;
}

module.exports = {
  SYSTEM_IDS,
  SYSTEM_TIERS,
  WATCHLIST_FILTERS,
  normalizeSystemKey,
  requiresWeeklyData,
  requiresIntradayData,
  getSystemRequirements,
  getSystemWeight,
  isCompleteSystem,
  getHighConvictionThreshold,
  calculateWatchlistScore,
  rankWatchlistCandidates,
  applySectorDiversification,
  normalizeSignal,
  buildUnifiedExecutionPlan,
  calculateUnifiedPositionSizing,
  cleanExecutionPlan,
  defaultLookBackPeriod
};
