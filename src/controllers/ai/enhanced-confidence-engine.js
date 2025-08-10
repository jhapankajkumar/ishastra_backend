// ==============================================
// ENHANCED DYNAMIC CONFIDENCE SCORING ENGINE
// Multi-factor confidence with time decay and market regime awareness
// ==============================================

/**
 * Enhanced Dynamic Confidence Scoring with 8 weighted factors
 * Replaces basic confidence with sophisticated multi-factor analysis
 */
function calculateEnhancedConfidence(signals, technical, sentiment, backtest, marketContext) {
  console.log(`🔍 Enhanced Confidence Engine: Analyzing ${signals.all?.length || 0} signals...`);
  
  const confidenceFactors = {
    // Factor 1: Signal Confluence (30% weight)
    signalConfluence: calculateSignalConfluence(signals),
    
    // Factor 2: Time Decay (15% weight) 
    timeDecay: calculateTimeDecay(signals, technical),
    
    // Factor 3: Volume Confirmation (15% weight)
    volumeConfirmation: calculateVolumeConfirmation(technical),
    
    // Factor 4: Pattern Strength (10% weight)
    patternStrength: calculatePatternStrength(technical.advancedPatterns),
    
    // Factor 5: Market Regime Alignment (10% weight)
    marketRegime: calculateMarketRegimeAlignment(technical, marketContext),
    
    // Factor 6: Sentiment Consistency (10% weight)
    sentimentConsistency: calculateSentimentConsistency(sentiment),
    
    // Factor 7: Backtest Reliability (5% weight)
    backtestReliability: calculateBacktestReliability(backtest),
    
    // Factor 8: Risk-Adjusted Performance (5% weight)
    riskAdjusted: calculateRiskAdjustedConfidence(technical, backtest)
  };
  
  // Calculate weighted confidence score
  const weights = {
    signalConfluence: 0.30,
    timeDecay: 0.15,
    volumeConfirmation: 0.15,
    patternStrength: 0.10,
    marketRegime: 0.10,
    sentimentConsistency: 0.10,
    backtestReliability: 0.05,
    riskAdjusted: 0.05
  };
  
  let enhancedConfidence = 0;
  const factorBreakdown = {};
  
  Object.entries(confidenceFactors).forEach(([factor, score]) => {
    const weightedScore = score * weights[factor];
    enhancedConfidence += weightedScore;
    factorBreakdown[factor] = {
      rawScore: Math.round(score * 100),
      weight: Math.round(weights[factor] * 100),
      contribution: Math.round(weightedScore * 100)
    };
  });
  
  // Apply dynamic threshold adjustments based on market conditions
  const dynamicThreshold = calculateDynamicThreshold(technical, marketContext);
  const adjustedConfidence = Math.max(0, Math.min(1, enhancedConfidence + dynamicThreshold));
  
  console.log(`📊 Enhanced Confidence: ${(adjustedConfidence * 100).toFixed(1)}% (${Object.keys(confidenceFactors).length} factors)`);
  
  return {
    enhancedConfidence: adjustedConfidence,
    factorBreakdown,
    dynamicThreshold: Math.round(dynamicThreshold * 100),
    confidenceGrade: getConfidenceGrade(adjustedConfidence),
    factors: confidenceFactors
  };
}

// Factor 1: Signal Confluence Analysis
function calculateSignalConfluence(signals) {
  const allSignals = signals.all || [];
  if (allSignals.length === 0) return 0.3; // Low confidence for no signals
  
  // Group signals by direction
  const bullishSignals = allSignals.filter(s => s.signal === 'BUY' || s.signal === 'BULLISH');
  const bearishSignals = allSignals.filter(s => s.signal === 'SELL' || s.signal === 'BEARISH');
  const neutralSignals = allSignals.filter(s => s.signal === 'NEUTRAL');
  
  const totalSignals = allSignals.length;
  const maxDirection = Math.max(bullishSignals.length, bearishSignals.length);
  const confluenceRatio = maxDirection / totalSignals;
  
  // Bonus for high-confidence signals agreeing
  const avgConfidence = allSignals.reduce((sum, s) => sum + (s.confidence || 0.5), 0) / totalSignals;
  const confluenceBonus = confluenceRatio > 0.7 ? 0.1 : 0;
  
  return Math.min(0.95, confluenceRatio * avgConfidence + confluenceBonus);
}

// Factor 2: Time Decay Analysis
function calculateTimeDecay(signals, technical) {
  const now = Date.now();
  const signalAges = signals.all?.map(s => {
    const signalTime = s.timestamp ? new Date(s.timestamp).getTime() : now;
    return (now - signalTime) / (1000 * 60 * 60); // Hours
  }) || [];
  
  if (signalAges.length === 0) return 0.5;
  
  // Apply exponential decay: fresh signals (0-2h) = 1.0, stale signals (>24h) = 0.3
  const decayScores = signalAges.map(age => {
    if (age <= 2) return 1.0;
    if (age <= 6) return 0.9;
    if (age <= 12) return 0.7;
    if (age <= 24) return 0.5;
    return 0.3;
  });
  
  return decayScores.reduce((sum, score) => sum + score, 0) / decayScores.length;
}

// Factor 3: Volume Confirmation
function calculateVolumeConfirmation(technical) {
  const currentVolume = technical?.latestVolume || 0;
  const avgVolume = technical?.technicalIndicators?.latest?.avgVolume || currentVolume;
  
  if (!avgVolume || avgVolume === 0) return 0.5;
  
  const volumeRatio = currentVolume / avgVolume;
  
  // Volume confirmation scoring
  if (volumeRatio >= 2.0) return 0.95; // Exceptional volume
  if (volumeRatio >= 1.5) return 0.85; // Strong volume
  if (volumeRatio >= 1.2) return 0.75; // Good volume
  if (volumeRatio >= 0.8) return 0.6;  // Average volume
  return 0.4; // Low volume
}

// Factor 4: Pattern Strength Analysis
function calculatePatternStrength(patterns) {
  if (!patterns || patterns.length === 0) return 0.5;
  
  // Weight patterns by confidence and reliability
  const patternScores = patterns.map(pattern => {
    const confidence = pattern.confidence || 0.5;
    const reliabilityBonus = ['head_and_shoulders', 'double_top', 'double_bottom', 'triangle'].includes(pattern.pattern) ? 0.1 : 0;
    return Math.min(0.95, confidence + reliabilityBonus);
  });
  
  // Average of top 3 patterns (or all if fewer)
  const topPatterns = patternScores.sort((a, b) => b - a).slice(0, 3);
  return topPatterns.reduce((sum, score) => sum + score, 0) / topPatterns.length;
}

// Factor 5: Market Regime Alignment
function calculateMarketRegimeAlignment(technical, marketContext) {
  const currentPrice = technical?.currentPrice || technical?.latestPrice || 0;
  const ema200 = technical?.technicalIndicators?.latest?.ema200;
  
  if (!ema200) return 0.5;
  
  const trendStrength = Math.abs((currentPrice - ema200) / ema200);
  const atr = technical?.technicalIndicators?.latest?.atr || (currentPrice * 0.02);
  const volatility = (atr / currentPrice) * 100;
  
  // Strong trends with normal volatility = higher confidence
  let regimeScore = 0.5;
  if (trendStrength > 0.05 && volatility < 3) regimeScore = 0.8;  // Strong trend, low vol
  else if (trendStrength > 0.02 && volatility < 5) regimeScore = 0.7; // Moderate trend, normal vol
  else if (volatility > 8) regimeScore = 0.3; // High volatility regime
  
  return regimeScore;
}

// Factor 6: Sentiment Consistency
function calculateSentimentConsistency(sentiment) {
  if (!sentiment) return 0.5;
  
  const sentimentScore = Math.abs(sentiment.sentimentScore || 0);
  const confidence = sentiment.confidence || 0.5;
  const newsCount = sentiment.newsCount || 0;
  
  // More news articles + consistent sentiment = higher confidence
  let consistencyScore = (sentimentScore + confidence) / 2;
  
  if (newsCount >= 10) consistencyScore += 0.1;
  else if (newsCount >= 5) consistencyScore += 0.05;
  
  return Math.min(0.95, consistencyScore);
}

// Factor 7: Backtest Reliability
function calculateBacktestReliability(backtest) {
  if (!backtest) return 0.5;
  
  const winRate = backtest.bestSystemWinRate || 0;
  const totalTrades = backtest.totalTrades || 0;
  const returnRate = backtest.bestSystemReturn || 0;
  
  // Statistical significance bonus for more trades
  let reliabilityScore = winRate / 100;
  if (totalTrades >= 50) reliabilityScore += 0.1;
  else if (totalTrades >= 20) reliabilityScore += 0.05;
  
  // Positive return bonus
  if (returnRate > 0) reliabilityScore += 0.05;
  
  return Math.min(0.95, reliabilityScore);
}

// Factor 8: Risk-Adjusted Confidence
function calculateRiskAdjustedConfidence(technical, backtest) {
  const atr = technical?.technicalIndicators?.latest?.atr || 0;
  const currentPrice = technical?.currentPrice || technical?.latestPrice || 1;
  const volatility = (atr / currentPrice) * 100;
  
  const sharpeRatio = backtest?.sharpeRatio || 0;
  const maxDrawdown = backtest?.maxDrawdown || 0;
  
  // Lower volatility + higher Sharpe + lower drawdown = higher confidence
  let riskScore = 0.5;
  if (sharpeRatio > 1.5 && maxDrawdown < 0.15) riskScore = 0.9;
  else if (sharpeRatio > 1.0 && maxDrawdown < 0.25) riskScore = 0.7;
  else if (volatility > 8) riskScore = 0.3; // High volatility penalty
  
  return riskScore;
}

// Dynamic threshold adjustment based on market conditions
function calculateDynamicThreshold(technical, marketContext) {
  let threshold = 0;
  
  // VIX or volatility adjustment
  const atr = technical?.technicalIndicators?.latest?.atr || 0;
  const currentPrice = technical?.currentPrice || technical?.latestPrice || 1;
  const volatility = (atr / currentPrice) * 100;
  
  if (volatility > 6) threshold -= 0.1; // High volatility = lower threshold
  if (volatility < 2) threshold += 0.05; // Low volatility = higher threshold
  
  // Market trend adjustment
  const ema200 = technical?.technicalIndicators?.latest?.ema200;
  if (ema200 && currentPrice) {
    const trendStrength = (currentPrice - ema200) / ema200;
    if (Math.abs(trendStrength) > 0.1) threshold += 0.05; // Strong trend bonus
  }
  
  return threshold;
}

// Convert confidence to letter grade
function getConfidenceGrade(confidence) {
  if (confidence >= 0.9) return 'A+';
  if (confidence >= 0.85) return 'A';
  if (confidence >= 0.8) return 'A-';
  if (confidence >= 0.75) return 'B+';
  if (confidence >= 0.7) return 'B';
  if (confidence >= 0.65) return 'B-';
  if (confidence >= 0.6) return 'C+';
  if (confidence >= 0.55) return 'C';
  if (confidence >= 0.5) return 'C-';
  return 'D';
}

module.exports = {
  calculateEnhancedConfidence,
  calculateSignalConfluence,
  calculateTimeDecay,
  calculateVolumeConfirmation,
  calculatePatternStrength,
  calculateMarketRegimeAlignment,
  calculateSentimentConsistency,
  calculateBacktestReliability,
  calculateRiskAdjustedConfidence,
  getConfidenceGrade
};
