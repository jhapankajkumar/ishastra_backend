/**
 * 🎯 SIMPLE WATCHLIST CONTROLLER - ONE JOB, DONE RIGHT
 * 
 * NO CONFUSION. NO MULTIPLE METHODS. NO BULLSHIT.
 * Just daily scans and watchlist display.
 */

const SimpleWatchlistService = require('../services/simpleWatchlistService');

class SimpleWatchlistController {
    constructor() {
        this.watchlistService = new SimpleWatchlistService();
    }

    /**
     * GET /api/watchlist - Display current watchlist
     */
    async getWatchlist(req, res) {
        try {
            const watchlist = await this.watchlistService.getWatchlist();
            
            res.json({
                success: true,
                count: watchlist.length,
                stocks: watchlist,
                lastScan: new Date() // You can track this in DB if needed
            });

        } catch (error) {
            console.error('Error fetching watchlist:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch watchlist'
            });
        }
    }

    /**
     * POST /api/watchlist/daily-scan - Run the daily scan manually
     */
    async runDailyScan(req, res) {
        try {
            console.log('🔍 Manual daily scan triggered via API');
            
            const result = await this.watchlistService.runDailyScan();
            
            res.json({
                success: true,
                message: 'Daily scan completed',
                result
            });

        } catch (error) {
            console.error('Error running daily scan:', error);
            res.status(500).json({
                success: false,
                error: 'Daily scan failed',
                details: error.message
            });
        }
    }
}

module.exports = SimpleWatchlistController;
