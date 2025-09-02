/**
 * SIMPLE ALERT ROUTES - NO COMPLEXITY
 * 
 * ENDPOINTS:
 * 1. Emergency alerts (stop hits, profit targets)
 * 2. Saturday weekly review  
 * 3. Frontend polling alerts (database-stored alerts)
 */

const express = require('express');
const { PrismaClient } = require('@prisma/client');
const SimpleAlertService = require('../services/simpleAlertService');

const router = express.Router();
const db = new PrismaClient();
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
 * GET ACTIVE ALERTS - Frontend polling endpoint
 * GET /api/alerts/active
 */
router.get('/active', async (req, res) => {
  try {
    const alerts = await db.alert.findMany({
      where: {
        isRead: false,
        isDismissed: false
      },
      orderBy: [
        { priority: 'desc' }, // CRITICAL first
        { createdAt: 'desc' }  // Newest first
      ],
      take: 50 // Limit to prevent overload
    });

    // Count by priority for frontend to show urgency
    const summary = {
      critical: alerts.filter(a => a.priority === 'CRITICAL').length,
      high: alerts.filter(a => a.priority === 'HIGH').length,
      medium: alerts.filter(a => a.priority === 'MEDIUM').length,
      low: alerts.filter(a => a.priority === 'LOW').length,
      total: alerts.length
    };

    res.json({
      success: true,
      summary,
      alerts,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to get active alerts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get alerts',
      alerts: []
    });
  }
});

/**
 * MARK ALERT AS READ
 * PUT /api/alerts/:id/read
 */
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    
    const alert = await db.alert.update({
      where: { id },
      data: { 
        isRead: true,
        readAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Alert marked as read',
      alert
    });
  } catch (error) {
    console.error('Failed to mark alert as read:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update alert'
    });
  }
});

/**
 * DISMISS ALERT
 * PUT /api/alerts/:id/dismiss
 */
router.put('/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    
    const alert = await db.alert.update({
      where: { id },
      data: { 
        isDismissed: true,
        dismissedAt: new Date()
      }
    });

    res.json({
      success: true,
      message: 'Alert dismissed',
      alert
    });
  } catch (error) {
    console.error('Failed to dismiss alert:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to dismiss alert'
    });
  }
});

/**
 * CLEAR ALL READ ALERTS
 * DELETE /api/alerts/read
 */
router.delete('/read', async (req, res) => {
  try {
    const result = await db.alert.deleteMany({
      where: { 
        isRead: true 
      }
    });

    res.json({
      success: true,
      message: `Cleared ${result.count} read alerts`,
      deletedCount: result.count
    });
  } catch (error) {
    console.error('Failed to clear read alerts:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to clear alerts'
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
