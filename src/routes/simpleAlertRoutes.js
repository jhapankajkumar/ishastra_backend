/**
 * SIMPLE ALERT ROUTES - NO COMPLEXITY
 * 
 * ONLY 2 ENDPOINTS:
 * 1. Emergency alerts (stop hits, profit targets)
 * 2. Saturday weekly review
 */

const express = require('express');
const SimpleAlertService = require('../services/simpleAlertService');

const router = express.Router();
const simpleAlerts = new SimpleAlertService();

/**
 * Emergency position alerts - ONLY stop hits and profit targets
 * GET /api/alerts/emergency
 */
router.get('/emergency', async (req, res) => {
  try {
    const alerts = await simpleAlerts.checkPositionAlerts();
    
    // Only return ACTIONABLE alerts
    const actionableAlerts = alerts.filter(alert => 
      alert.type === 'STOP_HIT' || 
      alert.type === 'TAKE_PROFITS' || 
      alert.type === 'PARTIAL_PROFITS'
    );
    
    res.json({
      success: true,
      alertType: 'EMERGENCY_ONLY',
      count: actionableAlerts.length,
      alerts: actionableAlerts,
      message: actionableAlerts.length > 0 ? 
        'ACTION REQUIRED' : 'No emergency actions needed',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Emergency alerts error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check emergency alerts',
      alerts: []
    });
  }
});

/**
 * Saturday weekly review - ONLY on weekends
 * GET /api/alerts/weekly
 */
router.get('/weekly', async (req, res) => {
  try {
    const review = await simpleAlerts.weeklyReview();
    
    res.json({
      success: true,
      alertType: 'WEEKLY_REVIEW',
      ...review,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Weekly review error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate weekly review'
    });
  }
});

module.exports = router;
