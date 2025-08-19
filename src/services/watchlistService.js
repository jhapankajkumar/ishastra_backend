const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { getAllStocks, getStockBatch } = require('../utils/stockList');

/**
 * WatchlistService - Service for managing automated watchlist population
 */
class WatchlistService {
  constructor() {
    // Use fetch for HTTP calls to the analysis API
  }

  /**
   * Populate watchlist from automated signal analysis of stocks
   */
  async populateWatchlistFromAnalysis(options = {}) {
    const {
      batchSize = 10,        // Process 10 stocks at a time to avoid rate limits
      delayBetweenBatches = 2000, // 2 second delay between batches
      overwriteExisting = false   // Whether to update existing watchlist entries
    } = options;

    const allStocks = getAllStocks().slice(0, 3); // Test with just 3 stocks
    
    console.log('🚀 Starting watchlist population from signal analysis...');
    console.log(`📊 Processing ${allStocks.length} stocks in batches of ${batchSize}`);

    const totalBatches = Math.ceil(allStocks.length / batchSize);
    let totalProcessed = 0;
    let totalAdded = 0;
    let totalUpdated = 0;
    let errors = [];

    for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
      const batch = getStockBatch(batchSize, batchNum);
      console.log(`\n🔄 Processing batch ${batchNum + 1}/${totalBatches} (${batch.length} stocks)`);

      // Process batch in parallel
      const batchPromises = batch.map(symbol => this.analyzeAndAddToWatchlist(symbol, overwriteExisting));
      
      try {
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach((result, index) => {
          totalProcessed++;
          if (result.status === 'fulfilled') {
            const { added, updated } = result.value;
            if (added) totalAdded++;
            if (updated) totalUpdated++;
          } else {
            const symbol = batch[index];
            errors.push({
              symbol,
              error: result.reason.message
            });
          }
        });

      } catch (error) {
        console.error(`❌ Batch ${batchNum + 1} failed:`, error);
        errors.push({
          batch: batchNum + 1,
          error: error.message
        });
      }

      // Add delay between batches to avoid rate limits
      if (batchNum < totalBatches - 1) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
      }
    }

    return {
      totalStocks: allStocks.length,
      processed: totalProcessed,
      added: totalAdded,
      updated: totalUpdated,
      errors: errors.length,
      errorDetails: errors
    };
  }

  /**
   * Analyze a single stock and add to watchlist if it meets criteria
   */
  async analyzeAndAddToWatchlist(symbol, overwriteExisting = false) {
    try {
      // Call the signal analysis API via HTTP (GET)
      const http = require('http');

      const analysisResult = await new Promise((resolve, reject) => {
        const options = {
          hostname: 'localhost',
          port: 8000,
          path: `/api/trading/signal-analysis?symbols=${symbol}`,
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        const req = http.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => {
            data += chunk;
          });
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error(`Invalid JSON response: ${data}`));
            }
          });
        });

        req.on('error', (error) => {
          reject(error);
        });

        req.end();
      });

      if (!analysisResult.results || analysisResult.results.length === 0) {
        console.log(`  ⚠️ No analysis results for ${symbol}`);
        return { action: 'NO_RESULTS', added: false, updated: false };
      }

      const stockResult = analysisResult.results[0];
      const decision = stockResult.decision;

      console.log(`  📊 ${symbol}: ${decision?.action} (${(decision?.confidence * 100).toFixed(1)}%)`);

      // Only add stocks with BUY, STRONG_BUY, or WATCH decisions
      if (!decision || !['BUY', 'STRONG_BUY', 'WATCH'].includes(decision.action)) {
        console.log(`    ⏭️ Skipping ${symbol}: ${decision?.action} (not BUY/STRONG_BUY/WATCH)`);
        return { action: decision?.action || 'UNKNOWN', added: false, updated: false };
      }

      console.log(`    ✅ ${symbol} qualifies for watchlist: ${decision.action}`);

      // Check if stock already exists
      const existingStock = await prisma.watchlistStock.findUnique({
        where: { symbol }
      });

      if (existingStock && !overwriteExisting) {
        console.log(`    📝 ${symbol} already in watchlist, skipping`);
        return { action: decision.action, added: false, updated: false };
      }

      // Prepare watchlist data
      const watchlistData = this.formatForWatchlist(stockResult);

      if (existingStock) {
        // Update existing entry
        console.log(`    🔄 Updating ${symbol} in watchlist`);
        await prisma.watchlistStock.update({
          where: { symbol },
          data: {
            ...watchlistData,
            updatedAt: new Date()
          }
        });
        return { action: decision.action, added: false, updated: true };
      } else {
        // Create new entry
        console.log(`    ➕ Adding ${symbol} to watchlist`);
        await prisma.watchlistStock.create({
          data: watchlistData
        });
        return { action: decision.action, added: true, updated: false };
      }

    } catch (error) {
      console.error(`❌ Error analyzing ${symbol}:`, error.message);
      throw error;
    }
  }

  /**
   * Format signal analysis result for watchlist storage with enhanced structure
   */
  formatForWatchlist(stockResult) {
    const { symbol, currentPrice, decision, execution, systems, context, scenarios, risk, nextStepSummary, timestamp } = stockResult;

    // Determine market (US vs Indian) based on symbol
    const market = symbol.includes('.NS') || symbol.includes('.BO') ? 'IN' : 'US';
    const currency = market === 'IN' ? 'INR' : 'USD';

    // Calculate priority based on confidence and grade
    let priority = 3; // Default to low priority
    if (decision.confidence >= 0.8) priority = 1; // High confidence
    else if (decision.confidence >= 0.6) priority = 2; // Medium confidence

    // Enhanced execution data structure
    const executionData = {
      entry: execution?.entry || currentPrice,
      stopLoss: execution?.stopLoss,
      target1: execution?.target1,
      target2: execution?.target2,
      riskReward: execution?.riskReward || 0,
      positionSize: execution?.positionSize || {
        shares: 0,
        value: 0,
        risk: "0%",
        riskPerShare: 0
      },
      exitStrategy: execution?.exitStrategy || {
        exitConditions: []
      }
    };

    // Enhanced systems data with formation dates and latest structure
    const systemsData = {
      // Include all systems with their enhanced data
      systems: systems || {},
      
      // Add context information
      context: context || {},
      
      // Add scenarios
      scenarios: scenarios || {},
      
      // Add risk information
      risk: risk || {},
      
      // Formation dates summary (extract from MACD if available)
      formationDates: systems?.macdDivergence?.formationDates || null,
      
      // Analysis metadata
      analysisTimestamp: timestamp,
      systemsAnalyzed: decision.systemsAnalyzed || 0,
      systemsAgreement: decision.systemsAgreement || 'UNKNOWN'
    };

    return {
      symbol,
      currentPrice: currentPrice || execution?.entry || 0,
      currency,
      market,
      
      // Decision data with enhanced reasoning
      decisionAction: decision.action,
      decisionConfidence: decision.confidence,
      decisionGrade: decision.grade || 'C',
      decisionReasoning: Array.isArray(decision.reasoning) 
        ? decision.reasoning.join('; ') 
        : (decision.reasoning || 'Analysis complete'),
      systemsAgreement: decision.systemsAgreement || 'UNKNOWN',
      systemsAnalyzed: decision.systemsAnalyzed || 0,
      
      // Enhanced execution data with latest structure
      executionData: JSON.stringify(executionData),
      
      // Enhanced systems data with formation dates and context
      systemsData: JSON.stringify(systemsData),
      
      priority,
      status: 'ACTIVE',
      nextStepSummary: nextStepSummary || `Execute ${decision.action} order`,
      addedAt: new Date(),
      lastAnalyzedAt: new Date()
    };
  }
}

module.exports = WatchlistService;
