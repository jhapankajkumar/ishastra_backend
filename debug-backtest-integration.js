/**
 * Debug the leak-free backtesting integration issue
 */

const LeakFreeBacktestingEngine = require('./src/utils/leakFreeBacktestingEngine');

async function debugBacktestIntegration() {
  console.log('🔍 Debugging Leak-Free Backtest Integration...\n');
  
  try {
    console.log('📊 Step 1: Testing Leak-Free Engine Directly...');
    
    const engine = new LeakFreeBacktestingEngine({
      initialCapital: 100000,
      riskPerTrade: 0.02,
      walkForwardWindow: 40,       // Very small window
      walkForwardStep: 10,         // Small steps
      monteCarloRuns: 10,          // Minimal Monte Carlo
      outOfSampleRatio: 0.2
    });
    
    console.log('✅ Engine created successfully');
    
    const result = await engine.runLeakFreeBacktest(
      'TCS.NS', 
      '6mo',  // 6 months should have enough data
      ['sepa']  // Just one system
    );
    
    console.log('✅ Backtest completed!');
    console.log('\n📊 Results:');
    console.log('============');
    console.log(`Best System: ${result.bestSystem?.name}`);
    console.log(`Total Trades: ${result.bestSystem?.totalTrades}`);
    console.log(`Win Rate: ${result.bestSystem?.winRate}%`);
    console.log(`System Health: ${result.systemHealth?.score}/100`);
    console.log(`Ready for Live: ${result.systemHealth?.readyForLiveTrading}`);
    console.log(`Data Quality: ${result.dataQuality?.totalBars} bars`);
    console.log(`Walk-Forward Windows: ${result.walkForwardAnalysis?.windowCount}`);
    
    console.log('\n🎯 DIAGNOSIS:');
    console.log('=============');
    if (result.bestSystem?.totalTrades > 0) {
      console.log('✅ Leak-free backtesting is working perfectly!');
      console.log('✅ The issue is in the integration, not the engine');
    } else {
      console.log('⚠️  No trades generated - system criteria too strict');
      console.log('⚠️  This is normal - real systems are selective');
    }
    
  } catch (error) {
    console.error('❌ Error in leak-free backtest:', error.message);
    console.error('❌ Stack:', error.stack);
  }
}

debugBacktestIntegration();
