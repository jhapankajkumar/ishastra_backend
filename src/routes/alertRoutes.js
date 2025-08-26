/**
 * ALERT SERVICE API ROUTES
 * Separate endpoints for different alert types
 */

const express = require('express');
const AlertService = require('../services/alertService');

const router = express.Router();
const alertService = new AlertService();

/**
 * 🚨 CRITICAL ALERTS - Position Risk & Signal Breakdowns
 * POST /api/alerts/critical
 */
router.post('/critical', async (req, res) => {
    await alertService.getCriticalAlerts(req, res);
});

/**
 * ⚡ URGENT ALERTS - Institutional Opportunities  
 * POST /api/alerts/urgent
 */
router.post('/urgent', async (req, res) => {
    await alertService.getUrgentAlerts(req, res);
});

/**
 * 📈 IMPORTANT ALERTS - Signal Evolution
 * POST /api/alerts/important  
 */
router.post('/important', async (req, res) => {
    await alertService.getImportantAlerts(req, res);
});

/**
 * 📊 TRADE MONITORING ALERTS - Open/Partial Positions
 * GET /api/alerts/trades/monitor
 */
router.get('/trades/monitor', async (req, res) => {
    await alertService.getTradeAlerts(req, res);
});

/**
 * 💰 CAPITAL ALLOCATION RECOMMENDATION
 * POST /api/alerts/capital-allocation
 */
router.post('/capital-allocation', async (req, res) => {
    try {
        const { opportunity, portfolio } = req.body;
        
        const recommendation = alertService.generateCapitalAllocationRecommendation(
            opportunity, 
            portfolio
        );
        
        res.json({
            success: true,
            ticker: opportunity.ticker,
            recommendation: recommendation
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 📋 ALL ALERTS SUMMARY
 * GET /api/alerts/summary
 */
router.get('/summary', async (req, res) => {
    try {
        // Get all alert types in parallel
        const [tradeAlerts] = await Promise.all([
            alertService.checkOpenTradeAlerts()
        ]);
        
        res.json({
            success: true,
            summary: {
                trade_alerts: {
                    count: tradeAlerts.length,
                    major_gains: tradeAlerts.filter(a => a.category === 'MAJOR_GAIN').length,
                    major_losses: tradeAlerts.filter(a => a.category === 'MAJOR_LOSS').length,
                    stale_positions: tradeAlerts.filter(a => a.category === 'STALE_POSITION').length
                }
            },
            alerts: {
                trades: tradeAlerts
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

/**
 * 🔌 WEBSOCKET SUBSCRIPTION for CRITICAL alerts
 * GET /api/alerts/subscribe (WebSocket upgrade)
 */
router.get('/subscribe', (req, res) => {
    res.json({
        message: 'WebSocket endpoint for critical alerts',
        endpoint: 'ws://localhost:8000/alerts/ws',
        usage: 'Connect to receive real-time critical alerts'
    });
});

module.exports = router;
