// Technical Analysis Types for Trading System

export interface OHLCData {
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  timestamp?: Date | string;
}

export interface PriceData {
  closes: number[];
  highs: number[];
  lows: number[];
  volumes: number[];
}

// Individual Indicator Types
export interface EMAIndicators {
  ema12: number[];
  ema13: number[];
  ema20: number[];
  ema26: number[];
  ema50: number[];
  ema200: number[];
}

export interface SMAIndicators {
  sma20: number[];
  sma50: number[];
}

export interface MACDResult {
  MACD?: number;
  signal?: number;
  histogram?: number;
}

export interface BollingerBandsResult {
  upper: number;
  middle: number;
  lower: number;
}

export interface StochasticResult {
  k: number;
  d: number;
}

export interface SuperTrendResult {
  value: number;
  trend: 'UP' | 'DOWN';
}

export interface DirectionalMovement {
  plusDI: number[];
  minusDI: number[];
}

export interface VolumeIndicators {
  avgVolume20: number[];
  volumeRatio: number[];
}

// Latest Values Object
export interface LatestIndicatorValues {
  price: number;
  ema12?: number;
  ema13?: number;
  ema20?: number;
  ema26?: number;
  ema50?: number;
  ema200?: number;
  rsi?: number;
  macd?: number;
  macdSignal?: number;
  bollinger?: BollingerBandsResult;
  atr?: number;
  stochastic?: StochasticResult;
  adx?: number;
  plusDI?: number;
  minusDI?: number;
  superTrend?: SuperTrendResult;
  volume: number;
  volumeRatio?: number;
  avgVolume?: number;
  avgVolume20DMA?: number;
  vol20dma?: number;
  resistance?: number | null;
  support?: number | null;
}

// AI Signal Types
export type TrendSignal = 'STRONG_UP' | 'MODERATE_UP' | 'WEAK_UP' | 'SIDEWAYS' | 'WEAK_DOWN' | 'MODERATE_DOWN' | 'STRONG_DOWN';
export type MomentumSignal = 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'BUILDING_BULL' | 'BUILDING_BEAR' | 'EXHAUSTED_BULL' | 'EXHAUSTED_BEAR' | 'MOMENTUM_PAUSE' | 'NEUTRAL';
export type VolumeSignal = 'BREAKOUT_VOLUME' | 'HIGH_CONVICTION' | 'ACCUMULATION' | 'MODERATE_INTEREST' | 'VOLUME_DRY_UP' | 'LOW_INTEREST' | 'DISTRIBUTION' | 'NORMAL';
export type VolatilitySignal = 'EXPLOSIVE' | 'EXPANDING' | 'HIGH' | 'COMPRESSING' | 'LOW' | 'MODERATE';
export type RiskSignal = 'HIGH_BREAKDOWN_RISK' | 'HIGH_MOMENTUM_RISK' | 'EXTREME_LEVELS' | 'HIGH_VOLATILITY' | 'LOW_EARNINGS_SAFE' | 'MODERATE_UPTREND' | 'MODERATE_DOWNTREND' | 'OVERBOUGHT_OVERSOLD' | 'BALANCED';
export type StructureSignal = 'BREAKOUT' | 'BREAKDOWN' | 'CONSOLIDATION' | 'RESISTANCE_TEST' | 'SUPPORT_TEST' | 'FAKE_BREAKOUT' | 'FAKE_BREAKDOWN' | 'VOLATILE_RANGE' | 'NEUTRAL';

// System Requirements and Configuration Types
export interface SystemRequirement {
  weeklyData: boolean;
  intradayData: boolean;
  volumeData: boolean;
  lookBackPeriod: number;
}

export interface WatchlistFilter {
  type: 'STRONG_BUY' | 'BUY' | 'BULLISH_SETUP' | 'HIGH_VOLUME' | 'BREAKOUT' | 'PULLBACK' | 'ALL';
  threshold?: number;
}

export interface UnifiedSignal {
  systemId: string;
  action: 'BUY' | 'SELL' | 'HOLD';
  strength: number | string;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
  rationale?: string;
}

export interface PositionSizing {
  recommendation: 'BUY' | 'SELL' | 'HOLD' | 'AVOID';
  riskPercent: number;
  rationale: string;
  maxPosition: number;
  riskAmount?: string | null;
}

export interface ExecutionPlan {
  action: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  systemsCount: number;
  positionSizing: PositionSizing;
  entryPrice?: number;
  stopLoss?: number;
  takeProfit?: number;
}
export type RegimeSignal = 'BULL' | 'BEAR' | 'BULL_WEAK' | 'BEAR_WEAK' | 'SIDEWAYS' | 'TRANSITION';
export type LiquiditySignal = 'HIGH' | 'GOOD' | 'MODERATE' | 'LOW' | 'POOR' | 'NORMAL';
export type BiasSignal = 'LONG' | 'SHORT' | 'LONG_LEAN' | 'SHORT_LEAN' | 'NEUTRAL';
export type ConvictionSignal = 'STRONG' | 'MODERATE' | 'WEAK' | 'LOW' | 'NONE';
export type SignalAge = 'FRESH' | 'STALE' | 'OLD';

export interface AISignals {
  timestamp: string;
  trend: TrendSignal;
  momentum: MomentumSignal;
  volume: VolumeSignal;
  volatility: VolatilitySignal;
  risk: RiskSignal;
  structure: StructureSignal;
  regime: RegimeSignal;
  liquidity: LiquiditySignal;
  bias: BiasSignal;
  conviction: ConvictionSignal;
  lastUpdated: string;
  signalAge: SignalAge;
  conflicts: string[];
}

// Complete Technical Indicators Object
export interface TechnicalIndicators {
  ema?: EMAIndicators;
  sma?: SMAIndicators;
  rsi?: number[];
  macd?: MACDResult[];
  bollinger?: BollingerBandsResult[];
  atr?: number[];
  stochastic?: StochasticResult[];
  adx?: number[];
  superTrend?: SuperTrendResult[];
  directionalMovement?: DirectionalMovement;
  volume?: VolumeIndicators;
  latest?: LatestIndicatorValues;
  aiSignals?: AISignals;
}

// Configuration for Dynamic Calculation
export type IndicatorCategory = 'trend' | 'momentum' | 'volume' | 'volatility' | 'ai' | 'latest' | 'all';
export type SpecificIndicator = 'ema' | 'sma' | 'rsi' | 'macd' | 'bollinger' | 'atr' | 'stochastic' | 'superTrend' | 'adx' | 'volume' | 'latest' | 'aiSignals';

export interface IndicatorCalculationConfig {
  categories?: IndicatorCategory[];
  include?: SpecificIndicator[];
  exclude?: SpecificIndicator[];
  includeLatest?: boolean;
  includeAiSignals?: boolean;
}

// Trading Signal Types
export type SignalAction = 'BUY' | 'SELL' | 'STRONG_BUY' | 'STRONG_SELL' | 'WATCH' | 'NEUTRAL';
export type SignalDirection = 'LONG' | 'SHORT' | 'LONG_BIAS' | 'SHORT_BIAS' | 'NEUTRAL';

export interface PatternDetectionResult {
  detected: boolean;
  signal: SignalAction;
  confidence: number;
  direction?: SignalDirection;
  pattern?: string;
  reasoning?: string;
  [key: string]: any; // Allow additional pattern-specific properties
}

export interface SystemAnalysisResult {
  signal: SignalAction;
  confidence: number;
  pattern: string;
  reasoning: string;
  criteria: Record<string, any>;
}

export interface TradingSignals {
  overall: SignalAction;
  strength: number;
  direction?: SignalDirection;
  systems: Record<string, SystemAnalysisResult>;
  patterns: PatternDetectionResult[];
  alerts: string[];
  signalSummary?: {
    bullishSignals: number;
    bearishSignals: number;
    watchSignals: number;
    neutralSignals: number;
  };
}

// Support and Resistance
export interface SupportResistanceLevels {
  resistance: number;
  support: number;
  currentPrice: number;
  distanceToResistance: string;
  distanceToSupport: string;
}

// Trading Recommendations
export interface TradingTarget {
  price: number;
  probability: number;
  timeframe: string;
}

export interface TradingRecommendation {
  action: SignalAction;
  direction: SignalDirection;
  confidence: number;
  entryPrice: number;
  stopLoss: number;
  targets: TradingTarget[];
  riskReward: string;
  reasoning: string[];
  keyLevels: {
    resistance: number;
    support: number;
  };
  positionType: 'LONG' | 'SHORT';
}

// Complete Analysis Result
export interface CompleteAnalysisResult {
  symbol: string;
  timestamp: string;
  technicalIndicators: TechnicalIndicators;
  signals: TradingSignals;
  levels: SupportResistanceLevels;
  recommendations: TradingRecommendation;
  dataPoints: number;
}
