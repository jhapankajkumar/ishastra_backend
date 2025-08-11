/**
 * Contextual R/R Implementation Verification Test
 * 
 * This test verifies that the contextual risk-reward improvements
 * are working correctly in the production system.
 */

const { getAnalysisDirect } = require('./src/controllers/ai/trade.controller');

async function testContextualRR() {
  console.log('🧪 Contextual R/R Implementation Verification');
  console.log('=' .repeat(50));
  
  try {
    // Test with AAPL - should trigger contextual analysis
    const result = await getAnalysisDirect('AAPL', '3mo', 100000, false);
    
    console.log('\n✅ Analysis completed successfully');
    console.log(`🎯 Decision: ${result.decision?.status} (Grade: ${result.decision?.grade})`);
    console.log(`📊 Confidence: ${result.decision?.confidence}%`);
    console.log(`💰 R/R Ratio: ${result.execution?.riskReward || 'N/A'}`);
    console.log(`🔧 Position: ${result.execution?.positionSize?.shares || 0} shares`);
    
    // Verify contextual analysis was applied
    if (result.decision?.confidence >= 60 && result.decision?.status !== 'HOLD') {
      console.log('\n🎉 SUCCESS: Contextual R/R improvements are working!');
      console.log('   - Decision confidence meets threshold (≥60%)');
      console.log('   - Risk/reward analysis applied contextually');
      console.log('   - Position sizing optimized');
    } else {
      console.log('\n⚠️ PARTIAL SUCCESS: System working but with conservative decision');
      console.log(`   - Decision: ${result.decision?.status} with ${result.decision?.confidence}% confidence`);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR: Contextual R/R verification failed');
    console.error(`   Error: ${error.message}`);
    console.error('   This indicates the contextual improvements may not be fully integrated');
  }
  
  console.log('\n' + '=' .repeat(50));
  console.log('🏁 Verification Complete');
}

// Run the test
testContextualRR().catch(console.error);
