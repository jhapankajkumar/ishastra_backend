/**
 * AUTOMATED ALERT CONTROLLER
 * Frontend just calls this - backend does all the signal comparison work
 */

const SignalHistoryService = require('../services/signalHistoryService');
const AlertService = require('../services/alertService');
const { PrismaClient } = require('@prisma/client');

class AutomatedAlertController {
    constructor() {
        this.signalHistoryService = new SignalHistoryService();
        this.alertService = new AlertService();
        this.db = new PrismaClient();
    }
    
    /**
     * 🤖 AUTOMATED ALERT GENERATION
     * GET /api/alerts/generate
     * 
     * Returns all types of alerts:
     * - Position alerts (stocks you own)
     * - Watchlist alerts (new opportunities)
     * - Signal change alerts
     */
    async generateAlerts(req, res) {
        try {
            const { type = 'all', availableCapital = 50000 } = req.query;
            
            let alerts = [];
            
            if (type === 'all' || type === 'positions') {
                const positionAlerts = await this.getPositionSignalAlerts();
                alerts.push(...positionAlerts);
            }
            
            if (type === 'all' || type === 'watchlist') {
                const watchlistAlerts = await this.getWatchlistAlerts(availableCapital);
                alerts.push(...watchlistAlerts);
            }
            
            // Sort by priority and timestamp
            alerts.sort((a, b) => {
                const priorityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 };
                return (priorityOrder[b.priority] || 1) - (priorityOrder[a.priority] || 1);
            });
            
            res.json({
                success: true,
                alertType: type.toUpperCase(),
                count: alerts.length,
                alerts: alerts,
                timestamp: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('❌ Error generating automated alerts:', error);
            res.status(500).json({ 
                success: false, 
                error: error.message,
                alertType: req.query.type || 'all',
                count: 0,
                alerts: []
            });
        }
    }
    
    /**
     * � POSITION SIGNAL ALERTS
     * Check signal changes for stocks you own (critical for risk management)
     */
    async getPositionSignalAlerts() {
        try {
            console.log('📊 Getting position signal alerts...');
            
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            
            // Get symbols of stocks you own
            const openTrades = await prisma.trade.findMany({
                where: { status: { in: ['Open', 'Partial Closed'] } },
                select: { 
                    ticker: true, 
                    quantity: true, 
                    remainingQuantity: true,
                    entryPrice: true,
                    currentPrice: true
                }
            });
            
            if (openTrades.length === 0) {
                console.log('📊 No open positions found');
                return [];
            }
            
            const ownedSymbols = [...new Set(openTrades.map(t => t.ticker))];
            console.log(`📊 Checking signals for ${ownedSymbols.length} owned symbols: ${ownedSymbols.join(', ')}`);
            
            // Get current AI analysis for owned positions
            const currentSignals = await this.getCurrentSignalsForSymbols(ownedSymbols);
            
            // If no current signals, try to use signal history for demonstration
            if (currentSignals.length === 0) {
                console.log('📊 No current signals found, checking signal history for demonstration...');
                return await this.getPositionSignalAlertsFromHistory(ownedSymbols, openTrades);
            }
            
            // Compare with previous signals to detect changes
            const signalAlerts = await this.signalHistoryService.generateAlertsFromSignalComparison(currentSignals);
            
            // Convert to position-focused alerts
            const positionAlerts = [];
            
            // Critical: Signal Breakdown (BUY → WATCH/AVOID)
            for (const alert of signalAlerts.critical) {
                if (alert.category === 'SIGNAL_BREAKDOWN') {
                    const tradeInfo = openTrades.find(t => t.ticker === alert.symbol);
                    positionAlerts.push({
                        type: 'TRADE_ALERT',
                        category: 'SIGNAL_BREAKDOWN',
                        ticker: alert.symbol,
                        priority: 'CRITICAL',
                        message: `🚨 ${alert.symbol}: POSITION RISK - Signal degraded ${alert.previous.action} → ${alert.current.action}`,
                        actionSuggested: 'REDUCE_POSITION',
                        intelligence: {
                            previousSignal: alert.previous,
                            currentSignal: alert.current,
                            alertReason: 'Signal breakdown detected',
                            context: 'risk_management',
                            confidence: 0.9
                        },
                        trade: tradeInfo ? {
                            remainingQuantity: tradeInfo.remainingQuantity || tradeInfo.quantity,
                            entryPrice: tradeInfo.entryPrice,
                            currentPrice: tradeInfo.currentPrice,
                            unrealizedPnL: tradeInfo.currentPrice && tradeInfo.entryPrice ? 
                                (tradeInfo.currentPrice - tradeInfo.entryPrice) * (tradeInfo.remainingQuantity || tradeInfo.quantity) : 0
                        } : null,
                        timestamp: alert.timestamp
                    });
                }
            }
            
            // Important: Signal Strengthening (Higher confidence on owned stocks)
            for (const alert of signalAlerts.important) {
                if (alert.category === 'SIGNAL_STRENGTHENING') {
                    const tradeInfo = openTrades.find(t => t.ticker === alert.symbol);
                    positionAlerts.push({
                        type: 'TRADE_ALERT',
                        category: 'SIGNAL_STRENGTHENING',
                        ticker: alert.symbol,
                        priority: 'MEDIUM',
                        message: `� ${alert.symbol}: Signal strengthening - Confidence ${alert.improvement.toFixed(1)}% higher`,
                        actionSuggested: 'CONSIDER_ADDING',
                        intelligence: {
                            improvementPercent: alert.improvement,
                            alertReason: 'Signal confidence increased',
                            context: 'position_optimization',
                            confidence: 0.75
                        },
                        trade: tradeInfo ? {
                            remainingQuantity: tradeInfo.remainingQuantity || tradeInfo.quantity,
                            entryPrice: tradeInfo.entryPrice,
                            currentPrice: tradeInfo.currentPrice
                        } : null,
                        timestamp: alert.timestamp
                    });
                }
            }
            
            console.log(`📊 Generated ${positionAlerts.length} position signal alerts`);
            return positionAlerts;
            
        } catch (error) {
            console.error('❌ Error getting position signal alerts:', error);
            return [];
        }
    }

    /**
     * 🔍 Get current AI signals for specific symbols
     */
    async getCurrentSignalsForSymbols(symbols) {
        try {
            const { generateExpertAIDecision, prepareAnalysisContext } = require('./ai/stock.expert.controller');
            
            const signals = [];
            
            for (const symbol of symbols) {
                try {
                    console.log(`🔍 Getting current signal for ${symbol}...`);
                    
                    // Get AI analysis for the symbol
                    const context = await prepareAnalysisContext(symbol);
                    const aiDecision = await generateExpertAIDecision(context);
                    
                    if (aiDecision && aiDecision.decision) {
                        signals.push({
                            symbol: symbol,
                            decision: {
                                action: aiDecision.decision.action || 'WATCH',
                                confidence: aiDecision.decision.confidence || 0.5,
                                grade: aiDecision.decision.grade || 'C',
                                reasoning: aiDecision.decision.reasoning || []
                            },
                            signal_quality: aiDecision.signal_quality || 'STANDARD',
                            universe: 'OWNED_POSITIONS',
                            systems: aiDecision.systems || [],
                            technicals: aiDecision.technicals || {}
                        });
                    }
                    
                } catch (symbolError) {
                    console.error(`❌ Error getting signal for ${symbol}:`, symbolError.message);
                }
            }
            
            console.log(`🔍 Retrieved ${signals.length} signals out of ${symbols.length} symbols`);
            return signals;
            
        } catch (error) {
            console.error('❌ Error getting current signals:', error);
            return [];
        }
    }
    
    /**
     * 🔍 WATCHLIST ALERTS - For stocks you don't own but should consider
     * Returns new BUY opportunities from your watchlist or market screening
     */
    async getWatchlistAlerts(availableCapital = 50000) {
        try {
            console.log(`🔍 Getting watchlist alerts with capital: $${availableCapital}`);
            
            // Get stocks you don't currently own
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            
            const openTrades = await prisma.trade.findMany({
                where: { status: { in: ['Open', 'Partial Closed'] } },
                select: { ticker: true }
            });
            
            const ownedSymbols = new Set(openTrades.map(t => t.ticker));
            console.log(`🔍 Avoiding ${ownedSymbols.size} already owned symbols`);
            
            // Get watchlist or screening candidates
            const watchlistSymbols = await this.getWatchlistSymbols(ownedSymbols);
            
            if (watchlistSymbols.length === 0) {
                console.log('🔍 No watchlist symbols found');
                return [];
            }
            
            // Get current signals for watchlist symbols
            const currentSignals = await this.getCurrentSignalsForSymbols(watchlistSymbols);
            
            if (currentSignals.length === 0) {
                console.log('🔍 No signals found for watchlist symbols');
                return [];
            }
            
            // Compare with previous signals to detect new opportunities
            const signalAlerts = await this.signalHistoryService.generateAlertsFromSignalComparison(currentSignals);
            
            const watchlistAlerts = [];
            
            // New BUY Opportunities
            for (const alert of signalAlerts.urgent) {
                if (alert.category === 'NEW_OPPORTUNITY') {
                    watchlistAlerts.push({
                        type: 'OPPORTUNITY_ALERT',
                        category: 'NEW_BUY_SIGNAL',
                        ticker: alert.symbol,
                        priority: 'HIGH',
                        message: `🚀 ${alert.symbol}: New ${alert.signal.action} signal - ${alert.signal.grade} grade, ${(alert.signal.confidence * 100).toFixed(0)}% confidence`,
                        actionSuggested: 'BUY',
                        intelligence: {
                            signal: alert.signal,
                            alertReason: 'New buy opportunity detected',
                            context: 'watchlist_screening',
                            confidence: alert.signal.confidence,
                            estimatedAllocation: this.calculatePositionSize(alert.signal, availableCapital)
                        },
                        timestamp: alert.timestamp
                    });
                }
            }
            
            // Signal Strengthening on Watchlist (move to higher priority)
            for (const alert of signalAlerts.important) {
                if (alert.category === 'SIGNAL_STRENGTHENING') {
                    watchlistAlerts.push({
                        type: 'OPPORTUNITY_ALERT',
                        category: 'SIGNAL_STRENGTHENING',
                        ticker: alert.symbol,
                        priority: 'MEDIUM',
                        message: `📈 ${alert.symbol}: Buy signal strengthening - Confidence up ${alert.improvement.toFixed(1)}%`,
                        actionSuggested: 'PRIORITIZE_BUY',
                        intelligence: {
                            improvementPercent: alert.improvement,
                            alertReason: 'Watchlist signal improving',
                            context: 'watchlist_prioritization',
                            confidence: 0.75
                        },
                        timestamp: alert.timestamp
                    });
                }
            }
            
            // Signal Breakdown on Watchlist (remove from consideration)
            for (const alert of signalAlerts.critical) {
                if (alert.category === 'SIGNAL_BREAKDOWN') {
                    watchlistAlerts.push({
                        type: 'OPPORTUNITY_ALERT',
                        category: 'REMOVE_FROM_WATCHLIST',
                        ticker: alert.symbol,
                        priority: 'LOW',
                        message: `📉 ${alert.symbol}: Removed from buy consideration - Signal degraded ${alert.previous.action} → ${alert.current.action}`,
                        actionSuggested: 'REMOVE_FROM_WATCHLIST',
                        intelligence: {
                            previousSignal: alert.previous,
                            currentSignal: alert.current,
                            alertReason: 'Watchlist signal breakdown',
                            context: 'watchlist_cleanup',
                            confidence: 0.8
                        },
                        timestamp: alert.timestamp
                    });
                }
            }
            
            console.log(`🔍 Generated ${watchlistAlerts.length} watchlist alerts`);
            return watchlistAlerts;
            
        } catch (error) {
            console.error('❌ Error getting watchlist alerts:', error);
            return [];
        }
    }

    /**
     * 🎯 Get watchlist symbols (excluding owned positions)
     */
    async getWatchlistSymbols(ownedSymbols) {
        try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            
            // Get from actual watchlist table if it exists
            const watchlistItems = await prisma.watchlistStock.findMany({
                where: {
                    symbol: { notIn: Array.from(ownedSymbols) }
                },
                select: { symbol: true },
                take: 10  // Limit to prevent too many API calls
            }).catch(() => []);

            let symbols = watchlistItems.map(item => item.symbol);
            
            // If no watchlist, use some default symbols for demo
            if (symbols.length === 0) {
                const defaultSymbols = [
                    'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
                    'HINDUNILVR.NS', 'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'KOTAKBANK.NS'
                ];
                symbols = defaultSymbols.filter(s => !ownedSymbols.has(s)).slice(0, 5);
            }
            
            console.log(`🎯 Using ${symbols.length} watchlist symbols: ${symbols.join(', ')}`);
            return symbols;        } catch (error) {
            console.error('❌ Error getting watchlist symbols:', error);
            return [];
        }
    }

    /**
     * 💰 Calculate position size based on signal quality and available capital
     */
    calculatePositionSize(signal, availableCapital) {
        const baseAllocation = 0.05; // 5% base allocation
        
        // Grade multiplier
        const gradeMultipliers = {
            'A+': 1.5, 'A': 1.3, 'A-': 1.2,
            'B+': 1.1, 'B': 1.0, 'B-': 0.9,
            'C+': 0.8, 'C': 0.7, 'C-': 0.6
        };
        
        const gradeMultiplier = gradeMultipliers[signal.grade] || 0.7;
        const confidenceMultiplier = signal.confidence;
        
        const allocation = Math.min(
            baseAllocation * gradeMultiplier * confidenceMultiplier,
            0.15  // Max 15% allocation
        );
        
        return {
            percentAllocation: (allocation * 100).toFixed(1),
            dollarAmount: (availableCapital * allocation).toFixed(0),
            rationale: `Based on ${signal.grade} grade and ${(signal.confidence * 100).toFixed(0)}% confidence`
        };
    }

    /**
     * 🔍 CHECK ALERTS ENDPOINT
     * GET /api/alerts/check
     */
    async checkAlerts(req, res) {
        try {
            const { symbol, type = 'all' } = req.query;
            
            if (symbol) {
                // Check alerts for specific symbol
                const alerts = await this.getSymbolAlerts(symbol);
                res.json({
                    success: true,
                    symbol: symbol,
                    count: alerts.length,
                    alerts: alerts
                });
            } else {
                // Check all alerts
                await this.generateAlerts(req, res);
            }
            
        } catch (error) {
            console.error('❌ Error checking alerts:', error);
            res.status(500).json({ success: false, error: error.message });
        }
    }
    
    /**
     * 📈 GET SYMBOL ALERTS
     * Check alerts for a specific symbol
     */
    async getSymbolAlerts(symbol) {
        try {
            console.log(`📈 Getting alerts for symbol: ${symbol}`);
            
            // Check if we own this symbol
            const isOwned = await this.hasOpenPosition(symbol);
            
            let alerts = [];
            
            if (isOwned) {
                // Get position alerts for owned symbol
                const positionAlerts = await this.getPositionSignalAlerts();
                alerts = positionAlerts.filter(alert => alert.ticker === symbol);
            } else {
                // Get watchlist alerts for non-owned symbol
                const watchlistAlerts = await this.getWatchlistAlerts();
                alerts = watchlistAlerts.filter(alert => alert.ticker === symbol);
            }
            
            console.log(`📈 Found ${alerts.length} alerts for ${symbol} (owned: ${isOwned})`);
            return alerts;
            
        } catch (error) {
            console.error(`❌ Error getting alerts for ${symbol}:`, error);
            return [];
        }
    }
    
    /**
     * 🔍 CHECK IF SYMBOL HAS OPEN POSITION
     */
    async hasOpenPosition(symbol) {
        try {
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            
            const openTrade = await prisma.trade.findFirst({
                where: { 
                    ticker: symbol,
                    status: { in: ['Open', 'Partial Closed'] }
                }
            });
            
            return !!openTrade;
            
        } catch (error) {
            console.error(`❌ Error checking position for ${symbol}:`, error);
            return false;
        }
    }
    
    /**
     * 🚨 GET RECENT CRITICAL ALERTS
     * Used by other services to check for recent critical alerts
     */
    async getRecentCriticalAlerts(hours = 24) {
        try {
            // This would check for critical alerts in the last X hours
            // For now, return empty array
            return [];
            
        } catch (error) {
            console.error('❌ Error getting recent critical alerts:', error);
            return [];
        }
    }
    
    async getPositionSignalAlertsFromHistory(ownedSymbols, openTrades) {
        console.log('🔍 Getting position alerts from signal history for symbols:', ownedSymbols);
        
        try {
            // Get recent signal history for owned symbols
            const recentHistory = await this.db.signalHistory.findMany({
                where: {
                    symbol: { in: ownedSymbols },
                    analysisTimestamp: {
                        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
                    }
                },
                orderBy: { analysisTimestamp: 'desc' },
                take: 100
            });

            if (recentHistory.length === 0) {
                console.log('📊 No signal history found for owned positions');
                return [];
            }

            // Generate alerts from signal history changes
            const alerts = this.generateAlertsFromHistoryChanges(recentHistory);
            
            // Convert to position alerts format
            const positionAlerts = this.convertSignalAlertsToPositionAlerts(alerts, openTrades);
            
            console.log(`🎯 Generated ${positionAlerts.length} position alerts from signal history`);
            return positionAlerts;
            
        } catch (error) {
            console.error('Error getting position alerts from history:', error);
            return [];
        }
    }

    generateAlertsFromHistoryChanges(historyRecords) {
        const alerts = [];
        const symbolGroups = {};
        
        // Group by symbol
        for (const record of historyRecords) {
            if (!symbolGroups[record.symbol]) {
                symbolGroups[record.symbol] = [];
            }
            symbolGroups[record.symbol].push(record);
        }
        
        // Check each symbol for signal breakdown
        for (const [symbol, records] of Object.entries(symbolGroups)) {
            if (records.length < 2) continue; // Need at least 2 records to compare
            
            // Sort by timestamp (most recent first)
            records.sort((a, b) => new Date(b.analysisTimestamp) - new Date(a.analysisTimestamp));
            
            const current = records[0];
            const previous = records[1];
            
            // Check for signal breakdown (BUY → WATCH/AVOID)
            if (this.isSignalBreakdown(previous, current)) {
                alerts.push({
                    type: 'CRITICAL',
                    category: 'SIGNAL_BREAKDOWN',
                    symbol: symbol,
                    message: `${symbol} signal breakdown: ${previous.action} → ${current.action}`,
                    signalChange: `${previous.action} → ${current.action}`,
                    previousSignal: {
                        action: previous.action,
                        confidence: previous.confidence,
                        grade: previous.grade,
                        timestamp: previous.analysisTimestamp
                    },
                    currentSignal: {
                        action: current.action,
                        confidence: current.confidence,
                        grade: current.grade
                    },
                    priority: 'HIGH',
                    timestamp: new Date()
                });
            }
        }
        
        return alerts;
    }

    isSignalBreakdown(previous, current) {
        const ranks = {
            'STRONG_BUY': 5,
            'BUY': 4,
            'WATCH': 3,
            'HOLD': 2,
            'AVOID': 1,
            'SELL': 0
        };
        
        const prevRank = ranks[previous.action] || 2;
        const currRank = ranks[current.action] || 2;
        
        // Signal breakdown: BUY/STRONG_BUY → WATCH/AVOID/SELL
        return prevRank >= 4 && currRank <= 3;
    }

    convertSignalAlertsToPositionAlerts(signalAlerts, openTrades) {
        const positionAlerts = [];
        
        // Handle array of alerts directly
        for (const alert of signalAlerts) {
            // Find matching open trade
            const relatedTrade = openTrades.find(trade => 
                trade.symbol === alert.symbol
            );
            
            if (relatedTrade) {
                const positionAlert = {
                    id: `pos_${alert.symbol}_${Date.now()}`,
                    symbol: alert.symbol,
                    type: 'SIGNAL_BREAKDOWN',
                    priority: alert.priority || 'HIGH',
                    message: alert.message,
                    details: {
                        signalChange: alert.signalChange,
                        previousSignal: alert.previousSignal,
                        currentSignal: alert.currentSignal,
                        tradeId: relatedTrade.id,
                        entryPrice: relatedTrade.entryPrice,
                        currentPrice: relatedTrade.currentPrice,
                        unrealizedPnL: relatedTrade.unrealizedPnL
                    },
                    createdAt: new Date(),
                    actionRequired: this.determineActionRequired(alert, relatedTrade)
                };
                
                positionAlerts.push(positionAlert);
            }
        }
        
        return positionAlerts;
    }

    determineActionRequired(alert, trade) {
        // Determine what action is recommended based on signal breakdown
        if (alert.signalChange?.includes('BUY → WATCH')) {
            return 'CONSIDER_PROFIT_TAKING';
        } else if (alert.signalChange?.includes('BUY → AVOID')) {
            return 'URGENT_EXIT_REVIEW';
        } else if (alert.signalChange?.includes('WATCH → AVOID')) {
            return 'MONITOR_CLOSELY';
        }
        return 'REVIEW_POSITION';
    }
    
    /**
     * 💰 ESTIMATE POSITION COST
     * Helper function to estimate how much capital a position would require
     */
    estimatePositionCost(alert) {
        try {
            const { currentPrice, suggestedQuantity } = alert;
            if (!currentPrice || !suggestedQuantity) return 0;
            
            return currentPrice * suggestedQuantity;
            
        } catch (error) {
            console.error('❌ Error estimating position cost:', error);
            return 0;
        }
    }
}

module.exports = AutomatedAlertController;
