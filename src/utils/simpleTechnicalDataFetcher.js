/**
 * 🚨 SIMPLE TECHNICAL DATA FETCHER
 * Replaces complex prepareAnalysisContext with basic data only
 * 
 * Only fetches what the 2 core systems need:
 * - Current price
 * - OHLC historical data  
 * - Basic indicators (no complex AI analysis)
 */

const { getHistorical } = require('../yahoo');

/**
 * Simple technical data fetch - no complex analysis
 * @param {string} symbol - Stock symbol
 * @returns {Object} Basic technical data structure
 */
async function getSimpleTechnicalData(symbol) {
  try {
    // Validate symbol
    const validatedSymbol = symbol.trim().toUpperCase();
    
    // Get 24 months of data for sufficient history
    const data = await getHistorical(validatedSymbol, '24mo');
    
    if (!data || data.length < 50) {
      throw new Error(`Insufficient data for ${validatedSymbol}: ${data ? data.length : 0} points`);
    }
    
    // Convert to OHLC format
    const ohlcData = data.map(d => ({
      date: d.date,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
      volume: d.volume
    }));
    
    // Get current price
    const latestPrice = ohlcData[ohlcData.length - 1].close;

    // Calculate basic indicators only (what systems need)
    const basicIndicators = calculateBasicIndicators(ohlcData);

    // console.log(`✅ SIMPLE: Fetched ${ohlcData.length} data points for ${symbol} (current: $${currentPrice.toFixed(2)})`);
    
    // Return simple structure matching what systems expect
    return {
      symbol: validatedSymbol,
      latestPrice,
      // Historical data
      historical: ohlcData,
      // Basic indicators
      indicators: basicIndicators,
    };
    
  } catch (error) {
    console.error(`❌ SIMPLE: Failed to fetch data for ${symbol}:`, error.message);
    // Return minimal fallback structure
    return null;
  }
}

/**
 * Calculate only the basic indicators that systems actually need
 * @param {Array} ohlcData - OHLC data array
 * @returns {Object} Basic indicators structure
 */
function calculateBasicIndicators(ohlcData) {
  const closes = ohlcData.map(d => d.close);
  const highs = ohlcData.map(d => d.high);
  const lows = ohlcData.map(d => d.low);
  const volumes = ohlcData.map(d => d.volume || 0);
  
  // Calculate basic EMAs that systems use
  const ema10 = calculateEMA(closes, 10);
  const ema13 = calculateEMA(closes, 13);
  const ema20 = calculateEMA(closes, 20);
  const ema26 = calculateEMA(closes, 26);
  const ema40 = calculateEMA(closes, 40);
  const ema50 = calculateEMA(closes, 50);
  const ema200 = calculateEMA(closes, 200);
  
  // 🚨 EMERGENCY FIX: Add missing SMA150 and SMA200 for Minervini Template
  const sma150 = calculateSMA(closes, 150);
  const sma200 = calculateSMA(closes, 200);
  
  // Calculate basic RSI
  const rsi = calculateRSI(closes, 14);
  
  // Calculate basic MACD
  const macd = calculateMACD(closes);
  
  // Calculate basic ATR
  const atr = calculateATR(ohlcData, 14);
  
  // Calculate basic Stochastic
  const stochastic = calculateStochastic(ohlcData, 14);
  const support = findNextSupportLevel(ohlcData, closes[closes.length - 1]);
  const resistance = findNextResistanceLevel(ohlcData, closes[closes.length - 1]);

  // Latest values
  const latest = {
    price: closes[closes.length - 1],
    ema10: ema10[ema10.length - 1] || null,
    ema13: ema13[ema13.length - 1] || null,
    ema20: ema20[ema20.length - 1] || null,
    ema26: ema26[ema26.length - 1] || null,
    ema40: ema40[ema40.length - 1] || null,
    ema50: ema50[ema50.length - 1] || null,
    ema200: ema200[ema200.length - 1] || null,
    sma150: sma150[sma150.length - 1] || null,  // 🚨 EMERGENCY FIX
    sma200: sma200[sma200.length - 1] || null,  // 🚨 EMERGENCY FIX
    rsi: rsi[rsi.length - 1] || 50,
    macd: macd.MACD || 0,
    macdSignal: macd.signal || 0,
    macdHistogram: macd.histogram || 0,
    atr: atr || 0,
    stochK: stochastic.k || 50,
    stochD: stochastic.d || 50,
    volume: volumes[volumes.length - 1] || 0
  };
  
  return {
      ema10,
      ema13,
      ema20,
      ema26,
      ema40,
      ema50,
      ema200,
      sma150,  // 🚨 EMERGENCY FIX
      sma200,  // 🚨 EMERGENCY FIX
      rsi,
      macd,
      atr,
      stochastic,
      support,
      resistance,
      latest
  };
}

/**
 * 🚨 EMERGENCY FIX: Simple SMA calculation for Minervini Template
 */
function calculateSMA(data, period) {
  if (data.length < period) return [];
  
  const sma = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += data[j];
    }
    sma.push(sum / period);
  }
  
  return sma;
}

/**
 * Simple EMA calculation
 */
function calculateEMA(data, period) {
  if (data.length < period) return [];
  
  const ema = [];
  const k = 2 / (period + 1);
  
  // Start with SMA for first value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += data[i];
  }
  ema.push(sum / period);
  
  // Calculate EMA for remaining values
  for (let i = period; i < data.length; i++) {
    ema.push(data[i] * k + ema[ema.length - 1] * (1 - k));
  }
  
  return ema;
}

/**
 * Simple RSI calculation
 */
function calculateRSI(data, period = 14) {
  if (data.length < period + 1) return [];

  const rsi = [];
  let gains = 0;
  let losses = 0;

  // Initial average gain/loss
  for (let i = 1; i <= period; i++) {
    const change = data[i] - data[i - 1];
    if (change >= 0) {
      gains += change;
    } else {
      losses += Math.abs(change);
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  if (avgLoss === 0) {
    rsi.push(100);
  } else {
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  // Continue with Wilder’s smoothing method
  for (let i = period + 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? Math.abs(change) : 0;

    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  return rsi;
}

/**
 * Simple MACD calculation
 */
function calculateMACD(data) {
  const ema12 = calculateEMA(data, 12);
  const ema26 = calculateEMA(data, 26);
  
  const length = Math.min(ema12.length, ema26.length);
  const macdLine = [];

  for (let i = 0; i < length; i++) {
    macdLine.push(ema12[i] - ema26[i]);
  }

  const signalLine = calculateEMA(macdLine, 9);
  const lastMACD = macdLine[macdLine.length - 1] || 0;
  const lastSignal = signalLine[signalLine.length - 1] || 0;
  const histogram = lastMACD - lastSignal;

  return {
    MACD: lastMACD,
    signal: lastSignal,
    histogram
  };
}

/**
 * Simple ATR calculation
 */
function calculateATR(ohlcData, period = 14) {
  if (ohlcData.length < period + 1) return 0;

  const trueRanges = [];

  for (let i = 1; i < ohlcData.length; i++) {
    const current = ohlcData[i];
    const previous = ohlcData[i - 1];

    const tr = Math.max(
      current.high - current.low,
      Math.abs(current.high - previous.close),
      Math.abs(current.low - previous.close)
    );

    trueRanges.push(tr);
  }

  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;
  const k = 2 / (period + 1);

  for (let i = period; i < trueRanges.length; i++) {
    atr = trueRanges[i] * k + atr * (1 - k);
  }

  return atr;
}

/**
 * Simple Stochastic calculation
 */
function calculateStochastic(ohlcData, period = 14) {
  if (ohlcData.length < period + 3) return { k: 50, d: 50 };

  const kValues = [];

  for (let i = period - 1; i < ohlcData.length; i++) {
    const recent = ohlcData.slice(i - period + 1, i + 1);
    const currentClose = ohlcData[i].close;
    const lowestLow = Math.min(...recent.map(d => d.low));
    const highestHigh = Math.max(...recent.map(d => d.high));

    const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
    kValues.push(k || 50);
  }

  const lastK = kValues[kValues.length - 1] || 50;
  const last3K = kValues.slice(-3);
  const d = last3K.reduce((a, b) => a + b, 0) / last3K.length;

  return { k: lastK, d: d || 50 };
}

/**
 * Find next resistance level for dynamic targets
 * @param {Array} dailyData - Historical price data
 * @param {number} currentPrice - Current stock price
 * @returns {number|null} Next resistance level or null
 */
function findNextResistanceLevel(dailyData, currentPrice) {
  try {
    // Configurable flag: use close instead of high for swing high detection
    const useCloseInsteadOfHigh = false;

    if (dailyData.length < 20) return null;

    // Look for recent swing highs above current price
    const recentData = dailyData.slice(-60); // Last 60 days
    const swingHighs = [];

    for (let i = 2; i < recentData.length - 2; i++) {
      const current = recentData[i];
      const prev2 = recentData[i - 2];
      const prev1 = recentData[i - 1];
      const next1 = recentData[i + 1];
      const next2 = recentData[i + 2];

      // Use configurable value for swing high detection
      const currentValue = useCloseInsteadOfHigh ? current.close : current.high;
      const prev2Value = useCloseInsteadOfHigh ? prev2.close : prev2.high;
      const prev1Value = useCloseInsteadOfHigh ? prev1.close : prev1.high;
      const next1Value = useCloseInsteadOfHigh ? next1.close : next1.high;
      const next2Value = useCloseInsteadOfHigh ? next2.close : next2.high;

      if (currentValue > Math.max(prev2Value, prev1Value, next1Value, next2Value)) {
        swingHighs.push(currentValue);
      }
    }

    // Filter swingHighs to remove duplicates and very close values
    const uniqueHighs = swingHighs
      .filter((v, i, arr) => i === 0 || Math.abs(v - arr[i - 1]) / arr[i - 1] > 0.02)
      .filter((v, i, a) => a.indexOf(v) === i);

    // Find nearest resistance above current price
    const resistanceLevels = uniqueHighs.filter(high => high > currentPrice).sort((a, b) => a - b);

    return resistanceLevels.length > 0 ? resistanceLevels[0] : currentPrice * 1.1;
  } catch (error) {
    console.warn('Resistance level calculation error:', error.message);
    return null;
  }
}

function findNextSupportLevel(dailyData, currentPrice) {
  try {
    if (dailyData.length < 20) return null;

    const recentData = dailyData.slice(-60); // Last 60 days
    const swingLows = [];

    for (let i = 2; i < recentData.length - 2; i++) {
      const current = recentData[i];
      const prev2 = recentData[i - 2];
      const prev1 = recentData[i - 1];
      const next1 = recentData[i + 1];
      const next2 = recentData[i + 2];

      // Swing low: current low < previous 2 and next 2 lows
      if (current.low < Math.min(prev2.low, prev1.low, next1.low, next2.low)) {
        swingLows.push(current.low);
      }
    }

    // Filter for levels below current price
    const supportLevels = swingLows
      .filter(low => low < currentPrice)
      .sort((a, b) => b - a); // Descending, nearest first

    // Optional: de-duplicate + noise filter (same as resistance)
    const filtered = supportLevels
      .filter((v, i, a) => i === 0 || Math.abs(v - a[i - 1]) / a[i - 1] > 0.02)
      .filter((v, i, a) => a.indexOf(v) === i);

    return filtered.length > 0 ? filtered[0] : currentPrice * 0.9;
  } catch (error) {
    console.warn('Support level calculation error:', error.message);
    return null;
  }
}

module.exports = {
  getSimpleTechnicalData,
  calculateBasicIndicators,
  findNextResistanceLevel,
  findNextSupportLevel  
};
