/**
 * Trading System Constants
 * Canonical system identifiers and aliases for consistency across the application
 */

import { SystemRequirement, WatchlistFilter, UnifiedSignal, ExecutionPlan, PositionSizing } from '../types/technical-analysis';

export const SYSTEM_IDS = {
  TRIPLE_SCREEN: 'triple_screen',
  MINERVINI_SEPA: 'sepa_method',
  CAN_SLIM_CUP_HANDLE: 'cup_handle',
  RSI_MEAN_REVERSION: 'rsi_mean',
  MACD_DIVERGENCE: 'divergence',
  ELDER_IMPULSE: 'impulse',
  SUPERTREND_WEEKLY: 'supertrend_weekly',
  MINERVINI_TEMPLATE_ADVANCED: 'minervini_template_advanced',
  INSTITUTIONAL_MOMENTUM_CASCADE: 'institutional_momentum_cascade',
} as const;

export type SystemId = typeof SYSTEM_IDS[keyof typeof SYSTEM_IDS];

export const SYSTEM_TIERS = {
  TIER_1: ['triple_screen', 'sepa_method', 'minervini_template_advanced', 'institutional_momentum_cascade'],
  TIER_2: ['cup_handle', 'rsi_mean', 'divergence', 'supertrend_weekly'],
  TIER_3: ['impulse', 'divergence'],
} as const;

export type SystemTier = keyof typeof SYSTEM_TIERS;

export const WATCHLIST_FILTERS = {
  STRONG_BUY: 'strong_buy',
  BUY: 'buy',
  BULLISH_SETUP: 'bullish_setup',
  HIGH_VOLUME: 'high_volume',
  BREAKOUT: 'breakout',
  PULLBACK: 'pullback',
  ALL: 'all'
} as const;

export type WatchlistFilterType = typeof WATCHLIST_FILTERS[keyof typeof WATCHLIST_FILTERS];

/**
 * Trading System Trigger Types
 * Consolidated trigger types used across all trading systems
 */
export const TRIGGER_TYPES = {
  // Volume triggers
  VOLUME: 'VOLUME',
  
  // Price action triggers  
  BREAKOUT_LEVEL: 'BREAKOUT_LEVEL',
  CANDLE_STRENGTH: 'CANDLE_STRENGTH',
  
  // Momentum triggers
  MOMENTUM_ACCELERATION: 'MOMENTUM_ACCELERATION',
  
  // System grade triggers
  CASCADE_GRADE: 'CASCADE_GRADE'
} as const;

export type TriggerType = typeof TRIGGER_TYPES[keyof typeof TRIGGER_TYPES];

export const VALID_TRIGGER_TYPES = Object.values(TRIGGER_TYPES);

export const defaultLookBackPeriod = 100;

/**
 * Normalize system key aliases to canonical IDs
 * @param key - Raw system identifier 
 * @returns Canonical system ID
 */
export function normalizeSystemKey(key: string): SystemId {
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
  
  
  // Cup Handle aliases
  if (['cuphandle', 'cup_handle', 'cupandhandle', 'cup', 'canslim'].includes(normalized)) {
    return SYSTEM_IDS.CAN_SLIM_CUP_HANDLE;
  }
  
  // RSI Mean Reversion aliases
  if (['rsi', 'rsimean', 'rsi_mean', 'rsi_mean_reversion', 'meanreversion'].includes(normalized)) {
    return SYSTEM_IDS.RSI_MEAN_REVERSION;
  }
  
  // MACD Divergence aliases
  if (['macd', 'divergence', 'macd_divergence', 'macddivergence'].includes(normalized)) {
    return SYSTEM_IDS.MACD_DIVERGENCE;
  }
  
  // Elder Impulse aliases
  if (['impulse', 'elder_impulse', 'elderimpulse', 'impulsewave'].includes(normalized)) {
    return SYSTEM_IDS.ELDER_IMPULSE;
  }
  
  // SuperTrend Weekly aliases
  if (['supertrend', 'supertrend_weekly', 'supertrendweekly', 'weekly_supertrend'].includes(normalized)) {
    return SYSTEM_IDS.SUPERTREND_WEEKLY;
  }
  
  // Minervini Template Advanced aliases
  if (['minervini_template_advanced', 'minervinitemplateadvanced', 'templateadvanced', 'minerviniadvanced', 'template_advanced'].includes(normalized)) {
    return SYSTEM_IDS.MINERVINI_TEMPLATE_ADVANCED;
  }
  
  // Institutional Momentum Cascade aliases
  if (['institutional_momentum_cascade', 'institutionalmomentumcascade', 'momentumcascade', 'cascade', 'institutional_cascade'].includes(normalized)) {
    return SYSTEM_IDS.INSTITUTIONAL_MOMENTUM_CASCADE;
  }
  
  // Return original key if no alias found (fallback)
  return key as SystemId;
}

/**
 * Check if system requires weekly data
 */
export function requiresWeeklyData(systemId: SystemId): boolean {
  return systemId === SYSTEM_IDS.SUPERTREND_WEEKLY || 
         systemId === SYSTEM_IDS.TRIPLE_SCREEN;
}

/**
 * Check if system requires intraday data
 */
export function requiresIntradayData(systemId: SystemId): boolean {
  return systemId === SYSTEM_IDS.ELDER_IMPULSE;
}

/**
 * Get data requirements for a trading system
 */
export function getSystemRequirements(systemId: SystemId): SystemRequirement {
  return {
    weeklyData: requiresWeeklyData(systemId),
    intradayData: requiresIntradayData(systemId),
    volumeData: true, // All systems need volume
    lookBackPeriod: defaultLookBackPeriod
  };
}

/**
 * Get system weight for portfolio allocation
 */
export function getSystemWeight(systemId: SystemId): number {
  if (SYSTEM_TIERS.TIER_1.includes(systemId as any)) return 0.4;
  if (SYSTEM_TIERS.TIER_2.includes(systemId as any)) return 0.3;
  if (SYSTEM_TIERS.TIER_3.includes(systemId as any)) return 0.2;
  return 0.1; // Default weight
}

/**
 * Check if system is a complete trading system
 */
export function isCompleteSystem(systemId: SystemId): boolean {
  const completeSystems: SystemId[] = [
    SYSTEM_IDS.TRIPLE_SCREEN,
    SYSTEM_IDS.MINERVINI_SEPA,
    SYSTEM_IDS.CAN_SLIM_CUP_HANDLE,
    SYSTEM_IDS.MINERVINI_TEMPLATE_ADVANCED,
    SYSTEM_IDS.INSTITUTIONAL_MOMENTUM_CASCADE
  ];
  return completeSystems.includes(systemId);
}

/**
 * Get high conviction threshold for system
 */
export function getHighConvictionThreshold(systemId: SystemId): number {
  if (SYSTEM_TIERS.TIER_1.includes(systemId as any)) return 0.8;
  if (SYSTEM_TIERS.TIER_2.includes(systemId as any)) return 0.7;
  return 0.6;
}

/**
 * Calculate watchlist score based on multiple signals
 */
export function calculateWatchlistScore(
  signals: UnifiedSignal[],
  filters: WatchlistFilterType[] = []
): number {
  if (!signals || signals.length === 0) return 0;
  
  let totalScore = 0;
  let weightSum = 0;
  
  for (const signal of signals) {
    const weight = getSystemWeight(signal.systemId as SystemId);
    const strength = parseFloat(signal.strength?.toString() || '0');
    
    // Apply filter bonus
    let filterBonus = 1;
    if (filters.includes(WATCHLIST_FILTERS.STRONG_BUY) && strength >= 0.8) {
      filterBonus = 1.2;
    } else if (filters.includes(WATCHLIST_FILTERS.BUY) && strength >= 0.6) {
      filterBonus = 1.1;
    }
    
    totalScore += strength * weight * filterBonus;
    weightSum += weight;
  }
  
  return weightSum > 0 ? totalScore / weightSum : 0;
}

/**
 * Rank watchlist candidates by score
 */
export function rankWatchlistCandidates(
  candidates: Array<{ symbol: string; signals: UnifiedSignal[] }>,
  filters: WatchlistFilterType[] = []
): Array<{ symbol: string; score: number; signals: UnifiedSignal[] }> {
  const scored = candidates.map(candidate => ({
    ...candidate,
    score: calculateWatchlistScore(candidate.signals, filters)
  }));
  
  return scored.sort((a, b) => b.score - a.score);
}

/**
 * Apply sector diversification to watchlist
 */
export function applySectorDiversification(
  candidates: Array<{ symbol: string; sector?: string; score: number }>,
  maxPerSector: number = 3
): Array<{ symbol: string; sector?: string; score: number }> {
  const sectorCounts = new Map<string, number>();
  const diversified: Array<{ symbol: string; sector?: string; score: number }> = [];
  
  for (const candidate of candidates) {
    const sector = candidate.sector || 'Unknown';
    const currentCount = sectorCounts.get(sector) || 0;
    
    if (currentCount < maxPerSector) {
      diversified.push(candidate);
      sectorCounts.set(sector, currentCount + 1);
    }
  }
  
  return diversified;
}

/**
 * Normalize signal strength to 0-1 range
 */
export function normalizeSignal(signal: UnifiedSignal): UnifiedSignal {
  const strength = parseFloat(signal.strength?.toString() || '0');
  const normalizedStrength = Math.max(0, Math.min(1, strength));
  
  return {
    ...signal,
    strength: normalizedStrength
  };
}

/**
 * Build unified execution plan from multiple signals
 */
export function buildUnifiedExecutionPlan(
  signals: UnifiedSignal[],
  currentPrice: number,
  accountSize: number
): ExecutionPlan {
  if (!signals || signals.length === 0) {
    return {
      action: 'HOLD',
      confidence: 0,
      systemsCount: 0,
      positionSizing: {
        recommendation: 'AVOID',
        riskPercent: 0,
        rationale: 'No signals available',
        maxPosition: 0
      }
    };
  }
  
  const normalizedSignals = signals.map(normalizeSignal);
  const avgConfidence = normalizedSignals.reduce((sum, s) => sum + (s.strength as number), 0) / normalizedSignals.length;
  
  // Determine primary action
  const buySignals = normalizedSignals.filter(s => s.action === 'BUY');
  const sellSignals = normalizedSignals.filter(s => s.action === 'SELL');
  
  let action: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  if (buySignals.length > sellSignals.length) {
    action = 'BUY';
  } else if (sellSignals.length > buySignals.length) {
    action = 'SELL';
  }
  
  const positionSizing = calculateUnifiedPositionSizing(normalizedSignals, avgConfidence, accountSize);
  
  return {
    action,
    confidence: avgConfidence,
    systemsCount: normalizedSignals.length,
    positionSizing,
    entryPrice: currentPrice,
    stopLoss: normalizedSignals.find(s => s.stopLoss)?.stopLoss,
    takeProfit: normalizedSignals.find(s => s.takeProfit)?.takeProfit
  };
}

/**
 * Calculate unified position sizing based on multiple signals
 */
export function calculateUnifiedPositionSizing(
  signals: UnifiedSignal[],
  confidence: number,
  accountSize: number
): PositionSizing {
  let recommendation: 'BUY' | 'SELL' | 'HOLD' | 'AVOID';
  let riskPercent: number;
  let maxPosition: number;
  let rationale: string;
  
  if (confidence >= 0.8) {
    recommendation = 'BUY';
    riskPercent = Math.min(3, confidence * 4); // Max 3% risk for high confidence
    maxPosition = accountSize * 0.15; // Max 15% position size
    rationale = 'High conviction trade based on multiple strong signals';
  } else if (confidence >= 0.6) {
    recommendation = 'BUY';
    riskPercent = Math.min(2, confidence * 3); // Max 2% risk for medium confidence
    maxPosition = accountSize * 0.1; // Max 10% position size
    rationale = 'Moderate conviction trade with good signal alignment';
  } else if (confidence >= 0.4) {
    recommendation = 'HOLD';
    riskPercent = Math.min(1, confidence * 2); // Max 1% risk for low confidence
    maxPosition = accountSize * 0.05; // Max 5% position size
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
 */
export function cleanExecutionPlan(plan: ExecutionPlan): ExecutionPlan {
  const cleaned: any = {};
  
  for (const [key, value] of Object.entries(plan)) {
    if (value !== null && value !== undefined) {
      if (typeof value === 'object' && !Array.isArray(value)) {
        const cleanedSubObject = cleanExecutionPlan(value as ExecutionPlan);
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
  
  return cleaned as ExecutionPlan;
}

// CommonJS compatibility
module.exports = {
  SYSTEM_IDS,
  SYSTEM_TIERS,
  WATCHLIST_FILTERS,
  TRIGGER_TYPES,
  VALID_TRIGGER_TYPES,
  defaultLookBackPeriod,
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
  cleanExecutionPlan
};
