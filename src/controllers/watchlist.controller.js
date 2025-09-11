/**
 * 🎯 SIMPLE WATCHLIST CONTROLLER - ONE JOB, DONE RIGHT
 * 
 * NO CONFUSION. NO MULTIPLE METHODS. NO BULLSHIT.
 * Just daily scans and watchlist display.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { fetchCurrentPrice } = require('../services/comom.service');
const WatchlistService = require('../services/watchlist.service');

class WatchlistController {
    constructor() {
        this.watchlistService = new WatchlistService();
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

    async runBreakoutScan(req, res) {
      try {
          console.log('🔍 Manual breakout scan triggered via API') ;
          const result = await this.watchlistService.runBreakoutScan();
          
          res.json({
              success: true,
              message: 'Breakout scan completed',
              result
          });

      } catch (error) {
          console.error('Error running breakout scan:', error);
          res.status(500).json({
              success: false,
              error: 'Breakout scan failed',
              details: error.message
          });
      }
  }

    // Refresh all watchlist prices (manual endpoint)
    async refreshAllWatchlistPrices(req, res) {
      try {
        const watchlist = await prisma.watchlistStock.findMany();
        let updatedCount = 0;

        const updates = watchlist.map(async (item) => {
          try {
            let currentPrice = item.currentPrice;
            currentPrice = await fetchCurrentPrice(item.symbol);
            const data = {};
            if (currentPrice != null) {
              data.currentPrice = currentPrice;
            }
            if (data.currentPrice != null) {
              await prisma.watchlistStock.update({
                where: { symbol: item.symbol },
                data,
              });
              updatedCount++;
            }
          } catch (err) {
            console.error(`[ERROR] Updating ${item.symbol}:`, err.message);
          }
        });
    
        await Promise.allSettled(updates);
        //console.log(`[CRON] Updated ${updatedCount} investments`);
    
    
        res.json({
          success: true,
          message: `Prices refreshed for ${updatedCount} watchlist items.`
        });
      } catch (error) {
        console.error('Error refreshing watchlist prices:', error);
        if (res?.status) {
          res.status(500).json({
            success: false,
            message: 'Failed to refresh watchlist prices',
            error: error.message
          });
          return;
        }
      }
    };
}

module.exports = WatchlistController;
