/**
 * Simple Test Script for Watchlist Functionality
 * Tests the end-to-end watchlist system
 */

const { PrismaClient } = require('@prisma/client');
const WatchlistService = require('./src/services/watchlistService');

const prisma = new PrismaClient();

async function testWatchlistEndToEnd() {
  //console.log('🧪 Testing Watchlist End-to-End Functionality...\n');

  try {
    const watchlistService = new WatchlistService();

    // Test 1: Analyze a few stocks and see what happens
    //console.log('Test 1: Analyzing a few stocks to see their decisions...');
    const testSymbols = ['AAPL', 'TSLA', 'GOOGL', 'MSFT', 'ASHIANA.NS'];
    
    for (const symbol of testSymbols) {
      try {
        //console.log(`\n🔍 Analyzing ${symbol}...`);
        const result = await watchlistService.analyzeAndAddToWatchlist(symbol, false);
        //console.log(`   📊 ${symbol}: ${result.action} ${result.added ? '(ADDED TO WATCHLIST)' : result.updated ? '(UPDATED)' : '(NOT ADDED)'}`);
      } catch (error) {
        //console.log(`   ❌ ${symbol}: ERROR - ${error.message}`);
      }
    }

    // Test 2: Force add a stock with manual data (simulating a BUY signal)
    //console.log('\n\nTest 2: Manually adding a stock with BUY signal...');
    const mockStockData = {
      symbol: 'TEST_BUY',
      currentPrice: 100.50,
      currency: 'USD',
      market: 'US',
      decisionAction: 'BUY',
      decisionConfidence: 0.85,
      decisionGrade: 'A-',
      decisionReasoning: 'Strong momentum with system agreement',
      systemsAgreement: 'FULL',
      systemsAnalyzed: 5,
      executionData: JSON.stringify({
        entry: 100.50,
        stop: 95.00,
        target1: 110.00,
        target2: 115.00,
        riskReward: 1.73
      }),
      systemsData: JSON.stringify({
        elderTripleScreen: { decision: 'BUY', confidence: 0.8, grade: 'A-' },
        minerviniSEPA: { decision: 'BUY', confidence: 0.9, grade: 'A' }
      }),
      status: 'ACTIVE',
      priority: 3,
      nextStepSummary: 'Consider entering position on next dip',
      addedAt: new Date(),
      lastAnalyzedAt: new Date()
    };

    const manualStock = await prisma.watchlistStock.create({
      data: mockStockData
    });
    //console.log(`✅ Manually added ${manualStock.symbol} to watchlist`);

    // Test 3: Add a WATCH signal stock
    //console.log('\nTest 3: Manually adding a stock with WATCH signal...');
    const mockWatchData = {
      symbol: 'TEST_WATCH',
      currentPrice: 75.25,
      currency: 'USD',
      market: 'US',
      decisionAction: 'WATCH',
      decisionConfidence: 0.70,
      decisionGrade: 'B+',
      decisionReasoning: 'Setup forming, wait for confirmation',
      systemsAgreement: 'PARTIAL',
      systemsAnalyzed: 5,
      executionData: JSON.stringify({
        entry: 75.25,
        stop: 71.00,
        target1: 82.00,
        riskReward: 1.59
      }),
      systemsData: JSON.stringify({
        elderTripleScreen: { decision: 'WATCH', confidence: 0.7, grade: 'B+' },
        minerviniSEPA: { decision: 'HOLD', confidence: 0.6, grade: 'B' }
      }),
      status: 'ACTIVE',
      priority: 2,
      nextStepSummary: 'Monitor for breakout above resistance',
      addedAt: new Date(),
      lastAnalyzedAt: new Date()
    };

    const watchStock = await prisma.watchlistStock.create({
      data: mockWatchData
    });
    //console.log(`✅ Manually added ${watchStock.symbol} to watchlist`);

    // Test 4: Test API endpoints
    //console.log('\n\nTest 4: Testing API endpoints with curl commands...');
    //console.log('Run these commands to test the API:');
    //console.log('');
    //console.log('1. Get all watchlist stocks:');
    //console.log('   curl http://localhost:8000/api/watchlist');
    //console.log('');
    //console.log('2. Get watchlist stats:');
    //console.log('   curl http://localhost:8000/api/watchlist/stats');
    //console.log('');
    //console.log('3. Get stocks by grade:');
    //console.log('   curl http://localhost:8000/api/watchlist/by-grade');
    //console.log('');
    //console.log('4. Filter BUY signals only:');
    //console.log('   curl "http://localhost:8000/api/watchlist?action=BUY"');
    //console.log('');
    //console.log('5. Filter WATCH signals only:');
    //console.log('   curl "http://localhost:8000/api/watchlist?action=WATCH"');
    //console.log('');
    //console.log('6. Get specific stock details:');
    //console.log('   curl http://localhost:8000/api/watchlist/TEST_BUY');

    // Test 5: Check what's in the watchlist now
    //console.log('\n\nTest 5: Current watchlist summary...');
    const totalStocks = await prisma.watchlistStock.count();
    const buyStocks = await prisma.watchlistStock.count({ where: { decisionAction: 'BUY' } });
    const watchStocks = await prisma.watchlistStock.count({ where: { decisionAction: 'WATCH' } });
    
    //console.log(`📊 Total stocks in watchlist: ${totalStocks}`);
    //console.log(`🎯 BUY signals: ${buyStocks}`);
    //console.log(`👀 WATCH signals: ${watchStocks}`);

    if (totalStocks > 0) {
      const sampleStocks = await prisma.watchlistStock.findMany({
        take: 5,
        orderBy: { addedAt: 'desc' },
        select: {
          symbol: true,
          decisionAction: true,
          decisionGrade: true,
          decisionConfidence: true,
          currentPrice: true
        }
      });

      //console.log('\n📋 Recent watchlist entries:');
      sampleStocks.forEach(stock => {
        //console.log(`   ${stock.symbol}: ${stock.decisionAction} (${stock.decisionGrade}) - $${stock.currentPrice} (${Math.round(stock.decisionConfidence * 100)}%)`);
      });
    }

    //console.log('\n✅ Watchlist testing completed successfully!');
    //console.log('💡 Next step: Use the curl commands above to test the API endpoints');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testWatchlistEndToEnd().catch(console.error);
}

module.exports = testWatchlistEndToEnd;
