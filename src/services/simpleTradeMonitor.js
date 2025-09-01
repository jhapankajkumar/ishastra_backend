/**
 * SIMPLE Trade Monitor - BRUTAL SIMPLICITY
 * 
 * NO daily analysis changes
 * NO health scores that confuse you
 * NO AI second-guessing your entry system
 * 
 * ONLY 3 things matter after you enter:
 * 1. Did stop loss get hit? → EXIT
 * 2. Hit profit targets? → TAKE PROFITS  
 * 3. Everything else? → HOLD AND SHUT UP
 */

const { calculateUnrealizedPnL } = require('../utils/tradeCalculations');

class SimpleTradeMonitor {
  constructor() {
    this.name = 'SIMPLE_TRADE_MONITOR';
  }

  /**
   * The ONLY method you need - BRUTAL SIMPLICITY
   */
  async checkTrade(trade) {
    const currentPrice = trade.currentPrice || 0;
    const stopLoss = trade.stopLoss || 0;
    const entryPrice = trade.entryPrice || 0;
    const unrealizedPnL = calculateUnrealizedPnL(trade, currentPrice);
    const percentGain = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;

    console.log(`📊 ${trade.ticker}: Price $${currentPrice}, Entry $${entryPrice}, P&L $${unrealizedPnL.toLocaleString()}, Gain ${percentGain.toFixed(1)}%`);

    // RULE 1: Stop loss hit = EMERGENCY EXIT
    if (currentPrice <= stopLoss && stopLoss > 0) {
      return {
        action: 'EXIT_NOW',
        urgency: 'IMMEDIATE',
        reason: `Stop loss hit at $${stopLoss}`,
        instruction: `SELL ALL ${trade.quantity} shares immediately - market order if needed`,
        emoji: '🚨'
      };
    }

    // RULE 2: Big profits = TAKE SOME OFF THE TABLE
    if (percentGain >= 15) {
      const sharesToSell = Math.floor(trade.quantity * 0.5); // Sell 50%
      const profitToLock = Math.abs(unrealizedPnL * 0.5);
      return {
        action: 'TAKE_PROFITS',
        urgency: 'TODAY',
        reason: `${percentGain.toFixed(1)}% gain - time to take profits`,
        instruction: `Sell ${sharesToSell} shares to lock in $${profitToLock.toLocaleString()} profit`,
        emoji: '💰'
      };
    }

    // RULE 3: Medium profits = PARTIAL PROFITS
    if (percentGain >= 8) {
      const sharesToSell = Math.floor(trade.quantity * 0.3); // Sell 30%
      const profitToLock = Math.abs(unrealizedPnL * 0.3);
      return {
        action: 'PARTIAL_PROFITS',
        urgency: 'THIS_WEEK',
        reason: `${percentGain.toFixed(1)}% gain - partial profit taking`,
        instruction: `Sell ${sharesToSell} shares to lock in $${profitToLock.toLocaleString()} profit`,
        emoji: '📈'
      };
    }

    // RULE 4: Everything else = HOLD AND TRUST YOUR SYSTEM
    return {
      action: 'HOLD',
      urgency: 'NONE',
      reason: percentGain >= 0 ? 
        `${percentGain.toFixed(1)}% gain - let it run` : 
        `${Math.abs(percentGain).toFixed(1)}% loss but above stop - trust your system`,
      instruction: `Hold all ${trade.quantity} shares. Next check in 1 week.`,
      emoji: percentGain >= 0 ? '✅' : '⏳'
    };
  }

  /**
   * Weekly review - ONLY method to call regularly
   */
  async weeklyReview(trades) {
    console.log('\n🗓️  WEEKLY TRADE REVIEW - SIMPLE RULES ONLY\n');
    
    const results = [];
    for (const trade of trades) {
      const result = await this.checkTrade(trade);
      results.push({
        ticker: trade.ticker,
        ...result
      });
      
      console.log(`${result.emoji} ${trade.ticker}: ${result.action} - ${result.reason}`);
    }
    
    console.log('\n✅ Weekly review complete. Take action only on URGENT items.\n');
    return results;
  }
}

module.exports = SimpleTradeMonitor;
