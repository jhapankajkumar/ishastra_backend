/**
 * Test Watchlist Functionality
 * This script tests the basic watchlist operations
 */

const { PrismaClient } = require('@prisma/client');
const WatchlistService = require('./src/services/watchlistService');

const prisma = new PrismaClient();

async function testWatchlist() {
  //console.log('🧪 Testing Watchlist Functionality...\n');

  try {
    // Test 1: Analyze and add a single stock
    //console.log('Test 1: Analyzing a single stock (AAPL)...');
    const watchlistService = new WatchlistService();
    
    const result = await watchlistService.analyzeAndAddToWatchlist('AAPL', false);
    //console.log('✅ Result:', result);

    // Test 2: Check if stock was added to database
    //console.log('\nTest 2: Checking database for AAPL...');
    const aaplStock = await prisma.watchlistStock.findUnique({
      where: { symbol: 'AAPL' }
    });
    
    if (aaplStock) {
      //console.log('✅ AAPL found in watchlist:');
      //console.log(`   Action: ${aaplStock.decisionAction}`);
      //console.log(`   Confidence: ${aaplStock.decisionConfidence}`);
      //console.log(`   Grade: ${aaplStock.decisionGrade}`);
      //console.log(`   Price: ${aaplStock.currentPrice}`);
    } else {
      //console.log('❌ AAPL not found in watchlist (might not qualify)');
    }

    // Test 3: Get watchlist stats
    //console.log('\nTest 3: Getting watchlist statistics...');
    const stats = await watchlistService.getWatchlistStats();
    //console.log('✅ Watchlist Stats:', JSON.stringify(stats, null, 2));

    // Test 4: Analyze a few more stocks
    //console.log('\nTest 4: Analyzing a few more stocks...');
    const testSymbols = ['MSFT', 'TSLA', 'ASHIANA.NS'];
    
    for (const symbol of testSymbols) {
      try {
        const result = await watchlistService.analyzeAndAddToWatchlist(symbol, false);
        //console.log(`   ${symbol}: ${result.action} ${result.added ? '(ADDED)' : result.updated ? '(UPDATED)' : '(SKIPPED)'}`);
      } catch (error) {
        //console.log(`   ${symbol}: ERROR - ${error.message}`);
      }
    }

    // Test 5: Get final stats
    //console.log('\nTest 5: Final watchlist count...');
    const finalCount = await prisma.watchlistStock.count();
    //console.log(`✅ Total stocks in watchlist: ${finalCount}`);

    // Test 6: Show a sample of what's in the watchlist
    //console.log('\nTest 6: Sample watchlist entries...');
    const sampleStocks = await prisma.watchlistStock.findMany({
      take: 5,
      orderBy: { addedAt: 'desc' }
    });
    
    sampleStocks.forEach(stock => {
      //console.log(`   ${stock.symbol}: ${stock.decisionAction} (${stock.decisionGrade}) - $${stock.currentPrice}`);
    });

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
if (require.main === module) {
  testWatchlist().catch(console.error);
}

module.exports = testWatchlist;
