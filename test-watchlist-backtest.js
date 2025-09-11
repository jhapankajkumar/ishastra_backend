/**
 * 🎯 WATCHLIST BACKTEST INTEGRATION TEST
 * 
 * This script:
 * 1. Gets all watchlist data from WatchlistService
 * 2. Filters for BUY and STRONG_BUY signals
 * 3. Runs backtest for each BUY signal
 * 4. Displays comprehensive results
 */

const WatchlistService = require('./src/services/watchlist.service');
const { IshastraBacktest } = require('./backtest/runBacktest');

class WatchlistBacktestTester {
    constructor() {
        this.watchlistService = new WatchlistService();
        this.backtester = new IshastraBacktest();
    }

    /**
     * Main test method - gets watchlist and runs backtests for BUY signals
     */
    async runTest() {
        console.log('🚀 STARTING WATCHLIST BACKTEST INTEGRATION TEST');
        console.log('=' .repeat(60));

        try {
            // Step 1: Get current watchlist
            console.log('📋 Step 1: Fetching current watchlist...');
            const watchlist = await this.watchlistService.getWatchlist();
            console.log(`📊 Total watchlist stocks: ${watchlist.length}`);

            if (watchlist.length === 0) {
                console.log('⚠️  No stocks in watchlist. Run daily scan first.');
                return;
            }

            // Step 2: Filter for BUY signals (BUY and STRONG_BUY)
            const buySignals = watchlist.filter(stock => {
                const action = stock.decision?.action;
                return action === 'BUY' || action === 'STRONG_BUY';
            });

            console.log(`🎯 Found ${buySignals.length} BUY/STRONG_BUY signals`);
            
            if (buySignals.length === 0) {
                console.log('⚠️  No BUY signals in watchlist.');
                console.log('📝 Watchlist breakdown:');
                const breakdown = this.getWatchlistBreakdown(watchlist);
                console.table(breakdown);
                return;
            }

            // Step 3: Display BUY signals before testing
            console.log('\n🔍 BUY SIGNALS TO BACKTEST:');
            console.log('-' .repeat(80));
            buySignals.forEach((stock, index) => {
                console.log(`${index + 1}. ${stock.symbol} - ${stock.decision.action} (${stock.decision.confidence}% confidence, Grade: ${stock.decision.grade || 'N/A'})`);
            });

            // Step 4: Run backtests for each BUY signal
            console.log('\n🔬 Step 4: Running backtests for BUY signals...');
            console.log('=' .repeat(60));

            const backtestResults = [];
            
            for (let i = 0; i < buySignals.length; i++) {
                const stock = buySignals[i];
                console.log(`\n📈 [${i + 1}/${buySignals.length}] Testing ${stock.symbol} (${stock.decision.action})...`);
                
                try {
                    // Run backtest using the IshastraBacktest class
                    const result = await this.backtester.runBacktest(stock.symbol);
                    
                    backtestResults.push({
                        symbol: stock.symbol,
                        action: stock.decision.action,
                        confidence: stock.decision.confidence,
                        grade: stock.decision.grade || 'N/A',
                        backtestResult: result,
                        success: true
                    });
                    
                    console.log(`✅ ${stock.symbol} backtest completed`);
                    
                } catch (error) {
                    console.error(`❌ ${stock.symbol} backtest failed:`, error.message);
                    
                    backtestResults.push({
                        symbol: stock.symbol,
                        action: stock.decision.action,
                        confidence: stock.decision.confidence,
                        grade: stock.decision.grade || 'N/A',
                        backtestResult: null,
                        error: error.message,
                        success: false
                    });
                }

                // Small delay between backtests to be nice to APIs
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            // Step 5: Display comprehensive results
            console.log('\n📊 BACKTEST RESULTS SUMMARY');
            console.log('=' .repeat(60));
            
            this.displayResults(backtestResults);

        } catch (error) {
            console.error('❌ Test failed:', error);
        }
    }

    /**
     * Get breakdown of watchlist by signal type
     */
    getWatchlistBreakdown(watchlist) {
        const breakdown = {};
        
        watchlist.forEach(stock => {
            const action = stock.decision?.action || 'UNKNOWN';
            if (!breakdown[action]) {
                breakdown[action] = 0;
            }
            breakdown[action]++;
        });

        return Object.entries(breakdown).map(([action, count]) => ({
            Action: action,
            Count: count,
            Percentage: `${((count / watchlist.length) * 100).toFixed(1)}%`
        }));
    }

    /**
     * Display comprehensive backtest results
     */
    displayResults(results) {
        const successful = results.filter(r => r.success);
        const failed = results.filter(r => !r.success);

        console.log(`✅ Successful backtests: ${successful.length}`);
        console.log(`❌ Failed backtests: ${failed.length}`);
        console.log(`📈 Total tests: ${results.length}`);

        if (successful.length > 0) {
            console.log('\n🏆 SUCCESSFUL BACKTEST DETAILS:');
            console.log('-' .repeat(80));
            
            successful.forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.symbol} (${result.action})`);
                console.log(`   Confidence: ${result.confidence}% | Grade: ${result.grade}`);
                
                if (result.backtestResult) {
                    console.log(`   Result: ${result.backtestResult.message || 'Backtest completed'}`);
                }
            });
        }

        if (failed.length > 0) {
            console.log('\n❌ FAILED BACKTEST DETAILS:');
            console.log('-' .repeat(80));
            
            failed.forEach((result, index) => {
                console.log(`\n${index + 1}. ${result.symbol} (${result.action})`);
                console.log(`   Confidence: ${result.confidence}% | Grade: ${result.grade}`);
                console.log(`   Error: ${result.error}`);
            });
        }

        // Performance statistics
        if (successful.length > 0) {
            console.log('\n📈 PERFORMANCE STATISTICS:');
            console.log('-' .repeat(40));
            
            const avgConfidence = successful.reduce((sum, r) => sum + r.confidence, 0) / successful.length;
            console.log(`Average confidence of successful backtests: ${avgConfidence.toFixed(1)}%`);
            
            const gradeDistribution = {};
            successful.forEach(r => {
                const grade = r.grade;
                gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
            });
            
            console.log('Grade distribution:');
            Object.entries(gradeDistribution).forEach(([grade, count]) => {
                console.log(`  ${grade}: ${count} stocks`);
            });
        }

        console.log('\n✅ WATCHLIST BACKTEST INTEGRATION TEST COMPLETE');
    }
}

// Run the test if this script is executed directly
if (require.main === module) {
    const tester = new WatchlistBacktestTester();
    tester.runTest()
        .then(() => {
            console.log('\n🎉 Test execution completed');
            process.exit(0);
        })
        .catch(error => {
            console.error('\n💥 Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = WatchlistBacktestTester;
