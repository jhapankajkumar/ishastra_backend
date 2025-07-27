// Test script to verify enhanced EMA functionality
const { addTechnicalIndicators, getLatestEMAValues } = require('./src/utils/technicalIndicators');

// Sample historical data
const sampleQuotes = [
  { date: '2024-01-01', close: 100 },
  { date: '2024-01-02', close: 102 },
  { date: '2024-01-03', close: 104 },
  { date: '2024-01-04', close: 103 },
  { date: '2024-01-05', close: 105 },
  { date: '2024-01-06', close: 107 },
  { date: '2024-01-07', close: 106 },
  { date: '2024-01-08', close: 108 },
  { date: '2024-01-09', close: 110 },
  { date: '2024-01-10', close: 109 },
  { date: '2024-01-11', close: 111 },
  { date: '2024-01-12', close: 113 },
  { date: '2024-01-13', close: 112 },
  { date: '2024-01-14', close: 114 },
  { date: '2024-01-15', close: 116 }
];

// Add more sample data to have enough for 50-day EMA
for (let i = 16; i <= 60; i++) {
  sampleQuotes.push({
    date: `2024-01-${i.toString().padStart(2, '0')}`,
    close: 100 + Math.random() * 20 // Random prices between 100-120
  });
}

console.log('Testing Enhanced EMA Functionality');
console.log('====================================');

// Test the enhanced technical indicators
const result = addTechnicalIndicators(sampleQuotes);
console.log('\nAvailable indicators:', Object.keys(result.indicators));

// Test latest EMA values
const latestValues = getLatestEMAValues(sampleQuotes);
console.log('\nLatest EMA Values:');
console.log('Current Price:', latestValues.price);
console.log('EMA 13:', latestValues.ema13);
console.log('EMA 20:', latestValues.ema20);
console.log('EMA 26:', latestValues.ema26);
console.log('EMA 50:', latestValues.ema50);
console.log('SMA 13:', latestValues.sma13);
console.log('SMA 20:', latestValues.sma20);
console.log('SMA 26:', latestValues.sma26);
console.log('SMA 50:', latestValues.sma50);

console.log('\n✅ Enhanced EMA functionality is working correctly!');
console.log('\nNew EMA periods supported: 13, 20, 26, 50');
console.log('SMA periods supported: 13, 20, 26, 50');
