/**
 * 🎯 BACKTEST LOGGER
 * 
 * Logs backtest progress and results to files
 * Provides detailed trade-by-trade logging and summary statistics
 */

const fs = require('fs').promises;
const path = require('path');

class BacktestLogger {
  constructor(logDir = null) {
    this.logDir = logDir || path.join(__dirname, '../logs');
    this.logFile = null;
    this.startTime = null;
    this.tradeCount = 0;
  }

  /**
   * Initialize logging for a backtest session
   * @param {Object} config - Backtest configuration
   */
  async initializeSession(config) {
    try {
      // Create logs directory if it doesn't exist
      await fs.mkdir(this.logDir, { recursive: true });
      
      this.startTime = new Date();
      const timestamp = this.startTime.toISOString().replace(/:/g, '-').split('.')[0];
      this.logFile = path.join(this.logDir, `backtest-${timestamp}.log`);
      
      const header = [
        '🎯 ISHASTRA BACKTEST SESSION STARTED',
        `Timestamp: ${this.startTime.toISOString()}`,
        `Configuration: ${JSON.stringify(config, null, 2)}`,
        '=' .repeat(80),
        ''
      ].join('\n');
      
      await fs.writeFile(this.logFile, header);
      console.log(`📝 Backtest logging initialized: ${this.logFile}`);
      
    } catch (error) {
      console.error('❌ Failed to initialize backtest logging:', error.message);
    }
  }

  /**
   * Log backtest progress
   * @param {string} message - Progress message
   * @param {string} level - Log level (INFO, WARN, ERROR)
   */
  async logProgress(message, level = 'INFO') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${level}: ${message}\n`;
    
    try {
      if (this.logFile) {
        await fs.appendFile(this.logFile, logEntry);
      }
      console.log(`${this.getLevelIcon(level)} ${message}`);
    } catch (error) {
      console.error('❌ Logging failed:', error.message);
    }
  }

  /**
   * Log a completed trade
   * @param {Object} trade - Trade result object
   */
  async logTrade(trade) {
    this.tradeCount++;
    
    const tradeLog = [
      `📊 TRADE #${this.tradeCount}: ${trade.symbol}`,
      `   Entry: ${trade.entryDate.toISOString().split('T')[0]} @ $${trade.entryPrice}`,
      `   Exit:  ${trade.exitDate.toISOString().split('T')[0]} @ $${trade.exitPrice} (${trade.reason})`,
      `   Duration: ${trade.daysHeld} days`,
      `   R-Multiple: ${trade.RMultiple}R`,
      `   P&L: $${trade.pnlAmount} (${trade.pnlPercent.toFixed(2)}%)`,
      `   System: ${trade.system}`,
      `   Stop: $${trade.stopLoss} | Target: $${trade.target}`,
      ''
    ].join('\n');
    
    await this.logProgress(tradeLog.replace(/\n/g, ' | '), 'TRADE');
  }

  /**
   * Log signal that didn't result in a trade
   * @param {string} symbol - Stock symbol
   * @param {Date} date - Analysis date
   * @param {string} reason - Reason for skipping
   */
  async logSkippedSignal(symbol, date, reason) {
    await this.logProgress(`⏭️ SKIPPED ${symbol} on ${date.toISOString().split('T')[0]}: ${reason}`, 'WARN');
  }

  /**
   * Log processing of a symbol
   * @param {string} symbol - Stock symbol being processed
   * @param {number} current - Current symbol number
   * @param {number} total - Total symbols to process
   */
  async logSymbolProgress(symbol, current, total) {
    const percent = ((current / total) * 100).toFixed(1);
    await this.logProgress(`📈 Processing ${symbol} (${current}/${total} - ${percent}%)`);
  }

  /**
   * Generate and log final backtest summary
   * @param {Array} allTrades - Array of all completed trades
   * @param {Object} config - Backtest configuration
   */
  async logSummary(allTrades, config) {
    const endTime = new Date();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    const summary = this.generateSummaryStats(allTrades);
    
    const summaryReport = [
      '',
      '🎯 BACKTEST SUMMARY',
      '=' .repeat(50),
      `Duration: ${duration}s`,
      `Total Trades: ${allTrades.length}`,
      `Symbols Processed: ${config.symbols?.length || 'N/A'}`,
      `Date Range: ${config.startDate} to ${config.endDate}`,
      '',
      '📊 PERFORMANCE METRICS',
      '-' .repeat(30),
      `Win Rate: ${summary.winRate}%`,
      `Avg R-Multiple: ${summary.avgRMultiple}R`,
      `Best Trade: ${summary.bestTrade}R`,
      `Worst Trade: ${summary.worstTrade}R`,
      `Total P&L: $${summary.totalPnL}`,
      `Avg P&L per Trade: $${summary.avgPnL}`,
      '',
      '🎲 EXIT REASONS',
      '-' .repeat(20),
      `Target Hits: ${summary.targetExits} (${summary.targetPercent}%)`,
      `Stop Losses: ${summary.stopExits} (${summary.stopPercent}%)`,
      `Time Exits: ${summary.timeExits} (${summary.timePercent}%)`,
      '',
      '📈 SYSTEM BREAKDOWN',
      '-' .repeat(20)
    ];

    // Add system-specific stats
    Object.entries(summary.systemStats).forEach(([system, stats]) => {
      summaryReport.push(`${system}: ${stats.trades} trades, ${stats.avgR}R avg`);
    });

    summaryReport.push('', '=' .repeat(50), '');
    
    const reportText = summaryReport.join('\n');
    
    if (this.logFile) {
      await fs.appendFile(this.logFile, reportText);
    }
    
    console.log(reportText);
    console.log(`📝 Full backtest log saved to: ${this.logFile}`);
    
    return summary;
  }

  /**
   * Generate statistical summary of trades
   * @param {Array} trades - Array of trade results
   * @returns {Object} Summary statistics
   */
  generateSummaryStats(trades) {
    if (trades.length === 0) {
      return {
        winRate: 0,
        avgRMultiple: 0,
        bestTrade: 0,
        worstTrade: 0,
        totalPnL: 0,
        avgPnL: 0,
        targetExits: 0,
        stopExits: 0,
        timeExits: 0,
        systemStats: {}
      };
    }

    const winningTrades = trades.filter(t => t.RMultiple > 0);
    const winRate = ((winningTrades.length / trades.length) * 100).toFixed(1);
    
    const rMultiples = trades.map(t => t.RMultiple);
    const avgRMultiple = (rMultiples.reduce((sum, r) => sum + r, 0) / trades.length).toFixed(2);
    const bestTrade = Math.max(...rMultiples).toFixed(2);
    const worstTrade = Math.min(...rMultiples).toFixed(2);
    
    const totalPnL = trades.reduce((sum, t) => sum + t.pnlAmount, 0).toFixed(2);
    const avgPnL = (totalPnL / trades.length).toFixed(2);
    
    // Exit reason breakdown
    const targetExits = trades.filter(t => t.reason === 'TARGET').length;
    const stopExits = trades.filter(t => t.reason === 'STOP').length;
    const timeExits = trades.filter(t => t.reason === 'TIME').length;
    
    const targetPercent = ((targetExits / trades.length) * 100).toFixed(1);
    const stopPercent = ((stopExits / trades.length) * 100).toFixed(1);
    const timePercent = ((timeExits / trades.length) * 100).toFixed(1);
    
    // System breakdown
    const systemStats = {};
    trades.forEach(trade => {
      const system = trade.system || 'unknown';
      if (!systemStats[system]) {
        systemStats[system] = { trades: 0, totalR: 0 };
      }
      systemStats[system].trades++;
      systemStats[system].totalR += trade.RMultiple;
    });
    
    // Calculate average R for each system
    Object.keys(systemStats).forEach(system => {
      const stats = systemStats[system];
      stats.avgR = (stats.totalR / stats.trades).toFixed(2);
    });

    return {
      winRate,
      avgRMultiple,
      bestTrade,
      worstTrade,
      totalPnL,
      avgPnL,
      targetExits,
      stopExits, 
      timeExits,
      targetPercent,
      stopPercent,
      timePercent,
      systemStats
    };
  }

  /**
   * Get icon for log level
   * @param {string} level - Log level
   * @returns {string} Icon/emoji
   */
  getLevelIcon(level) {
    const icons = {
      'INFO': 'ℹ️',
      'WARN': '⚠️',
      'ERROR': '❌',
      'TRADE': '💰',
      'SUCCESS': '✅'
    };
    return icons[level] || 'ℹ️';
  }
}

module.exports = { BacktestLogger };
