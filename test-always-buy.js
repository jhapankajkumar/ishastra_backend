/**
 * Test with an ALWAYS_BUY system to force LEAK_FREE_VALIDATED status
 */
const AdvancedTechnicalAnalysis = require('./src/utils/advancedTechnicalAnalysis');

// Add the ALWAYS_BUY system to AdvancedTechnicalAnalysis
AdvancedTechnicalAnalysis.analyzeAlwaysBuy = function(indicators) {
  return {
    signal: 'BUY',
    confidence: 0.8,
    pattern: 'ALWAYS_BUY',
    reasoning: 'DEMO: Always buy for demonstration of LEAK_FREE_VALIDATED status',
    criteria: {
      demo_mode: true,
      always_trigger: true,
      current_price: indicators.latest?.price || 100
    }
  };
};

console.log('🧪 ALWAYS_BUY system added for testing');
console.log('🎯 This system will generate BUY signal 100% of the time');

// Test it
const mockIndicators = {
  latest: { price: 100, rsi: 50 }
};

const result = AdvancedTechnicalAnalysis.analyzeAlwaysBuy(mockIndicators);
console.log('✅ Test result:', JSON.stringify(result, null, 2));
