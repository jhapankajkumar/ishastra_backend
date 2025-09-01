/**
 * Test KKR specifically to verify the fix
 */

const { TradingSystemController } = require('./src/controllers/signal-analysis.controller');

async function testKKRFix() {
  console.log('🔍 TESTING KKR AVOID→SELL BUG FIX...');
  console.log('');
  
  const controller = new TradingSystemController();
  
  try {
    const result = await controller.getStockAnalysis(
      ['minervini_template_advanced', 'institutional_momentum_cascade'], // Systems to use
      ['KKR'] // Stock symbol to analyze
    );
    
    if (result.success && result.results && result.results.length > 0) {
      const analysis = result.results[0];
      
      console.log('📊 KKR ANALYSIS RESULT:');
      console.log(`   Symbol: ${analysis.symbol}`);
      console.log(`   Decision: ${analysis.decision?.action} (${analysis.decision?.confidence}%)`);
      console.log(`   Reasoning: ${analysis.decision?.reasoning}`);
      console.log('');
      
      console.log('🔬 SYSTEM BREAKDOWN:');
      if (analysis.systems) {
        Object.entries(analysis.systems).forEach(([systemName, systemResult]) => {
          console.log(`   ${systemName}: ${systemResult.decision?.action} (${systemResult.decision?.confidencePercent}%)`);
        });
      }
      console.log('');
      
      // Check if the fix worked
      const hasAvoidSystems = Object.values(analysis.systems || {}).every(s => s.decision?.action === 'AVOID');
      const finalDecision = analysis.decision?.action;
      
      if (hasAvoidSystems && finalDecision === 'HOLD') {
        console.log('✅ BUG FIX SUCCESSFUL!');
        console.log('   Both systems say AVOID → Final decision is HOLD ✅');
        console.log('   (Previously would have been SELL ❌)');
      } else if (hasAvoidSystems && finalDecision === 'SELL') {
        console.log('❌ BUG STILL EXISTS!');
        console.log('   Both systems say AVOID but final decision is still SELL');
      } else {
        console.log('🔍 Different scenario - systems may not both be AVOID');
      }
      
    } else {
      console.log('❌ No results returned for KKR');
      console.log(JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Error testing KKR:', error.message);
  }
}

testKKRFix().catch(console.error);
