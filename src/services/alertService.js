/**
 * ALERT SERVICE - Separate from Watchlist Manager
 * Focus: API-driven alerts for signal changes and trade monitoring
 * 
 * Clean separation of concerns:
 * - WatchlistManager: Signal analysis only
 * - AlertService: Alert generation and delivery
 * - TradeMonitor: Open position monitoring
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class AlertService {
    constructor() {
        this.alertTypes = {
            CRITICAL: { priority: 1, channels: ['api', 'websocket'] },
            URGENT: { priority: 2, channels: ['api'] },
            IMPORTANT: { priority: 3, channels: ['api'] }
        };
        
        this.alertCooldowns = new Map();
        this.activeSubscriptions = new Map(); // WebSocket connections
    }

    /**
     * 🚨 CRITICAL ALERTS - Position Risk & Signal Breakdowns
     * Triggered via API/WebSocket for immediate action
     */
    async checkCriticalAlerts(currentSignals, previousSignals) {
        const criticalAlerts = [];
        
        // Get open/partial trades for position risk monitoring
        const openTrades = await this.getOpenTrades();
        
        for (const trade of openTrades) {
            const currentSignal = currentSignals.find(s => s.symbol === trade.ticker);
            const previousSignal = previousSignals[trade.ticker];
            
            if (currentSignal && previousSignal) {
                // CRITICAL: BUY signal degraded to AVOID/SELL
                if (this.isSignalBreakdown(previousSignal, currentSignal)) {
                    criticalAlerts.push({
                        type: 'CRITICAL',
                        category: 'SIGNAL_BREAKDOWN',
                        ticker: trade.ticker,
                        message: `${trade.ticker} signal breakdown: ${previousSignal.action} → ${currentSignal.decision.action}`,
                        trade: {
                            id: trade.id,
                            entryPrice: trade.entryPrice,
                            currentPrice: trade.currentPrice,
                            quantity: trade.quantity,
                            unrealizedPnL: this.calculateUnrealizedPnL(trade),
                            status: trade.status
                        },
                        signal: {
                            previous: previousSignal,
                            current: currentSignal.decision
                        },
                        urgency: 'IMMEDIATE',
                        actionRequired: 'REVIEW_POSITION',
                        timestamp: new Date()
                    });
                }
            }
        }
        
        return criticalAlerts;
    }

    /**
     * ⚡ URGENT ALERTS - Institutional Opportunities
     * New high-grade signals for stocks you can afford
     */
    async checkUrgentAlerts(currentSignals, availableCapital = 50000) {
        const urgentAlerts = [];
        
        // Get current positions to avoid duplicate alerts
        const openTrades = await this.getOpenTrades();
        const positionTickers = openTrades.map(t => t.ticker);
        
        // Find institutional-grade opportunities
        const opportunities = currentSignals.filter(signal => 
            signal.decision.action === 'BUY' &&
            signal.signal_quality === 'INSTITUTIONAL_GRADE' &&
            signal.decision.confidence >= 0.8 &&
            !positionTickers.includes(signal.symbol) // No existing position
        );
        
        for (const opportunity of opportunities) {
            const estimatedCost = this.estimatePositionCost(opportunity);
            
            // Only alert if affordable
            if (estimatedCost <= availableCapital) {
                urgentAlerts.push({
                    type: 'URGENT',
                    category: 'INSTITUTIONAL_OPPORTUNITY',
                    ticker: opportunity.symbol,
                    message: `${opportunity.symbol}: Institutional-grade BUY signal (${opportunity.decision.grade}, ${(opportunity.decision.confidence * 100).toFixed(0)}% confidence)`,
                    signal: {
                        action: opportunity.decision.action,
                        grade: opportunity.decision.grade,
                        confidence: opportunity.decision.confidence,
                        quality: opportunity.signal_quality,
                        universe: opportunity.universe
                    },
                    estimatedCost: estimatedCost,
                    affordability: availableCapital >= estimatedCost,
                    urgency: 'WITHIN_1_HOUR',
                    actionRequired: 'CONSIDER_ENTRY',
                    timestamp: new Date()
                });
            }
        }
        
        return urgentAlerts;
    }

    /**
     * 📈 IMPORTANT ALERTS - Signal Evolution
     * Changes in signals for stocks you're tracking or own
     */
    async checkImportantAlerts(currentSignals, previousSignals) {
        const importantAlerts = [];
        
        // Get open trades and watchlist
        const openTrades = await this.getOpenTrades();
        const watchlistTickers = await this.getWatchlistTickers();
        const trackedTickers = [...new Set([...openTrades.map(t => t.ticker), ...watchlistTickers])];
        
        for (const ticker of trackedTickers) {
            const currentSignal = currentSignals.find(s => s.symbol === ticker);
            const previousSignal = previousSignals[ticker];
            
            if (currentSignal && previousSignal) {
                // Signal strengthening
                if (this.isSignalStrengthening(previousSignal, currentSignal)) {
                    const hasPosition = openTrades.some(t => t.ticker === ticker);
                    
                    importantAlerts.push({
                        type: 'IMPORTANT',
                        category: 'SIGNAL_STRENGTHENING',
                        ticker: ticker,
                        message: `${ticker} signal strengthening: ${previousSignal.action} → ${currentSignal.decision.action}`,
                        signal: {
                            previous: previousSignal,
                            current: currentSignal.decision,
                            improvement: this.calculateSignalImprovement(previousSignal, currentSignal)
                        },
                        hasPosition: hasPosition,
                        urgency: 'WITHIN_4_HOURS',
                        actionRequired: hasPosition ? 'MONITOR_FOR_ADDITION' : 'CONSIDER_ENTRY',
                        timestamp: new Date()
                    });
                }
            }
        }
        
        return importantAlerts;
    }

    /**
     * 📊 CAPITAL ALLOCATION RECOMMENDATIONS
     * How this would work in practice
     */
    generateCapitalAllocationRecommendation(opportunity, portfolio) {
        const baseAllocation = 5000; // Minimum position size
        const maxAllocation = 25000; // Maximum single position
        
        // Confidence-based sizing
        const confidenceMultiplier = opportunity.signal.confidence;
        const gradeMultiplier = this.getGradeMultiplier(opportunity.signal.grade);
        
        const recommendedAmount = Math.min(
            baseAllocation * confidenceMultiplier * gradeMultiplier,
            maxAllocation,
            portfolio.availableCapital * 0.1 // Max 10% of available capital
        );
        
        return {
            recommendedAmount: Math.round(recommendedAmount),
            rationale: `Based on ${opportunity.signal.grade} grade and ${(opportunity.signal.confidence * 100).toFixed(0)}% confidence`,
            riskLevel: this.getOpportunityRiskLevel(opportunity.signal.grade, opportunity.signal.confidence),
            maxSuggestedPosition: maxAllocation
        };
    }
    
    getGradeMultiplier(grade) {
        const multipliers = {
            'A+': 1.5, 'A': 1.3, 'A-': 1.1,
            'B+': 1.0, 'B': 0.9, 'B-': 0.8,
            'C+': 0.7, 'C': 0.6, 'C-': 0.5,
            'D': 0.3, 'F': 0.1
        };
        return multipliers[grade] || 0.5;
    }
    
    getOpportunityRiskLevel(grade, confidence) {
        if ((grade === 'A+' || grade === 'A') && confidence > 0.8) return 'LOW';
        if (grade.startsWith('B') && confidence > 0.7) return 'MEDIUM';
        return 'HIGH';
    }

    /**
     * 🔗 API INTEGRATION METHODS
     */
    
    // GET /api/alerts/critical
    async getCriticalAlerts(req, res) {
        try {
            const { currentSignals, previousSignals } = req.body;
            const alerts = await this.checkCriticalAlerts(currentSignals, previousSignals);
            
            // Send via WebSocket for immediate delivery
            this.broadcastCriticalAlerts(alerts);
            
            res.json({
                success: true,
                alertType: 'CRITICAL',
                count: alerts.length,
                alerts: alerts
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // GET /api/alerts/urgent  
    async getUrgentAlerts(req, res) {
        try {
            const { currentSignals, availableCapital = 50000 } = req.body;
            const alerts = await this.checkUrgentAlerts(currentSignals, availableCapital);
            
            res.json({
                success: true,
                alertType: 'URGENT',
                count: alerts.length,
                alerts: alerts
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // GET /api/alerts/important
    async getImportantAlerts(req, res) {
        try {
            const { currentSignals, previousSignals } = req.body;
            const alerts = await this.checkImportantAlerts(currentSignals, previousSignals);
            
            res.json({
                success: true,
                alertType: 'IMPORTANT', 
                count: alerts.length,
                alerts: alerts
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    // GET /api/alerts/trades/monitor
    async getTradeAlerts(req, res) {
        try {
            const alerts = await this.checkOpenTradeAlerts();
            
            res.json({
                success: true,
                alertType: 'TRADE_MONITORING',
                count: alerts.length,
                alerts: alerts
            });
        } catch (error) {
            res.status(500).json({ success: false, error: error.message });
        }
    }

    /**
     * 📈 OPEN/PARTIAL TRADE MONITORING
     * Specific alerts for your active positions
     */
    async checkOpenTradeAlerts() {
        const tradeAlerts = [];
        const openTrades = await this.getOpenTrades();
        
        for (const trade of openTrades) {
            const currentPrice = await this.getCurrentPrice(trade.ticker);
            const unrealizedPnL = this.calculateUnrealizedPnL(trade, currentPrice);
            const unrealizedPnLPct = (currentPrice - trade.entryPrice) / trade.entryPrice;
            
            // Major gain alert (20%+ profit)
            if (unrealizedPnLPct >= 0.2) {
                tradeAlerts.push({
                    type: 'TRADE_ALERT',
                    category: 'MAJOR_GAIN',
                    ticker: trade.ticker,
                    message: `${trade.ticker} up ${(unrealizedPnLPct * 100).toFixed(1)}% - consider profit taking`,
                    trade: {
                        id: trade.id,
                        entryPrice: trade.entryPrice,
                        currentPrice: currentPrice,
                        unrealizedPnL: unrealizedPnL,
                        unrealizedPnLPct: unrealizedPnLPct,
                        daysHeld: this.calculateDaysHeld(trade.createdAt)
                    },
                    actionSuggested: 'CONSIDER_PROFIT_TAKING',
                    timestamp: new Date()
                });
            }
            
            // Major loss alert (15%+ loss)
            if (unrealizedPnLPct <= -0.15) {
                tradeAlerts.push({
                    type: 'TRADE_ALERT',
                    category: 'MAJOR_LOSS',
                    ticker: trade.ticker,
                    message: `${trade.ticker} down ${Math.abs(unrealizedPnLPct * 100).toFixed(1)}% - review position`,
                    trade: {
                        id: trade.id,
                        entryPrice: trade.entryPrice,
                        currentPrice: currentPrice,
                        unrealizedPnL: unrealizedPnL,
                        unrealizedPnLPct: unrealizedPnLPct,
                        daysHeld: this.calculateDaysHeld(trade.createdAt)
                    },
                    actionSuggested: 'REVIEW_STOP_LOSS',
                    timestamp: new Date()
                });
            }
            
            // Stale position alert (held >90 days with no action)
            const daysHeld = this.calculateDaysHeld(trade.createdAt);
            if (daysHeld > 90 && Math.abs(unrealizedPnLPct) < 0.05) {
                tradeAlerts.push({
                    type: 'TRADE_ALERT',
                    category: 'STALE_POSITION',
                    ticker: trade.ticker,
                    message: `${trade.ticker} held ${daysHeld} days with minimal movement - review strategy`,
                    trade: {
                        id: trade.id,
                        daysHeld: daysHeld,
                        unrealizedPnLPct: unrealizedPnLPct
                    },
                    actionSuggested: 'REVIEW_POSITION_STRATEGY',
                    timestamp: new Date()
                });
            }
        }
        
        return tradeAlerts;
    }

    /**
     * 🔌 WEBSOCKET INTEGRATION for CRITICAL alerts
     */
    broadcastCriticalAlerts(alerts) {
        const message = {
            type: 'CRITICAL_ALERT',
            timestamp: new Date(),
            alerts: alerts
        };
        
        // Broadcast to all connected clients
        this.activeSubscriptions.forEach((ws, clientId) => {
            if (ws.readyState === 1) { // WebSocket.OPEN
                ws.send(JSON.stringify(message));
            }
        });
    }

    // Helper methods
    async getOpenTrades() {
        return await prisma.trade.findMany({
            where: { status: { in: ['Open', 'Partial Closed'] } },
            select: {
                id: true,
                ticker: true,
                entryPrice: true,
                currentPrice: true,
                quantity: true,
                status: true,
                createdAt: true
            }
        });
    }

    async getWatchlistTickers() {
        const watchlist = await prisma.watchlistStock.findMany({
            select: { symbol: true }
        });
        return watchlist.map(w => w.symbol);
    }

    isSignalBreakdown(previous, current) {
        return (previous.action === 'BUY' || previous.action === 'STRONG_BUY') &&
               (current.decision.action === 'AVOID' || current.decision.action === 'SELL');
    }

    isSignalStrengthening(previous, current) {
        const prevRank = this.getSignalRank(previous.action);
        const currRank = this.getSignalRank(current.decision.action);
        return currRank > prevRank || 
               (currRank === prevRank && current.decision.confidence > previous.confidence + 0.1);
    }

    getSignalRank(action) {
        const ranks = { 'STRONG_BUY': 5, 'BUY': 4, 'WATCH': 3, 'HOLD': 2, 'AVOID': 1, 'SELL': 0 };
        return ranks[action] || 0;
    }

    calculateUnrealizedPnL(trade, currentPrice = null) {
        const price = currentPrice || trade.currentPrice || trade.entryPrice;
        return (price - trade.entryPrice) * trade.quantity;
    }

    calculateDaysHeld(createdAt) {
        return Math.floor((Date.now() - new Date(createdAt)) / (1000 * 60 * 60 * 24));
    }

    estimatePositionCost(signal) {
        // Simplified - would use current market price
        return 5000; // Default minimum position
    }

    getGradeMultiplier(grade) {
        const multipliers = {
            'A+': 1.5, 'A': 1.3, 'A-': 1.1,
            'B+': 1.0, 'B': 0.9, 'B-': 0.8,
            'C+': 0.7, 'C': 0.6
        };
        return multipliers[grade] || 0.8;
    }

    async getCurrentPrice(ticker) {
        // Would integrate with real-time price API
        return 100; // Mock price
    }
}

module.exports = AlertService;
