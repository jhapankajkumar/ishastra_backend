/**
 * Example usage of OHLC fixtures and technical indicators in tests
 */

const { 
  getFixtureWithTechnicals, 
  getFixtureNames,
  fixtures,
  buildTechnicalFromOHLC 
} = require('./index');

console.log('📚 OHLC Fixture Usage Examples\n');

// Example 1: Load fixture with calculated technicals
console.log('Example 1: Loading fixture with technicals');
const uptrendData = getFixtureWithTechnicals('uptrendHighvol');
console.log(`✅ ${uptrendData.scenario}`);
console.log(`   Bars: ${uptrendData.bars}`);
console.log(`   Latest Price: $${uptrendData.technicals.latest.price.toFixed(2)}`);
console.log(`   Above EMA200: ${uptrendData.technicals.latest.price > uptrendData.technicals.latest.ema200 ? 'Yes' : 'No'}`);
console.log(`   RSI: ${uptrendData.technicals.latest.rsi.toFixed(1)} (${uptrendData.technicals.latest.rsi > 70 ? 'Overbought' : 'Normal'})\n`);

// Example 2: Test different market scenarios
console.log('Example 2: Testing different market scenarios');
const scenarios = ['uptrendHighvol', 'downtrendBelow200', 'sidewaysChop'];

scenarios.forEach(scenario => {
  const data = getFixtureWithTechnicals(scenario);
  const isUptrend = data.technicals.latest.price > data.technicals.latest.ema200;
  const rsiLevel = data.technicals.latest.rsi > 70 ? 'Overbought' : 
                   data.technicals.latest.rsi < 30 ? 'Oversold' : 'Normal';
  
  console.log(`📈 ${scenario}: Price ${isUptrend ? 'above' : 'below'} EMA200, RSI ${rsiLevel}`);
});

console.log('\nExample 3: Available fixtures');
console.log('📋 All fixtures:', getFixtureNames().join(', '));

console.log('\nExample 4: Using in test assertions');
console.log(`
// Example Jest test
test('should identify uptrend conditions', () => {
  const data = getFixtureWithTechnicals('uptrendHighvol');
  
  // Assert price is above EMA200
  expect(data.technicals.latest.price).toBeGreaterThan(data.technicals.latest.ema200);
  
  // Assert RSI shows momentum
  expect(data.technicals.latest.rsi).toBeGreaterThan(50);
  
  // Assert we have sufficient data
  expect(data.bars).toBeGreaterThan(50);
});

test('should identify bearish conditions', () => {
  const data = getFixtureWithTechnicals('downtrendBelow200');
  
  // Assert price is below EMA200
  expect(data.technicals.latest.price).toBeLessThan(data.technicals.latest.ema200);
  
  // Assert RSI shows weakness
  expect(data.technicals.latest.rsi).toBeLessThan(50);
});
`);
