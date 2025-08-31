/**
 * Technical Indicators Utility Functions
 */

export interface Quote {
  date: Date | string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
  ema13?: number;
  ema20?: number;
  ema26?: number;
  ema50?: number;
  sma13?: number;
  sma20?: number;
  sma26?: number;
  sma50?: number;
  rsi14?: number;
}

export interface IndicatorResult {
  quotes: Quote[];
  indicators: {
    ema13: number[];
    ema20: number[];
    ema26: number[];
    ema50: number[];
    sma13: number[];
    sma20: number[];
    sma26: number[];
    sma50: number[];
    rsi14: number[];
  };
}

export interface LatestEMAValues {
  date?: Date | string;
  price?: number;
  ema13?: number;
  ema20?: number;
  ema26?: number;
  ema50?: number;
  sma13?: number;
  sma20?: number;
  sma26?: number;
  sma50?: number;
  rsi14?: number;
}

/**
 * Calculate Exponential Moving Average (EMA)
 * @param prices - Array of price values (usually closing prices)
 * @param period - Period for EMA calculation (e.g., 20, 50)
 * @returns Array of EMA values
 */
export function calculateEMA(prices: number[], period: number): number[] {
  if (!prices || prices.length < period) {
    return [];
  }

  const ema: number[] = [];
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
 * @param prices - Array of price values
 * @param period - Period for SMA calculation
 * @returns Array of SMA values
 */
export function calculateSMA(prices: number[], period: number): number[] {
  if (!prices || prices.length < period) {
    return [];
  }

  const sma: number[] = [];
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
 * @param prices - Array of price values (usually closing prices)
 * @param period - Period for RSI calculation (default: 14)
 * @returns Array of RSI values
 */
export function calculateRSI(prices: number[], period: number = 14): number[] {
  if (!prices || prices.length < period + 1) {
    return [];
  }

  const rsi: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  if (gains.length < period) {
    return [];
  }

  // Calculate initial average gain and loss
  let avgGain = 0;
  let avgLoss = 0;
  for (let i = 0; i < period; i++) {
    avgGain += gains[i];
    avgLoss += losses[i];
  }
  avgGain /= period;
  avgLoss /= period;

  // Calculate initial RSI
  if (avgLoss === 0) {
    rsi.push(100);
  } else {
    const rs = avgGain / avgLoss;
    rsi.push(100 - (100 / (1 + rs)));
  }

  // Calculate remaining RSI values using smoothed averages
  for (let i = period; i < gains.length; i++) {
    avgGain = ((avgGain * (period - 1)) + gains[i]) / period;
    avgLoss = ((avgLoss * (period - 1)) + losses[i]) / period;

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
 * Add technical indicators to historical quotes
 * @param quotes - Array of historical quotes
 * @returns Enhanced quotes with technical indicators
 */
export function addTechnicalIndicators(quotes: Quote[]): IndicatorResult {
  if (!quotes || quotes.length === 0) {
    return {
      quotes: [],
      indicators: {
        ema13: [], ema20: [], ema26: [], ema50: [],
        sma13: [], sma20: [], sma26: [], sma50: [],
        rsi14: []
      }
    };
  }

  // Sort quotes by date (oldest first)
  const sortedQuotes = [...quotes].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
  });

  // Extract closing prices
  const closingPrices = sortedQuotes.map(quote => quote.close);

  // Calculate technical indicators
  const ema13 = calculateEMA(closingPrices, 13);
  const ema20 = calculateEMA(closingPrices, 20);
  const ema26 = calculateEMA(closingPrices, 26);
  const ema50 = calculateEMA(closingPrices, 50);
  const sma13 = calculateSMA(closingPrices, 13);
  const sma20 = calculateSMA(closingPrices, 20);
  const sma26 = calculateSMA(closingPrices, 26);
  const sma50 = calculateSMA(closingPrices, 50);
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
 * @param quotes - Historical quotes
 * @returns Latest EMA values
 */
export function getLatestEMAValues(quotes: Quote[]): LatestEMAValues {
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

// CommonJS compatibility
module.exports = {
  calculateEMA,
  calculateSMA,
  calculateRSI,
  addTechnicalIndicators,
  getLatestEMAValues
};
