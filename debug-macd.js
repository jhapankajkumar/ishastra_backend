/**
 * Debug the MACD calculation issue
 */

const RealisticTradingDataGenerator = require('./src/systems/tests/RealisticTradingDataGenerator');

function debugMACD() {
  const generator = new RealisticTradingDataGenerator();
  
  // Simple test data
  const testPrices = [];
  for (let i = 0; i < 50; i++) {
    testPrices.push(100 + i * 0.1 + Math.random() - 0.5);
  }
  
  console.log('Test prices length:', testPrices.length);
  console.log('First 10 prices:', testPrices.slice(0, 10));
  
  const macd = generator.calculateMACD(testPrices, 12, 26, 9);
  console.log('MACD result:', macd);
  
  // Test EMA calculation
  const emaTest = generator.calculateEMAArray(testPrices, 12);
  console.log('EMA test length:', emaTest.length);
  console.log('Last 3 EMA values:', emaTest.slice(-3));
  
  // Test RSI calculation
  const rsi = generator.calculateRSI(testPrices, 14);
  console.log('RSI result:', rsi);
}

debugMACD();
