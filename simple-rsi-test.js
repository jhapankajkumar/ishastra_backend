// Simple RSI test
const { addTechnicalIndicators, getLatestEMAValues } = require('./src/utils/technicalIndicators');

// Simple test data
const quotes = [];
for (let i = 0; i < 30; i++) {
  quotes.push({
    date: new Date(2025, 0, i + 1),
    close: 100 + Math.random() * 10
  });
}

console.log('Simple RSI Test');
console.log('===============');

// Test addTechnicalIndicators directly
const result = addTechnicalIndicators(quotes);
const lastQuote = result.quotes[result.quotes.length - 1];
console.log('Last quote has RSI?', lastQuote.rsi14 !== undefined);
console.log('Last quote RSI value:', lastQuote.rsi14);

// Manually create return object like getLatestEMAValues should
const manual = {
  rsi14: lastQuote.rsi14
};
console.log('Manual object RSI:', manual.rsi14);

// Test the actual function call
console.log('\nTesting getLatestEMAValues:');
const latest = getLatestEMAValues(quotes);
console.log('Function returned RSI:', latest.rsi14);

// Let's also check the keys in the returned object
console.log('Keys in returned object:', Object.keys(latest));
console.log('RSI14 key exists?', 'rsi14' in latest);
console.log('RSI14 value type:', typeof latest.rsi14);
