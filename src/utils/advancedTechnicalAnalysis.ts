
import * as _ from 'lodash';
const AdvancedTechnicalIndicators = require('./advancedTechnicalIndicators');
import { TechnicalIndicators } from '../types/technical-analysis';

/**
 * OHLC data structure for technical analysis
 */
export interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp?: string | Date;
}

/**
 * Trading signal types
 */
export type TradingSignal = 'BUY' | 'STRONG_BUY' | 'SELL' | 'STRONG_SELL' | 'WATCH' | 'NEUTRAL';

/**
 * Trading direction types
 */
export type TradingDirection = 'LONG' | 'SHORT' | 'LONG_BIAS' | 'SHORT_BIAS' | 'NEUTRAL' | 'NONE' | 'PENDING';

/**
 * Pattern recognition results
 */
export interface PatternDetectionResult extends TradingSystemResult {
  detected: boolean;
  direction: TradingDirection;
  pattern: string;
  [key: string]: any; // Additional pattern-specific properties
}

/**
 * Three-weeks-tight pattern specific result
 */
export interface ThreeWeeksTightResult extends PatternDetectionResult {
  priceRange: string;
  breakoutLevel: number;
  breakdownLevel: number;
}

/**
 * Cup & Handle pattern specific result
 */
export interface CupHandleResult extends PatternDetectionResult {
  bullishResistanceLevel: number;
  bearishSupportLevel: number;
}

/**
 * Flag/Pennant pattern specific result
 */
export interface FlagPennantResult extends PatternDetectionResult {
  bullishPoleMove: string;
  bearishPoleMove: string;
  consolidationRange: string;
  bullishBreakoutLevel: number;
  bearishBreakdownLevel: number;
}

/**
 * Trading system analysis result
 */
export interface TradingSystemResult {
  signal: TradingSignal;
  confidence: number;
  pattern: string;
  reasoning: string;
  criteria: Record<string, any>;
}

/**
 * EMA Crossover system specific result
 */
export interface EMACrossoverResult extends TradingSystemResult {
  criteria: {
    ema12_above_26: boolean;
    ema26_above_50: boolean;
    price_above_ema12: boolean;
    trend_strength: number;
  };
}

/**
 * RSI system specific result
 */
export interface RSISystemResult extends TradingSystemResult {
  criteria: {
    rsi_value: number;
    oversold_20: boolean;
    oversold_30: boolean;
    overbought_70: boolean;
    overbought_80: boolean;
    neutral_zone: boolean;
  };
}

/**
 * Simple momentum system result
 */
export interface SimpleMomentumResult extends TradingSystemResult {
  criteria: {
    rsi_value: number;
    price: number;
    ema50: number;
    demo_mode: boolean;
    very_lenient: boolean;
  };
}

/**
 * Always buy system result
 */
export interface AlwaysBuyResult extends TradingSystemResult {
  criteria: {
    demo_mode: boolean;
    always_trigger: boolean;
    current_price: number;
    guaranteed_signal: boolean;
  };
}

/**
 * Triple Screen system specific result
 */
export interface TripleScreenResult extends TradingSystemResult {
  direction: TradingDirection;
  screens: {
    weeklyTrendUp: boolean;
    dailyOversold: boolean;
    intradayBuyEntry: boolean;
    weeklyTrendDown: boolean;
    dailyOverbought: boolean;
    intradaySellEntry: boolean;
  };
}

/**
 * SEPA Method system specific result
 */
export interface SEPAResult extends TradingSystemResult {
  criteriaMetCount: number;
  criteriaType: string;
  longCriteriaCount: number;
  shortCriteriaCount: number;
  criteria: {
    stage2Uptrend: boolean;
    relativeStrength: boolean;
    nearHighs: string;
    stage4Downtrend: boolean;
    relativeWeakness: boolean;
    nearLows: string;
    tightConsolidation: boolean;
  };
}

/**
 * Darvas Box pattern specific result
 */
export interface DarvasBoxResult extends PatternDetectionResult {
  boxTop: number;
  boxBottom: number;
  boxRange: string;
  volumeBreakout: boolean;
}

/**
 * Signal summary statistics
 */
export interface SignalSummary {
  bullishSignals: number;
  bearishSignals: number;
  watchSignals: number;
  neutralSignals: number;
}

/**
 * Trading systems collection
 */
export interface TradingSystems {
  threeWeeksTight?: ThreeWeeksTightResult;
  cupHandle?: CupHandleResult;
  flagPennant?: FlagPennantResult;
  tripleScreen: TripleScreenResult;
  sepa: SEPAResult;
  darvasBox: DarvasBoxResult;
  EMA_SYSTEM: EMACrossoverResult;
  RSI_SYSTEM: RSISystemResult;
  SIMPLE_MOMENTUM: SimpleMomentumResult;
  ALWAYS_BUY: AlwaysBuyResult;
  [key: string]: TradingSystemResult | undefined;
}

/**
 * Complete trading signals analysis
 */
export interface TradingSignals {
  overall: TradingSignal;
  strength: number;
  direction: TradingDirection;
  systems: TradingSystems;
  patterns: string[];
  alerts: string[];
  signalSummary: SignalSummary;
}

/**
 * Support and resistance levels
 */
export interface SupportResistanceLevels {
  resistance: number;
  support: number;
  currentPrice: number;
  distanceToResistance: string;
  distanceToSupport: string;
}

/**
 * Price target information
 */
export interface PriceTarget {
  price: number;
  probability: number;
  timeframe: string;
}

/**
 * Key trading levels
 */
export interface KeyLevels {
  resistance: number;
  support: number;
}

/**
 * Trading recommendations
 */
export interface TradingRecommendations {
  action: TradingSignal;
  direction: TradingDirection;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  targets: PriceTarget[];
  riskReward: string;
  reasoning: string[];
  keyLevels: KeyLevels;
  positionType: 'LONG' | 'SHORT';
}

/**
 * Complete technical analysis result
 */
export interface TechnicalAnalysisResult {
  symbol: string;
  timestamp: string;
  technicalIndicators: TechnicalIndicators;
  signals: TradingSignals;
  levels: SupportResistanceLevels;
  recommendations: TradingRecommendations;
  dataPoints: number;
}

/**
 * Advanced Technical Analysis for AI Trading System
 * Phase 1: Foundation & Data Infrastructure
 * 
 * This module extends the existing technical indicators with advanced
 * AI-ready analysis capabilities for the 6 core trading systems.
 */
export class AdvancedTechnicalAnalysis {
  /**
   * Generate comprehensive technical analysis for AI trading
   * @param ohlcData - Array of OHLC data with volume
   * @param symbol - Stock symbol
   * @returns Complete technical analysis with AI signals
   */
  static async analyzeStock(ohlcData: OHLCData[], symbol: string): Promise<TechnicalAnalysisResult> {
    if (!ohlcData || ohlcData.length < 50) {
      throw new Error('Insufficient data for technical analysis (minimum 50 periods required)');
    }

    // Prepare data arrays
    const closes = ohlcData.map(d => d.close);
    const highs = ohlcData.map(d => d.high);
    const lows = ohlcData.map(d => d.low);
    const volumes = ohlcData.map(d => d.volume || 0);

    // Calculate all technical indicators
    const indicators = AdvancedTechnicalIndicators.calculateAllIndicators(closes, highs, lows, volumes);

    // Generate trading signals
    const signals = this.generateTradingSignals(indicators, ohlcData);

    // Calculate support/resistance levels
    const levels = this.calculateSupportResistance(ohlcData);

    // 🔧 CRITICAL FIX: Populate resistance/support in latest indicators
    if (indicators.latest) {
      indicators.latest.resistance = levels.resistance || null;
      indicators.latest.support = levels.support || null;
    }

    // Generate entry/exit recommendations
    const recommendations = this.generateRecommendations(indicators, signals, levels);

    return {
      symbol,
      timestamp: new Date().toISOString(),
      technicalIndicators: indicators,
      signals,
      levels,
      recommendations,
      dataPoints: ohlcData.length
    };
  }

  /**
   * Generate trading signals based on the 6 core systems
   * @param indicators - Technical indicators
   * @param ohlcData - OHLC data for pattern analysis
   * @returns Trading signals
   */
  static generateTradingSignals(indicators: TechnicalIndicators, ohlcData: OHLCData[]): TradingSignals {
    const { latest } = indicators;
    const signals: TradingSignals = {
      overall: 'NEUTRAL',
      strength: 0,
      direction: 'NEUTRAL',
      systems: {} as TradingSystems,
      patterns: [],
      alerts: [],
      signalSummary: {
        bullishSignals: 0,
        bearishSignals: 0,
        watchSignals: 0,
        neutralSignals: 0
      }
    };

    // ✅ ADDITIONAL BASIC SYSTEMS FOR BACKTESTING

    // System 7: EMA Crossover System
    const emaCrossover = this.analyzeEMACrossover(indicators);
    signals.systems.EMA_SYSTEM = emaCrossover;

    // System 8: RSI Oversold/Overbought System
    const rsiSystem = this.analyzeRSISystem(indicators);
    signals.systems.RSI_SYSTEM = rsiSystem;

    // Calculate overall signal strength - Enhanced for LONG/SHORT
    const systemSignals = Object.values(signals.systems).filter(Boolean) as TradingSystemResult[];
    const bullishCount = systemSignals.filter(s => s.signal === 'BUY' || s.signal === 'STRONG_BUY').length;
    const bearishCount = systemSignals.filter(s => s.signal === 'SELL' || s.signal === 'STRONG_SELL').length;
    const watchCount = systemSignals.filter(s => s.signal === 'WATCH').length;

    // Determine overall signal based on system consensus
    if (bullishCount >= 3 && bullishCount > bearishCount) {
      signals.overall = bullishCount >= 4 ? 'STRONG_BUY' : 'BUY';
      signals.strength = Math.min(0.9, bullishCount / 6);
      signals.direction = 'LONG';
    } else if (bearishCount >= 3 && bearishCount > bullishCount) {
      signals.overall = bearishCount >= 4 ? 'STRONG_SELL' : 'SELL';
      signals.strength = Math.min(0.9, bearishCount / 6);
      signals.direction = 'SHORT';
    } else if (bullishCount >= 2 && bullishCount > bearishCount) {
      signals.overall = 'WATCH';
      signals.strength = 0.4;
      signals.direction = 'LONG_BIAS';
    } else if (bearishCount >= 2 && bearishCount > bullishCount) {
      signals.overall = 'WATCH';
      signals.strength = 0.4;
      signals.direction = 'SHORT_BIAS';
    } else {
      signals.strength = 0.5;
      signals.direction = 'NEUTRAL';
    }

    // Add signal summary
    signals.signalSummary = {
      bullishSignals: bullishCount,
      bearishSignals: bearishCount,
      watchSignals: watchCount,
      neutralSignals: systemSignals.length - bullishCount - bearishCount - watchCount
    };

    return signals;
  }


  /**
   * ⭐ DARVAS BOX PATTERN DETECTION REMOVED
   * Reason: Insufficient box validation and volume breakout logic
   * Replacement: Use sophisticated Darvas system from /src/systems/
   */

  /**
   * Calculate support and resistance levels
   * @param ohlcData - OHLC data
   * @returns Support/resistance levels
   */
  static calculateSupportResistance(ohlcData: OHLCData[]): SupportResistanceLevels {
    const recentData = ohlcData.slice(-50); // Last 50 days
    const highs = recentData.map(d => d.high);
    const lows = recentData.map(d => d.low);
    const closes = recentData.map(d => d.close);

    // Find pivot points
    const resistance = Math.max(...highs);
    const support = Math.min(...lows);
    const currentPrice = _.last(closes) as number;

    return {
      resistance,
      support,
      currentPrice,
      distanceToResistance: ((resistance - currentPrice) / currentPrice * 100).toFixed(2),
      distanceToSupport: ((currentPrice - support) / currentPrice * 100).toFixed(2)
    };
  }

  /**
   * Generate trading recommendations - Enhanced for LONG and SHORT
   * @param indicators - Technical indicators
   * @param signals - Trading signals
   * @param levels - Support/resistance levels
   * @returns Trading recommendations
   */
  static generateRecommendations(
    indicators: TechnicalIndicators, 
    signals: TradingSignals, 
    levels: SupportResistanceLevels
  ): TradingRecommendations {
    const { latest } = indicators;
    const { overall, strength, direction } = signals;

    if (!latest) {
      throw new Error('Latest indicators not available for recommendations');
    }

    let stopLoss: number, target1: number, target2: number, riskReward: string;

    if (direction === 'LONG' || direction === 'LONG_BIAS' || overall === 'BUY' || overall === 'STRONG_BUY') {
      // LONG position calculations
      stopLoss = latest.price - (latest.atr! * 2);
      target1 = latest.price + (latest.atr! * 3);
      target2 = latest.price + (latest.atr! * 5);
      riskReward = ((target1 - latest.price) / (latest.price - stopLoss)).toFixed(2);
    } else if (direction === 'SHORT' || direction === 'SHORT_BIAS' || overall === 'SELL' || overall === 'STRONG_SELL') {
      // SHORT position calculations
      stopLoss = latest.price + (latest.atr! * 2);
      target1 = latest.price - (latest.atr! * 3);
      target2 = latest.price - (latest.atr! * 5);
      riskReward = ((latest.price - target1) / (stopLoss - latest.price)).toFixed(2);
    } else {
      // NEUTRAL - default LONG calculations
      stopLoss = latest.price - (latest.atr! * 2);
      target1 = latest.price + (latest.atr! * 3);
      target2 = latest.price + (latest.atr! * 5);
      riskReward = ((target1 - latest.price) / (latest.price - stopLoss)).toFixed(2);
    }

    // Ensure stop loss is positive and reasonable
    if (stopLoss <= 0) {
      stopLoss = direction === 'SHORT' || overall === 'SELL' || overall === 'STRONG_SELL' ?
        latest.price * 1.08 : latest.price * 0.92;
    }

    // Ensure targets are reasonable for SHORT positions
    if ((direction === 'SHORT' || overall === 'SELL' || overall === 'STRONG_SELL') && target1 <= 0) {
      target1 = latest.price * 0.95;
      target2 = latest.price * 0.90;
    }

    return {
      action: overall,
      direction: direction || 'NEUTRAL',
      confidence: Math.round(strength * 100),
      entryPrice: latest.price,
      stopLoss: Math.round(stopLoss * 100) / 100,
      targets: [
        {
          price: Math.round(target1 * 100) / 100,
          probability: Math.round(strength * 75),
          timeframe: '2-3 weeks'
        },
        {
          price: Math.round(target2 * 100) / 100,
          probability: Math.round(strength * 45),
          timeframe: '4-6 weeks'
        }
      ],
      riskReward: riskReward,
      reasoning: signals.alerts.length > 0 ? signals.alerts : ['Standard technical analysis applied'],
      keyLevels: {
        resistance: levels.resistance,
        support: levels.support
      },
      positionType: direction === 'SHORT' || direction === 'SHORT_BIAS' || overall === 'SELL' || overall === 'STRONG_SELL' ? 'SHORT' : 'LONG'
    };
  }

  /**
   * ✅ EMA CROSSOVER SYSTEM
   * Simple yet effective trend-following system
   */
  static analyzeEMACrossover(indicators: TechnicalIndicators): EMACrossoverResult {
    const { latest } = indicators;
    
    if (!latest || !latest.ema12 || !latest.ema26 || !latest.ema50) {
      return {
        signal: 'NEUTRAL',
        confidence: 0,
        pattern: 'EMA_CROSSOVER',
        reasoning: 'Insufficient EMA data',
        criteria: {
          ema12_above_26: false,
          ema26_above_50: false,
          price_above_ema12: false,
          trend_strength: 0
        }
      };
    }

    const { ema12, ema26, ema50 } = latest;

    let signal: TradingSignal = 'NEUTRAL';
    let confidence = 0;
    let reasoning = '';

    // EMA 12/26 crossover logic
    if (ema12 > ema26 && ema26 > ema50) {
      // Strong uptrend - all EMAs aligned
      if (latest.price > ema12) {
        signal = 'STRONG_BUY';
        confidence = 0.8;
        reasoning = 'Strong uptrend: Price > EMA12 > EMA26 > EMA50';
      } else {
        signal = 'BUY';
        confidence = 0.6;
        reasoning = 'Uptrend: EMA12 > EMA26 > EMA50, price near EMA12';
      }
    } else if (ema12 < ema26 && ema26 < ema50) {
      // Strong downtrend - all EMAs aligned bearish
      if (latest.price < ema12) {
        signal = 'STRONG_SELL';
        confidence = 0.8;
        reasoning = 'Strong downtrend: Price < EMA12 < EMA26 < EMA50';
      } else {
        signal = 'SELL';
        confidence = 0.6;
        reasoning = 'Downtrend: EMA12 < EMA26 < EMA50, price near EMA12';
      }
    } else if (ema12 > ema26) {
      // Short-term bullish
      signal = 'WATCH';
      confidence = 0.4;
      reasoning = 'Short-term bullish: EMA12 > EMA26';
    } else if (ema12 < ema26) {
      // Short-term bearish
      signal = 'WATCH';
      confidence = 0.4;
      reasoning = 'Short-term bearish: EMA12 < EMA26';
    }

    return {
      signal,
      confidence,
      pattern: 'EMA_CROSSOVER',
      reasoning,
      criteria: {
        ema12_above_26: ema12 > ema26,
        ema26_above_50: ema26 > ema50,
        price_above_ema12: latest.price > ema12,
        trend_strength: Math.abs((ema12 - ema26) / ema26) * 100
      }
    };
  }

  /**
   * ✅ RSI OVERSOLD/OVERBOUGHT SYSTEM
   * Mean reversion system based on RSI
   */
  static analyzeRSISystem(indicators: TechnicalIndicators): RSISystemResult {
    const { latest } = indicators;
    
    if (!latest || !latest.rsi) {
      return {
        signal: 'NEUTRAL',
        confidence: 0,
        pattern: 'RSI_MEAN_REVERSION',
        reasoning: 'RSI data not available',
        criteria: {
          rsi_value: 0,
          oversold_20: false,
          oversold_30: false,
          overbought_70: false,
          overbought_80: false,
          neutral_zone: true
        }
      };
    }

    const rsi = latest.rsi;

    let signal: TradingSignal = 'NEUTRAL';
    let confidence = 0;
    let reasoning = '';

    if (rsi <= 20) {
      // Severely oversold - strong buy signal
      signal = 'STRONG_BUY';
      confidence = 0.85;
      reasoning = `Severely oversold: RSI ${rsi.toFixed(1)} <= 20`;
    } else if (rsi <= 30) {
      // Oversold - buy signal
      signal = 'BUY';
      confidence = 0.7;
      reasoning = `Oversold: RSI ${rsi.toFixed(1)} <= 30`;
    } else if (rsi >= 80) {
      // Severely overbought - strong sell signal
      signal = 'STRONG_SELL';
      confidence = 0.85;
      reasoning = `Severely overbought: RSI ${rsi.toFixed(1)} >= 80`;
    } else if (rsi >= 70) {
      // Overbought - sell signal
      signal = 'SELL';
      confidence = 0.7;
      reasoning = `Overbought: RSI ${rsi.toFixed(1)} >= 70`;
    } else if (rsi <= 35) {
      // Approaching oversold - watch for reversal
      signal = 'WATCH';
      confidence = 0.4;
      reasoning = `Approaching oversold: RSI ${rsi.toFixed(1)}`;
    } else if (rsi >= 65) {
      // Approaching overbought - watch for reversal
      signal = 'WATCH';
      confidence = 0.4;
      reasoning = `Approaching overbought: RSI ${rsi.toFixed(1)}`;
    }

    return {
      signal,
      confidence,
      pattern: 'RSI_MEAN_REVERSION',
      reasoning,
      criteria: {
        rsi_value: rsi,
        oversold_20: rsi <= 20,
        oversold_30: rsi <= 30,
        overbought_70: rsi >= 70,
        overbought_80: rsi >= 80,
        neutral_zone: rsi > 35 && rsi < 65
      }
    };
  }

  /**
   * ✅ SIMPLE MOMENTUM SYSTEM - Less strict for demonstration
   * Basic momentum-based system to generate more signals
   */
  static analyzeSimpleMomentum(indicators: TechnicalIndicators): SimpleMomentumResult {
    const { latest } = indicators;
    
    if (!latest || !latest.rsi || !latest.ema50) {
      return {
        signal: 'NEUTRAL',
        confidence: 0,
        pattern: 'SIMPLE_MOMENTUM',
        reasoning: 'Insufficient momentum data',
        criteria: {
          rsi_value: 0,
          price: 0,
          ema50: 0,
          demo_mode: true,
          very_lenient: true
        }
      };
    }

    const { ema12, ema26, ema50, rsi } = latest;

    let signal: TradingSignal = 'NEUTRAL';
    let confidence = 0;
    let reasoning = '';

    // EXTREMELY LENIENT RULES for demonstration
    const price = latest.price;

    // Basic RSI-based signals (very relaxed)
    if (rsi < 60) {
      // Most stocks will be under RSI 60 - BUY signal
      signal = 'BUY';
      confidence = 0.5;
      reasoning = `DEMO BUY: RSI ${rsi.toFixed(1)} < 60 (very lenient criteria for demonstration)`;
    } else if (rsi > 60) {
      // RSI above 60 - SELL signal  
      signal = 'SELL';
      confidence = 0.5;
      reasoning = `DEMO SELL: RSI ${rsi.toFixed(1)} > 60 (very lenient criteria for demonstration)`;
    }

    // Always generate some signal for demonstration
    if (signal === 'NEUTRAL') {
      signal = price > ema50 ? 'BUY' : 'SELL';
      confidence = 0.4;
      reasoning = `DEMO ${signal}: Price ${price > ema50 ? 'above' : 'below'} EMA50 (fallback demo signal)`;
    }

    return {
      signal,
      confidence,
      pattern: 'SIMPLE_MOMENTUM',
      reasoning,
      criteria: {
        rsi_value: rsi,
        price: price,
        ema50: ema50,
        demo_mode: true,
        very_lenient: true
      }
    };
  }

  /**
   * ✅ ALWAYS_BUY SYSTEM - Guaranteed trades for demonstration
   * This system will ALWAYS generate BUY signals to demonstrate LEAK_FREE_VALIDATED
   */
  static analyzeAlwaysBuy(indicators: TechnicalIndicators): AlwaysBuyResult {
    const { latest } = indicators;
    const price = latest?.price || 100;

    // Add console log to see if this is being called
    //console.log(`🔥 ALWAYS_BUY called with price: ${price}`);

    return {
      signal: 'BUY',
      confidence: 0.8,
      pattern: 'ALWAYS_BUY',
      reasoning: `DEMO BUY: Always buy at ${price.toFixed(2)} (guaranteed trades for LEAK_FREE_VALIDATED demonstration)`,
      criteria: {
        demo_mode: true,
        always_trigger: true,
        current_price: price,
        guaranteed_signal: true
      }
    };
  }
}

export default AdvancedTechnicalAnalysis;

// CommonJS compatibility
module.exports = AdvancedTechnicalAnalysis;
module.exports.default = AdvancedTechnicalAnalysis;
