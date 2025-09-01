/**
 * Direct test of the voting logic with KKR-like scenario
 */

const { TradingSystemController } = require('./src/controllers/signal-analysis.controller');

function testKKRScenario() {
  console.log('🔍 TESTING KKR SCENARIO: Both systems AVOID...');
  console.log('');
  
  const controller = new TradingSystemController();
  
  // Simulate the exact scenario from your API response
  const minerviniResult = { 
    decision: 'AVOID', 
    confidence: 0.2  // 20% as shown in your response
  };
  
  const momentumResult = { 
    decision: 'AVOID', 
    confidence: 0.2  // 20% as shown in your response
  };
  
  console.log('📊 INPUT (simulating KKR):');
  console.log(`   Minervini: ${minerviniResult.decision} (${Math.round(minerviniResult.confidence * 100)}%)`);
  console.log(`   Momentum: ${momentumResult.decision} (${Math.round(momentumResult.confidence * 100)}%)`);
  console.log('');
  
  const result = controller.simpleVote(minerviniResult, momentumResult);
  
  console.log('🎯 OUTPUT (fixed logic):');
  console.log(`   Decision: ${result.action} (${Math.round(result.confidence * 100)}%)`);
  console.log(`   Reasoning: ${result.reasoning}`);
  console.log('');
  
  console.log('✅ COMPARISON:');
  console.log(`   BEFORE FIX: Both AVOID → SELL ❌`);
  console.log(`   AFTER FIX:  Both AVOID → ${result.action} ${result.action === 'HOLD' ? '✅' : '❌'}`);
  console.log('');
  
  if (result.action === 'HOLD') {
    console.log('🎉 BUG FIXED! KKR should now return HOLD instead of SELL');
  } else {
    console.log('❌ Bug still exists or different scenario');
  }
}

testKKRScenario();
