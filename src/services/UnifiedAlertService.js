/**
 * 🚨 UNIFIED ALERT SERVICE
 * 
 * Handles both Position Alerts and Watchlist Entry Alerts
 * Provides unified interface for:
 * - Manual checking (API endpoints)
 * - Automated monitoring (cron jobs)
 * - Email notifications
 */

const SimpleAlertService = require('./simpleAlertService');
const EntryTriggerService = require('./EntryTriggerService');
const EmailAlertService = require('./emailAlertService');

class UnifiedAlertService {
    constructor() {
        this.positionAlerts = new SimpleAlertService();
        this.entryTriggers = new EntryTriggerService();
        this.emailService = new EmailAlertService();
    }

    /**
     * CHECK POSITION ALERTS (existing trades)
     * Returns: Stop hits, profit targets, etc.
     */
    async checkPositionAlerts() {
        try {
            console.log('🔍 Checking position alerts...');
            
            const alerts = await this.positionAlerts.checkPositionAlerts();
            
            // Filter only actionable alerts
            const actionableAlerts = alerts.filter(alert => 
                alert.type === 'STOP_HIT' || 
                alert.type === 'TAKE_PROFITS' || 
                alert.type === 'PARTIAL_PROFITS'
            );

            return {
                success: true,
                alertType: 'POSITION_ALERTS',
                count: actionableAlerts.length,
                alerts: actionableAlerts,
                message: actionableAlerts.length > 0 ? 
                    `${actionableAlerts.length} action(s) required on positions` : 
                    'No position alerts',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Position alerts error:', error);
            return {
                success: false,
                alertType: 'POSITION_ALERTS',
                count: 0,
                alerts: [],
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * CHECK WATCHLIST ENTRY ALERTS 
     * Returns: Entry triggers for watchlist stocks
     */
    async checkWatchlistAlerts() {
        try {
            console.log('🔍 Checking watchlist entry triggers...');
            
            const entryTriggers = await this.entryTriggers.checkEntryTriggers();
            
            // Parse the response structure
            const triggerCounts = {
                immediate: entryTriggers.triggered || 0,
                near: 0, // Not implemented yet
                waiting: (entryTriggers.monitored || 0) - (entryTriggers.triggered || 0),
                total: entryTriggers.monitored || 0
            };

            // Format alerts for API response
            const alerts = [];
            if (entryTriggers.alerts && entryTriggers.alerts.length > 0) {
                entryTriggers.alerts.forEach(alertData => {
                    alerts.push({
                        symbol: alertData.symbol,
                        type: 'ENTRY_TRIGGER',
                        message: `Entry conditions met: ${alertData.triggers} trigger(s) activated`,
                        priority: 'HIGH',
                        currentPrice: alertData.price,
                        triggersCount: alertData.triggers,
                        timestamp: new Date()
                    });
                });
            }

            return {
                success: true,
                alertType: 'WATCHLIST_ENTRY_TRIGGERS',
                triggerCounts,
                alerts,
                rawData: entryTriggers, // Include raw data for debugging
                message: triggerCounts.immediate > 0 ? 
                    `${triggerCounts.immediate} immediate entry signal(s) found!` :
                    triggerCounts.total > 0 ?
                    `${triggerCounts.waiting} stock(s) monitored, no triggers yet` :
                    'No stocks being monitored',
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Watchlist alerts error:', error);
            return {
                success: false,
                alertType: 'WATCHLIST_ENTRY_TRIGGERS',
                triggerCounts: { immediate: 0, near: 0, waiting: 0, total: 0 },
                alerts: [],
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * SEND EMAIL ALERTS (for cron jobs)
     * Sends emails for new alerts only
     */
    async sendPositionAlertEmails() {
        try {
            const result = await this.checkPositionAlerts();
            
            if (!result.success || result.alerts.length === 0) {
                console.log('📧 No position alerts to email');
                return { sent: 0, errors: 0 };
            }

            let sent = 0;
            let errors = 0;

            for (const alert of result.alerts) {
                try {
                    await this.emailService.sendAlert(alert);
                    sent++;
                    console.log(`📧 Position alert email sent: ${alert.type} for ${alert.ticker}`);
                } catch (error) {
                    errors++;
                    console.error(`❌ Failed to send position alert email for ${alert.ticker}:`, error.message);
                }
            }

            return { sent, errors, total: result.alerts.length };

        } catch (error) {
            console.error('❌ Position alert email error:', error);
            return { sent: 0, errors: 1 };
        }
    }

    /**
     * SEND WATCHLIST ALERT EMAILS (for cron jobs)
     * Note: EntryTriggerService already handles email sending internally
     */
    async sendWatchlistAlertEmails() {
        // EntryTriggerService.checkEntryTriggers() already sends emails
        // This is just for logging/monitoring
        try {
            const result = await this.entryTriggers.checkEntryTriggers();
            
            const emailsSent = result.alerts ? result.alerts.length : 0;
            console.log(`📧 Watchlist entry trigger emails: ${emailsSent} sent`);
            
            return { 
                sent: emailsSent, 
                errors: 0, 
                monitored: result.monitored || 0,
                triggered: result.triggered || 0
            };

        } catch (error) {
            console.error('❌ Watchlist alert email error:', error);
            return { sent: 0, errors: 1 };
        }
    }

    /**
     * GET ALL ALERTS (combined view for dashboard)
     */
    async getAllAlerts() {
        try {
            const [positionResult, watchlistResult] = await Promise.all([
                this.checkPositionAlerts(),
                this.checkWatchlistAlerts()
            ]);

            return {
                success: true,
                summary: {
                    positionAlerts: positionResult.count,
                    watchlistTriggers: watchlistResult.triggerCounts.immediate,
                    totalMonitored: watchlistResult.triggerCounts.total
                },
                positionAlerts: positionResult,
                watchlistAlerts: watchlistResult,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Get all alerts error:', error);
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
}

module.exports = UnifiedAlertService;
