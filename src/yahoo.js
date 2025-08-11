// Yahoo Finance API utility using yahoo-finance2
// Polyfill fetch for yahoo-finance2 in Node.js
global.fetch = require('undici').fetch;
const yahooFinance = require('yahoo-finance2').default;

// Symbol search
async function searchSymbol(query) {
  const results = await yahooFinance.search(query);
  return results.quotes || [];
}

// Get current price
async function getCurrentPrice(symbol) {
  const quote = await yahooFinance.quote(symbol);
  return quote.regularMarketPrice;
}

async function getQuote(symbol) {
  const quote = await yahooFinance.quote(symbol);
  return quote
}

// Get historical data for ATR calculation
// Always use interval: '1d'.
// If period1 and period2 are both dates (YYYY-MM-DD), use them as range; else, treat period1 as duration string
async function getHistoricalForTrade(symbol, period1 = '1d', period2) {
  if (period2) {
    // period1 and period2 are date strings
    return await yahooFinance.historical(symbol, { period1, period2, interval: '1d' });
  } else {
    // period1 is a duration string (e.g. '2mo')
    return await yahooFinance.historical(symbol, { period1, interval: '1d' });
  }
}



// Get historical data for technical analysis
// Convert period string to date range for yahoo-finance2 chart API
async function getHistorical(symbol, period1 = '6mo', period2) {
  try {
    // Convert period string to actual dates
    console.log(`Fetching historical data for ${symbol} from ${period1} to ${period2 || 'now'}`);
    let endDate = new Date();
    let startDate = new Date();
    
    if (period2) {
      // period1 and period2 are date strings
      startDate = new Date(period1);
      endDate = new Date(period2);
    } else {
      // Convert period string like '3mo', '1y', '6mo' to actual dates
      const periodMap = {
        '1d': 1,
        '5d': 5,
        '1mo': 30,
        '3mo': 90,
        '6mo': 180,
        '12mo': 365,
        '1y': 365,
        '18mo': 547,  // 1.5 years
        '24mo': 730,  // 2 years - FIXED!
        '2y': 730,
        '3y': 1095,
        '5y': 1825
      };
      
      const days = periodMap[period1] || 90; // Default to 3 months
      startDate.setDate(startDate.getDate() - days);
    }
    
    // Use chart API instead of deprecated historical API
    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d'
    });
    
    // Transform chart data to match historical data format
    if (result && result.quotes) {
      return result.quotes.map(quote => ({
        date: quote.date,
        open: quote.open,
        high: quote.high,
        low: quote.low,
        close: quote.close,
        volume: quote.volume,
        adjClose: quote.adjclose || quote.close
      }));
    }
    
    return [];
  } catch (error) {
    console.error(`Error fetching historical data for ${symbol}:`, error.message);
    throw error;
  }
}

module.exports = {
  searchSymbol,
  getCurrentPrice,
  getHistorical,
  getQuote,
  getHistoricalForTrade
};
