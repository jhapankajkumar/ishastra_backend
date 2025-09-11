/**
 * 🎯 HISTORICAL DATA LOADER FOR BACKTESTING
 * 
 * Loads 5-year historical candle data from JSON files
 * Supports filtering by date range
 */

const fs = require('fs').promises;
const path = require('path');

class BacktestDataLoader {
  constructor(dataDir = null) {
    this.dataDir = dataDir || path.join(__dirname, '../data/candles');
  }

  /**
   * Load historical candle data for a symbol
   * @param {string} symbol - Stock symbol (e.g., 'AAPL', 'RELIANCE.NS')
   * @param {Date} startDate - Optional start date filter
   * @param {Date} endDate - Optional end date filter
   * @returns {Array} Array of OHLCV candles sorted by date
   */
  async loadCandleData(symbol, startDate = null, endDate = null) {
    try {
      const fileName = `${symbol}.json`;
      const filePath = path.join(this.dataDir, fileName);
      
      // Check if file exists
      try {
        await fs.access(filePath);
      } catch (error) {
        console.warn(`⚠️ No candle data file found for ${symbol}: ${filePath}`);
        return [];
      }
      
      // Read and parse JSON data
      const fileContent = await fs.readFile(filePath, 'utf8');
      const rawData = JSON.parse(fileContent);
      
      // Normalize data structure (handle different JSON formats)
      let candles = this.normalizeDataFormat(rawData);
      
      // Sort by date (ascending)
      candles.sort((a, b) => new Date(a.date) - new Date(b.date));
      
      // Apply date filters if provided
      if (startDate || endDate) {
        candles = this.filterByDateRange(candles, startDate, endDate);
      }
      
      console.log(`📊 Loaded ${candles.length} candles for ${symbol}`);
      return candles;
      
    } catch (error) {
      console.error(`❌ Failed to load candle data for ${symbol}:`, error.message);
      return [];
    }
  }

  /**
   * Normalize different JSON data formats to standard OHLCV structure
   * @param {Object|Array} rawData - Raw JSON data
   * @returns {Array} Normalized OHLCV candles
   */
  normalizeDataFormat(rawData) {
    // Handle array format directly
    if (Array.isArray(rawData)) {
      return rawData.map(this.normalizeCandle);
    }
    
    // Handle object with data property
    if (rawData.data && Array.isArray(rawData.data)) {
      return rawData.data.map(this.normalizeCandle);
    }
    
    // Handle object with historical property
    if (rawData.historical && Array.isArray(rawData.historical)) {
      return rawData.historical.map(this.normalizeCandle);
    }
    
    throw new Error('Unsupported data format');
  }

  /**
   * Normalize individual candle to standard format
   * @param {Object} candle - Raw candle data
   * @returns {Object} Normalized candle with {date, open, high, low, close, volume}
   */
  normalizeCandle(candle) {
    return {
      date: candle.date || candle.timestamp || candle.Date,
      open: parseFloat(candle.open || candle.Open),
      high: parseFloat(candle.high || candle.High),
      low: parseFloat(candle.low || candle.Low), 
      close: parseFloat(candle.close || candle.Close),
      volume: parseInt(candle.volume || candle.Volume || 0)
    };
  }

  /**
   * Filter candles by date range
   * @param {Array} candles - Array of candles
   * @param {Date} startDate - Start date filter
   * @param {Date} endDate - End date filter
   * @returns {Array} Filtered candles
   */
  filterByDateRange(candles, startDate, endDate) {
    return candles.filter(candle => {
      const candleDate = new Date(candle.date);
      
      if (startDate && candleDate < startDate) return false;
      if (endDate && candleDate > endDate) return false;
      
      return true;
    });
  }

  /**
   * Get candles up to a specific date (for point-in-time analysis)
   * @param {Array} candles - All candles for symbol
   * @param {Date} asOfDate - Analysis date
   * @param {number} lookbackDays - Number of days to include (default 252 = ~1 year)
   * @returns {Array} Candles up to the specified date
   */
  getCandlesAsOf(candles, asOfDate, lookbackDays = 252) {
    const asOfDateStr = asOfDate.toISOString().split('T')[0];
    
    // Find candles up to and including the analysis date
    const availableCandles = candles.filter(candle => {
      const candleDate = new Date(candle.date).toISOString().split('T')[0];
      return candleDate <= asOfDateStr;
    });
    
    // Return last N candles (or all if fewer available)
    return availableCandles.slice(-lookbackDays);
  }

  /**
   * Validate candle data quality
   * @param {Array} candles - Array of candles
   * @returns {Object} Validation results
   */
  validateCandleData(candles) {
    if (!candles || candles.length === 0) {
      return { valid: false, error: 'No candle data' };
    }

    const issues = [];
    
    candles.forEach((candle, index) => {
      if (!candle.date) issues.push(`Missing date at index ${index}`);
      if (candle.high < candle.low) issues.push(`High < Low at ${candle.date}`);
      if (candle.close > candle.high || candle.close < candle.low) {
        issues.push(`Close outside High-Low range at ${candle.date}`);
      }
    });

    return {
      valid: issues.length === 0,
      issues: issues,
      totalCandles: candles.length,
      dateRange: {
        start: candles[0]?.date,
        end: candles[candles.length - 1]?.date
      }
    };
  }
}

module.exports = { BacktestDataLoader };
