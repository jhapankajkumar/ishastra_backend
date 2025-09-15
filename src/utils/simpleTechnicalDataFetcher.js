/**
 * 🚨 SIMPLE TECHNICAL DATA FETCHER
 * Replaces complex prepareAnalysisContext with basic data only
 * 
 * Only fetches what the 2 core systems need:
 * - Current price
 * - OHLC historical data  
 * - Basic indicators (no complex AI analysis)
 */

const { getHistorical } = require('../yahoo'); // self import for internal reuse

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
    if (!latestPrice || latestPrice <= 0) {
      throw new Error(`Invalid latest price for ${validatedSymbol}: ${latestPrice}`);
    }

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
  const sma13 = calculateSMA(closes, 13);
  const sma20 = calculateSMA(closes, 20);
  const sma26 = calculateSMA(closes, 26);
  const sma50 = calculateSMA(closes, 50);
  const sma150 = calculateSMA(closes, 150);
  const sma200 = calculateSMA(closes, 200);
   // for potential future use
  
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
    sma13: sma13[sma13.length - 1] || null,
    sma20: sma20[sma20.length - 1] || null,
    sma26: sma26[sma26.length - 1] || null,
    sma150: sma150[sma150.length - 1] || null,  // 🚨 EMERGENCY FIX
    sma200: sma200[sma200.length - 1] || null,  // 🚨 EMERGENCY FIX
    sma50: sma50[sma50.length - 1] || null,
    rsi: rsi[rsi.length - 1] || 50,
    macd: macd.MACD || 0,
    macdSignal: macd.signal || 0,
    macdHistogram: macd.histogram || 0,
    atr: atr || 0,
    stochK: stochastic.k || 50,
    stochD: stochastic.d || 50,
    volume: volumes[volumes.length - 1] || 0
  };
  
  // Derived signals for breakout-pullback setup
  const is52WeekHighBreakout = closes[closes.length - 1] >= Math.max(...closes.slice(-252));
  const brokeResistanceRecently = brokeKeyResistanceRecently(ohlcData, latest.price);
  const recentVolumeSpike = volumes[volumes.length - 1] > (volumes.slice(-20).reduce((a, b) => a + b, 0) / 20) * 1.5;
  const recentCandleRange = ohlcData.slice(-3).map(d => d.high - d.low);
  const pastAvgRange = ohlcData.slice(-20).map(d => d.high - d.low);
  const avgRecentRange = recentCandleRange.reduce((a, b) => a + b, 0) / 3;
  const avgPastRange = pastAvgRange.reduce((a, b) => a + b, 0) / 20;
  const isVolatilityContracting = avgRecentRange < avgPastRange;
  const isNearEMA13 = Math.abs(latest.price - latest.ema13) / latest.ema13 <= 0.05;
  const isNearBreakoutZone = resistance && Math.abs(latest.price - resistance) / resistance <= 0.05;
  const macdBullish = latest.macd > latest.macdSignal && latest.macdHistogram > 0;
  const isBreakoutConfirmed = is52WeekHighBreakout || brokeResistanceRecently;
  const hasTightPullbackAfterBreakout = isTightPullbackAfterBreakout(ohlcData, isBreakoutConfirmed);


  // Distribution candle = big red candle (>2%) on high volume in last 5 candles
  let hasDistributionCandle = false;
  for (let i = ohlcData.length - 5; i < ohlcData.length; i++) {
    const candle = ohlcData[i];
    const dropPct = (candle.close - candle.open) / candle.open;
    if (dropPct < -0.02 && candle.volume > (volumes.slice(-20).reduce((a, b) => a + b, 0) / 20) * 1.5) {
      hasDistributionCandle = true;
      break;
    }
  }

  // Trend check: EMA13 > EMA26 and price > EMA50
  const emaTrendOk = latest.ema13 > latest.ema26 && latest.price > latest.ema50;
  
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
      sma50,
      rsi,
      macd,
      atr,
      stochastic,
      support,
      resistance,
      latest,
      // ✅ Breakout Setup Flags
      is52WeekHighBreakout,
      brokeResistanceRecently, // now using external helper method
      recentVolumeSpike,
      isVolatilityContracting,
      isNearEMA13,
      isNearBreakoutZone,
      macdBullish,
      hasDistributionCandle,
      emaTrendOk,
      hasTightPullbackAfterBreakout
  };
}

function detectBreakoutPullbackSetup(indicators) {
  return (
    (indicators.is52WeekHighBreakout || indicators.brokeResistanceRecently) &&
    indicators.recentVolumeSpike &&
    indicators.isVolatilityContracting &&
    indicators.isNearEMA13 &&
    indicators.isNearBreakoutZone &&
    indicators.macdBullish &&
    !indicators.hasDistributionCandle &&
    indicators.emaTrendOk
  );
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

/**
 * 🔍 Detect if stock broke key horizontal resistance in last 3–10 candles
 * Used for detecting breakout that is NOT a 52-week high
 * 
 * @param {Array} ohlcData - Full OHLC data
 * @param {number} currentPrice - Latest close
 * @returns {boolean} True if broke resistance recently
 */
function brokeKeyResistanceRecently(ohlcData, currentPrice) {
  try {
    if (!ohlcData || ohlcData.length < 100) return false;

    // Step 1: Get resistance level from 10+ candles ago
    const resistanceLookback = ohlcData.slice(0, -10);
    const resistanceLevel = findNextResistanceLevel(resistanceLookback, currentPrice);

    if (!resistanceLevel) return false;

    // Step 2: Check candles from 10 to 3 bars ago for breakout
    const breakoutZone = ohlcData.slice(-15, -3);
    return breakoutZone.some(candle => candle.close > resistanceLevel);
  } catch (e) {
    console.warn('Resistance breakout detection failed:', e.message);
    return false;
  }
}

/**
 * 🧠 Enhanced Resistance Level Detection (Advanced Version)
 * Finds multiple strong resistance zones using clustering, frequency, and volume context.
 * Does NOT affect current target logic. For future usage in scoring, visualization, etc.
 * 
 * @param {Array} ohlcData - Full historical OHLC data
 * @param {number} currentPrice - Current close price
 * @returns {Array} Array of strong resistance zones with meta info
 */
function findStrongResistanceLevels(ohlcData, currentPrice) {
  try {
    if (!ohlcData || ohlcData.length < 100) return [];

    const swingHighs = [];
    const volumeProfile = {};

    for (let i = 2; i < ohlcData.length - 2; i++) {
      const c = ohlcData[i];
      const prev1 = ohlcData[i - 1];
      const prev2 = ohlcData[i - 2];
      const next1 = ohlcData[i + 1];
      const next2 = ohlcData[i + 2];

      if (c.high > Math.max(prev1.high, prev2.high, next1.high, next2.high)) {
        swingHighs.push(c.high);
        const priceBucket = Math.round(c.high / 10) * 10; // Bucket by ₹10 or $10 range
        volumeProfile[priceBucket] = (volumeProfile[priceBucket] || 0) + c.volume;
      }
    }

    // Cluster and score resistance zones
    const clusters = {};
    for (const price of swingHighs) {
      const bucket = Math.round(price / 10) * 10;
      clusters[bucket] = clusters[bucket] || { count: 0, totalVolume: 0, price };
      clusters[bucket].count++;
      clusters[bucket].totalVolume += volumeProfile[bucket] || 0;
    }

    const resistanceZones = Object.values(clusters)
      .filter(z => z.price > currentPrice * 1.01) // Only above current price
      .sort((a, b) => b.count - a.count) // Most hits first
      .map(z => ({
        level: z.price,
        hits: z.count,
        volumeScore: z.totalVolume,
        score: z.count + z.totalVolume / 100000  // Basic scoring formula
      }));

    return resistanceZones;
  } catch (e) {
    console.warn('Enhanced resistance calc failed:', e.message);
    return [];
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

function isTightPullbackAfterBreakout(ohlcData, isBreakoutConfirmed) {
  try {
    if (!isBreakoutConfirmed) return false;

    // Lookback 10 candles to find breakout candle
    const recent = ohlcData.slice(-10);
    const breakoutIndex = ohlcData.length - recent.length;

    // Find breakout candle (highest close with volume spike)
    let breakoutCandleIndex = -1;
    const closes = recent.map(d => d.close);
    const volumes = recent.map(d => d.volume || 0);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;

    for (let i = 0; i < recent.length; i++) {
      if (closes[i] >= Math.max(...closes.slice(0, i + 1)) && volumes[i] > avgVolume * 1.2) {
        breakoutCandleIndex = breakoutIndex + i;
        break;
      }
    }

    if (breakoutCandleIndex === -1) return false;

    // Pullback = next 3–7 candles after breakout
    const pullback = ohlcData.slice(breakoutCandleIndex + 1, breakoutCandleIndex + 8);
    if (pullback.length < 3) return false;

    let validCount = 0;
    for (const candle of pullback) {
      const body = Math.abs(candle.close - candle.open);
      const range = candle.high - candle.low;
      const isTight = (range > 0) && (body / range < 0.3);
      const isRed = candle.close < candle.open;

      if (isTight || isRed) validCount++;
    }

    return validCount >= 3;
  } catch (err) {
    console.warn('Pullback tightness check failed:', err.message);
    return false;
  }
}

module.exports = {
  getSimpleTechnicalData,
  calculateBasicIndicators,
  findNextResistanceLevel,
  findNextSupportLevel,
  findStrongResistanceLevels,
  brokeKeyResistanceRecently, // <-- NEW
  detectBreakoutPullbackSetup
};
