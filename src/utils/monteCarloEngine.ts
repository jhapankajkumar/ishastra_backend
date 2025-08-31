/**
 * Monte Carlo Scenario Engine
 * Multiple outcome probability analysis for enhanced decision making
 * Simulates thousands of potential price paths to assess risk and reward probabilities
 */

export interface MarketData {
  symbol?: string;
  currentPrice?: number;
  latestPrice?: number;
  [key: string]: any;
}

export interface OHLCData {
  close: number;
  open?: number;
  high?: number;
  low?: number;
  volume?: number;
  date?: string;
}

export interface TechnicalAnalysis {
  levels?: {
    resistance?: number;
    support?: number;
  };
  [key: string]: any;
}

export interface MonteCarloOptions {
  simulations?: number;
  tradingDays?: number;
  confidenceLevels?: number[];
  scenarioTypes?: string[];
  volatilityLookback?: number;
  [key: string]: any;
}

export interface MarketStatistics {
  meanReturn: number;
  currentVolatility: number;
  averageVolatility: number;
  volatilityTrend: string;
  shortTermTrend: number;
  mediumTermTrend: number;
  marketRegime: string;
  correlationToMarket: number;
  sharpeRatio: number;
  maxDrawdown: number;
  skewness: number;
  kurtosis: number;
}

export interface PriceSimulation {
  id: number;
  path: number[];
  finalPrice: number;
  maxPrice: number;
  minPrice: number;
  maxDrawdown: number;
  volatility: number;
}

export interface ScenarioOutcome {
  finalReturn: number;
  maxReturn: number;
  minReturn: number;
  breachedResistance?: boolean;
  breachedSupport?: boolean;
  stayedInRange?: boolean;
  maxDrawdown: number;
}

export interface ScenarioStats {
  averageReturn: number;
  medianReturn: number;
  bestCase: number;
  worstCase: number;
  averageDrawdown: number;
  resistanceBreachRate: number;
  supportBreachRate: number;
  rangeHoldRate: number;
}

export interface ScenarioData {
  probability: number;
  count: number;
  averageReturn: number;
  medianReturn: number;
  bestCaseReturn: number;
  worstCaseReturn: number;
  averageMaxDrawdown: number;
  resistanceBreachProbability?: number;
  supportBreachProbability?: number;
  rangeHoldProbability?: number;
}

export interface ScenarioAnalysis {
  scenarios: {
    bullish: ScenarioData;
    bearish: ScenarioData;
    sideways: ScenarioData;
  };
  keyLevels: {
    resistance: {
      level: number;
      breachProbability: number;
    };
    support: {
      level: number;
      breachProbability: number;
    };
  };
}

export interface ValueAtRisk {
  var90: number;
  var95: number;
  var99: number;
  interpretation: {
    var95: string;
    var99: string;
  };
}

export interface ExpectedShortfall {
  es95: number;
  interpretation: string;
}

export interface DrawdownAnalysis {
  averageMaxDrawdown: number;
  medianMaxDrawdown: number;
  worstMaxDrawdown: number;
  drawdown95thPercentile: number;
}

export interface ReturnDistribution {
  mean: number;
  median: number;
  standardDeviation: number;
  skewness: number;
  kurtosis: number;
}

export interface TailRiskMetrics {
  probabilityOfLoss: number;
  probabilityOfSevereStep: number;
  probabilityOfGain: number;
  probabilityOfBigGain: number;
}

export interface RiskMetrics {
  valueAtRisk: ValueAtRisk;
  expectedShortfall: ExpectedShortfall;
  drawdownAnalysis: DrawdownAnalysis;
  returnDistribution: ReturnDistribution;
  tailRiskMetrics: TailRiskMetrics;
}

export interface PriceLevel {
  priceLevel: number;
  probability: number;
  percentFromCurrent: number;
}

export interface TargetProbability {
  target: number;
  probability: number;
  averageTimeToTarget: number | null;
}

export interface LossProbability {
  lossLevel: number;
  probability: number;
}

export interface ProbabilityAnalysis {
  priceLevelDistribution: PriceLevel[];
  targetProbabilities: TargetProbability[];
  lossProbabilities: LossProbability[];
  keyInsights: {
    mostLikelyPriceRange: PriceLevel | null;
    optimalTargetLevel: TargetProbability;
    riskOfSignificantLoss: number;
  };
}

export interface DominantScenario {
  scenario: string;
  probability: number;
  confidence: number;
  expectedReturn: number;
}

export interface PositionSizing {
  recommendation: string;
  multiplier: number;
  reasoning: string;
}

export interface RiskManagement {
  recommendations: string[];
  maxRiskPerTrade: number;
  stopLossLevel: string;
  diversificationNeeded: boolean;
}

export interface EntryTiming {
  recommendation: string;
  reasoning: string;
  optimalEntryConditions: string[];
}

export interface TargetLevels {
  conservative: number;
  moderate: number;
  aggressive: number;
}

export interface MonteCarloRecommendations {
  dominantScenario: DominantScenario;
  positionSizing: PositionSizing;
  riskManagement: RiskManagement;
  entryTiming: EntryTiming;
  targetLevels: TargetLevels;
}

export interface MonteCarloResult {
  symbol: string;
  timestamp: string;
  scenarioAnalysis: ScenarioAnalysis;
  riskMetrics: RiskMetrics;
  probabilityAnalysis: ProbabilityAnalysis;
  recommendations: MonteCarloRecommendations;
  simulationConfig: MonteCarloOptions;
  marketStats: MarketStatistics;
  currentPrice: number;
  confidence: number;
  reliability: string;
  error?: string;
}

/**
 * Main Monte Carlo Analysis Function
 */
export async function runMonteCarloAnalysis(
  marketData: MarketData,
  ohlcData: OHLCData[],
  technicalAnalysis: TechnicalAnalysis,
  options: MonteCarloOptions = {}
): Promise<MonteCarloResult> {
  try {
    //console.log('🎲 Monte Carlo: Starting probabilistic scenario analysis...');

    // Default simulation parameters
    const config: MonteCarloOptions = {
      simulations: options.simulations || 10000,
      tradingDays: options.tradingDays || 30, // 30 trading days ~ 6 weeks
      confidenceLevels: options.confidenceLevels || [0.90, 0.95, 0.99],
      scenarioTypes: options.scenarioTypes || ['bullish', 'bearish', 'sideways'],
      volatilityLookback: options.volatilityLookback || 20,
      ...options
    };

    const currentPrice = marketData.currentPrice || marketData.latestPrice;
    if (!currentPrice || !ohlcData || ohlcData.length < (config.volatilityLookback || 20)) {
      throw new Error('Insufficient data for Monte Carlo analysis');
    }

    // Calculate market statistics for simulation
    const marketStats = calculateMarketStatistics(ohlcData, config);
    
    // Generate price path simulations
    const simulations = generatePriceSimulations(currentPrice, marketStats, config);
    
    // Analyze scenario outcomes
    const scenarioAnalysis = analyzeScenarioOutcomes(simulations, currentPrice, technicalAnalysis, config);
    
    // Calculate risk metrics
    const riskMetrics = calculateMonteCarloRiskMetrics(simulations, currentPrice, config);
    
    // Generate probability distributions
    const probabilityAnalysis = calculateProbabilityDistributions(simulations, currentPrice, config);
    
    // Create trading recommendations based on scenarios
    const recommendations = generateScenarioRecommendations(scenarioAnalysis, riskMetrics, probabilityAnalysis);
    
    //console.log(`🎲 Monte Carlo: ${config.simulations} simulations complete`);
    //console.log(`   📊 Bullish Probability: ${(scenarioAnalysis.scenarios.bullish.probability * 100).toFixed(1)}%`);
    //console.log(`   📉 Bearish Probability: ${(scenarioAnalysis.scenarios.bearish.probability * 100).toFixed(1)}%`);
    //console.log(`   ↔️ Sideways Probability: ${(scenarioAnalysis.scenarios.sideways.probability * 100).toFixed(1)}%`);
    
    return {
      symbol: marketData.symbol || 'UNKNOWN',
      timestamp: new Date().toISOString(),
      
      // Core Analysis
      scenarioAnalysis,
      riskMetrics,
      probabilityAnalysis,
      recommendations,
      
      // Simulation Data
      simulationConfig: config,
      marketStats,
      currentPrice,
      
      // Performance Metrics
      confidence: calculateOverallConfidence(scenarioAnalysis, riskMetrics),
      reliability: 'HIGH' // Monte Carlo with 10k+ simulations
    };
    
  } catch (error) {
    console.error('❌ Monte Carlo analysis failed:', (error as Error).message);
    return createFallbackMonteCarloAnalysis(marketData);
  }
}

/**
 * Calculate Market Statistics for Simulation
 */
function calculateMarketStatistics(ohlcData: OHLCData[], config: MonteCarloOptions): MarketStatistics {
  const returns: number[] = [];
  const volatilities: number[] = [];
  
  // Calculate daily returns
  for (let i = 1; i < ohlcData.length; i++) {
    const currentClose = ohlcData[i].close;
    const previousClose = ohlcData[i - 1].close;
    const dailyReturn = Math.log(currentClose / previousClose);
    returns.push(dailyReturn);
  }
  
  // Calculate rolling volatilities
  const lookback = config.volatilityLookback || 20;
  for (let i = lookback; i < returns.length; i++) {
    const window = returns.slice(i - lookback, i);
    const mean = window.reduce((sum, ret) => sum + ret, 0) / window.length;
    const variance = window.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (window.length - 1);
    volatilities.push(Math.sqrt(variance * 252)); // Annualized volatility
  }
  
  // Current market regime analysis
  const recentReturns = returns.slice(-20); // Last 20 days
  const meanReturn = recentReturns.reduce((sum, ret) => sum + ret, 0) / recentReturns.length;
  const currentVolatility = volatilities[volatilities.length - 1] || 0.20; // Default 20% if no data
  
  // Market trend analysis
  const shortTermTrend = calculateTrend(ohlcData.slice(-10)); // 10 days
  const mediumTermTrend = calculateTrend(ohlcData.slice(-30)); // 30 days
  
  return {
    meanReturn: meanReturn * 252, // Annualized
    currentVolatility,
    averageVolatility: volatilities.reduce((sum, vol) => sum + vol, 0) / volatilities.length,
    volatilityTrend: volatilities.slice(-5).reduce((sum, vol) => sum + vol, 0) / 5 > currentVolatility ? 'DECREASING' : 'INCREASING',
    shortTermTrend,
    mediumTermTrend,
    marketRegime: determineMarketRegime(meanReturn, currentVolatility),
    correlationToMarket: 0.7, // Placeholder - would calculate from market index
    
    // Risk-adjusted metrics
    sharpeRatio: meanReturn / currentVolatility,
    maxDrawdown: calculateMaxDrawdown(ohlcData),
    
    // Distribution characteristics
    skewness: calculateSkewness(returns),
    kurtosis: calculateKurtosis(returns)
  };
}

/**
 * Generate Monte Carlo Price Simulations
 */
function generatePriceSimulations(
  currentPrice: number,
  marketStats: MarketStatistics,
  config: MonteCarloOptions
): PriceSimulation[] {
  const simulations: PriceSimulation[] = [];
  
  for (let sim = 0; sim < (config.simulations || 10000); sim++) {
    const pricePath = [currentPrice];
    let price = currentPrice;
    
    // Generate random walk with drift and volatility
    for (let day = 1; day <= (config.tradingDays || 30); day++) {
      // Random component with normal distribution
      const randomShock = generateNormalRandom() * marketStats.currentVolatility / Math.sqrt(252);
      
      // Drift component (mean reversion + trend)
      const drift = (marketStats.meanReturn / 252) + getTrendAdjustment(day, marketStats);
      
      // Apply regime-specific adjustments
      const regimeAdjustment = getRegimeAdjustment(marketStats.marketRegime, day);
      
      // Calculate next price
      const logReturn = drift + randomShock + regimeAdjustment;
      price = price * Math.exp(logReturn);
      
      pricePath.push(price);
    }
    
    simulations.push({
      id: sim,
      path: pricePath,
      finalPrice: pricePath[pricePath.length - 1],
      maxPrice: Math.max(...pricePath),
      minPrice: Math.min(...pricePath),
      maxDrawdown: calculatePathDrawdown(pricePath),
      volatility: calculatePathVolatility(pricePath)
    });
  }
  
  return simulations;
}

/**
 * Analyze Scenario Outcomes
 */
function analyzeScenarioOutcomes(
  simulations: PriceSimulation[],
  currentPrice: number,
  technicalAnalysis: TechnicalAnalysis,
  config: MonteCarloOptions
): ScenarioAnalysis {
  const bullishThreshold = 1.05; // 5% gain threshold
  const bearishThreshold = 0.95; // 5% loss threshold
  
  // Resistance and support levels for scenario analysis
  const resistance = technicalAnalysis?.levels?.resistance || currentPrice * 1.10;
  const support = technicalAnalysis?.levels?.support || currentPrice * 0.90;
  
  let bullishCount = 0;
  let bearishCount = 0;
  let sidewaysCount = 0;
  
  const bullishOutcomes: ScenarioOutcome[] = [];
  const bearishOutcomes: ScenarioOutcome[] = [];
  const sidewaysOutcomes: ScenarioOutcome[] = [];
  
  simulations.forEach(simulation => {
    const finalReturn = simulation.finalPrice / currentPrice;
    const maxReturn = simulation.maxPrice / currentPrice;
    const minReturn = simulation.minPrice / currentPrice;
    
    if (finalReturn >= bullishThreshold) {
      bullishCount++;
      bullishOutcomes.push({
        finalReturn,
        maxReturn,
        minReturn,
        breachedResistance: simulation.maxPrice > resistance,
        maxDrawdown: simulation.maxDrawdown
      });
    } else if (finalReturn <= bearishThreshold) {
      bearishCount++;
      bearishOutcomes.push({
        finalReturn,
        maxReturn,
        minReturn,
        breachedSupport: simulation.minPrice < support,
        maxDrawdown: simulation.maxDrawdown
      });
    } else {
      sidewaysCount++;
      sidewaysOutcomes.push({
        finalReturn,
        maxReturn,
        minReturn,
        stayedInRange: simulation.minPrice > support && simulation.maxPrice < resistance,
        maxDrawdown: simulation.maxDrawdown
      });
    }
  });
  
  // Calculate detailed scenario statistics
  const bullishStats = calculateScenarioStats(bullishOutcomes, 'bullish');
  const bearishStats = calculateScenarioStats(bearishOutcomes, 'bearish');
  const sidewaysStats = calculateScenarioStats(sidewaysOutcomes, 'sideways');
  
  return {
    scenarios: {
      bullish: {
        probability: bullishCount / simulations.length,
        count: bullishCount,
        averageReturn: bullishStats.averageReturn,
        medianReturn: bullishStats.medianReturn,
        bestCaseReturn: bullishStats.bestCase,
        worstCaseReturn: bullishStats.worstCase,
        averageMaxDrawdown: bullishStats.averageDrawdown,
        resistanceBreachProbability: bullishStats.resistanceBreachRate
      },
      bearish: {
        probability: bearishCount / simulations.length,
        count: bearishCount,
        averageReturn: bearishStats.averageReturn,
        medianReturn: bearishStats.medianReturn,
        bestCaseReturn: bearishStats.bestCase,
        worstCaseReturn: bearishStats.worstCase,
        averageMaxDrawdown: bearishStats.averageDrawdown,
        supportBreachProbability: bearishStats.supportBreachRate
      },
      sideways: {
        probability: sidewaysCount / simulations.length,
        count: sidewaysCount,
        averageReturn: sidewaysStats.averageReturn,
        medianReturn: sidewaysStats.medianReturn,
        bestCaseReturn: sidewaysStats.bestCase,
        worstCaseReturn: sidewaysStats.worstCase,
        averageMaxDrawdown: sidewaysStats.averageDrawdown,
        rangeHoldProbability: sidewaysStats.rangeHoldRate
      }
    },
    
    // Key levels analysis
    keyLevels: {
      resistance: {
        level: resistance,
        breachProbability: simulations.filter(s => s.maxPrice > resistance).length / simulations.length
      },
      support: {
        level: support,
        breachProbability: simulations.filter(s => s.minPrice < support).length / simulations.length
      }
    }
  };
}

/**
 * Calculate Monte Carlo Risk Metrics
 */
function calculateMonteCarloRiskMetrics(
  simulations: PriceSimulation[],
  currentPrice: number,
  config: MonteCarloOptions
): RiskMetrics {
  const finalReturns = simulations.map(s => (s.finalPrice - currentPrice) / currentPrice);
  finalReturns.sort((a, b) => a - b);
  
  // Value at Risk calculations
  const var90 = finalReturns[Math.floor(finalReturns.length * 0.10)];
  const var95 = finalReturns[Math.floor(finalReturns.length * 0.05)];
  const var99 = finalReturns[Math.floor(finalReturns.length * 0.01)];
  
  // Expected Shortfall (Conditional VaR)
  const es95Index = Math.floor(finalReturns.length * 0.05);
  const expectedShortfall = finalReturns.slice(0, es95Index).reduce((sum, ret) => sum + ret, 0) / es95Index;
  
  // Maximum drawdown analysis
  const drawdowns = simulations.map(s => s.maxDrawdown);
  drawdowns.sort((a, b) => b - a);
  
  return {
    valueAtRisk: {
      var90: var90,
      var95: var95,
      var99: var99,
      interpretation: {
        var95: `95% confidence that losses won't exceed ${Math.abs(var95 * 100).toFixed(1)}%`,
        var99: `99% confidence that losses won't exceed ${Math.abs(var99 * 100).toFixed(1)}%`
      }
    },
    
    expectedShortfall: {
      es95: expectedShortfall,
      interpretation: `Average loss in worst 5% of scenarios: ${Math.abs(expectedShortfall * 100).toFixed(1)}%`
    },
    
    drawdownAnalysis: {
      averageMaxDrawdown: drawdowns.reduce((sum, dd) => sum + dd, 0) / drawdowns.length,
      medianMaxDrawdown: drawdowns[Math.floor(drawdowns.length / 2)],
      worstMaxDrawdown: drawdowns[0],
      drawdown95thPercentile: drawdowns[Math.floor(drawdowns.length * 0.95)]
    },
    
    returnDistribution: {
      mean: finalReturns.reduce((sum, ret) => sum + ret, 0) / finalReturns.length,
      median: finalReturns[Math.floor(finalReturns.length / 2)],
      standardDeviation: calculateStandardDeviation(finalReturns),
      skewness: calculateSkewness(finalReturns),
      kurtosis: calculateKurtosis(finalReturns)
    },
    
    tailRiskMetrics: {
      probabilityOfLoss: finalReturns.filter(ret => ret < 0).length / finalReturns.length,
      probabilityOfSevereStep: finalReturns.filter(ret => ret < -0.15).length / finalReturns.length,
      probabilityOfGain: finalReturns.filter(ret => ret > 0).length / finalReturns.length,
      probabilityOfBigGain: finalReturns.filter(ret => ret > 0.20).length / finalReturns.length
    }
  };
}

/**
 * Calculate Probability Distributions
 */
function calculateProbabilityDistributions(
  simulations: PriceSimulation[],
  currentPrice: number,
  config: MonteCarloOptions
): ProbabilityAnalysis {
  // Price level probabilities
  const priceLevels: PriceLevel[] = [];
  const step = currentPrice * 0.02; // 2% increments
  
  for (let level = currentPrice * 0.5; level <= currentPrice * 1.8; level += step) {
    const probability = simulations.filter(s => 
      s.finalPrice >= level && s.finalPrice < level + step
    ).length / simulations.length;
    
    priceLevels.push({
      priceLevel: level,
      probability: probability,
      percentFromCurrent: (level / currentPrice - 1) * 100
    });
  }
  
  // Target achievement probabilities
  const targets = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30]; // 5% to 30% gains
  const targetProbabilities: TargetProbability[] = targets.map(target => ({
    target: target,
    probability: simulations.filter(s => s.finalPrice >= currentPrice * (1 + target)).length / simulations.length,
    averageTimeToTarget: calculateAverageTimeToTarget(simulations, currentPrice, target)
  }));
  
  // Loss probabilities
  const lossLevels = [0.05, 0.10, 0.15, 0.20, 0.25]; // 5% to 25% losses
  const lossProbabilities: LossProbability[] = lossLevels.map(loss => ({
    lossLevel: loss,
    probability: simulations.filter(s => s.finalPrice <= currentPrice * (1 - loss)).length / simulations.length
  }));
  
  return {
    priceLevelDistribution: priceLevels.filter(p => p.probability > 0.001), // Filter noise
    targetProbabilities,
    lossProbabilities,
    
    // Key probability insights
    keyInsights: {
      mostLikelyPriceRange: findMostLikelyPriceRange(priceLevels, currentPrice),
      optimalTargetLevel: findOptimalTarget(targetProbabilities),
      riskOfSignificantLoss: lossProbabilities.find(l => l.lossLevel === 0.15)?.probability || 0
    }
  };
}

/**
 * Generate Scenario-Based Recommendations
 */
function generateScenarioRecommendations(
  scenarioAnalysis: ScenarioAnalysis,
  riskMetrics: RiskMetrics,
  probabilityAnalysis: ProbabilityAnalysis
): MonteCarloRecommendations {
  const { bullish, bearish, sideways } = scenarioAnalysis.scenarios;
  
  // Determine dominant scenario
  const dominantScenario = bullish.probability > bearish.probability && bullish.probability > sideways.probability ? 'bullish' :
                          bearish.probability > sideways.probability ? 'bearish' : 'sideways';
  
  // Position sizing based on scenarios
  let positionSizing = 'NORMAL';
  if (bullish.probability > 0.6 && riskMetrics.valueAtRisk.var95 > -0.10) {
    positionSizing = 'INCREASED';
  } else if (bearish.probability > 0.5 || riskMetrics.valueAtRisk.var95 < -0.15) {
    positionSizing = 'REDUCED';
  }
  
  // Risk management recommendations
  const riskManagement: string[] = [];
  if (riskMetrics.tailRiskMetrics.probabilityOfSevereStep > 0.15) {
    riskManagement.push('TIGHT_STOP_LOSS');
  }
  if (riskMetrics.drawdownAnalysis.worstMaxDrawdown > 0.25) {
    riskManagement.push('DIVERSIFICATION_REQUIRED');
  }
  if (riskMetrics.valueAtRisk.var99 < -0.20) {
    riskManagement.push('POSITION_SIZE_LIMIT');
  }
  
  // Entry timing recommendations
  let entryTiming = 'NEUTRAL';
  if (bullish.probability > 0.65 && (bullish.resistanceBreachProbability || 0) > 0.4) {
    entryTiming = 'AGGRESSIVE';
  } else if (sideways.probability > 0.5) {
    entryTiming = 'PATIENT';
  } else if (bearish.probability > 0.4) {
    entryTiming = 'CAUTIOUS';
  }
  
  return {
    dominantScenario: {
      scenario: dominantScenario,
      probability: Math.max(bullish.probability, bearish.probability, sideways.probability),
      confidence: calculateScenarioConfidence(scenarioAnalysis),
      expectedReturn: scenarioAnalysis.scenarios[dominantScenario as keyof typeof scenarioAnalysis.scenarios].averageReturn
    },
    
    positionSizing: {
      recommendation: positionSizing,
      multiplier: positionSizing === 'INCREASED' ? 1.25 : 
                 positionSizing === 'REDUCED' ? 0.75 : 1.0,
      reasoning: getPositionSizingReasoning(positionSizing, scenarioAnalysis, riskMetrics)
    },
    
    riskManagement: {
      recommendations: riskManagement,
      maxRiskPerTrade: riskMetrics.valueAtRisk.var95 < -0.15 ? 1.5 : 2.0,
      stopLossLevel: riskMetrics.valueAtRisk.var95 < -0.12 ? 'TIGHT' : 'NORMAL',
      diversificationNeeded: riskMetrics.tailRiskMetrics.probabilityOfSevereStep > 0.20
    },
    
    entryTiming: {
      recommendation: entryTiming,
      reasoning: getEntryTimingReasoning(entryTiming, scenarioAnalysis),
      optimalEntryConditions: generateOptimalEntryConditions(scenarioAnalysis, probabilityAnalysis)
    },
    
    targetLevels: {
      conservative: probabilityAnalysis.targetProbabilities.find(t => t.probability > 0.7)?.target || 0.05,
      moderate: probabilityAnalysis.targetProbabilities.find(t => t.probability > 0.5)?.target || 0.10,
      aggressive: probabilityAnalysis.targetProbabilities.find(t => t.probability > 0.3)?.target || 0.15
    }
  };
}

// Helper Functions

function generateNormalRandom(): number {
  // Box-Muller transformation for normal distribution
  let u = 0, v = 0;
  while(u === 0) u = Math.random();
  while(v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function calculateTrend(ohlcData: OHLCData[]): number {
  if (ohlcData.length < 2) return 0;
  const firstPrice = ohlcData[0].close;
  const lastPrice = ohlcData[ohlcData.length - 1].close;
  return (lastPrice - firstPrice) / firstPrice;
}

function determineMarketRegime(meanReturn: number, volatility: number): string {
  if (meanReturn > 0.1 && volatility < 0.25) return 'BULL_TRENDING';
  if (meanReturn < -0.05 && volatility > 0.30) return 'BEAR_VOLATILE';
  if (volatility > 0.35) return 'HIGH_VOLATILITY';
  if (Math.abs(meanReturn) < 0.05 && volatility < 0.20) return 'LOW_VOLATILITY';
  return 'NEUTRAL';
}

function getTrendAdjustment(day: number, marketStats: MarketStatistics): number {
  // Trend momentum adjustment based on market regime
  const trendFactor = (marketStats.shortTermTrend + marketStats.mediumTermTrend) / 2;
  return trendFactor * 0.1 * (1 - day / 30); // Diminishing trend effect over time
}

function getRegimeAdjustment(regime: string, day: number): number {
  const regimeAdjustments: { [key: string]: number } = {
    'BULL_TRENDING': 0.0005,
    'BEAR_VOLATILE': -0.0008,
    'HIGH_VOLATILITY': generateNormalRandom() * 0.002,
    'LOW_VOLATILITY': 0,
    'NEUTRAL': 0
  };
  return regimeAdjustments[regime] || 0;
}

function calculatePathDrawdown(pricePath: number[]): number {
  let maxDrawdown = 0;
  let peak = pricePath[0];
  
  for (let i = 1; i < pricePath.length; i++) {
    if (pricePath[i] > peak) {
      peak = pricePath[i];
    } else {
      const drawdown = (peak - pricePath[i]) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown;
}

function calculatePathVolatility(pricePath: number[]): number {
  const returns: number[] = [];
  for (let i = 1; i < pricePath.length; i++) {
    returns.push(Math.log(pricePath[i] / pricePath[i - 1]));
  }
  return calculateStandardDeviation(returns);
}

function calculateScenarioStats(outcomes: ScenarioOutcome[], scenarioType: string): ScenarioStats {
  if (outcomes.length === 0) {
    return {
      averageReturn: 0,
      medianReturn: 0,
      bestCase: 0,
      worstCase: 0,
      averageDrawdown: 0,
      resistanceBreachRate: 0,
      supportBreachRate: 0,
      rangeHoldRate: 0
    };
  }
  
  const returns = outcomes.map(o => o.finalReturn).sort((a, b) => a - b);
  const drawdowns = outcomes.map(o => o.maxDrawdown);
  
  return {
    averageReturn: returns.reduce((sum, ret) => sum + ret, 0) / returns.length,
    medianReturn: returns[Math.floor(returns.length / 2)],
    bestCase: returns[returns.length - 1],
    worstCase: returns[0],
    averageDrawdown: drawdowns.reduce((sum, dd) => sum + dd, 0) / drawdowns.length,
    resistanceBreachRate: outcomes.filter(o => o.breachedResistance).length / outcomes.length,
    supportBreachRate: outcomes.filter(o => o.breachedSupport).length / outcomes.length,
    rangeHoldRate: outcomes.filter(o => o.stayedInRange).length / outcomes.length
  };
}

function calculateStandardDeviation(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateSkewness(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 3), 0) / values.length;
  return skewness;
}

function calculateKurtosis(values: number[]): number {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / stdDev, 4), 0) / values.length;
  return kurtosis - 3; // Excess kurtosis
}

function calculateMaxDrawdown(ohlcData: OHLCData[]): number {
  let maxDrawdown = 0;
  let peak = ohlcData[0].close;
  
  for (let i = 1; i < ohlcData.length; i++) {
    if (ohlcData[i].close > peak) {
      peak = ohlcData[i].close;
    } else {
      const drawdown = (peak - ohlcData[i].close) / peak;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
  }
  
  return maxDrawdown;
}

function calculateAverageTimeToTarget(simulations: PriceSimulation[], currentPrice: number, target: number): number | null {
  const targetPrice = currentPrice * (1 + target);
  let totalTime = 0;
  let achievedCount = 0;
  
  simulations.forEach(simulation => {
    for (let i = 0; i < simulation.path.length; i++) {
      if (simulation.path[i] >= targetPrice) {
        totalTime += i;
        achievedCount++;
        break;
      }
    }
  });
  
  return achievedCount > 0 ? totalTime / achievedCount : null;
}

function findMostLikelyPriceRange(priceLevels: PriceLevel[], currentPrice: number): PriceLevel | null {
  let maxProbability = 0;
  let mostLikelyLevel: PriceLevel | null = null;
  
  priceLevels.forEach(level => {
    if (level.probability > maxProbability) {
      maxProbability = level.probability;
      mostLikelyLevel = level;
    }
  });
  
  return mostLikelyLevel;
}

function findOptimalTarget(targetProbabilities: TargetProbability[]): TargetProbability {
  // Find the highest target with reasonable probability (>40%)
  for (let i = targetProbabilities.length - 1; i >= 0; i--) {
    if (targetProbabilities[i].probability > 0.4) {
      return targetProbabilities[i];
    }
  }
  return targetProbabilities[0]; // Fallback to smallest target
}

function calculateOverallConfidence(scenarioAnalysis: ScenarioAnalysis, riskMetrics: RiskMetrics): number {
  const maxScenarioProbability = Math.max(
    scenarioAnalysis.scenarios.bullish.probability,
    scenarioAnalysis.scenarios.bearish.probability,
    scenarioAnalysis.scenarios.sideways.probability
  );
  
  // Higher confidence when one scenario is clearly dominant and risk is manageable
  const riskAdjustment = riskMetrics.valueAtRisk.var95 > -0.15 ? 0.1 : -0.1;
  return Math.min(0.95, maxScenarioProbability + riskAdjustment);
}

function calculateScenarioConfidence(scenarioAnalysis: ScenarioAnalysis): number {
  const probabilities = [
    scenarioAnalysis.scenarios.bullish.probability,
    scenarioAnalysis.scenarios.bearish.probability,
    scenarioAnalysis.scenarios.sideways.probability
  ];
  
  const maxProb = Math.max(...probabilities);
  const entropy = probabilities.reduce((sum, p) => p > 0 ? sum - p * Math.log2(p) : sum, 0);
  const maxEntropy = Math.log2(3); // Maximum entropy for 3 scenarios
  
  return 1 - (entropy / maxEntropy); // Normalized confidence
}

function getPositionSizingReasoning(
  positionSizing: string,
  scenarioAnalysis: ScenarioAnalysis,
  riskMetrics: RiskMetrics
): string {
  const { bullish, bearish } = scenarioAnalysis.scenarios;
  
  if (positionSizing === 'INCREASED') {
    return `Strong bullish probability (${(bullish.probability * 100).toFixed(1)}%) with manageable downside risk`;
  } else if (positionSizing === 'REDUCED') {
    return bearish.probability > 0.5 ? 
      `High bearish probability (${(bearish.probability * 100).toFixed(1)}%) requires defensive positioning` :
      `Excessive tail risk detected (VaR 95%: ${(riskMetrics.valueAtRisk.var95 * 100).toFixed(1)}%)`;
  } else {
    return 'Balanced scenario probabilities suggest standard position sizing';
  }
}

function getEntryTimingReasoning(entryTiming: string, scenarioAnalysis: ScenarioAnalysis): string {
  const { bullish, bearish, sideways } = scenarioAnalysis.scenarios;
  
  if (entryTiming === 'AGGRESSIVE') {
    return `High bullish probability (${(bullish.probability * 100).toFixed(1)}%) with strong breakout potential`;
  } else if (entryTiming === 'CAUTIOUS') {
    return `Elevated bearish risk (${(bearish.probability * 100).toFixed(1)}%) warrants careful entry timing`;
  } else if (entryTiming === 'PATIENT') {
    return `High sideways probability (${(sideways.probability * 100).toFixed(1)}%) suggests waiting for clearer direction`;
  } else {
    return 'Balanced scenario probabilities allow for standard entry timing';
  }
}

function generateOptimalEntryConditions(
  scenarioAnalysis: ScenarioAnalysis,
  probabilityAnalysis: ProbabilityAnalysis
): string[] {
  const conditions: string[] = [];
  
  if (scenarioAnalysis.scenarios.bullish.probability > 0.6) {
    conditions.push('Volume confirmation above average');
    conditions.push('Break above key resistance level');
  }
  
  if (scenarioAnalysis.scenarios.bearish.probability > 0.4) {
    conditions.push('Wait for oversold conditions');
    conditions.push('Confirm support level holding');
  }
  
  if (scenarioAnalysis.scenarios.sideways.probability > 0.5) {
    conditions.push('Enter at range support');
    conditions.push('Target range resistance');
  }
  
  return conditions.length > 0 ? conditions : ['Standard entry conditions apply'];
}

function createFallbackMonteCarloAnalysis(marketData: MarketData): MonteCarloResult {
  return {
    symbol: marketData.symbol || 'UNKNOWN',
    timestamp: new Date().toISOString(),
    
    scenarioAnalysis: {
      scenarios: {
        bullish: { 
          probability: 0.33, 
          count: 3300,
          averageReturn: 0.08,
          medianReturn: 0.07,
          bestCaseReturn: 0.15,
          worstCaseReturn: 0.01,
          averageMaxDrawdown: 0.03
        },
        bearish: { 
          probability: 0.33, 
          count: 3300,
          averageReturn: -0.06,
          medianReturn: -0.05,
          bestCaseReturn: -0.01,
          worstCaseReturn: -0.12,
          averageMaxDrawdown: 0.08
        },
        sideways: { 
          probability: 0.34, 
          count: 3400,
          averageReturn: 0.01,
          medianReturn: 0.01,
          bestCaseReturn: 0.04,
          worstCaseReturn: -0.02,
          averageMaxDrawdown: 0.02
        }
      },
      keyLevels: {
        resistance: { level: (marketData.currentPrice || 100) * 1.1, breachProbability: 0.2 },
        support: { level: (marketData.currentPrice || 100) * 0.9, breachProbability: 0.2 }
      }
    },
    
    riskMetrics: {
      valueAtRisk: { 
        var90: -0.08,
        var95: -0.12, 
        var99: -0.18,
        interpretation: {
          var95: '95% confidence that losses won\'t exceed 12.0%',
          var99: '99% confidence that losses won\'t exceed 18.0%'
        }
      },
      expectedShortfall: {
        es95: -0.15,
        interpretation: 'Average loss in worst 5% of scenarios: 15.0%'
      },
      drawdownAnalysis: {
        averageMaxDrawdown: 0.04,
        medianMaxDrawdown: 0.03,
        worstMaxDrawdown: 0.12,
        drawdown95thPercentile: 0.08
      },
      returnDistribution: {
        mean: 0.01,
        median: 0.01,
        standardDeviation: 0.08,
        skewness: 0.1,
        kurtosis: 0.2
      },
      tailRiskMetrics: { 
        probabilityOfLoss: 0.4,
        probabilityOfSevereStep: 0.15,
        probabilityOfGain: 0.6,
        probabilityOfBigGain: 0.1
      }
    },

    probabilityAnalysis: {
      priceLevelDistribution: [],
      targetProbabilities: [
        { target: 0.05, probability: 0.6, averageTimeToTarget: 15 },
        { target: 0.10, probability: 0.4, averageTimeToTarget: 25 }
      ],
      lossProbabilities: [
        { lossLevel: 0.05, probability: 0.3 },
        { lossLevel: 0.10, probability: 0.2 }
      ],
      keyInsights: {
        mostLikelyPriceRange: null,
        optimalTargetLevel: { target: 0.05, probability: 0.6, averageTimeToTarget: 15 },
        riskOfSignificantLoss: 0.15
      }
    },
    
    recommendations: {
      dominantScenario: { scenario: 'sideways', probability: 0.34, confidence: 0.5, expectedReturn: 0.01 },
      positionSizing: { recommendation: 'NORMAL', multiplier: 1.0, reasoning: 'Balanced scenario probabilities suggest standard position sizing' },
      riskManagement: {
        recommendations: [],
        maxRiskPerTrade: 2.0,
        stopLossLevel: 'NORMAL',
        diversificationNeeded: false
      },
      entryTiming: { recommendation: 'NEUTRAL', reasoning: 'Balanced scenario probabilities allow for standard entry timing', optimalEntryConditions: ['Standard entry conditions apply'] },
      targetLevels: { conservative: 0.05, moderate: 0.10, aggressive: 0.15 }
    },

    simulationConfig: { simulations: 10000, tradingDays: 30 },
    marketStats: {
      meanReturn: 0.05,
      currentVolatility: 0.20,
      averageVolatility: 0.18,
      volatilityTrend: 'NEUTRAL',
      shortTermTrend: 0.01,
      mediumTermTrend: 0.02,
      marketRegime: 'NEUTRAL',
      correlationToMarket: 0.7,
      sharpeRatio: 0.25,
      maxDrawdown: 0.08,
      skewness: 0.1,
      kurtosis: 0.2
    },
    currentPrice: marketData.currentPrice || marketData.latestPrice || 100,
    
    confidence: 0.3,
    reliability: 'LOW',
    error: 'Fallback analysis - insufficient data for full Monte Carlo simulation'
  };
}

export default { runMonteCarloAnalysis };
