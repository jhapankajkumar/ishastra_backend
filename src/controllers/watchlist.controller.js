/**
 * 🎯 SIMPLE WATCHLIST CONTROLLER - ONE JOB, DONE RIGHT
 * 
 * NO CONFUSION. NO MULTIPLE METHODS. NO BULLSHIT.
 * Just daily scans and watchlist display.
 */
const prisma = require('../db');
const { fetchCurrentPrice, getTickerAnalysis } = require('../services/comom.service');
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
      const watchlist = await this.watchlistService.getWatchlist(req.user.id);

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
      const stocksUniverse = req.body.stocksUniverse || 'ALL'; // Optional: specify universe (e.g., 'US', 'IN', 'TECH')
      const result = await this.watchlistService.runDailyScan(req.user.id, stocksUniverse);

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
      console.log('🔍 Manual breakout scan triggered via API');
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

  async refreshStock(req, res) {
    try {

      const { symbol } = req.body;
      console.log(`🔄 Refreshing price and analysis for ${symbol} in watchlist`);
      const result = await getTickerAnalysis(symbol);
      if (!result) {
        return res.status(404).json({
          success: false,
          message: `No analysis found for ${symbol}`
        });
      }

      if (result.decision.action !== 'BUY') {
        const deleted = await this.watchlistService.deleteFromWatchlist(req.user.id, symbol.toUpperCase());
      } else if (result.decision.action === 'BUY') {
        const watchlistData = {
          userId: req.user.id,
          symbol: result.symbol,
          currentPrice: result.currentPrice || 0,
          entryPrice: result.currentPrice || 0,
          currency: result.symbol.includes('.NS') ? 'INR' : 'USD',
          market: result.symbol.includes('.NS') ? 'IN' : 'US',

          // Store COMPLETE decision data as JSON strings - SAFELY
          decision: result.decision ? JSON.stringify(result.decision) : null,
          // Store COMPLETE analysis data as JSON strings - SAFELY
          execution: result.execution ? JSON.stringify(result.execution) : null,
        };

        const updated = await prisma.watchlistStock.upsert({
          where: { userId_symbol: { userId: req.user.id, symbol } },
          update: watchlistData,
          create: watchlistData
        });

      }

      res.json({
        success: true,
        message: `${symbol} price and analysis updated in watchlist`,
        result: result
      });

    } catch (error) {
      console.error('Error refreshing watchlist stock price:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to refresh stock price',
        details: error.message
      });
    }
  }


  async deleteFromWatchlist(req, res) {
    try {
      const { symbol } = req.body;
      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Symbol is required'
        });
      }

      const deleted = await this.watchlistService.deleteFromWatchlist(req.user.id, symbol.toUpperCase());

      if (deleted) {
        res.json({
          success: true,
          message: `${symbol.toUpperCase()} removed from watchlist`
        });
      } else {
        res.status(404).json({
          success: false,
          error: `${symbol.toUpperCase()} not found in watchlist`
        });
      }

    } catch (error) {
      console.error('Error deleting from watchlist:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete from watchlist',
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
              where: { userId_symbol: { userId: item.userId, symbol: item.symbol } },
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
