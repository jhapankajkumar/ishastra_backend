/**
 * 🚨 UNIFIED ALERT SERVICE
 * 
 * Handles both Position Alerts and Watchlist Entry Alerts
 * Provides unified interface for:
 * - Manual checking (API endpoints)
 * - Automated monitoring (cron jobs)
 * - Email notifications
 */

const SimpleAlertService = require('./simpleAlertService');
const WatchlistTriggerService = require('./watchlist.trigger.service');
const EmailService = require('./email.service');

class AlertService {
  constructor() {
    this.positionAlerts = new SimpleAlertService();
    this.watchlistTriggers = new WatchlistTriggerService();
    this.emailService = new EmailService();
  }

  /**
   * CHECK POSITION ALERTS (existing trades)
   * Returns: Stop hits, profit targets, etc.
   */
  async checkPositionAlerts() {
    try {
      console.log('🔍 Checking position alerts...');

      const alerts = await this.getPositionAlerts();

      // Filter only actionable alerts
      const actionableAlerts = alerts.filter(alert =>
        alert.type === 'STOP_HIT' ||
        alert.type === 'TAKE_PROFITS' ||
        alert.type === 'PARTIAL_PROFITS'
      );

      return {
        success: true,
        alertType: 'POSITION_ALERTS',
        count: actionableAlerts.length,
        alerts: actionableAlerts,
        message: actionableAlerts.length > 0 ?
          `${actionableAlerts.length} action(s) required on positions` :
          'No position alerts',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Position alerts error:', error);
      return {
        success: false,
        alertType: 'POSITION_ALERTS',
        count: 0,
        alerts: [],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
 * ONLY method for position alerts - BRUTAL SIMPLICITY
 */
  async getPositionAlerts() {
    const alerts = [];
    const openTrades = await this.getOpenTrades();

    for (const trade of openTrades) {
      const currentPrice = trade.currentPrice || trade.entryPrice;
      const stopLoss = trade.stopLoss || 0;
      const entryPrice = trade.entryPrice || 0;
      const percentGain = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;

      console.log(`📊 ${trade.ticker}: Price $${currentPrice}, Entry $${entryPrice}, Stop $${stopLoss}, Gain ${percentGain.toFixed(1)}%`);

      // ALERT 1: STOP LOSS HIT
      if (currentPrice <= stopLoss && stopLoss > 0) {
        alerts.push({
          type: 'STOP_HIT',
          ticker: trade.ticker,
          message: `🚨 ${trade.ticker} STOP HIT: Sell ${trade.quantity} shares immediately`,
          priority: 'EMERGENCY',
          action: 'EXIT_NOW',
          trade: {
            id: trade.id,
            currentPrice,
            stopLoss,
            quantity: trade.quantity
          }
        });
      }

      // ALERT 2: 15% GAIN = TAKE PROFITS
      else if (percentGain >= 15) {
        const sharesToSell = Math.floor(trade.quantity * 0.5); // 50%
        const remainingShares = trade.quantity - sharesToSell;

        alerts.push({
          type: 'TAKE_PROFITS',
          ticker: trade.ticker,
          message: `💰 ${trade.ticker} up ${percentGain.toFixed(1)}% - Sell ${sharesToSell} shares, keep ${remainingShares}`,
          priority: 'HIGH',
          action: 'PARTIAL_SELL',
          trade: {
            id: trade.id,
            currentPrice,
            entryPrice,
            sharesToSell,
            remainingShares,
            profitToLock: Math.round((currentPrice - entryPrice) * sharesToSell)
          }
        });
      }

      // ALERT 3: 8% GAIN = PARTIAL PROFITS
      else if (percentGain >= 8) {
        const sharesToSell = Math.floor(trade.quantity * 0.3); // 30%
        const remainingShares = trade.quantity - sharesToSell;

        alerts.push({
          type: 'PARTIAL_PROFITS',
          ticker: trade.ticker,
          message: `📈 ${trade.ticker} up ${percentGain.toFixed(1)}% - Consider selling ${sharesToSell} shares`,
          priority: 'MEDIUM',
          action: 'CONSIDER_PARTIAL_SELL',
          trade: {
            id: trade.id,
            currentPrice,
            entryPrice,
            sharesToSell,
            remainingShares,
            profitToLock: Math.round((currentPrice - entryPrice) * sharesToSell)
          }
        });
      }

      // NO OTHER ALERTS - TRUST YOUR SYSTEM
    }

    return alerts;
  }


  // Simple helper methods
  async getOpenTrades() {
    return await prisma.trade.findMany({
      where: { status: { in: ['Open', 'Partial Closed'] } },
      select: {
        id: true,
        ticker: true,
        entryPrice: true,
        currentPrice: true,
        quantity: true,
        stopLoss: true,
        createdAt: true,
        entryDate: true
      }
    });
  }

  /**
   * CHECK WATCHLIST ENTRY ALERTS 
   * Returns: Entry triggers for watchlist stocks
   */
  async checkWatchlistAlerts() {
    try {
      console.log('🔍 Checking watchlist entry triggers...');

      const entryTriggers = await this.watchlistTriggers.getWatchlistTriggers();


      // Format alerts for API response
      const alerts = [];
      if (entryTriggers.alerts && entryTriggers.alerts.length > 0) {
        entryTriggers.alerts.forEach(alertData => {
          alerts.push({
            symbol: alertData.symbol,
            type: 'ENTRY_TRIGGER',
            message: `Entry conditions met: ${alertData.triggers} trigger(s) activated`,
            priority: 'HIGH',
            currentPrice: alertData.price,
            triggersCount: alertData.triggers,
            timestamp: new Date()
          });
        });
      }

      return {
        success: true,
        alertType: 'WATCHLIST_ENTRY_TRIGGERS',
        triggerCounts: entryTriggers.triggerCounts,
        alerts,
        rawData: entryTriggers, // Include raw data for debugging
        message: entryTriggers.triggerCounts.immediate > 0 ?
          `${entryTriggers.triggerCounts.immediate} immediate entry signal(s) found!` :
          entryTriggers.triggerCounts.total > 0 ?
            `${entryTriggers.triggerCounts.waiting} stock(s) monitored, no triggers yet` :
            'No stocks being monitored',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Watchlist alerts error:', error);
      return {
        success: false,
        alertType: 'WATCHLIST_ENTRY_TRIGGERS',
        triggerCounts: { immediate: 0, near: 0, waiting: 0, total: 0 },
        alerts: [],
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
  /**
   * GET ALL ALERTS (combined view for dashboard)
   */
  async getAllAlerts() {
    try {
      const [positionResult, watchlistResult] = await Promise.all([
        this.checkPositionAlerts(),
        this.checkWatchlistAlerts()
      ]);

      return {
        success: true,
        summary: {
          positionAlerts: positionResult.count,
          watchlistTriggers: watchlistResult.triggerCounts.immediate,
          totalMonitored: watchlistResult.triggerCounts.total
        },
        positionAlerts: positionResult,
        watchlistAlerts: watchlistResult,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Get all alerts error:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  
}

module.exports = AlertService;
