/**
 * Technical Indicators Utility Functions
 */

/**
 * Calculate Exponential Moving Average (EMA)
 * @param {Array} prices - Array of price values (usually closing prices)
 * @param {number} period - Pfunction getLatestEMAValues(quotes) {
  const result = addTechnicalIndicators(quotes);
  const latestQuote = result.quotes[result.quotes.length - 1];
  
  return {
    date: latestQuote?.date,
    price: latestQuote?.close,
    ema13: latestQuote?.ema13,
    ema20: latestQuote?.ema20,
    ema26: latestQuote?.ema26,
    ema50: latestQuote?.ema50,
    sma13: latestQuote?.sma13,
    sma20: latestQuote?.sma20,
    sma26: latestQuote?.sma26,
    sma50: latestQuote?.sma50,
    rsi14: latestQuote?.rsi14
  };
}culation (e.g., 20, 50)
 * @returns {Array} Array of EMA values
 */
function calculateEMA(prices, period) {
  if (!prices || prices.length < period) {
    return [];
  }

  const ema = [];
  const multiplier = 2 / (period + 1);

  // Calculate initial SMA for the first EMA value
  let sum = 0;
  for (let i = 0; i < period; i++) {
    sum += prices[i];
  }
  const initialSMA = sum / period;
  ema.push(initialSMA);

  // Calculate EMA for remaining values
  for (let i = period; i < prices.length; i++) {
    const currentEMA = (prices[i] * multiplier) + (ema[ema.length - 1] * (1 - multiplier));
    ema.push(currentEMA);
  }

  return ema;
}

/**
 * Calculate Simple Moving Average (SMA)
 * @param {Array} prices - Array of price values
 * @param {number} period - Period for SMA calculation
 * @returns {Array} Array of SMA values
 */
function calculateSMA(prices, period) {
  if (!prices || prices.length < period) {
    return [];
  }

  const sma = [];
  for (let i = period - 1; i < prices.length; i++) {
    let sum = 0;
    for (let j = i - period + 1; j <= i; j++) {
      sum += prices[j];
    }
    sma.push(sum / period);
  }

  return sma;
}

/**
 * Calculate Relative Strength Index (RSI)
 * @param {Array} prices - Array of price values (usually closing prices)
 * @param {number} period - Period for RSI calculation (default: 14)
 * @returns {Array} Array of RSI values
 */
function calculateRSI(prices, period = 14) {
  if (!prices || prices.length < period + 1) {
    return [];
  }

  const rsi = [];
  const gains = [];
  const losses = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  if (gains.length < period) {
    return [];
  }

  // Calculate initial averages (SMA for first RSI value)
  let avgGain = gains.slice(0, period).reduce((sum, gain) => sum + gain, 0) / period;
  let avgLoss = losses.slice(0, period).reduce((sum, loss) => sum + loss, 0) / period;

  // Calculate first RSI value
  let rs = avgGain / (avgLoss || 0.0001); // Avoid division by zero
  rsi.push(100 - (100 / (1 + rs)));

  // Calculate subsequent RSI values using Wilder's smoothing
  for (let i = period; i < gains.length; i++) {
    avgGain = (avgGain * (period - 1) + gains[i]) / period;
    avgLoss = (avgLoss * (period - 1) + losses[i]) / period;
    rs = avgGain / (avgLoss || 0.0001);
    rsi.push(100 - (100 / (1 + rs)));
  }

  return rsi;
}

/**
 * Process historical quotes and add technical indicators
 * @param {Array} quotes - Array of quote objects with OHLCV data
 * @returns {Object} Object containing original quotes and calculated indicators
 */
function addTechnicalIndicators(quotes) {
  if (!quotes || quotes.length === 0) {
    return { quotes: [], indicators: {} };
  }

  // Sort quotes by date (oldest first)
  const sortedQuotes = [...quotes].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  // Extract closing prices
  const closingPrices = sortedQuotes.map(quote => quote.close);

  // Calculate EMAs
  const ema13 = calculateEMA(closingPrices, 13);
  const ema20 = calculateEMA(closingPrices, 20);
  const ema26 = calculateEMA(closingPrices, 26);
  const ema50 = calculateEMA(closingPrices, 50);
  
  // Calculate SMAs for comparison
  const sma13 = calculateSMA(closingPrices, 13);
  const sma20 = calculateSMA(closingPrices, 20);
  const sma26 = calculateSMA(closingPrices, 26);
  const sma50 = calculateSMA(closingPrices, 50);

  // Calculate RSI
  const rsi14 = calculateRSI(closingPrices, 14);

  // Add indicators to quotes (only for dates where we have enough data)
  const quotesWithIndicators = sortedQuotes.map((quote, index) => {
    const enhanced = { ...quote };
    
    // Add EMA13 (starts from index 12)
    if (index >= 12 && ema13[index - 12] !== undefined) {
      enhanced.ema13 = parseFloat(ema13[index - 12].toFixed(2));
    }
    
    // Add EMA20 (starts from index 19)
    if (index >= 19 && ema20[index - 19] !== undefined) {
      enhanced.ema20 = parseFloat(ema20[index - 19].toFixed(2));
    }
    
    // Add EMA26 (starts from index 25)
    if (index >= 25 && ema26[index - 25] !== undefined) {
      enhanced.ema26 = parseFloat(ema26[index - 25].toFixed(2));
    }
    
    // Add EMA50 (starts from index 49)
    if (index >= 49 && ema50[index - 49] !== undefined) {
      enhanced.ema50 = parseFloat(ema50[index - 49].toFixed(2));
    }
    
    // Add SMA for comparison
    if (index >= 12 && sma13[index - 12] !== undefined) {
      enhanced.sma13 = parseFloat(sma13[index - 12].toFixed(2));
    }
    
    if (index >= 19 && sma20[index - 19] !== undefined) {
      enhanced.sma20 = parseFloat(sma20[index - 19].toFixed(2));
    }
    
    if (index >= 25 && sma26[index - 25] !== undefined) {
      enhanced.sma26 = parseFloat(sma26[index - 25].toFixed(2));
    }
    
    if (index >= 49 && sma50[index - 49] !== undefined) {
      enhanced.sma50 = parseFloat(sma50[index - 49].toFixed(2));
    }

    // Add RSI (RSI calculation starts from the 15th quote, index 14)
    // The RSI array index corresponds to quote index minus 14
    if (index >= 14 && rsi14[index - 14] !== undefined) {
      enhanced.rsi14 = parseFloat(rsi14[index - 14].toFixed(2));
    }

    return enhanced;
  });

  return {
    quotes: quotesWithIndicators,
    indicators: {
      ema13: ema13.map(val => parseFloat(val.toFixed(2))),
      ema20: ema20.map(val => parseFloat(val.toFixed(2))),
      ema26: ema26.map(val => parseFloat(val.toFixed(2))),
      ema50: ema50.map(val => parseFloat(val.toFixed(2))),
      sma13: sma13.map(val => parseFloat(val.toFixed(2))),
      sma20: sma20.map(val => parseFloat(val.toFixed(2))),
      sma26: sma26.map(val => parseFloat(val.toFixed(2))),
      sma50: sma50.map(val => parseFloat(val.toFixed(2))),
      rsi14: rsi14.map(val => parseFloat(val.toFixed(2)))
    }
  };
}

/**
 * Get latest EMA values for a stock
 * @param {Array} quotes - Historical quotes
 * @returns {Object} Latest EMA values
 */
function getLatestEMAValues(quotes) {
  const result = addTechnicalIndicators(quotes);
  const latestQuote = result.quotes[result.quotes.length - 1];
  
  return {
    date: latestQuote?.date,
    price: latestQuote?.close,
    ema13: latestQuote?.ema13,
    ema20: latestQuote?.ema20,
    ema26: latestQuote?.ema26,
    ema50: latestQuote?.ema50,
    sma13: latestQuote?.sma13,
    sma20: latestQuote?.sma20,
    sma26: latestQuote?.sma26,
    sma50: latestQuote?.sma50,
    rsi14: latestQuote?.rsi14
  };
}

module.exports = {
  calculateEMA,
  calculateSMA,
  calculateRSI,
  addTechnicalIndicators,
  getLatestEMAValues
};
