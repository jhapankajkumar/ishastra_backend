const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getAllStocks } = require('./utils/stockList');
const { calculateWatchlistScore, rankWatchlistCandidates } = require('./utils/systemConstants');

/**
 * Watchlist Update Cron Job
 * Runs Tuesday to Saturday at 9:00 AM Singapore Time
 * Updates existing watchlist based on latest signal analysis
 */

class WatchlistUpdateCron {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the cron job
   */
  start() {
    // Singapore Time: Tuesday to Saturday at 9:00 AM
    // Cron format: second minute hour day-of-month month day-of-week
    // Day-of-week: 2-6 (Tuesday to Saturday)
    const cronSchedule = '0 0 9 * * 2-6'; // 9:00 AM, Tuesday to Saturday
    
    cron.schedule(cronSchedule, async () => {
      if (this.isRunning) {
        console.log('⏳ Watchlist update already running, skipping...');
        return;
      }

      try {
        this.isRunning = true;
        console.log('🕘 Starting scheduled watchlist update - Singapore Time 9:00 AM');
        await this.updateWatchlist();
        console.log('✅ Scheduled watchlist update completed');
      } catch (error) {
        console.error('❌ Scheduled watchlist update failed:', error);
      } finally {
        this.isRunning = false;
      }
    }, {
      scheduled: true,
      timezone: "Asia/Singapore"
    });

    console.log('📅 Watchlist update cron job started - Running Tuesday to Saturday at 9:00 AM Singapore Time');
  }

  /**
   * Main watchlist update logic
   */
  async updateWatchlist() {
    console.log('🔄 Starting watchlist update process...');

    // Step 1: Get current watchlist
    const currentWatchlist = await prisma.watchlistStock.findMany({
      where: { status: 'ACTIVE' }
    });

    console.log(`📊 Current watchlist: ${currentWatchlist.length} stocks`);

    // Step 2: Get fresh analysis for current watchlist symbols
    const currentSymbols = currentWatchlist.map(stock => stock.symbol);
    const analysisResults = await this.analyzeSymbols(currentSymbols);

    // Step 3: Process updates and removals
    const updateSummary = {
      analyzed: currentSymbols.length,
      updated: 0,
      removed: 0,
      added: 0,
      errors: []
    };

    for (const stock of currentWatchlist) {
      try {
        const analysis = analysisResults.find(r => r.symbol === stock.symbol);
        
        if (!analysis) {
          console.log(`⚠️ No analysis found for ${stock.symbol}, keeping unchanged`);
          continue;
        }

        const newAction = analysis.decision.action;
        const currentAction = stock.decisionAction;

        // Decision logic based on your requirements:
        if (currentAction === 'BUY' && newAction === 'WATCH') {
          // BUY -> WATCH: Update
          await this.updateStockInWatchlist(stock, analysis);
          updateSummary.updated++;
          console.log(`🔄 Updated ${stock.symbol}: BUY -> WATCH`);

        } else if (currentAction === 'WATCH' && newAction !== 'WATCH' && newAction !== 'BUY') {
          // WATCH -> anything else: Remove
          await this.removeStockFromWatchlist(stock.symbol);
          updateSummary.removed++;
          console.log(`🗑️ Removed ${stock.symbol}: WATCH -> ${newAction}`);

        } else if ((newAction === 'BUY' || newAction === 'WATCH') && 
                   (currentAction === 'BUY' || currentAction === 'WATCH')) {
          // BUY/WATCH -> BUY/WATCH: Update with latest data
          await this.updateStockInWatchlist(stock, analysis);
          updateSummary.updated++;
          console.log(`📈 Updated ${stock.symbol}: ${currentAction} -> ${newAction}`);

        } else if (newAction !== 'BUY' && newAction !== 'WATCH') {
          // Any action -> not BUY/WATCH: Remove
          await this.removeStockFromWatchlist(stock.symbol);
          updateSummary.removed++;
          console.log(`🗑️ Removed ${stock.symbol}: ${currentAction} -> ${newAction}`);
        }

      } catch (error) {
        console.error(`❌ Error processing ${stock.symbol}:`, error.message);
        updateSummary.errors.push({
          symbol: stock.symbol,
          error: error.message
        });
      }
    }

    // Step 4: Look for new opportunities from the full stock list
    await this.findNewOpportunities(updateSummary);

    console.log('📋 Watchlist update summary:', updateSummary);
    return updateSummary;
  }

  /**
   * Analyze symbols for fresh signal data
   */
  async analyzeSymbols(symbols) {
    console.log(`🔍 Analyzing ${symbols.length} symbols for updates...`);
    
    const results = [];
    const batchSize = 10; // Process in batches to avoid rate limits
    
    for (let i = 0; i < symbols.length; i += batchSize) {
      const batch = symbols.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          const http = require('http');
          
          const analysisResult = await new Promise((resolve, reject) => {
            const options = {
              hostname: 'localhost',
              port: 8000,
              path: `/api/trading/signal-analysis?symbols=${symbol}`,
              method: 'GET',
              headers: { 'Content-Type': 'application/json' }
            };

            const req = http.request(options, (res) => {
              let data = '';
              res.on('data', (chunk) => { data += chunk; });
              res.on('end', () => {
                try {
                  resolve(JSON.parse(data));
                } catch (error) {
                  reject(new Error(`Invalid JSON response: ${data}`));
                }
              });
            });

            req.on('error', (error) => reject(error));
            req.end();
          });

          if (analysisResult.success && analysisResult.results?.[0]) {
            return analysisResult.results[0];
          }
          return null;

        } catch (error) {
          console.error(`❌ Analysis failed for ${symbol}:`, error.message);
          return null;
        }
      });

      const batchResults = await Promise.allSettled(batchPromises);
      batchResults.forEach((result) => {
        if (result.status === 'fulfilled' && result.value) {
          results.push(result.value);
        }
      });

      // Add delay between batches
      if (i + batchSize < symbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return results;
  }

  /**
   * Update existing stock in watchlist with new analysis
   */
  async updateStockInWatchlist(existingStock, newAnalysis) {
    const confidenceDecimal = newAnalysis.decision.confidence > 1 ? 
      newAnalysis.decision.confidence / 100 : newAnalysis.decision.confidence;

    await prisma.watchlistStock.update({
      where: { id: existingStock.id },
      data: {
        currentPrice: newAnalysis.currentPrice,
        decisionAction: newAnalysis.decision.action,
        decisionConfidence: confidenceDecimal,
        decisionGrade: newAnalysis.decision.grade,
        decisionReasoning: newAnalysis.decision.reasoning,
        systemsAgreement: newAnalysis.decision.systemsAgreement,
        systemsAnalyzed: newAnalysis.decision.systemsAnalyzed || 0,
        
        executionData: JSON.stringify({
          entry: newAnalysis.execution.entry,
          stop: newAnalysis.execution.stop,
          riskReward: newAnalysis.execution.riskReward,
          target1: newAnalysis.execution.target1,
          target2: newAnalysis.execution.target2,
          positionSize: newAnalysis.execution.positionSize
        }),
        
        systemsData: JSON.stringify(newAnalysis.systems),
        lastAnalyzedAt: new Date(),
        updatedAt: new Date()
      }
    });
  }

  /**
   * Remove stock from watchlist
   */
  async removeStockFromWatchlist(symbol) {
    await prisma.watchlistStock.delete({
      where: { symbol }
    });
  }

  /**
   * Find new opportunities and add them to watchlist
   */
  async findNewOpportunities(updateSummary) {
    console.log('🔍 Scanning for new opportunities...');
    
    try {
      // Get current watchlist symbols to avoid duplicates
      const currentSymbols = await prisma.watchlistStock.findMany({
        where: { status: 'ACTIVE' },
        select: { symbol: true }
      });
      const existingSymbols = new Set(currentSymbols.map(s => s.symbol));

      // Get a sample of stocks to analyze for new opportunities (limit to avoid overload)
      const allStocks = getAllStocks();
      const symbolsToCheck = allStocks
        .filter(symbol => !existingSymbols.has(symbol))
        .slice(0, 50); // Check 50 new symbols each run

      if (symbolsToCheck.length === 0) {
        console.log('ℹ️ No new symbols to check');
        return;
      }

      console.log(`🔍 Checking ${symbolsToCheck.length} new symbols for opportunities...`);
      
      const newAnalyses = await this.analyzeSymbols(symbolsToCheck);
      const newCandidates = newAnalyses.filter(analysis => 
        analysis && (analysis.decision.action === 'BUY' || analysis.decision.action === 'WATCH')
      );

      if (newCandidates.length === 0) {
        console.log('ℹ️ No new BUY/WATCH opportunities found');
        return;
      }

      // Apply professional ranking to new candidates
      const maxNewStocks = 5; // Limit new additions per run
      const rankedNewStocks = rankWatchlistCandidates(newCandidates, maxNewStocks);

      // Add new stocks to watchlist
      for (const stock of rankedNewStocks) {
        try {
          const confidenceDecimal = stock.decision.confidence > 1 ? 
            stock.decision.confidence / 100 : stock.decision.confidence;

          await prisma.watchlistStock.create({
            data: {
              symbol: stock.symbol,
              currentPrice: stock.currentPrice,
              decisionAction: stock.decision.action,
              decisionConfidence: confidenceDecimal,
              decisionGrade: stock.decision.grade,
              decisionReasoning: stock.decision.reasoning,
              systemsAgreement: stock.decision.systemsAgreement,
              systemsAnalyzed: stock.decision.systemsAnalyzed || 0,
              
              executionData: JSON.stringify({
                entry: stock.execution.entry,
                stop: stock.execution.stop,
                riskReward: stock.execution.riskReward,
                target1: stock.execution.target1,
                target2: stock.execution.target2,
                positionSize: stock.execution.positionSize
              }),
              
              systemsData: JSON.stringify(stock.systems),
              status: 'ACTIVE',
              priority: stock.priority_tier || 2,
              nextStepSummary: stock.nextStepSummary || `Execute ${stock.decision.action} order`,
              market: 'US',
              currency: 'USD',
              addedAt: new Date(),
              lastAnalyzedAt: new Date()
            }
          });

          updateSummary.added++;
          console.log(`➕ Added new opportunity: ${stock.symbol} (${stock.decision.action})`);

        } catch (error) {
          console.error(`❌ Error adding ${stock.symbol}:`, error.message);
        }
      }

    } catch (error) {
      console.error('❌ Error finding new opportunities:', error.message);
      updateSummary.errors.push({
        operation: 'new_opportunities',
        error: error.message
      });
    }
  }

  /**
   * Manual trigger for testing
   */
  async runNow() {
    if (this.isRunning) {
      console.log('⏳ Update already running...');
      return;
    }

    try {
      this.isRunning = true;
      console.log('🔄 Manual watchlist update triggered');
      const result = await this.updateWatchlist();
      console.log('✅ Manual update completed');
      return result;
    } catch (error) {
      console.error('❌ Manual update failed:', error);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }
}

// Create and export the cron instance
const watchlistCron = new WatchlistUpdateCron();

module.exports = {
  WatchlistUpdateCron,
  watchlistCron
};
