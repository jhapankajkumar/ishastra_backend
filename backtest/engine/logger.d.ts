export class BacktestLogger {
    constructor(logDir?: any);
    logDir: any;
    logFile: string;
    startTime: Date;
    tradeCount: number;
    /**
     * Initialize logging for a backtest session
     * @param {Object} config - Backtest configuration
     */
    initializeSession(config: any): Promise<void>;
    /**
     * Log backtest progress
     * @param {string} message - Progress message
     * @param {string} level - Log level (INFO, WARN, ERROR)
     */
    logProgress(message: string, level?: string): Promise<void>;
    /**
     * Log a completed trade
     * @param {Object} trade - Trade result object
     */
    logTrade(trade: any): Promise<void>;
    /**
     * Log signal that didn't result in a trade
     * @param {string} symbol - Stock symbol
     * @param {Date} date - Analysis date
     * @param {string} reason - Reason for skipping
     */
    logSkippedSignal(symbol: string, date: Date, reason: string): Promise<void>;
    /**
     * Log processing of a symbol
     * @param {string} symbol - Stock symbol being processed
     * @param {number} current - Current symbol number
     * @param {number} total - Total symbols to process
     */
    logSymbolProgress(symbol: string, current: number, total: number): Promise<void>;
    /**
     * Generate and log final backtest summary
     * @param {Array} allTrades - Array of all completed trades
     * @param {Object} config - Backtest configuration
     */
    logSummary(allTrades: any[], config: any): Promise<any>;
    /**
     * Generate statistical summary of trades
     * @param {Array} trades - Array of trade results
     * @returns {Object} Summary statistics
     */
    generateSummaryStats(trades: any[]): any;
    /**
     * Get icon for log level
     * @param {string} level - Log level
     * @returns {string} Icon/emoji
     */
    getLevelIcon(level: string): string;
}
//# sourceMappingURL=logger.d.ts.map