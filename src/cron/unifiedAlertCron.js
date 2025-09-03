/**
 * 🚨 UNIFIED ALERT CRON - HANDLES ALL TYPES OF ALERTS
 * 
 * Combines both Position Alerts and Watchlist Entry Alerts
 * Runs during trading hours and sends email notifications
 * 
 * SCHEDULE:
 * - Position Alerts: Every 15 minutes (11:30 AM - 6:30 PM SGT)
 * - Watchlist Alerts: Every 15 minutes (9:30 AM - 4:00 PM SGT)  
 */

const cron = require('node-cron');
const moment = require('moment-timezone');
const UnifiedAlertService = require('../services/UnifiedAlertService');

class UnifiedAlertCron {
    constructor() {
        this.alertService = new UnifiedAlertService();
        this.isRunning = false;
        this.alertHistory = new Map(); // Track sent alerts to avoid spam
    }

    /**
     * START UNIFIED ALERT MONITORING
     */
    start() {
        console.log('🚨 Starting Unified Alert Cron...');

        // Run every 15 minutes during market hours
        const alertJob = cron.schedule('*/15 * * * 1-5', async () => {
            await this.runAlertCheck();
        }, {
            timezone: 'Asia/Singapore',
            scheduled: false
        });

        alertJob.start();
        console.log('📅 Unified alerts scheduled: Every 15 min during market hours (Mon-Fri)');
    }

    /**
     * RUN ALERT CHECK WITH TIME VALIDATION
     */
    async runAlertCheck() {
        if (this.isRunning) {
            console.log('⏳ Alert check already running, skipping...');
            return;
        }

        try {
            this.isRunning = true;
            
            const now = moment().tz('Asia/Singapore');
            const currentHour = now.hour();
            const currentMinute = now.minute();
            
            // Check if weekend
            if (now.day() === 0 || now.day() === 6) {
                console.log('📅 Weekend - skipping alert check');
                return;
            }

            // Market hours: 9:30 AM to 4:00 PM Singapore time
            const isMarketHours = (
                (currentHour > 9 || (currentHour === 9 && currentMinute >= 30)) &&
                currentHour < 19
            );

            // Skip on weekends
            const isWeekend = now.day() === 0 || now.day() === 6;

            if (isWeekend) {
                console.log('📅 Weekend - skipping entry trigger check');
                return;
            }

            if (!isMarketHours) {
                console.log(`⏰ Outside market hours (${now.format('HH:mm')} SGT) - skipping entry trigger check`);
                return;
            }

            console.log(`🔍 Alert check started at ${now.format('YYYY-MM-DD HH:mm')} SGT`);

            // Determine which alerts to check based on time
            const checkWatchlist = this.isWatchlistTime(currentHour, currentMinute);
            const checkPositions = this.isPositionTime(currentHour, currentMinute);

            if (!checkWatchlist && !checkPositions) {
                console.log(`⏰ Outside market hours (${now.format('HH:mm')} SGT) - skipping all alerts`);
                return;
            }

            // Run appropriate alert checks
            const results = {};

            if (checkWatchlist) {
                console.log('🎯 Checking watchlist entry triggers...');
                results.watchlist = await this.alertService.sendWatchlistAlertEmails();
            }

            if (checkPositions) {
                console.log('📊 Checking position alerts...');
                results.positions = await this.alertService.sendPositionAlertEmails();
            }

            // Log summary
            this.logResults(results);

        } catch (error) {
            console.error('❌ Unified alert cron error:', error.message);
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Check if within watchlist monitoring time (9:30 AM - 4:00 PM SGT)
     */
    isWatchlistTime(hour, minute) {
        const isAfter930 = hour > 9 || (hour === 9 && minute >= 30);
        const isBefore1600 = hour < 16;
        return isAfter930 && isBefore1600;
    }

    /**
     * Check if within position monitoring time (11:30 AM - 6:30 PM SGT)
     */
    isPositionTime(hour, minute) {
        const isAfter1130 = hour > 11 || (hour === 11 && minute >= 30);
        const isBefore1830 = hour < 18 || (hour === 18 && minute <= 30);
        return isAfter1130 && isBefore1830;
    }

    /**
     * Log alert results summary
     */
    logResults(results) {
        const summary = [];
        
        if (results.watchlist) {
            const w = results.watchlist;
            summary.push(`Watchlist: ${w.sent} emails sent, ${w.monitored} stocks monitored, ${w.triggered} triggered`);
        }
        
        if (results.positions) {
            const p = results.positions;
            summary.push(`Positions: ${p.sent} emails sent, ${p.errors} errors`);
        }

        if (summary.length > 0) {
            console.log('✅ Alert check completed:', summary.join(' | '));
        } else {
            console.log('📭 No alerts processed');
        }
    }

    /**
     * Manual trigger for testing
     */
    async triggerManual() {
        console.log('🔧 Manual unified alert check triggered');
        await this.runAlertCheck();
    }

    /**
     * Stop the cron job
     */
    stop() {
        console.log('🛑 Stopping Unified Alert Cron');
        // Cron jobs are automatically stopped when the process ends
    }
}

module.exports = UnifiedAlertCron;
