/**
 * 📊 TECHNICAL CALCULATORS
 * Essential technical analysis functions for institutional engines
 * REALISTIC IMPLEMENTATION - Using only public data
 */

/**
 * Calculate Volume Weighted Average Price (VWAP)
 * ✅ ACHIEVABLE: Uses public OHLCV data
 */
function calculateVWAP(ohlcData) {
  if (!ohlcData || ohlcData.length === 0) {
    return null;
  }

  let totalVolume = 0;
  let totalVolumePrice = 0;

  for (const bar of ohlcData) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    const volume = bar.volume || 0;
    
    totalVolumePrice += typicalPrice * volume;
    totalVolume += volume;
  }

  return totalVolume > 0 ? totalVolumePrice / totalVolume : null;
}

/**
 * Calculate Average True Range (ATR)
 * ✅ ACHIEVABLE: Standard technical indicator
 */
function calculateATR(ohlcData, period = 14) {
  if (!ohlcData || ohlcData.length < period + 1) {
    return null;
  }

  const trueRanges = [];

  for (let i = 1; i < ohlcData.length; i++) {
    const current = ohlcData[i];
    const previous = ohlcData[i - 1];
    
    const tr1 = current.high - current.low;
    const tr2 = Math.abs(current.high - previous.close);
    const tr3 = Math.abs(current.low - previous.close);
    
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }

  // Calculate ATR using simple moving average
  const recentTRs = trueRanges.slice(-period);
  return recentTRs.reduce((sum, tr) => sum + tr, 0) / recentTRs.length;
}

/**
 * Calculate Volume Profile (Price-Volume distribution)
 * ✅ ACHIEVABLE: Uses public OHLCV data
 */
function calculateVolumeProfile(ohlcData, bins = 20) {
  if (!ohlcData || ohlcData.length === 0) {
    return { volumeProfile: [], pocLevel: null, valueAreaHigh: null, valueAreaLow: null };
  }

  // Find price range
  let minPrice = Infinity;
  let maxPrice = -Infinity;
  
  for (const bar of ohlcData) {
    minPrice = Math.min(minPrice, bar.low);
    maxPrice = Math.max(maxPrice, bar.high);
  }

  const priceStep = (maxPrice - minPrice) / bins;
  const volumeProfile = Array(bins).fill(0).map((_, i) => ({
    priceLevel: minPrice + (i * priceStep),
    volume: 0
  }));

  // Distribute volume across price levels
  for (const bar of ohlcData) {
    const typicalPrice = (bar.high + bar.low + bar.close) / 3;
    const binIndex = Math.floor((typicalPrice - minPrice) / priceStep);
    const safeIndex = Math.min(Math.max(binIndex, 0), bins - 1);
    
    volumeProfile[safeIndex].volume += bar.volume || 0;
  }

  // Find Point of Control (highest volume)
  const pocIndex = volumeProfile.reduce((maxIndex, current, index, array) => 
    current.volume > array[maxIndex].volume ? index : maxIndex, 0);
  
  // Calculate Value Area (70% of volume)
  const totalVolume = volumeProfile.reduce((sum, level) => sum + level.volume, 0);
  const targetVolume = totalVolume * 0.7;
  
  let accumulatedVolume = volumeProfile[pocIndex].volume;
  let upperIndex = pocIndex;
  let lowerIndex = pocIndex;
  
  while (accumulatedVolume < targetVolume && (upperIndex < bins - 1 || lowerIndex > 0)) {
    const upperVolume = upperIndex < bins - 1 ? volumeProfile[upperIndex + 1].volume : 0;
    const lowerVolume = lowerIndex > 0 ? volumeProfile[lowerIndex - 1].volume : 0;
    
    if (upperVolume >= lowerVolume && upperIndex < bins - 1) {
      upperIndex++;
      accumulatedVolume += upperVolume;
    } else if (lowerIndex > 0) {
      lowerIndex--;
      accumulatedVolume += lowerVolume;
    } else {
      break;
    }
  }

  return {
    volumeProfile,
    pocLevel: volumeProfile[pocIndex].priceLevel,
    valueAreaHigh: volumeProfile[upperIndex].priceLevel,
    valueAreaLow: volumeProfile[lowerIndex].priceLevel
  };
}

/**
 * Calculate RSI (Relative Strength Index)
 * ✅ ACHIEVABLE: Standard technical indicator
 */
function calculateRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) {
    return null;
  }

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain and loss
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change;
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Calculate RSI
  if (avgLoss === 0) return 100;
  
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

/**
 * Calculate MACD (Moving Average Convergence Divergence)
 * ✅ ACHIEVABLE: Standard technical indicator
 */
function calculateMACD(prices, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  if (!prices || prices.length < slowPeriod) {
    return { macd: null, signal: null, histogram: null };
  }

  const fastEMA = calculateEMA(prices, fastPeriod);
  const slowEMA = calculateEMA(prices, slowPeriod);
  
  if (!fastEMA || !slowEMA || fastEMA.length === 0 || slowEMA.length === 0) {
    return { macd: null, signal: null, histogram: null };
  }

  const macdLine = fastEMA[fastEMA.length - 1] - slowEMA[slowEMA.length - 1];
  
  // For signal line, we'd need historical MACD values
  // Simplified implementation
  const signal = 0; // Would need full MACD history
  const histogram = macdLine - signal;

  return {
    macd: macdLine,
    signal: signal,
    histogram: histogram
  };
}

/**
 * Calculate Simple Moving Average (SMA)
 * ✅ ACHIEVABLE: Standard technical indicator
 */
function calculateSMA(prices, period) {
  if (!prices || prices.length < period) {
    return null;
  }

  const recentPrices = prices.slice(-period);
  return recentPrices.reduce((sum, price) => sum + price, 0) / period;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * ✅ ACHIEVABLE: Standard technical indicator
 */
function calculateEMA(prices, period) {
  if (!prices || prices.length < period) {
    return [];
  }

  const ema = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  ema.push(sum / period);

  // Calculate EMA for remaining values
  for (let i = period; i < prices.length; i++) {
    const currentEMA = (prices[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
    ema.push(currentEMA);
  }

  return ema;
}

/**
 * Calculate Volume Analysis Metrics
 * ✅ ACHIEVABLE: Uses public volume data only
 */
function analyzeVolumeMetrics(ohlcData) {
  if (!ohlcData || ohlcData.length < 20) {
    return {
      volumeRatio: 1,
      volumeTrend: 'NEUTRAL',
      volumeStrength: 'NORMAL',
      avgVolume20: 0
    };
  }

  // Calculate 20-day average volume
  const recentBars = ohlcData.slice(-20);
  const avgVolume20 = recentBars.reduce((sum, bar) => sum + (bar.volume || 0), 0) / 20;
  
  // Current volume ratio
  const currentVolume = ohlcData[ohlcData.length - 1]?.volume || 0;
  const volumeRatio = avgVolume20 > 0 ? currentVolume / avgVolume20 : 1;
  
  // Volume trend analysis
  const recent5 = recentBars.slice(-5);
  const earlier5 = recentBars.slice(-10, -5);
  const recentAvg = recent5.reduce((sum, bar) => sum + (bar.volume || 0), 0) / 5;
  const earlierAvg = earlier5.reduce((sum, bar) => sum + (bar.volume || 0), 0) / 5;
  
  let volumeTrend = 'NEUTRAL';
  if (recentAvg > earlierAvg * 1.2) volumeTrend = 'INCREASING';
  else if (recentAvg < earlierAvg * 0.8) volumeTrend = 'DECREASING';
  
  // Volume strength classification
  let volumeStrength = 'NORMAL';
  if (volumeRatio >= 2.0) volumeStrength = 'VERY_HIGH';
  else if (volumeRatio >= 1.5) volumeStrength = 'HIGH';
  else if (volumeRatio <= 0.5) volumeStrength = 'LOW';
  else if (volumeRatio <= 0.3) volumeStrength = 'VERY_LOW';

  return {
    volumeRatio,
    volumeTrend,
    volumeStrength,
    avgVolume20,
    currentVolume
  };
}

/**
 * ⚠️ REALISTIC MICROSTRUCTURE LITE
 * Only what's achievable with L1 public data
 */
function analyzeMicrostructureLite(ohlcData) {
  if (!ohlcData || ohlcData.length < 5) {
    return {
      vwapDistance: 0,
      volumeImbalance: 0,
      spreadProxy: 0,
      openingDrive: 'NEUTRAL',
      reliability: 'LOW'
    };
  }

  const latest = ohlcData[ohlcData.length - 1];
  const vwap = calculateVWAP(ohlcData.slice(-20)); // 20-bar VWAP
  
  // VWAP distance (achievable)
  const vwapDistance = vwap ? ((latest.close - vwap) / vwap) * 100 : 0;
  
  // Volume imbalance proxy (using close vs OHLC range)
  const range = latest.high - latest.low;
  const closePosition = range > 0 ? (latest.close - latest.low) / range : 0.5;
  const volumeImbalance = (closePosition - 0.5) * 2; // -1 to 1
  
  // Spread proxy (high-low range relative to price)
  const spreadProxy = range / latest.close * 100;
  
  // Opening drive analysis
  let openingDrive = 'NEUTRAL';
  if (latest.close > latest.open * 1.005) openingDrive = 'BULLISH';
  else if (latest.close < latest.open * 0.995) openingDrive = 'BEARISH';
  
  return {
    vwapDistance,
    volumeImbalance,
    spreadProxy,
    openingDrive,
    reliability: 'MEDIUM' // Honest assessment
  };
}

module.exports = {
  calculateVWAP,
  calculateATR,
  calculateVolumeProfile,
  calculateRSI,
  calculateMACD,
  calculateSMA,
  calculateEMA,
  analyzeVolumeMetrics,
  analyzeMicrostructureLite
};
