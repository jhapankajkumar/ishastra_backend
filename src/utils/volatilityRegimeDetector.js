// ==============================================
// ADVANCED VOLATILITY REGIME DETECTION ENGINE
// Classifies market volatility regimes for optimal risk management
// ==============================================

/**
 * Advanced Volatility Regime Detection
 * Identifies 5 distinct volatility regimes with adaptive position sizing
 */
function detectVolatilityRegime(ohlcData, technicalIndicators) {
  console.log(`📊 Volatility Regime Detection: Analyzing ${ohlcData.length} data points...`);
  
  if (!ohlcData || ohlcData.length < 50) {
    return {
      regime: 'UNKNOWN',
      confidence: 0,
      atrPercent: 0,
      positionSizeMultiplier: 0.5
    };
  }
  
  // Calculate multiple volatility measures
  const atr = technicalIndicators?.atr || calculateATR(ohlcData);
  const currentPrice = ohlcData[ohlcData.length - 1].close;
  const atrPercent = (atr / currentPrice) * 100;
  
  const volatilityMeasures = {
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
  
  console.log(`📈 Volatility Regime: ${regime.type} (${(regime.confidence * 100).toFixed(1)}% confidence)`);
  console.log(`   ATR: ${atrPercent.toFixed(2)}% | Realized Vol: ${volatilityMeasures.realizedVolatility.toFixed(2)}%`);
  
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
function classifyVolatilityRegime(measures, ohlcData) {
  const atr = measures.atrPercent;
  const realized = measures.realizedVolatility;
  
  // 🐛 BUG FIX: Make volatility measures consistent for proper regime classification
  // Convert ATR from daily to annualized to match realized volatility and historical percentiles
  const atrAnnualized = atr * Math.sqrt(252);
  const avg = (atrAnnualized + realized) / 2;
  
  console.log(`   🔍 Volatility Debug: ATR=${atr.toFixed(2)}% (daily) → ${atrAnnualized.toFixed(2)}% (annualized), Realized=${realized.toFixed(2)}% (annualized), Avg=${avg.toFixed(2)}%`);
  
  // Historical volatility percentiles (based on 252-day rolling annualized)
  const historical = ohlcData.slice(-252).map((_, i, arr) => {
    if (i < 20) return null;
    const segment = arr.slice(i-20, i);
    const returns = segment.slice(1).map((d, j) => 
      Math.log(d.close / segment[j].close)
    );
    return Math.sqrt(returns.reduce((sum, r) => sum + r*r, 0) / returns.length) * Math.sqrt(252) * 100;
  }).filter(v => v !== null);
  
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
        description: 'High volatility - Elevated risk environment',
        riskLevel: 'HIGH',
        typicalDuration: '2-8 weeks',
        marketBehavior: 'Increased uncertainty, trend reversals likely',
        signals: ['VIX 20-35', 'ATR 4-8%', 'Frequent gap moves']
      }
    };
  } else if (avg <= p25) {
    return {
      type: 'LOW_VOLATILITY',
      confidence: Math.min(0.9, (p25 - avg) / p25 + 0.6),
      characteristics: {
        description: 'Low volatility - Complacency mode',
        riskLevel: 'LOW',
        typicalDuration: '1-6 months',
        marketBehavior: 'Trending markets, low correlation, carry trades work',
        signals: ['VIX < 15', 'ATR < 1.5%', 'Compressed ranges']
      }
    };
  } else if (avg <= p50) {
    return {
      type: 'NORMAL_LOW',
      confidence: 0.7,
      characteristics: {
        description: 'Below normal volatility - Stable environment',
        riskLevel: 'MODERATE',
        typicalDuration: '1-3 months',
        marketBehavior: 'Steady trends, normal market function',
        signals: ['VIX 15-20', 'ATR 1.5-3%', 'Regular market cycles']
      }
    };
  } else {
    return {
      type: 'NORMAL_HIGH',
      confidence: 0.7,
      characteristics: {
        description: 'Above normal volatility - Elevated but manageable',
        riskLevel: 'MODERATE',
        typicalDuration: '2-6 weeks',
        marketBehavior: 'Choppy markets, false breakouts common',
        signals: ['VIX 20-25', 'ATR 3-4%', 'Whipsaw price action']
      }
    };
  }
}

// Calculate regime-specific adjustments
function calculateRegimeAdjustments(regime, measures) {
  const adjustments = {
    positionSizeMultiplier: 1.0,
    stopLossMultiplier: 1.0,
    targetAdjustment: 1.0,
    maxRiskPercent: 2.0,
    timeframeAdjustment: 'STANDARD',
    entryFilterStrength: 'NORMAL'
  };
  
  switch (regime.type) {
    case 'CRISIS':
      adjustments.positionSizeMultiplier = 0.25; // Quarter size
      adjustments.stopLossMultiplier = 2.0; // Wider stops
      adjustments.targetAdjustment = 1.5; // Bigger targets
      adjustments.maxRiskPercent = 0.5; // Max 0.5% risk
      adjustments.timeframeAdjustment = 'SHORTER'; // Faster exits
      adjustments.entryFilterStrength = 'VERY_STRICT'; // Only A+ setups
      break;
      
    case 'HIGH_VOLATILITY':
      adjustments.positionSizeMultiplier = 0.5; // Half size
      adjustments.stopLossMultiplier = 1.5; // Slightly wider stops
      adjustments.targetAdjustment = 1.3; // Bigger targets
      adjustments.maxRiskPercent = 1.0; // Max 1% risk
      adjustments.timeframeAdjustment = 'SHORTER';
      adjustments.entryFilterStrength = 'STRICT'; // A- or better setups
      break;
      
    case 'LOW_VOLATILITY':
      adjustments.positionSizeMultiplier = 1.5; // Bigger positions
      adjustments.stopLossMultiplier = 0.8; // Tighter stops
      adjustments.targetAdjustment = 0.8; // Smaller targets
      adjustments.maxRiskPercent = 3.0; // Can risk more
      adjustments.timeframeAdjustment = 'LONGER'; // Hold longer
      adjustments.entryFilterStrength = 'RELAXED'; // B+ setups OK
      break;
      
    case 'NORMAL_LOW':
      adjustments.positionSizeMultiplier = 1.2;
      adjustments.stopLossMultiplier = 0.9;
      adjustments.targetAdjustment = 0.9;
      adjustments.maxRiskPercent = 2.5;
      adjustments.timeframeAdjustment = 'STANDARD';
      adjustments.entryFilterStrength = 'NORMAL';
      break;
      
    case 'NORMAL_HIGH':
      adjustments.positionSizeMultiplier = 0.8;
      adjustments.stopLossMultiplier = 1.1;
      adjustments.targetAdjustment = 1.1;
      adjustments.maxRiskPercent = 1.5;
      adjustments.timeframeAdjustment = 'STANDARD';
      adjustments.entryFilterStrength = 'NORMAL';
      break;
  }
  
  return adjustments;
}

// Calculate various volatility measures
function calculateRealizedVolatility(ohlcData, period = 20) {
  const returns = [];
  for (let i = 1; i < ohlcData.length; i++) {
    const return_ = Math.log(ohlcData[i].close / ohlcData[i-1].close);
    returns.push(return_);
  }
  
  const recentReturns = returns.slice(-period);
  const mean = recentReturns.reduce((a, b) => a + b, 0) / recentReturns.length;
  const variance = recentReturns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / recentReturns.length;
  
  return Math.sqrt(variance * 252) * 100; // Annualized percentage
}

function calculateGARCHVolatility(ohlcData, period = 50) {
  // Simplified GARCH(1,1) estimation
  const returns = [];
  for (let i = 1; i < Math.min(ohlcData.length, period); i++) {
    returns.push(Math.log(ohlcData[i].close / ohlcData[i-1].close));
  }
  
  // GARCH parameters (simplified estimation)
  const alpha = 0.1; // Weight on last squared return
  const beta = 0.85;  // Weight on last variance
  const omega = 0.05; // Long-term variance
  
  let variance = omega;
  for (let i = 1; i < returns.length; i++) {
    variance = omega + alpha * Math.pow(returns[i-1], 2) + beta * variance;
  }
  
  return Math.sqrt(variance * 252) * 100;
}

function calculateParkinsonVolatility(ohlcData, period = 20) {
  // Parkinson's estimator using high-low data
  const recentData = ohlcData.slice(-period);
  const hlRatios = recentData.map(d => Math.log(d.high / d.low));
  const sumSquares = hlRatios.reduce((sum, ratio) => sum + Math.pow(ratio, 2), 0);
  
  return Math.sqrt(sumSquares / (4 * Math.log(2) * period) * 252) * 100;
}

function calculateGarmanKlassVolatility(ohlcData, period = 20) {
  // Garman-Klass estimator
  const recentData = ohlcData.slice(-period);
  let sum = 0;
  
  for (const d of recentData) {
    const hlTerm = Math.pow(Math.log(d.high / d.low), 2);
    const ocTerm = (2 * Math.log(2) - 1) * Math.pow(Math.log(d.close / d.open), 2);
    sum += hlTerm - ocTerm;
  }
  
  return Math.sqrt(sum / period * 252) * 100;
}

function calculateYangZhangVolatility(ohlcData, period = 20) {
  // Yang-Zhang estimator (most efficient for OHLC data)
  if (ohlcData.length < period + 1) return 0;
  
  const recentData = ohlcData.slice(-period - 1);
  let sum = 0;
  
  for (let i = 1; i < recentData.length; i++) {
    const prev = recentData[i-1];
    const curr = recentData[i];
    
    const overnight = Math.log(curr.open / prev.close);
    const openToHigh = Math.log(curr.high / curr.open);
    const openToLow = Math.log(curr.low / curr.open);
    const closeToOpen = Math.log(curr.close / curr.open);
    
    sum += Math.pow(overnight, 2) + 
           (openToHigh * closeToOpen) + 
           (openToLow * closeToOpen);
  }
  
  return Math.sqrt(sum / (period - 1) * 252) * 100;
}

// Calculate historical context
function calculateHistoricalContext(measures, ohlcData) {
  const historicalATR = [];
  
  // Calculate 1-year rolling ATR percentiles
  for (let i = 252; i < ohlcData.length; i++) {
    const segment = ohlcData.slice(i-252, i);
    const atr = calculateATR(segment);
    const atrPercent = (atr / segment[segment.length-1].close) * 100;
    historicalATR.push(atrPercent);
  }
  
  if (historicalATR.length === 0) return null;
  
  const currentATR = measures.atrPercent;
  const percentileRank = historicalATR.filter(v => v < currentATR).length / historicalATR.length * 100;
  
  return {
    currentPercentile: Math.round(percentileRank),
    historical1Year: {
      min: Math.min(...historicalATR),
      max: Math.max(...historicalATR),
      median: percentile(historicalATR, 50),
      p25: percentile(historicalATR, 25),
      p75: percentile(historicalATR, 75)
    },
    interpretation: getVolatilityInterpretation(percentileRank)
  };
}

// Generate regime-specific recommendations
function generateRegimeRecommendations(regime, adjustments) {
  const recommendations = {
    tradingStyle: '',
    riskManagement: '',
    entryTiming: '',
    positionManagement: '',
    avoidances: []
  };
  
  switch (regime.type) {
    case 'CRISIS':
      recommendations.tradingStyle = 'Defensive - Focus on capital preservation';
      recommendations.riskManagement = 'Maximum risk control - Wide stops, small sizes';
      recommendations.entryTiming = 'Wait for extreme oversold/overbought levels';
      recommendations.positionManagement = 'Quick profits, trail stops aggressively';
      recommendations.avoidances = ['Momentum trades', 'Breakout strategies', 'Carry trades'];
      break;
      
    case 'HIGH_VOLATILITY':
      recommendations.tradingStyle = 'Cautious - Reduce position sizes significantly';
      recommendations.riskManagement = 'Enhanced stops and position limits';
      recommendations.entryTiming = 'Wait for strong confirmation signals';
      recommendations.positionManagement = 'Take profits quickly, avoid holding through volatility';
      recommendations.avoidances = ['Range trading', 'Small timeframe trades'];
      break;
      
    case 'LOW_VOLATILITY':
      recommendations.tradingStyle = 'Aggressive - Capture trending moves';
      recommendations.riskManagement = 'Can use tighter stops and larger positions';
      recommendations.entryTiming = 'Earlier entries acceptable, trends likely to continue';
      recommendations.positionManagement = 'Let winners run, trail stops wider';
      recommendations.avoidances = ['Scalping strategies', 'Mean reversion too early'];
      break;
      
    case 'NORMAL_LOW':
      recommendations.tradingStyle = 'Balanced - Standard strategies work well';
      recommendations.riskManagement = 'Normal risk parameters with slight size increase';
      recommendations.entryTiming = 'Standard entry rules apply';
      recommendations.positionManagement = 'Normal profit taking and stop management';
      recommendations.avoidances = ['Overcomplication'];
      break;
      
    case 'NORMAL_HIGH':
      recommendations.tradingStyle = 'Moderate - Slightly defensive approach';
      recommendations.riskManagement = 'Modest position size reduction advised';
      recommendations.entryTiming = 'Wait for better risk/reward setups';
      recommendations.positionManagement = 'More frequent profit taking';
      recommendations.avoidances = ['Low probability setups', 'Overtrading'];
      break;
  }
  
  return recommendations;
}

// Helper functions
function calculateATR(ohlcData, period = 14) {
  if (ohlcData.length < period + 1) return 0;
  
  const trueRanges = [];
  for (let i = 1; i < ohlcData.length; i++) {
    const high = ohlcData[i].high;
    const low = ohlcData[i].low;
    const prevClose = ohlcData[i-1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  return trueRanges.slice(-period).reduce((a, b) => a + b, 0) / period;
}

function percentile(arr, p) {
  const sorted = [...arr].sort((a, b) => a - b);
  const index = (p / 100) * (sorted.length - 1);
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  
  if (lower === upper) return sorted[lower];
  
  return sorted[lower] + (index - lower) * (sorted[upper] - sorted[lower]);
}

function getVolatilityInterpretation(percentileRank) {
  if (percentileRank >= 90) return 'Extremely high volatility - Top 10% historically';
  if (percentileRank >= 75) return 'High volatility - Top quartile';
  if (percentileRank >= 50) return 'Above average volatility';
  if (percentileRank >= 25) return 'Below average volatility';
  return 'Low volatility - Bottom quartile';
}

module.exports = {
  detectVolatilityRegime,
  classifyVolatilityRegime,
  calculateRegimeAdjustments,
  calculateRealizedVolatility,
  calculateGARCHVolatility,
  calculateParkinsonVolatility,
  calculateGarmanKlassVolatility,
  calculateYangZhangVolatility,
  calculateHistoricalContext,
  generateRegimeRecommendations
};
