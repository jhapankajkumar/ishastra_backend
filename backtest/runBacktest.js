/**
 * 🎯 MAIN BACKTEST RUNNER FOR ISHASTRA
 * 
 * Simplified backtesting process:
 * 1. Generate signal using real analysis system
 * 2. If BUY/STRONG_BUY, fetch 5-year historical data
 * 3. Simulate trades with proper exit conditions
 * 4. Save results to database
 * 5. Generate comprehensive reports
 */

const { BacktestTradeSimulator } = require('./engine/tradeSimulator');
const { BacktestLogger } = require('./engine/logger');
const { PrismaClient } = require('@prisma/client');
const { TradingSystemController } = require('../src/controllers/signal-analysis.controller');
const yahoo = require('../src/yahoo');
const { calculateBasicIndicators } = require('../src/utils/simpleTechnicalDataFetcher');
const MinerviniTemplateAdvanced = require('../src/systems/minervini-template-advanced');
const { Console } = require('console');
class IshastraBacktest {
    constructor() {
        this.tradeSimulator = new BacktestTradeSimulator();
        this.logger = new BacktestLogger();
        this.prisma = new PrismaClient();
        this.signalController = new TradingSystemController();
        this.system = new MinerviniTemplateAdvanced();
    }

    /**
     * Run simplified backtest for a single symbol
     * @param {string} symbol - Stock symbol to backtest
     * @returns {Object} Backtest results and statistics
     */
    async runBacktest(symbol) {
        const startTime = new Date();

        try {
            await this.logger.logProgress('🚀 Starting Ishastra Backtest');
            await this.logger.logProgress(`Symbol: ${symbol}`);

            // ✅ STEP 1: GENERATE SIGNAL FIRST
            await this.logger.logProgress('� Generating signal analysis...');
            // const signalAnalysis = await this.signalController.getStockAnalysis([symbol]);

            // if (!signalAnalysis.success || !signalAnalysis.results || signalAnalysis.results.length === 0) {
            //     throw new Error('Failed to generate signal analysis');
            // }

            // const result = signalAnalysis.results[0];
            // const decision = result.decision;

            // await this.logger.logProgress(`Signal: ${decision.action} (${decision.confidence}% confidence)`);

            // // ✅ STEP 2: CHECK IF BUY/STRONG_BUY SIGNAL
            // if (decision.action !== 'BUY' && decision.action !== 'STRONG_BUY') {
            //     await this.logger.logProgress(`⚠️ No BUY signal for ${symbol}, skipping backtest`);
            //     return {
            //         success: true,
            //         symbol,
            //         signal: decision,
            //         trades: [],
            //         message: 'No BUY signal - backtest skipped'
            //     };
            // }

            // ✅ STEP 3: FETCH 5-YEAR HISTORICAL DATA
            await this.logger.logProgress('📈 Fetching 5-year historical data...');
            const historicalData = await yahoo.getHistorical(symbol, '5y');

            if (!historicalData || historicalData.length < 100) {
                throw new Error(`Insufficient historical data for ${symbol}`);
            }

            await this.logger.logProgress(`Loaded ${historicalData.length} candles for backtesting`);
            // console.log(`First 5 candles:`, historicalData.slice(0, 504));

            // ✅ STEP 4: SIMULATE MULTIPLE TRADES THROUGH HISTORICAL DATA
            const allTrades = await this.simulateTradeFromSignal(symbol, historicalData);

            // ✅ STEP 5: SAVE TO DATABASE
            if (allTrades.length > 0) {
                await this.logger.logProgress('💾 Saving trade to database...');
                const savedTrades = await this.saveTradesAtBatch(allTrades);

                // ✅ GENERATE FINAL REPORT
                const summary = await this.logger.logSummary(allTrades, { symbol });

                const duration = Math.round((new Date() - startTime) / 1000);
                await this.logger.logProgress(`🏁 Backtest completed in ${duration}s`, 'SUCCESS');

                return {
                    success: true,
                    symbol,
                    signal: "Test",
                    trades: allTrades,
                    savedTrades,
                    summary,
                    duration
                };
            } else {
                await this.logger.logProgress('⚠️ No trades generated from simulation');
                return {
                    success: true,
                    symbol,
                    signal: "Test",
                    trades: [],
                    message: 'Signal found but no trades simulated'
                };
            }

        } catch (error) {
            await this.logger.logProgress(`💥 Backtest failed: ${error.message}`, 'ERROR');
            throw error;
        } finally {
            await this.prisma.$disconnect();
        }
    }

    /**
     * Simulate trades through historical data - PROPER BACKTESTING
     * @param {string} symbol - Stock symbol
     * @param {Array} historicalData - 5-year historical OHLCV data
     * @returns {Array} Array of trade results
     */
    async simulateTradeFromSignal(symbol, historicalData) {
        try {
            const allTrades = [];
            const currency = symbol.includes('.NS') ? 'INR' : 'USD';
            const minLookback = 252; // Need at least 252 candles for technical analysis
            const maxHoldDays = 22; // Maximum hold period per trade

            await this.logger.logProgress(`🔍 Scanning ${historicalData.length} candles for trading opportunities...`);

            let i = minLookback; // Start after we have enough lookback data
            let tradesFound = 0;

            while (i < historicalData.length - maxHoldDays) {
                // ✅ GET LOOKBACK DATA FOR SIGNAL GENERATION
                const lookbackData = historicalData.slice(i - minLookback, i);
                const currentCandle = historicalData[i];
                const currentPrice = currentCandle.close;
                // ✅ SIMULATE SIGNAL GENERATION AT THIS POINT IN TIME
                // For now, use a simple momentum-based entry criteria as proxy
                // In a full implementation, you'd run the actual signal analysis here
                const indicators = calculateBasicIndicators(lookbackData);

                const technicalData = {
                    symbol: symbol,
                    latestPrice: currentPrice,
                    // Historical data
                    historical: lookbackData,
                    // Basic indicators
                    indicators: indicators,
                };
                // const technicalData = { lookbackData, indicators };
                const remainingCapital = symbol.includes('.NS') ? 10000000 : 100000; // Placeholder for capital management
                // Initialize all trading systems
                const options = {
                    capital: remainingCapital,
                    symbol: symbol,
                    currentPrice: currentPrice,
                };

                const analysedSignal = this.system.analyze(technicalData, options);
                const simulatedSignal = {
                    symbol,
                    currentPrice: Number(currentPrice.toFixed(2)),
                    timestamp: new Date().toISOString(),

                    // SINGLE DECISION OBJECT - No Confusion
                    decision: {
                        action: analysedSignal.decision,
                        confidence: Number(analysedSignal.confidence?.toFixed(2)) || 0,
                        grade: analysedSignal.grade || 'C',
                        reasoning: analysedSignal.reasoning || 'Analysis complete',
                        systemsAgreement: 'FULL',
                        winningSystem: 'SEPA',
                        winningSystemId: 'minervini_template_advanced'
                    },
                    execution: analysedSignal.execution,
                };

                // Debug log for daily simulated decision and confidence
                const systemDecision = simulatedSignal?.decision;
                
                const shouldEnterTrade = systemDecision?.action === 'BUY' || systemDecision?.action === 'STRONG_BUY';

                if (shouldEnterTrade) {
                    // ✅ PREPARE FORWARD CANDLES FOR TRADE SIMULATION
                    const forwardCandles = historicalData.slice(i, i + maxHoldDays + 5);

                    if (forwardCandles.length >= 5) {
                        const entryPrice = currentCandle.close;
                        const execution = simulatedSignal?.execution;

                        const stopLoss = execution?.exitStrategy?.stopLoss?.initial || entryPrice * 0.93;
                        const target = execution?.exitStrategy?.targets?.moderate || entryPrice * 1.25;
                        const shares = execution?.positionSizing?.shares || Math.floor(5000 / entryPrice);

                        // const dynamicExecution = {
                        //     entryStrategy: {
                        //         entryZone: {
                        //             optimal: entryPrice
                        //         }
                        //     },
                        //     exitStrategy: {
                        //         type: 'TRAILING_STOP_TARGET',
                        //         stopLoss: {
                        //             initial: stopLoss
                        //         },
                        //         targets: {
                        //             moderate: target
                        //         },
                        //         maxHoldDays: 22,
                        //         trailingStopPercent: 7
                        //     },
                        //     positionSizing: {
                        //         shares: shares
                        //     }
                        // };

                        const signal = {
                            symbol: symbol,
                            currentPrice: entryPrice,
                            execution: execution,
                            winningSystem: systemDecision?.winningSystemId || 'minervini_template_advanced'
                        };

                        // ✅ SIMULATE THE TRADE
                        const tradeResult = await this.tradeSimulator.simulateTrade(
                            signal,
                            forwardCandles,
                            currency
                        );

                        if (tradeResult) {
                            allTrades.push(tradeResult);
                            tradesFound++;
                            await this.logger.logTrade(tradeResult);
                            await this.logger.logProgress(`✅ Trade #${tradesFound} simulated: ${tradeResult.reason} after ${tradeResult.daysHeld} days, R-multiple: ${tradeResult.RMultiple}`);

                            // ✅ SKIP AHEAD TO AVOID OVERLAPPING TRADES
                            i += Math.max(tradeResult.daysHeld || 1, 5); // Skip at least 5 days or trade duration
                        }
                    }
                }

                i++; // Move to next candle
            }

            await this.logger.logProgress(`🏁 Historical scan complete: Found ${tradesFound} trades from ${historicalData.length} candles`);
            return allTrades;

        } catch (error) {
            await this.logger.logProgress(`⚠️ Historical backtest failed for ${symbol}: ${error.message}`, 'WARN');
            return [];
        }
    }

    /**
     * Simple momentum-based entry criteria (placeholder for full signal analysis)
     * @param {Array} lookbackData - Historical candles for analysis
     * @param {Object} currentCandle - Current candle to evaluate
     * @returns {boolean} Whether to enter trade
     */
    async shouldEnterTradeAt(lookbackData, currentCandle) {
        if (!lookbackData || lookbackData.length < 20) return false;

        // ✅ SIMPLE MOMENTUM CRITERIA (placeholder)
        const recentCandles = lookbackData.slice(-10);
        const avgVolume = recentCandles.reduce((sum, c) => sum + c.volume, 0) / recentCandles.length;
        const priceChange = (currentCandle.close - lookbackData[lookbackData.length - 10].close) / lookbackData[lookbackData.length - 10].close;

        // Enter if: price up 5%+ in last 10 days AND volume above average
        return priceChange > 0.05 && currentCandle.volume > avgVolume * 1.2;
    }

    /**
     * Save multiple trades to database in batch
     * @param {Array} trades - Array of trade results
     * @returns {Array} Array of saved trade records
     */
    async saveTradesAtBatch(trades) {
        if (trades.length === 0) {
            return [];
        }

        try {
            const batchSize = 100;
            const savedTrades = [];

            for (let i = 0; i < trades.length; i += batchSize) {
                const batch = trades.slice(i, i + batchSize);

                const batchResults = await Promise.allSettled(
                    batch.map(trade => this.saveTrade(trade))
                );

                batchResults.forEach((result, index) => {
                    if (result.status === 'fulfilled') {
                        savedTrades.push(result.value);
                    } else {
                        const trade = batch[index];
                        this.logger.logProgress(
                            `Failed to save trade ${trade.symbol} ${trade.entryDate}: ${result.reason.message}`,
                            'ERROR'
                        );
                    }
                });
            }

            await this.logger.logProgress(`💾 Saved ${savedTrades.length}/${trades.length} trades to database`);
            return savedTrades;

        } catch (error) {
            await this.logger.logProgress(`❌ Batch save failed: ${error.message}`, 'ERROR');
            return [];
        }
    }

    /**
     * Save individual trade to BacktestTrade table
     * @param {Object} trade - Trade result object
     * @returns {Object} Saved trade record
     */
    async saveTrade(trade) {
        return await this.prisma.backtestTrade.create({
            data: {
                symbol: trade.symbol,
                entryDate: trade.entryDate,
                exitDate: trade.exitDate,
                entryPrice: trade.entryPrice,
                exitPrice: trade.exitPrice,
                stopLoss: trade.stopLoss,
                target: trade.target,
                reason: trade.reason,
                RMultiple: trade.RMultiple,
                system: trade.system
            }
        });
    }


}

/**
 * CLI Interface - Run backtest from command line
 */
async function runBacktestCLI() {
    const symbol = process.argv[2] || 'AAPL';

    console.log('🎯 Starting Ishastra Backtest CLI');
    console.log('Symbol:', symbol);

    const backtest = new IshastraBacktest();

    try {
        const results = await backtest.runBacktest(symbol);
        console.log('\n🎉 Backtest completed successfully!');
        console.log(`📊 Total trades: ${results.trades.length}`);
        if (results.summary) {
            console.log(`💰 Win rate: ${results.summary.winRate}%`);
            console.log(`📈 Avg R-multiple: ${results.summary.avgRMultiple}R`);
        }

    } catch (error) {
        console.error('💥 Backtest failed:', error.message);
        process.exit(1);
    }
}

// Run CLI if this file is executed directly
if (require.main === module) {
    runBacktestCLI();
}

module.exports = { IshastraBacktest };
