/**
 * Portfolio Integration Service
 * Phase 4: Real-time Portfolio Management & Integration
 * 
 * Features:
 * - Integration with existing investment tracking
 * - Portfolio performance analytics
 * - Position correlation analysis
 * - Real-time P&L tracking
 * - Automated position updates
 */

const AlertService = require('./alertService');
const RiskManager = require('./riskManager');

class PortfolioIntegrationService {
  constructor(config = {}) {
    this.alertService = new AlertService();
    this.riskManager = new RiskManager(config.riskConfig);
    
    this.portfolio = {
      totalValue: config.initialValue || 100000,
      availableCash: config.initialCash || 100000,
      positions: new Map(),
      performanceHistory: [],
      tradingStats: {
        totalTrades: 0,
        winningTrades: 0,
        losingTrades: 0,
        totalProfit: 0,
        totalLoss: 0,
        largestWin: 0,
        largestLoss: 0,
        averageWin: 0,
        averageLoss: 0,
        winRate: 0,
        profitFactor: 0,
        sharpeRatio: 0
      }
    };
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('💼 Portfolio Integration Service initialized');
    console.log(`   Initial portfolio value: $${this.portfolio.totalValue.toLocaleString()}`);
  }

  /**
   * Set up event listeners for alerts and risk management
   */
  setupEventListeners() {
    this.alertService.on('alertGenerated', (alert) => {
      this.handleNewAlert(alert);
    });
    
    this.alertService.on('positionAdded', ({ symbol, position }) => {
      this.addPortfolioPosition(symbol, position);
    });
    
    this.alertService.on('positionClosed', ({ symbol, position }) => {
      this.closePortfolioPosition(symbol, position);
    });
  }

  /**
   * Start integrated monitoring with validated systems
   */
  async startIntegratedMonitoring(watchlistConfig, monitoringInterval = 5) {
    console.log('🚀 Starting integrated portfolio monitoring...');
    
    // Add stocks to watchlist with validated systems only
    for (const config of watchlistConfig) {
      await this.alertService.addToWatchlist(config);
    }
    
    // Start monitoring
    this.alertService.startMonitoring(monitoringInterval);
    
    // Set up periodic portfolio updates
    this.startPortfolioUpdates();
    
    return {
      message: 'Integrated monitoring started',
      watchlist: this.alertService.getWatchlistStatus(),
      portfolio: this.getPortfolioSummary()
    };
  }

  /**
   * Start periodic portfolio value updates
   */
  startPortfolioUpdates() {
    // Update every 30 minutes during market hours
    setInterval(() => {
      this.updatePortfolioValues();
    }, 30 * 60 * 1000);
  }

  /**
   * Handle new trading alerts with risk validation
   */
  async handleNewAlert(alert) {
    try {
      console.log(`\n💡 Processing new alert for ${alert.symbol} (${alert.system} system)`);
      
      // Get current market data for risk calculations
      const yahooFinance = require('../yahoo');
      const marketData = await yahooFinance.getHistorical(alert.symbol, '6mo');
      
      if (!marketData || marketData.length < 100) {
        console.log('⚠️  Insufficient data for risk analysis');
        return;
      }

      const convertedData = marketData.map(item => ({
        date: new Date(item.date),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      })).sort((a, b) => a.date - b.date);

      // Create signal object for risk analysis
      const signal = {
        symbol: alert.symbol,
        system: alert.system,
        direction: alert.type.includes('LONG') ? 'LONG' : 'SHORT',
        entryPrice: alert.entryPrice || alert.price,
        stopLoss: alert.stopLoss,
        targets: alert.target ? [alert.target] : [],
        confidence: alert.confidence,
        accountValue: this.portfolio.totalValue
      };

      // Calculate optimal position size
      const positionSizing = this.riskManager.calculatePositionSize(signal, convertedData);
      
      if (!positionSizing) {
        console.log('❌ Could not calculate position sizing');
        return;
      }

      // Validate trade with risk management
      const validation = this.riskManager.validateTrade(signal, positionSizing, convertedData);
      
      if (!validation.approved) {
        console.log('🚫 Trade rejected by risk management:');
        validation.reasons.forEach(reason => console.log(`   - ${reason}`));
        return;
      }

      // Generate trade recommendation
      const recommendation = this.generateTradeRecommendation(alert, signal, positionSizing, validation);
      
      console.log('\n📋 TRADE RECOMMENDATION GENERATED:');
      console.log(`Symbol: ${recommendation.symbol}`);
      console.log(`Action: ${recommendation.action}`);
      console.log(`System: ${recommendation.system} (${recommendation.historicalWinRate}% win rate)`);
      console.log(`Position Size: ${recommendation.positionSize} shares`);
      console.log(`Position Value: $${recommendation.positionValue.toLocaleString()}`);
      console.log(`Risk Amount: $${recommendation.riskAmount.toLocaleString()} (${(recommendation.riskPercent * 100).toFixed(2)}%)`);
      console.log(`Risk/Reward: 1:${recommendation.riskReward.toFixed(2)}`);
      console.log(`Confidence: ${recommendation.confidence}%`);
      
      if (validation.warnings.length > 0) {
        console.log('\n⚠️  Warnings:');
        validation.warnings.forEach(warning => console.log(`   - ${warning}`));
      }

      // Store recommendation for potential execution
      this.storeTradeRecommendation(recommendation);
      
    } catch (error) {
      console.error('❌ Error handling alert:', error.message);
    }
  }

  /**
   * Generate comprehensive trade recommendation
   */
  generateTradeRecommendation(alert, signal, positionSizing, validation) {
    const riskReward = this.riskManager.calculateRiskReward(signal);
    
    return {
      id: `rec_${Date.now()}`,
      timestamp: new Date(),
      symbol: alert.symbol,
      system: alert.system,
      action: signal.direction === 'LONG' ? 'BUY' : 'SELL_SHORT',
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      targets: signal.targets,
      positionSize: positionSizing.positionSize,
      positionValue: positionSizing.positionValue,
      riskAmount: positionSizing.riskAmount,
      riskPercent: positionSizing.riskPercent,
      riskReward: riskReward,
      confidence: alert.confidence,
      historicalWinRate: alert.historicalWinRate,
      validation: validation,
      portfolioImpact: {
        newPortfolioRisk: this.riskManager.riskMetrics.currentPortfolioRisk + positionSizing.riskPercent,
        availableCash: this.portfolio.availableCash,
        positionCount: this.riskManager.positions.size + 1
      },
      reasoning: [
        `${alert.system.toUpperCase()} system generated ${signal.direction} signal`,
        `Historical win rate: ${alert.historicalWinRate}%`,
        `Risk-reward ratio: 1:${riskReward.toFixed(2)}`,
        `Position risk: ${(positionSizing.riskPercent * 100).toFixed(2)}% of portfolio`,
        `Volatility adjustment: ${(positionSizing.volatilityAdjustment * 100).toFixed(0)}%`,
        `Portfolio heat adjustment: ${(positionSizing.portfolioHeatAdjustment * 100).toFixed(0)}%`
      ]
    };
  }

  /**
   * Store trade recommendation for tracking
   */
  storeTradeRecommendation(recommendation) {
    // In a real implementation, this would save to database
    console.log(`💾 Trade recommendation stored: ${recommendation.id}`);
  }

  /**
   * Add position to portfolio tracking
   */
  addPortfolioPosition(symbol, positionData) {
    const position = {
      symbol,
      ...positionData,
      addedAt: new Date(),
      currentPrice: positionData.entryPrice,
      unrealizedPnL: 0,
      unrealizedPnLPercent: 0
    };

    this.portfolio.positions.set(symbol, position);
    this.portfolio.availableCash -= positionData.positionValue || 0;
    this.riskManager.addPosition(symbol, positionData);
    
    console.log(`📈 Position added to portfolio: ${position.direction} ${symbol}`);
    this.updatePortfolioSummary();
  }

  /**
   * Close position in portfolio
   */
  closePortfolioPosition(symbol, exitData) {
    const position = this.portfolio.positions.get(symbol);
    if (!position) return;

    // Calculate final P&L
    const priceDiff = position.direction === 'LONG' ? 
      exitData.exitPrice - position.entryPrice :
      position.entryPrice - exitData.exitPrice;
    
    const realizedPnL = priceDiff * position.positionSize;
    const realizedPnLPercent = priceDiff / position.entryPrice;

    // Update trading stats
    this.updateTradingStats({
      symbol,
      entryPrice: position.entryPrice,
      exitPrice: exitData.exitPrice,
      positionSize: position.positionSize,
      direction: position.direction,
      realizedPnL,
      realizedPnLPercent,
      holdingPeriod: (new Date() - position.addedAt) / (1000 * 60 * 60 * 24), // days
      system: position.system
    });

    // Update portfolio values
    this.portfolio.availableCash += (exitData.exitPrice * position.positionSize);
    this.portfolio.totalValue += realizedPnL;
    this.portfolio.positions.delete(symbol);
    
    console.log(`📊 Position closed: ${symbol} - P&L: $${realizedPnL.toFixed(2)} (${(realizedPnLPercent * 100).toFixed(2)}%)`);
    this.updatePortfolioSummary();
  }

  /**
   * Update trading statistics
   */
  updateTradingStats(tradeData) {
    const stats = this.portfolio.tradingStats;
    const { realizedPnL } = tradeData;
    
    stats.totalTrades++;
    
    if (realizedPnL > 0) {
      stats.winningTrades++;
      stats.totalProfit += realizedPnL;
      stats.largestWin = Math.max(stats.largestWin, realizedPnL);
    } else {
      stats.losingTrades++;
      stats.totalLoss += Math.abs(realizedPnL);
      stats.largestLoss = Math.max(stats.largestLoss, Math.abs(realizedPnL));
    }
    
    // Calculate derived metrics
    stats.winRate = (stats.winningTrades / stats.totalTrades) * 100;
    stats.averageWin = stats.winningTrades > 0 ? stats.totalProfit / stats.winningTrades : 0;
    stats.averageLoss = stats.losingTrades > 0 ? stats.totalLoss / stats.losingTrades : 0;
    stats.profitFactor = stats.totalLoss > 0 ? stats.totalProfit / stats.totalLoss : 0;
    
    // Add to performance history
    this.portfolio.performanceHistory.push({
      date: new Date(),
      trade: tradeData,
      portfolioValue: this.portfolio.totalValue,
      totalReturn: ((this.portfolio.totalValue - 100000) / 100000) * 100 // Assuming $100k start
    });
  }

  /**
   * Update portfolio values with current market prices
   */
  async updatePortfolioValues() {
    try {
      console.log('🔄 Updating portfolio values...');
      
      const yahooFinance = require('../yahoo');
      let totalUnrealizedPnL = 0;
      
      for (const [symbol, position] of this.portfolio.positions) {
        try {
          const quote = await yahooFinance.getQuote(symbol);
          if (quote && quote.regularMarketPrice) {
            const currentPrice = quote.regularMarketPrice;
            
            // Update position with current price
            this.riskManager.updatePosition(symbol, currentPrice);
            
            // Update portfolio position
            const priceDiff = position.direction === 'LONG' ? 
              currentPrice - position.entryPrice :
              position.entryPrice - currentPrice;
            
            position.currentPrice = currentPrice;
            position.unrealizedPnL = priceDiff * position.positionSize;
            position.unrealizedPnLPercent = priceDiff / position.entryPrice;
            
            totalUnrealizedPnL += position.unrealizedPnL;
          }
        } catch (error) {
          console.log(`⚠️  Could not update price for ${symbol}: ${error.message}`);
        }
      }
      
      // Update total portfolio value
      this.portfolio.totalValue = this.portfolio.availableCash + 
        Array.from(this.portfolio.positions.values())
          .reduce((sum, pos) => sum + (pos.currentPrice * pos.positionSize), 0);
      
      console.log(`✅ Portfolio values updated - Total: $${this.portfolio.totalValue.toLocaleString()}, Unrealized P&L: $${totalUnrealizedPnL.toFixed(2)}`);
      
    } catch (error) {
      console.error('❌ Error updating portfolio values:', error.message);
    }
  }

  /**
   * Update portfolio summary
   */
  updatePortfolioSummary() {
    const summary = this.getPortfolioSummary();
    console.log('\n📊 PORTFOLIO SUMMARY UPDATED:');
    console.log(`Total Value: $${summary.totalValue.toLocaleString()}`);
    console.log(`Available Cash: $${summary.availableCash.toLocaleString()}`);
    console.log(`Open Positions: ${summary.positionCount}`);
    console.log(`Total P&L: $${summary.totalPnL.toFixed(2)}`);
    console.log(`Win Rate: ${summary.stats.winRate.toFixed(1)}%`);
  }

  /**
   * Execute a trade based on alert
   */
  async executeTrade(tradeData) {
    try {
      const {
        symbol,
        type,
        quantity,
        price,
        stopLoss,
        target,
        confidence,
        sentimentScore,
        system,
        alertId
      } = tradeData;

      // Create trade record
      const trade = {
        id: `trade_${Date.now()}`,
        symbol,
        type,
        direction: type === 'BUY' ? 'LONG' : 'SHORT',
        quantity,
        entryPrice: price,
        currentPrice: price,
        stopLoss,
        target,
        confidence,
        sentimentScore,
        system,
        alertId,
        executedAt: new Date(),
        status: 'OPEN',
        unrealizedPnL: 0,
        unrealizedPnLPercent: 0,
        positionValue: quantity * price
      };

      // Add to portfolio positions
      this.addPortfolioPosition(symbol, trade);

      console.log(`✅ Trade executed: ${type} ${quantity} shares of ${symbol} at ₹${price.toFixed(2)}`);
      return trade;

    } catch (error) {
      console.error(`❌ Error executing trade: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update sentiment context for a symbol
   */
  updateSentimentContext(symbol, sentiment) {
    // Store sentiment context for portfolio decisions
    if (!this.sentimentContext) {
      this.sentimentContext = new Map();
    }
    
    this.sentimentContext.set(symbol, {
      score: sentiment.overall.score,
      confidence: sentiment.overall.confidence,
      recommendation: sentiment.recommendation,
      timestamp: new Date()
    });
    
    console.log(`📊 Updated sentiment context for ${symbol}: ${sentiment.overall.score.toFixed(3)}`);
  }

  /**
   * Get comprehensive portfolio summary
   */
  getPortfolioSummary() {
    const positions = Array.from(this.portfolio.positions.values());
    const totalUnrealizedPnL = positions.reduce((sum, pos) => sum + (pos.unrealizedPnL || 0), 0);
    const totalPositionValue = positions.reduce((sum, pos) => sum + (pos.currentPrice * pos.positionSize), 0);
    
    return {
      totalValue: this.portfolio.totalValue,
      availableCash: this.portfolio.availableCash,
      totalPositionValue,
      positionCount: positions.length,
      totalPnL: totalUnrealizedPnL + (this.portfolio.tradingStats.totalProfit - this.portfolio.tradingStats.totalLoss),
      unrealizedPnL: totalUnrealizedPnL,
      realizedPnL: this.portfolio.tradingStats.totalProfit - this.portfolio.tradingStats.totalLoss,
      positions: positions.map(pos => ({
        symbol: pos.symbol,
        direction: pos.direction,
        positionSize: pos.positionSize,
        entryPrice: pos.entryPrice,
        currentPrice: pos.currentPrice,
        unrealizedPnL: pos.unrealizedPnL,
        unrealizedPnLPercent: pos.unrealizedPnLPercent
      })),
      stats: this.portfolio.tradingStats,
      riskMetrics: this.riskManager.getRiskStatus(),
      watchlist: this.alertService.getWatchlistStatus()
    };
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics() {
    const history = this.portfolio.performanceHistory;
    if (history.length === 0) return null;

    const returns = history.map(h => h.totalReturn);
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const volatility = Math.sqrt(
      returns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / returns.length
    );

    return {
      totalReturn: returns[returns.length - 1] || 0,
      averageReturn: avgReturn,
      volatility: volatility,
      sharpeRatio: volatility > 0 ? avgReturn / volatility : 0,
      maxDrawdown: this.calculateMaxDrawdown(returns),
      tradingStats: this.portfolio.tradingStats,
      performanceHistory: history
    };
  }

  /**
   * Calculate maximum drawdown
   */
  calculateMaxDrawdown(returns) {
    let maxDrawdown = 0;
    let peak = returns[0] || 0;
    
    for (const ret of returns) {
      if (ret > peak) peak = ret;
      const drawdown = (peak - ret) / peak * 100;
      maxDrawdown = Math.max(maxDrawdown, drawdown);
    }
    
    return maxDrawdown;
  }
}

module.exports = PortfolioIntegrationService;
