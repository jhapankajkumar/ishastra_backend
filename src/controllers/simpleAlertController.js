/**
 * 📊 BRUTALLY SIMPLE POSITION ALERTS - NO BULLSHIT
 * 
 * TWO JOBS: 
 * 1. Check open positions and alert on big moves
 * 2. Check watchlist for entry triggers
 * NO AI. NO COMPLEX ANALYSIS. JUST PRICE-BASED ALERTS.
 */

const { PrismaClient } = require('@prisma/client');
const EntryTriggerService = require('../services/EntryTriggerService');

class SimpleAlertController {
    constructor() {
        this.db = new PrismaClient();
        this.entryTriggerService = new EntryTriggerService();
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
                    createdAt: true,
                    analysis: true  // Add analysis field for exit levels
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
        
        // Parse analysis data for exit levels
        let exitLevels = null;
        if (trade.analysis) {
            try {
                const analysisData = typeof trade.analysis === 'string' ? JSON.parse(trade.analysis) : trade.analysis;
                exitLevels = analysisData?.execution?.exitStrategy;
            } catch (e) {
                console.log(`⚠️ Could not parse analysis for ${trade.ticker}`);
            }
        }
        
        // 🚨 PRIORITY ALERT 1: STOP LOSS HIT
        if (exitLevels?.stopLoss?.initial && currentPrice <= exitLevels.stopLoss.initial) {
            return {
                ticker: trade.ticker,
                type: 'STOP_LOSS_HIT',
                priority: 'CRITICAL',
                message: `🚨 ${trade.ticker} STOP LOSS HIT at $${currentPrice} → SELL ALL IMMEDIATELY`,
                currentPrice: currentPrice,
                stopLoss: exitLevels.stopLoss.initial,
                daysHeld: daysHeld,
                action: 'SELL_ALL'
            };
        }
        
        // 🎯 PRIORITY ALERT 2: PROFIT TARGET HIT
        if (exitLevels?.targets?.conservative && currentPrice >= exitLevels.targets.conservative) {
            return {
                ticker: trade.ticker,
                type: 'PROFIT_TARGET_HIT',
                priority: 'HIGH',
                message: `🎯 ${trade.ticker} HIT PROFIT TARGET at $${currentPrice} → SELL 50%`,
                currentPrice: currentPrice,
                target: exitLevels.targets.conservative,
                daysHeld: daysHeld,
                action: 'SELL_50_PERCENT'
            };
        }
        
        // ⚠️ PRIORITY ALERT 3: EARLY WARNING
        if (exitLevels?.systemExits?.momentumLoss?.trigger) {
            const earlyWarningPrice = parseFloat(exitLevels.systemExits.momentumLoss.trigger.replace('Price below ', ''));
            if (!isNaN(earlyWarningPrice) && currentPrice <= earlyWarningPrice) {
                return {
                    ticker: trade.ticker,
                    type: 'EARLY_WARNING',
                    priority: 'HIGH',
                    message: `⚠️ ${trade.ticker} EARLY WARNING at $${currentPrice} → CONSIDER 50% EXIT`,
                    currentPrice: currentPrice,
                    warningLevel: earlyWarningPrice,
                    daysHeld: daysHeld,
                    action: 'CONSIDER_50_PERCENT_EXIT'
                };
            }
        }
        
        // ⏰ PRIORITY ALERT 4: MAX HOLD PERIOD
        const maxHold = exitLevels?.timeBasedExits?.maxHoldPeriod || 22;
        if (daysHeld >= maxHold) {
            return {
                ticker: trade.ticker,
                type: 'MAX_HOLD_PERIOD',
                priority: 'MEDIUM',
                message: `⏰ ${trade.ticker} HELD ${daysHeld} DAYS (Max: ${maxHold}) → REVIEW FOR FULL EXIT`,
                daysHeld: daysHeld,
                maxHold: maxHold,
                action: 'REVIEW_FULL_EXIT'
            };
        }
        
        // FALLBACK TO PERCENTAGE-BASED ALERTS (Lower Priority)
        
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
     * 🎯 GET WATCHLIST ENTRY ALERTS - CONTROLLER METHOD
     * Checks watchlist stocks for entry trigger conditions
     */
    async getWatchlistAlerts() {
        try {
            console.log('🎯 Getting watchlist entry alerts...');
            
            // Check entry triggers for all watchlist stocks
            const entryTriggers = await this.entryTriggerService.checkEntryTriggers();
            
            // Count different types of triggers based on actual EntryTriggerService response
            const triggerCounts = {
                immediate: entryTriggers.triggered || 0,
                near: 0, // Not implemented yet
                waiting: (entryTriggers.monitored || 0) - (entryTriggers.triggered || 0),
                total: entryTriggers.monitored || 0
            };

            // Format alerts for API response (DO NOT SEND EMAILS)
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
                        timestamp: new Date(),
                        note: 'Detailed email already sent by cron job'
                    });
                });
            }

            console.log('✅ Watchlist entry check completed:', {
                monitored: triggerCounts.total,
                triggered: triggerCounts.immediate,
                waiting: triggerCounts.waiting
            });

            return {
                success: true,
                alertType: 'WATCHLIST_ENTRY_TRIGGERS',
                triggerCounts,
                alerts,
                rawData: entryTriggers, // Include raw data for debugging
                message: triggerCounts.immediate > 0 ? 
                    `${triggerCounts.immediate} immediate entry signal(s) found!` :
                    triggerCounts.total > 0 ?
                    `${triggerCounts.waiting} stock(s) monitored, no triggers yet` :
                    'No stocks being monitored',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Error getting watchlist alerts:', error);
            return {
                success: false,
                error: error.message,
                alerts: [],
                triggerCounts: { immediate: 0, near: 0, waiting: 0, total: 0 },
                timestamp: new Date().toISOString()
            };
        }
    }

}

module.exports = SimpleAlertController;
