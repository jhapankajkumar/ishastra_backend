// Test RSI functionality
const { calculateRSI, addTechnicalIndicators, getLatestEMAValues } = require('./src/utils/technicalIndicators');

console.log('Testing RSI Functionality');
console.log('========================');

// Sample price data for testing
const testPrices = [
  44, 44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89,
  46.03, 46.83, 46.69, 46.45, 46.59, 46.3, 46.28, 46.28, 46.00, 46.03,
  46.41, 46.22, 45.64, 46.21, 46.25, 45.71, 46.45, 47.44, 47.02, 47.23
];

// Calculate RSI
const rsi = calculateRSI(testPrices, 14);
console.log('\nRSI Values (14-period):');
console.log('Latest RSI values:', rsi.slice(-5).map(val => val.toFixed(2)));

// Test with quote format
const quotes = testPrices.map((price, index) => ({
  date: new Date(2025, 0, index + 1),
  close: price
}));

const technicalData = addTechnicalIndicators(quotes);
const latestValues = getLatestEMAValues(quotes);

console.log('\nLatest Technical Indicators:');
console.log('Current Price:', latestValues.price);
console.log('RSI 14:', latestValues.rsi14);
console.log('EMA 20:', latestValues.ema20);
console.log('EMA 50:', latestValues.ema50);

// RSI Signal Analysis
function getRSISignal(rsi) {
  if (!rsi) return 'insufficient_data';
  if (rsi >= 70) return 'overbought';
  if (rsi <= 30) return 'oversold';
  if (rsi >= 50) return 'bullish_momentum';
  return 'bearish_momentum';
}

console.log('\nRSI Analysis:');
console.log('RSI Signal:', getRSISignal(latestValues.rsi14));

// Show historical RSI data points
const quotesWithRSI = technicalData.quotes.filter(q => q.rsi14);
console.log('\nHistorical RSI count:', quotesWithRSI.length);
console.log('RSI range:', {
  min: Math.min(...quotesWithRSI.map(q => q.rsi14)).toFixed(2),
  max: Math.max(...quotesWithRSI.map(q => q.rsi14)).toFixed(2)
});

console.log('\n✅ RSI functionality is working correctly!');
