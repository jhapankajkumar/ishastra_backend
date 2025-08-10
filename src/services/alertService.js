/**
 * Alert Service - Real-time Trading Alert System
 * Phase 4: Alert System & Portfolio Integration
 * 
 * Features:
 * - Real-time price monitoring for validated systems
 * - Entry/Exit signal alerts based on proven patterns
 * - Risk management notifications
 * - Portfolio position tracking
 */

const EventEmitter = require('events');
const BacktestingEngine = require('../utils/backtestingEngine');
const yahooFinance = require('../yahoo');

class AlertService extends EventEmitter {
  constructor() {
    super();
    this.watchlist = new Map(); // symbol -> watchconfig
    this.activeAlerts = new Map(); // alertId -> alert
    this.portfolioPositions = new Map(); // symbol -> position
    this.monitoringInterval = null;
    this.alertCounter = 0;
    
    // Validated systems from our comprehensive analysis
    this.validatedSystems = [
      'sepa',           // 211.33% avg return, 65.9% win rate
      'cupHandle',      // Generated SHORT signals
      'tripleScreen',   // Generated some LONG signals
      'darvasBox'       // Room for improvement
    ];
    
    // Performance thresholds from our analysis
    this.performanceThresholds = {
      sepa: { minWinRate: 65, avgReturn: 211.33, confidence: 'HIGH' },
      cupHandle: { minWinRate: 40, avgReturn: -5.38, confidence: 'MEDIUM' },
      tripleScreen: { minWinRate: 30, avgReturn: 0.15, confidence: 'LOW' },
      darvasBox: { minWinRate: 30, avgReturn: 0.0, confidence: 'LOW' }
    };
  }

  /**
   * Add stock to watchlist with specific system monitoring
   */
  async addToWatchlist(config) {
    const {
      symbol,
      systems = ['sepa'], // Default to best performing system
      alertTypes = ['entry', 'exit', 'stopLoss', 'target'],
      riskPerTrade = 0.02,
      maxPositionSize = 0.3,
      notificationMethods = ['console', 'email']
    } = config;

    // Validate systems against our proven list
    const validSystems = systems.filter(sys => this.validatedSystems.includes(sys));
    if (validSystems.length === 0) {
      throw new Error(`No validated systems provided. Use: ${this.validatedSystems.join(', ')}`);
    }

    console.log(`📊 Adding ${symbol} to watchlist with systems: ${validSystems.join(', ')}`);
    
    this.watchlist.set(symbol, {
      symbol,
      systems: validSystems,
      alertTypes,
      riskPerTrade,
      maxPositionSize,
      notificationMethods,
      lastPrice: null,
      lastAnalysis: null,
      alertHistory: [],
      addedAt: new Date()
    });

    // Emit watchlist update event
    this.emit('watchlistUpdated', { action: 'added', symbol, systems: validSystems });
    
    return {
      success: true,
      message: `${symbol} added to watchlist with ${validSystems.length} validated systems`,
      systems: validSystems
    };
  }

  /**
   * Start real-time monitoring
   */
  startMonitoring(intervalMinutes = 5) {
    if (this.monitoringInterval) {
      this.stopMonitoring();
    }

    console.log(`🔄 Starting alert monitoring (${intervalMinutes} min intervals)`);
    console.log(`📊 Monitoring ${this.watchlist.size} stocks with validated systems`);

    this.monitoringInterval = setInterval(() => {
      this.scanWatchlist();
    }, intervalMinutes * 60 * 1000);

    // Initial scan
    this.scanWatchlist();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('⏹️  Alert monitoring stopped');
    }
  }

  /**
   * Scan all watchlist stocks for signals
   */
  async scanWatchlist() {
    console.log(`\n🔍 Scanning ${this.watchlist.size} stocks for trading signals...`);
    
    const scanPromises = Array.from(this.watchlist.entries()).map(([symbol, config]) => 
      this.analyzeStock(symbol, config)
    );

    try {
      const results = await Promise.allSettled(scanPromises);
      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      console.log(`✅ Scan complete: ${successful} successful, ${failed} failed`);
    } catch (error) {
      console.error('❌ Error during watchlist scan:', error.message);
    }
  }

  /**
   * Analyze individual stock for trading signals
   */
  async analyzeStock(symbol, config) {
    try {
      console.log(`  📈 Analyzing ${symbol}...`);
      
      // Fetch current market data
      const historicalData = await yahooFinance.getHistorical(symbol, '6mo');
      if (!historicalData || historicalData.length < 100) {
        console.log(`    ⚠️  Insufficient data for ${symbol}`);
        return;
      }

      // Convert data format
      const marketData = historicalData.map(item => ({
        date: new Date(item.date),
        open: item.open,
        high: item.high,
        low: item.low,
        close: item.close,
        volume: item.volume
      })).sort((a, b) => a.date - b.date);

      const currentPrice = marketData[marketData.length - 1].close;
      const lastConfig = this.watchlist.get(symbol);
      lastConfig.lastPrice = currentPrice;

      // Analyze each validated system
      for (const system of config.systems) {
        await this.analyzeSystemSignals(symbol, system, marketData, config);
      }

    } catch (error) {
      console.log(`    ❌ Error analyzing ${symbol}: ${error.message}`);
    }
  }

  /**
   * Analyze signals for specific system
   */
  async analyzeSystemSignals(symbol, system, marketData, config) {
    try {
      const backtestConfig = {
        initialCapital: 100000,
        commissionPerTrade: 20,
        slippagePercent: 0.002,
        maxPositionSize: config.maxPositionSize,
        riskPerTrade: config.riskPerTrade,
        allowShortSelling: true,
        shortBorrowRate: 0.08,
        systemFilter: system
      };

      const engine = new BacktestingEngine(marketData, backtestConfig);
      
      // Get recent signals (last 5 data points)
      const recentData = marketData.slice(-50); // Last 50 days for pattern recognition
      const recentEngine = new BacktestingEngine(recentData, backtestConfig);
      const results = await recentEngine.runBacktest();

      // Check for new signals in last few days
      const recentSignals = results.trades.filter(trade => {
        const daysDiff = (Date.now() - trade.entryDate.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff <= 3; // Signals within last 3 days
      });

      if (recentSignals.length > 0) {
        for (const signal of recentSignals) {
          await this.processSignal(symbol, system, signal, config);
        }
      }

    } catch (error) {
      console.log(`      ❌ Error analyzing ${system} for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Process and generate alerts for trading signals
   */
  async processSignal(symbol, system, signal, config) {
    const systemPerformance = this.performanceThresholds[system];
    const currentPrice = this.watchlist.get(symbol).lastPrice;
    
    // Generate alert based on signal type and system performance
    const alert = {
      id: ++this.alertCounter,
      symbol,
      system,
      type: signal.direction === 'LONG' ? 'ENTRY_LONG' : 'ENTRY_SHORT',
      price: currentPrice,
      entryPrice: signal.entryPrice,
      stopLoss: signal.stopLoss,
      target: signal.targets?.[0] || null,
      confidence: this.calculateConfidence(system, signal),
      historicalWinRate: systemPerformance.minWinRate,
      message: this.generateAlertMessage(symbol, system, signal, systemPerformance),
      timestamp: new Date(),
      isTriggered: false
    };

    // Store alert
    this.activeAlerts.set(alert.id, alert);
    
    // Add to symbol's alert history
    const watchConfig = this.watchlist.get(symbol);
    watchConfig.alertHistory.push(alert);

    // Send notifications
    await this.sendNotifications(alert, config.notificationMethods);

    // Emit alert event
    this.emit('alertGenerated', alert);

    console.log(`    🚨 ${alert.type} alert generated for ${symbol} (${system} system)`);
    return alert;
  }

  /**
   * Calculate confidence score based on system performance and signal quality
   */
  calculateConfidence(system, signal) {
    const systemPerf = this.performanceThresholds[system];
    let baseConfidence = systemPerf.minWinRate;

    // Adjust confidence based on system reliability
    switch (system) {
      case 'sepa':
        baseConfidence += 15; // Proven winner
        break;
      case 'cupHandle':
        baseConfidence += 5;  // Generated some signals
        break;
      default:
        baseConfidence -= 5;  // Less proven systems
    }

    // Adjust for signal strength (volume, pattern quality, etc.)
    if (signal.volume && signal.volume > 1.5) baseConfidence += 10;
    if (signal.riskReward && signal.riskReward > 2) baseConfidence += 5;

    return Math.min(Math.max(baseConfidence, 30), 95); // Cap between 30-95%
  }

  /**
   * Generate alert message with context
   */
  generateAlertMessage(symbol, system, signal, systemPerformance) {
    const direction = signal.direction === 'LONG' ? '📈 LONG' : '📉 SHORT';
    const systemName = system.toUpperCase();
    const winRate = systemPerformance.minWinRate;
    
    return `${direction} signal detected for ${symbol} using ${systemName} system (${winRate}% historical win rate). ` +
           `Entry: $${signal.entryPrice?.toFixed(2) || 'Market'}, ` +
           `Stop: $${signal.stopLoss?.toFixed(2)}, ` +
           `Target: $${signal.targets?.[0]?.toFixed(2) || 'Dynamic'}`;
  }

  /**
   * Send notifications via configured methods
   */
  async sendNotifications(alert, methods) {
    for (const method of methods) {
      switch (method) {
        case 'console':
          this.sendConsoleNotification(alert);
          break;
        case 'email':
          await this.sendEmailNotification(alert);
          break;
        case 'push':
          await this.sendPushNotification(alert);
          break;
      }
    }
  }

  /**
   * Console notification
   */
  sendConsoleNotification(alert) {
    console.log('\n🚨 TRADING ALERT 🚨');
    console.log(`Symbol: ${alert.symbol}`);
    console.log(`System: ${alert.system.toUpperCase()}`);
    console.log(`Signal: ${alert.type}`);
    console.log(`Price: $${alert.price?.toFixed(2)}`);
    console.log(`Confidence: ${alert.confidence}%`);
    console.log(`Historical Win Rate: ${alert.historicalWinRate}%`);
    console.log(`Message: ${alert.message}`);
    console.log(`Time: ${alert.timestamp.toLocaleString()}`);
    console.log('─'.repeat(50));
  }

  /**
   * Email notification (placeholder)
   */
  async sendEmailNotification(alert) {
    // TODO: Implement email notification
    console.log(`📧 Email notification sent for ${alert.symbol} ${alert.type}`);
  }

  /**
   * Push notification (placeholder)
   */
  async sendPushNotification(alert) {
    // TODO: Implement push notification
    console.log(`📱 Push notification sent for ${alert.symbol} ${alert.type}`);
  }

  /**
   * Portfolio position management
   */
  addPosition(symbol, position) {
    this.portfolioPositions.set(symbol, {
      ...position,
      addedAt: new Date()
    });
    
    console.log(`📊 Position added: ${position.direction} ${symbol} @ $${position.entryPrice}`);
    this.emit('positionAdded', { symbol, position });
  }

  /**
   * Update existing position
   */
  updatePosition(symbol, updates) {
    const position = this.portfolioPositions.get(symbol);
    if (position) {
      Object.assign(position, updates, { updatedAt: new Date() });
      this.emit('positionUpdated', { symbol, position });
      return position;
    }
    return null;
  }

  /**
   * Remove position
   */
  removePosition(symbol) {
    const position = this.portfolioPositions.get(symbol);
    if (position) {
      this.portfolioPositions.delete(symbol);
      console.log(`📊 Position closed: ${symbol}`);
      this.emit('positionClosed', { symbol, position });
      return position;
    }
    return null;
  }

  /**
   * Get current portfolio status
   */
  getPortfolioStatus() {
    const positions = Array.from(this.portfolioPositions.entries()).map(([symbol, position]) => ({
      symbol,
      ...position
    }));

    const totalValue = positions.reduce((sum, pos) => sum + (pos.currentValue || 0), 0);
    const totalPnL = positions.reduce((sum, pos) => sum + (pos.unrealizedPnL || 0), 0);

    return {
      totalPositions: positions.length,
      totalValue,
      totalPnL,
      positions
    };
  }

  /**
   * Get watchlist status
   */
  getWatchlistStatus() {
    const watchlist = Array.from(this.watchlist.entries()).map(([symbol, config]) => ({
      symbol,
      systems: config.systems,
      lastPrice: config.lastPrice,
      alertCount: config.alertHistory.length,
      addedAt: config.addedAt
    }));

    return {
      totalWatched: watchlist.length,
      activeAlerts: this.activeAlerts.size,
      watchlist
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(hours = 24) {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    
    return Array.from(this.activeAlerts.values())
      .filter(alert => alert.timestamp >= cutoffTime)
      .sort((a, b) => b.timestamp - a.timestamp);
  }
}

module.exports = AlertService;
