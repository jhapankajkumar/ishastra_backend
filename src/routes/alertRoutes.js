/**
 * SIMPLIFIED ALERT ROUTES - Only 2 Endpoints You Actually Need
 * Based on real trading workflow: Position management + Watchlist opportunities
 */

const express = require('express');
const AlertService = require('../services/alertService');
const AutomatedAlertController = require('../controllers/automatedAlert.controller');

const router = express.Router();
const alertService = new AlertService();
const automatedAlerts = new AutomatedAlertController();

/**
 * 📊 POSITION ALERTS - For Stocks You Own
 * GET /api/alerts/positions
 * 
 * Returns alerts for your open trades:
 * - 🚨 "AAPL changed from BUY → WATCH" (signal breakdowns)
 * - 📊 "TSLA up 22% - consider profit" (major gains/losses) 
 * - 📈 "MSFT confidence: 75% → 85%" (signal strengthening on owned stocks)
 */
router.get('/positions', async (req, res) => {
    try {
        // Get alerts for stocks you actually own
        const tradeAlerts = await alertService.checkOpenTradeAlerts();
        
        // Get signal changes for owned stocks only  
        const positionSignalAlerts = await automatedAlerts.getPositionSignalAlerts();
        
        const allPositionAlerts = [
            ...tradeAlerts,
            ...positionSignalAlerts
        ];
        
        res.json({
            success: true,
            alertType: 'POSITION_ALERTS',
            count: allPositionAlerts.length,
            alerts: allPositionAlerts,
            summary: {
                signal_breakdowns: positionSignalAlerts.filter(a => a.category === 'SIGNAL_BREAKDOWN').length,
                major_gains: tradeAlerts.filter(a => a.category === 'MAJOR_GAIN').length,
                major_losses: tradeAlerts.filter(a => a.category === 'MAJOR_LOSS').length,
                signal_strengthening: positionSignalAlerts.filter(a => a.category === 'SIGNAL_STRENGTHENING').length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🎯 WATCHLIST ALERTS - For Stocks You're Tracking  
 * GET /api/alerts/watchlist
 * 
 * Returns alerts for your watchlist stocks:
 * - ⚡ "NVDA new BUY signal (A+ grade)" (new opportunities)
 * - 📈 "MSFT confidence: 75% → 85%" (signal strengthening on watchlist)
 * - 💰 Only shows opportunities you can afford
 */
router.get('/watchlist', async (req, res) => {
    try {
        const { availableCapital = 50000 } = req.query;
        
        // Get alerts for watchlist stocks only
        const watchlistAlerts = await automatedAlerts.getWatchlistAlerts(availableCapital);
        
        res.json({
            success: true,
            alertType: 'WATCHLIST_ALERTS', 
            count: watchlistAlerts.length,
            alerts: watchlistAlerts,
            availableCapital: availableCapital,
            summary: {
                new_opportunities: watchlistAlerts.filter(a => a.category === 'NEW_OPPORTUNITY').length,
                signal_strengthening: watchlistAlerts.filter(a => a.category === 'SIGNAL_STRENGTHENING').length,
                affordable_count: watchlistAlerts.filter(a => a.affordable).length
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🤖 GENERATE ALL ALERTS - Complete Alert System
 * GET /api/alerts/generate
 * 
 * Returns comprehensive alert system:
 * - Position alerts (for owned stocks)
 * - Watchlist alerts (for tracking stocks)
 * - Signal history tracking
 * - Complete 4-alert architecture
 */
router.get('/generate', async (req, res) => {
    try {
        const { availableCapital = 50000 } = req.query;
        
        // Get all position alerts
        const tradeAlerts = await alertService.checkOpenTradeAlerts();
        const positionSignalAlerts = await automatedAlerts.getPositionSignalAlerts();
        
        // Get all watchlist alerts
        const watchlistAlerts = await automatedAlerts.getWatchlistAlerts(availableCapital);
        
        // Combine all alerts
        const allAlerts = [
            ...tradeAlerts,
            ...positionSignalAlerts,
            ...watchlistAlerts
        ];
        
        // Categorize alerts
        const alertCategories = {
            profitTaking: tradeAlerts.filter(a => a.category === 'MAJOR_GAIN'),
            riskManagement: tradeAlerts.filter(a => a.category === 'MAJOR_LOSS'),
            signalBreakdown: [...positionSignalAlerts, ...watchlistAlerts].filter(a => a.category === 'SIGNAL_BREAKDOWN'),
            signalStrengthening: [...positionSignalAlerts, ...watchlistAlerts].filter(a => a.category === 'SIGNAL_STRENGTHENING'),
            newOpportunities: watchlistAlerts.filter(a => a.category === 'NEW_OPPORTUNITY')
        };
        
        res.json({
            success: true,
            alertType: 'COMPREHENSIVE_ALERTS',
            totalAlerts: allAlerts.length,
            availableCapital: availableCapital,
            alerts: {
                positions: {
                    count: tradeAlerts.length + positionSignalAlerts.length,
                    alerts: [...tradeAlerts, ...positionSignalAlerts]
                },
                watchlist: {
                    count: watchlistAlerts.length,
                    alerts: watchlistAlerts
                }
            },
            categories: {
                profitTaking: {
                    count: alertCategories.profitTaking.length,
                    alerts: alertCategories.profitTaking
                },
                riskManagement: {
                    count: alertCategories.riskManagement.length,
                    alerts: alertCategories.riskManagement
                },
                signalBreakdown: {
                    count: alertCategories.signalBreakdown.length,
                    alerts: alertCategories.signalBreakdown
                },
                signalStrengthening: {
                    count: alertCategories.signalStrengthening.length,
                    alerts: alertCategories.signalStrengthening
                },
                newOpportunities: {
                    count: alertCategories.newOpportunities.length,
                    alerts: alertCategories.newOpportunities
                }
            },
            summary: {
                totalByType: {
                    position_alerts: tradeAlerts.length + positionSignalAlerts.length,
                    watchlist_alerts: watchlistAlerts.length
                },
                totalByCategory: {
                    profit_taking: alertCategories.profitTaking.length,
                    risk_management: alertCategories.riskManagement.length,
                    signal_breakdown: alertCategories.signalBreakdown.length,
                    signal_strengthening: alertCategories.signalStrengthening.length,
                    new_opportunities: alertCategories.newOpportunities.length
                }
            }
        });
    } catch (error) {
        console.error('Error generating comprehensive alerts:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message,
            alertType: 'COMPREHENSIVE_ALERTS'
        });
    }
});

module.exports = router;
