/**
 * Elder's Impulse System Exit Strategy
 * 
 * Analyzes momentum using MACD Histogram and EMA slopes to determine
 * when to hold or exit positions based on momentum loss.
 * 
 * Color Logic:
 * - Green: EMA rising AND MACD histogram rising (bullish momentum)
 * - Red: EMA falling AND MACD histogram falling (bearish momentum)  
 * - Blue: Mixed signals (neutral momentum)
 * 
 * Exit Logic:
 * - Exit when color changes from Green → Red or Green → Blue
 * - Hold when still Green
 */

const yahooFinance = require('yahoo-finance2').default;

class ImpulseExitAnalyzer {
  constructor() {
    // Cache for market data to avoid repeated API calls
    this.dataCache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
  }

  /**
   * Analyze Elder's Impulse System for a given ticker
   * @param {string} ticker - Stock symbol to analyze
   * @param {string} direction - Trade direction ('Long' or 'Short')
   * @returns {Object} Impulse analysis result
   */
  async analyzeImpulse(ticker, direction = 'Long') {
    try {
      //console.log(`🎯 [IMPULSE] Starting Elder's Impulse analysis for ${ticker} (${direction})`);

      // Get market data with caching
      const marketData = await this.getMarketDataWithCache(ticker);
      
      if (!marketData || marketData.length < 50) {
        //console.log(`⚠️  [IMPULSE] Insufficient market data for ${ticker}`);
        return this.getEmptyImpulseData('Insufficient market data');
      }

      // Calculate technical indicators
      const indicators = this.calculateTechnicalIndicators(marketData);
      
      // Determine impulse color
      const impulseColor = this.determineImpulseColor(indicators);
      
      // Generate exit recommendation
      const exitRecommendation = this.generateExitRecommendation(impulseColor, direction, indicators);
      
      const result = {
        impulseColor,
        exitRecommended: exitRecommendation.shouldExit,
        reasoning: exitRecommendation.reasoning,
        lastUpdated: new Date().toISOString(),
        technicalData: {
          ema13: indicators.ema13[indicators.ema13.length - 1],
          ema21: indicators.ema21[indicators.ema21.length - 1],
          macdHistogram: indicators.macdHistogram[indicators.macdHistogram.length - 1],
          ema13Slope: indicators.ema13Slope,
          ema21Slope: indicators.ema21Slope,
          macdHistSlope: indicators.macdHistSlope,
          currentPrice: marketData[marketData.length - 1].close
        }
      };

      //console.log(`✅ [IMPULSE] ${ticker}: ${impulseColor} impulse, Exit: ${exitRecommendation.shouldExit}`);
      return result;

    } catch (error) {
      console.error(`❌ [IMPULSE] Error analyzing ${ticker}:`, error.message);
      return this.getEmptyImpulseData(`Analysis failed: ${error.message}`);
    }
  }

  /**
   * Get market data with caching mechanism
   * @param {string} ticker - Stock symbol
   * @returns {Array} OHLC market data
   */
  async getMarketDataWithCache(ticker) {
    const cacheKey = `${ticker}_impulse_data`;
    const cached = this.dataCache.get(cacheKey);

    // Return cached data if still valid
    if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
      //console.log(`📋 [IMPULSE] Using cached data for ${ticker}`);
      return cached.data;
    }

    try {
      // Fetch fresh data from Yahoo Finance
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 100); // Get ~100 days of data

      //console.log(`📡 [IMPULSE] Fetching fresh data for ${ticker}`);
      const result = await yahooFinance.historical(ticker, {
        period1: startDate,
        period2: endDate,
        interval: '1d'
      });

      if (!result || result.length === 0) {
        throw new Error('No market data received');
      }

      // Transform data to consistent format
      const marketData = result.map(item => ({
        date: item.date,
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      }));

      // Cache the data
      this.dataCache.set(cacheKey, {
        data: marketData,
        timestamp: Date.now()
      });

      return marketData;

    } catch (error) {
      console.error(`❌ [IMPULSE] Failed to fetch data for ${ticker}:`, error.message);
      return null;
    }
  }

  /**
   * Calculate technical indicators for impulse analysis
   * @param {Array} marketData - OHLC data
   * @returns {Object} Technical indicators
   */
  calculateTechnicalIndicators(marketData) {
    const closes = marketData.map(item => item.close);
    
    // Calculate EMAs
    const ema13 = this.calculateEMA(closes, 13);
    const ema21 = this.calculateEMA(closes, 21);
    
    // Calculate MACD and histogram
    const macdData = this.calculateMACD(closes);
    
    // Calculate slopes (momentum direction)
    const ema13Slope = this.calculateSlope(ema13, 3); // Use last 3 periods for slope
    const ema21Slope = this.calculateSlope(ema21, 3);
    const macdHistSlope = this.calculateSlope(macdData.histogram, 3);

    return {
      ema13,
      ema21,
      macdHistogram: macdData.histogram,
      macdLine: macdData.macd,
      signalLine: macdData.signal,
      ema13Slope,
      ema21Slope,
      macdHistSlope,
      currentPrice: closes[closes.length - 1]
    };
  }

  /**
   * Calculate Exponential Moving Average
   * @param {Array} data - Price data
   * @param {number} period - EMA period
   * @returns {Array} EMA values
   */
  calculateEMA(data, period) {
    if (data.length < period) return [];
    
    const ema = [];
    const multiplier = 2 / (period + 1);
    
    // Start with SMA for first value
    let sum = 0;
    for (let i = 0; i < period; i++) {
      sum += data[i];
    }
    ema.push(sum / period);
    
    // Calculate EMA for remaining values
    for (let i = period; i < data.length; i++) {
      const newEma = (data[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
      ema.push(newEma);
    }
    
    return ema;
  }

  /**
   * Calculate MACD (Moving Average Convergence Divergence)
   * @param {Array} closes - Closing prices
   * @returns {Object} MACD data {macd, signal, histogram}
   */
  calculateMACD(closes) {
    const ema12 = this.calculateEMA(closes, 12);
    const ema26 = this.calculateEMA(closes, 26);
    
    // Calculate MACD line
    const macdLine = [];
    const startIndex = Math.max(0, ema26.length - ema12.length);
    
    for (let i = startIndex; i < ema12.length; i++) {
      const ema26Index = i - startIndex + (ema26.length - ema12.length + startIndex);
      if (ema26Index >= 0 && ema26Index < ema26.length) {
        macdLine.push(ema12[i] - ema26[ema26Index]);
      }
    }
    
    // Calculate signal line (9-period EMA of MACD)
    const signalLine = this.calculateEMA(macdLine, 9);
    
    // Calculate histogram
    const histogram = [];
    const sigStartIndex = macdLine.length - signalLine.length;
    
    for (let i = 0; i < signalLine.length; i++) {
      histogram.push(macdLine[sigStartIndex + i] - signalLine[i]);
    }
    
    return {
      macd: macdLine,
      signal: signalLine,
      histogram: histogram
    };
  }

  /**
   * Calculate slope/trend direction of an array using linear regression
   * @param {Array} data - Data array
   * @param {number} periods - Number of periods to calculate slope
   * @param {number} threshold - Threshold for slope significance
   * @returns {string} 'rising', 'falling', or 'flat'
   */
  calculateSlope(data, periods = 3, threshold = 0.05) {
    if (!data || data.length < periods) return 'flat';

    const recent = data.slice(-periods);
    const n = recent.length;
    const xSum = (n * (n - 1)) / 2;
    const x2Sum = (n * (n - 1) * (2 * n - 1)) / 6;
    const ySum = recent.reduce((acc, val) => acc + val, 0);
    const xySum = recent.reduce((acc, val, i) => acc + i * val, 0);

    const slope = (n * xySum - xSum * ySum) / (n * x2Sum - xSum * xSum);

    if (slope > threshold) return 'rising';
    if (slope < -threshold) return 'falling';
    return 'flat';
  }

  /**
   * Determine Elder's Impulse color based on Elder's original rules
   * @param {Object} indicators - Technical indicators
   * @returns {string} 'green', 'red', or 'blue'
   */
  determineImpulseColor(indicators) {
    const currentPrice = indicators.currentPrice || 0;
    const ema13 = indicators.ema13[indicators.ema13.length - 1];
    const macdHist = indicators.macdHistogram[indicators.macdHistogram.length - 1];
    const macdHistSlope = indicators.macdHistSlope;
    
    // Elder's Original Impulse System Rules:
    // Green: Price > EMA13 AND MACD histogram rising
    // Red: Price < EMA13 AND MACD histogram falling  
    // Blue: All other combinations (mixed signals)
    
    const priceAboveEMA13 = currentPrice > ema13;
    const macdHistRising = macdHistSlope === 'rising';
    const macdHistFalling = macdHistSlope === 'falling';
    
    if (priceAboveEMA13 && macdHistRising) {
      return 'green';  // Bullish - price above EMA13 and momentum increasing
    } else if (!priceAboveEMA13 && macdHistFalling) {
      return 'red';    // Bearish - price below EMA13 and momentum decreasing
    } else {
      return 'blue';   // Neutral - mixed signals (price and momentum diverging)
    }
  }

  /**
   * Generate exit recommendation based on impulse color and trade direction
   * @param {string} impulseColor - Current impulse color
   * @param {string} direction - Trade direction ('Long' or 'Short')
   * @param {Object} indicators - Technical indicators for reasoning
   * @returns {Object} Exit recommendation
   */
  generateExitRecommendation(impulseColor, direction, indicators) {
    const reasoning = [];
    let shouldExit = false;

    const currentPrice = indicators.currentPrice;
    const ema13 = indicators.ema13[indicators.ema13.length - 1];
    const macdHistSlope = indicators.macdHistSlope;

    if (direction === 'Long') {
      // For long positions: Exit when impulse turns red or blue (momentum loss)
      if (impulseColor === 'red') {
        shouldExit = true;
        reasoning.push('RED impulse - price below EMA13 and momentum declining');
        reasoning.push(`Price (${currentPrice.toFixed(2)}) < EMA13 (${ema13.toFixed(2)})`);
        if (macdHistSlope === 'falling') reasoning.push('MACD histogram falling');
      } else if (impulseColor === 'blue') {
        shouldExit = true;
        reasoning.push('BLUE impulse - mixed signals, momentum uncertain');
        if (currentPrice < ema13) reasoning.push('Price below EMA13 trend line');
        if (macdHistSlope === 'falling') reasoning.push('MACD momentum declining');
      } else {
        // Green - hold position
        reasoning.push('GREEN impulse - strong bullish momentum');
        reasoning.push(`Price (${currentPrice.toFixed(2)}) above EMA13 (${ema13.toFixed(2)})`);
        reasoning.push('MACD histogram rising - maintain long position');
      }
    } else if (direction === 'Short') {
      // For short positions: Exit when impulse turns green (bullish momentum)
      if (impulseColor === 'green') {
        shouldExit = true;
        reasoning.push('GREEN impulse - bullish momentum building');
        reasoning.push('Cover short as price above EMA13 and MACD rising');
      } else if (impulseColor === 'blue') {
        shouldExit = true;
        reasoning.push('BLUE impulse - mixed signals favor covering short');
        reasoning.push('Momentum uncertainty suggests reducing risk');
      } else {
        // Red - hold short position
        reasoning.push('RED impulse - bearish momentum intact');
        reasoning.push('Maintain short position - downtrend continues');
      }
    }

    return {
      shouldExit,
      reasoning
    };
  }

  /**
   * Return empty impulse data for error cases
   * @param {string} reason - Reason for empty data
   * @returns {Object} Empty impulse data
   */
  getEmptyImpulseData(reason) {
    return {
      impulseColor: null,
      exitRecommended: false,
      reasoning: [reason],
      lastUpdated: new Date().toISOString(),
      technicalData: null
    };
  }

  /**
   * Clear cache for a specific ticker or all cache
   * @param {string} ticker - Optional ticker to clear specific cache
   */
  clearCache(ticker = null) {
    if (ticker) {
      const cacheKey = `${ticker}_impulse_data`;
      this.dataCache.delete(cacheKey);
      //console.log(`🗑️  [IMPULSE] Cache cleared for ${ticker}`);
    } else {
      this.dataCache.clear();
      //console.log(`🗑️  [IMPULSE] All cache cleared`);
    }
  }
}

module.exports = ImpulseExitAnalyzer;
