// ==============================================
// ADVANCED VOLATILITY REGIME DETECTION ENGINE
// Classifies market volatility regimes for optimal risk management
// ==============================================

import { OHLCData } from '../types/technical-analysis';

export type VolatilityRegimeType = 'CRISIS' | 'HIGH_VOLATILITY' | 'NORMAL' | 'LOW_VOLATILITY' | 'COMPRESSION' | 'UNKNOWN';
export type RiskLevel = 'EXTREME' | 'HIGH' | 'MODERATE' | 'LOW' | 'MINIMAL';

export interface VolatilityMeasures {
  atrPercent: number;
  realizedVolatility: number;
  garchVolatility: number;
  parkinsonVolatility: number;
  garmanKlassVolatility: number;
  yangZhangVolatility: number;
}

export interface RegimeCharacteristics {
  description: string;
  riskLevel: RiskLevel;
  typicalDuration: string;
  marketBehavior: string;
  signals: string[];
}

export interface RegimeClassification {
  type: VolatilityRegimeType;
  confidence: number;
  characteristics: RegimeCharacteristics;
}

export interface RegimeAdjustments {
  positionSizeMultiplier: number;
  stopLossMultiplier: number;
  takeProfitMultiplier: number;
  maxPositions: number;
  riskPerTrade: number;
  holdingPeriodAdjustment: string;
  entryAggressiveness: string;
}

export interface HistoricalContext {
  percentileRank: number;
  interpretation: string;
  isOutlier: boolean;
  daysAboveAverage: number;
  trend: 'RISING' | 'FALLING' | 'STABLE';
}

export interface RegimeRecommendations {
  primaryStrategy: string;
  positionSizing: string;
  riskManagement: string;
  entryTiming: string;
  exitStrategy: string;
  hedgingAdvice: string;
}

export interface VolatilityRegimeResult {
  regime: VolatilityRegimeType;
  confidence: number;
  atrPercent: number;
  volatilityMeasures: VolatilityMeasures;
  regimeCharacteristics: RegimeCharacteristics;
  adjustments: RegimeAdjustments;
  historicalContext: HistoricalContext;
  recommendations: RegimeRecommendations;
}

/**
 * Advanced Volatility Regime Detection
 * Identifies 5 distinct volatility regimes with adaptive position sizing
 */
export function detectVolatilityRegime(
  ohlcData: OHLCData[], 
  technicalIndicators?: { atr?: number }
): VolatilityRegimeResult {
  //console.log(`📊 Volatility Regime Detection: Analyzing ${ohlcData.length} data points...`);
  
  if (!ohlcData || ohlcData.length < 50) {
    return {
      regime: 'UNKNOWN',
      confidence: 0,
      atrPercent: 0,
      volatilityMeasures: {
        atrPercent: 0,
        realizedVolatility: 0,
        garchVolatility: 0,
        parkinsonVolatility: 0,
        garmanKlassVolatility: 0,
        yangZhangVolatility: 0
      },
      regimeCharacteristics: {
        description: 'Insufficient data',
        riskLevel: 'MODERATE',
        typicalDuration: 'Unknown',
        marketBehavior: 'Unknown',
        signals: []
      },
      adjustments: {
        positionSizeMultiplier: 0.5,
        stopLossMultiplier: 1,
        takeProfitMultiplier: 1,
        maxPositions: 1,
        riskPerTrade: 1,
        holdingPeriodAdjustment: 'Standard',
        entryAggressiveness: 'Conservative'
      },
      historicalContext: {
        percentileRank: 50,
        interpretation: 'Unknown',
        isOutlier: false,
        daysAboveAverage: 0,
        trend: 'STABLE'
      },
      recommendations: {
        primaryStrategy: 'Conservative',
        positionSizing: 'Minimal',
        riskManagement: 'Strict',
        entryTiming: 'Patient',
        exitStrategy: 'Quick',
        hedgingAdvice: 'Consider hedging'
      }
    };
  }
  
  // Calculate multiple volatility measures
  const atr = technicalIndicators?.atr || calculateATR(ohlcData);
  const currentPrice = ohlcData[ohlcData.length - 1].close;
  const atrPercent = (atr / currentPrice) * 100;
  
  const volatilityMeasures: VolatilityMeasures = {
    atrPercent: atrPercent,
    realizedVolatility: calculateRealizedVolatility(ohlcData),
    garchVolatility: calculateGARCHVolatility(ohlcData),
    parkinsonVolatility: calculateParkinsonVolatility(ohlcData),
    garmanKlassVolatility: calculateGarmanKlassVolatility(ohlcData),
    yangZhangVolatility: calculateYangZhangVolatility(ohlcData)
  };
  
  // Regime classification using multiple measures
  const regime = classifyVolatilityRegime(volatilityMeasures, ohlcData);
  
  // Calculate regime-specific adjustments
  const regimeAdjustments = calculateRegimeAdjustments(regime, volatilityMeasures);
  
  //console.log(`📈 Volatility Regime: ${regime.type} (${(regime.confidence * 100).toFixed(1)}% confidence)`);
  //console.log(`   ATR: ${atrPercent.toFixed(2)}% | Realized Vol: ${volatilityMeasures.realizedVolatility.toFixed(2)}%`);
  
  return {
    regime: regime.type,
    confidence: regime.confidence,
    atrPercent: atrPercent,
    volatilityMeasures: volatilityMeasures,
    regimeCharacteristics: regime.characteristics,
    adjustments: regimeAdjustments,
    historicalContext: calculateHistoricalContext(volatilityMeasures, ohlcData),
    recommendations: generateRegimeRecommendations(regime, regimeAdjustments)
  };
}

// Classify volatility into 5 distinct regimes
export function classifyVolatilityRegime(measures: VolatilityMeasures, ohlcData: OHLCData[]): RegimeClassification {
  const atr = measures.atrPercent;
  const realized = measures.realizedVolatility;
  
  // 🐛 BUG FIX: Make volatility measures consistent for proper regime classification
  // Convert ATR from daily to annualized to match realized volatility and historical percentiles
  const atrAnnualized = atr * Math.sqrt(252);
  const avg = (atrAnnualized + realized) / 2;
  
  //console.log(`   🔍 Volatility Debug: ATR=${atr.toFixed(2)}% (daily) → ${atrAnnualized.toFixed(2)}% (annualized), Realized=${realized.toFixed(2)}% (annualized), Avg=${avg.toFixed(2)}%`);
  
  // Historical volatility percentiles (based on 252-day rolling annualized)
  const historical = ohlcData.slice(-252).map((_, i, arr) => {
    if (i < 20) return null;
    const segment = arr.slice(i-20, i);
    const returns = segment.slice(1).map((d, j) => 
      Math.log(d.close / segment[j].close)
    );
    return Math.sqrt(returns.reduce((sum, r) => sum + r*r, 0) / returns.length) * Math.sqrt(252) * 100;
  }).filter(v => v !== null) as number[];
  
  const p25 = percentile(historical, 25);
  const p50 = percentile(historical, 50);
  const p75 = percentile(historical, 75);
  const p90 = percentile(historical, 90);
  
  // Regime Classification
  if (avg >= p90) {
    return {
      type: 'CRISIS',
      confidence: Math.min(0.95, (avg - p90) / p90 + 0.7),
      characteristics: {
        description: 'Extreme volatility - Crisis mode',
        riskLevel: 'EXTREME',
        typicalDuration: '1-4 weeks',
        marketBehavior: 'Panic selling, extreme price swings, correlations approach 1',
        signals: ['VIX > 35', 'ATR > 8%', 'Multiple standard deviation moves']
      }
    };
  } else if (avg >= p75) {
    return {
      type: 'HIGH_VOLATILITY',
      confidence: Math.min(0.9, (avg - p75) / (p90 - p75) + 0.6),
      characteristics: {
        description: 'High volatility - Elevated risk',
        riskLevel: 'HIGH',
        typicalDuration: '2-8 weeks',
        marketBehavior: 'Increased uncertainty, larger price moves, sector rotation',
        signals: ['VIX 20-35', 'ATR 3-8%', 'Breaking key support/resistance']
      }
    };
  } else if (avg >= p25) {
    return {
      type: 'NORMAL',
      confidence: Math.min(0.85, 0.5 + Math.abs(avg - p50) / (p75 - p25)),
      characteristics: {
        description: 'Normal volatility - Standard market conditions',
        riskLevel: 'MODERATE',
        typicalDuration: '4-12 weeks',
        marketBehavior: 'Steady trends, normal market function',
        signals: ['VIX 12-20', 'ATR 1-3%', 'Trend-following works well']
      }
    };
  } else if (avg >= p25 * 0.5) {
    return {
      type: 'LOW_VOLATILITY',
      confidence: Math.min(0.8, (p25 - avg) / p25 + 0.5),
      characteristics: {
        description: 'Low volatility - Calm market conditions',
        riskLevel: 'LOW',
        typicalDuration: '6-16 weeks',
        marketBehavior: 'Slow trends, low dispersion, mean reversion tendencies',
        signals: ['VIX < 12', 'ATR < 1%', 'Narrow trading ranges']
      }
    };
  } else {
    return {
      type: 'COMPRESSION',
      confidence: Math.min(0.9, 0.6 + (p25 * 0.5 - avg) / (p25 * 0.5)),
      characteristics: {
        description: 'Volatility compression - Building pressure',
        riskLevel: 'LOW',
        typicalDuration: '2-6 weeks',
        marketBehavior: 'Coiling for breakout, very narrow ranges, low volume',
        signals: ['VIX < 10', 'ATR < 0.5%', 'Bollinger Bands squeeze']
      }
    };
  }
}

export function calculateRegimeAdjustments(regime: RegimeClassification, measures: VolatilityMeasures): RegimeAdjustments {
  const baseMultiplier = 1.0;
  
  switch (regime.type) {
    case 'CRISIS':
      return {
        positionSizeMultiplier: baseMultiplier * 0.25, // Reduce to 25%
        stopLossMultiplier: 0.5, // Tighter stops
        takeProfitMultiplier: 0.3, // Take profits faster
        maxPositions: 1,
        riskPerTrade: 0.5, // Half normal risk
        holdingPeriodAdjustment: 'Much shorter - 1-3 days',
        entryAggressiveness: 'Very conservative'
      };
      
    case 'HIGH_VOLATILITY':
      return {
        positionSizeMultiplier: baseMultiplier * 0.5, // Reduce to 50%
        stopLossMultiplier: 0.7,
        takeProfitMultiplier: 0.6,
        maxPositions: 2,
        riskPerTrade: 0.75,
        holdingPeriodAdjustment: 'Shorter - 2-5 days',
        entryAggressiveness: 'Conservative'
      };
      
    case 'NORMAL':
      return {
        positionSizeMultiplier: baseMultiplier * 1.0, // Standard sizing
        stopLossMultiplier: 1.0,
        takeProfitMultiplier: 1.0,
        maxPositions: 3,
        riskPerTrade: 1.0,
        holdingPeriodAdjustment: 'Standard - 5-15 days',
        entryAggressiveness: 'Normal'
      };
      
    case 'LOW_VOLATILITY':
      return {
        positionSizeMultiplier: baseMultiplier * 1.25, // Slightly larger
        stopLossMultiplier: 1.3, // Wider stops
        takeProfitMultiplier: 1.5, // Let winners run
        maxPositions: 4,
        riskPerTrade: 1.2,
        holdingPeriodAdjustment: 'Longer - 10-30 days',
        entryAggressiveness: 'Moderately aggressive'
      };
      
    case 'COMPRESSION':
      return {
        positionSizeMultiplier: baseMultiplier * 0.75, // Prepare for breakout
        stopLossMultiplier: 1.5, // Very wide stops
        takeProfitMultiplier: 2.0, // Breakouts can run far
        maxPositions: 2,
        riskPerTrade: 0.8,
        holdingPeriodAdjustment: 'Variable - wait for breakout',
        entryAggressiveness: 'Patient - wait for confirmation'
      };
      
    default:
      return {
        positionSizeMultiplier: baseMultiplier * 0.5,
        stopLossMultiplier: 1.0,
        takeProfitMultiplier: 1.0,
        maxPositions: 1,
        riskPerTrade: 0.5,
        holdingPeriodAdjustment: 'Conservative',
        entryAggressiveness: 'Very conservative'
      };
  }
}

export function calculateRealizedVolatility(ohlcData: OHLCData[], period: number = 20): number {
  if (ohlcData.length < period + 1) return 0;
  
  const returns = [];
  for (let i = 1; i <= period; i++) {
    const currentClose = ohlcData[ohlcData.length - i].close;
    const previousClose = ohlcData[ohlcData.length - i - 1].close;
    returns.push(Math.log(currentClose / previousClose));
  }
  
  const variance = returns.reduce((sum, r) => sum + r * r, 0) / returns.length;
  return Math.sqrt(variance * 252) * 100; // Annualized percentage
}

export function calculateGARCHVolatility(ohlcData: OHLCData[], period: number = 50): number {
  // Simplified GARCH(1,1) - would need more sophisticated implementation for production
  const realizedVol = calculateRealizedVolatility(ohlcData, period);
  
  // Simple mean reversion to long-term average
  const longTermVol = calculateRealizedVolatility(ohlcData, Math.min(252, ohlcData.length - 1));
  const alpha = 0.1; // GARCH alpha parameter
  const beta = 0.85; // GARCH beta parameter
  
  return alpha * realizedVol + beta * longTermVol;
}

export function calculateParkinsonVolatility(ohlcData: OHLCData[], period: number = 20): number {
  if (ohlcData.length < period) return 0;
  
  const hlRatios = ohlcData.slice(-period).map(candle => 
    Math.log(candle.high / candle.low)
  );
  
  const avgHLRatio = hlRatios.reduce((sum, ratio) => sum + ratio * ratio, 0) / hlRatios.length;
  return Math.sqrt(avgHLRatio / (4 * Math.log(2)) * 252) * 100;
}

export function calculateGarmanKlassVolatility(ohlcData: OHLCData[], period: number = 20): number {
  if (ohlcData.length < period + 1) return 0;
  
  const gkValues = [];
  for (let i = 1; i < Math.min(period + 1, ohlcData.length); i++) {
    const current = ohlcData[ohlcData.length - i];
    const previous = ohlcData[ohlcData.length - i - 1];
    
    const hlRatio = Math.log(current.high / current.low);
    const coRatio = Math.log(current.close / current.open);
    const ocRatio = Math.log(current.open / previous.close);
    
    gkValues.push(0.5 * hlRatio * hlRatio - (2 * Math.log(2) - 1) * coRatio * coRatio);
  }
  
  const avgGK = gkValues.reduce((sum, gk) => sum + gk, 0) / gkValues.length;
  return Math.sqrt(avgGK * 252) * 100;
}

export function calculateYangZhangVolatility(ohlcData: OHLCData[], period: number = 20): number {
  if (ohlcData.length < period + 1) return 0;
  
  // Simplified Yang-Zhang estimator
  const rsValues = []; // Rogers-Satchell
  const ocValues = []; // Open-Close overnight
  
  for (let i = 1; i < Math.min(period + 1, ohlcData.length); i++) {
    const current = ohlcData[ohlcData.length - i];
    const previous = ohlcData[ohlcData.length - i - 1];
    
    // Rogers-Satchell component
    const rs = Math.log(current.high / current.close) * Math.log(current.high / current.open) +
               Math.log(current.low / current.close) * Math.log(current.low / current.open);
    rsValues.push(rs);
    
    // Overnight component
    const oc = Math.log(current.open / previous.close);
    ocValues.push(oc * oc);
  }
  
  const avgRS = rsValues.reduce((sum, rs) => sum + rs, 0) / rsValues.length;
  const avgOC = ocValues.reduce((sum, oc) => sum + oc, 0) / ocValues.length;
  
  // Yang-Zhang = overnight + Rogers-Satchell
  const yangZhang = avgOC + avgRS;
  return Math.sqrt(yangZhang * 252) * 100;
}

export function calculateHistoricalContext(measures: VolatilityMeasures, ohlcData: OHLCData[]): HistoricalContext {
  // Calculate percentile rank of current volatility
  const currentVol = measures.realizedVolatility;
  const historical = [];
  
  // Calculate 252-day rolling volatility for context
  for (let i = 20; i < Math.min(252, ohlcData.length - 20); i++) {
    const segment = ohlcData.slice(i - 20, i);
    historical.push(calculateRealizedVolatility(segment, 20));
  }
  
  historical.sort((a, b) => a - b);
  const rank = historical.filter(vol => vol <= currentVol).length / historical.length * 100;
  
  // Count days above average
  const avgVol = historical.reduce((sum, vol) => sum + vol, 0) / historical.length;
  const recentVols = historical.slice(-10);
  const daysAbove = recentVols.filter(vol => vol > avgVol).length;
  
  // Determine trend
  const recent = recentVols.slice(-3).reduce((sum, vol) => sum + vol, 0) / 3;
  const earlier = recentVols.slice(0, 3).reduce((sum, vol) => sum + vol, 0) / 3;
  let trend: 'RISING' | 'FALLING' | 'STABLE' = 'STABLE';
  if (recent > earlier * 1.1) trend = 'RISING';
  else if (recent < earlier * 0.9) trend = 'FALLING';
  
  return {
    percentileRank: rank,
    interpretation: getVolatilityInterpretation(rank),
    isOutlier: rank > 95 || rank < 5,
    daysAboveAverage: daysAbove,
    trend: trend
  };
}

export function generateRegimeRecommendations(regime: RegimeClassification, adjustments: RegimeAdjustments): RegimeRecommendations {
  switch (regime.type) {
    case 'CRISIS':
      return {
        primaryStrategy: 'Capital preservation - avoid new positions',
        positionSizing: 'Minimal - 25% of normal size',
        riskManagement: 'Extremely tight stops, quick exits',
        entryTiming: 'Wait for clear reversal signals',
        exitStrategy: 'Take any profits immediately',
        hedgingAdvice: 'Hedge all positions, consider protective puts'
      };
      
    case 'HIGH_VOLATILITY':
      return {
        primaryStrategy: 'Momentum trading with quick profits',
        positionSizing: 'Reduced - 50% of normal size',
        riskManagement: 'Tight stops, trail profits aggressively',
        entryTiming: 'Wait for pullbacks in trending moves',
        exitStrategy: 'Scale out on strength, exit on weakness',
        hedgingAdvice: 'Consider partial hedging for longer-term positions'
      };
      
    case 'NORMAL':
      return {
        primaryStrategy: 'Standard trend following and mean reversion',
        positionSizing: 'Normal size - follow standard rules',
        riskManagement: 'Standard stop losses and profit targets',
        entryTiming: 'Normal technical analysis applies',
        exitStrategy: 'Follow plan - let winners run, cut losers',
        hedgingAdvice: 'Selective hedging based on portfolio exposure'
      };
      
    case 'LOW_VOLATILITY':
      return {
        primaryStrategy: 'Range trading and carry strategies',
        positionSizing: 'Slightly larger - 125% of normal',
        riskManagement: 'Wider stops, be patient with entries',
        entryTiming: 'Buy support, sell resistance',
        exitStrategy: 'Hold longer, let small gains compound',
        hedgingAdvice: 'Minimal hedging needed in calm markets'
      };
      
    case 'COMPRESSION':
      return {
        primaryStrategy: 'Breakout preparation - wait for expansion',
        positionSizing: 'Conservative until breakout confirmed',
        riskManagement: 'Very wide stops until direction clear',
        entryTiming: 'Wait for volume expansion and range break',
        exitStrategy: 'Ride initial breakout move aggressively',
        hedgingAdvice: 'No hedging needed - low risk environment'
      };
      
    default:
      return {
        primaryStrategy: 'Conservative approach until regime clear',
        positionSizing: 'Minimal risk until volatility stabilizes',
        riskManagement: 'Tight risk controls across all positions',
        entryTiming: 'Wait for clearer market conditions',
        exitStrategy: 'Quick exits on any adverse movement',
        hedgingAdvice: 'Consider broad portfolio hedging'
      };
  }
}

// Helper functions
export function calculateATR(ohlcData: OHLCData[], period: number = 14): number {
  if (ohlcData.length < period + 1) return 0;
  
  const trueRanges = [];
  for (let i = 1; i < ohlcData.length; i++) {
    const current = ohlcData[i];
    const previous = ohlcData[i - 1];
    
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }
  
  // Simple moving average of true ranges
  const recentTRs = trueRanges.slice(-period);
  return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
}

export function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0;
  
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  
  if (Number.isInteger(index)) {
    return sorted[index];
  } else {
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return sorted[lower] * (1 - weight) + sorted[upper] * weight;
  }
}

export function getVolatilityInterpretation(percentileRank: number): string {
  if (percentileRank >= 95) return 'Extreme volatility - Top 5%';
  if (percentileRank >= 75) return 'High volatility - Top quartile';
  if (percentileRank >= 50) return 'Above average volatility';
  if (percentileRank >= 25) return 'Below average volatility';
  return 'Low volatility - Bottom quartile';
}
