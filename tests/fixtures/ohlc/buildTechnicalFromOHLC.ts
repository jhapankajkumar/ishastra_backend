/**
 * buildTechnicalFromOHLC.ts
 * 
 * Helper function that derives technical indicators from OHLC data fixtures
 * to create the technical shape expected by the trading controller.
 */

export interface OHLCBar {
  t: number;  // timestamp
  o: number;  // open
  h: number;  // high
  l: number;  // low
  c: number;  // close
  v: number;  // volume
}

export interface FixtureData {
  meta: {
    scenario: string;
    symbol: string;
    period: string;
    bars: number;
    earningsDate?: string;
  };
  data: OHLCBar[];
}

export interface TechnicalIndicators {
  // Price indicators
  ema200: number[];
  sma50: number[];
  sma20: number[];
  
  // Momentum indicators
  rsi14: number[];
  macd: {
    line: number[];
    signal: number[];
    histogram: number[];
  };
  
  // Volatility indicators
  atr14: number[];
  bollingerBands: {
    upper: number[];
    middle: number[];
    lower: number[];
  };
  
  // Volume indicators
  vol20dma: number[];
  
  // Trend strength
  adx14: number[];
  
  // Support/Resistance levels
  support: number[];
  resistance: number[];
  
  // Latest values for quick access
  latest: {
    price: number;
    ema200: number;
    rsi: number;
    atr: number;
    adx: number;
    volume20dma: number;
    support: number;
    resistance: number;
  };
}

/**
 * Calculate Exponential Moving Average
 */
function calculateEMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  const multiplier = 2 / (period + 1);
  
  // Start with SMA for the first value
  let sum = 0;
  for (let i = 0; i < period && i < prices.length; i++) {
    sum += prices[i];
  }
  result.push(sum / Math.min(period, prices.length));
  
  // Calculate EMA for the rest
  for (let i = 1; i < prices.length; i++) {
    const ema = (prices[i] * multiplier) + (result[i - 1] * (1 - multiplier));
    result.push(ema);
  }
  
  return result;
}

/**
 * Calculate Simple Moving Average
 */
function calculateSMA(prices: number[], period: number): number[] {
  const result: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      // Not enough data points, use available data
      const sum = prices.slice(0, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / (i + 1));
    } else {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
      result.push(sum / period);
    }
  }
  
  return result;
}

/**
 * Calculate RSI (Relative Strength Index)
 */
function calculateRSI(prices: number[], period: number = 14): number[] {
  const result: number[] = [];
  const gains: number[] = [];
  const losses: number[] = [];
  
  // Calculate price changes
  for (let i = 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    gains.push(Math.max(change, 0));
    losses.push(Math.max(-change, 0));
  }
  
  for (let i = 0; i < gains.length; i++) {
    if (i < period - 1) {
      result.push(50); // Default RSI for insufficient data
    } else {
      const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        result.push(100);
      } else {
        const rs = avgGain / avgLoss;
        const rsi = 100 - (100 / (1 + rs));
        result.push(rsi);
      }
    }
  }
  
  return [50, ...result]; // Add initial RSI for first price
}

/**
 * Calculate ATR (Average True Range)
 */
function calculateATR(bars: OHLCBar[], period: number = 14): number[] {
  const result: number[] = [];
  const trueRanges: number[] = [];
  
  for (let i = 1; i < bars.length; i++) {
    const high = bars[i].h;
    const low = bars[i].l;
    const prevClose = bars[i - 1].c;
    
    const tr = Math.max(
      high - low,
      Math.abs(high - prevClose),
      Math.abs(low - prevClose)
    );
    
    trueRanges.push(tr);
  }
  
  // Calculate ATR using SMA of true ranges
  const atrSMA = calculateSMA(trueRanges, period);
  return [trueRanges[0] || 0, ...atrSMA]; // Add initial ATR
}

/**
 * Calculate ADX (Average Directional Index) - simplified proxy
 */
function calculateADX(bars: OHLCBar[], period: number = 14): number[] {
  const result: number[] = [];
  
  for (let i = period; i < bars.length; i++) {
    // Simplified ADX calculation based on price momentum and volatility
    const recentBars = bars.slice(i - period, i);
    const priceRange = Math.max(...recentBars.map(b => b.h)) - Math.min(...recentBars.map(b => b.l));
    const priceChange = Math.abs(bars[i].c - bars[i - period].c);
    
    // Proxy ADX: higher values for trending markets
    const adx = Math.min(100, (priceChange / priceRange) * 100);
    result.push(isNaN(adx) ? 25 : adx);
  }
  
  // Fill initial values
  while (result.length < bars.length) {
    result.unshift(25); // Default ADX
  }
  
  return result;
}

/**
 * Calculate MACD
 */
function calculateMACD(prices: number[]): { line: number[], signal: number[], histogram: number[] } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  
  const macdLine = ema12.map((val, idx) => val - ema26[idx]);
  const signalLine = calculateEMA(macdLine, 9);
  const histogram = macdLine.map((val, idx) => val - signalLine[idx]);
  
  return {
    line: macdLine,
    signal: signalLine,
    histogram: histogram
  };
}

/**
 * Calculate Bollinger Bands
 */
function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2) {
  const sma = calculateSMA(prices, period);
  const upper: number[] = [];
  const lower: number[] = [];
  
  for (let i = 0; i < prices.length; i++) {
    if (i < period - 1) {
      upper.push(sma[i] + stdDev * 10); // Rough estimate for initial values
      lower.push(sma[i] - stdDev * 10);
    } else {
      const slice = prices.slice(i - period + 1, i + 1);
      const mean = sma[i];
      const variance = slice.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / period;
      const standardDeviation = Math.sqrt(variance);
      
      upper.push(mean + stdDev * standardDeviation);
      lower.push(mean - stdDev * standardDeviation);
    }
  }
  
  return {
    upper,
    middle: sma,
    lower
  };
}

/**
 * Calculate Support and Resistance levels
 */
function calculateSupportResistance(bars: OHLCBar[]): { support: number[], resistance: number[] } {
  const support: number[] = [];
  const resistance: number[] = [];
  
  const lookback = 20;
  
  for (let i = 0; i < bars.length; i++) {
    const startIdx = Math.max(0, i - lookback);
    const recentBars = bars.slice(startIdx, i + 1);
    
    const lows = recentBars.map(b => b.l);
    const highs = recentBars.map(b => b.h);
    
    // Simple support/resistance: recent lows and highs
    const supportLevel = Math.min(...lows);
    const resistanceLevel = Math.max(...highs);
    
    support.push(supportLevel);
    resistance.push(resistanceLevel);
  }
  
  return { support, resistance };
}

/**
 * Main function to build technical indicators from OHLC data
 */
export function buildTechnicalFromOHLC(fixtureData: FixtureData): TechnicalIndicators {
  const bars = fixtureData.data;
  const closes = bars.map(b => b.c);
  const volumes = bars.map(b => b.v);
  
  // Calculate all indicators
  const ema200 = calculateEMA(closes, 200);
  const sma50 = calculateSMA(closes, 50);
  const sma20 = calculateSMA(closes, 20);
  const rsi14 = calculateRSI(closes, 14);
  const atr14 = calculateATR(bars, 14);
  const adx14 = calculateADX(bars, 14);
  const vol20dma = calculateSMA(volumes, 20);
  const macd = calculateMACD(closes);
  const bollingerBands = calculateBollingerBands(closes, 20, 2);
  const { support, resistance } = calculateSupportResistance(bars);
  
  const lastIdx = bars.length - 1;
  
  return {
    ema200,
    sma50,
    sma20,
    rsi14,
    atr14,
    adx14,
    vol20dma,
    macd,
    bollingerBands,
    support,
    resistance,
    latest: {
      price: closes[lastIdx],
      ema200: ema200[lastIdx],
      rsi: rsi14[lastIdx],
      atr: atr14[lastIdx],
      adx: adx14[lastIdx],
      volume20dma: vol20dma[lastIdx],
      support: support[lastIdx],
      resistance: resistance[lastIdx]
    }
  };
}

/**
 * Load fixture data from JSON file
 */
export function loadFixture(fixtureName: string): FixtureData {
  try {
    const fixturePath = `./tests/fixtures/ohlc/${fixtureName}.json`;
    // In a real implementation, you would use fs.readFileSync or similar
    // For now, this is a placeholder structure
    throw new Error(`Fixture loading not implemented. Use require('${fixturePath}') in your tests.`);
  } catch (error) {
    throw new Error(`Failed to load fixture ${fixtureName}: ${error}`);
  }
}

/**
 * Utility function to create mock technical data matching controller expectations
 */
export function createMockTechnicalData(scenario: string = 'uptrend_highvol'): any {
  // This would be used in tests to create technical data that matches
  // what the trading controller expects
  const basePrice = 200;
  const bars = 100;
  
  const mockData = {
    closes: Array.from({ length: bars }, (_, i) => basePrice + i * 2),
    volumes: Array.from({ length: bars }, () => 50000000),
    ema200: Array.from({ length: bars }, (_, i) => basePrice - 10 + i * 1.8),
    rsi: Array.from({ length: bars }, () => 55 + Math.random() * 20),
    atr: Array.from({ length: bars }, () => 2.5 + Math.random() * 2),
    adx: Array.from({ length: bars }, () => 25 + Math.random() * 40)
  };
  
  return {
    technical: mockData,
    latest: {
      price: mockData.closes[bars - 1],
      ema200: mockData.ema200[bars - 1],
      rsi: mockData.rsi[bars - 1],
      atr: mockData.atr[bars - 1],
      adx: mockData.adx[bars - 1]
    }
  };
}

export default buildTechnicalFromOHLC;
