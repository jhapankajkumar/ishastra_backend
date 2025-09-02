/**
 * 🚨 POSITION ALERTS CRON - AUTOMATED MONITORING
 * 
 * Runs every 15 minutes during trading hours: 11:30 AM - 6:30 PM SG Time
 * Only checks when markets are likely active
 */

const cron = require('node-cron');
const SimpleAlertController = require('../controllers/simpleAlertController');
const EmailAlertService = require('../services/emailAlertService');

class PositionAlertsCron {
    constructor() {
        this.alertController = new SimpleAlertController();
        this.emailService = new EmailAlertService();
        this.isRunning = false;
        this.alertHistory = new Map(); // Track sent alerts to avoid spam
    }

    /**
     * Start position monitoring during trading hours
     */
    start() {
        console.log('🚨 Starting Position Alerts Cron...');

        // Run every 15 minutes from 11:30 AM to 6:30 PM SG Time (Monday-Friday)
        // Cron pattern: */15 11-18 * * 1-5
        // But we need to handle the 11:30 start and 6:30 end specifically
        const alertJob = cron.schedule('*/15 * * * 1-5', async () => {
            // Check if we're in the correct time window (11:30 AM - 6:30 PM SG Time)
            const now = new Date();
            const sgTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Singapore"}));
            const hour = sgTime.getHours();
            const minute = sgTime.getMinutes();
            
            // Only run between 11:30 AM (11:30) and 6:30 PM (18:30) SG time
            const isAfter1130 = hour > 11 || (hour === 11 && minute >= 30);
            const isBefore1830 = hour < 18 || (hour === 18 && minute <= 30);
            
            if (!isAfter1130 || !isBefore1830) {
                // Outside trading hours, skip silently
                return;
            }

            if (this.isRunning) {
                console.log('⏳ Position alerts check already running, skipping...');
                return;
            }

            try {
                this.isRunning = true;
                const currentTime = sgTime.toLocaleString('en-SG');
                console.log(`🚨 Checking position alerts at ${currentTime} SG Time`);
                
                await this.checkAndNotifyAlerts();
                
            } catch (error) {
                console.error('❌ Position alerts check failed:', error);
            } finally {
                this.isRunning = false;
            }
        }, {
            scheduled: false,
            timezone: "Asia/Singapore"
        });

        alertJob.start();
        console.log('📅 Position alerts scheduled: Every 15 min, 11:30 AM - 6:30 PM SG Time (Mon-Fri)');
    }

    /**
     * Check positions and send notifications for new alerts
     */
    async checkAndNotifyAlerts() {
        try {
            const result = await this.alertController.getPositionAlerts();
            
            if (!result.success || result.alerts.length === 0) {
                console.log('📊 No alerts generated');
                return;
            }

            console.log(`🚨 Found ${result.alerts.length} alerts`);

            // Process each alert and send notifications
            for (const alert of result.alerts) {
                await this.processAlert(alert);
            }

        } catch (error) {
            console.error('❌ Error checking alerts:', error);
        }
    }

    /**
     * Process individual alert and send notification
     */
    async processAlert(alert) {
        const alertKey = `${alert.ticker}_${alert.type}`;
        const now = Date.now();
        
        // Check if we already sent this alert recently (avoid spam)
        const lastSent = this.alertHistory.get(alertKey);
        const cooldownPeriod = this.getCooldownPeriod(alert.priority);
        
        if (lastSent && (now - lastSent) < cooldownPeriod) {
            console.log(`⏰ Alert ${alertKey} in cooldown, skipping`);
            return;
        }

        // Send notification
        await this.sendNotification(alert);
        
        // Update alert history
        this.alertHistory.set(alertKey, now);
        
        console.log(`✅ Sent alert: ${alert.type} for ${alert.ticker}`);
    }

    /**
     * Get cooldown period based on alert priority
     */
    getCooldownPeriod(priority) {
        switch (priority) {
            case 'CRITICAL': return 30 * 60 * 1000; // 30 minutes
            case 'HIGH': return 2 * 60 * 60 * 1000; // 2 hours  
            case 'MEDIUM': return 4 * 60 * 60 * 1000; // 4 hours
            case 'LOW': return 24 * 60 * 60 * 1000; // 24 hours
            default: return 60 * 60 * 1000; // 1 hour
        }
    }

    /**
     * Send notification - EMAIL ALERTS
     */
    async sendNotification(alert) {
        try {
            // OPTION 1: Console Log (Always works)
            console.log('🚨 ALERT:', alert.message);
            
            // OPTION 2: Email Alert (MAIN NOTIFICATION METHOD)
            const emailSent = await this.emailService.sendAlert(alert);
            
            if (emailSent) {
                console.log(`📧 Email alert sent for ${alert.ticker}`);
            } else {
                console.log(`⚠️  Email failed for ${alert.ticker} - check email configuration`);
            }
            
            // FUTURE OPTIONS:
            // await this.sendSMSAlert(alert);        // SMS notifications
            // await this.sendWebSocketAlert(alert);  // Real-time web notifications
            // await this.sendPushNotification(alert); // Mobile push notifications
            
        } catch (error) {
            console.error('❌ Failed to send notification:', error);
        }
    }

    /**
     * Store alert in database for frontend to retrieve
     */
    async storeAlertInDB(alert) {
        try {
            const newAlert = await this.db.alert.create({
                data: {
                    ticker: alert.ticker,
                    type: alert.type,
                    priority: alert.priority,
                    message: alert.message,
                    action: alert.action || null,
                    currentPrice: alert.currentPrice || null,
                    entryPrice: alert.entryPrice || null,
                    stopLoss: alert.stopLoss || null,
                    target: alert.target || null,
                    priceChange: alert.priceChange || null
                }
            });
            
            console.log(`💾 Alert stored in DB: ${newAlert.id} - ${alert.message}`);
            return newAlert;
            
        } catch (error) {
            console.error('❌ Failed to store alert in DB:', error);
        }
    }

    /**
     * Manual trigger for testing
     */
    async triggerManual() {
        console.log('🔧 Manual position alerts check triggered');
        await this.checkAndNotifyAlerts();
    }

    /**
     * Stop the cron job
     */
    stop() {
        console.log('🛑 Stopping Position Alerts Cron');
        // Cron jobs are automatically stopped when the process ends
    }
}

module.exports = PositionAlertsCron;
