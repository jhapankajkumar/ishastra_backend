const axios = require('axios');

console.log('🔍 DEBUGGING API CONFIDENCE FLOW');
console.log('=====================================\n');

async function testAPIConfidence() {
  try {
    const response = await axios.post('http://localhost:8000/api/trading/stock-analysis', {
      symbols: ['META'],
      systems: ['elder_triple_screen', 'sepa_method', 'cup_handle', 'rsi_mean', 'macd_divergence'],
      capital: 10000
    }, {
      timeout: 30000
    });

    const result = response.data;
    
    console.log('📊 RAW API RESPONSE:');
    console.log(JSON.stringify(result, null, 2));
    
    console.log('📊 API RESPONSE ANALYSIS:');
    console.log('=========================\n');
    
    if (result.success && result.data && result.data.length > 0) {
      const stockResult = result.data[0];
      
      console.log(`Stock: ${stockResult.symbol}`);
      console.log(`Action: ${stockResult.action}`);
      console.log(`Final Confidence: ${stockResult.confidence}%`);
      
      // Check individual system results if available
      if (stockResult.systemResults) {
        console.log('\n📈 INDIVIDUAL SYSTEM RESULTS:');
        console.log('==============================');
        
        Object.keys(stockResult.systemResults).forEach(systemId => {
          const systemResult = stockResult.systemResults[systemId];
          console.log(`${systemId}:`);
          console.log(`  Decision: ${systemResult.decision || 'N/A'}`);
          console.log(`  Confidence: ${systemResult.confidence || 'N/A'}`);
          console.log(`  System: ${systemResult.system || 'N/A'}`);
        });
      }
      
      // Check final results from gate engine
      if (stockResult.systemFinalResults) {
        console.log('\n🚪 GATE ENGINE FINAL RESULTS:');
        console.log('==============================');
        
        Object.keys(stockResult.systemFinalResults).forEach(systemId => {
          const finalResult = stockResult.systemFinalResults[systemId];
          console.log(`${systemId}:`);
          console.log(`  Action: ${finalResult.action || 'N/A'}`);
          console.log(`  Confidence: ${finalResult.confidence || 'N/A'}`);
          console.log(`  Gate Confidence: ${finalResult.finalDecision?.confidence || 'N/A'}`);
        });
      }
      
      // Check unified decision
      if (stockResult.unifiedDecision) {
        console.log('\n🎯 UNIFIED DECISION:');
        console.log('====================');
        console.log(`Action: ${stockResult.unifiedDecision.action}`);
        console.log(`Confidence: ${stockResult.unifiedDecision.confidence}`);
        console.log(`Reasoning: ${stockResult.unifiedDecision.reasoning}`);
      }
      
    } else {
      console.log('❌ No valid results in API response');
    }
    
  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

// Run the test
testAPIConfidence();
