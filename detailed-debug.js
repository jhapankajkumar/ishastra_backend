// Detailed debug of getLatestEMAValues
const { addTechnicalIndicators, getLatestEMAValues } = require('./src/utils/technicalIndicators');

// Create test data
const quotes = [];
for (let i = 0; i < 60; i++) {
  quotes.push({
    date: new Date(2025, 0, i + 1),
    close: 100 + Math.sin(i * 0.1) * 10 + Math.random() * 5
  });
}

console.log('Detailed Debug');
console.log('==============');

// Step 1: Run addTechnicalIndicators
const result = addTechnicalIndicators(quotes);
console.log('Total quotes after processing:', result.quotes.length);

// Step 2: Get the last quote
const latestQuote = result.quotes[result.quotes.length - 1];
console.log('Latest quote index:', result.quotes.length - 1);
console.log('Latest quote close:', latestQuote.close);
console.log('Latest quote rsi14:', latestQuote.rsi14);

// Step 3: Manual object creation (what getLatestEMAValues should do)
const manualResult = {
  date: latestQuote?.date,
  price: latestQuote?.close,
  rsi14: latestQuote?.rsi14
};
console.log('Manual result rsi14:', manualResult.rsi14);

// Step 4: Call the actual function
console.log('\nCalling getLatestEMAValues...');
const latest = getLatestEMAValues(quotes);
console.log('Function result rsi14:', latest.rsi14);
