/**
 * 📊 POSITION ALERT ROUTES - Single Focused Endpoint
 * Complete position management for owned stocks only
 */

const express = require('express');
const AlertService = require('../services/alertService');
const AutomatedAlertController = require('../controllers/automatedAlert.controller');

const router = express.Router();
const alertService = new AlertService();
const automatedAlerts = new AutomatedAlertController();

/**
 * 📊 POSITION ALERTS - Complete Position Management Dashboard
 * GET /api/alerts/positions
 * 
 * Returns comprehensive alerts for your open trades:
 * - � Trade Performance: "COFORGE up 5.17% - consider profit taking"
 * - 🚨 Risk Management: "RENUKA down 1.43% - monitor closely" 
 * - 🔄 Signal Changes: "ASHIANA signal confidence increased"
 * - 💰 Financial Impact: Real P&L and recommendations
 */
router.get('/positions', async (req, res) => {
    try {
        // Get comprehensive trade performance alerts (P&L, risks, opportunities)
        const tradeAlerts = await alertService.checkOpenTradeAlerts();
        
        // Get technical signal changes for owned stocks
        const positionSignalAlerts = await automatedAlerts.getPositionSignalAlerts();
        
        // Combine both types for complete position dashboard
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
            },
            timestamp: new Date().toISOString(),
            message: 'Complete position management dashboard'
        });
    } catch (error) {
        console.error('Position alerts error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Failed to generate position alerts',
            count: 0,
            alerts: []
        });
    }
});

module.exports = router;
