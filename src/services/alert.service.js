/**
 * 🚨 UNIFIED ALERT SERVICE
 * 
 * Handles both Position Alerts and Watchlist Entry Alerts
 * Provides unified interface for:
 * - Manual checking (API endpoints)
 * - Automated monitoring (cron jobs)
 * - Email notifications
 */

const WatchlistTriggerService = require('./watchlist.trigger.service');
const EmailService = require('./email.service');
const { PrismaClient } = require('@prisma/client');
const e = require('express');
const prisma = new PrismaClient();

class AlertService {
  constructor() {
    this.watchlistTriggers = new WatchlistTriggerService();
    this.emailService = new EmailService();
  }

  /**
   * CHECK POSITION ALERTS (existing trades)
   * Returns: Stop hits, profit targets, etc.
   */
  async checkPositionAlerts() {
    // try {
      
      // const alerts = await this.getPositionAlerts();

      // // Filter only actionable alerts
      // const actionableAlerts = alerts.filter(alert =>
      //   alert.type === 'STOP_HIT' ||
      //   alert.type === 'TAKE_PROFITS' ||
      //   alert.type === 'PARTIAL_PROFITS'
      // );

      // return {
      //   success: true,
      //   alertType: 'POSITION_ALERTS',
      //   count: actionableAlerts.length,
      //   alerts: actionableAlerts,
      //   message: actionableAlerts.length > 0 ?
      //     `${actionableAlerts.length} action(s) required on positions` :
      //     'No position alerts',
      //   timestamp: new Date().toISOString()
      // };

    // } catch (error) {
    //   console.error('❌ Position alerts error:', error);
    //   return {
    //     success: false,
    //     alertType: 'POSITION_ALERTS',
    //     count: 0,
    //     alerts: [],
    //     error: error.message,
    //     timestamp: new Date().toISOString()
    //   };
    // }
  }

  /**
 * ONLY method for position alerts - BRUTAL SIMPLICITY
 */
  async getPositionAlerts() {
    // const alerts = [];
    // const openTrades = await this.getOpenTrades();

    // for (const trade of openTrades) {
    //   const entryPrice = trade.entryPrice || 0;
    //   const currentPrice = trade.currentPrice || entryPrice;
    //   let stopLoss = Number.isFinite(trade.stopLoss) ? trade.stopLoss : 0;
    //   let riskPerShare = 0;
    //   if (stopLoss < entryPrice) {
    //     riskPerShare = entryPrice - stopLoss;  
    //   } else {
    //     riskPerShare = entryPrice - (entryPrice * 0.95); //max 5% risk if stop loss is invalid
    //   }
      
    //   const rMultiple = (currentPrice - stopLoss) / (riskPerShare || 1);
    //   if (Number.isFinite(rMultiple) && (rMultiple >= 2.0)) {
    //      let multiplier = 1
    //       if (rMultiple >= 3.0) multiplier = 2
    //       if (rMultiple >= 4.0) multiplier = 3
    //       if (rMultiple >= 5.0) multiplier = 4
    //       if (rMultiple >= 6.0) multiplier = 5
    //       if (rMultiple >= 7.0) multiplier = 6
    //       if (rMultiple >= 8.0) multiplier = 7
    //      stopLoss = stopLoss + (riskPerShare * multiplier);
    //      console.log(`🔄 TEST Adjusted stop loss for ${trade.ticker} to ${stopLoss.toFixed(2)} (R=${rMultiple.toFixed(2)})`);
    //      await prisma.trade.update({
    //       where: { id: trade.id },
    //       data: {
    //         stopLoss
    //       }
    //     });
    //   }
      
    //   let isAlerted = false;
    //   // ALERT 1: STOP LOSS HIT
    //   if (currentPrice <= stopLoss && stopLoss > 0) {
       
    //   }

    // }

    // return alerts;
  }


  // Simple helper methods
  calculateDynamicStopLoss({ entryPrice, currentPrice, currentStopLoss, direction, execution }) {
    const exitStrategy = execution?.exitStrategy;
    const stopConfig = exitStrategy?.stopLoss;

    if (!exitStrategy || !stopConfig || !entryPrice) {
      return { stopLoss: currentStopLoss, updated: false };
    }

    const stopNode = typeof stopConfig === 'object' ? stopConfig : { initial: stopConfig };
    const initialStopLoss = typeof stopNode.initial === 'number' ? stopNode.initial : currentStopLoss;

    if (!Number.isFinite(initialStopLoss) || !Number.isFinite(entryPrice) || entryPrice <= 0) {
      return { stopLoss: currentStopLoss, updated: false };
    }

    
    const fallbackStop = currentStopLoss
    const stopLossDistance = entryPrice - currentStopLoss;

    if (!Number.isFinite(stopLossDistance) || stopLossDistance <= 0) {
      return { stopLoss: fallbackStop, updated: false, initialStopLoss };
    }

    const activePrice = Number.isFinite(currentPrice) ? currentPrice : entryPrice;
    const favourableMove =  activePrice - entryPrice;

    if (!Number.isFinite(favourableMove) || favourableMove <= 0) {
      return { stopLoss: fallbackStop, updated: false, initialStopLoss, stopLossDistance };
    }

    const validCurrentStop = fallbackStop;
    const favorableMultiple = Math.floor(favourableMove / stopLossDistance);

    if (favorableMultiple < 1) {
      return {
        stopLoss: validCurrentStop,
        updated: false,
        initialStopLoss,
        stopLossDistance,
        favorableMultiple
      };
    }

    const stepsToLock = Math.max(0, favorableMultiple - 1);
    let desiredStopLoss =  entryPrice + stepsToLock * stopLossDistance;

    if (!Number.isFinite(desiredStopLoss)) {
      return {
        stopLoss: validCurrentStop,
        updated: false,
        initialStopLoss,
        stopLossDistance,
        favorableMultiple
      };
    }

    const current = validCurrentStop;
    const roundedStop = Number(desiredStopLoss.toFixed(2));
    const tolerance = 1e-4;
    const shouldUpdate = roundedStop > current + tolerance;

    if (!shouldUpdate) {
      return {
        stopLoss: current,
        updated: false,
        initialStopLoss,
        stopLossDistance,
        favorableMultiple
      };
    }

    return {
      stopLoss: roundedStop,
      updated: true,
      initialStopLoss,
      stopLossDistance,
      favorableMultiple,
      lastAdjusted: new Date().toISOString()
    };
  }

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
        entryDate: true,
        systemAnalysisResult: true
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
