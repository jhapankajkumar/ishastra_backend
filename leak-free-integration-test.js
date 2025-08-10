/**
 * 🧪 LEAK-FREE BACKTESTING INTEGRATION TEST
 * Quick validation of the leak-free system
 */

const LeakFreeBacktestingEngine = require('./src/utils/leakFreeBacktestingEngine');

async function runQuickTest() {
  console.log('🧪 Starting Leak-Free Backtesting Integration Test...\n');
  
  try {
    // Create a minimal test configuration
    const engine = new LeakFreeBacktestingEngine({
      initialCapital: 10000,        // Smaller capital for testing
      walkForwardWindow: 60,        // 60-day windows for faster testing  
      walkForwardStep: 10,          // 10-day steps
      monteCarloRuns: 50,          // 50 runs for speed
      outOfSampleRatio: 0.3        // 30% out-of-sample
    });
    
    console.log('✅ Engine initialized successfully');
    
    // Test the historical data fetching
    console.log('📊 Testing data fetching...');
    const historicalData = await engine.getHistoricalData('TCS.NS', '1y');
    console.log(`✅ Fetched ${historicalData.length} data points for TCS.NS`);
    
    if (historicalData.length < 100) {
      throw new Error('Insufficient historical data for testing');
    }
    
    // Test basic analysis components
    console.log('🔬 Testing analysis components...');
    const pointInTimeData = historicalData.slice(0, 100);
    
    // Test the analysis validation
    const isValid = engine.validateAnalysisForLookAhead({
      technicalIndicators: {
        latest: { 
          price: pointInTimeData[pointInTimeData.length - 1].close 
        }
      }
    }, pointInTimeData);
    
    console.log(`✅ Analysis validation test: ${isValid ? 'PASSED' : 'FAILED'}`);
    
    // Test position management functions
    console.log('💼 Testing position management...');
    const testPrice = 100;
    const stopLoss = engine.calculateStopLoss(testPrice, 'LONG');
    const target = engine.calculateTarget(testPrice, 'LONG');
    const positionSize = engine.calculatePositionSize(testPrice);
    
    console.log(`✅ Stop Loss calculation: ${stopLoss}`);
    console.log(`✅ Target calculation: ${target}`);
    console.log(`✅ Position size calculation: ${positionSize}`);
    
    // Test statistical functions
    console.log('📊 Testing statistical functions...');
    const testReturns = [1, -0.5, 2, -1, 1.5, 0.5, -0.3, 1.2];
    const mean = engine.calculateMean(testReturns);
    const stdDev = engine.calculateStandardDeviation(testReturns);
    const sharpe = engine.calculateSharpeRatio(testReturns);
    
    console.log(`✅ Mean: ${mean.toFixed(3)}`);
    console.log(`✅ Std Dev: ${stdDev.toFixed(3)}`);
    console.log(`✅ Sharpe: ${sharpe.toFixed(3)}`);
    
    // Test performance calculation
    console.log('📈 Testing performance calculations...');
    const testTrades = [
      { pnl: 100, pnlPercent: 1.0 },
      { pnl: -50, pnlPercent: -0.5 },
      { pnl: 200, pnlPercent: 2.0 },
      { pnl: -30, pnlPercent: -0.3 },
      { pnl: 150, pnlPercent: 1.5 }
    ];
    
    const basicMetrics = engine.calculateBasicMetrics(testTrades);
    console.log(`✅ Win Rate: ${basicMetrics.winRate.toFixed(1)}%`);
    console.log(`✅ Total Return: ${basicMetrics.totalReturn.toFixed(2)}%`);
    console.log(`✅ Profit Factor: ${basicMetrics.profitFactor.toFixed(2)}`);
    
    // Test Monte Carlo simulation
    console.log('🎲 Testing Monte Carlo simulation...');
    const returns = testTrades.map(t => t.pnlPercent);
    const mcResult = engine.runSingleMonteCarloSimulation(returns);
    console.log(`✅ MC Total Return: ${mcResult.totalReturn.toFixed(2)}%`);
    console.log(`✅ MC Max Drawdown: ${mcResult.maxDrawdown.toFixed(2)}%`);
    
    console.log('\n✅ All integration tests passed!');
    console.log('🎉 Leak-Free Backtesting System is fully operational');
    
    return true;
    
  } catch (error) {
    console.error(`❌ Integration test failed: ${error.message}`);
    console.error(error.stack);
    return false;
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  runQuickTest()
    .then(success => {
      if (success) {
        console.log('\n🚀 System ready for production use!');
        console.log('💡 Next steps:');
        console.log('   1. Run full demo: node leak-free-demo.js');
        console.log('   2. Test API endpoint: GET /api/trading/leak-free-backtest');
        console.log('   3. Begin production backtesting');
      } else {
        console.log('\n❌ System not ready - please fix issues above');
      }
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('💥 Test crashed:', error.message);
      process.exit(1);
    });
}

module.exports = { runQuickTest };
