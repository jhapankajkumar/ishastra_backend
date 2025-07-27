// Debug RSI indexing
const { calculateRSI, addTechnicalIndicators } = require('./src/utils/technicalIndicators');

// Create simple test data
const prices = [44, 44.34, 44.09, 44.15, 43.61, 44.33, 44.83, 45.85, 46.08, 45.89,
               46.03, 46.83, 46.69, 46.45, 46.59, 46.3, 46.28, 46.28, 46.00, 46.03,
               46.41, 46.22, 45.64, 46.21, 46.25, 45.71, 46.45, 47.44, 47.02, 47.23];

console.log('Total prices:', prices.length);

// Test RSI calculation directly
const rsi = calculateRSI(prices, 14);
console.log('RSI array length:', rsi.length);
console.log('RSI values:', rsi.slice(-3).map(v => v.toFixed(2)));

// Test with quotes format
const quotes = prices.map((price, i) => ({ date: new Date(2025, 0, i + 1), close: price }));
const result = addTechnicalIndicators(quotes);

console.log('\nQuotes with RSI:');
const withRSI = result.quotes.filter(q => q.rsi14).map((q, i) => ({ index: i, rsi: q.rsi14 }));
console.log('Count:', withRSI.length);
console.log('First few:', withRSI.slice(0, 3));
console.log('Last few:', withRSI.slice(-3));

console.log('\nLast quote RSI:', result.quotes[result.quotes.length - 1].rsi14);
console.log('Expected RSI start index:', 14); // Should start from quote index 14 (15th quote)
