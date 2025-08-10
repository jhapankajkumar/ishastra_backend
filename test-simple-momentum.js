/**
 * Direct test of SIMPLE_MOMENTUM system
 */
const AdvancedTechnicalAnalysis = require('./src/utils/advancedTechnicalAnalysis');

async function testSimpleMomentum() {
  console.log('🧪 Testing SIMPLE_MOMENTUM system directly...\n');
  
  // Create mock indicators similar to what TSLA might have
  const mockIndicators = {
    latest: {
      price: 250.00,
      ema12: 248.50,
      ema26: 245.00,
      ema50: 240.00,
      ema200: 230.00,
      rsi: 45.5  // This should trigger a BUY signal (< 60)
    }
  };
  
  console.log('📊 Mock TSLA-like indicators:');
  console.log(JSON.stringify(mockIndicators.latest, null, 2));
  console.log();
  
  // Test our SIMPLE_MOMENTUM system
  const result = AdvancedTechnicalAnalysis.analyzeSimpleMomentum(mockIndicators);
  
  console.log('🎯 SIMPLE_MOMENTUM Result:');
  console.log(JSON.stringify(result, null, 2));
  console.log();
  
  // Test with high RSI (should be SELL)
  const mockIndicators2 = {
    latest: {
      price: 250.00,
      ema12: 248.50,
      ema26: 245.00,
      ema50: 240.00,
      ema200: 230.00,
      rsi: 65.5  // This should trigger a SELL signal (> 60)
    }
  };
  
  console.log('📊 Mock indicators with high RSI:');
  console.log(JSON.stringify(mockIndicators2.latest, null, 2));
  console.log();
  
  const result2 = AdvancedTechnicalAnalysis.analyzeSimpleMomentum(mockIndicators2);
  
  console.log('🎯 SIMPLE_MOMENTUM Result (High RSI):');
  console.log(JSON.stringify(result2, null, 2));
  
  console.log('\n✅ Test completed!');
}

testSimpleMomentum().catch(console.error);
