const express = require('express');
const router = express.Router();
const yahooFinance = require('yahoo-finance2').default;
const { addTechnicalIndicators, getLatestEMAValues } = require('../utils/technicalIndicators');

/**
 * Get historical data with technical indicators for a symbol
 * GET /api/yahoo/indicators/:symbol
 * Query params:
 * - period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 2y, 5y, 10y, ytd, max (default: 6mo)
 * - interval: 1m, 2m, 5m, 15m, 30m, 60m, 90m, 1h, 1d, 5d, 1wk, 1mo, 3mo (default: 1d)
 */
router.get('/indicators/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '6mo', interval = '1d' } = req.query;

    console.log(`Fetching indicators for ${symbol} with period: ${period}, interval: ${interval}`);

    // Fetch historical data from Yahoo Finance
    const result = await yahooFinance.chart(symbol, {
      period1: getPeriodStartDate(period),
      interval: interval
    });

    if (!result || !result.quotes || result.quotes.length === 0) {
      return res.status(404).json({ 
        error: 'No historical data found for this symbol',
        symbol: symbol
      });
    }

    // Convert Yahoo Finance format to our format
    const quotes = result.quotes.map(quote => ({
      date: quote.date,
      open: quote.open || 0,
      high: quote.high || 0,
      low: quote.low || 0,
      close: quote.close || 0,
      adjClose: quote.adjclose || quote.close || 0,
      volume: quote.volume || 0
    }));

    // Calculate technical indicators
    const technicalData = addTechnicalIndicators(quotes);
    const latestValues = getLatestEMAValues(quotes);

    // Calculate support and resistance (last 20 periods)
    const lookback = 20;
    const recentQuotes = technicalData.quotes.slice(-lookback);
    let support = null;
    let resistance = null;
  
    const highs = recent.map(q => q.high).filter(v => v != null);
    if (!lows.length || !highs.length) return { support: null, resistance: null };

    const sortedLows = [...lows].sort((a, b) => a - b);
    const sortedHighs = [...highs].sort((a, b) => b - a);
    if (recentQuotes.length > 0) {
      support = sortedLows[Math.floor(sortedLows.length * 0.2)],      // bottom 20th percentile
      resistance = sortedHighs[Math.floor(sortedHighs.length * 0.2)];  // top 20th percentile
    }
  

    res.json({
      symbol: symbol.toUpperCase(),
      period: period,
      interval: interval,
      totalDataPoints: quotes.length,
      latestValues: latestValues,
      support,
      resistance,
      historicalData: technicalData.quotes.slice(-100), // Return last 100 days
      indicators: {
        ema13Available: technicalData.quotes.filter(q => q.ema13).length,
        ema20Available: technicalData.quotes.filter(q => q.ema20).length,
        ema26Available: technicalData.quotes.filter(q => q.ema26).length,
        ema50Available: technicalData.quotes.filter(q => q.ema50).length,
        rsi14Available: technicalData.quotes.filter(q => q.rsi14).length,
        rawIndicators: technicalData.indicators
      }
    });

  } catch (error) {
    console.error('Error fetching indicators:', error);
    res.status(500).json({ 
      error: 'Failed to fetch technical indicators',
      message: error.message 
    });
  }
});

/**
 * Get only the latest EMA values for a symbol (lightweight)
 * GET /api/yahoo/ema/:symbol
 */
router.get('/ema/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const { period = '6mo' } = req.query;

    console.log(`Fetching EMA values for ${symbol}`);

    // Fetch historical data
    const result = await yahooFinance.chart(symbol, {
      period1: getPeriodStartDate(period),
      interval: '1d'
    });

    if (!result || !result.quotes || result.quotes.length < 50) {
      return res.status(404).json({ 
        error: 'Insufficient historical data for EMA calculation (need at least 50 days)',
        symbol: symbol,
        dataPoints: result?.quotes?.length || 0
      });
    }

    // Convert and calculate
    const quotes = result.quotes.map(quote => ({
      date: quote.date,
      close: quote.close || 0
    }));

    const latestValues = getLatestEMAValues(quotes);

    res.json({
      symbol: symbol.toUpperCase(),
      date: latestValues.date,
      currentPrice: latestValues.price,
      ema13: latestValues.ema13,
      ema20: latestValues.ema20,
      ema26: latestValues.ema26,
      ema50: latestValues.ema50,
      sma13: latestValues.sma13,
      sma20: latestValues.sma20,
      sma26: latestValues.sma26,
      sma50: latestValues.sma50,
      rsi14: latestValues.rsi14,
      trend: {
        overall: latestValues.ema20 && latestValues.ema50 ? 
          (latestValues.ema20 > latestValues.ema50 ? 'bullish' : 'bearish') : 'insufficient_data',
        shortTerm: latestValues.price && latestValues.ema20 ?
          (latestValues.price > latestValues.ema20 ? 'above_ema20' : 'below_ema20') : 'insufficient_data',
        emaAlignment: getEMAAlignment(latestValues),
        rsiSignal: getRSISignal(latestValues.rsi14)
      }
    });

  } catch (error) {
    console.error('Error fetching EMA:', error);
    res.status(500).json({ 
      error: 'Failed to fetch EMA values',
      message: error.message 
    });
  }
});

/**
 * Helper function to get start date for different periods
 */
function getPeriodStartDate(period) {
  const now = new Date();
  const startDate = new Date();

  switch (period) {
    case '1d':
      startDate.setDate(now.getDate() - 1);
      break;
    case '5d':
      startDate.setDate(now.getDate() - 5);
      break;
    case '1mo':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3mo':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6mo':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case '2y':
      startDate.setFullYear(now.getFullYear() - 2);
      break;
    case '5y':
      startDate.setFullYear(now.getFullYear() - 5);
      break;
    case '10y':
      startDate.setFullYear(now.getFullYear() - 10);
      break;
    case 'ytd':
      startDate.setMonth(0, 1); // January 1st of current year
      break;
    case 'max':
      startDate.setFullYear(1970); // Very old date for max data
      break;
    default:
      startDate.setMonth(now.getMonth() - 6); // Default to 6 months
  }

  return startDate;
}

/**
 * Analyze EMA alignment for trend strength
 */
function getEMAAlignment(latestValues) {
  const { ema13, ema20, ema26, ema50 } = latestValues;
  
  if (!ema13 || !ema20 || !ema26 || !ema50) {
    return 'insufficient_data';
  }
  
  // Check if EMAs are in proper order for bullish/bearish alignment
  const bullishAlignment = ema13 > ema20 && ema20 > ema26 && ema26 > ema50;
  const bearishAlignment = ema13 < ema20 && ema20 < ema26 && ema26 < ema50;
  
  if (bullishAlignment) {
    return 'bullish_aligned';
  } else if (bearishAlignment) {
    return 'bearish_aligned';
  } else {
    return 'mixed_signals';
  }
}

/**
 * Analyze RSI signal for overbought/oversold conditions
 */
function getRSISignal(rsi) {
  if (!rsi || rsi === undefined) {
    return 'insufficient_data';
  }
  
  if (rsi >= 70) {
    return 'overbought';
  } else if (rsi <= 30) {
    return 'oversold';
  } else if (rsi >= 50) {
    return 'bullish_momentum';
  } else {
    return 'bearish_momentum';
  }
}

module.exports = router;
