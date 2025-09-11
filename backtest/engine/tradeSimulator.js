/**
 * 🎯 TRADE SIMULATOR FOR BACKTESTING
 * 
 * Simulates trade execution based on BUY signals
 * Implements exit conditions: STOP, TARGET, TIME (22 days max)
 * Calculates R-multiple for each trade
 */

class BacktestTradeSimulator {
  constructor() {
    this.maxHoldDays = 22; // Maximum holding period
  }

  /**
   * Simulate a trade based on signal and forward-looking price data
   * @param {Object} signal - BUY signal from signal generator
   * @param {Array} forwardCandles - Price data from entry date onwards
   * @param {string} currency - USD or INR for capital calculation
   * @returns {Object|null} Trade result or null if cannot execute
   */
  async simulateTrade(signal, forwardCandles, currency = 'USD') {
    try {
      // ✅ VALIDATE INPUTS
      if (!signal || !signal.execution) {
        console.log(`⚠️ No execution data in signal for ${signal?.symbol}`);
        return null;
      }

      if (!forwardCandles || forwardCandles.length < 2) {
        console.log(`⚠️ Insufficient forward candles for ${signal?.symbol}`);
        return null;
      }

      // ✅ EXTRACT TRADE PARAMETERS FROM SIGNAL
      const execution = signal.execution;
      const entryPrice = execution.entryStrategy?.entryZone?.optimal || signal.currentPrice;
      const stopLoss = execution.exitStrategy?.stopLoss?.initial || entryPrice * 0.93;
      const target = execution.exitStrategy?.targets?.moderate || entryPrice * 1.25;
      const shares = execution.positionSizing?.shares;

      // Log extracted values to verify dynamic changes
      console.log(`[${signal.symbol}] Entry: ${entryPrice}, Stop: ${stopLoss}, Target: ${target}, Shares: ${shares}`);

      // Validate required parameters
      if (!entryPrice || !stopLoss || !target || !shares) {
        console.log(`⚠️ Missing execution parameters for ${signal.symbol}:`, {
          entryPrice: !!entryPrice,
          stopLoss: !!stopLoss, 
          target: !!target,
          shares: !!shares
        });
        return null;
      }

      // ✅ DETERMINE CAPITAL BASED ON MARKET
      const capital = this.getCapitalByMarket(signal.symbol, currency);

      // ✅ SIMULATE TRADE EXECUTION
      const entryDate = new Date(forwardCandles[0].date);
      const tradeResult = this.executeTradeSimulation({
        symbol: signal.symbol,
        entryDate,
        entryPrice,
        stopLoss,
        target,
        shares,
        capital,
        forwardCandles: forwardCandles.slice(1), // Skip entry candle
        system: signal.winningSystem || 'minervini_template_advanced'
      });

      return tradeResult;

    } catch (error) {
      console.error(`❌ Trade simulation failed for ${signal?.symbol}:`, error.message);
      return null;
    }
  }

  /**
   * Execute the core trade simulation logic
   * @param {Object} tradeParams - Trade parameters
   * @returns {Object} Trade result with exit details
   */
  executeTradeSimulation(tradeParams) {
    const {
      symbol,
      entryDate,
      entryPrice,
      stopLoss,
      target,
      shares,
      capital,
      forwardCandles,
      system
    } = tradeParams;

    let exitDate = null;
    let exitPrice = null;
    let exitReason = null;
    let daysHeld = 0;

    // Track partial sells
    let scaledExitEvents = [];

    // ✅ SIMULATE DAILY PRICE ACTION
    let currentStop = stopLoss;

    for (let i = 0; i < forwardCandles.length && i < this.maxHoldDays; i++) {
      const candle = forwardCandles[i];
      daysHeld = i + 1;

      // Check for stop loss hit
      if (candle.low <= currentStop) {
        exitDate = new Date(candle.date);
        exitPrice = currentStop;
        exitReason = 'STOP';
        scaledExitEvents.push({
          date: new Date(candle.date),
          price: currentStop,
          shares: shares,
          reason: 'STOP'
        });
        break;
      }

      // Targets
      const target1 = target;
      const target2 = entryPrice + (target - entryPrice);
      const target3 = entryPrice + (target - entryPrice) * 1.5;

      // Sell 50% at Target 1
      if (candle.high >= target1 && !scaledExitEvents.find(e => e.reason === 'TARGET1')) {
        scaledExitEvents.push({
          date: new Date(candle.date),
          price: target1,
          shares: Math.floor(shares * 0.5),
          reason: 'TARGET1'
        });
        currentStop = target1 * 0.95; // Trail stop to 5% below T1
      }

      // Sell 33% at Target 2
      if (candle.high >= target2 && !scaledExitEvents.find(e => e.reason === 'TARGET2')) {
        scaledExitEvents.push({
          date: new Date(candle.date),
          price: target2,
          shares: Math.floor(shares * 0.33),
          reason: 'TARGET2'
        });
        currentStop = target2 * 0.95; // Trail stop to 5% below T2
      }

      // Sell remaining at or beyond Target 3
      const totalSold = scaledExitEvents.reduce((sum, e) => sum + e.shares, 0);
      if (candle.high >= target3 && totalSold < shares) {
        scaledExitEvents.push({
          date: new Date(candle.date),
          price: target3,
          shares: shares - totalSold,
          reason: 'TARGET3'
        });
        exitDate = new Date(candle.date);
        exitPrice = target3;
        exitReason = 'SCALED_OUT';
        break;
      }

      if (totalSold >= shares) {
        exitDate = scaledExitEvents[scaledExitEvents.length - 1].date;
        exitPrice = scaledExitEvents[scaledExitEvents.length - 1].price;
        exitReason = 'SCALED_OUT';
        break;
      }
    }

    // ✅ TIME EXIT if no stop/target hit within max hold period
    if (!exitDate) {
      const lastCandle = forwardCandles[Math.min(forwardCandles.length - 1, this.maxHoldDays - 1)];
      const remainingShares = shares - scaledExitEvents.reduce((sum, e) => sum + e.shares, 0);
      scaledExitEvents.push({
        date: new Date(lastCandle.date),
        price: lastCandle.close,
        shares: remainingShares,
        reason: 'TIME'
      });
      exitDate = new Date(lastCandle.date);
      exitPrice = lastCandle.close;
      exitReason = 'TIME';
      daysHeld = Math.min(forwardCandles.length, this.maxHoldDays);
    }

    // ✅ CALCULATE TRADE METRICS
    let totalPnL = 0;
    let weightedR = 0;
    scaledExitEvents.forEach(e => {
      const pnl = (e.price - entryPrice) * e.shares;
      totalPnL += pnl;
      const r = this.calculateRMultiple(entryPrice, e.price, stopLoss);
      weightedR += r * (e.shares / shares);
    });
    const pnlPercent = (totalPnL / (entryPrice * shares)) * 100;
    const rMultiple = weightedR;

    return {
      symbol,
      entryDate,
      exitDate,
      entryPrice: Number(entryPrice.toFixed(2)),
      exitPrice: Number(exitPrice.toFixed(2)),
      stopLoss: Number(stopLoss.toFixed(2)),
      target: Number(target.toFixed(2)),
      shares,
      daysHeld,
      reason: exitReason || 'TIME',
      RMultiple: Number(rMultiple.toFixed(2)),
      pnlAmount: Number(totalPnL.toFixed(2)),
      pnlPercent: Number(pnlPercent.toFixed(2)),
      system,
      capital,
      scaledExitEvents,
    };
  }

  /**
   * Calculate R-multiple for the trade
   * R-multiple = (Exit Price - Entry Price) / (Entry Price - Stop Loss)
   * @param {number} entryPrice - Entry price
   * @param {number} exitPrice - Exit price  
   * @param {number} stopLoss - Stop loss price
   * @returns {number} R-multiple
   */
  calculateRMultiple(entryPrice, exitPrice, stopLoss) {
    const risk = entryPrice - stopLoss;
    if (risk <= 0) {
      console.warn('⚠️ Invalid risk calculation: entry price <= stop loss');
      return 0;
    }
    
    const reward = exitPrice - entryPrice;
    return reward / risk;
  }

  /**
   * Get capital amount based on market (US vs India)
   * @param {string} symbol - Stock symbol
   * @param {string} currency - USD or INR
   * @returns {number} Capital amount
   */
  getCapitalByMarket(symbol, currency) {
    // India market (.NS suffix) uses INR, others use USD
    const isIndianMarket = symbol.includes('.NS');
    
    if (isIndianMarket) {
      return 10000000; // 1 Crore INR for Indian market
    } else {
      return 100000; // 100K USD for US market
    }
  }

  /**
   * Validate if trade setup is reasonable
   * @param {number} entryPrice - Entry price
   * @param {number} stopLoss - Stop loss price
   * @param {number} target - Target price
   * @returns {boolean} True if valid setup
   */
  validateTradeSetup(entryPrice, stopLoss, target) {
    // Entry price should be above stop loss
    if (entryPrice <= stopLoss) {
      return false;
    }
    
    // Target should be above entry price
    if (target <= entryPrice) {
      return false;
    }
    
    // Risk-reward ratio should be reasonable (target gain > stop loss)
    const risk = entryPrice - stopLoss;
    const reward = target - entryPrice;
    
    if (reward < risk * 0.5) { // At least 0.5:1 reward:risk
      return false;
    }
    
    return true;
  }
}

module.exports = { BacktestTradeSimulator };
