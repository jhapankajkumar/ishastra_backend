/**
 * AUTOMATED ALERT CONTROLLER
 * Frontend just calls this - backend does all the signal comparison work
 */

const SignalHistoryService = require('../services/signalHistoryService');
const AlertService = require('../services/alertService');

class AutomatedAlertController {
    constructor() {
        this.signalHistory = new SignalHistoryService();
        this.alertService = new AlertService();
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
     * 📊 POSITION SIGNAL ALERTS - For stocks you own
     * Returns alerts for signal changes on positions you currently hold
     */
    async getPositionSignalAlerts() {
        try {
            console.log('📊 Getting position signal alerts...');
            
            const { PrismaClient } = require('@prisma/client');
            const prisma = new PrismaClient();
            
            // Get symbols of stocks you own
            const openTrades = await prisma.trade.findMany({
                where: { status: { in: ['Open', 'Partial Closed'] } },
                select: { ticker: true }
            });
            
            if (openTrades.length === 0) {
                console.log('📊 No open positions found');
                return [];
            }
            
            const ownedSymbols = [...new Set(openTrades.map(t => t.ticker))];
            console.log(`📊 Checking signals for ${ownedSymbols.length} owned symbols: ${ownedSymbols.join(', ')}`);
            
            // For now, return empty array but log that we're working on it
            // TODO: Implement signal change detection for owned positions
            console.log('📊 Signal change detection for positions - Implementation pending');
            
            return [];
            
        } catch (error) {
            console.error('❌ Error getting position signal alerts:', error);
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
            
            // For now, return empty array but log that we're working on it
            // TODO: Implement watchlist signal detection for new opportunities
            console.log('🔍 Watchlist opportunity detection - Implementation pending');
            
            return [];
            
        } catch (error) {
            console.error('❌ Error getting watchlist alerts:', error);
            return [];
        }
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
