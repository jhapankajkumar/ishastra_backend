/**
 * Test the integrated leak-free backtesting in analysis API
 */

async function testIntegratedAPI() {
  console.log('🧪 Testing Leak-Free Integration in Analysis API...\n');
  
  try {
    const response = await fetch('http://localhost:8000/api/trading/analysis?symbol=TCS.NS&period=3mo');
    const data = await response.json();
    
    console.log('📊 API Response Summary:');
    console.log('========================');
    console.log(`Symbol: ${data.symbol}`);
    console.log(`Decision: ${data.decision?.action}`);
    console.log(`Confidence: ${data.decision?.confidencePct}%`);
    
    if (data.context?.backtesting) {
      const bt = data.context.backtesting;
      console.log('\n🛡️ Backtesting Information:');
      console.log('============================');
      console.log(`Status: ${bt.status}`);
      console.log(`Leak-Free: ${bt.leakFree ? '✅ YES' : '❌ NO'}`);
      
      if (bt.status !== 'BACKTEST_UNAVAILABLE') {
        console.log(`Best System: ${bt.system}`);
        console.log(`Win Rate: ${bt.winRate}%`);
        console.log(`Total Return: ${bt.totalReturn}%`);
        console.log(`Total Trades: ${bt.totalTrades}`);
        console.log(`System Health: ${bt.systemHealth}/100`);
        console.log(`Ready for Live Trading: ${bt.readyForLiveTrading ? '✅' : '❌'}`);
      }
    }
    
    console.log('\n🎯 INTEGRATION STATUS:');
    console.log('======================');
    const isIntegrated = data.context?.backtesting?.leakFree === true;
    console.log(isIntegrated ? 
      '✅ SUCCESS: Leak-free backtesting is integrated!' : 
      '⚠️  INFO: Using fallback or backtest unavailable'
    );
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Use dynamic import for fetch if needed
async function runTest() {
  if (typeof fetch === 'undefined') {
    const { default: fetch } = await import('node-fetch');
    global.fetch = fetch;
  }
  await testIntegratedAPI();
}

runTest();
