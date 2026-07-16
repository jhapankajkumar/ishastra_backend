/**
 * 🎯 TRADE SIMULATOR FOR BACKTESTING
 *
 * Simulates trade execution based on BUY signals
 * Implements exit conditions: STOP, TARGET, TIME (22 days max)
 * Calculates R-multiple for each trade
 */
export class BacktestTradeSimulator {
    maxHoldDays: number;
    /**
     * Simulate a trade based on signal and forward-looking price data
     * @param {Object} signal - BUY signal from signal generator
     * @param {Array} forwardCandles - Price data from entry date onwards
     * @param {string} currency - USD or INR for capital calculation
     * @returns {Object|null} Trade result or null if cannot execute
     */
    simulateTrade(signal: any, forwardCandles: any[], currency?: string): any | null;
    /**
     * Execute the core trade simulation logic
     * @param {Object} tradeParams - Trade parameters
     * @returns {Object} Trade result with exit details
     */
    executeTradeSimulation(tradeParams: any): any;
    /**
     * Calculate R-multiple for the trade
     * R-multiple = (Exit Price - Entry Price) / (Entry Price - Stop Loss)
     * @param {number} entryPrice - Entry price
     * @param {number} exitPrice - Exit price
     * @param {number} stopLoss - Stop loss price
     * @returns {number} R-multiple
     */
    calculateRMultiple(entryPrice: number, exitPrice: number, stopLoss: number): number;
    /**
     * Get capital amount based on market (US vs India)
     * @param {string} symbol - Stock symbol
     * @param {string} currency - USD or INR
     * @returns {number} Capital amount
     */
    getCapitalByMarket(symbol: string, currency: string): number;
    /**
     * Validate if trade setup is reasonable
     * @param {number} entryPrice - Entry price
     * @param {number} stopLoss - Stop loss price
     * @param {number} target - Target price
     * @returns {boolean} True if valid setup
     */
    validateTradeSetup(entryPrice: number, stopLoss: number, target: number): boolean;
}
//# sourceMappingURL=tradeSimulator.d.ts.map