// ==============================================
// MOMENTUM DIVERGENCE DETECTION ENGINE  
// Detects hidden and regular divergences for early reversal signals
// ==============================================

/**
 * Advanced Momentum Divergence Detection
 * Catches price/momentum divergences that signal potential reversals
 */
function detectMomentumDivergences(ohlcData, technicalIndicators) {
  console.log(`🔄 Divergence Detection: Analyzing ${ohlcData.length} data points...`);
  
  if (!ohlcData || ohlcData.length < 20) {
    return { divergences: [], signal: 'NEUTRAL', confidence: 0 };
  }
  
  const divergences = [];
  const recent20 = ohlcData.slice(-20); // Last 20 periods
  
  // Get momentum indicators
  const rsi = technicalIndicators?.rsi || calculateRSI(ohlcData);
  const macd = technicalIndicators?.macd || calculateMACD(ohlcData);
  const stoch = technicalIndicators?.stochastic || calculateStochastic(ohlcData);
  
  // Detect different types of divergences
  const rsiDivergence = detectRSIDivergence(recent20, rsi);
  const macdDivergence = detectMACDDivergence(recent20, macd);
  const stochDivergence = detectStochasticDivergence(recent20, stoch);
  const volumeDivergence = detectVolumeDivergence(recent20);
  
  // Collect all divergences
  if (rsiDivergence.detected) divergences.push(rsiDivergence);
  if (macdDivergence.detected) divergences.push(macdDivergence);
  if (stochDivergence.detected) divergences.push(stochDivergence);
  if (volumeDivergence.detected) divergences.push(volumeDivergence);
  
  // Calculate overall divergence signal
  const divergenceSignal = calculateDivergenceSignal(divergences);
  
  console.log(`📊 Divergences Found: ${divergences.length} (${divergenceSignal.signal} - ${(divergenceSignal.confidence * 100).toFixed(1)}%)`);
  
  return {
    divergences,
    signal: divergenceSignal.signal,
    confidence: divergenceSignal.confidence,
    summary: {
      totalDivergences: divergences.length,
      bullishDivergences: divergences.filter(d => d.type === 'BULLISH').length,
      bearishDivergences: divergences.filter(d => d.type === 'BEARISH').length,
      hiddenDivergences: divergences.filter(d => d.category === 'HIDDEN').length,
      regularDivergences: divergences.filter(d => d.category === 'REGULAR').length
    }
  };
}

// RSI Divergence Detection
function detectRSIDivergence(priceData, rsiData) {
  if (!rsiData || rsiData.length < 10) return { detected: false };
  
  const recentPrices = priceData.slice(-10).map(d => d.close);
  const recentRSI = rsiData.slice(-10);
  
  // Find recent highs and lows
  const priceHighs = findLocalHighs(recentPrices, 2);
  const priceLows = findLocalLows(recentPrices, 2);
  const rsiHighs = findLocalHighs(recentRSI, 2);
  const rsiLows = findLocalLows(recentRSI, 2);
  
  // Regular Bearish Divergence: Price higher highs, RSI lower highs
  if (priceHighs.length >= 2 && rsiHighs.length >= 2) {
    const priceHigher = priceHighs[1].value > priceHighs[0].value;
    const rsiLower = rsiHighs[1].value < rsiHighs[0].value;
    
    if (priceHigher && rsiLower) {
      return {
        detected: true,
        type: 'BEARISH',
        category: 'REGULAR',
        indicator: 'RSI',
        strength: calculateDivergenceStrength(priceHighs, rsiHighs),
        description: 'Price making higher highs while RSI making lower highs',
        confidence: 0.75
      };
    }
  }
  
  // Regular Bullish Divergence: Price lower lows, RSI higher lows
  if (priceLows.length >= 2 && rsiLows.length >= 2) {
    const priceLower = priceLows[1].value < priceLows[0].value;
    const rsiHigher = rsiLows[1].value > rsiLows[0].value;
    
    if (priceLower && rsiHigher) {
      return {
        detected: true,
        type: 'BULLISH',
        category: 'REGULAR',
        indicator: 'RSI',
        strength: calculateDivergenceStrength(priceLows, rsiLows),
        description: 'Price making lower lows while RSI making higher lows',
        confidence: 0.75
      };
    }
  }
  
  return { detected: false };
}

// MACD Divergence Detection
function detectMACDDivergence(priceData, macdData) {
  if (!macdData || !macdData.MACD || macdData.MACD.length < 10) return { detected: false };
  
  const recentPrices = priceData.slice(-10).map(d => d.close);
  const recentMACD = macdData.MACD.slice(-10);
  const recentHistogram = macdData.histogram ? macdData.histogram.slice(-10) : recentMACD;
  
  // Use histogram for divergence detection (more sensitive)
  const priceHighs = findLocalHighs(recentPrices, 2);
  const priceLows = findLocalLows(recentPrices, 2);
  const macdHighs = findLocalHighs(recentHistogram, 2);
  const macdLows = findLocalLows(recentHistogram, 2);
  
  // MACD Bearish Divergence
  if (priceHighs.length >= 2 && macdHighs.length >= 2) {
    const priceHigher = priceHighs[1].value > priceHighs[0].value;
    const macdLower = macdHighs[1].value < macdHighs[0].value;
    
    if (priceHigher && macdLower) {
      return {
        detected: true,
        type: 'BEARISH',
        category: 'REGULAR',
        indicator: 'MACD',
        strength: calculateDivergenceStrength(priceHighs, macdHighs),
        description: 'Price higher highs while MACD histogram lower highs',
        confidence: 0.8
      };
    }
  }
  
  // MACD Bullish Divergence
  if (priceLows.length >= 2 && macdLows.length >= 2) {
    const priceLower = priceLows[1].value < priceLows[0].value;
    const macdHigher = macdLows[1].value > macdLows[0].value;
    
    if (priceLower && macdHigher) {
      return {
        detected: true,
        type: 'BULLISH',
        category: 'REGULAR', 
        indicator: 'MACD',
        strength: calculateDivergenceStrength(priceLows, macdLows),
        description: 'Price lower lows while MACD histogram higher lows',
        confidence: 0.8
      };
    }
  }
  
  return { detected: false };
}

// Stochastic Divergence Detection
function detectStochasticDivergence(priceData, stochData) {
  if (!stochData || !stochData.k || stochData.k.length < 10) return { detected: false };
  
  const recentPrices = priceData.slice(-10).map(d => d.close);
  const recentStochK = stochData.k.slice(-10);
  
  const priceHighs = findLocalHighs(recentPrices, 2);
  const priceLows = findLocalLows(recentPrices, 2);
  const stochHighs = findLocalHighs(recentStochK, 2);
  const stochLows = findLocalLows(recentStochK, 2);
  
  // Stochastic divergences (similar logic to RSI)
  if (priceHighs.length >= 2 && stochHighs.length >= 2) {
    const priceHigher = priceHighs[1].value > priceHighs[0].value;
    const stochLower = stochHighs[1].value < stochHighs[0].value;
    
    if (priceHigher && stochLower) {
      return {
        detected: true,
        type: 'BEARISH',
        category: 'REGULAR',
        indicator: 'STOCHASTIC',
        strength: calculateDivergenceStrength(priceHighs, stochHighs),
        description: 'Price higher highs while Stochastic lower highs',
        confidence: 0.7
      };
    }
  }
  
  if (priceLows.length >= 2 && stochLows.length >= 2) {
    const priceLower = priceLows[1].value < priceLows[0].value;
    const stochHigher = stochLows[1].value > stochLows[0].value;
    
    if (priceLower && stochHigher) {
      return {
        detected: true,
        type: 'BULLISH',
        category: 'REGULAR',
        indicator: 'STOCHASTIC', 
        strength: calculateDivergenceStrength(priceLows, stochLows),
        description: 'Price lower lows while Stochastic higher lows',
        confidence: 0.7
      };
    }
  }
  
  return { detected: false };
}

// Volume Divergence Detection
function detectVolumeDivergence(priceData) {
  if (!priceData || priceData.length < 10) return { detected: false };
  
  const recentData = priceData.slice(-10);
  const prices = recentData.map(d => d.close);
  const volumes = recentData.map(d => d.volume);
  
  const priceHighs = findLocalHighs(prices, 2);
  const volumeAtHighs = priceHighs.map(high => volumes[high.index]);
  
  const priceLows = findLocalLows(prices, 2);
  const volumeAtLows = priceLows.map(low => volumes[low.index]);
  
  // Volume Divergence: Price breakout with declining volume
  if (priceHighs.length >= 2 && volumeAtHighs.length >= 2) {
    const priceHigher = priceHighs[1].value > priceHighs[0].value;
    const volumeLower = volumeAtHighs[1] < volumeAtHighs[0];
    
    if (priceHigher && volumeLower) {
      return {
        detected: true,
        type: 'BEARISH',
        category: 'VOLUME',
        indicator: 'VOLUME',
        strength: 'MODERATE',
        description: 'Price making new highs with declining volume',
        confidence: 0.65
      };
    }
  }
  
  return { detected: false };
}

// Helper: Find local highs
function findLocalHighs(data, minPeriods = 2) {
  const highs = [];
  for (let i = minPeriods; i < data.length - minPeriods; i++) {
    let isHigh = true;
    for (let j = i - minPeriods; j <= i + minPeriods; j++) {
      if (j !== i && data[j] >= data[i]) {
        isHigh = false;
        break;
      }
    }
    if (isHigh) highs.push({ index: i, value: data[i] });
  }
  return highs;
}

// Helper: Find local lows
function findLocalLows(data, minPeriods = 2) {
  const lows = [];
  for (let i = minPeriods; i < data.length - minPeriods; i++) {
    let isLow = true;
    for (let j = i - minPeriods; j <= i + minPeriods; j++) {
      if (j !== i && data[j] <= data[i]) {
        isLow = false;
        break;
      }
    }
    if (isLow) lows.push({ index: i, value: data[i] });
  }
  return lows;
}

// Calculate divergence strength
function calculateDivergenceStrength(pricePoints, indicatorPoints) {
  if (pricePoints.length < 2 || indicatorPoints.length < 2) return 'WEAK';
  
  const priceDiff = Math.abs(pricePoints[1].value - pricePoints[0].value);
  const indicatorDiff = Math.abs(indicatorPoints[1].value - indicatorPoints[0].value);
  
  // Normalize differences and calculate strength
  const pricePercent = priceDiff / pricePoints[0].value;
  const strength = pricePercent > 0.05 && indicatorDiff > 5 ? 'STRONG' : 
                   pricePercent > 0.02 ? 'MODERATE' : 'WEAK';
  
  return strength;
}

// Calculate overall divergence signal
function calculateDivergenceSignal(divergences) {
  if (divergences.length === 0) return { signal: 'NEUTRAL', confidence: 0 };
  
  const bullishCount = divergences.filter(d => d.type === 'BULLISH').length;
  const bearishCount = divergences.filter(d => d.type === 'BEARISH').length;
  
  // Weight by confidence
  const bullishWeight = divergences.filter(d => d.type === 'BULLISH')
    .reduce((sum, d) => sum + d.confidence, 0);
  const bearishWeight = divergences.filter(d => d.type === 'BEARISH')
    .reduce((sum, d) => sum + d.confidence, 0);
  
  let signal, confidence;
  
  if (bullishWeight > bearishWeight * 1.2) {
    signal = 'BULLISH';
    confidence = Math.min(0.95, bullishWeight / divergences.length);
  } else if (bearishWeight > bullishWeight * 1.2) {
    signal = 'BEARISH';
    confidence = Math.min(0.95, bearishWeight / divergences.length);
  } else {
    signal = 'NEUTRAL';
    confidence = 0.5;
  }
  
  return { signal, confidence };
}

// Basic RSI calculation (fallback)
function calculateRSI(ohlcData, period = 14) {
  if (ohlcData.length < period + 1) return [];
  
  const rsi = [];
  const gains = [];
  const losses = [];
  
  // Calculate gains and losses
  for (let i = 1; i < ohlcData.length; i++) {
    const change = ohlcData[i].close - ohlcData[i-1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? -change : 0);
  }
  
  // Calculate RSI
  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b) / period;
    
    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }
  
  return rsi;
}

// Basic MACD calculation (fallback)
function calculateMACD(ohlcData) {
  // Simplified MACD calculation
  const closes = ohlcData.map(d => d.close);
  const ema12 = calculateEMA(closes, 12);
  const ema26 = calculateEMA(closes, 26);
  
  const macd = [];
  for (let i = 0; i < Math.min(ema12.length, ema26.length); i++) {
    macd.push(ema12[i] - ema26[i]);
  }
  
  return {
    MACD: macd,
    signal: calculateEMA(macd, 9),
    histogram: macd.map((val, i) => val - (calculateEMA(macd, 9)[i] || 0))
  };
}

// Basic EMA calculation
function calculateEMA(data, period) {
  const ema = [];
  const multiplier = 2 / (period + 1);
  
  ema[0] = data[0];
  for (let i = 1; i < data.length; i++) {
    ema[i] = (data[i] * multiplier) + (ema[i-1] * (1 - multiplier));
  }
  
  return ema;
}

// Basic Stochastic calculation (fallback)
function calculateStochastic(ohlcData, kPeriod = 14, dPeriod = 3) {
  const k = [];
  
  for (let i = kPeriod - 1; i < ohlcData.length; i++) {
    const range = ohlcData.slice(i - kPeriod + 1, i + 1);
    const high = Math.max(...range.map(d => d.high));
    const low = Math.min(...range.map(d => d.low));
    const close = ohlcData[i].close;
    
    k.push(((close - low) / (high - low)) * 100);
  }
  
  const d = calculateEMA(k, dPeriod);
  
  return { k, d };
}

module.exports = {
  detectMomentumDivergences,
  detectRSIDivergence,
  detectMACDDivergence,
  detectStochasticDivergence,
  detectVolumeDivergence,
  findLocalHighs,
  findLocalLows,
  calculateDivergenceStrength,
  calculateDivergenceSignal
};
