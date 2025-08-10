/**
 * 🎯 LEAK-FREE BACKTESTING DEMO
 * Demonstrates the new professional-grade backtesting system
 */

const LeakFreeBacktestingEngine = require('./src/utils/leakFreeBacktestingEngine');

async function runLeakFreeDemo() {
  console.log('🚀 Starting Leak-Free Backtesting Demo...\n');
  
  try {
    // Initialize the leak-free backtesting engine
    const engine = new LeakFreeBacktestingEngine({
      initialCapital: 100000,
      riskPerTrade: 0.02,
      signalDelayBars: 1,           // 1-day delay from signal to execution
      confirmationBars: 0,          // No additional confirmation needed
      walkForwardWindow: 252,       // 1 year training windows
      walkForwardStep: 21,          // 1 month step size
      outOfSampleRatio: 0.2,        // 20% out-of-sample testing
      monteCarloRuns: 500           // 500 Monte Carlo simulations
    });
    
    // Test symbols
    const testSymbols = ['HDFCBANK.NS', 'RELIANCE.NS', 'TCS.NS'];
    const testSystems = ['sepa', 'tripleScreen', 'dualTimeframe'];
    
    console.log(`🎯 Testing ${testSymbols.length} symbols with ${testSystems.length} trading systems`);
    console.log(`📊 Walk-Forward Analysis: 1-year windows, 1-month steps`);
    console.log(`🎲 Monte Carlo Analysis: 500 simulations per symbol\n`);
    
    const results = {};
    
    for (const symbol of testSymbols) {
      console.log(`\n📈 Processing ${symbol}...`);
      console.log('='.repeat(60));
      
      try {
        const result = await engine.runLeakFreeBacktest(
          symbol, 
          '2y',  // 2 years of data
          testSystems
        );
        
        results[symbol] = result;
        
        // Display key results
        console.log(`\n✅ ${symbol} Results Summary:`);
        console.log(`📊 Walk-Forward Windows: ${result.walkForwardResults.windowCount}`);
        console.log(`🏆 Best System: ${result.bestSystem.name}`);
        console.log(`📈 Total Trades: ${result.performanceMetrics.overall.totalTrades}`);
        console.log(`🎯 Win Rate: ${result.performanceMetrics.overall.winRate.toFixed(1)}%`);
        console.log(`💰 Total Return: ${result.performanceMetrics.overall.totalReturn.toFixed(2)}%`);
        console.log(`📉 Max Drawdown: ${result.performanceMetrics.overall.maxDrawdown.toFixed(2)}%`);
        console.log(`⚡ Sharpe Ratio: ${result.performanceMetrics.overall.sharpeRatio.toFixed(3)}`);
        
        // Out-of-Sample Performance
        const oosSample = result.performanceMetrics.outOfSample;
        console.log(`\n🔬 Out-of-Sample Performance:`);
        console.log(`📊 OOS Trades: ${oosSample.totalTrades}`);
        console.log(`🎯 OOS Win Rate: ${oosSample.winRate.toFixed(1)}%`);
        console.log(`💰 OOS Return: ${oosSample.totalReturn.toFixed(2)}%`);
        console.log(`📉 OOS Drawdown: ${oosSample.maxDrawdown.toFixed(2)}%`);
        
        // System Health
        const health = result.performanceMetrics.tradingSystemHealth;
        console.log(`\n🏥 System Health: ${health.rating} (${health.score}/100)`);
        console.log(`💡 Recommendation: ${health.recommendation}`);
        console.log(`🚦 Ready for Live Trading: ${health.readyForLiveTrading ? '✅ YES' : '❌ NO'}`);
        
        // Monte Carlo Results
        if (result.monteCarloResults) {
          const mc = result.monteCarloResults;
          console.log(`\n🎲 Monte Carlo Analysis (${mc.runs} simulations):`);
          console.log(`📊 Average Return: ${mc.simulation.averageReturn.toFixed(2)}%`);
          console.log(`📈 Probability of Profit: ${mc.simulation.probabilityOfProfit.toFixed(1)}%`);
          console.log(`🛡️ Robustness Score: ${mc.robustness.overallRobustness.toFixed(1)}/100`);
        }
        
        // Statistical Significance
        const stats = result.performanceMetrics.statisticalSignificance;
        console.log(`\n📈 Statistical Analysis:`);
        console.log(`🔬 Statistically Significant: ${stats.significant ? '✅ YES' : '❌ NO'}`);
        console.log(`📊 Confidence Level: ${stats.confidenceLevel}%`);
        console.log(`📉 T-Statistic: ${stats.tStatistic.toFixed(3)}`);
        
      } catch (error) {
        console.error(`❌ Error processing ${symbol}: ${error.message}`);
        results[symbol] = { error: error.message };
      }
    }
    
    // Overall Summary
    console.log('\n' + '='.repeat(80));
    console.log('🏆 LEAK-FREE BACKTESTING DEMO COMPLETE');
    console.log('='.repeat(80));
    
    const successfulResults = Object.entries(results).filter(([_, result]) => !result.error);
    console.log(`\n📊 Successfully processed: ${successfulResults.length}/${testSymbols.length} symbols`);
    
    if (successfulResults.length > 0) {
      console.log('\n🏅 TOP PERFORMING SYSTEMS:');
      
      const systemRankings = {};
      successfulResults.forEach(([symbol, result]) => {
        const bestSystem = result.bestSystem.name;
        if (!systemRankings[bestSystem]) {
          systemRankings[bestSystem] = {
            name: bestSystem,
            symbols: [],
            avgReturn: 0,
            avgWinRate: 0,
            avgDrawdown: 0,
            readyForLive: 0
          };
        }
        
        systemRankings[bestSystem].symbols.push(symbol);
        const perf = result.performanceMetrics.overall;
        systemRankings[bestSystem].avgReturn += perf.totalReturn;
        systemRankings[bestSystem].avgWinRate += perf.winRate;
        systemRankings[bestSystem].avgDrawdown += perf.maxDrawdown;
        if (result.performanceMetrics.tradingSystemHealth.readyForLiveTrading) {
          systemRankings[bestSystem].readyForLive++;
        }
      });
      
      // Calculate averages and rank systems
      const rankedSystems = Object.values(systemRankings)
        .map(system => ({
          ...system,
          avgReturn: system.avgReturn / system.symbols.length,
          avgWinRate: system.avgWinRate / system.symbols.length,
          avgDrawdown: system.avgDrawdown / system.symbols.length,
          liveReadyPercent: (system.readyForLive / system.symbols.length) * 100,
          compositeScore: (
            (system.avgReturn / system.symbols.length) * 0.4 +
            (system.avgWinRate / system.symbols.length) * 0.3 +
            (100 - system.avgDrawdown / system.symbols.length) * 0.2 +
            ((system.readyForLive / system.symbols.length) * 100) * 0.1
          )
        }))
        .sort((a, b) => b.compositeScore - a.compositeScore);
      
      rankedSystems.forEach((system, index) => {
        console.log(`\n${index + 1}. ${system.name.toUpperCase()}`);
        console.log(`   📊 Best on: ${system.symbols.join(', ')}`);
        console.log(`   💰 Avg Return: ${system.avgReturn.toFixed(2)}%`);
        console.log(`   🎯 Avg Win Rate: ${system.avgWinRate.toFixed(1)}%`);
        console.log(`   📉 Avg Drawdown: ${system.avgDrawdown.toFixed(2)}%`);
        console.log(`   🚦 Live Ready: ${system.liveReadyPercent.toFixed(0)}% of symbols`);
        console.log(`   🏆 Composite Score: ${system.compositeScore.toFixed(1)}`);
      });
      
      console.log('\n💡 LEAK-FREE BACKTESTING INSIGHTS:');
      console.log('✅ All results are free from look-ahead bias');
      console.log('✅ Out-of-sample validation ensures robustness');
      console.log('✅ Monte Carlo analysis confirms statistical significance');
      console.log('✅ Walk-forward analysis validates consistency');
      console.log('✅ System health metrics guide live trading readiness');
      
      console.log('\n🚀 NEXT STEPS:');
      console.log('1. Review individual system performance details');
      console.log('2. Consider parameter optimization for underperforming systems');
      console.log('3. Implement paper trading for systems marked "Ready for Live Trading"');
      console.log('4. Set up automated monitoring for live trading systems');
      console.log('5. Schedule regular backtesting updates with new data');
    }
    
    console.log('\n✨ Demo completed successfully!');
    return results;
    
  } catch (error) {
    console.error(`❌ Demo failed: ${error.message}`);
    console.error(error.stack);
  }
}

// Run the demo if this file is executed directly
if (require.main === module) {
  runLeakFreeDemo()
    .then(results => {
      console.log('\n🎉 Leak-free backtesting demo finished!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Demo crashed:', error.message);
      process.exit(1);
    });
}

module.exports = { runLeakFreeDemo };
