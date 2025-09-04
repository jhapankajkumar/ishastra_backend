/**
 * 🕒 DAILY WATCHLIST CRON JOB - AUTOMATION THAT ACTUALLY WORKS
 * 
 * Runs every day at 9:30 AM IST (market open time)
 * NO COMPLEXITY. JUST WORKS.
 */

const cron = require('node-cron');
const moment = require('moment-timezone');
const SimpleWatchlistService = require('../services/simpleWatchlistService');

class WatchlistCron {
    constructor() {
        this.watchlistService = new SimpleWatchlistService();
    }

    /**
     * Start the daily cron job
     */
    start() {
        // Run daily at 9:30 AM IST (Monday to Friday)
        // Cron format: minute hour day month dayOfWeek
        // 9:30 AM IST = 4:00 AM UTC (approximately)
        cron.schedule('03 10 * * 1-5', async () => {
            console.log('⏰ DAILY WATCHLIST CRON TRIGGERED - 9:30 AM SGT');

            try {

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
                    (currentHour > 9 || (currentHour === 9 )) &&
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

                const result = await this.watchlistService.runDailyScan();

                console.log('✅ DAILY WATCHLIST SCAN COMPLETED:', {
                    scanned: result.scanned,
                    buySignals: result.buySignals,
                    watchlistSize: result.watchlistSize,
                    avgConfidence: `${(result.avgConfidence * 100).toFixed(1)}%`
                });

            } catch (error) {
                console.error('❌ DAILY WATCHLIST CRON FAILED:', error);

                // You could add email/SMS alerts here if needed
                // But keep it simple - just log the error
            }
        }, {
            timezone: "Asia/Singapore"
        });

        console.log('🕒 Watchlist cron job scheduled for 9:30 AM SGT (Mon-Fri)');
    }

    /**
     * Manual trigger for testing
     */
    async triggerNow() {
        console.log('🔧 MANUAL TRIGGER - Running daily scan now...');
        return await this.watchlistService.runDailyScan();
    }
}

module.exports = WatchlistCron;
