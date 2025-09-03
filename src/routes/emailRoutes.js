/**
 * 📧 EMAIL ROUTES - TEST AND MANAGEMENT
 */

const express = require('express');
const router = express.Router();
const EmailAlertService = require('../services/emailAlertService');

const emailService = new EmailAlertService();

/**
 * Test email configuration by sending a test email
 * POST /api/email/test
 */
router.post('/test', async (req, res) => {
    try {
        console.log('📧 Testing email configuration...');
        
        const result = await emailService.testEmail();
        console.log('📧 Test email result:', result);
        if (result.success) {
            res.json({
                success: true,
                message: 'Test email sent successfully! Check your inbox.',
                result
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to send test email',
                error: result.message
            });
        }

    } catch (error) {
        console.error('❌ Email test error:', error);
        res.status(500).json({
            success: false,
            message: 'Email test failed',
            error: error.message
        });
    }
});

/**
 * Verify email configuration without sending
 * GET /api/email/verify
 */
router.get('/verify', async (req, res) => {
    try {
        const result = await emailService.verifyConfiguration();
        
        res.json({
            success: result.success,
            message: result.message,
            provider: result.provider,
            configured: result.success
        });

    } catch (error) {
        console.error('❌ Email verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Email verification failed',
            error: error.message
        });
    }
});

/**
 * Send a custom trading alert (for testing)
 * POST /api/email/alert
 * Body: { symbol, type, message, priority, currentPrice }
 */
router.post('/alert', async (req, res) => {
    try {
        const { symbol, type, message, priority = 'MEDIUM', currentPrice } = req.body;
        
        if (!symbol || !type || !message) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: symbol, type, message'
            });
        }

        const alert = {
            symbol,
            type,
            message,
            priority,
            currentPrice,
            timestamp: new Date()
        };

        const result = await emailService.sendAlert(alert);
        
        if (result) {
            res.json({
                success: true,
                message: 'Alert email sent successfully',
                alert
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'Failed to send alert email'
            });
        }

    } catch (error) {
        console.error('❌ Email alert error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send alert email',
            error: error.message
        });
    }
});

module.exports = router;
