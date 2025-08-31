/**
 * SYSTEM PERFORMANCE TRACKER
 * Track live performance metrics for each trading system
 */

class SystemPerformanceTracker {
  constructor() {
    this.systemMetrics = new Map();
    this.trades = [];
    this.initializeMetrics();
  }

  initializeMetrics() {
    const systems = [
      'MINERVINI_SEPA',
      'TRIPLE_SCREEN', 
      'CAN_SLIM_CUP_HANDLE',
      'RSI_MEAN_REVERSION',
      'MACD_DIVERGENCE'
    ];

    systems.forEach(system => {
      this.systemMetrics.set(system, {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalWins: 0,
        totalLosses: 0,
        maxDrawdown: 0,
        currentDrawdown: 0,
        highWaterMark: 0,
        signals: [],
        returns: []
      });
    });
  }

  /**
   * Log a trading signal from a system
   */
  logSignal(systemName, signal) {
    if (!this.systemMetrics.has(systemName)) {
      console.warn(`Unknown system: ${systemName}`);
      return;
    }

    const metrics = this.systemMetrics.get(systemName);
    metrics.signals.push({
      ...signal,
      timestamp: new Date(),
      id: `${systemName}_${Date.now()}`
    });

    console.log(`📊 [${systemName}] Signal logged: ${signal.action} ${signal.symbol} @ ${signal.price}`);
  }

  /**
   * Record trade outcome
   */
  recordTrade(systemName, trade) {
    if (!this.systemMetrics.has(systemName)) {
      console.warn(`Unknown system: ${systemName}`);
      return;
    }

    const metrics = this.systemMetrics.get(systemName);
    const pnl = trade.exitPrice - trade.entryPrice;
    const pnlPercent = (pnl / trade.entryPrice) * 100;

    metrics.totalTrades++;
    metrics.returns.push(pnlPercent);

    if (pnl > 0) {
      metrics.winningTrades++;
      metrics.totalWins += Math.abs(pnl);
    } else {
      metrics.losingTrades++;
      metrics.totalLosses += Math.abs(pnl);
    }

    // Update drawdown
    const cumulativeReturn = metrics.returns.reduce((sum, ret) => sum + ret, 0);
    if (cumulativeReturn > metrics.highWaterMark) {
      metrics.highWaterMark = cumulativeReturn;
      metrics.currentDrawdown = 0;
    } else {
      metrics.currentDrawdown = metrics.highWaterMark - cumulativeReturn;
      metrics.maxDrawdown = Math.max(metrics.maxDrawdown, metrics.currentDrawdown);
    }

    this.trades.push({
      ...trade,
      system: systemName,
      pnl,
      pnlPercent,
      timestamp: new Date()
    });

    console.log(`💰 [${systemName}] Trade recorded: ${pnlPercent.toFixed(2)}% P&L`);
  }

  /**
   * Calculate performance metrics for a system
   */
  getSystemMetrics(systemName) {
    if (!this.systemMetrics.has(systemName)) {
      return null;
    }

    const metrics = this.systemMetrics.get(systemName);
    
    if (metrics.totalTrades === 0) {
      return {
        systemName,
        totalTrades: 0,
        winRate: 0,
        profitFactor: 0,
        avgWin: 0,
        avgLoss: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        totalReturn: 0
      };
    }

    const winRate = (metrics.winningTrades / metrics.totalTrades) * 100;
    const avgWin = metrics.winningTrades > 0 ? metrics.totalWins / metrics.winningTrades : 0;
    const avgLoss = metrics.losingTrades > 0 ? metrics.totalLosses / metrics.losingTrades : 0;
    const profitFactor = metrics.totalLosses > 0 ? metrics.totalWins / metrics.totalLosses : 0;
    
    // Calculate Sharpe Ratio
    const returns = metrics.returns;
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgReturn / stdDev) * Math.sqrt(252) : 0; // Annualized

    const totalReturn = returns.reduce((sum, ret) => sum + ret, 0);

    return {
      systemName,
      totalTrades: metrics.totalTrades,
      winRate: winRate.toFixed(1),
      profitFactor: profitFactor.toFixed(2),
      avgWin: avgWin.toFixed(2),
      avgLoss: avgLoss.toFixed(2),
      maxDrawdown: metrics.maxDrawdown.toFixed(2),
      sharpeRatio: sharpeRatio.toFixed(2),
      totalReturn: totalReturn.toFixed(2)
    };
  }

  /**
   * Get comparative performance report
   */
  getPerformanceReport() {
    console.log('\n🏆 SYSTEM PERFORMANCE REPORT');
    console.log('=====================================\n');

    const allMetrics = [];
    this.systemMetrics.forEach((_, systemName) => {
      allMetrics.push(this.getSystemMetrics(systemName));
    });

    // Sort by profit factor (most important metric)
    allMetrics.sort((a, b) => parseFloat(b.profitFactor) - parseFloat(a.profitFactor));

    allMetrics.forEach((metrics, index) => {
      const rank = index + 1;
      const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : '📊';
      
      console.log(`${medal} RANK ${rank}: ${metrics.systemName}`);
      console.log(`   Trades: ${metrics.totalTrades} | Win Rate: ${metrics.winRate}%`);
      console.log(`   Profit Factor: ${metrics.profitFactor} | Max DD: ${metrics.maxDrawdown}%`);
      console.log(`   Avg Win: $${metrics.avgWin} | Avg Loss: $${metrics.avgLoss}`);
      console.log(`   Sharpe: ${metrics.sharpeRatio} | Total Return: ${metrics.totalReturn}%\n`);
    });

    // Recommendations
    console.log('🎯 RECOMMENDATIONS:');
    console.log('==================');
    console.log(`✅ Top System: ${allMetrics[0].systemName} (Profit Factor: ${allMetrics[0].profitFactor})`);
    console.log(`✅ Most Consistent: ${allMetrics.find(m => parseFloat(m.winRate) === Math.max(...allMetrics.map(m => parseFloat(m.winRate)))).systemName}`);
    console.log(`⚠️  Highest Risk: ${allMetrics.find(m => parseFloat(m.maxDrawdown) === Math.max(...allMetrics.map(m => parseFloat(m.maxDrawdown)))).systemName}`);
    
    const topThree = allMetrics.slice(0, 3).map(m => m.systemName);
    console.log(`\n🎯 Focus 80% of capital on: ${topThree.join(', ')}`);

    return allMetrics;
  }

  /**
   * Calculate system correlation
   */
  getSystemCorrelation() {
    const systemNames = Array.from(this.systemMetrics.keys());
    const correlations = new Map();

    for (let i = 0; i < systemNames.length; i++) {
      for (let j = i + 1; j < systemNames.length; j++) {
        const system1 = systemNames[i];
        const system2 = systemNames[j];
        
        const returns1 = this.systemMetrics.get(system1).returns;
        const returns2 = this.systemMetrics.get(system2).returns;
        
        if (returns1.length > 0 && returns2.length > 0) {
          const correlation = this.calculateCorrelation(returns1, returns2);
          correlations.set(`${system1}_${system2}`, correlation);
        }
      }
    }

    return correlations;
  }

  calculateCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const xSlice = x.slice(-n);
    const ySlice = y.slice(-n);
    
    const sumX = xSlice.reduce((a, b) => a + b, 0);
    const sumY = ySlice.reduce((a, b) => a + b, 0);
    const sumXY = xSlice.reduce((acc, xi, i) => acc + xi * ySlice[i], 0);
    const sumXX = xSlice.reduce((acc, xi) => acc + xi * xi, 0);
    const sumYY = ySlice.reduce((acc, yi) => acc + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }
}

// Example usage and testing
const tracker = new SystemPerformanceTracker();

// Simulate some trading signals and outcomes
console.log('🚀 SYSTEM PERFORMANCE TRACKER DEMO\n');

// Example signals
tracker.logSignal('MINERVINI_SEPA', {
  action: 'BUY',
  symbol: 'AAPL',
  price: 150.00,
  confidence: 0.85
});

tracker.logSignal('TRIPLE_SCREEN', {
  action: 'BUY', 
  symbol: 'MSFT',
  price: 300.00,
  confidence: 0.75
});

// Example trades
tracker.recordTrade('MINERVINI_SEPA', {
  symbol: 'AAPL',
  entryPrice: 150.00,
  exitPrice: 157.50
});

tracker.recordTrade('TRIPLE_SCREEN', {
  symbol: 'MSFT', 
  entryPrice: 300.00,
  exitPrice: 295.00
});

// Additional example trades for better metrics
tracker.recordTrade('MINERVINI_SEPA', {
  symbol: 'GOOGL',
  entryPrice: 120.00,
  exitPrice: 126.00
});

tracker.recordTrade('RSI_MEAN_REVERSION', {
  symbol: 'AMZN',
  entryPrice: 100.00,
  exitPrice: 98.50
});

// Get performance report
tracker.getPerformanceReport();

module.exports = { SystemPerformanceTracker };
