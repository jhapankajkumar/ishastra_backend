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
async function getHistorical(symbol, period1 = '1d', period2) {
  if (period2) {
    // period1 and period2 are date strings
    return await yahooFinance.historical(symbol, { period1, period2, interval: '1d' });
  } else {
    // period1 is a duration string (e.g. '2mo')
    return await yahooFinance.historical(symbol, { period1, interval: '1d' });
  }
}

module.exports = {
  searchSymbol,
  getCurrentPrice,
  getHistorical,
  getQuote
};
