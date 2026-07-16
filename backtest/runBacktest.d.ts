export class IshastraBacktest {
    tradeSimulator: BacktestTradeSimulator;
    logger: BacktestLogger;
    prisma: PrismaClient<import(".prisma/client").Prisma.PrismaClientOptions, never, import(".prisma/client").Prisma.RejectOnNotFound | import(".prisma/client").Prisma.RejectPerOperation, import("@prisma/client/runtime").DefaultArgs>;
    signalController: TradingSystemController;
    system: MinerviniTemplateAdvanced;
    /**
     * Run simplified backtest for a single symbol
     * @param {string} symbol - Stock symbol to backtest
     * @returns {Object} Backtest results and statistics
     */
    runBacktest(symbol: string): any;
    /**
     * Simulate trades through historical data - PROPER BACKTESTING
     * @param {string} symbol - Stock symbol
     * @param {Array} historicalData - 5-year historical OHLCV data
     * @returns {Array} Array of trade results
     */
    simulateTradeFromSignal(symbol: string, historicalData: any[]): any[];
    /**
     * Simple momentum-based entry criteria (placeholder for full signal analysis)
     * @param {Array} lookbackData - Historical candles for analysis
     * @param {Object} currentCandle - Current candle to evaluate
     * @returns {boolean} Whether to enter trade
     */
    shouldEnterTradeAt(lookbackData: any[], currentCandle: any): boolean;
    /**
     * Save multiple trades to database in batch
     * @param {Array} trades - Array of trade results
     * @returns {Array} Array of saved trade records
     */
    saveTradesAtBatch(trades: any[]): any[];
    /**
     * Save individual trade to BacktestTrade table
     * @param {Object} trade - Trade result object
     * @returns {Object} Saved trade record
     */
    saveTrade(trade: any): any;
}
import { BacktestTradeSimulator } from "./engine/tradeSimulator";
import { BacktestLogger } from "./engine/logger";
import { PrismaClient } from ".prisma/client";
import { TradingSystemController } from "../src/controllers/signal-analysis.controller";
import MinerviniTemplateAdvanced = require("../src/systems/minervini-template-advanced");
//# sourceMappingURL=runBacktest.d.ts.map