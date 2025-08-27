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

module.exports = router;
