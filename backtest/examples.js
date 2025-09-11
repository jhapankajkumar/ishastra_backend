/**
 * 🚀 SIMPLE BACKTEST EXAMPLE
 * 
 * Demonstrates how to use the Ishastra backtesting system
 * This example shows different ways to run backtests
 */

const { IshastraBacktest } = require('./runBacktest');

async function runExamples() {
  console.log('🎯 Ishastra Backtest Examples\n');
  
  const backtest = new IshastraBacktest();
  
  try {
    // ✅ EXAMPLE 1: Simple single stock backtest
    console.log('📈 Example 1: Single Stock Backtest (AAPL)');
    console.log('='.repeat(50));
    
    const singleStockConfig = {
      symbols: ['AAPL'],
      startDate: '2019-01-01',
      endDate: '2019-12-31',
      currency: 'USD'
    };
    
    const result1 = await backtest.runBacktest(singleStockConfig);
    
    console.log(`📊 Results: ${result1.trades.length} trades executed`);
    if (result1.trades.length > 0) {
      console.log(`💰 Win Rate: ${result1.summary.winRate}%`);
      console.log(`📈 Avg R-Multiple: ${result1.summary.avgRMultiple}R`);
    }
    console.log(`⏱️ Duration: ${result1.duration}s\n`);
    
    // ✅ EXAMPLE 2: Multiple stocks
    console.log('📈 Example 2: Multiple Stocks Portfolio');
    console.log('='.repeat(50));
    
    const portfolioConfig = {
      symbols: ['AAPL', 'MSFT', 'GOOGL'],
      startDate: '2019-01-01', 
      endDate: '2019-06-30',
      currency: 'USD'
    };
    
    const result2 = await backtest.runBacktest(portfolioConfig);
    
    console.log(`📊 Portfolio Results: ${result2.trades.length} total trades`);
    if (result2.trades.length > 0) {
      console.log(`💰 Portfolio Win Rate: ${result2.summary.winRate}%`);
      console.log(`📈 Portfolio Avg R-Multiple: ${result2.summary.avgRMultiple}R`);
      
      // Show breakdown by symbol
      const tradesBySymbol = {};
      result2.trades.forEach(trade => {
        tradesBySymbol[trade.symbol] = (tradesBySymbol[trade.symbol] || 0) + 1;
      });
      
      console.log('📋 Trades by Symbol:');
      Object.entries(tradesBySymbol).forEach(([symbol, count]) => {
        console.log(`   ${symbol}: ${count} trades`);
      });
    }
    console.log(`⏱️ Duration: ${result2.duration}s\n`);
    
    // ✅ EXAMPLE 3: Show configuration options
    console.log('⚙️ Example 3: Advanced Configuration');
    console.log('='.repeat(50));
    
    const advancedConfig = {
      symbols: ['AAPL'],
      startDate: '2019-01-01',
      endDate: '2019-03-31', 
      currency: 'USD',
      systems: ['minervini_template_advanced'],
      maxSymbols: 10,
      skipWeekends: true
    };
    
    console.log('Configuration used:');
    console.log(JSON.stringify(advancedConfig, null, 2));
    
    const result3 = await backtest.runBacktest(advancedConfig);
    console.log(`📊 Advanced Results: ${result3.trades.length} trades\n`);
    
    // ✅ EXAMPLE 4: Error handling
    console.log('🚨 Example 4: Error Handling');
    console.log('='.repeat(50));
    
    try {
      const badConfig = {
        symbols: ['NONEXISTENT_STOCK'],
        startDate: '2019-01-01',
        endDate: '2019-03-31'
      };
      
      const result4 = await backtest.runBacktest(badConfig);
      console.log(`📊 Error handling test: ${result4.errors?.length || 0} errors encountered`);
      
      if (result4.errors && result4.errors.length > 0) {
        console.log('❌ Errors:');
        result4.errors.forEach(error => {
          console.log(`   ${error.symbol}: ${error.error}`);
        });
      }
      
    } catch (error) {
      console.log(`❌ Caught expected error: ${error.message}`);
    }
    
    console.log('\n🎉 All examples completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('1. Add more historical data files to /data/candles/');
    console.log('2. Extend date ranges for longer backtests');
    console.log('3. Analyze results in the database using SQL queries');
    console.log('4. Export results to CSV for further analysis');
    
  } catch (error) {
    console.error('💥 Example failed:', error.message);
  }
}

// Helper function to show how to query backtest results from database
async function queryBacktestResults() {
  console.log('\n📊 Database Query Examples');
  console.log('='.repeat(50));
  
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();
  
  try {
    // Get total trades
    const totalTrades = await prisma.backtestTrade.count();
    console.log(`📈 Total trades in database: ${totalTrades}`);
    
    // Get win rate
    const winningTrades = await prisma.backtestTrade.count({
      where: { RMultiple: { gt: 0 } }
    });
    const winRate = totalTrades > 0 ? ((winningTrades / totalTrades) * 100).toFixed(1) : 0;
    console.log(`💰 Overall win rate: ${winRate}%`);
    
    // Get best and worst trades
    const bestTrade = await prisma.backtestTrade.findFirst({
      orderBy: { RMultiple: 'desc' }
    });
    const worstTrade = await prisma.backtestTrade.findFirst({
      orderBy: { RMultiple: 'asc' }
    });
    
    if (bestTrade) {
      console.log(`🎯 Best trade: ${bestTrade.symbol} (${bestTrade.RMultiple}R)`);
    }
    if (worstTrade) {
      console.log(`📉 Worst trade: ${worstTrade.symbol} (${worstTrade.RMultiple}R)`);
    }
    
    // Get trades by exit reason
    const exitReasons = await prisma.backtestTrade.groupBy({
      by: ['reason'],
      _count: { reason: true }
    });
    
    console.log('\n🎲 Exit reasons:');
    exitReasons.forEach(reason => {
      console.log(`   ${reason.reason}: ${reason._count.reason} trades`);
    });
    
  } catch (error) {
    console.log(`❌ Database query error: ${error.message}`);
  } finally {
    await prisma.$disconnect();
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples()
    .then(() => queryBacktestResults())
    .catch(console.error);
}

module.exports = { runExamples, queryBacktestResults };
