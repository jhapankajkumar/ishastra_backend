/**
 * 🕒 DAILY WATCHLIST CRON JOB - AUTOMATION THAT ACTUALLY WORKS
 * 
 * Runs every day at 9:30 AM IST (market open time)
 * NO COMPLEXITY. JUST WORKS.
 */

const cron = require('node-cron');
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
        cron.schedule('30 9 * * 1-5', async () => {
            console.log('⏰ DAILY WATCHLIST CRON TRIGGERED - 9:30 AM IST');
            
            try {
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
            timezone: "Asia/Kolkata"
        });

        console.log('🕒 Watchlist cron job scheduled for 9:30 AM IST (Mon-Fri)');
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
