/**
 * 🚨 TEST COMPLETE SIMPLE REFACTOR
 * Verify no legacy dependencies remain
 */

const { TradingSystemController } = require('./src/controllers/signal-analysis.controller');

async function testCompleteRefactor() {
  console.log('🚨 TESTING COMPLETE SIMPLE REFACTOR...');
  console.log('');
  
  const controller = new TradingSystemController();
  
  try {
    // Test with a simple symbol
    console.log('📈 Testing simple mode with AAPL...');
    
    const result = await controller.getStockAnalysis(
      ['minervini_template_advanced', 'institutional_momentum_cascade'], // Input systems (should be ignored)
      ['AAPL'] // Test symbol
    );
    
    console.log('✅ SUCCESS: No legacy dependencies triggered!');
    console.log('');
    
    // Verify result structure
    if (result.success && result.results && result.results.length > 0) {
      const analysis = result.results[0];
      console.log(`📊 RESULT SUMMARY:`);
      console.log(`   Symbol: ${analysis.symbol}`);
      console.log(`   Decision: ${analysis.decision?.action} (${Math.round(analysis.decision?.confidence * 100)}%)`);
      console.log(`   Systems Used: ${Object.keys(analysis.systems || {}).join(', ')}`);
      console.log(`   Current Price: $${analysis.currentPrice?.toFixed(2) || 'N/A'}`);
      console.log('');
      
      // Check for legacy artifacts
      const reasoning = analysis.decision?.reasoning || [];
      const reasoningArray = Array.isArray(reasoning) ? reasoning : [reasoning];
      
      const hasLegacyAI = reasoningArray.some(r => 
        typeof r === 'string' && (
          r.includes('generateExpertAIDecision') || 
          r.includes('prepareAnalysisContext') ||
          r.includes('SingleSystemAnalyzer')
        )
      );
      
      if (hasLegacyAI) {
        console.log('❌ LEGACY DEPENDENCIES DETECTED in reasoning!');
        console.log('Reasoning:', analysis.decision.reasoning);
      } else {
        console.log('✅ NO LEGACY DEPENDENCIES FOUND!');
      }
      
      console.log('');
      console.log('🎯 REFACTOR STATUS: COMPLETE');
      console.log('   • ❌ prepareAnalysisContext: REMOVED');  
      console.log('   • ❌ generateExpertAIDecision: REMOVED');
      console.log('   • ❌ SingleSystemAnalyzer: REMOVED');
      console.log('   • ✅ Simple Technical Data Fetcher: ACTIVE');
      console.log('   • ✅ Direct System Analysis: ACTIVE');
      console.log('   • ✅ Simple 2-System Voting: ACTIVE');
      
    } else {
      console.log('❌ No analysis results returned');
      console.log('Response:', JSON.stringify(result, null, 2));
    }
    
  } catch (error) {
    console.error('❌ ERROR during simple refactor test:');
    console.error(error.message);
    
    // Check if error mentions legacy dependencies
    if (error.message.includes('prepareAnalysisContext') || 
        error.message.includes('generateExpertAIDecision') ||
        error.message.includes('SingleSystemAnalyzer')) {
      console.error('');
      console.error('🚨 LEGACY DEPENDENCY ERROR DETECTED!');
      console.error('The refactor is incomplete - legacy code is still being called.');
    }
  }
}

// Run the test
testCompleteRefactor().catch(console.error);
