// Debug RSI issue
const { addTechnicalIndicators, getLatestEMAValues } = require('./src/utils/technicalIndicators');

// Create test data with sufficient history
const quotes = [];
for (let i = 0; i < 60; i++) {
  quotes.push({
    date: new Date(2025, 0, i + 1),
    close: 100 + Math.sin(i * 0.1) * 10 + Math.random() * 5
  });
}

console.log('Debug RSI Implementation');
console.log('========================');
console.log('Test data points:', quotes.length);

const result = addTechnicalIndicators(quotes);
const latest = getLatestEMAValues(quotes);

console.log('\nLatest quote RSI:', result.quotes[result.quotes.length - 1].rsi14);
console.log('Latest values RSI:', latest.rsi14);

// Find quotes with RSI
const quotesWithRSI = result.quotes.filter(q => q.rsi14 !== undefined);
console.log('Quotes with RSI:', quotesWithRSI.length);

if (quotesWithRSI.length > 0) {
  console.log('First RSI value:', quotesWithRSI[0].rsi14);
  console.log('Last RSI value:', quotesWithRSI[quotesWithRSI.length - 1].rsi14);
}

// Check raw indicators
console.log('Raw RSI indicator length:', result.indicators.rsi14?.length || 0);
