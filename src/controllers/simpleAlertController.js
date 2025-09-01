/**
 * 📊 BRUTALLY SIMPLE POSITION ALERTS - NO BULLSHIT
 * 
 * ONE JOB: Check open positions and alert on big moves
 * NO AI. NO COMPLEX ANALYSIS. JUST PRICE-BASED ALERTS.
 */

const { PrismaClient } = require('@prisma/client');

class SimpleAlertController {
    constructor() {
        this.db = new PrismaClient();
    }
    
    /**
     * 📊 GET POSITION ALERTS - SIMPLE & FAST
     * Only checks price movements on owned positions
     */
    async getPositionAlerts() {
        try {
            console.log('📊 Getting position alerts...');
            
            // Get open positions
            const openTrades = await this.db.trade.findMany({
                where: { status: { in: ['Open', 'Partial Closed'] } },
                select: { 
                    ticker: true, 
                    quantity: true,
                    entryPrice: true,
                    currentPrice: true,
                    createdAt: true
                }
            });
            
            if (openTrades.length === 0) {
                console.log('📊 No open positions found');
                return { success: true, alerts: [] };
            }
            
            console.log(`📊 Checking ${openTrades.length} open positions`);
            
            const alerts = [];
            
            for (const trade of openTrades) {
                const alert = this.checkPositionAlert(trade);
                if (alert) {
                    alerts.push(alert);
                }
            }
            
            console.log(`📊 Generated ${alerts.length} alerts`);
            return { 
                success: true, 
                alerts: alerts,
                totalPositions: openTrades.length,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            console.error('❌ Error getting position alerts:', error);
            return { 
                success: false, 
                error: error.message,
                alerts: []
            };
        }
    }

    /**
     * 📈 CHECK SINGLE POSITION - SIMPLE LOGIC
     */
    checkPositionAlert(trade) {
        const currentPrice = trade.currentPrice || trade.entryPrice;
        const pnlPercent = (currentPrice - trade.entryPrice) / trade.entryPrice;
        const daysHeld = Math.floor((Date.now() - new Date(trade.createdAt)) / (1000 * 60 * 60 * 24));
        const pnlAmount = (currentPrice - trade.entryPrice) * trade.quantity;
        
        // 🎉 BIG WINNER (20%+ gain)
        if (pnlPercent >= 0.20) {
            return {
                ticker: trade.ticker,
                type: 'BIG_WINNER',
                priority: 'HIGH',
                message: `🎉 ${trade.ticker} up ${(pnlPercent * 100).toFixed(1)}% (+$${pnlAmount.toFixed(0)}) - TAKE PROFITS!`,
                pnlPercent: Math.round(pnlPercent * 1000) / 10,
                pnlAmount: Math.round(pnlAmount),
                daysHeld: daysHeld,
                action: 'TAKE_PROFITS'
            };
        }
        
        // 🚨 BIG LOSER (15%+ loss)
        if (pnlPercent <= -0.15) {
            return {
                ticker: trade.ticker,
                type: 'BIG_LOSER',
                priority: 'CRITICAL',
                message: `🚨 ${trade.ticker} down ${(Math.abs(pnlPercent) * 100).toFixed(1)}% (-$${Math.abs(pnlAmount).toFixed(0)}) - CUT LOSSES!`,
                pnlPercent: Math.round(pnlPercent * 1000) / 10,
                pnlAmount: Math.round(pnlAmount),
                daysHeld: daysHeld,
                action: 'CUT_LOSSES'
            };
        }
        
        // 📈 GOOD WINNER (10%+ gain)
        if (pnlPercent >= 0.10) {
            return {
                ticker: trade.ticker,
                type: 'GOOD_WINNER',
                priority: 'MEDIUM',
                message: `📈 ${trade.ticker} up ${(pnlPercent * 100).toFixed(1)}% (+$${pnlAmount.toFixed(0)}) - consider partial profits`,
                pnlPercent: Math.round(pnlPercent * 1000) / 10,
                pnlAmount: Math.round(pnlAmount),
                daysHeld: daysHeld,
                action: 'CONSIDER_PROFITS'
            };
        }
        
        // ⚠️ CONCERNING LOSS (10%+ loss)
        if (pnlPercent <= -0.10) {
            return {
                ticker: trade.ticker,
                type: 'CONCERNING_LOSS',
                priority: 'HIGH',
                message: `⚠️ ${trade.ticker} down ${(Math.abs(pnlPercent) * 100).toFixed(1)}% (-$${Math.abs(pnlAmount).toFixed(0)}) - review position`,
                pnlPercent: Math.round(pnlPercent * 1000) / 10,
                pnlAmount: Math.round(pnlAmount),
                daysHeld: daysHeld,
                action: 'REVIEW_POSITION'
            };
        }
        
        // ⏰ STALE POSITION (60+ days, minimal movement)
        if (daysHeld >= 60 && Math.abs(pnlPercent) < 0.05) {
            return {
                ticker: trade.ticker,
                type: 'STALE_POSITION',
                priority: 'LOW',
                message: `⏰ ${trade.ticker} held ${daysHeld} days, flat performance - consider exit`,
                pnlPercent: Math.round(pnlPercent * 1000) / 10,
                pnlAmount: Math.round(pnlAmount),
                daysHeld: daysHeld,
                action: 'CONSIDER_EXIT'
            };
        }
        
        return null; // No alert needed
    }

    /**
     * 📊 GET POSITION SUMMARY - QUICK OVERVIEW
     */
    async getPositionSummary() {
        try {
            const openTrades = await this.db.trade.findMany({
                where: { status: { in: ['Open', 'Partial Closed'] } },
                select: { 
                    ticker: true, 
                    quantity: true,
                    entryPrice: true,
                    currentPrice: true
                }
            });
            
            if (openTrades.length === 0) {
                return { totalPositions: 0, totalValue: 0, totalPnL: 0 };
            }
            
            let totalValue = 0;
            let totalPnL = 0;
            let winners = 0;
            let losers = 0;
            
            for (const trade of openTrades) {
                const currentPrice = trade.currentPrice || trade.entryPrice;
                const positionValue = currentPrice * trade.quantity;
                const pnl = (currentPrice - trade.entryPrice) * trade.quantity;
                
                totalValue += positionValue;
                totalPnL += pnl;
                
                if (pnl > 0) winners++;
                else if (pnl < 0) losers++;
            }
            
            return {
                totalPositions: openTrades.length,
                totalValue: Math.round(totalValue),
                totalPnL: Math.round(totalPnL),
                winners: winners,
                losers: losers,
                winRate: openTrades.length > 0 ? Math.round((winners / openTrades.length) * 100) : 0
            };
            
        } catch (error) {
            console.error('❌ Error getting position summary:', error);
            return { error: error.message };
        }
    }
}

module.exports = SimpleAlertController;
