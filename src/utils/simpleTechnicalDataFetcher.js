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
    console.log(`📊 SIMPLE: Fetching basic technical data for ${symbol}...`);
    
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
    const currentPrice = ohlcData[ohlcData.length - 1].close;
    const latestPrice = currentPrice;
    const latestVolume = ohlcData[ohlcData.length - 1].volume;
    
    // Calculate basic indicators only (what systems need)
    const basicIndicators = calculateBasicIndicators(ohlcData);
    
    console.log(`✅ SIMPLE: Fetched ${ohlcData.length} data points for ${symbol} (current: $${currentPrice.toFixed(2)})`);
    
    // Return simple structure matching what systems expect
    return {
      symbol: validatedSymbol,
      currentPrice,
      latestPrice,
      latestVolume,
      dataPoints: ohlcData.length,
      
      // Historical data
      ohlcData,
      historicalData: ohlcData,
      
      // Basic indicators
      indicators: basicIndicators.base,
      technicalIndicators: basicIndicators.technical,
      
      // Simple levels
      levels: {
        resistance: Math.max(...ohlcData.slice(-50).map(d => d.high)),
        support: Math.min(...ohlcData.slice(-50).map(d => d.low))
      },
      
      // Meta info
      meta: {
        symbol: validatedSymbol,
        timestamp: new Date().toISOString(),
        dataProvider: 'YAHOO_FINANCE',
        analysisType: 'SIMPLE_MODE'
      }
    };
    
  } catch (error) {
    console.error(`❌ SIMPLE: Failed to fetch data for ${symbol}:`, error.message);
    
    // Return minimal fallback structure
    return {
      symbol: symbol.toUpperCase(),
      currentPrice: 0,
      latestPrice: 0,
      latestVolume: 0,
      dataPoints: 0,
      ohlcData: [],
      historicalData: [],
      indicators: {},
      technicalIndicators: {},
      levels: { resistance: 0, support: 0 },
      meta: {
        symbol: symbol.toUpperCase(),
        timestamp: new Date().toISOString(),
        error: error.message,
        analysisType: 'SIMPLE_MODE_ERROR'
      }
    };
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
  const ema20 = calculateEMA(closes, 20);
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
  
  // Latest values
  const latest = {
    price: closes[closes.length - 1],
    ema10: ema10[ema10.length - 1] || null,
    ema20: ema20[ema20.length - 1] || null,
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
    base: {
      ema10,
      ema20, 
      ema50,
      ema200,
      sma150,  // 🚨 EMERGENCY FIX
      sma200,  // 🚨 EMERGENCY FIX
      rsi,
      macd,
      atr,
      stochastic,
      latest
    },
    technical: {
      ema10,
      ema20,
      ema50, 
      ema200,
      sma150,  // 🚨 EMERGENCY FIX
      sma200,  // 🚨 EMERGENCY FIX
      rsi,
      macd,
      atr,
      stochastic,
      latest
    }
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
  
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i] - data[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }
  
  const rsi = [];
  
  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    
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
  
  if (ema12.length === 0 || ema26.length === 0) {
    return { MACD: 0, signal: 0, histogram: 0 };
  }
  
  const macdLine = ema12[ema12.length - 1] - ema26[ema26.length - 1];
  
  return {
    MACD: macdLine,
    signal: macdLine * 0.9, // Simplified signal line
    histogram: macdLine * 0.1
  };
}

/**
 * Simple ATR calculation
 */
function calculateATR(ohlcData, period = 14) {
  if (ohlcData.length < period + 1) return 0;
  
  const trueRanges = [];
  
  for (let i = 1; i < ohlcData.length; i++) {
    const high = ohlcData[i].high;
    const low = ohlcData[i].low;
    const prevClose = ohlcData[i - 1].close;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    trueRanges.push(tr);
  }
  
  const recentTR = trueRanges.slice(-period);
  return recentTR.reduce((a, b) => a + b, 0) / recentTR.length;
}

/**
 * Simple Stochastic calculation
 */
function calculateStochastic(ohlcData, period = 14) {
  if (ohlcData.length < period) return { k: 50, d: 50 };
  
  const recent = ohlcData.slice(-period);
  const currentClose = ohlcData[ohlcData.length - 1].close;
  const lowestLow = Math.min(...recent.map(d => d.low));
  const highestHigh = Math.max(...recent.map(d => d.high));
  
  const k = ((currentClose - lowestLow) / (highestHigh - lowestLow)) * 100;
  const d = k * 0.9; // Simplified %D
  
  return { k: k || 50, d: d || 50 };
}

module.exports = {
  getSimpleTechnicalData,
  calculateBasicIndicators
};
