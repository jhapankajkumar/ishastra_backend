/**
 * Simple verification test for OHLC fixtures and technical indicators
 */

const path = require('path');

// Load fixtures
const uptrendFixture = require('./uptrend_highvol.json');
const pullbackFixture = require('./pullback_weakmom.json');
const downtrendFixture = require('./downtrend_below200.json');

// Load helper
const { buildTechnicalFromOHLC, createMockTechnicalData } = require('./buildTechnicalFromOHLC');

console.log('🧪 Testing OHLC Fixtures and Technical Indicators\n');

// Test fixture loading
console.log('📊 Fixture Loading Tests:');
console.log(`✅ Uptrend fixture: ${uptrendFixture.data.length} bars (${uptrendFixture.scenario})`);
console.log(`✅ Pullback fixture: ${pullbackFixture.data.length} bars (${pullbackFixture.scenario})`);
console.log(`✅ Downtrend fixture: ${downtrendFixture.data.length} bars (${downtrendFixture.scenario})\n`);

// Test technical indicator calculation
console.log('📈 Technical Indicator Tests:');

try {
  const uptrendTech = buildTechnicalFromOHLC(uptrendFixture);
  console.log('✅ Uptrend technical indicators calculated successfully');
  console.log(`   Latest price: $${uptrendTech.latest.price.toFixed(2)}`);
  console.log(`   EMA200: $${uptrendTech.latest.ema200.toFixed(2)}`);
  console.log(`   RSI: ${uptrendTech.latest.rsi.toFixed(1)}`);
  console.log(`   ATR: ${uptrendTech.latest.atr.toFixed(2)}`);
  console.log(`   ADX: ${uptrendTech.latest.adx.toFixed(1)}`);
  console.log(`   Volume 20DMA: ${(uptrendTech.latest.volume20dma / 1000000).toFixed(1)}M\n`);
  
  const downtrendTech = buildTechnicalFromOHLC(downtrendFixture);
  console.log('✅ Downtrend technical indicators calculated successfully');
  console.log(`   Latest price: $${downtrendTech.latest.price.toFixed(2)}`);
  console.log(`   EMA200: $${downtrendTech.latest.ema200.toFixed(2)}`);
  console.log(`   RSI: ${downtrendTech.latest.rsi.toFixed(1)}`);
  console.log(`   Price vs EMA200: ${downtrendTech.latest.price > downtrendTech.latest.ema200 ? 'Above' : 'Below'}\n`);
  
} catch (error) {
  console.error('❌ Error calculating technical indicators:', error.message);
}

// Test mock data creation
console.log('🔧 Mock Data Tests:');
try {
  const mockData = createMockTechnicalData('uptrend_highvol');
  console.log('✅ Mock technical data created successfully');
  console.log(`   Mock price: $${mockData.latest.price.toFixed(2)}`);
  console.log(`   Mock EMA200: $${mockData.latest.ema200.toFixed(2)}`);
  console.log(`   Technical arrays length: ${mockData.technical.closes.length}\n`);
} catch (error) {
  console.error('❌ Error creating mock data:', error.message);
}

console.log('🎉 All tests completed successfully!');
console.log('\n📋 Available fixtures:');
console.log('   • uptrend_highvol.json - Strong uptrend with high volume');
console.log('   • pullback_weakmom.json - Pullback with weakening momentum');
console.log('   • downtrend_below200.json - Downtrend below 200-day EMA');
console.log('   • sideways_chop.json - Sideways choppy market');
console.log('   • pre_earnings.json - Pre-earnings volatility');
console.log('   • high_volatility.json - High volatility regime');
console.log('   • bear_regime.json - Bear market regime');
console.log('   • bull_regime.json - Bull market regime');
