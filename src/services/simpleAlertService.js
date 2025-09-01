/**
 * SIMPLE ALERT SERVICE - BRUTAL SIMPLICITY
 * 
 * ONLY 3 ALERT TYPES:
 * 1. STOP HIT → EXIT NOW
 * 2. TARGET HIT → TAKE PROFITS  
 * 3. WEEKLY REVIEW → SATURDAY ONLY
 * 
 * NO AI analysis
 * NO health scores
 * NO daily changes
 * NO decision fatigue
 */

const { PrismaClient } = require('@prisma/client');
const { calculateUnrealizedPnL } = require('../utils/tradeCalculations');

const prisma = new PrismaClient();

class SimpleAlertService {
  constructor() {
    this.name = 'SIMPLE_ALERTS';
  }

  /**
   * ONLY method for position alerts - BRUTAL SIMPLICITY
   */
  async checkPositionAlerts() {
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

  /**
   * Saturday morning weekly review
   */
  async weeklyReview() {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Only run on Saturday (6) or Sunday (0)
    if (dayOfWeek !== 6 && dayOfWeek !== 0) {
      return {
        message: `Weekly review only runs on Saturday/Sunday. Today is ${this.getDayName(dayOfWeek)}.`,
        alerts: []
      };
    }

    console.log('\n🗓️  SATURDAY WEEKLY REVIEW - 30 MINUTES MAX\n');
    
    const openTrades = await this.getOpenTrades();
    const summary = {
      totalPositions: openTrades.length,
      stopHits: 0,
      profitTakers: 0,
      stalePositions: 0,
      actions: []
    };
    
    for (const trade of openTrades) {
      const currentPrice = trade.currentPrice || trade.entryPrice;
      const stopLoss = trade.stopLoss || 0;
      const entryPrice = trade.entryPrice || 0;
      const percentGain = entryPrice > 0 ? ((currentPrice - entryPrice) / entryPrice) * 100 : 0;
      const daysHeld = Math.floor((Date.now() - new Date(trade.entryDate || trade.createdAt)) / (1000 * 60 * 60 * 24));
      
      let status = '✅ HOLD';
      let action = 'Continue holding';
      
      if (currentPrice <= stopLoss && stopLoss > 0) {
        status = '🚨 STOP HIT';
        action = 'EXIT MONDAY';
        summary.stopHits++;
      } else if (percentGain >= 15) {
        status = '💰 TAKE PROFITS';
        action = 'Sell 50% Monday';
        summary.profitTakers++;
      } else if (percentGain >= 8) {
        status = '📈 PARTIAL PROFITS';
        action = 'Consider selling 30%';
      } else if (daysHeld > 60 && Math.abs(percentGain) < 3) {
        status = '⏳ STALE';
        action = 'Review strategy';
        summary.stalePositions++;
      }
      
      console.log(`${status} ${trade.ticker}: ${percentGain.toFixed(1)}% in ${daysHeld} days - ${action}`);
      
      if (status !== '✅ HOLD') {
        summary.actions.push({
          ticker: trade.ticker,
          status,
          action,
          percentGain: percentGain.toFixed(1),
          daysHeld
        });
      }
    }
    
    console.log(`\n📊 SUMMARY: ${summary.totalPositions} positions, ${summary.actions.length} actions needed\n`);
    
    return {
      summary,
      actions: summary.actions,
      nextReview: this.getNextSaturday()
    };
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

  getDayName(dayNumber) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNumber];
  }

  getNextSaturday() {
    const now = new Date();
    const daysUntilSaturday = (6 - now.getDay() + 7) % 7 || 7;
    const nextSaturday = new Date(now);
    nextSaturday.setDate(now.getDate() + daysUntilSaturday);
    return nextSaturday.toISOString().split('T')[0];
  }
}

module.exports = SimpleAlertService;
