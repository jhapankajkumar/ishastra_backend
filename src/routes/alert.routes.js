/**
 * SIMPLE ALERT ROUTES - UNIFIED APPROACH
 * 
 * ENDPOINTS:
 * 1. Position alerts (stop hits, profit targets) - /api/alerts/positions
 * 2. Watchlist entry triggers - /api/alerts/watchlist  
 * 3. Combined dashboard view - /api/alerts/all
 * 4. Test email functionality - /api/alerts/test-email
 * 
 * NOTE: These endpoints RETURN alert data, they do NOT send emails
 * Emails are sent by cron jobs only
 */

const express = require('express');
const SimpleAlertController = require('../controllers/alert.controller');
const EntryTriggerService = require('../services/watchlist.trigger.service');
const EmailAlertService = require('../services/email.service');

const router = express.Router();
const alertController = new SimpleAlertController();
const entryTriggerService = new EntryTriggerService();
const emailService = new EmailAlertService();

/**
 * Position alerts - ONLY stop hits and profit targets
 * GET /api/alerts/positions
 * Returns alert data WITHOUT sending emails
 */
router.get('/positions', async (req, res) => {
  try {
    const result = await alertController.getPositionAlerts();
    res.json(result);
  } catch (error) {
    console.error('Position alerts API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check position alerts',
      alerts: [],
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Watchlist entry triggers - Check BUY signals for entry conditions
 * GET /api/alerts/watchlist
 * Returns alert data WITHOUT sending emails
 */
router.get('/watchlist', async (req, res) => {
  try {
    const result = await alertController.getWatchlistAlerts();
    res.json(result);
  } catch (error) {
    console.error('Watchlist alerts API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check watchlist alerts',
      alerts: [],
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Combined dashboard view - All alerts together
 * GET /api/alerts/all
 */
router.get('/all', async (req, res) => {
  try {
    // Get both position and watchlist alerts using controller methods
    const [positionResult, watchlistResult] = await Promise.all([
      alertController.getPositionAlerts(),
      alertController.getWatchlistAlerts()
    ]);

    const result = {
      success: true,
      summary: {
        positionAlerts: positionResult.alerts ? positionResult.alerts.length : 0,
        watchlistTriggers: watchlistResult.triggerCounts ? watchlistResult.triggerCounts.immediate : 0,
        totalMonitored: watchlistResult.triggerCounts ? watchlistResult.triggerCounts.total : 0
      },
      positionAlerts: positionResult,
      watchlistAlerts: watchlistResult,
      timestamp: new Date().toISOString()
    };

    res.json(result);

  } catch (error) {
    console.error('All alerts API error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get all alerts',
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
