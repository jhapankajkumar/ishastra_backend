// Debug latest values issue
const { addTechnicalIndicators, getLatestEMAValues } = require('./src/utils/technicalIndicators');

// Create test data
const quotes = [];
for (let i = 0; i < 60; i++) {
  quotes.push({
    date: new Date(2025, 0, i + 1),
    close: 100 + Math.sin(i * 0.1) * 10 + Math.random() * 5
  });
}

const result = addTechnicalIndicators(quotes);
const lastQuote = result.quotes[result.quotes.length - 1];

console.log('Last quote properties:');
console.log('Close:', lastQuote.close);
console.log('RSI14:', lastQuote.rsi14);
console.log('EMA20:', lastQuote.ema20);

console.log('\nLatest values function result:');
const latest = getLatestEMAValues(quotes);
console.log('Price:', latest.price);
console.log('RSI14:', latest.rsi14);
console.log('EMA20:', latest.ema20);
